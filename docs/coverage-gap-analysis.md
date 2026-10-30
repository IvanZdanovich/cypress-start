# Coverage gap analysis

Script: `scripts/analyze-coverage-gaps.js`

Compares actual test implementation against expected structure definitions (
`eslint-plugin-custom-rules/app-structure/`), reporting missing coverage, structural inconsistencies, and test
health.

## Metrics

- **Path coverage** — expected paths with at least one active test / expected paths (%).
- **Test coverage** — active tests / total tests (%).
- **Missing paths** — expected paths without active automation.
- **Skipped-only paths** — declared paths with tests, but no active test.
- **Extra paths** — active paths not in the expected structure.

## Usage

```bash
# Analyze specific test type
node scripts/analyze-coverage-gaps.js --type=integration-ui

# All types with CLI and markdown output
node scripts/analyze-coverage-gaps.js --type=all --format=both --output=reports/coverage-gaps.md

# CI enforcement with threshold
node scripts/analyze-coverage-gaps.js --type=all --threshold=80 || exit 1
```

### NPM scripts

```bash
npm run report:coverage                   # all types → reports/coverage-gaps.md
npm run report:coverage:integration-ui    # → reports/coverage-integration-ui.md
npm run report:coverage:integration-api   # → reports/coverage-integration-api.md
npm run report:coverage:e2e-ui            # → reports/coverage-e2e-ui.md
npm run report:coverage:check             # exits 1 when coverage is below 80%
```

## Options

- **`--type`** — test type to analyze. Default `all`; values `integration-ui`, `integration-api`, `e2e-ui`, `all`.
- **`--format`** — output format. Default `both`; values `cli`, `markdown`, `both`.
- **`--output`** — file path for the markdown report. No default.
- **`--threshold`** — minimum coverage %; exits 1 if below. No default.

## How it works

1. **Load expected structure** from JSON files:
    - `app-structure/components.json` (Integration UI)
    - `app-structure/modules.json` (Integration API)
    - `app-structure/workflows.json` (E2E UI)

2. **Parse test files** — use the AST to extract structure paths from test titles, inherit skipped suite state, and
   count total and active tests

3. **Compare** — identify missing, extra, and inconsistent paths

4. **Report** — one Markdown file with the standard sections below

## Report sections

The report has one title and these sections in order. With several test types, each section holds one `###` subsection
per type.

- **Executive Summary** — status line and headline metrics: Path Coverage, Test Coverage, and Missing, Skipped-only and
  Extra Paths. A combined report shows one row per test type.
- **Coverage Metrics** — path and test counts, plus a per-component table of path and test coverage.
- **Coverage Gaps** — Missing Paths grouped by component, Skipped-only Paths, Extra Paths, Structural Inconsistencies,
  and Parse Errors.
- **Recommendations & Next Actions** — priority components with the most missing paths, followed by an action per gap
  kind found.

## Path coverage vs test coverage

- **Path coverage** = what has active automation (does every expected scenario have an active test?)
- **Test coverage** = how well declared tests are running (active tests / total tests).

An `it.skip`, an empty test body, or any test inside `describe.skip` or `context.skip` is pending. A skipped-only path
is missing from path coverage and is also listed separately so declared scope is not mistaken for running automation.

## Troubleshooting

- **0 actual paths** — files not matching the pattern, or titles not following conventions. Verify file location and
  title format.
- **Expected structure not found** — missing JSON file. Check `app-structure/`.
- **Inconsistent results** — stale structure files or title formatting. Run `npm run lint`, which fixes structure files,
  and verify title patterns.

## Related

- [ESLint custom rules](eslint-custom-rules.md) — `verify-test-title-against-structure`, title-pattern enforcement
- [Constraints → Examples → Specs](constraints-examples-specs-approach.md) — spec structure
