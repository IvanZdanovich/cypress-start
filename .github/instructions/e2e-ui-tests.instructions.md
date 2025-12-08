---
applyTo: "${WORKSPACE_ROOT}/cypress/e2e/ui/*.ui.spec.js"
---

# E2E UI Tests

## File Structure

PLACE files: `${WORKSPACE_ROOT}/cypress/e2e/ui/workflow-name.ui.spec.js` (kebab-case)
STORE test data: `${WORKSPACE_ROOT}/cypress/test-data/ui/workflow-name.test-data.js` (kebab-case)
STORE selectors: `${WORKSPACE_ROOT}/cypress/support/selectors/selectors.js` (grouped by page/component)
STORE UI commands: `${WORKSPACE_ROOT}/cypress/support/commands/ui/` (named by page/component)
STORE API commands: `${WORKSPACE_ROOT}/cypress/support/commands/api/` (named by module/submodule)

## Test Organization

FOLLOW `${WORKSPACE_ROOT}/docs/naming-conventions.md`
STRUCTURE: 1 `describe` block WITH multiple `context` blocks PER file
USE `{ testIsolation: false }` FOR `describe` block (isolation occurs BETWEEN test files)
USE `before` IN `describe` FOR preconditions
USE `before` IN `context` FOR conditions/actions
USE `it` FOR expected results
CONNECT related `context` blocks TO cover scenarios efficiently
USE `context.skip` and `it.skip` WITH descriptions FOR manual verification
NO tags FOR filtering; USE file names

**Prohibited Test Patterns:**
- ❌ NO `forEach` loops over test data within test blocks
- ❌ NO `for...of` loops over test data within test blocks
- ❌ NO dynamic test generation with loops
- ❌ NO multiple values tested in single `it` block
- ✅ USE randomization functions TO select ONE value per test execution
- ✅ EACH `it` block validates ONE scenario with ONE data instance

## Test Data Management

REUSE test data instances ACROSS tests WITHIN file (created → updated → deleted)
DESCRIBE state PER `context` block FOR clarity
DEFINE placeholders WITH `String` type, POPULATE during execution
SAVE dynamically obtained IDs TO test data object immediately after creation
ASSIGN IDs TO specific test data instance (e.g., `testData.validItems.initialItem.id = response.body.id`)
PREFER generated/randomized data USING `utils` functions FOR edge cases
DESCRIBE ALL checked states EXTENSIVELY IN test data

### Test Data Cleanup Strategy

**Test File Independence:**
- EACH test file MUST be independent and executable in isolation
- CLEANUP ensures consistent application state before each test execution
- USE API commands FOR efficient cleanup operations

**Cleanup Implementation:**
- DEFINE cleanup method: `const cleanUp = () => { /* cleanup logic */ }`
- CALL cleanup IN both `before` AND `after` hooks
- USE API commands TO delete test data BY name patterns OR identifiers
- DO NOT rely on IDs only - IDs may be lost between test runs
- ENSURE removal of data from both current AND previous test runs

**Example:**
```javascript
const cleanUp = () => {
  cy.module__deleteByNames__DELETE(token, [testData.namePrefix]);
};

before(() => {
  cy.then(()=>{
    cleanUp(); // Remove leftover data from previous runs
  });
  // Setup test data via API...
});

after(() => {
  cleanUp();
});
```

## Commands Strategy

API commands: USE FOR setup/teardown TO speed up tests
UI commands: CREATE ONLY FOR complex multi-step interactions reused ACROSS multiple files
NO simple wrapper commands AROUND single Cypress actions
USE direct Cypress calls (`.click()`, `.type()`, `.clear()`) FOR simple interactions
KEEP properties consistent BETWEEN API and UI commands
DECOMPOSE parameters FOR readability

## Test Titles Pattern

`describe`: `FlowName.SubFlowName: Given 'preconditions', 'created data'`
`context`: `FlowName.SubFlowName.USER_ROLE: When 'condition'`
`it`: `FlowName.SubFlowName.USER_ROLE: Then 'expected result'`
ENSURE uniqueness WITHIN file

## Global Resources

AVAILABLE globally VIA `${WORKSPACE_ROOT}/support/e2e.js` (NO import needed):
- `utils`, `l10n`, `colours`, `urls`, `reqs`, `userRoles`
- All UI selectors (`loginPage`, etc.)

## Development Reference

REFER TO `.html` pages IN `${WORKSPACE_ROOT}/development-data/pages`
REGISTER new workflows IN `${WORKSPACE_ROOT}/eslint-plugin-custom-rules/app-structure/workflows.json` BEFORE creating tests
STRUCTURE: `{ "WorkflowName": { "SubFlowName": { } } }`
MATCH business terminology

---

## Test Data Structure

STORE: `${WORKSPACE_ROOT}/cypress/test-data/ui/workflow-name.test-data.js`
NAMING: kebab-case files, camelCase variables
USE `String` placeholders FOR dynamic IDs
FOLLOW guidelines FROM `${WORKSPACE_ROOT}/.github/copilot-instructions.md#test-data-guidelines`

---

## UI Commands

PATTERN: `pageName__action` or `componentName__action`
STORE: `${WORKSPACE_ROOT}/cypress/support/commands/ui/page-name.component-name.ui.commands.js`
NAMING: kebab-case files, `__` separator in commands

### When to CREATE Custom Commands

CREATE FOR:
✅ Complex multi-step interactions combining multiple Cypress actions
✅ Reusable workflows used across multiple test files
✅ Setup/teardown operations with multiple UI actions

### When NOT to CREATE

DO NOT CREATE FOR:
❌ Single Cypress actions (`.click()`, `.type()`, `.clear()`)
❌ Simple assertions - keep inline in tests
❌ One-time operations not reused across tests

DECISION: Used in multiple files AND involves multiple steps?
- YES → CREATE custom command
- NO → USE direct Cypress calls

---

## API Commands for Data Setup

USE API commands FROM `${WORKSPACE_ROOT}/cypress/support/commands/api` FOR test data setup and cleanup

---

## UI Selectors

STORE: `${WORKSPACE_ROOT}/cypress/support/selectors/selectors.js`
GROUP: By page/component
ACCESS: Via global variables (`commonUI`, `flowPage`)

---

## Localization and Theme

USE global `l10n` FOR localization strings (NO import)
USE global `colours` FOR theme validation (NO import)

---

## Bug Logging for E2E Tests

IDENTIFY workflow issues:
- Broken user flows, integration failures between components
- Data inconsistency across pages, navigation problems
- State management issues

DOCUMENT IN `bug-log/bug-log.json`:
- FORMAT: `BUG-[WORKFLOW]-[NUMBER]`
- INCLUDE: workflow context and affected pages

ADD bug reference comment:
```javascript
// Bug Reference: BUG-CHECKOUT-005 - Cart state not persisted between pages
it('FlowName.SubFlow: Then cart is empty on confirmation page', () => {
  cy.get(flowPage.cartItems).should('have.length', 0); // Actual behavior
});
```
   
---
