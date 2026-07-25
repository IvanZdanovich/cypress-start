# Pre-Commit Check

The pre-commit hook runs automatically on every `git commit`, executing `scripts/pre-commit-lint.js` to keep lint
quality from regressing before code lands.

## How it works

In a single pass the hook auto-fixes fixable ESLint issues in the staged files, re-stages the corrected files, prints
full stylish output for anything left, then checks the remaining warning/error ratios against `scripts/thresholds.json`.
If the ratios are within thresholds the commit proceeds, and thresholds tighten automatically when quality improves.
Merge and rebase commits are skipped. Issues that survive auto-fix are ones ESLint cannot fix (mostly structural custom
rules) and must be resolved by hand.

## Commands

- **`npm run precommit:check`** — run the hook logic manually before committing.
- **`npm run lint:check`** — alias, identical to `precommit:check`.
- **`npm run lint`** — auto-fix + full output on all files, no ratio check.

Emergency bypass (fix the issues in a follow-up commit): `git commit --no-verify -m "message"`

## Source of truth

The complete workflow — hook phases, ratio formula, thresholds and auto-tighten logic, common manual fixes, and when a
`--no-verify` bypass is acceptable — lives in the
**[pre-commit-checks skill](../.claude/skills/pre-commit-checks/SKILL.md)**. Consult it for anything beyond this
overview.

## Related

- [Git strategy](./git-strategy.md) — branching, commits, and the PR checks gate
