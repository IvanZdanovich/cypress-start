# Coverage gap analysis

Script: `scripts/analyze-coverage-gaps.js`

Compares actual test implementation against expected structure definitions (
`eslint-plugin-custom-rules/app-structure/expected/`), reporting missing coverage, structural inconsistencies, and test
health.

## Metrics

- **Path coverage** — expected paths implemented (%).
- **Test coverage** — active (non-skipped) tests / total tests (%).
- **Missing paths** — expected but not implemented.
- **Extra paths** — implemented but not in expected structure.

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
npm run coverage:report     # Markdown report for all types
npm run coverage:check      # Fail if below threshold
```

## Options

- **`--type`** — test type to analyze. Default `all`; values `integration-ui`, `integration-api`, `e2e-ui`, `all`.
- **`--format`** — output format. Default `both`; values `cli`, `markdown`, `both`.
- **`--output`** — file path for the markdown report. No default.
- **`--threshold`** — minimum coverage %; exits 1 if below. No default.

## How it works

1. **Load expected structure** from JSON files:
    - `app-structure/expected/components.json` (Integration UI)
    - `app-structure/expected/modules.json` (Integration API)
    - `app-structure/expected/workflows.json` (E2E UI)

2. **Parse test files** — extract structure paths from test titles, count total and skipped tests

3. **Compare** — identify missing, extra, and inconsistent paths

4. **Report** — coverage percentages, component-level breakdown, recommendations

## Report sections

- **Summary** — overall coverage percentages.
- **Missing coverage** — paths in expected but not tested, grouped by component.
- **Extra coverage** — paths implemented but not in expected structure.
- **Structural inconsistencies** — paths with different child structures.
- **Coverage by component** — per-component breakdown with status indicators.
- **Recommendations** — priority actions based on results.

## Path coverage vs test coverage

- **Path coverage** = what is tested (are all scenarios defined?)
- **Test coverage** = how well it's tested (are tests running, not skipped?)

Example: 85% path coverage + 70% test coverage = 3 scenarios missing + 15 tests skipped needing attention.

## Troubleshooting

- **0 actual paths** — files not matching the pattern, or titles not following conventions. Verify file location and title format.
- **Expected structure not found** — missing JSON file. Check `app-structure/expected/`.
- **Inconsistent results** — stale files or title formatting. Run `npm run lint --fix` and verify patterns.

## Related

- [ESLint custom rules](eslint-custom-rules.md) — `verify-test-title-against-structure`, title-pattern enforcement
- [Constraints → Examples → Specs](requirements-examples-approach.md) — spec structure
