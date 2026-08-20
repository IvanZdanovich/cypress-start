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
npm run report:coverage           # Markdown report for all types
npm run report:coverage:check     # Fail if below threshold
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

2. **Parse test files** — use the AST to extract structure paths from test titles, inherit skipped suite state, and count total and active tests

3. **Compare** — identify missing, extra, and inconsistent paths

4. **Report** — coverage percentages, component-level breakdown, recommendations

## Report sections

- **Summary** — overall coverage percentages.
- **Missing coverage** — expected paths without active automation, grouped by component.
- **Skipped-only paths** — paths declared by tests whose suites or tests are skipped.
- **Extra coverage** — active paths not in expected structure.
- **Parse errors** — files that could not be parsed while the rest of the analysis continued.
- **Structural inconsistencies** — paths with different child structures.
- **Coverage by component** — per-component breakdown with status indicators.
- **Recommendations** — priority actions based on results.

## Path coverage vs test coverage

- **Path coverage** = what has active automation (does every expected scenario have an active test?)
- **Test coverage** = how well declared tests are running (active tests / total tests).

An `it.skip`, an empty test body, or any test inside `describe.skip` or `context.skip` is pending. A skipped-only path is missing from path coverage and is also listed separately so declared scope is not mistaken for running automation.

## Troubleshooting

- **0 actual paths** — files not matching the pattern, or titles not following conventions. Verify file location and title format.
- **Expected structure not found** — missing JSON file. Check `app-structure/`.
- **Inconsistent results** — stale files or title formatting. Run `npm run lint --fix` and verify patterns.

## Related

- [ESLint custom rules](eslint-custom-rules.md) — `verify-test-title-against-structure`, title-pattern enforcement
- [Constraints → Examples → Specs](constraints-examples-specs-approach.md) — spec structure
