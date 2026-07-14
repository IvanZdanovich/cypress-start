#!/usr/bin/env node
/**
 * Collect Test Results
 *
 * Reads mochawesome JSON reports from the separate-reports directory,
 * extracts per-test outcomes, and appends a single run entry to the
 * persistent JSONL ledger on the orphan `test-results` branch.
 *
 * Runs only in CI (process.env.CI === 'true'). Local runs are skipped
 * to keep the ledger free of non-reproducible local data.
 *
 * The ledger lives on a dedicated orphan branch so it never touches
 * the working tree or protected branches.
 *
 * Usage (CI):
 *   node scripts/collect-test-results.js [--reports-dir <path>]
 *
 * Defaults:
 *   --reports-dir  cypress/reports/separate-reports
 */

const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');

const WORKSPACE = process.cwd();
const RESULTS_BRANCH = 'test-results';
const LEDGER_FILENAME = 'test-run-history.jsonl';
const PUSH_MAX_RETRIES = 3;
const DEFAULT_MAX_RUNS = 100;

const args = process.argv.slice(2);

function argValue(flag, fallback) {
  const idx = args.indexOf(flag);
  return idx !== -1 && idx + 1 < args.length ? args[idx + 1] : fallback;
}

const REPORTS_DIR = path.resolve(WORKSPACE, argValue('--reports-dir', 'cypress/reports/separate-reports'));

/**
 * Rolling-window retention: keep at most this many of the most recent runs in
 * the ledger. The newest run plus the previous (MAX_RUNS - 1) are retained;
 * older lines are dropped on every append. A value <= 0 disables retention
 * (unbounded ledger). Configurable via --max-runs flag or RESULTS_MAX_RUNS env.
 */
const MAX_RUNS = (() => {
  const parsed = parseInt(argValue('--max-runs', process.env.RESULTS_MAX_RUNS || String(DEFAULT_MAX_RUNS)), 10);
  return Number.isNaN(parsed) ? DEFAULT_MAX_RUNS : parsed;
})();

/**
 * Run a git command via execFileSync, returning stdout. Returns null on failure.
 * Avoids shell-injection: args are passed as an array, never interpolated.
 */
function git(args) {
  try {
    // Capture stderr (stdio pipe) rather than letting it inherit the parent's:
    // this helper intentionally swallows failures and returns null, so probes
    // against a not-yet-created branch (fetch/show/rev-parse on first run)
    // shouldn't spill benign `fatal:` lines into the build log. Genuine push
    // failures are surfaced separately by appendToLedger.
    return execFileSync('git', args, {
      cwd: WORKSPACE,
      encoding: 'utf8',
      stdio: ['pipe', 'pipe', 'pipe'],
    }).trim();
  } catch {
    return null;
  }
}

/**
 * Read git metadata for the current HEAD.
 */
function gitMeta() {
  return {
    branch: git(['rev-parse', '--abbrev-ref', 'HEAD']) || 'unknown',
    commit: git(['rev-parse', '--short', 'HEAD']) || 'unknown',
  };
}

/**
 * Recursively extract test entries from mochawesome suite objects,
 * tracking the suite path (describe/context titles) for each test.
 */
function extractTests(suite, suitePath = [], acc = []) {
  const currentPath = suite.title ? [...suitePath, suite.title] : suitePath;

  if (suite.tests) {
    for (const test of suite.tests) {
      acc.push({
        context: currentPath,
        it: test.title || '',
        fullTitle: test.fullTitle || '',
        state: test.state || (test.pending ? 'pending' : 'unknown'),
        duration: test.duration || 0,
        err: test.err && test.err.message ? test.err.message : null,
      });
    }
  }
  if (suite.suites) {
    for (const child of suite.suites) {
      extractTests(child, currentPath, acc);
    }
  }
  return acc;
}

/**
 * Parse a single mochawesome JSON report file.
 */
function parseReport(filePath) {
  try {
    const raw = fs.readFileSync(filePath, 'utf8');
    const report = JSON.parse(raw);

    const tests = [];
    const specFile = report.results?.[0]?.file || report.results?.[0]?.fullFile || path.basename(filePath);

    if (report.results) {
      for (const result of report.results) {
        if (result.suites) {
          for (const suite of result.suites) {
            extractTests(suite, [], tests);
          }
        }
      }
    }

    // mochawesome's raw stats are unreliable under Cypress test retries: the
    // reporter derives `stats.failures` via an internal subtraction that can go
    // negative (a retried test counted as both an attempt and a final pass).
    // Clamp each raw count to >= 0 and DERIVE failures the same way the
    // pipeline's pass-rate gate does — failed = registered - passed - pending -
    // skipped — so the ledger and the gate always agree.
    const total = Math.max(0, report.stats?.testsRegistered || 0);
    const passed = Math.max(0, report.stats?.passes || 0);
    const pending = Math.max(0, report.stats?.pending || 0);
    const skipped = Math.max(0, report.stats?.skipped || 0);
    const failed = Math.max(0, total - passed - pending - skipped);

    return {
      file: specFile,
      stats: {
        total,
        passed,
        failed,
        pending,
        skipped,
        duration: Math.max(0, report.stats?.duration || 0),
      },
      tests,
    };
  } catch (err) {
    console.error(`  Skipping ${path.basename(filePath)}: ${err.message}`);
    return null;
  }
}

/**
 * Read the existing ledger content directly from the remote orphan branch.
 * Returns empty string if the branch or file doesn't exist yet.
 */
function readLedgerFromBranch() {
  git(['fetch', 'origin', RESULTS_BRANCH]);
  return git(['show', `origin/${RESULTS_BRANCH}:${LEDGER_FILENAME}`]) || '';
}

/**
 * Resolve a unique per-execution build identifier from the CI environment.
 *
 * Uniqueness must survive two scenarios that otherwise collide:
 *   1. Two distinct executions of the same commit/env (e.g. a PR run and the
 *      daily scheduled run landing in the same minute).
 *   2. A re-run of the same pipeline. Providers reuse the base build id across
 *      re-runs, so the *attempt* number is folded in to keep each re-run
 *      distinct — repeated executions are precisely the flaky-test signal.
 *
 * Returns an empty string only when no CI build id is exposed at all, in which
 * case resolveRunId() falls back to a high-entropy timestamp.
 */
function ciBuildId() {
  const attempt = (base, n) => (base ? `${base}-${n || '1'}` : '');

  return (
    attempt(process.env.BUILD_BUILDID, process.env.SYSTEM_JOBATTEMPT) || // Azure DevOps
    attempt(process.env.GITHUB_RUN_ID, process.env.GITHUB_RUN_ATTEMPT) || // GitHub Actions
    process.env.CI_PIPELINE_ID || // GitLab CI
    process.env.CIRCLE_WORKFLOW_ID || // CircleCI
    process.env.BUILD_NUMBER || // Jenkins
    ''
  );
}

/**
 * Build the per-execution runId used for ledger deduplication.
 *
 * The runId must be identical across retries of THIS collection process (so a
 * retried step never double-records) yet distinct across separate executions
 * (so no real run is ever dropped as a false duplicate).
 *
 * Precedence:
 *   1. RESULTS_RUN_ID — explicit override; the single source of truth when CI
 *      can inject a guaranteed-unique, retry-stable id.
 *   2. CI build id — unique per execution and stable across step retries, so it,
 *      not the timestamp, guarantees uniqueness.
 *   3. No build id — fall back to a millisecond-precision timestamp plus process
 *      id so two distinct executions on the same commit/env cannot collide.
 */
function resolveRunId({ commit, env, timestamp }) {
  if (process.env.RESULTS_RUN_ID) return process.env.RESULTS_RUN_ID;

  const buildId = ciBuildId();
  if (buildId) return `${timestamp.slice(0, 10)}-${commit}-${env}-${buildId}`;

  const stamp = timestamp.replace(/[-:.TZ]/g, ''); // YYYYMMDDHHMMSSmmm (millis kept for entropy)
  return `${stamp}-${commit}-${env}-p${process.pid}`;
}

/**
 * Check whether any ledger entry already carries this runId.
 *
 * Dedup is keyed on the per-execution runId — NOT on commit + env — so that
 * repeated runs of the same commit (e.g. daily scheduled runs against an
 * unchanged main, or manual re-runs) are each recorded. Those repeated
 * executions are exactly the signal flaky-test detection depends on.
 */
function isDuplicate(ledgerContent, runId) {
  const lines = ledgerContent.split('\n').filter(Boolean);
  for (const line of lines) {
    try {
      if (JSON.parse(line).runId === runId) return true;
    } catch {
      /* skip malformed line */
    }
  }
  return false;
}

/**
 * Apply rolling-window retention: keep only the most recent MAX_RUNS lines.
 * Returns the retained lines together with the number of dropped lines so the
 * caller can report on pruning. Retention is disabled when MAX_RUNS <= 0.
 */
function applyRetention(lines) {
  if (MAX_RUNS <= 0 || lines.length <= MAX_RUNS) {
    return { retained: lines, dropped: 0 };
  }
  return { retained: lines.slice(-MAX_RUNS), dropped: lines.length - MAX_RUNS };
}

/**
 * Builds a git blob → tree → orphan commit and pushes it to RESULTS_BRANCH.
 * Extracted so that the throws propagate up to the retry-loop catch in
 * appendToLedger rather than being caught in the same try block (which would
 * trigger an "exception caught locally" IDE warning).
 *
 * @param {string} tmpFile   - Path to the file whose content becomes the ledger blob.
 * @param {string} message   - Commit message for the orphan commit.
 * @returns {string} The full SHA of the newly created commit.
 */
function buildAndPushCommit(tmpFile, message) {
  const blobSha = git(['hash-object', '-w', tmpFile]);
  if (!blobSha) throw new Error('Failed to create blob');

  const treeInput = `100644 blob ${blobSha}\t${LEDGER_FILENAME}\n`;
  const treeSha = execFileSync('git', ['mktree'], {
    cwd: WORKSPACE,
    encoding: 'utf8',
    input: treeInput,
    stdio: ['pipe', 'pipe', 'pipe'],
  }).trim();

  const parentSha = git(['rev-parse', `origin/${RESULTS_BRANCH}`]);

  // Orphan commit (no -p parent) keeps the branch at a single commit.
  const commitSha = git(['commit-tree', treeSha, '-m', message]);
  if (!commitSha) throw new Error('Failed to create commit');

  // Replace the branch tip with the new orphan commit. force-with-lease is a
  // compare-and-swap against the fetched tip, so concurrent pushes are
  // rejected (then retried) instead of silently overwritten. The lease is
  // only needed when the branch already exists.
  const pushArgs = ['push', 'origin', `${commitSha}:refs/heads/${RESULTS_BRANCH}`];
  if (parentSha) {
    pushArgs.push(`--force-with-lease=refs/heads/${RESULTS_BRANCH}:${parentSha}`);
  }

  execFileSync('git', pushArgs, {
    cwd: WORKSPACE,
    encoding: 'utf8',
    stdio: ['pipe', 'pipe', 'pipe'],
  });

  return commitSha;
}

/**
 * Append newEntryLine to the orphan ledger branch.
 *
 * The branch is kept as a SINGLE rolling orphan commit (no parent chain), so
 * commit history is permanently bounded to one commit no matter how many runs
 * accumulate. No data is lost: the ledger file already holds the last MAX_RUNS
 * runs, and each entry is self-describing (runId, timestamp, commit, buildId).
 *
 * Concurrency is preserved via `--force-with-lease`, a compare-and-swap on the
 * remote ref: the push only succeeds if the branch tip still matches the value
 * we just fetched. If a parallel pipeline pushed in between, the lease is
 * rejected and the retry loop re-fetches, re-applies retention, and rebuilds.
 *
 * Retries up to PUSH_MAX_RETRIES times. On push failure after all retries, logs
 * a warning but does NOT exit — the test verdict must not depend on ledger
 * collection success.
 */
function appendToLedger(newEntryLine, message) {
  const tmpFile = path.join(WORKSPACE, '.tmp-ledger-content');
  const newEntry = JSON.parse(newEntryLine);

  for (let attempt = 1; attempt <= PUSH_MAX_RETRIES; attempt++) {
    git(['fetch', 'origin', RESULTS_BRANCH]);
    const existing = git(['show', `origin/${RESULTS_BRANCH}:${LEDGER_FILENAME}`]) || '';

    // Guard: another parallel stream may have already pushed this run
    if (isDuplicate(existing, newEntry.runId)) {
      console.log('  Entry already pushed by a parallel stream. Skipping.');
      return true;
    }

    const existingLines = existing.split('\n').filter(Boolean);
    existingLines.push(newEntryLine);
    const { retained, dropped } = applyRetention(existingLines);
    if (dropped > 0) {
      console.log(`  Retention: keeping last ${MAX_RUNS} run(s), pruning ${dropped} older ${dropped === 1 ? 'entry' : 'entries'}.`);
    }
    const updatedContent = retained.join('\n') + '\n';
    fs.writeFileSync(tmpFile, updatedContent);

    try {
      const commitSha = buildAndPushCommit(tmpFile, message);
      console.log(`  Pushed to ${RESULTS_BRANCH} (${commitSha.slice(0, 7)}, single-commit, attempt ${attempt})`);
      return true;
    } catch (err) {
      if (attempt < PUSH_MAX_RETRIES) {
        console.log(`  Push failed on attempt ${attempt}/${PUSH_MAX_RETRIES} (${err.message}); retrying…`);
      } else {
        console.warn(`  WARNING: failed to push ledger after ${PUSH_MAX_RETRIES} attempts: ${err.message}`);
        console.warn('  Results not recorded. Continuing without failing the build.');
      }
    } finally {
      if (fs.existsSync(tmpFile)) fs.unlinkSync(tmpFile);
    }
  }

  return false;
}

function main() {
  if (process.env.CI !== 'true') {
    console.log('Skipping results collection: not a CI run (CI !== "true").');
    return;
  }

  console.log('Collecting test results...');
  console.log(`  Reports dir: ${REPORTS_DIR}`);
  console.log(`  Target branch: ${RESULTS_BRANCH}`);
  console.log(`  Retention: ${MAX_RUNS > 0 ? `last ${MAX_RUNS} run(s)` : 'unbounded'}`);

  // Collection is auxiliary telemetry gated by `always()` in CI: it runs even
  // when the test step produced no reports (crashed early, ran elsewhere, or
  // was skipped). A missing report set means "nothing to record", not a build
  // failure — mirror the non-blocking contract of appendToLedger and exit 0.
  if (!fs.existsSync(REPORTS_DIR)) {
    console.warn(`  WARNING: reports directory not found: ${REPORTS_DIR}`);
    console.warn('  Nothing to collect (tests produced no mochawesome reports). Skipping without failing the build.');
    return;
  }

  const reportFiles = fs.readdirSync(REPORTS_DIR).filter((f) => f.endsWith('.json'));

  if (reportFiles.length === 0) {
    console.warn('  WARNING: no JSON report files found in reports directory.');
    console.warn('  Nothing to collect. Skipping without failing the build.');
    return;
  }

  console.log(`  Found ${reportFiles.length} report file(s)`);

  const env = process.env.TARGET_ENV || 'unknown';
  const { branch, commit } = gitMeta();
  const buildId = ciBuildId();
  const timestamp = new Date().toISOString();
  const runId = resolveRunId({ commit, env, timestamp });

  const existingLedger = readLedgerFromBranch();

  if (isDuplicate(existingLedger, runId)) {
    console.log(`  Run ${runId} already recorded. Skipping.`);
    return;
  }

  const aggregatedStats = { total: 0, passed: 0, failed: 0, pending: 0, skipped: 0, duration: 0 };
  const failures = [];
  let specCount = 0;

  for (const file of reportFiles) {
    const parsed = parseReport(path.join(REPORTS_DIR, file));
    if (!parsed) continue;

    specCount++;
    aggregatedStats.total += parsed.stats.total;
    aggregatedStats.passed += parsed.stats.passed;
    aggregatedStats.failed += parsed.stats.failed;
    aggregatedStats.pending += parsed.stats.pending;
    aggregatedStats.skipped += parsed.stats.skipped;
    aggregatedStats.duration += parsed.stats.duration;

    const firstFailure = parsed.tests.find((t) => t.state === 'failed');
    if (firstFailure) {
      failures.push({
        file: parsed.file,
        context: firstFailure.context,
        it: firstFailure.it,
        duration: firstFailure.duration,
        error: firstFailure.err,
      });
    }
  }

  const entry = {
    runId,
    timestamp,
    branch,
    commit,
    buildId,
    env,
    specFiles: specCount,
    stats: aggregatedStats,
    failures,
  };

  const newEntryLine = JSON.stringify(entry);
  const commitMsg = `chore: collect results ${runId}`;

  appendToLedger(newEntryLine, commitMsg);

  console.log('');
  console.log(`  Run recorded: ${runId}`);
  console.log(`  Specs:   ${specCount}`);
  console.log(`  Total:   ${aggregatedStats.total}`);
  console.log(`  Passed:  ${aggregatedStats.passed}`);
  console.log(`  Failed:  ${aggregatedStats.failed}`);
  console.log(`  Pending: ${aggregatedStats.pending}`);
  if (failures.length > 0) {
    console.log(`  First failures (${failures.length} spec(s)):`);
    for (const f of failures) {
      console.log(`    - ${f.file}`);
      console.log(`      context: ${f.context.join(' > ')}`);
      console.log(`      it: ${f.it}`);
      if (f.error) console.log(`      error: ${f.error.slice(0, 120)}`);
    }
  }
}

main();
