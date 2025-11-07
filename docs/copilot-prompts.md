# Copilot Prompts

## Purpose

This document provides ready-to-use prompts for AI assistants when working with test files in this project. Each prompt
is structured to guide the AI through refactoring and improving tests while following project standards.

---

## Integration API Tests

### Refactoring Prompt

```
TASK: Refactor Integration API test TO production standards
INPUT: attached test file

EXECUTE improvements:
1. EXTRACT hard-coded values TO:
   - `${WORKSPACE_ROOT}/cypress/test-data/api/[module-name].[submodule-name].api.test-data.js`

2. CONSOLIDATE:
   - duplicate assertions INTO reusable helpers

3. OPTIMIZE structure PER:
   - `${WORKSPACE_ROOT}/.github/instructions/integration-api-tests.instructions.md`
   - `${WORKSPACE_ROOT}/docs/naming-conventions.md`

4. VALIDATE coverage AGAINST:
   - `${WORKSPACE_ROOT}/development-data/swagger/[specific-swagger-file]`

5. FIX naming violations PER:
   - `${WORKSPACE_ROOT}/docs/naming-conventions.md`

6. LOG bugs/issues in functionality under test:
   FOLLOW bug logging guidelines FROM:
   - `${WORKSPACE_ROOT}/.github/copilot-instructions.md` (Bug Logging Guidelines section)
   - `${WORKSPACE_ROOT}/.github/instructions/integration-api-tests.instructions.md` (Bug Logging for API Tests section)
   
   TARGET: `${WORKSPACE_ROOT}/cypress/bug_log.json`
   
   ADD bug reference comments IN test file per instructions
   UPDATE test assertions per instructions

7. ENSURE:
   - All tests pass with current API behavior
   - Bug references are clear and traceable
   - Test data uses randomization via utils
   - No sensitive data exposure
   - ESLint compliance

BEFORE code, LIST improvement points:
- WHAT redundancies ARE removed
- WHICH hard-coded values ARE extracted
- WHAT custom commands ARE applied
- HOW assertions ARE consolidated
- WHAT structural changes FOR clarity
- WHAT bugs/issues WERE found and logged

FOLLOW strictly:
- `${WORKSPACE_ROOT}/.github/copilot-instructions.md`
- `${WORKSPACE_ROOT}/.github/instructions/integration-api-tests.instructions.md`

OUTPUT:
- Complete refactored test code (NOT diff, NOT summary)
- Updated/created test-data file(s)
- Updated/created API commands file(s)
- Updated bug_log.json (if bugs found)
```

---

## Integration UI Tests

### Refactoring Prompt

```
TASK: Refactor Integration UI test TO production standards
INPUT: attached test file

EXECUTE improvements:
1. EXTRACT hard-coded values TO:
   - `${WORKSPACE_ROOT}/cypress/test-data/ui/[page-name].[component-name].ui.test-data.js`
   - Use l10n for localized text
   - Use colours for colour values

2. OPTIMIZE structure PER:
   - `${WORKSPACE_ROOT}/.github/instructions/integration-ui-tests.instructions.md`
   - `${WORKSPACE_ROOT}/docs/naming-conventions.md`

3. VALIDATE selectors FROM:
   - `${WORKSPACE_ROOT}/cypress/support/selectors/selectors.js`

4. FIX naming violations PER:
   - `${WORKSPACE_ROOT}/docs/naming-conventions.md`

5. LOG bugs/issues in functionality under test:
   FOLLOW bug logging guidelines FROM:
   - `${WORKSPACE_ROOT}/.github/copilot-instructions.md` (Bug Logging Guidelines section)
   - `${WORKSPACE_ROOT}/.github/instructions/integration-ui-tests.instructions.md` (Bug Logging for UI Tests section)
   
   TARGET: `${WORKSPACE_ROOT}/cypress/bug_log.json`
   
   ADD bug reference comments IN test file per instructions
   UPDATE test assertions per instructions

6. ENSURE:
   - All tests pass with current UI behavior
   - Bug references are clear and traceable
   - Test data uses randomization via utils
   - Selectors use global variables (loginPage, inventoryPage, etc.)
   - ESLint compliance

BEFORE code, LIST improvement points:
- WHAT redundancies ARE removed
- WHICH hard-coded values ARE extracted
- WHAT custom commands ARE applied
- HOW assertions ARE consolidated
- WHAT structural changes FOR clarity
- WHAT bugs/issues WERE found and logged

FOLLOW strictly:
- `${WORKSPACE_ROOT}/.github/copilot-instructions.md`
- `${WORKSPACE_ROOT}/.github/instructions/integration-ui-tests.instructions.md`

OUTPUT:
- Complete refactored test code (NOT diff, NOT summary)
- Updated/created test-data file(s)
- Updated/created UI commands file(s)
- Updated bug_log.json (if bugs found)
```

---

## E2E UI Tests

### Refactoring Prompt

```
TASK: Refactor E2E UI test TO production standards
INPUT: attached test file

EXECUTE improvements:
1. EXTRACT hard-coded values TO:
   - `${WORKSPACE_ROOT}/cypress/test-data/ui/[workflow-name].ui.test-data.js`
   - Use l10n for localized text
   - Use colours for colour values

2. CONSOLIDATE:
   - duplicate navigation steps
   - repetitive form interactions
   - repeated assertions across workflow

3. OPTIMIZE structure PER:
   - `${WORKSPACE_ROOT}/.github/instructions/e2e-ui-tests.instructions.md`
   - `${WORKSPACE_ROOT}/docs/naming-conventions.md`

4. VALIDATE selectors FROM:
   - `${WORKSPACE_ROOT}/cypress/support/selectors/selectors.js`

5. LOG bugs/issues in functionality under test:
   FOLLOW bug logging guidelines FROM:
   - `${WORKSPACE_ROOT}/.github/copilot-instructions.md` (Bug Logging Guidelines section)
   - `${WORKSPACE_ROOT}/.github/instructions/e2e-ui-tests.instructions.md` (Bug Logging for E2E Tests section)
   
   TARGET: `${WORKSPACE_ROOT}/cypress/bug_log.json`
   
   ADD bug reference comments IN test file per instructions
   UPDATE test assertions per instructions

6. ENSURE:
   - All E2E flows complete successfully
   - Bug references maintain integration context
   - Test data uses randomization via utils
   - Selectors use global variables
   - ESLint compliance

BEFORE code, LIST improvement points:
- WHAT redundancies ARE removed
- WHICH hard-coded values ARE extracted
- WHAT custom commands ARE applied
- HOW workflow steps ARE optimized
- WHAT structural changes FOR clarity
- WHAT bugs/issues WERE found and logged

FOLLOW strictly:
- `${WORKSPACE_ROOT}/.github/copilot-instructions.md`
- `${WORKSPACE_ROOT}/.github/instructions/e2e-ui-tests.instructions.md`

OUTPUT:
- Complete refactored test code (NOT diff, NOT summary)
- Updated/created test-data file(s)
- Updated/created UI commands file(s)
- Updated bug_log.json (if bugs found)
```

---

## Test Data File Creation

### Creating Test Data

```
TASK: Create test data file for [test file]
INPUT: test file with hard-coded values

REQUIREMENTS:
1. CREATE IN:
   - `${WORKSPACE_ROOT}/cypress/test-data/api/[module].[submodule].api.test-data.js` (for API)
   - `${WORKSPACE_ROOT}/cypress/test-data/ui/[page].[component].ui.test-data.js` (for UI)

2. STRUCTURE data BY:
   - Valid test cases
   - Invalid test cases
   - Edge cases
   - Search filters/parameters

3. USE randomization:
   - `utils.generateRandomString(length)` for unique strings
   - `utils.getRandomNumber(min, max)` for numbers
   - Current/future dates for temporal data

4. EXPORT as:
   - `export const [moduleName]_testData = { ... }`

OUTPUT:
- Complete test data file
- Updated test file importing and using test data
```

---

## Bug Investigation

### Investigating Test Failures

```
TASK: Investigate and resolve test failure
INPUT: failing test details and error message

EXECUTE:
1. ANALYZE failure:
   - Is it a test code issue?
   - Is it actual functionality bug?
   - Is it expected vs actual behavior mismatch?

2. IF test code issue:
   - FIX the test code
   - UPDATE assertions
   - ENSURE proper selectors/commands

3. IF functionality bug:
   - LOG to `${WORKSPACE_ROOT}/cypress/bug_log.json` following:
     * `${WORKSPACE_ROOT}/.github/copilot-instructions.md` (Bug Logging Guidelines)
   - ADD bug reference comment in test
   - UPDATE assertions to validate ACTUAL behavior
   - ENSURE test passes with current behavior

4. DOCUMENT:
   - Root cause analysis
   - Changes made
   - Bug logged (if applicable)

OUTPUT:
- Fixed test code
- Updated bug_log.json (if bug found)
- Explanation of the issue and resolution
```

---

## Test Creation

### Creating New Integration API Tests

```
TASK: Create Integration API tests for [module/endpoint]
INPUT: API documentation/Swagger specification

REQUIREMENTS:
1. CREATE test file IN:
   - `${WORKSPACE_ROOT}/cypress/integration/api/[module-name].[submodule-name].api.spec.js`

2. FOLLOW structure FROM:
   - `${WORKSPACE_ROOT}/.github/instructions/integration-api-tests.instructions.md`
   - Use template provided in instructions

3. REGISTER module IN:
   - `${WORKSPACE_ROOT}/app-structure/modules.json`
   - Structure: `{ "ModuleName": { "SubmoduleName": { "Action": {} } } }`

4. CREATE test data file:
   - `${WORKSPACE_ROOT}/cypress/test-data/api/[module-name].[submodule-name].api.test-data.js`
   - Use randomization via `utils` functions

5. CREATE API commands:
   - `${WORKSPACE_ROOT}/cypress/support/commands/api/[module-name].api.commands.js`
   - Follow naming: `moduleName__action__METHOD`

6. COVER test scenarios:
   - Happy path (valid data)
   - Validation errors (missing/invalid fields)
   - Authentication/authorization errors
   - Edge cases (boundary values)
   - Error handling

7. LOG bugs found:
   FOLLOW: `${WORKSPACE_ROOT}/.github/copilot-instructions.md` (Bug Logging Guidelines)
   TARGET: `${WORKSPACE_ROOT}/cypress/bug_log.json`

OUTPUT:
- Complete test file with all scenarios
- Test data file
- API commands file
- Updated modules.json
- Summary of test coverage
- Bugs found (if any)
```

### Creating New Integration UI Tests

```
TASK: Create Integration UI tests for [page/component]
INPUT: Page/component specifications

REQUIREMENTS:
1. CREATE test file IN:
   - `${WORKSPACE_ROOT}/cypress/integration/ui/[page-name].[component-name].ui.spec.js`

2. FOLLOW structure FROM:
   - `${WORKSPACE_ROOT}/.github/instructions/integration-ui-tests.instructions.md`

3. REGISTER component IN:
   - `${WORKSPACE_ROOT}/app-structure/components.json` (for components)
   - `${WORKSPACE_ROOT}/app-structure/modules.json` (for pages)

4. ADD selectors TO:
   - `${WORKSPACE_ROOT}/cypress/support/selectors/selectors.js`
   - Use global selector variables

5. CREATE test data file:
   - `${WORKSPACE_ROOT}/cypress/test-data/ui/[page-name].[component-name].ui.test-data.js`

6. CREATE UI commands (if needed):
   - `${WORKSPACE_ROOT}/cypress/support/commands/ui/[page-name].ui.commands.js`
   - Follow naming: `pageName__action__UI`

7. COVER test scenarios:
   - Element visibility and rendering
   - User interactions (click, type, select)
   - Validation messages
   - State changes
   - Error handling
   - Localization (use `l10n`)
   - Colour themes (use `colours`)

8. LOG bugs found:
   FOLLOW: `${WORKSPACE_ROOT}/.github/copilot-instructions.md` (Bug Logging Guidelines)
   TARGET: `${WORKSPACE_ROOT}/cypress/bug_log.json`

OUTPUT:
- Complete test file with all scenarios
- Test data file
- UI commands file (if created)
- Updated selectors
- Updated app-structure files
- Summary of test coverage
- Bugs found (if any)
```

### Creating New E2E UI Tests

```
TASK: Create E2E UI tests for [user workflow]
INPUT: User workflow/user story specifications

REQUIREMENTS:
1. CREATE test file IN:
   - `${WORKSPACE_ROOT}/cypress/e2e/ui/[workflow-name].ui.spec.js`

2. FOLLOW structure FROM:
   - `${WORKSPACE_ROOT}/.github/instructions/e2e-ui-tests.instructions.md`

3. REGISTER workflow IN:
   - `${WORKSPACE_ROOT}/app-structure/workflows.json`
   - Structure: `{ "WorkflowName": { "SubFlowName": {} } }`

4. CREATE test data file:
   - `${WORKSPACE_ROOT}/cypress/test-data/ui/[workflow-name].ui.test-data.js`

5. USE existing commands FROM:
   - `${WORKSPACE_ROOT}/cypress/support/commands/ui/` (for UI interactions)
   - `${WORKSPACE_ROOT}/cypress/support/commands/api/` (for setup/teardown)

6. COVER workflow scenarios:
   - Complete happy path flow
   - Alternative paths
   - Error scenarios
   - Back navigation
   - Data persistence across pages

7. LOG bugs found:
   FOLLOW: `${WORKSPACE_ROOT}/.github/copilot-instructions.md` (Bug Logging Guidelines)
   TARGET: `${WORKSPACE_ROOT}/cypress/bug_log.json`

OUTPUT:
- Complete E2E test file
- Test data file
- Updated workflows.json
- Summary of workflow coverage
- Bugs found (if any)
```

---

## Coverage Gap Analysis

### Finding Missing API Test Coverage

```
TASK: Analyze API test coverage gaps
INPUT: Swagger/API documentation + existing test files

EXECUTE:
1. COMPARE:
   - Documented endpoints vs tested endpoints
   - HTTP methods vs test coverage
   - Request/response fields vs validated fields
   - Error scenarios vs tested error cases

2. IDENTIFY gaps IN:
   - Untested endpoints
   - Missing HTTP methods (GET, POST, PUT, PATCH, DELETE)
   - Unvalidated request parameters
   - Unvalidated response fields
   - Missing error scenario tests
   - Missing edge case tests

3. PRIORITIZE by:
   - Critical business functionality
   - High-risk operations (create, update, delete)
   - Authentication/authorization scenarios
   - Data validation requirements

4. GENERATE test scenarios FOR:
   - Missing endpoints
   - Missing methods on existing endpoints
   - Unvalidated fields
   - Error cases not covered

OUTPUT:
- List of untested endpoints/methods
- Missing test scenarios by priority
- Recommended test cases to add
- Coverage percentage estimate
```

### Finding Missing UI Test Coverage

```
TASK: Analyze UI test coverage gaps
INPUT: Application pages/components + existing test files

EXECUTE:
1. COMPARE:
   - Available pages vs tested pages
   - UI components vs tested components
   - User interactions vs tested interactions
   - Form fields vs validated fields

2. IDENTIFY gaps IN:
   - Untested pages/components
   - Missing user interaction tests
   - Unvalidated form fields
   - Missing error message validations
   - Untested responsive behaviors
   - Missing localization tests
   - Untested colour theme variations

3. CHECK for:
   - Buttons not clicked
   - Input fields not validated
   - Dropdowns not tested
   - Navigation paths not covered
   - Error messages not verified

4. PRIORITIZE by:
   - Critical user workflows
   - High-frequency user interactions
   - Error-prone areas
   - Business-critical forms

OUTPUT:
- List of untested pages/components
- Missing interaction test scenarios
- Unvalidated UI elements
- Recommended test cases by priority
```

### Finding Missing E2E Workflow Coverage

```
TASK: Analyze E2E workflow coverage gaps
INPUT: User stories/workflows + existing E2E test files

EXECUTE:
1. COMPARE:
   - Documented user workflows vs tested workflows
   - User stories vs E2E test coverage
   - Critical paths vs tested paths

2. IDENTIFY gaps IN:
   - Untested user workflows
   - Missing alternative paths
   - Uncovered error scenarios
   - Missing integration points
   - Untested cross-page interactions

3. MAP user journeys:
   - Login → Action → Result workflows
   - Multi-step processes
   - Data flow across pages
   - State persistence scenarios

4. PRIORITIZE by:
   - Business-critical workflows
   - High-frequency user paths
   - Revenue-impacting features
   - Compliance requirements

OUTPUT:
- List of untested workflows
- Missing user journey scenarios
- Integration gaps between pages
- Recommended E2E test cases by priority
```

### Comprehensive Coverage Report

```
TASK: Generate comprehensive test coverage report
INPUT: All test files + application specifications

EXECUTE:
1. ANALYZE all test types:
   - Integration API tests
   - Integration UI tests
   - E2E UI tests

2. CALCULATE coverage:
   - API endpoints covered (%)
   - UI components covered (%)
   - User workflows covered (%)
   - Error scenarios covered (%)

3. IDENTIFY critical gaps:
   - High-priority untested functionality
   - Business-critical missing tests
   - Security/validation gaps
   - Integration gaps

4. GENERATE recommendations:
   - Immediate priorities (must have)
   - Medium-term additions (should have)
   - Nice-to-have coverage (could have)

OUTPUT:
- Coverage summary by test type
- Coverage percentage by module/area
- Critical gaps requiring immediate attention
- Prioritized list of tests to create
- Estimated effort for full coverage
```

---

## Usage Guidelines

### When to Use Each Prompt

| Prompt Type                           | Use When                                             |
|---------------------------------------|------------------------------------------------------|
| **Integration API Tests Refactoring** | Refactoring existing API test files                  |
| **Integration UI Tests Refactoring**  | Refactoring existing UI component/page tests         |
| **E2E UI Tests Refactoring**          | Refactoring existing end-to-end workflow tests       |
| **Test Data File**                    | Extracting hard-coded test values                    |
| **Bug Investigation**                 | Resolving test failures                              |
| **Creating API Tests**                | Writing new Integration API tests from scratch       |
| **Creating UI Tests**                 | Writing new Integration UI tests from scratch        |
| **Creating E2E Tests**                | Writing new E2E workflow tests from scratch          |
| **API Coverage Gaps**                 | Finding missing API endpoint/method coverage         |
| **UI Coverage Gaps**                  | Finding missing UI component/interaction coverage    |
| **E2E Coverage Gaps**                 | Finding missing workflow/user journey coverage       |
| **Comprehensive Report**              | Getting full coverage analysis across all test types |

### Best Practices

**Always reference instruction files** - Don't duplicate guidelines  
**Use ${WORKSPACE_ROOT}** - Never use absolute local paths  
**Follow naming conventions** - Consistency is critical  
**Log bugs systematically** - Use provided guidelines  
**Ensure tests pass** - Validate actual behavior, not expected  
**Maintain traceability** - Bug references link tests to issues

### Pseudo-Code Syntax for LLM Instructions

**Structured commands** - `TASK`, `TARGET`, `INPUT`, `OUTPUT`, `REQUIREMENTS`, `EXECUTE`
**Clear operations** - `FOLLOW`, `USE`, `EXTRACT`, `INCLUDE`, `COVER`, `IDENTIFY`, `REPLACE`, `CONSOLIDATE`
**Explicit logic flow** - `THEN`, `BEFORE`, `AGAINST`, `FROM`, `TO`, `WITH`, `PER`
**Constraint declarations** - `MUST`, `NO`, `ONLY`, `ALL`
**Hierarchical structure** - Indentation and bullet points for nested requirements
**Action-oriented verbs** - All caps for operations makes them stand out as executable instructions

---
