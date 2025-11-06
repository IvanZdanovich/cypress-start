---
applyTo: "${WORKSPACE_ROOT}/cypress/integration/ui/*.ui.spec.js"
---

## Integration UI Tests Instructions

**Note**: Always use **absolute paths** via `${WORKSPACE_ROOT}`. Never include real usernames or machine paths.

### File Structure & Naming (kebab-case)
- Tests: `${WORKSPACE_ROOT}/cypress/integration/ui/page-name.component-name.ui.spec.js`
- Test Data: `${WORKSPACE_ROOT}/cypress/test-data/ui/page-name.component-name.test-data.js`
- Selectors: `${WORKSPACE_ROOT}/cypress/support/selectors/selectors.js` (grouped by page/component)
- UI Commands: `${WORKSPACE_ROOT}/cypress/support/commands/ui/page-name.component-name.ui.commands.js`
- API Commands: `${WORKSPACE_ROOT}/cypress/support/commands/api/module-name.api.commands.js`

### Test Organization
- One `describe` block per file with multiple `context` blocks
- Use `{ testIsolation: false }` (isolation occurs between files only)
- `before` in `describe`: preconditions | `before` in `context`: conditions/actions | `it`: expected results
- Reuse test data instances (create → update → delete lifecycle)
- Use `String` placeholders for dynamic IDs, populate during execution
- Use `context.skip`/`it.skip` for manual verification scenarios

### Test Titles Pattern
- Given: `PageName.ComponentName: Given 'preconditions', 'created data'`
- When: `PageName.ComponentName.USER_ROLE: When 'condition'`
- Then: `PageName.ComponentName.USER_ROLE: Then 'expected result'`

### Global Resources (auto-imported, no import needed)
`utils`, `l10n`, `colours`, `urls`, `reqs`, `userRoles`, all selectors (e.g., `loginPage`)

### Setup
- Register new pages/components in `${WORKSPACE_ROOT}/app-structure/components.json`
- Structure: `{ "PageName": { "ComponentName": {} } }`

---

## Test Data (kebab-case files, camelCase variables)

```javascript
// ${WORKSPACE_ROOT}/cypress/test-data/ui/page-name.component-name.test-data.js
export const testData = {
    validItems: {
        initialItem: {
            itemId: String, // Placeholder populated during execution
            title: 'RandomTitle',
            priority: utils.getRandomNumber(1, 5)
        },
    },
    invalidItems: {
        missingTitle: {priority: 3},
        exceedsMaxLength: {title: 'Title' + utils.extendStringWithRandomSymbols(reqs.textCapacity.itemTitle)},
    },
};
```

---

## UI Commands (Pattern: `pageName__action`)

**CREATE for:** Complex multi-step interactions, reusable workflows, setup/teardown operations  
**DON'T CREATE for:** Single Cypress actions (`.click()`, `.type()`, `.clear()`), simple assertions, one-time operations

**Template:**
```javascript
Cypress.Commands.add('pageName__action', (data) => {
  const { field1, field2 } = data; // Decompose parameters
  cy.get(pageName.field1Input).type(field1, { delay: 0 });
  cy.get(pageName.field2Select).select(field2.toString());
  cy.get(pageName.submitButton).click();
});
```

---

## Bug Logging
When discovering UI bugs, add entry to `${WORKSPACE_ROOT}/bug-log/bug-log.json` with ID `BUG-[PAGE/COMPONENT]-[NUMBER]` and reference in test:
```javascript
// Bug Reference: BUG-FORM-003 - Missing validation error message
it('PageName.ComponentName: Then no error message is displayed', () => {
  cy.get(pageName.errorMessage).should('not.exist'); // Actual behavior
});
```

---

