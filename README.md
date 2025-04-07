# Cypress Testing Framework

## Table of Contents

- [Overview](#overview)
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

A comprehensive testing framework for Swag Labs e-commerce application, based on Cypress, written on javascript,
featuring Integration and E2E tests, robust infrastructure for test maintenance, and detailed documentation.

## Features

- **Localization Support**: Dynamic loading of localization strings from JSON files based on language
  code. [Documentation](docs/localization-testing.md)
- **Color Theme Testing**: Support for different color themes with environment
  variables. [Documentation](docs/colour-theme-testing.md)
- **Custom ESLint Rules**: Enforces code quality standards and test
  structure. [Documentation](docs/eslint-custom-rules.md)
- **Pre-commit Quality Checks**: Automated code quality verification with
  thresholds. [Documentation](docs/pre-commit-check.md)
- **Test Structure Guidelines**: Describes the proper test structure for readability and
  maintenance. [Documentation](docs/test-writing-guideline.md)
- **Selector Management**: Centralized selector storage for better maintainability.
- **Bug Tracking**: Central repository for known issues with references in tests. [Documentation](docs/bug-tracking.md)

## Getting Started

### Prerequisites

- Node.js (latest LTS version)
- npm or yarn
- Git

### Installation

1. Clone the repository:

```bash
git clone <repository-url>
```

```bash
cd cypress-start
```

2. Install dependencies:

```bash
npm install
```

3. Set up sensitive data:

- Create a directory: `cypress/sensitive-data`
- Add necessary test user credentials following the required format

## Running Tests

### Standard Test Run

To run tests with specific language and environment:

```bash
LANGUAGE=en TARGET_ENV=dev npm run test
```

Available environment variables:

- `LANGUAGE`: Specifies the language code (defaults to "en")
- `TARGET_ENV`: Specifies the target environment (dev, qa, stage, prod)
- `COLOUR_THEME`: Specifies the color theme to use (defaults to "default")

### Debug Mode

For interactive debugging with Cypress UI:

#### Windows:

```bash
LANGUAGE=en,TARGET_ENV=dev npm run pretest && npx cypress open
```

#### Mac with caffeine (prevents system from sleeping):

```bash
TARGET_ENV=dev LANGUAGE=en npm run pretest && caffeinate -i npx cypress open
```

## Development Guidelines

### [Test Writing Guideline](docs/test-writing-guideline.md)

### [Naming Conventions](docs/naming-conventions.md)

### [Bug Tracking](docs/bug-tracking.md)

### [Localization Testing](docs/localization-testing.md)

### [Color Theme Testing](docs/colour-theme-testing.md)

### [Copilot Prompts](docs/copilot-prompts.md)

## Quality Standards

### Custom ESLint Rules

### [Custom ESLint rules](docs/eslint-custom-rules.md)

### [Pre-commit check](docs/pre-commit-check.md)

### [Tagging Strategy](docs/tagging-strategy.md)

### [Git Strategy](docs/git-strategy.md)

## Troubleshooting

### Common Issues

- **Pretest script fails**: Ensure you have the correct language and theme files in the appropriate directories
- **Test isolation issues**: Check that `testIsolation: false` is set on describe blocks
- **Localization errors**: Verify that the language file contains all required keys
- **ESLint errors**: Run `npm run lint` to identify specific issues

### Updating Dependencies

To update all dependencies to their latest versions:

```bash
npx npm-check-updates -u
npm install
```
