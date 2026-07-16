const { ESLint } = require('eslint');
const { spawnSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const nodeBinDir = path.dirname(process.execPath);
const systemPaths = (process.env.PATH || '').split(path.delimiter).filter((p) => p && !p.includes('node_modules'));
const sanitizedEnv = { ...process.env, PATH: [nodeBinDir, ...systemPaths].join(path.delimiter) };

/**
 * Resolve an executable to an absolute path by probing well-known, trusted
 * install locations. Falls back to the bare command name (which is then looked
 * up via the explicitly-sanitized PATH in `sanitizedEnv`).
 *
 * Using an absolute path mitigates SonarQube hotspot javascript:S4036 by
 * removing the dependency on PATH lookup for the spawned binary.
 */
function resolveExecutable(name) {
  const exeName = process.platform === 'win32' ? `${name}.exe` : name;
  const candidates =
    process.platform === 'win32'
      ? [`C:\\Program Files\\Git\\cmd\\${exeName}`, `C:\\Program Files\\Git\\bin\\${exeName}`, `C:\\Program Files (x86)\\Git\\cmd\\${exeName}`]
      : ['/usr/bin', '/usr/local/bin', '/opt/homebrew/bin', '/bin'].map((dir) => path.join(dir, exeName));
  for (const candidate of candidates) {
    if (fs.existsSync(candidate)) return candidate;
  }
  return name;
}

const gitExecutable = resolveExecutable('git');
const nodeExecutable = process.execPath;

/**
 * Pre-commit unified ESLint check
 *
 * Single-pass workflow:
 *   1. Auto-fix ESLint issues
 *   2. Write fixes to disk and re-stage fixed files
 *   3. Display full stylish output (clickable file:line references)
 *   4. Check warning/error ratios against thresholds
 *   5. Auto-tighten thresholds when quality improves
 *
 * Usage:
 *   node scripts/pre-commit-lint.js        # git hook / npm run precommit:check
 *   npm run lint:check                     # same, manual trigger
 */

const thresholdsFilePath = path.join(__dirname, 'thresholds.json');

function readThresholds() {
  try {
    return JSON.parse(fs.readFileSync(thresholdsFilePath, 'utf8'));
  } catch {
    return { warningThresholdInPercents: 0.01, errorThresholdInPercents: 0.01 };
  }
}

function updateThresholds(warningThreshold, errorThreshold) {
  try {
    fs.writeFileSync(thresholdsFilePath, JSON.stringify({ warningThresholdInPercents: warningThreshold, errorThresholdInPercents: errorThreshold }, null, 2), 'utf8');
    console.log(`Thresholds tightened: warnings ${warningThreshold}%, errors ${errorThreshold}%`);
  } catch (error) {
    console.error(`Failed to update thresholds: ${error.message}`);
  }
}

function countLinesOfCode(files) {
  let total = 0;
  for (const file of files) {
    if (fs.existsSync(file)) {
      total += fs.readFileSync(file, 'utf8').split(/\r\n|\r|\n/).length;
    }
  }
  return total;
}

function getRepoRoot() {
  const result = spawnSync(gitExecutable, ['rev-parse', '--show-toplevel'], { encoding: 'utf8', env: sanitizedEnv });
  if (result.error || result.status !== 0) {
    console.error(`git rev-parse failed: ${result.stderr || result.error?.message}`);
    return process.cwd();
  }
  return result.stdout.trim();
}

/**
 * Returns absolute paths of JS/TS files that are currently staged (index),
 * filtered to only those that exist on disk and are not in ignored directories.
 * Using staged files (--cached) instead of all tracked files keeps the hook
 * fast and prevents accidentally staging changes the user never intended to commit.
 */
function getStagedJsFiles(repoRoot) {
  const result = spawnSync(gitExecutable, ['diff', '--cached', '--name-only', '--diff-filter=ACM'], { encoding: 'utf8', cwd: repoRoot, env: sanitizedEnv });
  if (result.error) {
    console.error(`git diff --cached failed: ${result.error.message}`);
    return [];
  }
  return result.stdout
    .trim()
    .split('\n')
    .filter((f) => f.length > 0 && /\.(js|jsx|ts|tsx)$/.test(f) && !f.endsWith('.d.ts'))
    .filter((f) => !/^(node_modules|cypress\/reports|dist|build)\//.test(f))
    .map((f) => path.join(repoRoot, f))
    .filter((f) => fs.existsSync(f));
}

/**
 * Run a sync check (colours or localization) in --check mode.
 * `checkArgs` are the args that run the check; `fixCommand` is shown on failure.
 * Prints its output inline and returns true if it passed.
 */
function runSyncCheck(scriptPath, checkArgs, fixCommand, label) {
  console.log(`\nRunning ${label} sync check...`);
  const result = spawnSync(nodeExecutable, [scriptPath, ...checkArgs], { encoding: 'utf8', cwd: process.cwd(), env: sanitizedEnv });
  if (result.stdout) process.stdout.write(result.stdout);
  if (result.stderr) process.stderr.write(result.stderr);
  const passed = result.status === 0;
  if (!passed) {
    console.error(`\nFAIL ${label} sync check failed — run \`${fixCommand}\` to auto-fix.\n`);
  }
  return passed;
}

async function run() {
  // ── Step 0: File-sync checks (colours & localization) ────────────────────
  const coloursScript = path.join(__dirname, 'colours.js');
  const l10nScript = path.join(__dirname, 'l10n.js');
  const coloursPassed = runSyncCheck(coloursScript, ['sync', '--check'], `node ${path.relative(process.cwd(), coloursScript)} sync`, 'Colours');
  const l10nPassed = runSyncCheck(l10nScript, ['sync', '--check'], `node ${path.relative(process.cwd(), l10nScript)} sync`, 'Localization');
  if (!coloursPassed || !l10nPassed) process.exit(1);

  // ── Step 1: Collect staged files only ────────────────────────────────────
  const repoRoot = getRepoRoot();
  const files = getStagedJsFiles(repoRoot);
  if (files.length === 0) {
    console.log('\nNo staged JS/TS files to lint.');
    process.exit(0);
  }

  console.log(`\nRunning ESLint with auto-fix on ${files.length} staged file(s)...`);
  console.log(`   (Fixable issues are corrected automatically and re-staged.)\n`);

  // ── Step 2: ESLint with fix — single pass ─────────────────────────────────
  const eslint = new ESLint({ fix: true });
  const results = await eslint.lintFiles(files);

  // ── Step 3: Write fixes to disk ───────────────────────────────────────────
  await ESLint.outputFixes(results);

  // ── Step 4: Re-stage auto-fixed files so fixes are included in the commit ─
  // ESLint returns absolute paths; convert to repo-relative before passing to
  // git add to avoid failures with absolute paths and Windows path separators.
  // Use `git add --` to prevent pathspec ambiguity with file names that look
  // like flags or refs.
  const fixedFiles = results.filter((r) => r.output !== undefined).map((r) => path.relative(repoRoot, r.filePath));
  if (fixedFiles.length > 0) {
    console.log(`Auto-fixed ${fixedFiles.length} file(s) — re-staging\n`);
    spawnSync(gitExecutable, ['add', '--', ...fixedFiles], { stdio: 'inherit', cwd: repoRoot, env: sanitizedEnv });
  }

  // ── Step 5: Full stylish output with clickable file:line references ────────
  const formatter = await eslint.loadFormatter('stylish');
  const formattedOutput = await formatter.format(results);
  if (formattedOutput) {
    console.log(formattedOutput);
  }

  // ── Step 6: Calculate ratios ──────────────────────────────────────────────
  // Ratios are computed over staged files only (not the full repo).
  // countLinesOfCode reads post-fix content (ESLint.outputFixes has already
  // written fixes to disk), and results.warningCount / errorCount also reflect
  // the post-fix state — so numerator and denominator are consistent.
  // Formula: (issues / total staged-file lines) × 100, rounded to 2 decimals.
  const totalLines = countLinesOfCode(files);
  let totalWarnings = 0;
  let totalErrors = 0;
  for (const r of results) {
    totalWarnings += r.warningCount;
    totalErrors += r.errorCount;
  }

  if (totalLines === 0) {
    console.log('No lines to evaluate.');
    process.exit(0);
  }

  const warningRatio = parseFloat(((totalWarnings / totalLines) * 100).toFixed(2));
  const errorRatio = parseFloat(((totalErrors / totalLines) * 100).toFixed(2));
  const { warningThresholdInPercents, errorThresholdInPercents } = readThresholds();

  console.log(`${totalWarnings} warning(s), ${totalErrors} error(s) across ${totalLines} lines (staged files only)`);
  console.log(`   Warning ratio: ${warningRatio}%  (threshold: ${warningThresholdInPercents}%)`);
  console.log(`   Error ratio:   ${errorRatio}%  (threshold: ${errorThresholdInPercents}%)`);
  console.log(`   Formula: issues ÷ staged-file lines × 100`);

  // ── Step 7: Check thresholds ──────────────────────────────────────────────
  const warningExceeded = warningRatio > parseFloat(warningThresholdInPercents);
  const errorExceeded = errorRatio > parseFloat(errorThresholdInPercents);

  if (warningExceeded || errorExceeded) {
    console.log('\nFAIL Lint ratios exceed thresholds:');
    if (warningExceeded) console.log(`   Warning ratio too high: ${warningRatio}% > ${warningThresholdInPercents}%`);
    if (errorExceeded) console.log(`   Error ratio too high:   ${errorRatio}% > ${errorThresholdInPercents}%`);
    console.log('\nAuto-fix was already applied — remaining issues need manual attention:');
    console.log('   1. Fix the issue(s) shown above in the file(s) listed.');
    console.log('   2. Run:  npm run lint      → re-apply auto-fix and review');
    console.log('   3. Run:  git add .  &&  git commit -m "your message"');
    console.log('\n   Emergency bypass (fix afterward): git commit --no-verify -m "your message"\n');
    process.exit(1);
  }

  // ── Step 8: Auto-tighten thresholds if quality improved ───────────────────
  const newWarning = Math.min(warningRatio, parseFloat(warningThresholdInPercents));
  const newError = Math.min(errorRatio, parseFloat(errorThresholdInPercents));
  if (newWarning < parseFloat(warningThresholdInPercents) || newError < parseFloat(errorThresholdInPercents)) {
    updateThresholds(newWarning, newError);
    // Stage the updated thresholds file so the tightened values are captured in
    // the same commit that earned the improvement, leaving no dirty working tree.
    const relThresholdsPath = path.relative(repoRoot, thresholdsFilePath);
    spawnSync(gitExecutable, ['add', '--', relThresholdsPath], { stdio: 'inherit', cwd: repoRoot, env: sanitizedEnv });
  }

  console.log('\nPre-commit checks passed.\n');
  process.exit(0);
}

run().catch((error) => {
  console.error(`\nFAIL Unexpected error: ${error.message}`);
  process.exit(1);
});
