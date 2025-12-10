# Pre-commit Code Quality Check

This document describes the automated code quality verification process that runs before each commit in the repository.

## Overview

Pre-commit checks are **automatically installed** during `npm install` via the `postinstall` script. These checks ensure code quality standards by measuring ESLint warning and error ratios against predefined thresholds.

## Installation

Hooks are installed automatically when you run:

```bash
npm install
```

The `postinstall` script creates a native git pre-commit hook in `.git/hooks/` that runs automatically before every commit.

### Manual Reinstallation

If hooks were accidentally removed or need to be reinstalled, run:

```bash
npm run hooks:setup
```

### CI Environment Behavior

The setup script automatically detects CI environments (GitHub Actions, GitLab CI, CircleCI, Jenkins, Travis, etc.) and skips hook installation. This prevents unnecessary setup in automated pipelines.

## How It Works

1. During `npm install`, the `postinstall` script executes `scripts/setup-git-hooks.js`
2. The script detects if running in CI (skips installation) or if `.git` directory exists
3. If in a development environment, it creates a native git pre-commit hook in `.git/hooks/pre-commit`
4. When you attempt to commit, the hook executes `scripts/check-eslint.js`
5. The script validates code quality against thresholds in `scripts/thresholds.json`
6. Commits that exceed thresholds are blocked

## Configuration

Thresholds are stored in `scripts/thresholds.json` with the following structure:

```json
{
  "warningThresholdInPercents": 0,
  "errorThresholdInPercents": 0
}
```

Thresholds set to 0% mean no warnings or errors are allowed.

## Troubleshooting

If your commit is rejected:

1. Review the error message showing which threshold was exceeded
2. To identify specific issues run eslint manually via script defined in `package.json`:
    ```bash
    npm run lint
    ```
3. Fix the problems and try committing again

### Verification

Check if hooks are installed:

```bash
# Linux/macOS
cat .git/hooks/pre-commit

# Windows
type .git\hooks\pre-commit
```

You should see a pre-commit hook that references `scripts/check-eslint.js`.

## Testing the Hook

To test if the pre-commit hook is functioning correctly:

```bash
# Stage some JavaScript files
git add path/to/file.js

# Run the hook manually
sh .git/hooks/pre-commit
```

## Bypassing the Check (Emergency Only)

In exceptional cases, you can bypass the check with:

```bash
git commit --no-verify -m "Your commit message"
```

⚠️ Use sparingly - bypassing checks degrades code quality.

## Auto-tightening Thresholds

As code quality improves (fewer warnings/errors), the script automatically updates thresholds to more stringent values, promoting continuous improvement.

## Developer Override

If you need to skip hook installation locally (not recommended):

```bash
SKIP_HOOKS=true npm install
```

This environment variable prevents the `postinstall` script from setting up git hooks.
