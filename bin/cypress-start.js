#!/usr/bin/env node

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');
const readline = require('readline');

const GITHUB_TEMPLATE_URL = 'https://github.com/IvanZdanovich/cypress-start.git';
const COLORS = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  green: '\x1b[32m',
  blue: '\x1b[34m',
  yellow: '\x1b[33m',
  red: '\x1b[31m',
  cyan: '\x1b[36m',
};

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

function question(query) {
  return new Promise((resolve) => rl.question(query, resolve));
}

function log(message, color = 'reset') {
  console.log(`${COLORS[color]}${message}${COLORS.reset}`);
}

function logStep(step, message) {
  console.log(`\n${COLORS.cyan}[${step}]${COLORS.reset} ${message}`);
}

function printBanner() {
  console.log(`
${COLORS.bright}${COLORS.blue}╔═══════════════════════════════════════════════════════════╗
║                                                           ║
║        🚀 Cypress Testing Framework Starter 🚀            ║
║                                                           ║
║     Professional test automation framework template       ║
║                                                           ║
╚═══════════════════════════════════════════════════════════╝${COLORS.reset}
  `);
}

async function validateProjectName(projectName) {
  if (!projectName) {
    log('❌ Project name is required!', 'red');
    return false;
  }

  const projectPath = path.resolve(projectName);
  if (fs.existsSync(projectPath)) {
    log(`❌ Directory "${projectName}" already exists!`, 'red');
    return false;
  }

  return true;
}

async function cloneTemplate(projectName) {
  logStep('1/5', 'Cloning template from GitHub...');

  try {
    execSync(`git clone --depth 1 ${GITHUB_TEMPLATE_URL} "${projectName}"`, { stdio: 'inherit' });
    log('✅ Template cloned successfully', 'green');
  } catch (error) {
    log('❌ Failed to clone template. Please check your internet connection.', 'red');
    throw error;
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
  execSync('git init', { cwd: projectPath, stdio: 'inherit' });
  log('✅ Fresh git repository initialized', 'green');
}

async function setupSensitiveData(projectName) {
  logStep('3/5', 'Setting up credentials structure...');

  const projectPath = path.resolve(projectName);
  const sensitivePath = path.join(projectPath, 'cypress', 'sensitive-data');
  const examplePath = path.join(sensitivePath, 'env-users.example.json');
  const devUsersPath = path.join(sensitivePath, 'dev-users.json');

  // Ensure sensitive-data directory exists
  if (!fs.existsSync(sensitivePath)) {
    fs.mkdirSync(sensitivePath, { recursive: true });
  }

  // Copy example to dev-users.json
  if (fs.existsSync(examplePath) && !fs.existsSync(devUsersPath)) {
    fs.copyFileSync(examplePath, devUsersPath);
    log('✅ Credentials file created from example', 'green');
  }
}

async function installDependencies(projectName) {
  logStep('4/5', 'Installing dependencies...');
  log('This may take a few minutes...', 'yellow');

  const projectPath = path.resolve(projectName);

  try {
    execSync('npm install', { cwd: projectPath, stdio: 'inherit' });
    log('✅ Dependencies installed successfully', 'green');
  } catch {
    log('⚠️  Warning: Failed to install dependencies automatically', 'yellow');
    log('You can run "npm install" manually in your project directory', 'yellow');
  }
}

async function configureProject(projectName) {
  logStep('5/5', 'Configuration (optional)...');

  const configure = await question(`${COLORS.blue}Would you like to configure the base URL now? (y/n):${COLORS.reset} `);

  if (configure.toLowerCase() === 'y') {
    const baseUrl = await question(`${COLORS.blue}Enter your application base URL (e.g., https://www.saucedemo.com):${COLORS.reset} `);

    if (baseUrl) {
      const projectPath = path.resolve(projectName);
      const configPath = path.join(projectPath, 'cypress.config.js');

      try {
        let config = fs.readFileSync(configPath, 'utf8');
        config = config.replace(/baseUrl:\s*['"][^'"]*['"]/, `baseUrl: '${baseUrl}'`);
        fs.writeFileSync(configPath, config);
        log(`✅ Base URL configured: ${baseUrl}`, 'green');
      } catch {
        log('⚠️  Warning: Could not update configuration automatically', 'yellow');
      }
    }
  } else {
    log('⏭️  Skipping configuration. You can update cypress.config.js later.', 'cyan');
  }
}

function printSuccessMessage(projectName) {
  const projectPath = path.resolve(projectName);

  console.log(`
${COLORS.green}${COLORS.bright}
╔═══════════════════════════════════════════════════════════╗
║                                                           ║
║             ✅ Project Created Successfully! ✅            ║
║                                                           ║
╚═══════════════════════════════════════════════════════════╝
${COLORS.reset}
${COLORS.bright}📁 Project location:${COLORS.reset} ${projectPath}

${COLORS.bright}🚀 Next steps:${COLORS.reset}

  ${COLORS.cyan}1. Navigate to your project:${COLORS.reset}
     cd ${projectName}

  ${COLORS.cyan}2. Configure credentials:${COLORS.reset}
     Edit: cypress/sensitive-data/dev-users.json

  ${COLORS.cyan}3. Update configuration (if needed):${COLORS.reset}
     Edit: cypress.config.js

  ${COLORS.cyan}4. Run tests:${COLORS.reset}
     npm run test              ${COLORS.yellow}# Run all tests in headless mode${COLORS.reset}
     npx cypress open          ${COLORS.yellow}# Open Cypress UI${COLORS.reset}

${COLORS.bright}📚 Documentation:${COLORS.reset}
  - Test Writing Guidelines: ${COLORS.blue}docs/test-writing-guideline.md${COLORS.reset}
  - Naming Conventions: ${COLORS.blue}docs/naming-conventions.md${COLORS.reset}
  - Localization Testing: ${COLORS.blue}docs/localization-testing.md${COLORS.reset}
  - FAQ: ${COLORS.blue}docs/faq.md${COLORS.reset}

${COLORS.bright}🔗 Useful Links:${COLORS.reset}
  - GitHub: ${COLORS.blue}https://github.com/IvanZdanovich/cypress-start${COLORS.reset}
  - Cypress Docs: ${COLORS.blue}https://docs.cypress.io${COLORS.reset}

${COLORS.green}Happy Testing! 🎉${COLORS.reset}
  `);
}

async function main() {
  try {
    printBanner();

    // Get project name
    let projectName = process.argv[2];

    if (!projectName) {
      projectName = await question(`${COLORS.blue}Enter project name:${COLORS.reset} `);
    }

    // Validate project name
    const isValid = await validateProjectName(projectName);
    if (!isValid) {
      rl.close();
      process.exit(1);
    }

    // Execute setup steps
    await cloneTemplate(projectName);
    await cleanupGitHistory(projectName);
    await setupSensitiveData(projectName);
    await installDependencies(projectName);
    await configureProject(projectName);

    rl.close();

    // Print success message
    printSuccessMessage(projectName);
  } catch (error) {
    console.error(`\n${COLORS.red}${COLORS.bright}❌ Error:${COLORS.reset} ${error.message}`);
    rl.close();
    process.exit(1);
  }
}

// Handle SIGINT (Ctrl+C)
process.on('SIGINT', () => {
  console.log(`\n\n${COLORS.yellow}Setup cancelled by user${COLORS.reset}`);
  rl.close();
  process.exit(0);
});

main();
