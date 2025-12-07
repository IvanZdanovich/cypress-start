# Cypress Testing Framework

<p style="text-align: center;">  
    <picture>
      <source media="(prefers-color-scheme: dark)"  srcset="./assets/cypress-logo-dark.png">
      <source media="(prefers-color-scheme: light)" srcset="./assets/cypress-logo-light.png">
      <img alt="Cypress Logo" src="./assets/cypress-logo-light.png">
    </picture>
</p>

## Table of Contents

- [Quick Start](#quick-start)
- [Overview](#overview)
- [What Makes This Framework Unique?](#what-makes-this-framework-unique)
- [Features](#features)
- [Running Tests](#running-tests)
- [Development Guidelines](#development-guidelines)
- [Quality Standards](#quality-standards)
- [Troubleshooting](#troubleshooting)

## Quick Start

Create a new project from this template in seconds! The CLI offers two setup modes to match your needs:

### Setup Modes

#### 🎯 Mode 1: Full Setup (Recommended)
Complete framework with all features including:
- ✅ Complete test suite (E2E & Integration UI/API tests)
- ✅ Test data and development data
- ✅ ESLint custom rules with app structure validation
- ✅ Comprehensive documentation and bug tracking system
- ✅ GitHub Copilot instructions
- ✅ Parallel test runner
- ✅ GitHub Actions workflow
- ✅ Docker support
- ✅ Git repository initialized
- ✅ Dependencies installed automatically

**Best for:** New standalone projects or teams wanting the complete testing framework experience.

**Result:** Ready-to-use Cypress project with all tests, data, and tooling configured.

#### 📦 Mode 2: Specific Files
Copy only selected modules to your existing project:
- Choose from: ESLint Rules, Documentation, Copilot Instructions, Parallel Runner, GitHub Workflow, Docker
- Files are copied without git initialization or npm install
- Package.json is created or updated automatically with required scripts and dependencies
- No tests, test-data, or development-data included

**Best for:** Adding specific features to an existing project or cherry-picking functionality.

**Result:** Selected files copied + package.json configured. You run `npm install` manually.

### Available Modules (Specific Files Mode)

1. **ESLint Custom Rules** - Custom ESLint rules for test title standardization and validation
   - Includes: `eslint-plugin-custom-rules/`, `eslint.config.mjs`, `app-structure/`, git hooks setup
   - Scripts: `lint`, `postinstall` (sets up pre-commit hooks)
   
2. **Documentation** - Comprehensive testing guidelines, conventions, and best practices
   - Includes: `docs/` folder with all documentation
   
3. **Copilot Instructions** - GitHub Copilot configuration and test-specific instructions
   - Includes: `.github/copilot-instructions.md`, `.github/instructions/`
   
4. **Parallel Test Execution** - Script for running tests in parallel
   - Includes: `scripts/parallel-cypress-runner.js`
   - Scripts: `test:parallel`
   
5. **GitHub Actions Workflow** - CI/CD workflows for automated test execution
   - Includes: `.github/workflows/`
   
6. **Docker Support** - Dockerfile for containerized test execution
   - Includes: `Dockerfile`, `.dockerignore`

### Prerequisites

- Node.js (latest LTS version)
- npm or yarn
- Git

### 🚀 Create New Project with cypress-start CLI (Recommended)

```bash
# Using npx (no installation required)
npx cypress-start my-project

# Or install globally first
npm install -g cypress-start
cypress-start my-project
```

The CLI will guide you through the setup process interactively:

**Mode 1: Full Setup**
1. Enter your project name (or pass it as an argument)
2. Select mode: `1` for Full Setup
3. Wait for automatic setup to complete

The setup automatically:
- ✅ Clones the complete repository
- ✅ Initializes a fresh git repository
- ✅ Sets up credentials structure
- ✅ Installs all dependencies
- ✅ Configures pre-commit quality checks

**Result:** Complete, ready-to-use Cypress project with tests, data, and all features.

```bash
cd my-project
npm run test              # Run all tests
npm run lint              # Run ESLint checks
npm run test:parallel     # Run tests in parallel
npx cypress open          # Open Cypress UI
```

**Mode 2: Specific Files**
1. Enter your project name (or navigate to existing project first)
2. Select mode: `2` for Specific Files
3. Choose which modules to include (y/n for each)
4. Wait for files to be copied

The setup:
- ✅ Copies only selected module files
- ✅ Creates or updates package.json with scripts and dependencies
- ❌ Does NOT initialize git
- ❌ Does NOT install dependencies (you run `npm install` manually)
- ❌ Does NOT include tests or test-data

**Result:** Selected files copied to your project with package.json configured.

```bash
cd my-project
npm install               # Install dependencies
npm run lint              # Use added features
```

**Note:** Pre-commit checks (when ESLint module is included) run automatically before every commit to maintain code quality.

### 📋 Alternative: GitHub Template

If you prefer using GitHub's template feature:

1. Click the **"Use this template"** button at the top of this repository
2. Choose "Create a new repository"
3. Clone your new repository:
   ```bash
   git clone https://github.com/YOUR-USERNAME/your-repo-name.git
   cd your-repo-name
   npm install  # Automatically sets up pre-commit hooks
   ```
4. Copy `cypress/sensitive-data/env-users.example.json` to `cypress/sensitive-data/dev-users.json`

### 🔗 Alternative: Manual Clone

For direct cloning without the CLI:

```bash
git clone https://github.com/IvanZdanovich/cypress-start.git my-project
cd my-project
npm install  # Automatically sets up pre-commit hooks
```

Set up sensitive data:
Copy `cypress/sensitive-data/env-users.example.json` to `cypress/sensitive-data/dev-users.json` to provide test user credentials for the test environment.

---

## Cypress-Start CLI

The `cypress-start` CLI tool provides a streamlined way to create new projects or add specific features to existing ones.

### Installation

```bash
# Run directly with npx (no installation needed)
npx cypress-start my-project

# Or install globally
npm install -g cypress-start
cypress-start my-project
```

### Usage Examples

#### Example 1: New Complete Project
```bash
npx cypress-start my-test-project
# Select: 1 (Full Setup)
# → Creates complete Cypress project with all features
```

#### Example 2: Add ESLint to Existing Project
```bash
cd my-existing-project
npx cypress-start eslint-config
# Select: 2 (Specific Files)
# ESLint Custom Rules? y
# Others? n
# → Copies ESLint files and updates package.json
# Then run: npm install
```

#### Example 3: Copy Documentation Only
```bash
npx cypress-start docs-copy
# Select: 2 (Specific Files)
# Documentation? y
# Others? n
# → Copies only docs/ folder
```

#### Example 4: Multiple Modules
```bash
cd my-project
npx cypress-start features
# Select: 2 (Specific Files)
# ESLint? y
# Documentation? y
# Copilot Instructions? y
# Parallel Runner? y
# Others? n
# → Copies all selected modules and updates package.json
```

### Mode Comparison

| Feature | Full Setup | Specific Files |
|---------|-----------|----------------|
| **Target Use Case** | New standalone project | Add to existing project |
| **Test Files** | ✅ Included | ❌ Not included |
| **Test Data** | ✅ Included | ❌ Not included |
| **Module Selection** | All modules | Choose modules |
| **Git Initialization** | ✅ Yes | ❌ No |
| **NPM Install** | ✅ Automatic | ❌ Manual |
| **Package.json** | ✅ Complete | ✅ Created or merged |
| **Ready to Use** | ✅ Immediately | After `npm install` |

### Package.json Handling (Specific Files Mode)

**Scenario 1: Existing package.json**
- Merges scripts and dependencies into your existing file
- Preserves all existing content
- No conflicts, just additions

**Scenario 2: No package.json**
- Creates minimal package.json with only scripts and dependencies
- You should add name, version, etc. with `npm init` if needed

**Example Output:**
```json
{
  "scripts": {
    "lint": "eslint . --format stylish --fix",
    "test:parallel": "node scripts/parallel-cypress-runner.js",
    "postinstall": "node scripts/setup-git-hooks.js"
  },
  "devDependencies": {
    "@eslint/js": "^9.17.0",
    "eslint": "^9.17.0",
    "glob": "^11.0.0"
  }
}
```

---

## Overview

Unlock rapid and reliable testing with framework, developed using Cypress and JavaScript. Designed to scale
effortlessly, it is suitable for projects of any size.
This framework includes examples of tests:

- Integration and E2E UI tests for the [Swag Labs Demo application](https://www.saucedemo.com/).
- Integration API tests [Restful Booker API playground](https://restful-booker.herokuapp.com/apidoc/)

![Alt text](assets/execution-example.gif)

---

## What Makes This Framework Unique?

- **No Abstractions**: No redundant abstraction layers such as Page Object Models or BDD frameworks. The framework
  provides a defined structure and naming conventions, using Gherkin syntax to make tests self-descriptive, readable,
  and
  understandable for non-technical personnel.
- **Comprehensive Use Case Documentation**: All business use cases are described in detail, regardless of their
  automation status. This approach provides accurate coverage metrics, eliminates test gaps, and serves as a solid
  source of truth
  for the entire team.
- **Scalability**: The simple yet efficient approach makes the framework easily extendable for future needs.
- **Maintainability**: Clear project structure and comprehensive documentation for easy onboarding,
  effortless maintenance, and test writing.
- **Robustness**: Designed with Cypress to handle complex test scenarios with ease.
- **Lightweight and Easy Startup**: Quick setup with minimal configuration. The low number of third-party dependencies
  helps avoid conflicts and ensures fast build times.

---

## Features

- **Interactive CLI Setup:** Fast project creation with `cypress-start` CLI offering two setup modes:
  - **Full Setup:** Complete framework with all features, tests, and data
  - **Specific Files:** Copy only selected modules to existing projects
- **Parallel Test Execution:** Run tests in parallel within a single Docker container with configurable stream count for
  faster execution.  
  See [Parallel Execution Guide](docs/parallel-execution.md).
- **Custom ESLint Rules:** Enforces strict test structure and naming conventions, preventing duplicate or invalid test
  titles.  
  See [Custom ESLint Rules](docs/eslint-custom-rules.md).
- **Localization Testing:** Dynamically loads and validates localization files, supporting multi-language test runs.  
  See [Localization Testing](docs/localization-testing.md).
- **Color Theme Testing:** Easily test across multiple color themes using environment variables.  
  See [Color Theme Testing](docs/colour-theme-testing.md).
- **Centralized Selector Management:** All selectors are managed in a single location for maintainability and
  consistency.
- **Pre-commit Quality Checks:** Automated linting and code quality checks before every commit.  
  See [Pre-commit Check](docs/pre-commit-check.md).
- **Test Structure Guidelines:** Detailed documentation for writing maintainable, readable, and robust tests.  
  See [Test Writing Guideline](docs/test-writing-guideline.md), [Naming Conventions](docs/naming-conventions.md), [Tagging Strategy](docs/tagging-strategy.md), [FAQ](docs/faq.md).
- **Copilot Integration:** AI-assisted test writing with ready-to-use instructions.  
  See [Copilot Instructions](.github/copilot-instructions.md).
- **Copilot Prompts:** Ready-to-use prompts for AI-assisted test writing.  
  See [Copilot Prompts](docs/copilot-prompts.md).
- **Prepared Continuous Integration Sample:** Weekly regression test workflow integrated for automated test execution.
  See [Weekly Cypress Tests Workflow](.github/workflows/weekly-cypress-tests.yml).

---

## Running Tests

### Standard Test Run

To run tests with default settings in headless mode:

```bash
  npm run test
```

### Parallel Test Execution

To run tests in parallel for faster execution:

```bash
  # Default (3 parallel streams)
  npm run test:parallel

  # Custom stream count
  PARALLEL_STREAMS=6 npm run test:parallel
```

See [Parallel Execution Guide](docs/parallel-execution.md) for detailed documentation.

### Environment-Specific Test Run

To run tests with specific language and environment parameters in headless mode:

#### Windows (PowerShell):

```powershell
  $env:LANGUAGE="en"; $env:COLOUR_THEME="default"; $env:TARGET_ENV="qa"; $env:BROWSER="chrome"; npm run test
```

#### Windows (CMD):

```cmd
  set LANGUAGE=en&& set COLOUR_THEME=default&& set TARGET_ENV=qa&& set BROWSER=chrome&& npm run test
```

#### macOS/Linux:

```bash
  LANGUAGE=en COLOUR_THEME=default TARGET_ENV=dev BROWSER=electron npm run test
```

---

Available environment parameters:

- `LANGUAGE`: Specifies the language code (defaults to `en`)
- `TARGET_ENV`: Specifies the target environment (defaults to `dev`)
- `COLOUR_THEME`: Specifies the colour theme to use (defaults to `default`)

### Debug Mode

For interactive debugging with the Cypress UI:

#### Windows (PowerShell):

```powershell
  $env:LANGUAGE="en"; $env:TARGET_ENV="dev"; $env:COLOUR_THEME="default"; npm run pretest; npx cypress open
```

#### Windows (CMD):

```cmd
  set LANGUAGE=en&& set TARGET_ENV=dev&& set COLOUR_THEME=default&& npm run pretest&& npx cypress open
```

#### macOS/Linux (with caffeinate to prevent system from sleeping):

```bash
  LANGUAGE=en COLOUR_THEME=default npm run pretest && TARGET_ENV=dev caffeinate -i npx cypress open
```

---

## Development Guidelines

- [Parallel Execution Guide](docs/parallel-execution.md)
- [Test Writing Guideline](docs/test-writing-guideline.md)
- [FAQ](docs/faq.md)
- [Naming Conventions](docs/naming-conventions.md)
- [Git Strategy](docs/git-strategy.md)
- [Bug Tracking](docs/bug-tracking.md)
- [Localization Testing](docs/localization-testing.md)
- [Color Theme Testing](docs/colour-theme-testing.md)
- [Copilot Prompts](docs/copilot-prompts.md)
- [Copilot Instructions](.github/copilot-instructions.md)
- [Copilot Instructions for Integration API Tests](.github/instructions/integration-api-tests.instructions.md)
- [Copilot Instructions for Integration UI Tests](.github/instructions/integration-ui-tests.instructions.md)
- [Copilot Instructions for E2E UI Tests](.github/instructions/e2e-ui-tests.instructions.md)

---

## Quality Standards

- [Custom ESLint Rules](docs/eslint-custom-rules.md)
- [Pre-commit Check](docs/pre-commit-check.md)
- [Tagging Strategy](docs/tagging-strategy.md)

---

## Troubleshooting

### Common Issues

- **Pretest script fails:** Ensure you have the correct language and theme files in the appropriate directories.
- **Test isolation issues:** Check that `testIsolation: false` is set on the relevant `describe` blocks.
- **Localization errors:** Verify that the language file contains all required keys.
- **ESLint errors:** Run `npm run lint` to identify specific issues.

### Updating Dependencies

To update all dependencies to their latest versions:

```bash
  npx npm-check-updates -u
```

Then, reinstall the dependencies:

```bash
  npm install
```
 