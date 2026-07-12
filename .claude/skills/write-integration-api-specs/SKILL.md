---
name: write-integration-api-specs
description: Use when writing, updating, or reviewing any API-level test — asserting responses, status codes, payloads, headers, or CRUD lifecycle behavior of an endpoint. Triggers on editing any `*.api.spec.js` under `cypress/integration/api/`, adding a request-based test (cy.request/api command), asserting an endpoint's contract or error case, create-update-delete against an API, or a spec whose asserted values must trace to constraints and named examples.
---

# Principles

EXECUTABLE_REQUIREMENT: a spec asserts the assumed outcome of a named example or business rule — otherwise a failing assertion signals a brittle test rather than a real contradiction
TRACEABILITY: every asserted value traces through examples to constraints — otherwise a literal inlined in the spec drifts from its source and hides which rule it verifies
COMPUTING_EFFICIENCY: set up via API and reuse one instance across its create-update-delete lifecycle within a file — otherwise per-`it` recreation multiplies calls without adding coverage
DETERMINISM: cleanup by name prefix before and after, and keep each file independent of order — otherwise a leftover from a prior run passes or poisons a later spec
INVERSION: name what gives false confidence — untraced literals, shadowed examples, reconstructed payloads, order dependence — otherwise positive rules alone let these slip through

# Method

## Paths

SPEC: `cypress/integration/api/module-name.submodule-name.api.spec.js` — kebab-case, e.g. `restful-booker.booking.api.spec.js`
EXAMPLES: `cypress/integration-examples/api/module-name.submodule-name.api.examples.js`
CONSTRAINTS: `cypress/constants/api/module-name.api.constraints.js`
COMMANDS: `cypress/commands/api/`
URLS: `cypress/urls/api-urls.js`
REGISTRY: `eslint-plugin-custom-rules/app-structure/modules.json`

## Reverse brainstorming

SABOTAGE: name what would make this spec give false confidence, become unmaintainable, or mislead
REALITY_CHECK: for each, ask "are we already doing this?" — matches are the defects to fix before writing

## Structure

HIERARCHY: single `describe` → sequential `context` blocks → `it` blocks
ISOLATION: `{ testIsolation: false }` on `describe` — shared token and created data persist across contexts
DESCRIBE_SETUP: `before` for token, cleanup
CONTEXT_SETUP: `before` for shared request or created data
FLOW: order contexts by dependency, state explicit per context
SKIP: `context.skip` or `it.skip` with clear description
ERROR_RESPONSES: `{ failOnStatusCode: false }` for expected non-2xx

## Titles

TITLE_DESCRIBE: `Module.Submodule: Given preconditions, created data`
TITLE_CONTEXT: `Module.Submodule.Operation.METHOD: When condition`
TITLE_IT: `Module.Submodule.Operation.METHOD: Then expected result`
UNIQUENESS: unique titles within `context`
SPECIFICITY: verified assumed outcome of example or business rule
PLAIN: no parentheses, no square brackets
VALUE_MEANING: "minimal price" not "price 1" — a named value survives constraint changes that a literal does not
REQ_METADATA: optional `{ req: {} }` fields `p` (omit for default P2), `preconditions`, `refs`, `bugs`, `note` (non-empty string comment about the checks); omit when empty

## Data

INSTANCE_REUSE: create, update, delete within file lifecycle
ID_FIELDS: placeholder on source instance only → set once on source after creation → dependent instances read source IDs via ES getters defined in examples — assigning the same ID to multiple instances in setup breaks single-source traceability
CLEANUP: `const cleanUp = () => cy.moduleName__deleteByNames__DELETE(tokenUser, [examples.namePrefix])` in `before` and `after`
NAME_PATTERN: `SpecFileAbbr.EntityAbbr.ActionOrIntent.${randomSuffix}`
SPEC_CALLS: pass pre-composed examples directly — reconstructing a payload in the spec forks it from its constraint-backed source

## Commands

FORMAT: `moduleName__operationDetails__METHOD`
PARAMETERS: token first, then body, context headers, request overrides
OPERATIONS: `Create`, `Retrieve`, `Update`, `PartialUpdate`, `Delete`

## Readability

DIRECT_REFERENCE: `examples.group.instance` inline — a local `const` shadow hides which example is asserted
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