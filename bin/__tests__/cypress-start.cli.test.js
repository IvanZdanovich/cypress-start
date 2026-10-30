'use strict';

/**
 * CLI integration tests
 *
 * Each test spawns `node bin/cypress-start.js` as a real child process and
 * pipes answers through stdin. A local bare-minimum git repository acts as the
 * template (CYPRESS_START_TEMPLATE_URL) so no network calls are made and
 * `npm install` finishes in milliseconds (zero devDependencies).
 *
 * Stdin is written one line at a time with a small inter-line delay so that
 * Node.js readline can register the next `question()` callback before the next
 * answer arrives.  Sending all lines in a single chunk causes readline to fire
 * every 'line' event before subsequent callbacks are set up, which silently
 * drops answers.
 */

const test = require('node:test');
const assert = require('node:assert/strict');
const { spawn, spawnSync } = require('child_process');
const fs = require('fs');
const os = require('os');
const path = require('path');

const { readManifest, writeManifest, OPTIONAL_MODULES } = require('../cypress-start.js');

const BIN = path.resolve(__dirname, '..', 'cypress-start.js');

// ---------------------------------------------------------------------------
// helpers
// ---------------------------------------------------------------------------

function makeTmpDir() {
  return fs.mkdtempSync(path.join(os.tmpdir(), 'cps-cli-'));
}

function git(cwd, args) {
  const r = spawnSync('git', args, { cwd, encoding: 'utf8' });
  if (r.status !== 0) throw new Error(r.stderr || r.stdout);
  return r.stdout.trim();
}

/**
 * Builds the minimal git repository that cypress-start treats as a template.
 * Only files that integration tests assert on are included; everything else is
 * intentionally absent so `npm install` (zero deps) completes instantly.
 */
function makeMinimalTemplate(parentDir) {
  const tplPath = path.join(parentDir, 'fake-template');

  fs.mkdirSync(path.join(tplPath, 'scripts'), { recursive: true });
  fs.mkdirSync(path.join(tplPath, 'cypress', 'sensitive-data'), { recursive: true });

  fs.writeFileSync(path.join(tplPath, 'cypress.config.js'), 'module.exports = {};\n');
  fs.writeFileSync(path.join(tplPath, 'scripts', 'parallel-cypress-runner.js'), '// parallel runner\n');
  fs.writeFileSync(path.join(tplPath, 'cypress', 'sensitive-data', 'env-users.example.json'), '{"user":"example"}\n');

  // Build a package.json that contains every script from OPTIONAL_MODULES so
  // copyOrUpdatePackageJson can resolve them, but with zero devDependencies so
  // npm install is instant.
  const scripts = {};
  for (const mod of Object.values(OPTIONAL_MODULES)) {
    Object.assign(scripts, mod.scripts ?? {});
  }
  fs.writeFileSync(path.join(tplPath, 'package.json'), JSON.stringify({ version: '5.0.0', scripts, devDependencies: {} }, null, 2) + '\n');

  git(tplPath, ['init']);
  git(tplPath, ['config', 'user.email', 'test@example.com']);
  git(tplPath, ['config', 'user.name', 'Test User']);
  git(tplPath, ['add', '-A']);
  git(tplPath, ['commit', '-m', 'initial template']);

  return tplPath;
}

/**
 * Spawns the CLI binary and feeds stdin answers one line at a time.
 *
 * Writing the entire input as a single chunk causes Node.js readline to fire
 * all 'line' events before later question() callbacks are registered, silently
 * dropping those answers.  A short inter-line delay (LINE_DELAY_MS) lets the
 * process reach its next question() call before the next answer arrives.
 *
 * @param {object}   opts
 * @param {string[]} [opts.args]        extra CLI arguments (e.g. project name)
 * @param {string[]} opts.stdinLines    answers to pipe in order, one per prompt
 * @param {string}   opts.templateUrl   local path used as CYPRESS_START_TEMPLATE_URL
 * @param {string}   opts.cwd           working directory for the child process
 * @returns {Promise<{status:number, stdout:string, stderr:string}>}
 */
const LINE_DELAY_MS = 100;

function runCli({ args = [], stdinLines, templateUrl, cwd }) {
  return new Promise((resolve, reject) => {
    const child = spawn('node', [BIN, ...args], {
      cwd,
      env: { ...process.env, CYPRESS_START_TEMPLATE_URL: templateUrl },
      stdio: ['pipe', 'pipe', 'pipe'],
    });

    let stdout = '';
    let stderr = '';
    child.stdout.on('data', (d) => (stdout += d));
    child.stderr.on('data', (d) => (stderr += d));

    let idx = 0;
    function writeNext() {
      if (idx < stdinLines.length) {
        child.stdin.write(stdinLines[idx++] + '\n');
        setTimeout(writeNext, LINE_DELAY_MS);
      } else {
        child.stdin.end();
      }
    }
    // Give the process a moment to start and print its first prompt.
    setTimeout(writeNext, LINE_DELAY_MS);

    const watchdog = setTimeout(() => {
      child.kill();
      reject(new Error(`CLI timed out.\nstdout: ${stdout}\nstderr: ${stderr}`));
    }, 60_000);

    child.on('close', (code) => {
      clearTimeout(watchdog);
      resolve({ status: code, stdout, stderr });
    });
    child.on('error', reject);
  });
}

// Stdin line arrays are built dynamically from OPTIONAL_MODULES so they stay
// in sync with the module list automatically.
const ALL_MODULES_NO = Object.keys(OPTIONAL_MODULES).map(() => 'n');
const ONLY_PARALLEL_RUNNER = Object.keys(OPTIONAL_MODULES).map((k) => (k === 'parallelRunner' ? 'y' : 'n'));
const ONLY_ESLINT = Object.keys(OPTIONAL_MODULES).map((k) => (k === 'eslintCustomRules' ? 'y' : 'n'));

// ---------------------------------------------------------------------------
// tests
// ---------------------------------------------------------------------------

test('CLI full setup: creates project directory, writes manifest, seeds credentials, initialises git', async () => {
  const tmp = makeTmpDir();
  try {
    const templateUrl = makeMinimalTemplate(tmp);
    const projectName = 'my-new-project';

    // Mode "1" = full setup; project name is supplied via argv so no module-selection prompts follow.
    const result = await runCli({ args: [projectName], stdinLines: ['1'], templateUrl, cwd: tmp });

    assert.equal(result.status, 0, `CLI exited ${result.status}.\nstdout: ${result.stdout}\nstderr: ${result.stderr}`);

    const projectPath = path.join(tmp, projectName);

    assert.ok(fs.existsSync(path.join(projectPath, 'cypress.config.js')), 'cypress.config.js must be copied');
    assert.ok(fs.existsSync(path.join(projectPath, 'package.json')), 'package.json must exist');
    assert.ok(fs.existsSync(path.join(projectPath, '.git')), 'fresh .git must be initialised');
    assert.ok(!fs.existsSync(path.join(projectPath, 'bin')), 'bin/ must NOT be copied into the project');

    // Manifest
    const manifest = readManifest(projectPath);
    assert.ok(manifest, 'manifest must be written');
    assert.ok(Array.isArray(manifest.files) && manifest.files.length > 0, 'manifest must list managed files');
    assert.equal(manifest.version, '5.0.0');

    // Sensitive-data seed files
    assert.ok(fs.existsSync(path.join(projectPath, 'cypress', 'sensitive-data', 'dev-users.json')), 'dev-users.json must be seeded from example');
    assert.ok(fs.existsSync(path.join(projectPath, 'cypress', 'sensitive-data', 'qa-users.json')), 'qa-users.json must be seeded from example');
  } finally {
    fs.rmSync(tmp, { recursive: true, force: true });
  }
});

test('CLI specific setup: copies only the selected module, updates package.json, writes manifest', async () => {
  const tmp = makeTmpDir();
  try {
    const templateUrl = makeMinimalTemplate(tmp);

    // Mode "2" = specific; project name "." = cwd (tmp); then one answer per module.
    const result = await runCli({ args: ['.'], stdinLines: ['2', ...ONLY_PARALLEL_RUNNER], templateUrl, cwd: tmp });

    assert.equal(result.status, 0, `CLI exited ${result.status}.\nstdout: ${result.stdout}\nstderr: ${result.stderr}`);

    assert.ok(fs.existsSync(path.join(tmp, 'scripts', 'parallel-cypress-runner.js')), 'parallelRunner file must be copied');
    assert.ok(!fs.existsSync(path.join(tmp, 'cypress.config.js')), 'cypress.config.js must NOT be copied when its module was not selected');

    const pkg = JSON.parse(fs.readFileSync(path.join(tmp, 'package.json'), 'utf8'));
    assert.equal(pkg.scripts['test:parallel'], OPTIONAL_MODULES.parallelRunner.scripts['test:parallel'], 'parallelRunner script must be merged into package.json');

    const manifest = readManifest(tmp);
    assert.ok(manifest, 'manifest must be written');
    assert.deepEqual(manifest.files, ['scripts/parallel-cypress-runner.js']);
  } finally {
    fs.rmSync(tmp, { recursive: true, force: true });
  }
});

test('CLI specific setup: does NOT overwrite a seed-only file that already exists in the target', async () => {
  const tmp = makeTmpDir();
  try {
    const templateUrl = makeMinimalTemplate(tmp);

    // Add scripts/thresholds.json to the fake template (it is a seed-only file).
    fs.writeFileSync(path.join(templateUrl, 'scripts', 'thresholds.json'), '{"template":true}\n');
    git(templateUrl, ['add', '-A']);
    git(templateUrl, ['commit', '-m', 'add thresholds']);

    // Pre-create the file in the target directory with custom content.
    fs.mkdirSync(path.join(tmp, 'scripts'), { recursive: true });
    fs.writeFileSync(path.join(tmp, 'scripts', 'thresholds.json'), '{"project":true}\n');

    // Select only eslintCustomRules (which ships thresholds.json) and nothing else.
    const result = await runCli({ args: ['.'], stdinLines: ['2', ...ONLY_ESLINT], templateUrl, cwd: tmp });

    assert.equal(result.status, 0, `CLI exited ${result.status}.\nstdout: ${result.stdout}\nstderr: ${result.stderr}`);

    assert.equal(fs.readFileSync(path.join(tmp, 'scripts', 'thresholds.json'), 'utf8'), '{"project":true}\n', 'existing seed-only file must NOT be overwritten');
  } finally {
    fs.rmSync(tmp, { recursive: true, force: true });
  }
});

test('CLI update mode: applies latest template, updates files, stages all changes in git', async () => {
  const tmp = makeTmpDir();
  try {
    const templateUrl = makeMinimalTemplate(tmp);

    // Prepare the "existing project" — an old cypress.config.js + manifest + git history.
    const project = path.join(tmp, 'existing-project');
    fs.mkdirSync(path.join(project, 'cypress', 'sensitive-data'), { recursive: true });
    fs.writeFileSync(path.join(project, 'cypress.config.js'), '// old config\n');
    fs.writeFileSync(project + '/package.json', JSON.stringify({ name: 'my-app' }, null, 2) + '\n');
    writeManifest(project, ['cypress.config.js'], '4.0.0');

    git(project, ['init']);
    git(project, ['config', 'user.email', 'test@example.com']);
    git(project, ['config', 'user.name', 'Test User']);
    git(project, ['add', '-A']);
    git(project, ['commit', '-m', 'initial']);

    // Mode "3" = update; project path via argv so no extra prompts follow.
    const result = await runCli({ args: [project], stdinLines: ['3'], templateUrl, cwd: tmp });

    assert.equal(result.status, 0, `CLI exited ${result.status}.\nstdout: ${result.stdout}\nstderr: ${result.stderr}`);

    // Template file must have been updated.
    assert.equal(fs.readFileSync(path.join(project, 'cypress.config.js'), 'utf8'), 'module.exports = {};\n', 'cypress.config.js must be updated to the template version');

    // qa-users.json must have been seeded (missing before the update).
    assert.ok(fs.existsSync(path.join(project, 'cypress', 'sensitive-data', 'qa-users.json')), 'qa-users.json must be seeded by the update');

    // All changes must be staged (index clean, no unstaged diff).
    const status = spawnSync('git', ['status', '--porcelain'], { cwd: project, encoding: 'utf8' });
    const lines = status.stdout.trim().split('\n').filter(Boolean);
    assert.ok(lines.length > 0, 'there should be staged changes after an update');
    for (const line of lines) {
      assert.equal(line[1], ' ', `expected staged-only change but got unstaged: "${line}"`);
    }
  } finally {
    fs.rmSync(tmp, { recursive: true, force: true });
  }
});

test('CLI: invalid mode input re-prompts until a valid selection is entered', async () => {
  const tmp = makeTmpDir();
  try {
    const templateUrl = makeMinimalTemplate(tmp);

    // Send an invalid choice first, then select full setup.
    const result = await runCli({ args: ['retry-project'], stdinLines: ['9', '1'], templateUrl, cwd: tmp });

    assert.equal(result.status, 0, `CLI exited ${result.status}.\nstdout: ${result.stdout}\nstderr: ${result.stderr}`);
    assert.ok(fs.existsSync(path.join(tmp, 'retry-project', 'cypress.config.js')), 'project must be created after re-prompt succeeds');
  } finally {
    fs.rmSync(tmp, { recursive: true, force: true });
  }
});

test('CLI specific setup: exits cleanly with no files copied when every module is declined', async () => {
  const tmp = makeTmpDir();
  try {
    const templateUrl = makeMinimalTemplate(tmp);

    const result = await runCli({ args: ['.'], stdinLines: ['2', ...ALL_MODULES_NO], templateUrl, cwd: tmp });

    assert.equal(result.status, 0, `CLI exited ${result.status}.\nstdout: ${result.stdout}\nstderr: ${result.stderr}`);

    // No template files should have been copied into tmp (beyond what was already there).
    assert.ok(!fs.existsSync(path.join(tmp, 'cypress.config.js')), 'no template files should be copied');

    // A manifest is still written with an empty file list.
    const manifest = readManifest(tmp);
    assert.ok(manifest, 'manifest must still be written');
    assert.deepEqual(manifest.files, [], 'no files should be listed in the manifest');
  } finally {
    fs.rmSync(tmp, { recursive: true, force: true });
  }
});
