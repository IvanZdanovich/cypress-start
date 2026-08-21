# Cypress Testing Framework

[![Weekly Cypress Tests](https://github.com/IvanZdanovich/cypress-start/actions/workflows/weekly-cypress-tests.yml/badge.svg?branch=main)](https://github.com/IvanZdanovich/cypress-start/actions/workflows/weekly-cypress-tests.yml)
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

Create a new project from this template in seconds! The CLI offers three setup modes to match your needs:

### Prerequisites

- Node.js >= 24
- npm or yarn
- Git

### 🚀 Create New Project with cypress-start CLI (Recommended)

```bash
# Using npx (no installation required)
npx cypress-start my-project

# Or copy selected modules into the current directory
npm exec --yes --package=cypress-start@latest -- cypress-start .
```

**Mode 1 — Full Setup** clones the complete framework, initializes a fresh git repo, and runs `npm install`. Best for
new standalone projects.

**Mode 2 — Specific Files** cherry-picks modules (ESLint, Docs, Claude Skills, Parallel Runner, GitHub Actions, Docker)
into an existing project directory. `package.json` is created or merged automatically; run `npm install` manually after.
Use `npm exec --yes --package=cypress-start@latest -- cypress-start .` when you want the selected modules copied into the folder you are already in.

**Mode 3 — Update Existing Project** refreshes a project you already created **in place** — no new subfolder. It pulls the
latest template, adds/overwrites managed files, deletes files that are no longer part of the template, and merges
`package.json` (keeping your custom scripts and credentials). Every change is staged with `git add -A` so you can review
the diff and roll back individual edits before committing:

```bash
# From inside the project
npx cypress-start
# choose "3. Update Existing Project"

git diff --staged                 # review everything the update changed
git restore --staged <file>       # unstage a file you want to keep as-is
git restore <file>                # discard the update for that single file
```

User-owned files are never touched: `package.json` is merged (not overwritten), and `cypress/sensitive-data/*-users.json`
credentials are preserved. Obsolete-file deletion relies on the `.cypress-start-manifest.json` written on install/update.

```bash
cd my-project
npm run test              # run all tests headless
npm run test:parallel     # run tests in parallel
npm run lint              # run ESLint checks
npx cypress open          # open Cypress UI
```

### Alternative setup

**GitHub Template:** navigate to https://github.com/IvanZdanovich/cypress-start → click **"Use this template"** → create repository → clone it.

**Direct clone:**

```bash
git clone https://github.com/IvanZdanovich/cypress-start.git my-project
cd my-project
npm install
```

**Copy `cypress/sensitive-data/env-users.example.json` to `cypress/sensitive-data/dev-users.json` and to `cypress/sensitive-data/qa-users.json` for test credentials.**

---

> **Open Source** — MIT licensed. Use it, fork it, contribute back.

---

## Overview

Unlock rapid and reliable testing with a framework developed using Cypress and JavaScript. Designed to scale
effortlessly, it is suitable for projects of any size.
This framework includes examples of tests:

- Integration and E2E UI tests for the [Swag Labs Demo application](https://www.saucedemo.com/).
- Integration API tests for the [Restful Booker API playground](https://restful-booker.herokuapp.com/apidoc/)

![Alt text](assets/execution-example.gif)

---

## What Makes This Framework Unique?

- **The Spec Is the Requirement**: Tests follow a Constraints → Examples → Specs traceability model. Boundary values
  live in constraint files, named data instances in example files, and requirements as executable Given/When/Then titles
  in spec files. There are no separate requirement documents, mapping matrices, or test-management tools — the spec is
  the single source of truth. ([docs](docs/constraints-examples-specs-approach.md))
- **No Abstractions**: No redundant abstraction layers such as Page Object Models or BDD frameworks. The framework
  provides a clear structure and naming conventions while using Gherkin‑style syntax to make tests self‑descriptive,
  readable, and understandable for non‑technical stakeholders.
- **Efficiency**: Parallel test execution and optimized configurations ensure fast feedback cycles.
- **Scalability**: Proper test organization and file isolation avoid manual test case structures. Straightforward
  test‑data organization and custom static code analysis rules enforce naming conventions and test structure. The
  framework aligns the entire team around well‑defined requirements and scales effortlessly with the project.
- **Maintainability**: A clear project structure and comprehensive documentation ensure easy onboarding, effortless
  maintenance, and smooth test creation.
- **Robustness**: Designed with Cypress to handle complex test scenarios with ease.
- **Lightweight and Easy Startup**: Quick setup with minimal configuration. A minimal number of third‑party dependencies
  helps avoid conflicts and ensures fast build times.
- **AI-Ready**: Ships a full set of [Claude Code](https://claude.ai/code) skills under `.claude/skills/` — covering
  spec writing, constraint and example authoring, command creation, ESLint rules, bug tracking, localization, colour
  themes, git strategy, and more. The AI follows project conventions automatically, without prompting.

---

## Features

- **Interactive CLI Setup:** Three setup modes — Full Setup (complete framework), Specific Files (cherry-pick modules),
  or Update Existing Project
- **Parallel Test Execution:** Run tests in parallel with configurable stream count ([docs](docs/parallel-execution.md))
- **Localization Testing:** Type-safe localization with auto-generated typed `l10n` map from locale
  files ([docs](docs/localization-testing.md))
- **Color Theme Testing:** Type-safe color themes with auto-generated typed `colours` map from theme
  files ([docs](docs/colour-theme-testing.md))
- **Coverage Gap Analysis:** Compares implemented tests against the expected structure, reporting missing paths, skipped
  tests, and coverage percentages with CI threshold enforcement ([docs](docs/coverage-gap-analysis.md))
- **Flaky Test Analysis:** Persists CI test outcomes across runs in an orphan-branch ledger, then classifies tests as
  flaky, consistent, or rare ([docs](docs/flaky-test-analysis.md))
- **Custom ESLint Rules:** Enforces test structure and naming conventions ([docs](docs/eslint-custom-rules.md))
- **Pre-commit Quality Checks:** Automated linting before every commit ([docs](docs/pre-commit-check.md))
- **CI/CD Integration:** GitHub Actions workflow with dynamic test filtering and Docker support
- **Claude Code Skills:** 16 project-specific skills covering the full development workflow — spec writing, data
  authoring, command creation, linting, bug tracking, localization, colour themes, and git strategy. Invoked
  automatically by [Claude Code](https://claude.ai/code) when the task matches, or explicitly via `/skill-name`.

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

### Environment-Specific Test Run

Run tests with specific environment parameters in headless mode.

**Environment Parameters:**

- `LANGUAGE`: Language code (default: `en`)
- `TARGET_ENV`: Target environment (default: `dev`)
- `COLOUR_THEME`: Color theme (default: `default`)
- `BROWSER`: Browser for execution (default: `chrome`, options: `chrome`, `edge`)

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

Automated CI/CD workflow with weekly scheduled runs or manual triggers.

**Quick Start:**

1. Go to **Actions** tab → Select **"Weekly Cypress Tests"**
2. Click **"Run workflow"** → Configure parameters → Click **"Run workflow"**

**Available Parameters:**

- `language` — Language code (default: `en`)
- `target_env` — Target environment (default: `dev`)
- `colour_theme` — Color theme (default: `default`)
- `parallel_streams` — Number of parallel streams, 1–4 (default: `2`)
- `browser` — Browser to use: `electron`, `chrome`, `edge` (default: `chrome`)
- `test_scope` — Scope of tests to run: `all`, `integration`, `e2e` (default: `all`)
- `test_type` — Type of tests to run: `all`, `api`, `ui` (default: `all`)

**Test Filtering:**

- `all` scope + `all` type → all tests in the workspace
- `all` scope + `api` type → all API tests (integration only)
- `all` scope + `ui` type → all UI tests (integration + e2e)
- `integration` scope + `all` type → all integration tests (api + ui)
- `integration` scope + `api` type → integration API tests only
- `integration` scope + `ui` type → integration UI tests only
- `e2e` scope + `all` type → all E2E tests
- `e2e` scope + `ui` type → E2E UI tests only

**Viewing Results:** Check the **Actions** tab for run status. Download artifacts (reports, screenshots, videos) after
completion.

---

## Documentation

**Test Development:**

- [Constraints → Examples → Specs](docs/constraints-examples-specs-approach.md)
- [CES vs. Traditional RM Tools](docs/comparison-spec-vs-rm-tool.md)
- [FAQ](docs/faq.md)

**Features & Tools:**

- [Parallel Execution Guide](docs/parallel-execution.md)
- [Localization Testing](docs/localization-testing.md)
- [Color Theme Testing](docs/colour-theme-testing.md)
- [Coverage Gap Analysis](docs/coverage-gap-analysis.md)
- [Flaky Test Analysis](docs/flaky-test-analysis.md)

**Quality & Standards:**

- [Custom ESLint Rules](docs/eslint-custom-rules.md)
- [Pre-commit Check](docs/pre-commit-check.md)

**Git & Collaboration:**

- [Git Strategy](docs/git-strategy.md)

---

## Troubleshooting

### Common Issues

- **Sensitive data is not provided** Ensure dev-users.json and qa-users.json with credentials are provided in sensitive-data folder
- **Pretest script fails:** Ensure you have the correct language and theme files in the appropriate directories.
- **Test isolation issues:** Check that `testIsolation: false` is set on the relevant `describe` blocks.
- **Localization errors:** Verify that the language file contains all required keys.
- **ESLint errors:** Run `npm run lint` to identify specific issues.

### Updating Dependencies

To update all dependencies to their latest versions:

```bash
npx npm-check-updates -u
```

Then reinstall the dependencies:

```bash
npm install
```
