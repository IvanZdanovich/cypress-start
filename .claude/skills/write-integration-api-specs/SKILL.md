---
name: write-integration-api-specs
description: Use when writing or updating Cypress Integration API specs that must be executable requirements backed by constraints, examples, API commands, cleanup, and req metadata.
---

# Write integration API specs

PURPOSE: create testable API requirements from named examples and constraints
SPEC: `cypress/integration/api/module-name.submodule-name.api.spec.js`
EXAMPLES: `cypress/integration-examples/api/module-name.submodule-name.api.examples.js`
CONSTRAINTS: `cypress/constants/api/module-name.api.constraints.js`
COMMANDS: `cypress/commands/api/`
URLS: `cypress/urls/api-urls.js`
REGISTRY: `eslint-plugin-custom-rules/app-structure/modules.json`

# Structure

STRUCTURE: single `describe` defining the scenario, with sequential `context` blocks grouping setup conditions, and `it` blocks asserting specifications
ISOLATION: `{ testIsolation: false }` on `describe`
DESCRIBE_SETUP: `before`
CONTEXT_SETUP: `before` for shared request or created context data
FLOW: related contexts in efficient order, explicit state per context
MANUAL: `context.skip` or `it.skip` with clear description
FILTERING: file names
ERROR_RESPONSES: `{ failOnStatusCode: false }` for expected error responses

# Titles

TITLE_DESCRIBE: `Module.Submodule: Given 'preconditions', 'created data'`
TITLE_CONTEXT: `Module.Submodule.Operation.METHOD: When 'condition'`
TITLE_IT: `Module.Submodule.Operation.METHOD: Then 'expected result'`
TITLE_UNIQUENESS: unique describe, context, and `it` titles within `context`
TITLE_IT_SPECIFICITY: verified assumed outcome of example or business rule
REQ_METADATA: every `it()` can include metadata object `{ req: {} }`; fields `p`, `preconditions`, `refs`, `bugs`
REQ_PRIORITY: omit `p` for default P2, set `P1` or `P3` when needed

# Data

DATA_SOURCE: examples file
INSTANCE_REUSE: create, update, delete within file lifecycle
STATE: explicit per context
ID_FIELDS: `String` placeholders in examples
ID_ASSIGNMENT: immediate, same instance owner
RANDOM_SOURCE: examples use `utils`
CLEANUP: `const cleanUp = () => cy.moduleName__deleteByNames__DELETE(tokenUser, [testData.namePrefix])` in `before` and `after`
DELETE_STRATEGY: name patterns with `deleteByNames`
INSTANCE_NAME_CLEANUP_PATTERN: `SpecFileAbbr.EntityAbbr.ActionOrIntent.${randomSuffix}`
SPEC_CALLS: pass pre-composed examples directly
DERIVED_VALUES: pre-calculated in examples

# Commands

COMMAND_FORMAT: `moduleName__operationDetails__METHOD`
COMMAND_SCOPE: execution, setup, teardown, reusable API flows
PARAMETERS: decomposed token, body, context headers, request overrides
AUTH: token first parameter when required
GLOBALS: `utils`, `l10n`, `apiUrls`, `userRoles`, `companies`, `reqs`, `apiErrors`
SWAGGER: `development-data/swagger`
OPERATIONS: `Create`, `Retrieve`, `Update`, `PartialUpdate`, `Delete`

# Bugs

BUG_TYPES: status codes, errors, response shape, validation, consistency
BUG_LOG: `bug-log/bug-log.json`
BUG_ID: `BUG-[MODULE]-[NUMBER]`
BUG_REF: `req.bugs`
TEST_ADAPTATION: assert current behavior and use error-response request overrides

# Readability

SPEC_GUARDRAILS: direct example references, constraint-backed titles, flat Cypress chains
ASSERTION_SCOPE: expected result blocks, one core outcome per `it`
PRECONDITIONS: direct API calls per instance and `req.preconditions` for extra Given details
MAINTENANCE: visible token lifecycle, cleanup before and after, no hidden cross-file state

```javascript
import { module_examples as testData } from '../../integration-examples/api/module-name.submodule-name.api.examples';
import { PRICE } from '../../constants/api/module-name.api.constraints';


describe('Module.Submodule: Given no preconditions', { testIsolation: false }, () => {
  let tokenUser;
  const cleanUp = () => cy.moduleName__deleteByNames__DELETE(tokenUser, [testData.namePrefix]);
  before(() => {
    cy.common__getTokenByRole__POST(userRoles.ADMIN).then((accessToken) => {
      tokenUser = accessToken;
    });
    cy.then(cleanUp);
  });

  context(`Module.Submodule.Create.POST: When item with price ${PRICE.MIN} is provided`, () => {
    it('Module.Submodule.Create.POST: Then item is created with the minimal allowed price', { req: {} }, () => {
      cy.moduleName__create__POST(tokenUser, testData.validItems.item__WithMinimalPrice).then((response) => {
        expect(response.status).to.eq(201);
      });
    });
  });

  after(cleanUp);
});
```

