---
applyTo: "${WORKSPACE_ROOT}/cypress/integration/ui/*.ui.spec.js"
---

# Integration UI Tests

## File Structure

PLACE files: `${WORKSPACE_ROOT}/cypress/integration/ui/page-name.component-name.ui.spec.js` (kebab-case)
STORE test data: `${WORKSPACE_ROOT}/cypress/test-data/ui/page-name.component-name.test-data.js` (kebab-case)
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

## Test Data Management

REUSE test data instances ACROSS tests WITHIN file (created → updated → deleted)
DESCRIBE state PER `context` block FOR clarity
DEFINE placeholders WITH `String` type, POPULATE during execution
SAVE dynamically obtained IDs TO test data object immediately after creation
ASSIGN IDs TO specific test data instance (e.g., `testData.validItems.initialItem.itemId = response.body.itemId`)
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

`describe`: `PageName.ComponentName: Given 'preconditions', 'created data'`
`context`: `PageName.ComponentName.USER_ROLE: When 'condition'`
`it`: `PageName.ComponentName.USER_ROLE: Then 'expected result'`
ENSURE uniqueness WITHIN file

## Global Resources

AVAILABLE globally VIA `${WORKSPACE_ROOT}/cypress/support/e2e.js` (NO import needed):
- `utils`, `l10n`, `colours`, `urls`, `reqs`, `userRoles`
- All UI selectors (`loginPage`, etc.)

## Development Reference

REFER TO `.html` pages IN `${WORKSPACE_ROOT}/development-data/pages`
REGISTER new page/component IN `${WORKSPACE_ROOT}/app-structure/components.json` BEFORE creating tests
STRUCTURE: `{ "PageName": { "ComponentName": { } } }`
MATCH functional elements (header, forms, modals, etc.)

---

## Test Data Structure

STORE: `${WORKSPACE_ROOT}/cypress/test-data/ui/page-name.component-name.test-data.js`
NAMING: kebab-case files, camelCase variables
ORGANIZE: By page/component
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
❌ Overly specific scenarios with conditional logic

DECISION: Used in multiple files AND involves multiple steps?
- YES → CREATE custom command
- NO → USE direct Cypress calls

### Command Naming Convention

PATTERN: `pageName__action` or `componentName__action`
USE `__` separator
USE camelCase FOR page/component and action names
ACTION describes business operation, NOT implementation

EXAMPLES:
- `loginPage__login(user)` - Logs in user with credentials
- `cartPage__addProduct(product)` - Adds product to cart
- `headerComp__logout()` - Logs out user via header menu

---

## UI Selectors

STORE: `${WORKSPACE_ROOT}/support/selectors/selectors.js`
GROUP: By page/component
ACCESS: Via global variables (`commonUI`, `loginPage`)

---

## Bug Logging for UI Tests

IDENTIFY UI issues:
- Elements not rendering as documented
- Incorrect validation behavior, missing error messages
- Inconsistent UI state, localization problems

DOCUMENT IN `${WORKSPACE_ROOT}/bug-log/bug-log.json`:
- FORMAT: `BUG-[PAGE/COMPONENT]-[NUMBER]`
- INCLUDE: all required fields per main instructions

ADD bug reference comment:
```javascript
// Bug Reference: BUG-FORM-003 - Missing validation error message for email field
it('PageName.ComponentName: Then no error message is displayed', () => {
  cy.get(pageName.componentName.errorMessage).should('not.exist'); // Actual behavior
});
```

---
