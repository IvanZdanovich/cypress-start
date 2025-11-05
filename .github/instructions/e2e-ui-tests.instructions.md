---
applyTo: "${WORKSPACE_ROOT}/cypress/e2e/ui/*.ui.spec.js"
---

## E2E UI Tests Instructions

**Note**: When referencing files in AI prompts or AI instructions, always use **absolute paths** from the workspace root
via the `${WORKSPACE_ROOT}`. Never include your real local username or machine-specific path in committed docs.

### Test Structure

- Place files in `${WORKSPACE_ROOT}/cypress/e2e/ui` using the `workflow-name.ui.spec.js` pattern (kebab-case).
- Store test data in `${WORKSPACE_ROOT}/cypress/test-data/ui` using the `workflow-name.test-data.js` pattern (kebab-case).
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

- Use API commands for setup/teardown to speed up tests (create and delete test data).
- Use custom UI commands for page interactions.
- Keep item properties consistent between API and UI commands.
- Decompose command parameters (inputs, selectors, etc.) to enhance readability.

### Test Titles

- Describe the preconditions: `FlowName.SubFlowName: Given 'preconditions', 'created data'`
- Provide the scope and condition being tested: `FlowName.SubFlowName.USER_ROLE: When 'condition'`
- Describe the expected result: `FlowName.SubFlowName.USER_ROLE: Then 'expected result'`
- Ensure test titles are unique within the file.

### Global Resources

- The following modules are available globally via `${WORKSPACE_ROOT}/cypress/support/e2e.js` and do not need to be imported:
    - `utils` - Utility functions
    - `l10n` - Localization strings
    - `colours` - Theme colours
    - `urls` - URLs
    - `reqs` - Requirements and capacity constraints
    - `userRoles` - User role configurations
    - All UI selectors (e.g., `loginPage`, etc.)

### Development Reference

- Refer to `.html` pages in `${WORKSPACE_ROOT}/development-data/pages` for development and test reference purposes.
- Before creating tests for a new workflow, register it in `${WORKSPACE_ROOT}/app-structure/workflows.json` to avoid ESLint errors.
    - Structure: `{ "WorkflowName": { "SubFlowName": { } } }`
    - Workflow should match business terminology.

---

## Test Data Organization

- Store test data in `${WORKSPACE_ROOT}/cypress/test-data/ui/workflow-name.test-data.js`.
- Use kebab-case for file names.
- Use camelCase for variable names.
- Organize by user flow/feature.
- Use global utilities like `utils` for randomization (no import needed).
- Define placeholders for dynamically obtained IDs using `String` type, then populate them in `before` hook or during
  test execution.
- Example:

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

- Store UI commands in `${WORKSPACE_ROOT}/cypress/support/commands/ui/page-name.component-name.ui.commands.js`.
- Use kebab-case for file names.
- Use camelCase for command names.
- Example:

```javascript
Cypress.Commands.add('pageName__performAction', (itemData) => {
    const {title, priority} = itemData; // Decompose for clarity
    cy.get(pageName.componentName.titleInput).clear().type(title);
    cy.get(pageName.componentName.prioritySelect).select(priority.toString());
    cy.get(pageName.componentName.submitButton).click();
});
```

---

## API Commands for Data Setup

- Use API commands from `${WORKSPACE_ROOT}/cypress/support/commands/api` for test data setup and cleanup.

---

## UI Selectors Organization

- Store selectors in `${WORKSPACE_ROOT}/cypress/support/selectors/selectors.js`.
- Group by page/component.
- Use camelCase for selector names.
- Access via global variables (e.g., `commonUI`, `flowPage`).
- Example:

```javascript
// ${WORKSPACE_ROOT}/cypress/support/selectors/selectors.js
const flowPage = {
    titleInput: '[data-testid="flow-title-input"]',
    prioritySelect: '[data-testid="flow-priority-select"]',
    submitButton: '[data-testid="flow-submit-btn"]',
    resultElement: '[data-testid="flow-result"]',
    itemList: '[data-testid="flow-item-list"]',
    itemStatus: '[data-testid="flow-item-status"]',
};

export default {
    commonUI,
    flowPage,
    // ... other page selectors
};
```

---

## Localization and Theme Testing

- Use global `l10n` variable for localization strings (no import needed).
- Use global `colours` variable for theme colour validation (no import needed).
- Example:

```javascript
// Localization check
cy.get(pageName.successMessage).should('have.text', l10n.messages.success);

// Theme colour check
cy.get(pageName.primaryButton).should('have.css', 'background-color', colours.primary);
```

---
