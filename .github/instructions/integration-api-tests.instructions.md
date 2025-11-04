---
applyTo: 'cypress/integration/api/*.api.spec.js'
---

## Integration API Tests Instructions

### File Structure
- Follow naming conventions in `docs/naming-conventions.md`.
- Place files in `cypress/integration/api` using the `module-name.submodule-name.api.spec.js` pattern (kebab-case).
- Store test data in `cypress/test-data/api` using the `module-name.submodule-name.test-data.js` pattern (kebab-case).
- Store API commands in `cypress/support/commands/api/`, named by module/submodule.
- Store URLs and endpoints in `cypress/support/urls/urls.js`.

### Test Organization
- Each test file must contain exactly one `describe` block with multiple `context` blocks.
- Use `{ testIsolation: false }` for the `describe` block. Test isolation occurs between test files only.
- Use `before` block in `describe` block for preconditions.
- Use `before` block in `context` block for conditions/actions.
- Use `it` for expected results.
- Connect related `context` and blocks to cover scenarios efficiently.
- Use `context.skip` and `it.skip` with clear descriptions for manual verification scenarios.
- Do not use tags for filtering; use file names instead.

### Test Data Management
- Test data instances should be reused across tests within a file (e.g., created, updated, deleted).
- Describe the state of each test data object separately in each `context` block for clarity.
- Define placeholders for dynamic IDs using `String` type, then populate them during test execution.
- Always save dynamically obtained IDs (from API responses) to the test data object.
- Prefer generated and randomized test data using `utils` functions for edge case coverage.
- All checked states should be extensively described in test data for readability.

### API Commands
- Use API commands for test execution and setup/teardown.
- Decompose command parameters (body, headers, auth, etc.) to enhance readability.
- Keep item properties consistent between API and UI commands.

### Test Titles

- Describe the preconditions: `ModuleName.SubmoduleName: Given 'preconditions', 'created data'`
- Provide the scope and condition being tested: `ModuleName.SubmoduleName.Action.METHOD: When 'condition'`
- Describe the expected result: `ModuleName.SubmoduleName.Action.METHOD: Then 'expected result'`
- Ensure test titles are unique within the file.

### Global Resources
- The following modules are available globally via `cypress/support/e2e.js` and do not need to be imported:
    - `utils` - Utility functions
    - `l10n` - Localization strings
    - `colours` - Theme colours
    - `urls` - URLs
    - `errors` - Standardized error messages
    - `reqs` - Requirements and capacity constraints
    - `userRoles` - User role configurations
    - All UI selectors (e.g., `loginPage`, etc.)

### Development Reference
- Refer to `.json` Swagger documentation in `development-data/swagger` for development and test reference purposes.

---

## Test Data Organization

- Store test data in `cypress/test-data/api/module-name.submodule-name.test-data.js`.
- Use kebab-case for file names.
- Use camelCase for variable names.
- Organize by module/submodule.
- Use global utilities like `utils` for randomization (no import needed).
- Define placeholders for dynamically obtained IDs using `String` type, then populate them in `before` hook or context blocks.
- Example:

```javascript
// cypress/test-data/api/module-name.submodule-name.test-data.js
export const testData = {
  namePattern: 'testTitle',
  validItems: {
    initialItem: {
      itemId: String, // Placeholder for dynamically obtained ID
      name: 'RandomName' + utils.extendStringWithRandomSymbols(10),
      value: utils.getRandomNumber(0, 50)
    },
    newItem: {
      itemId: String, // Placeholder for dynamically obtained ID
      name: 'NewItemName' + utils.extendStringWithRandomSymbols(10),
      value: utils.getRandomNumber(51, 100)
    },
    updatedItem: {
      name: 'UpdatedName' + utils.extendStringWithRandomSymbols(10),
      value: utils.getRandomNumber(101, 150)
    },
  },
  invalidItems: {
    nonExistingId: utils.generateFakeId(),
    missingName: { value: 25 },
    exceedsMaxLength: {
      name: 'Name' + utils.extendStringWithRandomSymbols(reqs.textCapacity.itemName),
      value: 10
    },
  },
};
```

---

## API Commands

- Store API commands in `cypress/support/commands/api/module-name.submodule-name.api.commands.js`.
- Use kebab-case for file names.
- Use camelCase for command names.
- Example:

```javascript
Cypress.Commands.add('moduleName__Create__POST', (token, itemData, restOptions = {}) => {
  const { name, value } = itemData; // Decompose for clarity
  return cy.request({
    method: 'POST',
    url: urls.api.moduleName.submoduleName,
    headers: { Authorization: `Bearer ${token}` },
    body: { name, value },
    ...restOptions,
  });
});
```

---

## API URLs Management

- Store base URLs and endpoints in `cypress/support/urls/urls.js`.
- Use camelCase for variable names.
- Access via global `urls` variable (no import needed).
- Example:

```javascript
// cypress/support/urls/urls.js
const moduleName = {
  submoduleName: `${Cypress.env('gatewayUrl')}/api/module-name/submodule-name`,
  anotherEndpoint: `${Cypress.env('gatewayUrl')}/api/module-name/another`,
};

export default {
  moduleName,
  // ... other modules
};
```

---

## Error Message Management

- Store error messages in `error_messages.json`.
- Separate error messages by module/submodule.
- Use simple and readable variable names.
- Access via global `errors` variable (no import needed).
- Example:

```json
{
  "moduleName": {
    "submoduleName": {
      "itemNotFound": "Item not found.",
      "invalidItemId": "Item ID is invalid.",
      "nameRequired": "Name is required."
    }
  }
}
```

---

## Integration API Test Template

```javascript
// cypress/integration/api/module-name.submodule-name.api.spec.js
import { testData } from '../../test-data/api/module-name.submodule-name.test-data';

describe('ModuleName.SubmoduleName: Given preconditions, created data', { testIsolation: false }, () => {
  let tokenUser;

  const cleanUp = () => {
    // Cleanup function to delete test data if needed
  };

  before(() => {
    cy.getTokenByRole(userRoles.ADMIN).then((access_token) => {
      tokenUser = access_token;
    });
    cleanUp();
    // Setup: Create test data and save dynamically obtained IDs to testData object
    cy.then(() => {
      cy.moduleName__create__POST(tokenUser, testData.validItems.initialItem).then((response) => {
        testData.validItems.initialItem.itemId = response.body.itemId; // Save ID to test data
      });
    });
  });

  context('ModuleName.SubmoduleName.POST: When request contains valid parameters', () => {
    it('ModuleName.SubmoduleName.POST: Then instance is created with status 201', () => {
      cy.moduleName__create__POST(tokenUser, testData.validItems.newItem).then((response) => {
        expect(response.status).to.equal(201);
        testData.validItems.newItem.itemId = response.body.itemId; // Save ID for later use
      });
    });
  });

  context('ModuleName.SubmoduleName.GET: When request contains existing item ID', () => {
    it('ModuleName.SubmoduleName.GET: Then instance is retrieved with status 200', () => {
      cy.moduleName__get__GET(tokenUser, testData.validItems.initialItem.itemId).then((response) => {
        expect(response.status).to.equal(200);
        expect(response.body.name).to.equal(testData.validItems.initialItem.name);
      });
    });
  });

  context('ModuleName.SubmoduleName.PUT: When request updates existing item', () => {
    it('ModuleName.SubmoduleName.PUT: Then instance is updated with status 200', () => {
      cy.moduleName__update__PUT(tokenUser, testData.validItems.initialItem.itemId, testData.validItems.updatedItem).then((response) => {
        expect(response.status).to.equal(200);
        expect(response.body.name).to.equal(testData.validItems.updatedItem.name);
      });
    });
  });

  context('ModuleName.SubmoduleName.GET: When request contains non-existing item ID', () => {
    it('ModuleName.SubmoduleName.GET: Then return 404 status and error message: Item not found', () => {
      cy.moduleName__get__GET(tokenUser, testData.invalidItems.nonExistingId, { failOnStatusCode: false }).then((response) => {
        expect(response.status).to.equal(404);
        expect(response.body.message).to.equal(errors.moduleName.submoduleName.itemNotFound);
      });
    });
  });

  context.skip('ModuleName.SubmoduleName.DELETE: When request contains valid parameters', () => {
    it.skip('ModuleName.SubmoduleName.DELETE: Then instance is successfully deleted', () => {
      // Non-automated check
    });
  });

  after(() => {
    cleanUp();
  });
});
```

---
 