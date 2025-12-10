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
    - [Standard Test Run](#standard-test-run)
    - [Parallel Test Execution](#parallel-test-execution)
    - [Environment-Specific Test Run](#environment-specific-test-run)
    - [Debug Mode](#debug-mode)
    - [GitHub Actions Workflow](#github-actions-workflow)
- [Documentation](#documentation)
- [Troubleshooting](#troubleshooting)

## Quick Start

Create a new project from this template in seconds! The CLI offers two setup modes to match your needs:

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

The CLI guides you through two setup modes:

#### 🎯 Mode 1: Full Setup (Recommended)

Complete framework with all features, tests, and data. Git initialized, dependencies auto-installed.  
**Best for:** New standalone projects.

#### 📦 Mode 2: Specific Files

Cherry-pick modules (ESLint, Docs, Copilot, Parallel Runner, GitHub Actions, Docker) for existing projects.  
Package.json updated automatically. Manual `npm install` required.  
**Best for:** Adding features to existing projects.

```bash
cd my-project
npm run test              # Run all tests
npm run test:parallel     # Run tests in parallel
npm run lint              # Run ESLint checks
npx cypress open          # Open Cypress UI
```

### Alternative Setup Methods

**GitHub Template:**

1. Click **"Use this template"** → "Create a new repository"
2. Clone: `git clone https://github.com/YOUR-USERNAME/your-repo-name.git`

**Direct Clone:**

```bash
git clone https://github.com/IvanZdanovich/cypress-start.git my-project
cd my-project
```

**Post-Setup:**

```bash
npm install  # Installs dependencies and sets up pre-commit hooks
```

Copy `cypress/sensitive-data/env-users.example.json` to `cypress/sensitive-data/dev-users.json` for test credentials.

---

### Mode Comparison

| Feature                | Full Setup             | Specific Files          |
|------------------------|------------------------|-------------------------|
| **Target Use Case**    | New standalone project | Add to existing project |
| **Test Files**         | ✅ Included             | ❌ Not included          |
| **Test Data**          | ✅ Included             | ❌ Not included          |
| **Module Selection**   | All modules            | Choose modules          |
| **Git Initialization** | ✅ Yes                  | ❌ No                    |
| **NPM Install**        | ✅ Automatic            | ❌ Manual                |
| **Package.json**       | ✅ Complete             | ✅ Created or merged     |
| **Ready to Use**       | ✅ Immediately          | After `npm install`     |

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

- **Interactive CLI Setup:** Two setup modes - Full Setup (complete framework) or Specific Files (cherry-pick modules)
- **Parallel Test Execution:** Run tests in parallel with configurable stream count ([docs](docs/parallel-execution.md))
- **Custom ESLint Rules:** Enforces test structure and naming conventions ([docs](docs/eslint-custom-rules.md))
- **Localization Testing:** Multi-language test support ([docs](docs/localization-testing.md))
- **Color Theme Testing:** Multiple theme support via environment variables ([docs](docs/colour-theme-testing.md))
- **Centralized Selector Management:** All selectors in one location for easy maintenance
- **Pre-commit Quality Checks:** Automated linting before every commit ([docs](docs/pre-commit-check.md))
- **Comprehensive Documentation:** Test writing guidelines, naming conventions, FAQ ([docs](docs/))
- **AI-Assisted Development:** GitHub Copilot integration with ready-to-use instructions
- **CI/CD Integration:** GitHub Actions workflow with dynamic test filtering and Docker support

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

Run tests with specific environment parameters in headless mode:

**Environment Parameters:**

- `LANGUAGE`: Language code (default: `en`)
- `TARGET_ENV`: Target environment (default: `dev`)
- `COLOUR_THEME`: Color theme (default: `default`)
- `BROWSER`: Browser for execution (default: `chrome`)

**Windows (PowerShell):**

```powershell
$env:LANGUAGE="en"; $env:COLOUR_THEME="default"; $env:TARGET_ENV="qa"; $env:BROWSER="chrome"; npm run test
```

**Windows (CMD):**

```cmd
set LANGUAGE=en&& set COLOUR_THEME=default&& set TARGET_ENV=qa&& set BROWSER=chrome&& npm run test
```

**macOS/Linux:**

```bash
LANGUAGE=en COLOUR_THEME=default TARGET_ENV=dev BROWSER=chrome npm run test
```

### Debug Mode

For interactive debugging with the Cypress UI:

**Windows (PowerShell):**

```powershell
$env:LANGUAGE="en"; $env:TARGET_ENV="dev"; $env:COLOUR_THEME="default"; npm run pretest; npx cypress open
```

**Windows (CMD):**

```cmd
set LANGUAGE=en&& set TARGET_ENV=dev&& set COLOUR_THEME=default&& npm run pretest&& npx cypress open
```

**macOS/Linux:**

```bash
LANGUAGE=en COLOUR_THEME=default npm run pretest && TARGET_ENV=dev caffeinate -i npx cypress open
```

---

### GitHub Actions Workflow

Automated CI/CD workflow with weekly scheduled runs or manual triggers:

**Quick Start:**

1. Go to **Actions** tab → Select **"Weekly Cypress Tests"**
2. Click **"Run workflow"** → Configure parameters → Click **"Run workflow"**

**Available Parameters:**

| Parameter          | Options                         | Default |
|--------------------|---------------------------------|---------|
| `language`         | en                              | en      |
| `target_env`       | dev                             | dev     |
| `colour_theme`     | default                         | default |
| `parallel_streams` | 1-6                             | 3       |
| `browser`          | electron, chrome, firefox, edge | chrome  |
| `test_scope`       | all, integration, e2e           | all     |
| `test_type`        | all, api, ui                    | all     |

**Test Filtering Examples:**

| Scope           | Type    | What Runs                        |
|-----------------|---------|----------------------------------|
| **all**         | **all** | All tests in the workspace       |
| **all**         | **api** | All API tests (integration only) |
| **all**         | **ui**  | All UI tests (integration + e2e) |
| **integration** | **all** | All integration tests (api + ui) |
| **integration** | **api** | Integration API tests only       |
| **integration** | **ui**  | Integration UI tests only        |
| **e2e**         | **all** | All E2E tests                    |
| **e2e**         | **ui**  | E2E UI tests only                |

**Viewing Results:** Check **Actions** tab for run status. Download artifacts (reports, screenshots, videos) after
completion.

---

## Documentation

**Test Development:**

- [Test Writing Guideline](docs/test-writing-guideline.md)
- [Naming Conventions](docs/naming-conventions.md)
- [FAQ](docs/faq.md)

**Features & Tools:**

- [Parallel Execution Guide](docs/parallel-execution.md)
- [Localization Testing](docs/localization-testing.md)
- [Color Theme Testing](docs/colour-theme-testing.md)
- [Bug Tracking](docs/bug-tracking.md)

**Quality & Standards:**

- [Custom ESLint Rules](docs/eslint-custom-rules.md)
- [Pre-commit Check](docs/pre-commit-check.md)
- [Tagging Strategy](docs/tagging-strategy.md)

**Git & Collaboration:**

- [Git Strategy](docs/git-strategy.md)
- [Copilot Prompts](docs/copilot-prompts.md)
- [Copilot Instructions](.github/copilot-instructions.md)
- [Integration API Tests Instructions](.github/instructions/integration-api-tests.instructions.md)
- [Integration UI Tests Instructions](.github/instructions/integration-ui-tests.instructions.md)
- [E2E UI Tests Instructions](.github/instructions/e2e-ui-tests.instructions.md)

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
 