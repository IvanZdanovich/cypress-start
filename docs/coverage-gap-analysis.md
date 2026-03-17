# Coverage Gap Analysis Script

## Overview

The **Coverage Gap Analysis Script** (`scripts/analyze-coverage-gaps.js`) is a comprehensive test coverage auditing tool
that validates test suite completeness by comparing actual test implementation against expected test structure
definitions. It provides detailed insights into test coverage gaps, structural inconsistencies, and test implementation
status across multiple test types.

## Purpose

This script serves three primary purposes:

1. **Test Coverage Validation** - Ensures all expected test paths are implemented
2. **Structure Compliance** - Verifies actual tests follow the predefined application structure
3. **Test Health Monitoring** - Tracks active vs. skipped tests to assess test suite health

## Key Features

### 1. Multi-Type Test Analysis

Analyzes three distinct test categories:

- **Integration UI Tests** - Component and page-level UI tests
- **Integration API Tests** - Module and endpoint-level API tests
- **E2E UI Tests** - End-to-end user workflow tests

### 2. Dual Coverage Metrics

**Path Coverage** - Measures test structure completeness

- Compares actual test paths against expected structure
- Identifies missing and extra test paths
- Provides component-level breakdown

**Test Coverage** - Measures test implementation health

- Counts total tests vs. active (non-skipped) tests
- Calculates percentage of implemented tests
- Highlights test suite maintenance needs

### 3. Gap Detection

**Missing Coverage**

- Test paths defined in expected structure but not implemented
- Grouped by top-level components for priority assessment
- Critical for identifying untested functionality

**Extra Coverage**

- Test paths implemented but not in expected structure
- May indicate outdated structure definitions or exploratory tests
- Useful for structure maintenance

**Structural Inconsistencies**

- Paths that exist in both structures but have different sub-structures
- Helps identify misalignment between expected and actual test organization
- Prevents test organization drift

### 4. Multiple Output Formats

**CLI Report** (Interactive)

- Color-coded terminal output
- Progress bars for visual coverage representation
- Detailed component-level breakdown
- Prioritized missing coverage lists

**Markdown Report** (Documentation)

- Formatted tables and sections
- Suitable for documentation and tracking
- Can be committed to version control
- Includes recommendations

## How It Works

### 1. Structure Loading

```
┌─────────────────────────────────────────────────────┐
│  Expected Structure (JSON)                          │
│  ├─ Component A                                     │
│  │  ├─ Feature 1                                    │
│  │  └─ Feature 2                                    │
│  └─ Component B                                     │
│     └─ Feature 3                                    │
└─────────────────────────────────────────────────────┘
```

Expected structures are defined in:

- `eslint-plugin-custom-rules/app-structure/expected/components.json` (Integration UI)
- `eslint-plugin-custom-rules/app-structure/expected/modules.json` (Integration API)
- `eslint-plugin-custom-rules/app-structure/expected/workflows.json` (E2E UI)

### 2. Test File Parsing

The script:

1. Scans test directories for relevant test files
2. Parses each file to extract test blocks (`it()` and `it.skip()`)
3. Extracts structure paths from test titles (e.g., `ComponentName.Feature.ROLE: Then...`)
4. Counts total and skipped tests per path
5. Builds actual structure with test counts

### 3. Comparison & Analysis

```
Expected Structure          Actual Structure
       ↓                           ↓
       └─────────── Compare ───────┘
                     ↓
       ┌─────────────────────────┐
       │  Missing Paths          │
       │  Extra Paths            │
       │  Inconsistencies        │
       │  Coverage Metrics       │
       └─────────────────────────┘
```

### 4. Report Generation

Produces actionable insights:

- Overall coverage percentage
- Component-level coverage breakdown
- Prioritized list of missing coverage
- Structural inconsistency warnings
- Test implementation health metrics
- Recommendations for improvement

## Usage

### Basic Usage

```bash
# Analyze specific test type
node scripts/analyze-coverage-gaps.js --type=integration-ui

# Analyze all test types
node scripts/analyze-coverage-gaps.js --type=all
```

### Output Format Options

```bash
# CLI output only (default)
node scripts/analyze-coverage-gaps.js --type=integration-api --format=cli

# Markdown output only
node scripts/analyze-coverage-gaps.js --type=e2e-ui --format=markdown

# Both CLI and Markdown
node scripts/analyze-coverage-gaps.js --type=all --format=both
```

### Save Report to File

```bash
# Save markdown report to file
node scripts/analyze-coverage-gaps.js --type=all --format=markdown --output=reports/coverage-gaps.md

# Save combined report for all types
node scripts/analyze-coverage-gaps.js --type=all --format=both --output=reports/full-coverage-report.md
```

### Enforce Coverage Threshold

```bash
# Fail if coverage below 80%
node scripts/analyze-coverage-gaps.js --type=integration-ui --threshold=80

# Use in CI/CD pipeline
node scripts/analyze-coverage-gaps.js --type=all --threshold=75 || exit 1
```

## Command Line Options

| Option        | Description          | Default | Example                        |
|---------------|----------------------|---------|--------------------------------|
| `--type`      | Test type to analyze | `all`   | `--type=integration-ui`        |
| `--format`    | Output format        | `both`  | `--format=markdown`            |
| `--output`    | Output file path     | `null`  | `--output=reports/coverage.md` |
| `--threshold` | Minimum coverage %   | `null`  | `--threshold=80`               |

### Valid Test Types

- `integration-ui` - Integration UI tests
- `integration-api` - Integration API tests
- `e2e-ui` - E2E UI tests
- `all` - All test types combined

### Valid Formats

- `cli` - Terminal output only
- `markdown` - Markdown output only
- `both` - Both CLI and Markdown

## Use Cases

### 1. Test Planning & Gap Identification

**Scenario**: Planning sprint testing work

```bash
node scripts/analyze-coverage-gaps.js --type=integration-ui --format=markdown --output=reports/ui-gaps.md
```

**Output**: Markdown report showing which components lack tests, prioritized by number of missing paths

**Action**: Assign test creation tasks based on priority components

### 2. Code Review - Coverage Validation

**Scenario**: Reviewing PR that adds new features

```bash
node scripts/analyze-coverage-gaps.js --type=integration-api --format=cli
```

**Output**: CLI report showing if new API endpoints have corresponding tests

**Action**: Reject PR if critical paths are missing from actual tests

### 3. CI/CD - Coverage Enforcement

**Scenario**: Automated coverage checks in CI pipeline

```bash
node scripts/analyze-coverage-gaps.js --type=all --threshold=80 --format=markdown --output=artifacts/coverage-report.md
```

**Output**:

- Markdown report saved as artifact
- Exit code 1 if coverage below 80%

**Action**: Pipeline fails if coverage threshold not met

### 4. Test Maintenance - Identifying Skipped Tests

**Scenario**: Quarterly test suite health check

```bash
node scripts/analyze-coverage-gaps.js --type=all --format=both --output=reports/test-health-$(date +%Y%m%d).md
```

**Output**: Report showing test coverage vs. test implementation health (active vs. skipped)

**Action**:

- Review skipped tests for re-enablement
- Remove permanently obsolete tests
- Fix flaky tests causing skips

### 5. Structure Maintenance - Detecting Drift

**Scenario**: Ensuring test structure aligns with application structure

```bash
node scripts/analyze-coverage-gaps.js --type=all --format=markdown --output=reports/structure-audit.md
```

**Output**: Report highlighting structural inconsistencies between expected and actual

**Action**:

- Update expected structure files for new features
- Refactor test organization to match expected structure
- Remove obsolete structure definitions

### 6. Sprint Retrospective - Coverage Trends

**Scenario**: Tracking coverage improvement over time

```bash
# Run at sprint end
node scripts/analyze-coverage-gaps.js --type=all --format=markdown --output=reports/coverage-sprint-42.md

# Compare with previous sprint reports
diff reports/coverage-sprint-41.md reports/coverage-sprint-42.md
```

**Output**: Coverage changes between sprints

**Action**: Celebrate improvements, address declining coverage

### 7. Documentation - Test Coverage Status

**Scenario**: Generating coverage documentation for stakeholders

```bash
node scripts/analyze-coverage-gaps.js --type=all --format=markdown --output=docs/test-coverage-status.md
```

**Output**: Professional markdown report with tables and metrics

**Action**: Share with product owners, include in documentation site

## Report Sections Explained

### Summary Section

Provides high-level metrics:

| Metric             | Description                                           |
|--------------------|-------------------------------------------------------|
| **Total Expected** | Number of test paths in expected structure            |
| **Total Actual**   | Number of test paths implemented                      |
| **Path Coverage**  | Percentage of expected paths implemented              |
| **Total Tests**    | Total number of test blocks (`it()` calls)            |
| **Active Tests**   | Number of non-skipped tests                           |
| **Test Coverage**  | Percentage of active tests (active/total)             |
| **Missing**        | Number of expected paths not implemented              |
| **Extra**          | Number of implemented paths not in expected structure |

### Missing Coverage Section

Lists test paths that should exist but don't:

- Grouped by top-level component
- Sorted by number of missing paths (highest priority first)
- Limited to top 10 components in CLI, full list in markdown
- Action: Prioritize test creation for these paths

### Extra Coverage Section

Lists test paths that exist but aren't in expected structure:

- May indicate outdated structure definitions
- May indicate exploratory or temporary tests
- Action: Update expected structure or remove unnecessary tests

### Structural Inconsistencies Section

Lists paths with structural mismatches:

- Path exists in both but has different child structure
- Expected leaf node but found branch, or vice versa
- Different child elements at same level
- Action: Align structures or update expected definitions

### Coverage by Component Section

Component-level breakdown with:

- **Expected Paths**: Number of paths defined for component
- **Actual Paths**: Number of paths implemented (+ extra if applicable)
- **Path Coverage**: Percentage of expected paths covered
- **Tests (Active/Total)**: Test implementation status
- **Test Coverage**: Percentage of active tests
- **Status**: Visual indicator (🟢 ≥80%, 🟡 60-79%, 🔴 <60%)

### Recommendations Section

Context-aware suggestions based on analysis results:

- Priority areas for test creation
- Next steps for improving coverage
- Maintenance actions for extra/inconsistent paths

## Integration with Development Workflow

### Pre-Commit Hook

Check coverage before committing:

```bash
# In .git/hooks/pre-commit
node scripts/analyze-coverage-gaps.js --type=all --threshold=75 --format=cli
```

### Pull Request Template

Include coverage check in PR checklist:

```markdown
## Test Coverage

- [ ] Run coverage analysis: `npm run analyze:coverage`
- [ ] Coverage meets threshold (≥80%)
- [ ] No new missing coverage introduced
```

### CI/CD Pipeline

```yaml
# Example GitHub Actions workflow
- name: Analyze Test Coverage
  run: |
    node scripts/analyze-coverage-gaps.js --type=all --threshold=80 --format=markdown --output=coverage-report.md

- name: Upload Coverage Report
  uses: actions/upload-artifact@v3
  with:
    name: coverage-report
    path: coverage-report.md
```

### NPM Scripts

Add to `package.json`:

```json
{
  "scripts": {
    "analyze:coverage": "node scripts/analyze-coverage-gaps.js --type=all --format=both",
    "analyze:ui": "node scripts/analyze-coverage-gaps.js --type=integration-ui",
    "analyze:api": "node scripts/analyze-coverage-gaps.js --type=integration-api",
    "analyze:e2e": "node scripts/analyze-coverage-gaps.js --type=e2e-ui",
    "coverage:report": "node scripts/analyze-coverage-gaps.js --type=all --format=markdown --output=reports/coverage-gaps.md",
    "coverage:check": "node scripts/analyze-coverage-gaps.js --type=all --threshold=80"
  }
}
```

## Understanding Coverage Metrics

### Path Coverage vs. Test Coverage

**Path Coverage** measures **WHAT** is tested:

- Are all expected test scenarios defined?
- Are all components/modules covered?
- Are all user workflows tested?

**Test Coverage** measures **HOW WELL** it's tested:

- Are tests actually running (not skipped)?
- Is the test suite maintained?
- Are tests reliable?

### Example Interpretation

```
Component: UserProfile
Path Coverage: 85% (17/20 paths)
Test Coverage: 70% (35/50 tests active)
```

**Interpretation**:

- 85% of expected test scenarios are implemented ✅
- 3 expected scenarios are missing ⚠️
- 15 tests are skipped, indicating maintenance issues ❌

**Action**:

1. Create tests for 3 missing scenarios
2. Review and fix 15 skipped tests
3. Target: 100% path coverage, 95%+ test coverage

## Best Practices

### 1. Regular Analysis

- Run analysis before each sprint planning
- Include in PR reviews for feature work
- Generate monthly trend reports

### 2. Maintain Expected Structures

- Update expected structures when adding new features
- Remove obsolete paths from expected structures
- Keep structures aligned with current application architecture

### 3. Address Gaps Strategically

- Prioritize high-risk, high-usage components
- Focus on user-facing critical paths first
- Schedule technical debt sprints for low-priority gaps

### 4. Monitor Test Health

- Investigate sudden increases in skipped tests
- Set policies for maximum acceptable skip percentage
- Regularly clean up obsolete skipped tests

### 5. Use in Documentation

- Include coverage reports in sprint reviews
- Track coverage trends over time
- Share with stakeholders for transparency

## Troubleshooting

### No Tests Found

**Issue**: Script reports 0 actual paths

**Causes**:

- Test files not matching expected pattern
- Test titles not following naming convention
- Test directory path incorrect

**Solution**:

1. Verify test files exist in expected directory
2. Check test titles follow format: `Component.Feature.ROLE: Then...`
3. Ensure structure paths are PascalCase with dots

### Expected Structure Not Found

**Issue**: Script skips analysis with "Expected structure not found"

**Cause**: Expected structure JSON file missing

**Solution**:

1. Check file exists at expected path
2. Verify file naming matches configuration
3. Ensure JSON is valid

### Inconsistent Results

**Issue**: Coverage percentages don't match expectations

**Causes**:

- Test files cached from previous run
- Structure files out of sync
- Test title formatting issues

**Solution**:

1. Ensure latest test files are present
2. Regenerate actual structure files
3. Validate test title patterns match conventions

## Related Documentation

- [Test Writing Guidelines](./test-writing-guideline.md) - Test structure and naming conventions
- [Naming Conventions](./naming-conventions.md) - Test title patterns and structure paths
- [ESLint Custom Rules](./eslint-custom-rules.md) - Automated test title validation

## Maintenance

### Script Ownership

**Maintained by**: QA/Test Automation Team

**Review Frequency**: Quarterly or when test structure conventions change

### Configuration Updates

When updating test structure conventions:

1. Update expected structure JSON files
2. Update script configuration if directory paths change
3. Update documentation with new conventions
4. Communicate changes to development team

## Summary

The Coverage Gap Analysis Script is a powerful tool for:

✅ **Visibility** - Know exactly what's tested and what's not  
✅ **Quality** - Ensure comprehensive test coverage  
✅ **Maintenance** - Identify and fix skipped tests  
✅ **Compliance** - Enforce coverage standards in CI/CD  
✅ **Planning** - Prioritize test creation work  
✅ **Documentation** - Generate professional coverage reports

Use it regularly to maintain a healthy, comprehensive test suite that gives confidence in software quality.

