#!/usr/bin/env node

const { spawnSync } = require('child_process');
const fs = require('fs');
const os = require('os');
const path = require('path');
const readline = require('readline');

const GITHUB_TEMPLATE_URL = 'https://github.com/IvanZdanovich/cypress-start.git';

// Manifest file that records which template files were installed. It lets the
// update flow know which files are managed by the template so obsolete ones can
// be removed cleanly on the next update.
const MANIFEST_FILE = '.cypress-start-manifest.json';

const COLORS = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  green: '\x1b[32m',
  blue: '\x1b[34m',
  yellow: '\x1b[33m',
  red: '\x1b[31m',
  cyan: '\x1b[36m',
  magenta: '\x1b[35m',
};

// Optional modules configuration
const OPTIONAL_MODULES = {
  eslintCustomRules: {
    name: 'ESLint Custom Rules',
    description: 'Custom ESLint rules for test title standardization, validation, and JSON structure definitions',
    files: ['eslint-plugin-custom-rules/', 'eslint.config.mjs', 'scripts/setup-git-hooks.js', '.prettierrc.js'],
    scripts: {
      lint: 'eslint . --format stylish --fix',
      postinstall: 'node scripts/setup-git-hooks.js',
    },
    devDependencies: ['@eslint/eslintrc', '@eslint/js', 'eslint', 'eslint-config-prettier', 'eslint-plugin-chai-friendly', 'eslint-plugin-cypress', 'eslint-plugin-prettier', 'prettier'],
  },
  documentation: {
    name: 'Documentation',
    description: 'Comprehensive testing guidelines, conventions, best practices, and bug logging system',
    files: ['docs/'],
  },
  claudeSkills: {
    name: 'Claude Skills',
    description: 'Claude Code skill files for AI-assisted test writing, constraints, examples, and documentation workflows',
    files: ['.claude/'],
  },
  parallelRunner: {
    name: 'Parallel Test Execution',
    description: 'Script for running tests in parallel with custom configuration',
    files: ['scripts/parallel-cypress-runner.js'],
    scripts: { 'test:parallel': 'node scripts/parallel-cypress-runner.js' },
    devDependencies: ['glob'],
  },
  githubWorkflow: {
    name: 'GitHub Actions Workflow',
    description: 'CI/CD workflows for automated test execution on GitHub',
    files: ['.github/workflows/'],
  },
  docker: {
    name: 'Docker Support',
    description: 'Dockerfile for containerized test execution',
    files: ['Dockerfile', '.dockerignore'],
  },
};

let rl;

function getReadline() {
  if (!rl) {
    rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout,
    });
  }
  return rl;
}

function question(query) {
  return new Promise((resolve) => {
    getReadline().question(query, (answer) => {
      resolve(answer);
    });
  });
}

function log(message, color = 'reset') {
  console.log(`${COLORS[color]}${message}${COLORS.reset}`);
}

function logStep(step, message) {
  console.log(`\n${COLORS.cyan}[${step}]${COLORS.reset} ${message}`);
}

function getTemplateUrl() {
  return process.env.CYPRESS_START_TEMPLATE_URL || GITHUB_TEMPLATE_URL;
}

function runRequiredCommand(command, args, options, errorMessage) {
  const result = spawnSync(command, args, options);
  if (result.error || result.status !== 0) {
    const details = result.stderr?.toString().trim() || result.error?.message || `${command} exited with status ${result.status}`;
    throw new Error(`${errorMessage}: ${details}`);
  }
  return result;
}

function printBanner() {
  console.log(`
${COLORS.bright}${COLORS.blue}╔═══════════════════════════════════════════════════════════╗
║                                                           ║
║        🚀 Cypress Testing Framework Starter 🚀            ║
║                                                           ║
║     Professional test automation framework template       ║
║         with full or custom module selection              ║
║                                                           ║
╚═══════════════════════════════════════════════════════════╝${COLORS.reset}
  `);
}

function copyDirectory(source, destination) {
  if (!fs.existsSync(destination)) {
    fs.mkdirSync(destination, { recursive: true });
  }

  const entries = fs.readdirSync(source, { withFileTypes: true });

  for (const entry of entries) {
    const sourcePath = path.join(source, entry.name);
    const destPath = path.join(destination, entry.name);

    if (entry.isDirectory()) {
      copyDirectory(sourcePath, destPath);
    } else {
      fs.copyFileSync(sourcePath, destPath);
    }
  }
}

// --- Update / manifest helpers --------------------------------------------

// Files that must never be overwritten or deleted by an update because they are
// owned by the user (credentials, dependency manifests, VCS metadata).
function isExcludedFromUpdate(relPath) {
  const normalized = relPath.split(path.sep).join('/');

  if (normalized === 'package.json') return true;
  if (normalized === 'package-lock.json') return true;
  if (normalized === 'yarn.lock') return true;
  if (normalized === MANIFEST_FILE) return true;
  if (normalized.startsWith('.git/')) return true;
  if (normalized.startsWith('node_modules/')) return true;

  // Preserve user credentials but keep the example file up to date.
  return /^cypress\/sensitive-data\//.test(normalized) && !normalized.endsWith('env-users.example.json');
}

// Recursively lists template-managed files (relative, forward-slash paths),
// skipping VCS/dependency directories and user-owned files.
function buildTemplateFileList(rootPath) {
  const results = [];

  function walk(dir) {
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      if (entry.name === '.git' || entry.name === 'node_modules') {
        continue;
      }

      const absPath = path.join(dir, entry.name);
      const relPath = path.relative(rootPath, absPath).split(path.sep).join('/');

      if (entry.isDirectory()) {
        walk(absPath);
      } else if (!isExcludedFromUpdate(relPath)) {
        results.push(relPath);
      }
    }
  }

  walk(rootPath);
  return results.sort();
}

function readManifest(projectPath) {
  const manifestPath = path.join(projectPath, MANIFEST_FILE);
  if (!fs.existsSync(manifestPath)) {
    return null;
  }
  try {
    return JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
  } catch {
    return null;
  }
}

function writeManifest(projectPath, files, version) {
  const manifest = {
    version: version || null,
    updatedAt: new Date().toISOString(),
    files: [...files].sort(),
  };
  fs.writeFileSync(path.join(projectPath, MANIFEST_FILE), JSON.stringify(manifest, null, 2) + '\n');
}

// Files present in the previous manifest but absent from the new template are
// considered obsolete and should be removed.
function computeFilesToDelete(oldFiles, newFiles) {
  const newSet = new Set(newFiles);
  return (oldFiles || []).filter((file) => !newSet.has(file) && !isExcludedFromUpdate(file));
}

function isGitRepository(projectPath) {
  const result = spawnSync('git', ['rev-parse', '--is-inside-work-tree'], { cwd: projectPath, stdio: 'pipe' });
  return result.status === 0;
}

function getTemplateVersion(templatePath) {
  const pkgPath = path.join(templatePath, 'package.json');
  if (!fs.existsSync(pkgPath)) {
    return null;
  }
  try {
    return JSON.parse(fs.readFileSync(pkgPath, 'utf8')).version || null;
  } catch {
    return null;
  }
}

// Removes now-empty directories left behind after deleting obsolete files,
// walking up towards (but never removing) the project root.
function removeEmptyParents(projectPath, startDir) {
  let dir = startDir;
  while (dir !== projectPath && dir.startsWith(projectPath)) {
    if (fs.existsSync(dir) && fs.readdirSync(dir).length === 0) {
      fs.rmdirSync(dir);
      dir = path.dirname(dir);
    } else {
      break;
    }
  }
}

async function validateProjectName(projectName, options = {}) {
  const { allowExistingDirectory = false } = options;

  if (!projectName) {
    log(`❌ ${allowExistingDirectory ? 'Target directory' : 'Project name'} is required!`, 'red');
    return false;
  }

  if (/[^a-zA-Z0-9._\-]/.test(projectName)) {
    log('❌ Project name must only contain letters, numbers, dots, dashes, or underscores.', 'red');
    return false;
  }

  const projectPath = path.resolve(projectName);
  if (fs.existsSync(projectPath)) {
    if (allowExistingDirectory && fs.statSync(projectPath).isDirectory()) {
      return true;
    }
    log(`❌ Directory "${projectName}" already exists!`, 'red');
    return false;
  }

  return true;
}

async function selectSetupMode() {
  console.log(`
${COLORS.bright}${COLORS.cyan}Setup Mode Selection:${COLORS.reset}

  ${COLORS.green}1.${COLORS.reset} ${COLORS.bright}Full Setup${COLORS.reset} - Install complete framework with all features
     └─ Includes: Complete test suite, ESLint rules, documentation, Claude Skills,
        GitHub workflows, parallel runner, Docker support

  ${COLORS.yellow}2.${COLORS.reset} ${COLORS.bright}Specific Files${COLORS.reset} - Choose which modules to include
     └─ Copy only the features you need for your project
        Tip: pass ${COLORS.bright}.${COLORS.reset} to copy into the current directory

  ${COLORS.magenta}3.${COLORS.reset} ${COLORS.bright}Update Existing Project${COLORS.reset} - Refresh an existing project in place
     └─ Overwrites/adds template files, deletes obsolete ones, and stages
        every change in git so you can review and roll back individual edits
  `);

  const mode = await question(`${COLORS.magenta}Select setup mode (1-3):${COLORS.reset} `);

  switch (mode.trim()) {
    case '1':
      return 'full';
    case '2':
      return 'specific';
    case '3':
      return 'update';
    default:
      log('Invalid selection. Please choose 1, 2, or 3.', 'red');
      return selectSetupMode();
  }
}

async function selectModules() {
  const selectedModules = {};

  console.log(`\n${COLORS.bright}${COLORS.cyan}Module Selection:${COLORS.reset}`);
  console.log(`${COLORS.yellow}Select modules to include in your project:${COLORS.reset}\n`);

  for (const [key, module] of Object.entries(OPTIONAL_MODULES)) {
    console.log(`  ${COLORS.bright}${module.name}${COLORS.reset}`);
    console.log(`  ${COLORS.cyan}└─${COLORS.reset} ${module.description}`);

    const answer = await question(`  ${COLORS.magenta}Include this module?${COLORS.reset} (y/n): `);

    selectedModules[key] = answer.trim().toLowerCase() === 'y';
    console.log('');
  }

  return selectedModules;
}

async function cloneTemplate(projectName) {
  logStep('1/5', 'Cloning template from GitHub...');

  try {
    runRequiredCommand('git', ['clone', '--depth', '1', getTemplateUrl(), projectName], { stdio: 'inherit' }, 'Failed to clone template');
    log('✅ Template cloned successfully', 'green');
  } catch (error) {
    log('❌ Failed to clone template. Please check your internet connection.', 'red');
    throw error;
  }
}

async function copyOrUpdatePackageJson(projectPath, selectedModules, tempPath) {
  logStep('2/2', 'Configuring package.json...');

  const packageJsonPath = path.join(projectPath, 'package.json');
  const tempPackageJsonPath = path.join(tempPath, 'package.json');

  // Read source package.json to get versions
  if (!fs.existsSync(tempPackageJsonPath)) {
    log('⚠️  Source package.json not found', 'yellow');
    return;
  }

  const sourcePackageJson = JSON.parse(fs.readFileSync(tempPackageJsonPath, 'utf8'));

  // Collect scripts and dependencies from selected modules
  const scriptsToAdd = {};
  const depsToAdd = {};

  for (const [key, module] of Object.entries(OPTIONAL_MODULES)) {
    if (selectedModules[key]) {
      // Add scripts
      if (module.scripts) {
        Object.assign(scriptsToAdd, module.scripts);
      }
      // Add dependencies
      if (module.devDependencies) {
        for (const dep of module.devDependencies) {
          if (sourcePackageJson.devDependencies?.[dep]) {
            depsToAdd[dep] = sourcePackageJson.devDependencies[dep];
          }
        }
      }
    }
  }

  let packageJson;

  // Check if package.json exists in target directory
  if (fs.existsSync(packageJsonPath)) {
    // Merge into existing package.json
    log('  Merging scripts and dependencies into existing package.json...', 'cyan');
    packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));

    // Merge scripts
    if (!packageJson.scripts) {
      packageJson.scripts = {};
    }
    Object.assign(packageJson.scripts, scriptsToAdd);

    // Merge devDependencies
    if (!packageJson.devDependencies) {
      packageJson.devDependencies = {};
    }
    Object.assign(packageJson.devDependencies, depsToAdd);

    log('  ✓ Scripts and dependencies merged', 'green');
  } else {
    // Create new package.json
    log('  Creating new package.json...', 'cyan');
    packageJson = {
      scripts: scriptsToAdd,
      devDependencies: depsToAdd,
    };

    log('  ✓ New package.json created', 'green');
  }

  // Write package.json
  fs.writeFileSync(packageJsonPath, JSON.stringify(packageJson, null, 2) + '\n');
  log('✅ Package.json configured', 'green');
}

async function copySpecificFiles(projectName, selectedModules) {
  logStep('1/2', 'Copying selected files...');

  const projectPath = path.resolve(projectName);
  const tempPath = fs.mkdtempSync(path.join(os.tmpdir(), 'cypress-start-clone-'));

  try {
    // Clone to temporary directory
    log('  Downloading files from GitHub...', 'cyan');
    runRequiredCommand('git', ['clone', '--depth', '1', getTemplateUrl(), tempPath], { stdio: 'pipe' }, 'Failed to download template files');

    // Create project directory
    fs.mkdirSync(projectPath, { recursive: true });

    // Track every file copied so an update can later manage them.
    const installedFiles = [];

    // Copy only selected module files
    for (const [key, module] of Object.entries(OPTIONAL_MODULES)) {
      if (selectedModules[key]) {
        for (const filePath of module.files) {
          const sourcePath = path.join(tempPath, filePath);
          const destPath = path.join(projectPath, filePath);

          if (fs.existsSync(sourcePath)) {
            // Create destination directory if needed
            const destDir = path.dirname(destPath);
            if (!fs.existsSync(destDir)) {
              fs.mkdirSync(destDir, { recursive: true });
            }

            // Copy file or directory
            if (fs.statSync(sourcePath).isDirectory()) {
              copyDirectory(sourcePath, destPath);
              for (const rel of buildTemplateFileList(sourcePath)) {
                installedFiles.push(`${filePath.replace(/\/$/, '')}/${rel}`);
              }
            } else {
              fs.copyFileSync(sourcePath, destPath);
              installedFiles.push(filePath);
            }
          }
        }
        log(`  ✓ ${module.name} copied`, 'green');
      }
    }

    // Copy or update package.json with selected module scripts/dependencies
    await copyOrUpdatePackageJson(projectPath, selectedModules, tempPath);

    // Record installed files so a future update can manage them.
    const templateVersion = getTemplateVersion(tempPath);
    writeManifest(projectPath, installedFiles, templateVersion);

    // Clean up temp directory
    fs.rmSync(tempPath, { recursive: true, force: true });

    log('✅ Selected files copied successfully', 'green');
  } catch (error) {
    // Clean up on error
    if (fs.existsSync(tempPath)) {
      fs.rmSync(tempPath, { recursive: true, force: true });
    }
    log('❌ Failed to copy files. Please check your internet connection.', 'red');
    throw error;
  }
}

// Copies every template-managed file into the project, writing only when the
// content actually differs so git shows a minimal, reviewable diff. Returns the
// list of managed files plus how many were added/updated.
function syncTemplateFiles(projectPath, templatePath) {
  const newFiles = buildTemplateFileList(templatePath);
  let added = 0;
  let updated = 0;

  for (const rel of newFiles) {
    const src = path.join(templatePath, rel);
    const dest = path.join(projectPath, rel);
    const srcContent = fs.readFileSync(src);

    if (fs.existsSync(dest)) {
      if (fs.readFileSync(dest).equals(srcContent)) {
        continue;
      }
      fs.writeFileSync(dest, srcContent);
      updated++;
    } else {
      const destDir = path.dirname(dest);
      if (!fs.existsSync(destDir)) {
        fs.mkdirSync(destDir, { recursive: true });
      }
      fs.writeFileSync(dest, srcContent);
      added++;
    }
  }

  return { newFiles, added, updated };
}

// Deletes files that were installed previously but no longer exist in the
// template, then prunes any directories left empty. Returns the delete count.
function deleteObsoleteFiles(projectPath, previousFiles, newFiles) {
  const toDelete = computeFilesToDelete(previousFiles, newFiles);
  let deleted = 0;

  for (const rel of toDelete) {
    const dest = path.join(projectPath, rel);
    if (fs.existsSync(dest)) {
      fs.rmSync(dest, { force: true });
      removeEmptyParents(projectPath, path.dirname(dest));
      deleted++;
    }
  }

  return deleted;
}

async function updateProject(target) {
  const projectPath = path.resolve(target || '.');

  logStep('1/5', 'Preparing update...');

  if (!fs.existsSync(projectPath) || !fs.statSync(projectPath).isDirectory()) {
    log(`❌ Target directory "${projectPath}" does not exist.`, 'red');
    throw new Error('Target directory not found');
  }

  const gitAvailable = isGitRepository(projectPath);
  if (!gitAvailable) {
    log("⚠️  Target is not a git repository. Changes will still be applied, but you won't be able to review or roll them back via git staging.", 'yellow');
    const proceed = await question(`${COLORS.magenta}Continue anyway? (y/n):${COLORS.reset} `);
    if (proceed.trim().toLowerCase() !== 'y') {
      throw new Error('Update cancelled - target is not a git repository');
    }
  } else {
    const status = spawnSync('git', ['status', '--porcelain'], { cwd: projectPath, stdio: 'pipe' });
    if (status.stdout && status.stdout.toString().trim().length > 0) {
      log('⚠️  You have uncommitted changes. Committing or stashing them first makes it easier to isolate the update diff.', 'yellow');
      const proceed = await question(`${COLORS.magenta}Continue anyway? (y/n):${COLORS.reset} `);
      if (proceed.trim().toLowerCase() !== 'y') {
        throw new Error('Update cancelled - working tree is not clean');
      }
    }
  }

  const tempPath = fs.mkdtempSync(path.join(os.tmpdir(), 'cypress-start-update-'));

  try {
    logStep('2/5', 'Downloading latest template...');
    runRequiredCommand('git', ['clone', '--depth', '1', getTemplateUrl(), tempPath], { stdio: 'pipe' }, 'Failed to download latest template');

    const templateVersion = getTemplateVersion(tempPath);

    logStep('3/5', 'Applying template files...');
    const { newFiles, added, updated } = syncTemplateFiles(projectPath, tempPath);
    log(`  ✓ ${added} added, ${updated} updated`, 'green');

    // Refresh scripts and dependency versions without clobbering user's custom keys.
    const allModules = {};
    for (const key of Object.keys(OPTIONAL_MODULES)) {
      allModules[key] = true;
    }
    await copyOrUpdatePackageJson(projectPath, allModules, tempPath);

    logStep('4/5', 'Removing obsolete files...');
    const previousManifest = readManifest(projectPath);
    if (!previousManifest) {
      log('  ⚠️  No previous manifest found - skipping deletion to avoid removing your files.', 'yellow');
    }
    const deleted = deleteObsoleteFiles(projectPath, previousManifest?.files, newFiles);
    log(`  ✓ ${deleted} obsolete file(s) removed`, 'green');

    writeManifest(projectPath, newFiles, templateVersion);

    logStep('5/5', 'Staging changes for review...');
    if (gitAvailable) {
      runRequiredCommand('git', ['add', '-A'], { cwd: projectPath, stdio: 'pipe' }, 'Failed to stage update changes');
      log('  ✓ All changes staged', 'green');
    } else {
      log('  ⏭️  Skipped (not a git repository)', 'yellow');
    }

    return { projectPath, gitAvailable, added, updated, deleted, templateVersion };
  } finally {
    if (fs.existsSync(tempPath)) {
      fs.rmSync(tempPath, { recursive: true, force: true });
    }
  }
}

async function cleanupGitHistory(projectName) {
  logStep('2/5', 'Initializing fresh repository...');

  const projectPath = path.resolve(projectName);
  const gitPath = path.join(projectPath, '.git');

  // Remove existing .git directory
  if (fs.existsSync(gitPath)) {
    fs.rmSync(gitPath, { recursive: true, force: true });
  }

  // Initialize new git repository
  spawnSync('git', ['init'], { cwd: projectPath, stdio: 'inherit' });
  log('✅ Fresh git repository initialized', 'green');
}

async function setupSensitiveData(projectName, setupMode) {
  // Only setup sensitive data in full mode
  if (setupMode !== 'full') {
    return;
  }

  logStep('3/5', 'Setting up credentials structure...');

  const projectPath = path.resolve(projectName);
  const sensitivePath = path.join(projectPath, 'cypress', 'sensitive-data');
  const examplePath = path.join(sensitivePath, 'env-users.example.json');
  const devUsersPath = path.join(sensitivePath, 'dev-users.json');
  const qaUsersPath = path.join(sensitivePath, 'qa-users.json');

  // Ensure sensitive-data directory exists
  if (!fs.existsSync(sensitivePath)) {
    fs.mkdirSync(sensitivePath, { recursive: true });
  }

  if (fs.existsSync(examplePath)) {
    // Copy example to dev-users.json
    if (!fs.existsSync(devUsersPath)) {
      fs.copyFileSync(examplePath, devUsersPath);
    }
    // Copy example to qa-users.json
    if (!fs.existsSync(qaUsersPath)) {
      fs.copyFileSync(examplePath, qaUsersPath);
    }
    log('✅ Credentials files created from example', 'green');
  }
}

async function installDependencies(projectName) {
  logStep('4/5', 'Installing dependencies...');
  log('This may take a few minutes...', 'yellow');

  const projectPath = path.resolve(projectName);

  try {
    spawnSync('npm', ['install'], { cwd: projectPath, stdio: 'inherit' });
    log('✅ Dependencies installed successfully', 'green');
  } catch {
    log('⚠️  Warning: Failed to install dependencies automatically', 'yellow');
    log('You can run "npm install" manually in your project directory', 'yellow');
  }
}

function printSuccessMessage(projectName, setupMode, selectedModules) {
  const projectPath = path.resolve(projectName);

  let modulesInfo = '';
  if (setupMode === 'full') {
    modulesInfo = `${COLORS.bright}📦 Installed Configuration:${COLORS.reset} Full Setup - All modules included\n\n`;
  } else if (setupMode === 'specific') {
    const includedModules = [];
    const excludedModules = [];

    for (const [key, module] of Object.entries(OPTIONAL_MODULES)) {
      if (selectedModules[key]) {
        includedModules.push(module.name);
      } else {
        excludedModules.push(module.name);
      }
    }

    modulesInfo = `${COLORS.bright}📦 Configuration:${COLORS.reset} Specific Files Only\n\n`;

    if (includedModules.length > 0) {
      modulesInfo += `  ${COLORS.green}✓ Included modules:${COLORS.reset}\n`;
      includedModules.forEach((name) => {
        modulesInfo += `    • ${name}\n`;
      });
      modulesInfo += '\n';
    }

    if (excludedModules.length > 0) {
      modulesInfo += `  ${COLORS.yellow}✗ Excluded modules:${COLORS.reset}\n`;
      excludedModules.forEach((name) => {
        modulesInfo += `    • ${name}\n`;
      });
      modulesInfo += '\n';
    }
  }

  const docsSection = selectedModules?.documentation
    ? `${COLORS.bright}📚 Documentation:${COLORS.reset}
  - Constraints, Examples & Specs: ${COLORS.blue}docs/constraints-examples-specs-approach.md${COLORS.reset}
  - ESLint Custom Rules: ${COLORS.blue}docs/eslint-custom-rules.md${COLORS.reset}
  - Localization Testing: ${COLORS.blue}docs/localization-testing.md${COLORS.reset}
  - FAQ: ${COLORS.blue}docs/faq.md${COLORS.reset}

`
    : '';

  // Full mode vs Specific mode next steps
  let nextSteps;
  if (setupMode === 'full') {
    const lintScript = selectedModules?.eslintCustomRules !== false ? `     npm run lint             ${COLORS.yellow}# Run ESLint checks${COLORS.reset}\n` : '';
    const parallelScript = selectedModules?.parallelRunner !== false ? `     npm run test:parallel     ${COLORS.yellow}# Run tests in parallel${COLORS.reset}\n` : '';

    nextSteps = `${COLORS.bright}🚀 Next steps:${COLORS.reset}

  ${COLORS.cyan}1. Navigate to your project:${COLORS.reset}
     cd ${projectName}

  ${COLORS.cyan}2. Run tests:${COLORS.reset}
     npm run test              ${COLORS.yellow}# Run all tests in headless mode${COLORS.reset}
${lintScript}${parallelScript}     npx cypress open          ${COLORS.yellow}# Open Cypress UI${COLORS.reset}

${docsSection}`;
  } else {
    // Specific files mode - copied files and created/updated package.json
    const navigationStep =
      projectName === '.'
        ? `  ${COLORS.cyan}1. Stay in the current directory:${COLORS.reset}
     ${COLORS.yellow}# Files were copied into the folder where you ran the command${COLORS.reset}`
        : `  ${COLORS.cyan}1. Navigate to the directory:${COLORS.reset}
     cd ${projectName}`;

    nextSteps = `${COLORS.bright}🚀 Next steps:${COLORS.reset}

${navigationStep}

  ${COLORS.cyan}2. Review package.json:${COLORS.reset}
     ${COLORS.yellow}# Scripts and dependencies have been added automatically${COLORS.reset}

  ${COLORS.cyan}3. Install dependencies:${COLORS.reset}
     npm install

  ${COLORS.cyan}4. Start using the files!${COLORS.reset}
     ${COLORS.yellow}# All selected modules are ready to use${COLORS.reset}

${docsSection}`;
  }

  console.log(`
${COLORS.green}${COLORS.bright}
╔═══════════════════════════════════════════════════════════╗
║                                                           ║
║             ✅ ${setupMode === 'full' ? 'Project Created' : 'Files Copied'} Successfully! ✅            ║
║                                                           ║
╚═══════════════════════════════════════════════════════════╝
${COLORS.reset}
${COLORS.bright}📁 Location:${COLORS.reset} ${projectPath}

${modulesInfo}${nextSteps}${COLORS.bright}🔗 Useful Links:${COLORS.reset}
  - GitHub: ${COLORS.blue}https://github.com/IvanZdanovich/cypress-start${COLORS.reset}
  - Cypress Docs: ${COLORS.blue}https://docs.cypress.io${COLORS.reset}

${COLORS.green}Happy Testing! 🎉${COLORS.reset}
  `);
}

function printUpdateSuccess(result) {
  const { projectPath, gitAvailable, added, updated, deleted, templateVersion } = result;

  const rollbackSection = gitAvailable
    ? `${COLORS.bright}↩️  Review & roll back individual changes:${COLORS.reset}
  All changes are staged. Inspect them and undo anything you want to keep:

  ${COLORS.cyan}Review the staged diff:${COLORS.reset}
     git diff --staged

  ${COLORS.cyan}Roll back a specific file (unstage + restore original):${COLORS.reset}
     git restore --staged <file>
     git restore <file>

  ${COLORS.cyan}Roll back everything:${COLORS.reset}
     git restore --staged .
     git restore .
`
    : `${COLORS.yellow}⚠️  This folder is not a git repository, so changes were applied in place
  without staging. Review them manually before committing.${COLORS.reset}
`;

  console.log(`
${COLORS.green}${COLORS.bright}
╔═══════════════════════════════════════════════════════════╗
║                                                           ║
║            ✅ Project Updated Successfully! ✅             ║
║                                                           ║
╚═══════════════════════════════════════════════════════════╝
${COLORS.reset}
${COLORS.bright}📁 Location:${COLORS.reset} ${projectPath}
${COLORS.bright}🏷️  Template version:${COLORS.reset} ${templateVersion || 'unknown'}

${COLORS.bright}📊 Summary:${COLORS.reset}
  ${COLORS.green}• ${added} file(s) added${COLORS.reset}
  ${COLORS.blue}• ${updated} file(s) updated${COLORS.reset}
  ${COLORS.yellow}• ${deleted} obsolete file(s) removed${COLORS.reset}

${rollbackSection}
${COLORS.bright}🔗 Useful Links:${COLORS.reset}
  - GitHub: ${COLORS.blue}https://github.com/IvanZdanovich/cypress-start${COLORS.reset}
  - Cypress Docs: ${COLORS.blue}https://docs.cypress.io${COLORS.reset}

${COLORS.green}Happy Testing! 🎉${COLORS.reset}
  `);
}

async function main() {
  try {
    printBanner();

    // The first CLI argument is the project name (create modes) or the target
    // directory to update (update mode).
    let projectName = process.argv[2];

    // Select setup mode before validating the name, because "update" targets an
    // existing directory whereas the create modes require a fresh one.
    const setupMode = await selectSetupMode();

    let selectedModules = {};

    if (setupMode === 'update') {
      if (!projectName) {
        const answer = await question(`${COLORS.blue}Enter path to the project to update (default: current directory):${COLORS.reset} `);
        projectName = answer.trim() || '.';
      }

      log('\n♻️  Update mode selected - refreshing the project in place', 'cyan');

      const result = await updateProject(projectName);

      rl?.close();
      printUpdateSuccess(result);
      return;
    }

    if (!projectName) {
      projectName = await question(`${COLORS.blue}Enter project name:${COLORS.reset} `);
    }

    // Validate target. Full setup requires a fresh directory; specific-files
    // setup may intentionally copy selected modules into an existing directory
    // such as `.` when running `npx cypress-start .`.
    const isValid = await validateProjectName(projectName, { allowExistingDirectory: setupMode === 'specific' });
    if (!isValid) {
      rl?.close();
      process.exit(1);
    }

    if (setupMode === 'full') {
      // Include all modules
      for (const key of Object.keys(OPTIONAL_MODULES)) {
        selectedModules[key] = true;
      }
      log('\n✅ Full setup selected - all modules will be included', 'green');

      // Execute full setup steps (5 steps)
      await cloneTemplate(projectName);
      await cleanupGitHistory(projectName);
      await setupSensitiveData(projectName, setupMode);

      // Record installed files so future updates can manage them.
      const fullProjectPath = path.resolve(projectName);
      writeManifest(fullProjectPath, buildTemplateFileList(fullProjectPath), getTemplateVersion(fullProjectPath));

      await installDependencies(projectName);

      // Final step
      logStep('5/5', 'Finalizing setup...');
      log('✅ Setup complete', 'green');
    } else if (setupMode === 'specific') {
      // Let user select modules
      log('\n⚙️  Starting module selection...', 'cyan');
      selectedModules = await selectModules();
      log('\n✅ Module selection complete', 'green');

      // Execute specific files setup steps (only 2 steps - no git, no npm)
      await copySpecificFiles(projectName, selectedModules);

      log('\n✅ Files copied successfully!', 'green');
    }

    rl?.close();

    // Print success message
    printSuccessMessage(projectName, setupMode, selectedModules);
  } catch (error) {
    console.error(`\n${COLORS.red}${COLORS.bright}❌ Error:${COLORS.reset} ${error.message}`);
    rl?.close();
    process.exit(1);
  }
}

// Only run the interactive CLI and register the SIGINT handler when this file
// is executed directly, so the module can be required in tests without side effects.
if (require.main === module) {
  // Handle SIGINT (Ctrl+C)
  process.on('SIGINT', () => {
    console.log(`\n\n${COLORS.yellow}Setup cancelled by user${COLORS.reset}`);
    rl?.close();
    process.exit(0);
  });

  main();
}

module.exports = {
  OPTIONAL_MODULES,
  MANIFEST_FILE,
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
};
