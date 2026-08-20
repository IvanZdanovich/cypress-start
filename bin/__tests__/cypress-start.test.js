'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const { spawnSync } = require('child_process');
const fs = require('fs');
const os = require('os');
const path = require('path');

const {
  OPTIONAL_MODULES,
  validateProjectName,
  copyDirectory,
  copySpecificFiles,
  copyOrUpdatePackageJson,
  isExcludedFromUpdate,
  buildTemplateFileList,
  readManifest,
  writeManifest,
  computeFilesToDelete,
  getTemplateVersion,
  syncTemplateFiles,
  deleteObsoleteFiles,
  updateProject,
} = require('../cypress-start.js');

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

function runGit(cwd, args) {
  const result = spawnSync('git', args, { cwd, encoding: 'utf8' });
  assert.equal(result.status, 0, result.stderr || result.stdout);
  return result.stdout.trim();
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

test('validateProjectName allows an existing directory when explicitly requested', async () => {
  await withTmpCwd(async (tmp) => {
    fs.mkdirSync(path.join(tmp, 'existing'));
    assert.equal(await validateProjectName('existing', { allowExistingDirectory: true }), true);
    assert.equal(await validateProjectName('.', { allowExistingDirectory: true }), true);
  });
});

test('validateProjectName still rejects an existing file when existing directories are allowed', async () => {
  await withTmpCwd(async (tmp) => {
    fs.writeFileSync(path.join(tmp, 'file-target'), 'not a directory');
    assert.equal(await validateProjectName('file-target', { allowExistingDirectory: true }), false);
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

test('copySpecificFiles supports copying selected modules into the current directory', async () => {
  await withTmpCwd(async (tmp) => {
    const template = path.join(tmp, 'template-source');

    fs.mkdirSync(path.join(template, 'scripts'), { recursive: true });
    fs.writeFileSync(path.join(template, 'scripts', 'parallel-cypress-runner.js'), 'console.log("parallel");\n');
    fs.writeFileSync(path.join(template, 'package.json'), JSON.stringify({ version: '7.7.7', devDependencies: { glob: '^13.0.0' } }, null, 2) + '\n');
    fs.writeFileSync(path.join(tmp, 'package.json'), JSON.stringify({ name: 'existing-app', scripts: { start: 'node app.js' } }, null, 2) + '\n');

    runGit(template, ['init']);
    runGit(template, ['config', 'user.email', 'test@example.com']);
    runGit(template, ['config', 'user.name', 'Test User']);
    runGit(template, ['add', '-A']);
    runGit(template, ['commit', '-m', 'template']);

    const previousTemplateUrl = process.env.CYPRESS_START_TEMPLATE_URL;
    process.env.CYPRESS_START_TEMPLATE_URL = template;
    try {
      await copySpecificFiles('.', { parallelRunner: true });
    } finally {
      if (previousTemplateUrl === undefined) {
        delete process.env.CYPRESS_START_TEMPLATE_URL;
      } else {
        process.env.CYPRESS_START_TEMPLATE_URL = previousTemplateUrl;
      }
    }

    assert.equal(fs.readFileSync(path.join(tmp, 'scripts', 'parallel-cypress-runner.js'), 'utf8'), 'console.log("parallel");\n');

    const pkg = JSON.parse(fs.readFileSync(path.join(tmp, 'package.json'), 'utf8'));
    assert.equal(pkg.name, 'existing-app');
    assert.equal(pkg.scripts.start, 'node app.js');
    assert.equal(pkg.scripts['test:parallel'], OPTIONAL_MODULES.parallelRunner.scripts['test:parallel']);
    assert.equal(pkg.devDependencies.glob, '^13.0.0');

    const manifest = readManifest(tmp);
    assert.equal(manifest.version, '7.7.7');
    assert.deepEqual(manifest.files, ['scripts/parallel-cypress-runner.js']);
  });
});

// --- update helpers --------------------------------------------------------

test('isExcludedFromUpdate protects user-owned files but allows template files', () => {
  assert.equal(isExcludedFromUpdate('package.json'), true);
  assert.equal(isExcludedFromUpdate('package-lock.json'), true);
  assert.equal(isExcludedFromUpdate('.git/config'), true);
  assert.equal(isExcludedFromUpdate('node_modules/foo/index.js'), true);
  assert.equal(isExcludedFromUpdate('cypress/sensitive-data/dev-users.json'), true);
  assert.equal(isExcludedFromUpdate('cypress/sensitive-data/qa-users.json'), true);
  // The example file should stay in sync with the template.
  assert.equal(isExcludedFromUpdate('cypress/sensitive-data/env-users.example.json'), false);
  assert.equal(isExcludedFromUpdate('cypress/e2e/ui/login.spec.js'), false);
});

test('buildTemplateFileList lists managed files and skips excluded paths', async () => {
  await withTmpCwd((tmp) => {
    const root = path.join(tmp, 'template');
    fs.mkdirSync(path.join(root, 'cypress', 'sensitive-data'), { recursive: true });
    fs.mkdirSync(path.join(root, '.git'), { recursive: true });
    fs.mkdirSync(path.join(root, 'node_modules', 'x'), { recursive: true });
    fs.writeFileSync(path.join(root, 'cypress.config.js'), 'x');
    fs.writeFileSync(path.join(root, 'package.json'), '{}');
    fs.writeFileSync(path.join(root, '.git', 'HEAD'), 'ref');
    fs.writeFileSync(path.join(root, 'node_modules', 'x', 'index.js'), 'y');
    fs.writeFileSync(path.join(root, 'cypress', 'sensitive-data', 'dev-users.json'), '{}');
    fs.writeFileSync(path.join(root, 'cypress', 'sensitive-data', 'env-users.example.json'), '{}');

    const files = buildTemplateFileList(root);

    assert.deepEqual(files, ['cypress.config.js', 'cypress/sensitive-data/env-users.example.json'].sort());
  });
});

test('computeFilesToDelete returns files removed from the template only', () => {
  const oldFiles = ['a.js', 'b.js', 'cypress/sensitive-data/dev-users.json'];
  const newFiles = ['a.js'];
  // b.js was removed; the sensitive user file must never be flagged for deletion.
  assert.deepEqual(computeFilesToDelete(oldFiles, newFiles), ['b.js']);
  assert.deepEqual(computeFilesToDelete(null, newFiles), []);
});

test('writeManifest / readManifest round-trip the installed file list', async () => {
  await withTmpCwd((tmp) => {
    const projectPath = path.join(tmp, 'project');
    fs.mkdirSync(projectPath, { recursive: true });

    writeManifest(projectPath, ['b.js', 'a.js'], '2.0.4');
    const manifest = readManifest(projectPath);

    assert.equal(manifest.version, '2.0.4');
    assert.deepEqual(manifest.files, ['a.js', 'b.js']);
    assert.equal(typeof manifest.updatedAt, 'string');
  });
});

test('readManifest returns null when no manifest exists', async () => {
  await withTmpCwd((tmp) => {
    const projectPath = path.join(tmp, 'no-manifest');
    fs.mkdirSync(projectPath, { recursive: true });
    assert.equal(readManifest(projectPath), null);
  });
});

test('getTemplateVersion reads the version from template package.json', async () => {
  await withTmpCwd((tmp) => {
    const templatePath = path.join(tmp, 'template');
    fs.mkdirSync(templatePath, { recursive: true });
    fs.writeFileSync(path.join(templatePath, 'package.json'), JSON.stringify({ version: '3.2.1' }));

    assert.equal(getTemplateVersion(templatePath), '3.2.1');
    assert.equal(getTemplateVersion(path.join(tmp, 'missing-template')), null);
  });
});

test('syncTemplateFiles adds new files and only rewrites changed ones', async () => {
  await withTmpCwd((tmp) => {
    const template = path.join(tmp, 'template');
    const project = path.join(tmp, 'project');
    fs.mkdirSync(path.join(template, 'nested'), { recursive: true });
    fs.mkdirSync(project, { recursive: true });

    fs.writeFileSync(path.join(template, 'same.js'), 'unchanged');
    fs.writeFileSync(path.join(template, 'nested', 'changed.js'), 'new-content');
    fs.writeFileSync(path.join(template, 'added.js'), 'brand-new');

    // Pre-existing project files: one identical, one differing.
    fs.writeFileSync(path.join(project, 'same.js'), 'unchanged');
    fs.mkdirSync(path.join(project, 'nested'), { recursive: true });
    fs.writeFileSync(path.join(project, 'nested', 'changed.js'), 'old-content');

    const result = syncTemplateFiles(project, template);

    assert.equal(result.added, 1); // added.js
    assert.equal(result.updated, 1); // nested/changed.js
    assert.equal(fs.readFileSync(path.join(project, 'added.js'), 'utf8'), 'brand-new');
    assert.equal(fs.readFileSync(path.join(project, 'nested', 'changed.js'), 'utf8'), 'new-content');
    assert.deepEqual(result.newFiles, ['added.js', 'nested/changed.js', 'same.js']);
  });
});

test('deleteObsoleteFiles removes files gone from the template and prunes empty dirs', async () => {
  await withTmpCwd((tmp) => {
    const project = path.join(tmp, 'project');
    fs.mkdirSync(path.join(project, 'old'), { recursive: true });
    fs.writeFileSync(path.join(project, 'keep.js'), 'k');
    fs.writeFileSync(path.join(project, 'old', 'gone.js'), 'g');

    const deleted = deleteObsoleteFiles(project, ['keep.js', 'old/gone.js'], ['keep.js']);

    assert.equal(deleted, 1);
    assert.equal(fs.existsSync(path.join(project, 'old', 'gone.js')), false);
    assert.equal(fs.existsSync(path.join(project, 'old')), false, 'empty directory should be pruned');
    assert.equal(fs.existsSync(path.join(project, 'keep.js')), true);
  });
});

test('deleteObsoleteFiles never removes user-owned sensitive files', async () => {
  await withTmpCwd((tmp) => {
    const project = path.join(tmp, 'project');
    fs.mkdirSync(path.join(project, 'cypress', 'sensitive-data'), { recursive: true });
    fs.writeFileSync(path.join(project, 'cypress', 'sensitive-data', 'dev-users.json'), '{}');

    const deleted = deleteObsoleteFiles(project, ['cypress/sensitive-data/dev-users.json'], []);

    assert.equal(deleted, 0);
    assert.equal(fs.existsSync(path.join(project, 'cypress', 'sensitive-data', 'dev-users.json')), true);
  });
});

test('updateProject applies latest template in place, deletes obsolete files, preserves credentials, and stages only project changes', async () => {
  await withTmpCwd(async (tmp) => {
    const template = path.join(tmp, 'template-source');
    const project = path.join(tmp, 'project');

    fs.mkdirSync(path.join(template, 'cypress', 'sensitive-data'), { recursive: true });
    fs.writeFileSync(path.join(template, 'cypress.config.js'), 'module.exports = { e2e: { baseUrl: "https://new.example" } };\n');
    fs.writeFileSync(path.join(template, 'new-template-file.js'), 'new template file\n');
    fs.writeFileSync(path.join(template, 'cypress', 'sensitive-data', 'env-users.example.json'), '{"example":true}\n');
    fs.writeFileSync(path.join(template, 'package.json'), JSON.stringify({ version: '9.9.9', devDependencies: { eslint: '^10.0.0', glob: '^13.0.0' } }, null, 2) + '\n');

    runGit(template, ['init']);
    runGit(template, ['config', 'user.email', 'test@example.com']);
    runGit(template, ['config', 'user.name', 'Test User']);
    runGit(template, ['add', '-A']);
    runGit(template, ['commit', '-m', 'template']);

    fs.mkdirSync(path.join(project, 'cypress', 'sensitive-data'), { recursive: true });
    fs.writeFileSync(path.join(project, 'cypress.config.js'), 'module.exports = { e2e: { baseUrl: "https://old.example" } };\n');
    fs.writeFileSync(path.join(project, 'obsolete-template-file.js'), 'remove me\n');
    fs.writeFileSync(path.join(project, 'cypress', 'sensitive-data', 'dev-users.json'), '{"token":"secret"}\n');
    fs.writeFileSync(path.join(project, 'package.json'), JSON.stringify({ name: 'existing-app', scripts: { start: 'node app.js' } }, null, 2) + '\n');
    writeManifest(project, ['cypress.config.js', 'obsolete-template-file.js', 'cypress/sensitive-data/dev-users.json'], '1.0.0');

    runGit(project, ['init']);
    runGit(project, ['config', 'user.email', 'test@example.com']);
    runGit(project, ['config', 'user.name', 'Test User']);
    runGit(project, ['add', '-A']);
    runGit(project, ['commit', '-m', 'before update']);

    const previousTemplateUrl = process.env.CYPRESS_START_TEMPLATE_URL;
    process.env.CYPRESS_START_TEMPLATE_URL = template;
    try {
      const result = await updateProject(project);

      assert.equal(result.gitAvailable, true);
      assert.equal(result.added, 2);
      assert.equal(result.updated, 1);
      assert.equal(result.deleted, 1);
      assert.equal(result.templateVersion, '9.9.9');
    } finally {
      if (previousTemplateUrl === undefined) {
        delete process.env.CYPRESS_START_TEMPLATE_URL;
      } else {
        process.env.CYPRESS_START_TEMPLATE_URL = previousTemplateUrl;
      }
    }

    assert.equal(fs.readFileSync(path.join(project, 'cypress.config.js'), 'utf8'), 'module.exports = { e2e: { baseUrl: "https://new.example" } };\n');
    assert.equal(fs.readFileSync(path.join(project, 'new-template-file.js'), 'utf8'), 'new template file\n');
    assert.equal(fs.existsSync(path.join(project, 'obsolete-template-file.js')), false);
    assert.equal(fs.readFileSync(path.join(project, 'cypress', 'sensitive-data', 'dev-users.json'), 'utf8'), '{"token":"secret"}\n');

    const pkg = JSON.parse(fs.readFileSync(path.join(project, 'package.json'), 'utf8'));
    assert.equal(pkg.name, 'existing-app');
    assert.equal(pkg.scripts.start, 'node app.js');
    assert.equal(pkg.scripts['test:parallel'], OPTIONAL_MODULES.parallelRunner.scripts['test:parallel']);

    const status = runGit(project, ['status', '--porcelain']);
    const stagedChanges = status.split('\n');
    assert.ok(stagedChanges.includes('M  .cypress-start-manifest.json'));
    assert.ok(stagedChanges.includes('M  cypress.config.js'));
    assert.ok(stagedChanges.includes('A  cypress/sensitive-data/env-users.example.json'));
    assert.ok(stagedChanges.includes('A  new-template-file.js'));
    assert.ok(stagedChanges.includes('D  obsolete-template-file.js'));
    assert.ok(stagedChanges.includes('M  package.json'));
    assert.doesNotMatch(status, /temp-cypress-start-update|template-source/);

    for (const line of stagedChanges) {
      assert.equal(line[1], ' ', `expected staged-only change, got: ${line}`);
    }
  });
});
