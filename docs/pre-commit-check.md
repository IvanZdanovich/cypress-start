# Pre-commit check

The pre-commit hook runs on every `git commit`. It executes `scripts/pre-commit-lint.js`, which blocks a commit when
generated assets are stale, a spec file is misplaced, or lint quality in the staged files gets worse.

## How it works

- `scripts/colours.js sync --check` and `scripts/l10n.js sync --check` run first. If either generated asset is stale,
  the hook stops before ESLint runs.
- The spec file path check runs next across the whole tree, not only staged files. Any file under `cypress/integration/`
  or `cypress/e2e/` that does not match `*.api.spec.js` or `*.ui.spec.js` for its folder blocks the commit.
- Only staged JS/TS files are linted. The script reads `git diff --cached --name-only --diff-filter=ACM`, excludes
  `.d.ts` files and ignored build/report directories, then resolves the remaining paths from the repo root. With no
  staged JS/TS files, the hook exits successfully.
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

- **`node scripts/pre-commit-lint.js`** — run the hook logic manually before committing.
- **`npm run lint`** — auto-fix and report ESLint issues across the whole repo, with no staged-file ratio check.
- **`npm run sync`** — regenerate colour and localization assets when the sync checks fail.
- **`npm run hooks:setup`** — install or repair the git hook.

## Fixing failures

Fixable ESLint issues are already corrected and re-staged by the hook. Issues that remain after auto-fix usually come
from structural custom rules and need source edits.

- `custom/verify-test-title-against-structure` usually resolves with `npm run lint`, which runs with `--fix` and updates
  `eslint-plugin-custom-rules/app-structure/{components,modules,workflows}.json` from current titles.
- `custom/verify-test-title-pattern` resolves by renaming the flagged `describe`, `context`, or `it` title to the
  expected Given/When/Then form.
- `custom/verify-spec-file-paths` resolves by renaming or moving the flagged file so it matches its folder, or by
  renaming a work-in-progress spec to `*.spec.skip.js`.
- Sync check failures resolve by running `npm run sync`, then staging the generated files.

Recommended recovery path:

```bash
npm run lint
git add .
git commit -m "your message"
```

## Troubleshooting

The hook is installed by `npm install` (postinstall) or `npm run hooks:setup`. It finds the repo root and Node.js when
it runs, so it still works after you move the repo, in `git worktree` checkouts, and in GUI git clients (WebStorm,
SourceTree, GitHub Desktop) that don't add nvm, Volta, or fnm to `PATH`.

- **Hook never runs.** A global `core.hooksPath` (often set by husky in another project) makes git ignore
  `.git/hooks`. `npm run hooks:setup` prints a warning and the command to fix it for this repo.
- **`Node.js not found`.** Make `node` available to your git client, then run `npm run hooks:setup` again.
- **`ESLint is not installed`.** Run `npm install` in the repo root.

## Emergency bypass

Use `--no-verify` only in a real emergency, when the blocking issue cannot be fixed immediately:

```bash
git commit --no-verify -m "message"
```

Fix the skipped issue in a follow-up commit that passes the hook normally.

## Related

- [Git strategy](./git-strategy.md) — branching, commits, and the PR checks gate
- [Custom ESLint rules](./eslint-custom-rules.md) — project-specific rules that can block the hook
