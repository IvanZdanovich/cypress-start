# Pre-commit check

The pre-commit hook runs automatically on every `git commit`, executing `scripts/pre-commit-lint.js` to keep lint
quality from regressing before code lands.

## How it works

- `scripts/colours.js sync --check` and `scripts/l10n.js sync --check` run first. If either generated asset is stale,
  the hook stops before ESLint ratios are evaluated.
- Only staged JS/TS files are linted. The script reads `git diff --cached --name-only --diff-filter=ACM`, excludes
  `.d.ts` files and ignored build/report directories, then resolves the remaining paths from the repo root.
- ESLint runs once with `fix: true` on those staged files.
- `ESLint.outputFixes()` writes fixable changes to disk.
- Files changed by auto-fix are re-staged with `git add -- <file...>` so the commit contains the fixed content.
- The remaining ESLint output prints in `stylish` format with clickable `file:line:col` references.
- Remaining warning and error ratios are computed from the post-fix results and post-fix line counts.
- Each ratio is compared with `scripts/thresholds.json`.
- When both ratios are within threshold, the commit proceeds.
- When a ratio is lower than the stored threshold, `scripts/thresholds.json` tightens downward and is staged into the
  same commit.

Merge and rebase commits are skipped by the generated hook when `.git/MERGE_HEAD`, `.git/rebase-merge`, or
`.git/rebase-apply` exists.

## Ratio calculation

Ratios measure only staged files, not the whole repo. This keeps pre-existing debt in untouched files from blocking an
unrelated commit and keeps numerator and denominator from mixing pre-fix and post-fix states.

```text
ratio = (remaining issues ÷ total staged-file lines) × 100
```

Warning and error ratios are rounded to two decimals and checked independently against
`warningThresholdInPercents` and `errorThresholdInPercents` in `scripts/thresholds.json`. A `0%` threshold means any
remaining issue blocks the commit because the ratio becomes non-zero.

Thresholds only tighten automatically. A wider threshold requires an intentional edit to `scripts/thresholds.json`.

## Commands

- **`npm run precommit:check`** — run the hook logic manually before committing.
- **`npm run lint:check`** — alias, identical to `precommit:check`.
- **`npm run lint`** — run date-slot verification, then auto-fix and report all ESLint issues across the repo with no
  staged-file ratio check.
- **`npm run sync`** — regenerate colour and localization assets when the initial sync checks fail.

## Fixing failures

Fixable ESLint issues are already corrected and re-staged by the hook. Issues that remain after auto-fix usually come
from structural custom rules and need source edits.

- `custom/verify-test-title-against-structure` usually resolves with `npm run lint -- --fix`, which updates
  `eslint-plugin-custom-rules/app-structure/{components,modules,workflows}.json` from current titles.
- `custom/verify-test-title-pattern` resolves by renaming the flagged `describe`, `context`, or `it` title to the
  expected Given/When/Then form.
- Sync check failures resolve by running `npm run sync`, then staging the generated files.

Recommended recovery path:

```bash
npm run lint
git add .
git commit -m "your message"
```

## Emergency bypass

Emergency bypass (fix the issues in a follow-up commit): `git commit --no-verify -m "message"`

Use `--no-verify` only for a genuine emergency where the blocking issue cannot be fixed immediately. The follow-up
commit should resolve the skipped issue and pass the hook normally.

## Related

- [Git strategy](./git-strategy.md) — branching, commits, and the PR checks gate
- [Custom ESLint rules](./eslint-custom-rules.md) — project-specific rules that can block the hook
