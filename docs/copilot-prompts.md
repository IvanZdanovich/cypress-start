# Pseudo-Code Syntax for LLM Instructions
1. **Structured commands** - `TASK`, `TARGET`, `INPUT`, `OUTPUT`, `REQUIREMENTS`, `EXECUTE`
2. **Clear operations** - `FOLLOW`, `USE`, `EXTRACT`, `INCLUDE`, `COVER`, `IDENTIFY`, `REPLACE`, `CONSOLIDATE`
3. **Explicit logic flow** - `THEN`, `BEFORE`, `AGAINST`, `FROM`, `TO`, `WITH`, `PER`
4. **Constraint declarations** - `MUST`, `NO`, `ONLY`, `ALL`
5. **Hierarchical structure** - Indentation and bullet points for nested requirements
6. **Action-oriented verbs** - All caps for operations makes them stand out as executable instructions

# Copilot Prompts for Test Operations

## Creation (Writing)

### Integration API Tests

```
TASK: Generate Integration API test
TARGET: [specific endpoint/functionality name]

REQUIREMENTS:
FOLLOW strictly:
- `${WORKSPACE_ROOT}/.github/copilot-instructions.md`
- `${WORKSPACE_ROOT}/.github/instructions/integration-api-tests.instructions.md`
- `${WORKSPACE_ROOT}/docs/naming-conventions.md`

USE specifications FROM:
- `${WORKSPACE_ROOT}/development-data/swagger/[specific-swagger-file].json`

INCLUDE:
- ALL HTTP methods (GET, POST, PUT, DELETE, PATCH)
- ALL status codes (2xx, 4xx, 5xx)
- ALL response schemas
- authentication scenarios
- validation scenarios
- error scenarios
- request body examples
- response body examples

CONSTRAINTS:
- NO placeholders
- NO abstractions
- MUST be executable code

OUTPUT: Complete working test code
```

### Integration UI Tests

```
TASK: Generate Integration UI test
TARGET: [specific component/page name]

REQUIREMENTS:
FOLLOW strictly:
- `${WORKSPACE_ROOT}/.github/copilot-instructions.md`
- `${WORKSPACE_ROOT}/.github/instructions/integration-ui-tests.instructions.md`

EXTRACT selectors FROM:
- `${WORKSPACE_ROOT}/development-data/pages/[specific-html-file].html`

USE ONLY existing selectors FROM:
- `${WORKSPACE_ROOT}/cypress/support/selectors/selectors.js`

COVER:
- ALL interactive elements (buttons, inputs, dropdowns, links)
- ALL states (visible, hidden, enabled, disabled)
- ALL validation scenarios
- ALL localization keys

CONSTRAINTS:
- NO generic examples
- NO abstract selectors
- MUST be production-ready

OUTPUT: Complete working test code with actual selectors
```

### E2E UI Tests

```
TASK: Generate E2E UI test
TARGET: [specific user flow/scenario]

REQUIREMENTS:
FOLLOW strictly:
- `${WORKSPACE_ROOT}/.github/copilot-instructions.md`
- `${WORKSPACE_ROOT}/.github/instructions/e2e-ui-tests.instructions.md`

EXTRACT selectors FROM:
- `${WORKSPACE_ROOT}/development-data/pages/[list-specific-files].html`

MAP:
- COMPLETE user journey (start -> finish)
- ALL critical steps
- ALL assertions per step

COVER:
- success paths
- error handling paths

CONSTRAINTS:
- NO pseudocode
- NO modifications needed
- MUST be executable

OUTPUT: Complete working test suite
```

---

## Analysis and Coverage Gaps Search (Updating)

### Integration API Tests

```
TASK: Analyze Integration API test coverage
INPUT: attached test file
COMPARE against: `${WORKSPACE_ROOT}/development-data/swagger/[specific-swagger-file].json`

DELIVER list OF:
1. MISSING endpoint methods:
    - IDENTIFY uncovered: GET, POST, PUT, DELETE, PATCH

2. MISSING response status codes:
    - IDENTIFY uncovered: 2xx, 4xx, 5xx

3. MISSING request validations:
    - IDENTIFY uncovered: required params, optional params, formats

4. MISSING response schema fields:
    - IDENTIFY uncovered fields

5. MISSING edge cases:
    - IDENTIFY uncovered: empty values, boundaries, special characters

6. MISSING auth scenarios:
    - IDENTIFY uncovered: authentication, authorization

THEN PROVIDE improvement points FOR current implementation:
- IDENTIFY redundant assertions TO remove
- IDENTIFY verbose code TO simplify
- IDENTIFY missing helper methods TO add
- IDENTIFY hard-coded values TO extract TO `${WORKSPACE_ROOT}/cypress/test-data/api/`
- IDENTIFY assertions TO consolidate

FOLLOW:
- `${WORKSPACE_ROOT}/.github/copilot-instructions.md`
- `${WORKSPACE_ROOT}/.github/instructions/integration-api-tests.instructions.md`
- `${WORKSPACE_ROOT}/docs/naming-conventions.md`

OUTPUT: Actionable test scenarios + specific improvements (NO vague suggestions)
```

### Integration UI Tests

```
TASK: Analyze Integration UI test coverage
INPUT: attached test file
COMPARE against: `${WORKSPACE_ROOT}/development-data/pages/[specific-html-file].html`

DELIVER list OF:
1. MISSING interactive elements:
    - IDENTIFY untested: buttons, inputs, dropdowns, links

2. MISSING state validations:
    - IDENTIFY untested: enabled, disabled, visible, hidden

3. MISSING error scenarios:
    - IDENTIFY uncovered: error messages, validation messages

4. MISSING localization:
    - IDENTIFY uncovered keys IN `cypress/support/localization/`

5. MISSING responsive/conditional:
    - IDENTIFY untested: responsive behavior, conditional rendering

6. MISSING accessibility:
    - IDENTIFY untested: ARIA labels, roles

THEN PROVIDE improvement points FOR current implementation:
- IDENTIFY repetitive selectors TO move TO `${WORKSPACE_ROOT}/cypress/support/selectors/selectors.js`
- IDENTIFY redundant actions TO replace WITH custom commands
- IDENTIFY complex assertions TO simplify
- IDENTIFY hard-coded strings TO move TO `${WORKSPACE_ROOT}/cypress/test-data/ui/`
- IDENTIFY unnecessary waits TO optimize

FOLLOW:
- `${WORKSPACE_ROOT}/.github/copilot-instructions.md`
- `${WORKSPACE_ROOT}/.github/instructions/integration-ui-tests.instructions.md`

OUTPUT: Specific elements + test cases + concrete improvements (NO generalities)
```

### E2E UI Tests

```
TASK: Analyze E2E UI test coverage
INPUT: attached test file
COMPARE against: `${WORKSPACE_ROOT}/development-data/pages/[list-specific-files].html`

DELIVER list OF:
1. INCOMPLETE user flows:
    - IDENTIFY: missing steps, wrong navigation

2. MISSING alternative paths:
    - IDENTIFY uncovered: decision branches, alternative flows

3. MISSING error recovery:
    - IDENTIFY uncovered: error scenarios, recovery paths

4. MISSING state changes:
    - IDENTIFY untested: data persistence, side effects

5. MISSING cross-page interactions:
    - IDENTIFY untested: page transitions, data handoffs

6. MISSING boundary conditions:
    - IDENTIFY uncovered: workflow boundaries

THEN PROVIDE improvement points FOR current implementation:
- IDENTIFY monolithic blocks TO split INTO focused scenarios
- IDENTIFY duplicate setup/teardown TO extract
- IDENTIFY missing test isolation BETWEEN scenarios
- IDENTIFY hard-coded navigation TO replace WITH custom commands
- IDENTIFY excessive assertions TO reduce

FOLLOW:
- `${WORKSPACE_ROOT}/.github/copilot-instructions.md`
- `${WORKSPACE_ROOT}/.github/instructions/e2e-ui-tests.instructions.md`

OUTPUT: Exact flows + scenarios + actionable improvements (NO summaries)
```

---

## Refactoring for Solid Code Style and Consistency

### Integration API Tests

```
TASK: Refactor Integration API test TO production standards
INPUT: attached test file

EXECUTE improvements:
1. EXTRACT hard-coded values TO:
    - `${WORKSPACE_ROOT}/cypress/test-data/api/[specific-file].js`

2. REPLACE repetitive code WITH:
    - custom commands FROM `${WORKSPACE_ROOT}/cypress/support/commands/api/`

3. CONSOLIDATE:
    - duplicate assertions

4. OPTIMIZE structure PER:
    - `${WORKSPACE_ROOT}/.github/instructions/integration-api-tests.instructions.md`
    - `${WORKSPACE_ROOT}/docs/naming-conventions.md`

5. VALIDATE coverage AGAINST:
    - `${WORKSPACE_ROOT}/development-data/swagger/[specific-swagger-file].json`

6. FIX naming violations PER:
    - `${WORKSPACE_ROOT}/docs/naming-conventions.md`

BEFORE code, LIST improvement points:
- WHAT redundancies ARE removed
- WHICH hard-coded values ARE extracted
- WHAT custom commands ARE applied
- HOW assertions ARE consolidated
- WHAT structural changes FOR clarity

FOLLOW strictly:
- `${WORKSPACE_ROOT}/.github/copilot-instructions.md`
- `${WORKSPACE_ROOT}/.github/instructions/integration-api-tests.instructions.md`

OUTPUT: Complete refactored code (NOT diff, NOT summary)
```

### Integration UI Tests

```
TASK: Refactor Integration UI test TO production standards
INPUT: attached test file

EXECUTE improvements:
1. EXTRACT hard-coded values TO:
    - `${WORKSPACE_ROOT}/cypress/test-data/ui/[specific-file].js`

2. REPLACE inline selectors WITH references FROM:
    - `${WORKSPACE_ROOT}/cypress/support/selectors/selectors.js`

3. REPLACE repetitive actions WITH commands FROM:
    - `${WORKSPACE_ROOT}/cypress/support/commands/ui/`

4. CONSOLIDATE:
    - duplicate assertions
    - cleanup logic

5. VALIDATE coverage AGAINST:
    - `${WORKSPACE_ROOT}/development-data/pages/[specific-html-file].html`

6. FIX naming violations PER:
    - `${WORKSPACE_ROOT}/docs/naming-conventions.md`

BEFORE code, LIST improvement points:
- WHAT repetitive patterns ARE eliminated
- WHICH inline selectors ARE centralized
- WHAT custom commands REPLACE manual actions
- HOW test data IS organized
- WHAT structural changes FOR readability

FOLLOW strictly:
- `${WORKSPACE_ROOT}/.github/copilot-instructions.md`
- `${WORKSPACE_ROOT}/.github/instructions/integration-ui-tests.instructions.md`

OUTPUT: Complete refactored code (NOT diff, NOT summary)
```

### E2E UI Tests

```
TASK: Refactor E2E UI test TO production standards
INPUT: attached test file

EXECUTE improvements:
1. BREAK DOWN monolithic tests INTO:
    - focused scenarios

2. EXTRACT hard-coded values TO:
    - `${WORKSPACE_ROOT}/cypress/test-data/ui/[specific-file].js`

3. USE custom commands FROM:
    - `${WORKSPACE_ROOT}/cypress/support/commands/ui/`

4. ADD proper isolation:
    - test isolation BETWEEN scenarios
    - cleanup logic

5. VALIDATE flow coverage AGAINST:
    - `${WORKSPACE_ROOT}/development-data/pages/[list-files].html`

6. FIX naming violations PER:
    - `${WORKSPACE_ROOT}/docs/naming-conventions.md`

BEFORE code, LIST improvement points:
- HOW scenarios ARE separated FOR focus
- WHAT setup/teardown logic IS extracted
- WHICH navigation steps USE custom commands
- HOW test isolation IS enforced
- WHAT organizational changes FOR maintainability

FOLLOW strictly:
- `${WORKSPACE_ROOT}/.github/copilot-instructions.md`
- `${WORKSPACE_ROOT}/.github/instructions/e2e-ui-tests.instructions.md`

OUTPUT: Complete refactored code (NOT diff, NOT summary)
```
