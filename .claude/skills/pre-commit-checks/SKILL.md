---
name: pre-commit-checks
description: Use when a commit is blocked by the git hook, the lint ratio fails against thresholds, deciding whether to bypass the hook with --no-verify, or understanding what auto-fix and auto-tighten do.
---

# Principles

SINGLE_PASS: the hook runs `scripts/pre-commit-lint.js` once per `git commit`, driving auto-fix then ratio check in one invocation — otherwise contributors run scattered lint steps that disagree with the gate that actually blocks the commit
AUTO_FIX_OWNS_FIXABLE: fixable issues are corrected and re-staged by the hook, never by hand — otherwise manual edits duplicate work ESLint already performs and desync the staged tree
RATCHET_ONLY: thresholds tighten as quality improves and never loosen automatically — otherwise a regression silently lowers the bar and permanent debt accrues
STAGED_SCOPE: the gate measures only staged files, not the whole repo — otherwise pre-existing debt in untouched files blocks unrelated commits
CONSISTENT_COUNTS: issue counts and line counts are both taken after auto-fix — otherwise the ratio mixes pre-fix and post-fix numbers and reports a false percentage

# Method

## Hook phases

FLOW: AUTO_FIX → RESTAGE → FULL_OUTPUT → RATIO_CHECK → AUTO_TIGHTEN
AUTO_FIX: ESLint corrects every fixable issue in staged files and writes it to disk — runs unconditionally, no manual pre-step needed
RESTAGE: files rewritten by auto-fix are re-staged automatically so the commit contains the fixed content
FULL_OUTPUT: remaining issues print as stylish output with clickable `file:line:col` references
RATIO_CHECK: remaining warning and error ratios compare against `scripts/thresholds.json`; commit proceeds only when both are within threshold
AUTO_TIGHTEN: when remaining ratios beat the stored thresholds, `scripts/thresholds.json` updates downward to lock in the improvement
SKIP_CONDITION: merge and rebase commits skip the hook via `.git/MERGE_HEAD`, `rebase-merge`, `rebase-apply` — so history-rewriting operations are not gated

## Commands

PRECOMMIT_CHECK: `npm run precommit:check` runs the exact hook logic manually before committing
LINT_CHECK: `npm run lint:check` is an alias identical to `npm run precommit:check`
LINT: `npm run lint` applies auto-fix and prints full output on all project files with no ratio check — use to preview and clear issues, not as the gate
NORMAL_PATH: `git add .` → `git commit -m "message"` → hook auto-fixes, re-stages, checks ratios → commit lands when within thresholds

## Ratio calculation

FORMULA: ratio is remaining post-fix issues divided by total lines in staged files, times 100
UNIT: computed per issue class — a warning ratio and an error ratio, each against its own threshold
ZERO_MEANS_ANY_BLOCKS: at threshold `0%` any single remaining issue blocks the commit, since a non-zero numerator yields a non-zero ratio

```
ratio = (remaining issues ÷ total lines in staged files) × 100
# e.g. 4 warnings across 53 staged lines → 4 / 53 × 100 = 7.55%
```

## Thresholds

STORE: `scripts/thresholds.json` holds `warningThresholdInPercents` and `errorThresholdInPercents`
DEFAULT: both thresholds are `0`, meaning no warnings or errors survive auto-fix
DIRECTION: values only move down via AUTO_TIGHTEN, never up automatically — a human must widen them deliberately if ever needed

## Manual fixes

REMAINING_ARE_UNFIXABLE: issues surviving auto-fix are ones ESLint cannot fix, chiefly structural custom rules — resolve them by editing source, not by re-running auto-fix
TITLE_STRUCTURE: `verify-test-title-against-structure` errors resolve by running `npm run lint --fix`, which appends valid paths to `eslint-plugin-custom-rules/app-structure/` (`components.json`, `modules.json`, `workflows.json`)
TITLE_PATTERN: `verify-test-title-pattern` warnings resolve by renaming the `describe`/`context`/`it` block to the required title format
RECOVERY: fix the flagged file → `npm run lint` to re-apply auto-fix and review → `git add .` → `git commit -m "message"`

## Bypass

BYPASS_COMMAND: `git commit --no-verify -m "message"` skips the hook entirely
ACCEPTABLE_ONLY: bypass is for genuine emergencies where the blocking issue cannot be fixed in the moment — otherwise unchecked debt enters `main` past the gate
FOLLOW_UP: a bypassed commit obliges fixing the skipped issues in a subsequent commit that passes the hook

```
git commit --no-verify -m "message"
```

# Validation

FLOW_CHECK: the hook performed AUTO_FIX → RESTAGE → FULL_OUTPUT → RATIO_CHECK → AUTO_TIGHTEN in one pass
SCOPE_CHECK: the ratio reflects staged files only, with post-fix issue and line counts
GATE_CHECK: warning and error ratios are each within `scripts/thresholds.json`, or the commit is intentionally bypassed
RATCHET_CHECK: thresholds only tightened, never loosened, by the commit
MANUAL_CHECK: no surviving issue was worked around by re-running auto-fix instead of a source edit
BYPASS_CHECK: any `--no-verify` commit is a logged emergency with a follow-up commit that passes the hook
