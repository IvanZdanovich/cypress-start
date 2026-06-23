---
name: write-integration-api-specs
description: Use when writing or updating Integration API specs that must be executable requirements backed by constraints, named examples.
---

# Principles

PURPOSE: create testable API requirements from named examples and constraints
SPEC: `cypress/integration/api/module-name.submodule-name.api.spec.js`
EXAMPLES: `cypress/integration-examples/api/module-name.submodule-name.api.examples.js`
CONSTRAINTS: `cypress/constants/api/module-name.api.constraints.js`
COMMANDS: `cypress/commands/api/`
URLS: `cypress/urls/api-urls.js`
REGISTRY: `eslint-plugin-custom-rules/app-structure/modules.json`
REVERSE_BRAINSTORM: "What would guarantee this spec gives false confidence, is unmaintainable, or misleads?"

# Structure

HIERARCHY: single `describe` → sequential `context` blocks → `it` blocks
ISOLATION: `{ testIsolation: false }` on `describe`
DESCRIBE_SETUP: `before` for token, cleanup
CONTEXT_SETUP: `before` for shared request or created data
FLOW: related contexts in efficient order, explicit state per context
SKIP: `context.skip` or `it.skip` with clear description
ERROR_RESPONSES: `{ failOnStatusCode: false }` for expected non-2xx

# Titles

TITLE_DESCRIBE: `Module.Submodule: Given preconditions, created data`
TITLE_CONTEXT: `Module.Submodule.Operation.METHOD: When condition`
TITLE_IT: `Module.Submodule.Operation.METHOD: Then expected result`
UNIQUENESS: unique titles within `context`
SPECIFICITY: verified assumed outcome of example or business rule
PLAIN: no parentheses, no square brackets
VALUE_MEANING: "minimal price" not "price 1"
REQ_METADATA: optional `{ req: {} }` with fields `p`, `preconditions`, `refs`, `bugs`; omit when empty
REQ_PRIORITY: omit `p` for default P2

# Data

INSTANCE_REUSE: create, update, delete within file lifecycle
ID_FIELDS: placeholder on source instance only; set once on source after creation; dependent instances read source IDs via ES getters defined in examples — never manually assign the same ID to multiple instances in setup
CLEANUP: `const cleanUp = () => cy.moduleName__deleteByNames__DELETE(tokenUser, [examples.namePrefix])` in `before` and `after`
NAME_PATTERN: `SpecFileAbbr.EntityAbbr.ActionOrIntent.${randomSuffix}`
SPEC_CALLS: pass pre-composed examples directly, never reconstruct payloads

# Commands

FORMAT: `moduleName__operationDetails__METHOD`
PARAMETERS: token first, then body, context headers, request overrides
OPERATIONS: `Create`, `Retrieve`, `Update`, `PartialUpdate`, `Delete`
SWAGGER: `development-data/swagger`

# Readability

DIRECT_REFERENCE: `examples.group.instance` inline, never shadow with local `const`
ID_ASSIGN: `examples.group.instance.id = response.body.id`
ASSERTION_SCOPE: one core outcome per `it`, related fields in one `.then()` when practical
CYPRESS_CHAIN: flat `cy.then()` blocks, no nesting beyond one level
TRIM: only comments that add meaning, necessary setup, used tokens

```javascript
import { module_examples as examples } from '../../integration-examples/api/module-name.submodule-name.api.examples';

describe('Module.Submodule: Given no preconditions', { testIsolation: false }, () => {
  let tokenUser;
  const cleanUp = () => cy.moduleName__deleteByNames__DELETE(tokenUser, [examples.namePrefix]);
  before(() => {
    cy.common__getTokenByRole__POST(userRoles.ADMIN).then((accessToken) => { tokenUser = accessToken; });
    cy.then(cleanUp);
  });

  context('Module.Submodule.Create.POST: When item with minimal allowed price is provided', () => {
    it('Module.Submodule.Create.POST: Then item is created', () => {
      cy.moduleName__create__POST(tokenUser, examples.validItems.minimalPrice).then((response) => {
        expect(response.status).to.eq(201);
        examples.validItems.minimalPrice.id = response.body.id;
      });
    });
  });

  after(cleanUp);
});
```

# Validation

STRUCTURE_CHECK: describe/context/it with `{ testIsolation: false }`
SEGMENTATION_CHECK: one outcome per `it`
TITLE_CHECK: unique, constraint-backed Given/When/Then
CLEANUP_CHECK: `before` + `after`, name pattern, file independence
TRACE_CHECK: assertion values trace through examples to constraints
