---
applyTo: "${WORKSPACE_ROOT}/cypress/e2e/ui/*.ui.spec.js"
---

## E2E UI Tests Instructions

**Note**: Always use **absolute paths** via `${WORKSPACE_ROOT}`. Never include real usernames or machine paths.

### File Structure & Naming (kebab-case)
- Tests: `${WORKSPACE_ROOT}/cypress/e2e/ui/workflow-name.ui.spec.js`
- Test Data: `${WORKSPACE_ROOT}/cypress/test-data/ui/workflow-name.test-data.js`
- Selectors: `${WORKSPACE_ROOT}/cypress/support/selectors/selectors.js` (grouped by page/component)
- UI Commands: `${WORKSPACE_ROOT}/cypress/support/commands/ui/page-name.component-name.ui.commands.js`
- API Commands: `${WORKSPACE_ROOT}/cypress/support/commands/api/module-name.api.commands.js`

### Test Organization
- One `describe` block per file with multiple `context` blocks
- Use `{ testIsolation: false }` (isolation occurs between files only)
- `before` in `describe`: preconditions | `before` in `context`: conditions/actions | `it`: expected results
- Reuse test data instances across workflow steps
- Use `String` placeholders for dynamic IDs, populate during execution
- Use API commands for setup/teardown to speed up tests

### Test Titles Pattern
- Given: `FlowName.SubFlowName: Given 'preconditions', 'created data'`
- When: `FlowName.SubFlowName.USER_ROLE: When 'condition'`
- Then: `FlowName.SubFlowName.USER_ROLE: Then 'expected result'`

### Global Resources (auto-imported, no import needed)
`utils`, `l10n`, `colours`, `urls`, `reqs`, `userRoles`, all selectors (e.g., `loginPage`)

### Setup
- Register workflows in `${WORKSPACE_ROOT}/app-structure/workflows.json`
- Structure: `{ "WorkflowName": { "SubFlowName": {} } }`
- Reference `.html` files in `${WORKSPACE_ROOT}/development-data/pages` for development

---

## Test Data (kebab-case files, camelCase variables)

```javascript
export const testData = {
    token: String, // Placeholder for auth token
    validItems: {
        initialItem: {
            id: String,
            title: 'FlowTitle' + utils.extendStringWithRandomSymbols(10),
            priority: utils.getRandomNumber(1, 5),
        },
    },
    invalidItems: {
        missingTitle: {priority: 3},
    },
};
```

---

## UI Commands (Pattern: `pageName__action`)

**CREATE for:** Complex multi-step interactions, reusable workflows, setup/teardown  
**DON'T CREATE for:** Single actions, simple assertions, one-time operations

---

## API Commands for Setup/Teardown (Pattern: `moduleName__action__METHOD`)

Use in `before`/`after` hooks for test data management. Keep properties consistent between API and UI commands.

---

## Selectors (grouped in selectors.js, camelCase, global access)

```javascript
const flowPage = {
    titleInput: '[data-testid="flow-title-input"]',
    submitButton: '[data-testid="flow-submit-btn"]',
};
```

---

## Localization & Theme Testing

```javascript
// Localization
cy.get(pageName.successMessage).should('have.text', l10n.messages.success);

// Theme colours
cy.get(pageName.primaryButton).should('have.css', 'background-color', colours.primary);
```

---

## Bug Logging
When discovering workflow bugs, add entry to `${WORKSPACE_ROOT}/bug-log/bug-log.json` with ID `BUG-[WORKFLOW]-[NUMBER]` and reference in test:
```javascript
// Bug Reference: BUG-CHECKOUT-005 - Cart state not persisted between pages
it('FlowName.SubFlow: Then cart is empty on confirmation page', () => {
  cy.get(flowPage.cartItems).should('have.length', 0); // Actual behavior
});
```

---
