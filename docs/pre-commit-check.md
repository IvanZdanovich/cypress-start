# Pre-Commit Check

The pre-commit hook runs automatically on every `git commit`. It executes `scripts/pre-commit-lint.js` in a single pass:

1. **ESLint auto-fix** — fixable issues are corrected, written to disk, and re-staged automatically
2. **Full stylish output** — file paths, line numbers, clickable `file:line:col` references
3. **Ratio check** — remaining warning/error counts compared against `scripts/thresholds.json`
4. **Auto-tighten thresholds** — thresholds update automatically when quality improves

> **Auto-fix always runs.** You do not need to trigger it manually before committing.
> Remaining issues after the auto-fix step are ones ESLint cannot fix automatically (e.g. structural validation errors
> like `verify-test-title-against-structure`). Those must be resolved manually.

Merge and rebase commits are skipped automatically (`.git/MERGE_HEAD`, `rebase-merge`, `rebase-apply`).

## Commands

| Command                   | Description                                                 |
|---------------------------|-------------------------------------------------------------|
| `npm run precommit:check` | Run manually before committing (same as the git hook)       |
| `npm run lint:check`      | Alias — identical to the above                              |
| `npm run lint`            | Auto-fix + full output on all project files, no ratio check |

## Workflow

### Normal path

```bash
git add .
git commit -m "your message"
# Hook runs automatically:
#   → ESLint auto-fix applied to staged files
#   → Fixed files re-staged
#   → Remaining ratio checked against thresholds
#   → ✅ Commit proceeds if ratios are within thresholds
```

### When the hook fails (ratios exceed thresholds)

The hook output will tell you exactly what to do:

```
❌ Lint ratios exceed thresholds:
   Warning ratio too high: 7.55% > 0%

💡 Auto-fix was already applied — remaining issues need manual attention:
   1. Fix the issue(s) shown above in the file(s) listed.
   2. Run:  npm run lint      → re-apply auto-fix and review
   3. Run:  git add .  &&  git commit -m "your message"

   ⚠️  Emergency bypass (fix afterward): git commit --no-verify -m "your message"
```

Common manual fixes:

- **`verify-test-title-against-structure` errors** — run `npm run lint --fix` to auto-add valid paths to
  `eslint-plugin-custom-rules/app-structure/expected/` (components.json / modules.json / workflows.json)
- **`verify-test-title-pattern` warnings** — rename the `describe`/`context`/`it` block to match the required format

## Ratio Calculation

```
ratio = (remaining issues ÷ total lines in staged files) × 100
```

- Computed over **staged files only**, not the full repository.
- Line counts and issue counts are both taken **after auto-fix** — they are consistent.
- Example: 4 warnings in a 53-line staged file → `4 / 53 × 100 = 7.55%`
- With threshold `0%`, **any remaining issue** will block the commit.

## Thresholds

Stored in `scripts/thresholds.json`:

```json
{
  "warningThresholdInPercents": 0,
  "errorThresholdInPercents": 0
}
```

`0%` means no warnings or errors are allowed after auto-fix. Thresholds tighten automatically as quality improves — they
never loosen automatically.

## Bypass

For emergencies only — fix issues afterward:

```bash
git commit --no-verify -m "your message"
```