---
applyTo: "${WORKSPACE_ROOT}/cypress/e2e/ui/*.ui.spec.js"
---

# E2E UI Tests

## File Structure

PLACE files: `cypress/e2e/ui/workflow-name.ui.spec.js` (kebab-case)
STORE test data: `cypress/test-data/ui/workflow-name.test-data.js` (kebab-case)
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

`describe`: `FlowName.SubFlowName: Given 'preconditions', 'created data'`
`context`: `FlowName.SubFlowName.USER_ROLE: When 'condition'`
`it`: `FlowName.SubFlowName.USER_ROLE: Then 'expected result'`
ENSURE uniqueness WITHIN file

## Global Resources

AVAILABLE globally VIA `cypress/support/e2e.js` (NO import needed):
- `utils`, `l10n`, `colours`, `urls`, `reqs`, `userRoles`
- All UI selectors (`loginPage`, etc.)

## Development Reference

REFER TO `.html` pages IN `development-data/pages`
REGISTER new workflows IN `app-structure/workflows.json` BEFORE creating tests
STRUCTURE: `{ "WorkflowName": { "SubFlowName": { } } }`
MATCH business terminology

---

## Test Data Example

STORE: `cypress/test-data/ui/workflow-name.test-data.js`
NAMING: kebab-case files, camelCase variables
USE `String` placeholders FOR dynamic IDs

```javascript
// ${WORKSPACE_ROOT}/cypress/test-data/ui/workflow-name.test-data.js
export const testData = {
    token: String, // Placeholder for authentication token
    validItems: {
        initialItem: {
            id: String, // Placeholder for dynamically obtained ID
            title: 'FlowTitle' + utils.extendStringWithRandomSymbols(10),
            priority: utils.getRandomNumber(1, 5),
            status: 'Active',
        },
        updatedItem: {
            title: 'UpdatedTitle' + utils.extendStringWithRandomSymbols(10),
            priority: utils.getRandomNumber(6, 10),
            status: 'Completed',
        },
    },
    invalidItems: {
        missingTitle: {priority: 3},
        exceedsMaxLength: {
            title: 'Title' + utils.extendStringWithRandomSymbols(reqs.textCapacity.itemTitle),
            priority: 5,
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

DECISION: Used in multiple files AND involves multiple steps?
- YES → CREATE custom command
- NO → USE direct Cypress calls

---

## API Commands for Data Setup

USE API commands FROM `cypress/support/commands/api` FOR test data setup and cleanup

---

## UI Selectors

STORE: `cypress/support/selectors/selectors.js`
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
