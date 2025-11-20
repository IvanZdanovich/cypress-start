---
applyTo: '${WORKSPACE_ROOT}/cypress/integration/api/*.api.spec.js'
---

# Integration API Tests

## File Structure

PLACE files: `${WORKSPACE_ROOT}/cypress/integration/api/module-name.submodule-name.api.spec.js` (kebab-case)
STORE test data: `${WORKSPACE_ROOT}/cypress/test-data/api/module-name.submodule-name.test-data.js` (kebab-case)
STORE API commands: `${WORKSPACE_ROOT}/cypress/support/commands/api/` (named by module/submodule)
STORE URLs: `${WORKSPACE_ROOT}/cypress/support/urls/urls.js`

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
USE `failOnStatusCode: false` ONLY WHEN validating error responses

## Test Data Management

REUSE test data instances ACROSS tests WITHIN file (created → updated → deleted)
DESCRIBE state PER `context` block FOR clarity
DEFINE placeholders WITH `String` type, POPULATE during execution
SAVE dynamically obtained IDs TO test data object immediately after creation
ASSIGN IDs TO specific test data instance (e.g., `testData.validItems.initialItem.itemId = response.body.itemId`)
IMPROVES test readability by keeping all related data in one place
PREFER generated/randomized data USING `utils` functions FOR edge cases
DESCRIBE ALL checked states EXTENSIVELY IN test data

## API Commands Strategy

USE FOR test execution and setup/teardown
DECOMPOSE parameters (body, headers, auth) FOR readability
KEEP properties consistent WITH UI commands

## Test Titles Pattern

`describe`: `ModuleName.SubmoduleName: Given 'preconditions', 'created data'`
`context`: `ModuleName.SubmoduleName.Action.METHOD: When 'condition'`
`it`: `ModuleName.SubmoduleName.Action.METHOD: Then 'expected result'`
ENSURE uniqueness WITHIN file

## Global Resources

AVAILABLE globally VIA `${WORKSPACE_ROOT}/cypress/support/e2e.js` (NO import needed):
- `utils`, `l10n`, `colours`, `urls`, `errors`, `reqs`, `userRoles`
- All UI selectors (`loginPage`, etc.)

## Development Reference

REFER TO Swagger docs IN `${WORKSPACE_ROOT}/development-data/swagger`
REGISTER new modules IN `${WORKSPACE_ROOT}/app-structure/modules.json` BEFORE creating tests
STRUCTURE: `{ "ModuleName": { "SubmoduleName": { "Action1": {}, "Action2": {} } } }`
ACTIONS: `Create`, `Retrieve`, `Update`, `PartialUpdate`, `Delete`

---

## Test Data Structure

STORE: `${WORKSPACE_ROOT}/cypress/test-data/api/module-name.submodule-name.test-data.js`
NAMING: kebab-case files, camelCase variables
ORGANIZE: By module/submodule
USE `String` placeholders FOR dynamic IDs
FOLLOW guidelines FROM `${WORKSPACE_ROOT}/.github/copilot-instructions.md#test-data-guidelines`

---

## API Commands

STORE: `${WORKSPACE_ROOT}/cypress/support/commands/api/module-name.api.commands.js`
NAMING: kebab-case files, camelCase command names
PATTERN: `moduleName__Action__METHOD`
AUTO-IMPORTED VIA `${WORKSPACE_ROOT}/cypress/support/e2e.js`

```javascript
Cypress.Commands.add('moduleName__Create__POST', (token, itemData, restOptions = {}) => {
    const {name, value} = itemData; // Decompose for clarity
    return cy.request({
        method: 'POST',
        url: `${urls.api.moduleName.submoduleName}`,
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: {name, value},
        ...restOptions,
    });
});
```

---

## API URLs

STORE: `${WORKSPACE_ROOT}/cypress/support/urls/urls.js`
NAMING: camelCase
ACCESS: Via global `urls` variable (NO import)

```javascript
const moduleName = {
    submoduleName: `${Cypress.env('gatewayUrl')}/api/module-name/submodule-name`,
    anotherEndpoint: `${Cypress.env('gatewayUrl')}/api/module-name/another`,
};

export default { moduleName };
```

---

## Error Messages

STORE: `${WORKSPACE_ROOT}/cypress/support/requirements/error_messages.json`
ORGANIZE: By module/submodule
ACCESS: Via global `errors` variable (NO import)

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

## Test Template

```javascript
import {testData} from '../../test-data/api/module-name.submodule-name.test-data';

describe('ModuleName.SubmoduleName: Given preconditions, created data', {testIsolation: false}, () => {
    let tokenUser;

    const cleanUp = () => { /* Cleanup logic */ };

    before(() => {
        cy.getTokenByRole(userRoles.ADMIN).then((access_token) => {
            tokenUser = access_token;
        });
        cleanUp();
        cy.then(() => {
            cy.moduleName__create__POST(tokenUser, testData.validItems.initialItem).then((response) => {
                testData.validItems.initialItem.itemId = response.body.itemId;
            });
        });
    });

    context('ModuleName.SubmoduleName.POST: When request contains valid parameters', () => {
        it('ModuleName.SubmoduleName.POST: Then instance is created with status 201', () => {
            cy.moduleName__create__POST(tokenUser, testData.validItems.newItem).then((response) => {
                expect(response.status).to.equal(201);
                testData.validItems.newItem.itemId = response.body.itemId;
            });
        });
    });

    context('ModuleName.SubmoduleName.GET: When request contains non-existing item ID', () => {
        it('ModuleName.SubmoduleName.GET: Then return 404 status and error message: Item not found', () => {
            cy.moduleName__get__GET(tokenUser, testData.invalidItems.nonExistingId, {failOnStatusCode: false}).then((response) => {
                expect(response.status).to.equal(404);
                expect(response.body.message).to.equal(errors.moduleName.submoduleName.itemNotFound);
            });
        });
    });

    after(() => { cleanUp(); });
});
```

---

## Bug Logging for API Tests

IDENTIFY API issues:
- Incorrect HTTP status codes
- Missing/improper error messages
- Unexpected response formats
- Inconsistent behavior vs documentation
- Security/validation issues

DOCUMENT IN `${WORKSPACE_ROOT}/bug-log/bug-log.json`:
- FORMAT: `BUG-[MODULE]-[NUMBER]`
- INCLUDE: all required fields per main instructions

ADD bug reference comment:
```javascript
// Bug Reference: BUG-MODULE-001 - Returns 500 instead of 400 for validation errors
it('Module.Submodule.Action.METHOD: Then return 500 status code and Internal Server Error', () => {
  cy.module__action__METHOD(invalidData, { failOnStatusCode: false }).then((response) => {
    expect(response.status).to.eq(500); // Actual behavior
    expect(response.body).to.eq(errors.common.internalServerError);
  });
});
```

---
