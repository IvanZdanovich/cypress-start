'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs');
const os = require('os');
const path = require('path');

const { OPTIONAL_MODULES, validateProjectName, copyDirectory, copyOrUpdatePackageJson } = require('../cypress-start.js');

// --- helpers ---------------------------------------------------------------

function makeTmpDir() {
  return fs.mkdtempSync(path.join(os.tmpdir(), 'cypress-start-test-'));
}

async function withTmpCwd(run) {
  const tmp = makeTmpDir();
  const originalCwd = process.cwd();
  process.chdir(tmp);
  try {
    return await run(tmp);
  } finally {
    process.chdir(originalCwd);
    fs.rmSync(tmp, { recursive: true, force: true });
  }
}

// --- validateProjectName ---------------------------------------------------

test('validateProjectName rejects an empty name', async () => {
  assert.equal(await validateProjectName(''), false);
  assert.equal(await validateProjectName(undefined), false);
});

test('validateProjectName rejects names with illegal characters', async () => {
  assert.equal(await validateProjectName('my project'), false); // space
  assert.equal(await validateProjectName('my/project'), false); // slash
  assert.equal(await validateProjectName('proj$'), false); // symbol
});

test('validateProjectName accepts letters, numbers, dots, dashes, underscores', async () => {
  await withTmpCwd(async () => {
    assert.equal(await validateProjectName('valid-name_1.0'), true);
  });
});

test('validateProjectName rejects a name that already exists as a directory', async () => {
  await withTmpCwd(async (tmp) => {
    fs.mkdirSync(path.join(tmp, 'existing'));
    assert.equal(await validateProjectName('existing'), false);
  });
});

// --- copyDirectory ---------------------------------------------------------

test('copyDirectory recursively copies files and nested folders', async () => {
  await withTmpCwd((tmp) => {
    const src = path.join(tmp, 'src');
    const dest = path.join(tmp, 'dest');
    fs.mkdirSync(path.join(src, 'nested'), { recursive: true });
    fs.writeFileSync(path.join(src, 'a.txt'), 'a');
    fs.writeFileSync(path.join(src, 'nested', 'b.txt'), 'b');

    copyDirectory(src, dest);

    assert.equal(fs.readFileSync(path.join(dest, 'a.txt'), 'utf8'), 'a');
    assert.equal(fs.readFileSync(path.join(dest, 'nested', 'b.txt'), 'utf8'), 'b');
  });
});

// --- copyOrUpdatePackageJson ----------------------------------------------

function writeSourcePackageJson(tempPath) {
  fs.mkdirSync(tempPath, { recursive: true });
  fs.writeFileSync(
    path.join(tempPath, 'package.json'),
    JSON.stringify({
      devDependencies: {
        eslint: '^10.0.0',
        prettier: '^3.0.0',
        glob: '^13.0.0',
        '@eslint/js': '^10.0.0',
        'eslint-config-prettier': '^10.0.0',
        'eslint-plugin-cypress': '^6.0.0',
        'eslint-plugin-prettier': '^5.0.0',
      },
    }),
  );
}

test('copyOrUpdatePackageJson creates a new package.json with selected module scripts and deps', async () => {
  await withTmpCwd(async (tmp) => {
    const projectPath = path.join(tmp, 'project');
    const tempPath = path.join(tmp, 'temp-clone');
    fs.mkdirSync(projectPath, { recursive: true });
    writeSourcePackageJson(tempPath);

    await copyOrUpdatePackageJson(projectPath, { parallelRunner: true }, tempPath);

    const pkg = JSON.parse(fs.readFileSync(path.join(projectPath, 'package.json'), 'utf8'));
    assert.equal(pkg.scripts['test:parallel'], OPTIONAL_MODULES.parallelRunner.scripts['test:parallel']);
    assert.equal(pkg.devDependencies.glob, '^13.0.0');
    // Unselected module deps must not leak in.
    assert.equal(pkg.devDependencies.eslint, undefined);
  });
});

test('copyOrUpdatePackageJson merges into an existing package.json without clobbering it', async () => {
  await withTmpCwd(async (tmp) => {
    const projectPath = path.join(tmp, 'project');
    const tempPath = path.join(tmp, 'temp-clone');
    fs.mkdirSync(projectPath, { recursive: true });
    fs.writeFileSync(path.join(projectPath, 'package.json'), JSON.stringify({ name: 'existing-app', scripts: { start: 'node index.js' }, devDependencies: { existing: '^1.0.0' } }));
    writeSourcePackageJson(tempPath);

    await copyOrUpdatePackageJson(projectPath, { eslintCustomRules: true }, tempPath);

    const pkg = JSON.parse(fs.readFileSync(path.join(projectPath, 'package.json'), 'utf8'));
    assert.equal(pkg.name, 'existing-app');
    assert.equal(pkg.scripts.start, 'node index.js');
    assert.equal(pkg.scripts.lint, OPTIONAL_MODULES.eslintCustomRules.scripts.lint);
    assert.equal(pkg.devDependencies.existing, '^1.0.0');
    assert.equal(pkg.devDependencies.eslint, '^10.0.0');
  });
});

test('copyOrUpdatePackageJson is a no-op when the source package.json is missing', async () => {
  await withTmpCwd(async (tmp) => {
    const projectPath = path.join(tmp, 'project');
    const tempPath = path.join(tmp, 'temp-clone-missing');
    fs.mkdirSync(projectPath, { recursive: true });

    await copyOrUpdatePackageJson(projectPath, { parallelRunner: true }, tempPath);

    assert.equal(fs.existsSync(path.join(projectPath, 'package.json')), false);
  });
});
