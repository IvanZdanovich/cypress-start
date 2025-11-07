---
applyTo: "${WORKSPACE_ROOT}/cypress/integration/ui/*.ui.spec.js"
---

# Integration UI Tests

## File Structure

PLACE files: `cypress/integration/ui/page-name.component-name.ui.spec.js` (kebab-case)
STORE test data: `cypress/test-data/ui/page-name.component-name.test-data.js` (kebab-case)
STORE selectors: `cypress/support/selectors/selectors.js` (grouped by page/component)
STORE UI commands: `cypress/support/commands/ui/` (named by page/component)
STORE API commands: `cypress/support/commands/api/` (named by module/submodule)

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
SAVE dynamically obtained IDs TO test data object
PREFER generated/randomized data USING `utils` functions FOR edge cases
DESCRIBE ALL checked states EXTENSIVELY IN test data

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

AVAILABLE globally VIA `cypress/support/e2e.js` (NO import needed):
- `utils`, `l10n`, `colours`, `urls`, `reqs`, `userRoles`
- All UI selectors (`loginPage`, etc.)

## Development Reference

REFER TO `.html` pages IN `development-data/pages`
REGISTER new page/component IN `app-structure/components.json` BEFORE creating tests
STRUCTURE: `{ "PageName": { "ComponentName": { } } }`
MATCH functional elements (header, forms, modals, etc.)

---

## Test Data Example

STORE: `cypress/test-data/ui/page-name.component-name.test-data.js`
NAMING: kebab-case files, camelCase variables
ORGANIZE: By page/component
USE `String` placeholders FOR dynamic IDs

```javascript
// ${WORKSPACE_ROOT}/cypress/test-data/ui/page-name.component-name.test-data.js
export const testData = {
    validItems: {
        initialItem: {
            itemId: String, // Placeholder for dynamically obtained ID
            title: 'RandomTitle',
            priority: utils.getRandomNumber(1, 5)
        },
        updatedItem: {
            title: 'UpdatedTitle',
            priority: utils.getRandomNumber(6, 10)
        },
    },
    invalidItems: {
        missingTitle: {priority: 3},
        exceedsMaxLength: {
            title: 'Title' + utils.extendStringWithRandomSymbols(reqs.textCapacity.itemTitle),
            priority: 5
        },
    },
};
```

---

## UI Commands

PATTERN: `pageName__action` or `componentName__action`
STORE: `cypress/support/commands/ui/page-name.component-name.ui.commands.js`
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

STORE: `cypress/support/selectors/selectors.js`
GROUP: By page/component
ACCESS: Via global variables (`commonUI`, `loginPage`)

---

## Bug Logging for UI Tests

IDENTIFY UI issues:
- Elements not rendering as documented
- Incorrect validation behavior, missing error messages
- Inconsistent UI state, localization problems

DOCUMENT IN `bug-log/bug-log.json`:
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
