# Flaky test analysis

Scripts: `scripts/collect-test-results.js`, `scripts/analyze-flaky-tests.js`, `scripts/manage-flaky-suppressions.js`

Persists CI test outcomes across runs in a JSONL ledger on a dedicated orphan branch (`test-results`), then identifies
tests that fail intermittently. Collection is CI-only (`CI=true` guard) — local runs are excluded to keep the ledger
free of non-reproducible data. The orphan branch keeps test history separate from code history and avoids touching
protected branches.

## How it works

1. **Collect** (`scripts/collect-test-results.js`, CI-only) reads mochawesome JSON reports from
   `cypress/reports/separate-reports/`, extracts stats and failures, and commits a new ledger line to the `test-results`
   orphan branch using git plumbing (no working-tree changes)
2. **Analyze** (`report:flaky`, local or CI) fetches `origin/test-results`, reads the ledger via
   `git show`, groups failures by test title, classifies each as flaky / consistent / rare, and writes
   `reports/flaky-tests.md`. Pass `--env <env>` to scope analysis to a single environment; omit it to combine all
   environments.

## Usage

Collection runs automatically in CI. Analysis can be run locally against the committed ledger.

```bash
# Generate the flaky test report from accumulated CI data (all environments)
npm run report:flaky

# Scope the report to a single environment
npm run report:flaky:qa   # writes reports/flaky-tests-qa.md
npm run report:flaky:dev  # writes reports/flaky-tests-dev.md
npm run report:flaky:all  # writes reports/flaky-tests-all.md

# Analyze only the last 30 runs
node scripts/analyze-flaky-tests.js --last 30

# Filter to one environment directly
node scripts/analyze-flaky-tests.js --env qa

# Treat a different branch as the trunk for the excl./incl. non-main split
node scripts/analyze-flaky-tests.js --main-branch develop

# Write report to a custom location
node scripts/analyze-flaky-tests.js --output path/to/report.md
```

The `--env` filter matches each ledger run's `env` field. The report summary states which environment it covers (or
`all environments` when unscoped). With `--env` set and no `--output`, the default filename is
`reports/flaky-tests-<env>.md`, so an env-scoped run never overwrites the combined report.

The `--main-branch` flag (default `main`, also `RESULTS_MAIN_BRANCH` env) names the trunk branch. Every headline rate is
reported for two run scopes: **excl. non-main** (trunk-only) and **incl. non-main** (all branches).
See [Branch breakdown](#branch-breakdown).

Prefer env-scoped analysis for the Action Required section. Recency signals (streak, failing-now) read the ledger in run
order, so an unscoped report can interleave `qa` and `dev` runs and blur a streak across environments. Scoping to one
env keeps the timeline coherent.

## Storage

The ledger (`test-run-history.jsonl`) lives on the orphan `test-results` branch — not on `main` or feature branches.

- **No branch protection conflicts** — CI pushes to an unprotected branch
- **Clean separation** — test history doesn't pollute code commit history
- **No merge conflicts** — the ledger never intersects with feature work
- **Local access** — `git fetch origin test-results` then `npm run report:flaky`

## Ledger format

One JSON object per line, one line per CI run:

```json
{
  "runId": "2024-01-15-abc1234-qa-4821-1",
  "timestamp": "2024-01-15T10:30:00.000Z",
  "branch": "main",
  "commit": "abc1234",
  "buildId": "4821-1",
  "env": "qa",
  "specFiles": 42,
  "stats": {
    "total": 300,
    "passed": 297,
    "failed": 2,
    "pending": 1,
    "skipped": 0,
    "duration": 180000
  },
  "failures": [
    {
      "file": "cypress/integration/api/module.api.spec.js",
      "context": [
        "Module.Sub: Given preconditions",
        "Module.Sub.Retrieve.GET: When retrieving"
      ],
      "it": "Module.Sub.Retrieve.GET: Then retrieves correctly",
      "duration": 5000,
      "error": "Expected 200 but got 500"
    }
  ]
}
```

Only the **first failure per spec file** is recorded — tests within a file are dependent on previous ones, so subsequent
failures are unreliable. Each failure includes `file`, `context` (describe/context block titles), and
`it` (test title) for precise location.

## Retention

The ledger is a **rolling window** of the most recent runs. After appending a new run, the collector keeps the newest
`MAX_RUNS` lines (default **100** — the new run plus the previous 99) and prunes anything older, in the same atomic
push. This bounds the ledger file size and keeps `git show` / analysis fast regardless of project age.

- **Default:** 100 runs. Override with `--max-runs <N>` or the `RESULTS_MAX_RUNS` env var.
- **Disable:** set `--max-runs 0` (or `RESULTS_MAX_RUNS=0`) for an unbounded ledger.
- **Concurrency-safe:** pruning rides on the existing fetch → dedup → retry loop, so parallel pipelines converge on the
  same trimmed state.
- **Scope:** retention trims the ledger *file content*. Commit history is bounded separately (see below).

```bash
# Keep only the last 50 runs
node scripts/collect-test-results.js --max-runs 50

# Equivalent via env
RESULTS_MAX_RUNS=50 node scripts/collect-test-results.js
```

## Commit history

The `test-results` branch is kept as a **single rolling orphan commit** — never a growing parent chain — so its commit
history is permanently bounded to one commit regardless of how many runs accumulate. This is safe because the ledger
file is self-contained: it already holds the last `MAX_RUNS` runs, and every entry is self-describing (`runId`,
`timestamp`, `commit`, `buildId`).

Each collect run rebuilds the branch tip via git plumbing (`commit-tree` with no parent) and replaces it with
`git push --force-with-lease`. The lease is a compare-and-swap against the fetched tip: if a parallel pipeline pushed in
between, the push is rejected (`stale info`) and the retry loop re-fetches, re-applies retention, and rebuilds — so the
single-commit design loses neither data nor concurrency safety. Per-run audit trail is preserved in the entry fields,
not in git history.

## Classification

- **Flaky** (10%–79% fail rate) — fails intermittently; investigate.
- **Consistent** (≥ 80%) — fails in most runs; likely broken, not flaky.
- **Rare** (< 10%) — failed once or twice; may be environment noise.

The **flaky result rate** in the summary quantifies this at the execution level: the count of failure occurrences from
flaky-classified tests, divided by total spec-file executions across rated runs, expressed as a percentage. It is
reported in two variants: **excl. suppressed** counts only actionable failures, while **incl. suppressed** also counts
suppressed failures for a gross view. Suppressed whole-run incidents and legacy (no `specFiles`) runs are excluded from
both variants, keeping numerator and denominator on a consistent execution pool.

## Branch breakdown

Each CI run records the `branch` it executed on. The trunk branch is `main` by default (override with
`--main-branch` or `RESULTS_MAIN_BRANCH`); any other branch — a feature or PR branch — is **non-main**.

A run whose branch is **unmentioned** — empty, `unknown`, or a detached `HEAD` (how CI reports a checkout that isn't on
a named branch) — is treated as the trunk. The collector resolves the real branch from CI env vars (Azure
`BUILD_SOURCEBRANCH` / PR source, GitHub `GITHUB_REF_NAME`, etc.), so feature/PR runs are recorded with their actual
branch rather than a useless `HEAD`.

The report computes every headline rate (average pass rate, overall run probability, and both flaky result rates) over
two run scopes:

- **Excl. non-main** — trunk-only. Feature/PR-branch runs are dropped. **This is the primary target**: the flat summary
  rates report these figures, so in-development branches never dilute the health signal for the released trunk.
- **Incl. non-main** — all analysed runs, whatever branch they ran on.

When the run set mixes main and non-main runs, the summary's **Branch breakdown** table places the two scopes side by
side (headline trunk-only vs all branches). It is omitted when every analysed run is on the same branch, since the two
scopes would be identical. Failure counts (unique/flaky/rare/action-required) span every analysed run regardless of
branch; only the rates are scoped. Flaky classification itself stays global (lifetime fail rate across all runs); only
the run set each rate is measured over changes between scopes. When no run is on the trunk at all, the headline falls
back to all runs so the report is never empty.

## Suppressions

Known or reviewed failures can be suppressed from the actionable report sections so the report stays focused on real
regressions. Test suppressions move matching failures to a dedicated section at the bottom of
`reports/flaky-tests.md`. Run suppressions exclude compromised CI runs from all analysis stats.

**Why suppress** — a failure linked to a tracked ticket (backend bug, environment instability, pending feature) clutters
the "Action Required" and "Flaky" sections. Suppressing it signals "reviewed, not actionable right now" without losing
visibility.

**File** — `scripts/flaky-suppressions.json`. Test entries live in `suppressions`; run entries live in
`runSuppressions`.

**Test suppression** — identifies a failure by `file` + `it` (+ optional `context`) and carries `reason`, `ticket`,
optional `lastFailedAt`, `lastBranch`, `env`, `lastCommit`, and `expiresAt` metadata.

**Run suppression** — identifies a compromised ledger run by `commit` and carries `runDate`, `branch`, `env`, `buildId`,
`reason`, `ticket`, and `suppressedAt`. Analysis removes matching runs before aggregating failures, pass rate, run
history, action-required signals, and flaky classification. Use this for whole-run incidents such as CI outages or
environment failures, not for individual test bugs.

**Auto-expiry** — test entries with an `expiresAt` date keep historical failures suppressed while the issue does not
recur. If the test fails again after that date, the suppression lapses and all occurrences resurface in the main report.

**Bypass** — `node scripts/analyze-flaky-tests.js --no-suppress` shows the full unfiltered report.

### Interactive CLI

```bash
# Add test suppressions — shows unsuppressed failures, multi-select, prompts for ticket/reason/expiry
npm run report:suppress

# Remove test suppressions — shows current entries, multi-select to unsuppress
npm run report:unsuppress

# Add run suppressions — shows recent ledger runs, multi-select, prompts for incident/reason
npm run report:suppress-run

# Remove run suppressions — shows current run entries, multi-select to restore
npm run report:unsuppress-run

# Review — cleans expired test entries, shows status summary, offers test/run add/remove
npm run report:review
```

Select tests or runs that share a common reason and ticket in one session. Run again for a different group.

### Manual editing

Add entries directly to the existing `scripts/flaky-suppressions.json` arrays:

```json
{
  "suppressions": [
    {
      "file": "module.submodule.api.spec.js",
      "it": "Module.SubModule.GET: Then return a 200 status code and data",
      "reason": "Backend endpoint intermittent 500",
      "ticket": "BUG-API-12",
      "suppressedAt": "2026-07-14",
      "lastFailedAt": "2026-07-14",
      "lastBranch": "main",
      "env": "qa",
      "lastCommit": "f84924c",
      "expiresAt": "2026-08-14"
    }
  ],
  "runSuppressions": [
    {
      "commit": "f84924c",
      "runDate": "2026-07-15",
      "branch": "main",
      "env": "qa",
      "reason": "CI environment outage — run not representative",
      "ticket": "OPS-42",
      "suppressedAt": "2026-07-15"
    }
  ]
}
```

The schema (`scripts/flaky-suppressions.schema.json`) provides IDE validation.

## Report sections

- **Summary** — run count (split by trunk vs non-main branches), environment, period, average pass rate, overall test
  run probability rate, flaky result rate (excl. and incl. suppressed), failure counts. Headline rates are
  **trunk-only** (`main`).
- **Branch breakdown** — headline trunk-only rates contrasted with the all-branches (incl. non-main) rates; shown only
  when runs mix branches.
- **Action Required** — recent regressions: streak or majority of recent window failing.
- **Flaky tests** — intermittent failures sorted by frequency.
- **Consistently failing** — tests broken in most runs.
- **Rare failures** — one-off failures.
- **Error patterns** — recurring error messages across multiple tests.
- **Run history** — last 20 runs with per-run stats.
- **Suppressed** — known test issues and excluded runs with linked ticket or incident, date, branch, environment, and
  commit metadata.

## CI integration

After the existing "Save Reports and Artifacts" step, add a single step. The script handles fetching, appending,
committing, and pushing to `test-results` internally via git plumbing.

```yaml
- script: |
    CI=true node scripts/collect-test-results.js
  displayName: 'Collect Test Results'
  condition: always()
```

The `FlakyReport` stage in `foodalert-audit65-cypress.yml` generates the report. Its `flaky_report_env`
parameter (`qa` default, or `dev` / `all`) selects the scope: the stage runs `report:flaky:<env>` and publishes
`reports/flaky-tests-<env>.md` uniformly for every value.

## Deduplication

Each run is identified by a unique `runId`. The `runId` is resolved with this precedence, chosen so that retries of the
collection step never double-record yet distinct executions are never dropped:

1. **`RESULTS_RUN_ID`** — explicit override; the single source of truth when CI can inject a guaranteed-unique,
   retry-stable id.
2. **CI build id** — unique per execution and stable across step retries, so it (not the timestamp)
   guarantees uniqueness. The build id folds in the **re-run attempt** so re-runs stay distinct:
   Azure `BUILD_BUILDID`+`SYSTEM_JOBATTEMPT`, GitHub `GITHUB_RUN_ID`+`GITHUB_RUN_ATTEMPT`, GitLab
   `CI_PIPELINE_ID`, CircleCI `CIRCLE_WORKFLOW_ID`, Jenkins `BUILD_NUMBER`.
3. **No build id** — fall back to a millisecond-precision timestamp plus the process id, so two distinct executions on
   the same commit/env can never collide.

Before appending, the script scans the ledger and skips the entry only if that exact `runId` is already present. Dedup
is keyed on the per-execution identity — **not** on `commit + env` — so repeated runs of the same commit (daily
scheduled runs against an unchanged `main`, or manual re-runs) are each recorded. Those repeated executions are exactly
the signal flaky-test detection depends on.

## Troubleshooting

- **Skipped: not a CI run** — `CI` env var is not `true`. Expected for local runs; only CI populates the ledger.
- **No report files found** — tests not run or reports directory empty. Check the reports directory path in the CI step.
- **Branch not found** — no CI runs have collected results yet. Wait for the first CI run.
- **Duplicate run skipped** — same `runId` already collected. Expected; the collection step ran twice for one execution.

## Related

- [Parallel execution](parallel-execution.md) — test runner that produces mochawesome reports
- [Coverage gap analysis](coverage-gap-analysis.md) — structural coverage analysis
- [Pre-commit check](pre-commit-check.md) — quality gates
