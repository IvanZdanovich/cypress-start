---
applyTo: '${WORKSPACE_ROOT}/cypress/integration/api/*.api.spec.js'
---

## Integration API Tests Instructions

**Note**: Always use **absolute paths** via `${WORKSPACE_ROOT}`. Never include real usernames or machine paths.

### File Structure & Naming (kebab-case)
- Tests: `${WORKSPACE_ROOT}/cypress/integration/api/module-name.submodule-name.api.spec.js`
- Test Data: `${WORKSPACE_ROOT}/cypress/test-data/api/module-name.submodule-name.test-data.js`
- API Commands: `${WORKSPACE_ROOT}/cypress/support/commands/api/module-name.api.commands.js`
- URLs: `${WORKSPACE_ROOT}/cypress/support/urls/urls.js`
- Errors: `${WORKSPACE_ROOT}/cypress/support/requirements/error_messages.json`

### Test Organization
- One `describe` block per file with multiple `context` blocks
- Use `{ testIsolation: false }` (isolation occurs between files only)
- `before` in `describe`: preconditions | `before` in `context`: conditions/actions | `it`: expected results
- Reuse test data instances (create → update → delete lifecycle)
- Use `String` placeholders for dynamic IDs, populate during execution
- Use `failOnStatusCode: false` only when validating error responses

### Test Titles Pattern
- Given: `ModuleName.SubmoduleName: Given 'preconditions', 'created data'`
- When: `ModuleName.SubmoduleName.Action.METHOD: When 'condition'`
- Then: `ModuleName.SubmoduleName.Action.METHOD: Then 'expected result'`

### Global Resources (auto-imported, no import needed)
`utils`, `l10n`, `colours`, `urls`, `errors`, `reqs`, `userRoles`

### Setup
- Register new modules in `${WORKSPACE_ROOT}/app-structure/modules.json`
- Structure: `{ "ModuleName": { "SubmoduleName": { "Create": {}, "Retrieve": {}, "Update": {}, "PartialUpdate": {}, "Delete": {} } } }`
- Reference Swagger docs in `${WORKSPACE_ROOT}/development-data/swagger` for development

---

## Test Data (kebab-case files, camelCase variables)

```javascript
// Import: '../../test-data/api/module-name.submodule-name.test-data'
export const testData = {
    validItems: {
        initialItem: {
            itemId: String, // Placeholder populated during execution
            name: 'RandomName' + utils.extendStringWithRandomSymbols(10),
            value: utils.getRandomNumber(0, 50)
        },
    },
    invalidItems: {
        nonExistingId: utils.generateFakeId(),
        missingName: {value: 25},
    },
};
```

---

## API Commands (Pattern: `moduleName__action__METHOD`)

**Template for New Commands:**
```javascript
/**
 * @param {string} token - Auth token (if required)
 * @param {number} resourceId - Resource ID (if required)
 * @param {Object} body - Request body (if required)
 * @param {Object} restOptions - Cypress request options
 */
Cypress.Commands.add('moduleName__action__METHOD', (token, resourceId, body, restOptions = {}) => {
    const {field1, field2} = body;
    return cy.request({
        method: 'METHOD',
        url: `${urls.api.moduleName.submoduleName}/${resourceId}`,
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: {field1, field2},
        ...restOptions,
    });
});
```

---

## URLs & Errors (global access)

**URLs** (`${WORKSPACE_ROOT}/cypress/support/urls/urls.js`):
```javascript
const moduleName = {
    submoduleName: `${Cypress.env('gatewayUrl')}/api/module-name/submodule-name`,
};
```

**Errors** (`${WORKSPACE_ROOT}/cypress/support/requirements/error_messages.json`):
```json
{
  "moduleName": {
    "submoduleName": {
      "itemNotFound": "Item not found.",
      "nameRequired": "Name is required."
    }
  }
}
```

---

## Test Template

```javascript
import {testData} from '../../test-data/api/module-name.submodule-name.test-data';

describe('ModuleName.SubmoduleName: Given preconditions, created data', {testIsolation: false}, () => {
    let tokenUser;

    before(() => {
        cy.getTokenByRole(userRoles.ADMIN).then((token) => { tokenUser = token; });
        // Setup: Create test data and save IDs to testData object
        cy.moduleName__create__POST(tokenUser, testData.validItems.initialItem).then((res) => {
            testData.validItems.initialItem.itemId = res.body.itemId;
        });
    });

    context('ModuleName.SubmoduleName.POST: When request contains valid parameters', () => {
        it('ModuleName.SubmoduleName.POST: Then instance is created with status 201', () => {
            cy.moduleName__create__POST(tokenUser, testData.validItems.newItem).then((res) => {
                expect(res.status).to.equal(201);
                testData.validItems.newItem.itemId = res.body.itemId;
            });
        });
    });

    context('ModuleName.SubmoduleName.GET: When request contains non-existing ID', () => {
        it('ModuleName.SubmoduleName.GET: Then return 404 and error message', () => {
            cy.moduleName__get__GET(tokenUser, testData.invalidItems.nonExistingId, {failOnStatusCode: false}).then((res) => {
                expect(res.status).to.equal(404);
                expect(res.body.message).to.equal(errors.moduleName.submoduleName.itemNotFound);
            });
        });
    });
});
```

---

## Bug Logging
When discovering API bugs, add entry to `${WORKSPACE_ROOT}/bug-log/bug-log.json` with ID `BUG-[MODULE]-[NUMBER]` and reference in test:
```javascript
// Bug Reference: BUG-MODULE-001 - Returns 500 instead of 400
it('Module.Submodule.METHOD: Then return 500 status code', () => {
  cy.module__action__METHOD(invalidData, { failOnStatusCode: false }).then((res) => {
    expect(res.status).to.eq(500); // Actual behavior
  });
});
```

---
