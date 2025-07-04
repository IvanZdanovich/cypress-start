# Cypress Testing Framework

## Table of Contents

- [Overview](#overview)
- [What Makes This Framework Unique?](#what-makes-this-framework-unique)
- [Project Structure](#project-structure)
- [Features](#features)
- [Getting Started](#getting-started)
- [Running Tests](#running-tests)
- [Development Guidelines](#development-guidelines)
- [Quality Standards](#quality-standards)
- [Branching and Merge Strategy](#branching-and-merge-strategy)
- [Contributing](#contributing)
- [Troubleshooting](#troubleshooting)

## Overview

A comprehensive testing framework for the Swag Labs e-commerce application, built with Cypress and written in JavaScript. It features integration and E2E tests, robust infrastructure for test maintenance, and detailed documentation.

---

## What Makes This Framework Unique?

This framework offers:

- **Custom ESLint Rules**: Enforces strict test structure and naming conventions, preventing duplicate or invalid test titles.  
  See [Custom ESLint Rules](docs/eslint-custom-rules.md).
- **Localization Testing**: Dynamically loads and validates localization files, supporting multi-language test runs.  
  See [Localization Testing](docs/localization-testing.md).
- **Color Theme Testing**: Easily test across multiple color themes using environment variables.  
  See [Color Theme Testing](docs/colour-theme-testing.md).
- **Centralized Selector Management**: All selectors are managed in a single location for maintainability and consistency.
- **Pre-commit Quality Checks**: Automated linting and code quality checks before every commit.  
  See [Pre-commit Check](docs/pre-commit-check.md).
- **Test Structure Guidelines**: Detailed documentation for writing maintainable, readable, and robust tests.  
  See [Test Writing Guideline](docs/test-writing-guideline.md), [Naming Conventions](docs/naming-conventions.md), [Tagging Strategy](docs/tagging-strategy.md), [FAQ](docs/faq.md).
- **Copilot Prompts**: Ready-to-use prompts for AI-assisted test writing.  
  See [Copilot Prompts](docs/copilot-prompts.md).

---

## Getting Started

### Prerequisites

- Node.js (latest LTS version)
- npm or yarn
- Git

### Installation

1. Clone the repository:

   ```bash
   git clone <repository-url>
   cd cypress-start
   ```

2. Install dependencies:

   ```bash
   npm install
   ```

3. Set up sensitive data:

   - Copy `cypress/sensitive-data/env-users.example.json` to `cypress/sensitive-data/dev-users.json` and provide test user credentials in the new file.

---

## Running Tests

### Standard Test Run

To run tests with default settings in headless mode:

```bash
npm run test
```

To run tests with specific language and environment parameters in headless mode:

```bash
LANGUAGE=en TARGET_ENV=dev npm run test
```

Available environment parameters:

- `LANGUAGE`: Specifies the language code (defaults to `en`)
- `TARGET_ENV`: Specifies the target environment (defaults to `dev`)
- `COLOUR_THEME`: Specifies the color theme to use (defaults to `default`)

### Debug Mode

For interactive debugging with the Cypress UI:

#### Windows:

```bash
LANGUAGE=en TARGET_ENV=dev npm run pretest && npx cypress open
```

#### macOS with caffeine (prevents system from sleeping):

```bash
LANGUAGE=en TARGET_ENV=dev npm run pretest && caffeinate -i npx cypress open
```

---

## Development Guidelines

- [Test Writing Guideline](docs/test-writing-guideline.md)
- [FAQ](docs/faq.md)
- [Naming Conventions](docs/naming-conventions.md)
- [Bug Tracking](docs/bug-tracking.md)
- [Localization Testing](docs/localization-testing.md)
- [Color Theme Testing](docs/colour-theme-testing.md)
- [Copilot Prompts](docs/copilot-prompts.md)

---

## Quality Standards

- [Custom ESLint Rules](docs/eslint-custom-rules.md)
- [Pre-commit Check](docs/pre-commit-check.md)
- [Tagging Strategy](docs/tagging-strategy.md)
- [Git Strategy](docs/git-strategy.md)

---

## Troubleshooting

### Common Issues

- **Pretest script fails**: Ensure you have the correct language and theme files in the appropriate directories.
- **Test isolation issues**: Check that `testIsolation: false` is set on the relevant `describe` blocks.
- **Localization errors**: Verify that the language file contains all required keys.
- **ESLint errors**: Run `npm run lint` to identify specific issues.

### Updating Dependencies

To update all dependencies to their latest versions:

```bash
npx npm-check-updates -u
npm install
```