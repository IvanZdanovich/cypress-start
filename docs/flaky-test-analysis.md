# Flaky test analysis

Scripts: `scripts/collect-test-results.js`, `scripts/analyze-flaky-tests.js`

Persists CI test outcomes across runs in a JSONL ledger on a dedicated orphan branch (`test-results`), then identifies
tests that fail intermittently. Collection is CI-only (`CI=true` guard) — local runs are excluded to keep the ledger
free of non-reproducible data. The orphan branch keeps test history separate from code history and avoids touching
protected branches.

## How it works

1. **Collect** (`results:collect`, CI-only) reads mochawesome JSON reports from `cypress/reports/separate-reports/`,
   extracts stats and failures, and commits a new ledger line to the `test-results` orphan branch using git plumbing
   (no working-tree changes)
2. **Analyze** (`results:analyze`, local or CI) fetches `origin/test-results`, reads the ledger via
   `git show`, groups failures by test title, classifies each as flaky / consistent / rare, and writes
   `reports/flaky-tests.md`

## Usage

Collection runs automatically in CI. Analysis can be run locally against the committed ledger.

```bash
# Generate the flaky test report from accumulated CI data
npm run results:analyze

# Analyze only the last 30 runs
node scripts/analyze-flaky-tests.js --last 30

# Write report to a custom location
node scripts/analyze-flaky-tests.js --output path/to/report.md
```

## Storage

The ledger (`test-run-history.jsonl`) lives on the orphan `test-results` branch — not on `main` or feature branches.

- **No branch protection conflicts** — CI pushes to an unprotected branch
- **Clean separation** — test history doesn't pollute code commit history
- **No merge conflicts** — the ledger never intersects with feature work
- **Local access** — `git fetch origin test-results` then `npm run results:analyze`

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

Only the **first failure per spec file** is recorded — tests within a file are dependent on previous ones, so
subsequent failures are unreliable. Each failure includes `file`, `context` (describe/context block titles), and
`it` (test title) for precise location.

## Retention

The ledger is a **rolling window** of the most recent runs. After appending a new run, the collector keeps the
newest `MAX_RUNS` lines (default **100** — the new run plus the previous 99) and prunes anything older, in the same
atomic push. This bounds the ledger file size and keeps `git show` / analysis fast regardless of project age.

- **Default:** 100 runs. Override with `--max-runs <N>` or the `RESULTS_MAX_RUNS` env var.
- **Disable:** set `--max-runs 0` (or `RESULTS_MAX_RUNS=0`) for an unbounded ledger.
- **Concurrency-safe:** pruning rides on the existing fetch → dedup → retry loop, so parallel pipelines converge on
  the same trimmed state.
- **Scope:** retention trims the ledger *file content*. Commit history is bounded separately (see below).

```bash
# Keep only the last 50 runs
node scripts/collect-test-results.js --max-runs 50

# Equivalent via env
RESULTS_MAX_RUNS=50 npm run results:collect
```

## Commit history

The `test-results` branch is kept as a **single rolling orphan commit** — never a growing parent chain — so its
commit history is permanently bounded to one commit regardless of how many runs accumulate. This is safe because the
ledger file is self-contained: it already holds the last `MAX_RUNS` runs, and every entry is self-describing
(`runId`, `timestamp`, `commit`, `buildId`).

Each collect run rebuilds the branch tip via git plumbing (`commit-tree` with no parent) and replaces it with
`git push --force-with-lease`. The lease is a compare-and-swap against the fetched tip: if a parallel pipeline pushed
in between, the push is rejected (`stale info`) and the retry loop re-fetches, re-applies retention, and rebuilds —
so the single-commit design loses neither data nor concurrency safety. Per-run audit trail is preserved in the entry
fields, not in git history.

## Classification

- **Flaky** (10%–79% fail rate) — fails intermittently; investigate.
- **Consistent** (≥ 80%) — fails in most runs; likely broken, not flaky.
- **Rare** (< 10%) — failed once or twice; may be environment noise.

## Suppressions

Known or reviewed failures can be suppressed from the actionable report sections so the report stays focused on real
regressions. Suppressed tests move to a dedicated section at the bottom of `reports/flaky-tests.md`.

**Why suppress** — a failure linked to a tracked ticket (backend bug, environment instability, pending feature) clutters
the "Action Required" and "Flaky" sections. Suppressing it signals "reviewed, not actionable right now" without losing
visibility.

**File** — `scripts/flaky-suppressions.json`. Each entry identifies a test by `file` + `it` (+ optional `context`) and
carries `reason`, `ticket`, optional `expiresAt`.

**Auto-expiry** — entries with an `expiresAt` date resurface in the main report after that date passes. Use this to
force a re-check (e.g. 30 days after a backend fix is expected).

**Bypass** — `node scripts/analyze-flaky-tests.js --no-suppress` shows the full unfiltered report.

### Interactive CLI

```bash
# Add suppressions — shows unsuppressed failures, multi-select, prompts for ticket/reason/expiry
npm run results:suppress

# Remove suppressions — shows current entries, multi-select to unsuppress
npm run results:unsuppress

# Review — cleans expired entries, shows status summary, offers add/remove
npm run results:review
```

Select tests that share a common reason and ticket in one session. Run again for a different group.

### Manual editing

Add entries directly to `scripts/flaky-suppressions.json`:

```json
{
  "file": "audit.scoring-question-categories.api.spec.js",
  "it": "Scoring.QuestionCategories.GET: Then return a 200 status code and audit score data",
  "reason": "Backend scoring endpoint intermittent 500",
  "ticket": "BUG-API-12",
  "suppressedAt": "2026-07-14",
  "expiresAt": "2026-08-14"
}
```

The schema (`scripts/flaky-suppressions.schema.json`) provides IDE validation.

## Report sections

- **Summary** — run count, period, overall pass rate, failure counts.
- **Action Required** — recent regressions: streak or majority of recent window failing.
- **Flaky tests** — intermittent failures sorted by frequency.
- **Consistently failing** — tests broken in most runs.
- **Rare failures** — one-off failures.
- **Error patterns** — recurring error messages across multiple tests.
- **Run history** — last 20 runs with per-run stats.
- **Suppressed** — known issues with linked ticket, shown for reference only.

## CI integration

After the existing "Save Reports and Artifacts" step, add a single step. The script handles fetching, appending,
committing, and pushing to `test-results` internally via git plumbing.

```yaml
- script: |
    CI=true npm run results:collect
  displayName: 'Collect Test Results'
  condition: always()
```

## Deduplication

Each run is identified by a unique `runId`. The `runId` is resolved with this precedence, chosen so
that retries of the collection step never double-record yet distinct executions are never dropped:

1. **`RESULTS_RUN_ID`** — explicit override; the single source of truth when CI can inject a
   guaranteed-unique, retry-stable id.
2. **CI build id** — unique per execution and stable across step retries, so it (not the timestamp)
   guarantees uniqueness. The build id folds in the **re-run attempt** so re-runs stay distinct:
   Azure `BUILD_BUILDID`+`SYSTEM_JOBATTEMPT`, GitHub `GITHUB_RUN_ID`+`GITHUB_RUN_ATTEMPT`, GitLab
   `CI_PIPELINE_ID`, CircleCI `CIRCLE_WORKFLOW_ID`, Jenkins `BUILD_NUMBER`.
3. **No build id** — fall back to a millisecond-precision timestamp plus the process id, so two
   distinct executions on the same commit/env can never collide.

Before appending, the script scans the ledger and skips the entry only if that exact `runId` is
already present. Dedup is keyed on the per-execution identity — **not** on `commit + env` — so
repeated runs of the same commit (daily scheduled runs against an unchanged `main`, or manual
re-runs) are each recorded. Those repeated executions are exactly the signal flaky-test detection
depends on.

## Troubleshooting

- **Skipped: not a CI run** — `CI` env var is not `true`. Expected for local runs; only CI populates the ledger.
- **No report files found** — tests not run or reports directory empty. Check the reports directory path in the CI step.
- **Branch not found** — no CI runs have collected results yet. Wait for the first CI run.
- **Duplicate run skipped** — same `runId` already collected. Expected; the collection step ran twice for one execution.

## Related

- [Parallel execution](parallel-execution.md) — test runner that produces mochawesome reports
- [Coverage gap analysis](coverage-gap-analysis.md) — structural coverage analysis
- [Pre-commit check](pre-commit-check.md) — quality gates
