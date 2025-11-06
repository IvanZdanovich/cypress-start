---
applyTo: "${WORKSPACE_ROOT}/cypress/integration/ui/*.ui.spec.js"
---

## Integration UI Tests Instructions

**Note**: When referencing files in AI prompts or AI instructions, always use **absolute paths** from the workspace root
via the `${WORKSPACE_ROOT}`. Never include your real local username or machine-specific path in committed docs.

### Test Structure

- Place files in `${WORKSPACE_ROOT}/cypress/integration/ui` using the `page-name.component-name.ui.spec.js` pattern (
  kebab-case).
- Store test data in `${WORKSPACE_ROOT}/cypress/test-data/ui` using the `page-name.component-name.test-data.js`
  pattern (kebab-case).
- Store selectors in `${WORKSPACE_ROOT}/cypress/support/selectors/selectors.js`, grouped by page/component.
- Store UI commands in `${WORKSPACE_ROOT}/cypress/support/commands/ui/`, named by page/component.
- Store API commands in `${WORKSPACE_ROOT}/cypress/support/commands/api/`, named by module/submodule.

### Test Organization

- Follow naming conventions in `${WORKSPACE_ROOT}/docs/naming-conventions.md`.
- Each test file must contain exactly one `describe` block with multiple `context` blocks.
- Use `{ testIsolation: false }` for the `describe` block. Test isolation occurs between test files only.
- Use `before` block in `describe` block for preconditions.
- Use  `before` block in `context` block for conditions/actions.
- Use `it` for expected results.
- Connect related `context` and blocks to cover scenarios efficiently.
- Use `context.skip` and `it.skip` with clear descriptions for manual verification scenarios.
- Do not use tags for filtering; use file names instead.

### Test Data Management

- Test data instances should be reused across tests within a file (e.g., created, updated, deleted).
- Describe the state of each test data object separately in each `context` block for clarity.
- Define placeholders for dynamic IDs using `String` type, then populate them during test execution.
- Always save dynamically obtained IDs (from API responses or UI) to the test data object.
- Prefer generated and randomized test data using `utils` functions for edge case coverage.
- All checked states should be extensively described in test data for readability.

### API and UI Commands

- Use API commands for setup/teardown when needed to speed up tests.
- Use custom UI commands for page interactions.
- Keep item properties consistent between API and UI commands.
- Decompose command parameters (inputs, selectors, etc.) to enhance readability.

### Test Titles

- Describe the preconditions: `PageName.ComponentName: Given 'preconditions', 'created data'`
- Provide the scope and condition being tested: `PageName.ComponentName.USER_ROLE: When 'condition'`
- Describe the expected result: `PageName.ComponentName.USER_ROLE: Then 'expected result'`
- Ensure test titles are unique within the file.

### Global Resources

- The following modules are available globally via `${WORKSPACE_ROOT}/cypress/support/e2e.js` and do not need to be
  imported:
    - `utils` - Utility functions
    - `l10n` - Localization strings
    - `colours` - Theme colours
    - `urls` - URLs
    - `reqs` - Requirements and capacity constraints
    - `userRoles` - User role configurations
    - All UI selectors (e.g., `loginPage`, etc.)

### Development Reference

- Refer to `.html` pages in `${WORKSPACE_ROOT}/development-data/pages` for development and test reference purposes.
- Before creating tests for a new page/component, register it in `${WORKSPACE_ROOT}/app-structure/components.json` to
  avoid ESLint errors.
    - Structure: `{ "PageName": { "ComponentName": { } } }`
    - Components should match functional elements on the page (header, forms, modals, etc.).

---

## Test Data Organization

- Store test data in `${WORKSPACE_ROOT}/cypress/test-data/ui/page-name.component-name.test-data.js`.
- Use kebab-case for file names.
- Use camelCase for variable names.
- Organize by page/component.
- Use global utilities like `utils` for randomization (no import needed).
- Define placeholders for dynamically obtained IDs using `String` type, then populate them in `before` hook or context
  blocks.
- Example:

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

- Store UI commands in `${WORKSPACE_ROOT}/cypress/support/commands/ui/page-name.component-name.ui.commands.js`.
- Use kebab-case for file names.
- Use camelCase for command names.
- Decompose parameters for clarity.
- Align parameters with API command parameters when applicable.
- Group commands by page/component.
- Example:

```javascript
Cypress.Commands.add('pageName__performAction', (itemData) => {
    const {title, priority} = itemData;
    cy.get(pageName.componentName.titleInput).clear().type(title);
    cy.get(pageName.componentName.prioritySelect).select(priority.toString());
    cy.get(pageName.componentName.submitButton).click();
});
```

---

## UI Selectors Organization

- Store selectors in `${WORKSPACE_ROOT}/cypress/support/selectors/selectors.js`.
- Group by page/component.
- Use camelCase for selector names.
- Access via global variables (e.g., `commonUI`, `auditsPage`).
- Example:

```javascript
// ${WORKSPACE_ROOT}/cypress/support/selectors/selectors.js
const componentNamePage = {
    titleInput: '[data-testid="component-title-input"]',
    prioritySelect: '[data-testid="component-priority-select"]',
    submitButton: '[data-testid="component-submit-btn"]',
    resultElement: '[data-testid="component-result"]',
};

export default {
    commonUI,
    componentNamePage,
    // ... other page selectors
};
```

---

## Bug Logging for UI Tests

When discovering UI bugs during test development:

1. **Identify UI Issues:**
    - Elements not rendering as documented
    - Incorrect validation behavior
    - Missing error messages
    - Inconsistent UI state
    - Accessibility issues
    - Localization problems

2. **Document in Bug Log:**
    - Add entry to `${WORKSPACE_ROOT}/bug-log/bug-log.json`
    - Follow bug ID convention: `BUG-[PAGE/COMPONENT]-[NUMBER]`
    - Include all required fields per main instructions

3. **Add Bug Reference Comments:**
   ```javascript
     context('PageName.ComponentName: When invalid input is provided', () => {
       // Bug Reference: BUG-FORM-003 - Missing validation error message for email field
       it('PageName.ComponentName: Then no error message is displayed', () => {
         cy.pageName__submitForm__UI(invalidData);
         cy.get(pageName.componentName.errorMessage).should('not.exist'); // Actual behavior
       });
     });
   ```

---
