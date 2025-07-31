# Pre-commit Code Quality Check

This document describes the automated code quality verification process that runs before each commit in the repository.

## Overview

The pre-commit check ensures code quality standards by measuring ESLint warning and error ratios against predefined
thresholds. This prevents commits that would reduce overall code quality.

## How It Works

1. When you attempt to commit changes, the pre-commit hook runs automatically
2. The hook executes `.husky/check-eslint.js` to analyze JavaScript/TypeScript files
3. The script:
   - Counts lines of code in the staged files
   - Runs ESLint to find warnings and errors
   - Calculates warning and error ratios (as percentage of total lines)
   - Compares these ratios against thresholds in `.husky/thresholds.json`
   - Blocks commits that exceed thresholds
   - Automatically tightens thresholds when code quality improves

## Configuration

Thresholds are stored in `.husky/thresholds.json` with the following structure:

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

## Testing the Hook

To test if the pre-commit hook is functioning correctly:

```bash
# Stage some JavaScript files
git add path/to/file.js

# Run the hook manually
sh .husky/pre-commit
```

## Bypassing the Check

In exceptional cases, you can bypass the check with:

```bash
git commit --no-verify -m "Your commit message"
```

Note: This should be used sparingly and only for legitimate reasons.

## Auto-tightening Thresholds

As code quality improves (fewer warnings/errors), the script automatically updates thresholds to more stringent values,
promoting continuous improvement.
