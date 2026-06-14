---
name: write-e2e-ui-specs
description: Use when writing or updating E2E UI workflow specs that must be executable requirements backed by constraints, named examples.
---

# Principles

PURPOSE: create testable end-to-end workflow requirements from named workflow examples
SPEC: `cypress/e2e/ui/workflow-name.ui.spec.js`
EXAMPLES: `cypress/e2e-examples/ui/workflow-name.ui.examples.js`
SELECTORS: `cypress/selectors/selectors.js`
UI_COMMANDS: `cypress/commands/ui/`
API_COMMANDS: `cypress/commands/api/`
REGISTRY: `eslint-plugin-custom-rules/app-structure/workflows.json`
CONTINUITY: reuse created entities across workflow steps (create → modify → verify → complete)
REVERSE_BRAINSTORM: "What would guarantee this spec gives false confidence, is unmaintainable, or misleads?"

# Structure

HIERARCHY: single `describe` → sequential `context` blocks per workflow step → `it` blocks
ISOLATION: `{ testIsolation: false }` on `describe`
DESCRIBE_SETUP: `before` for token, cleanup, session
CONTEXT_SETUP: `before` for workflow step setup or navigation
FLOW: complete user journey in business order with explicit state per context
SKIP: `context.skip` or `it.skip` with clear description

# Titles

TITLE_DESCRIBE: `Flow.SubFlow: Given 'preconditions', 'created data'`
TITLE_CONTEXT: `Flow.SubFlow.USER_ROLE: When 'condition'`
TITLE_IT: `Flow.SubFlow.USER_ROLE: Then 'expected result'`
UNIQUENESS: unique titles within `context`
SPECIFICITY: verified assumed outcome of example or business rule
PLAIN: no parentheses, no square brackets
VALUE_MEANING: describe value's meaning, not literal
REQ_METADATA: optional `{ req: {} }` with fields `p`, `preconditions`, `refs`, `bugs`; omit when empty

# Data

WORKFLOW_DATA: setup, execution, verification values in E2E examples file
INSTANCE_REUSE: create, update, delete within file lifecycle
ID_FIELDS: `String` placeholders, assigned immediately after setup on same instance
CLEANUP: API-backed `const cleanUp = () => cy.moduleName__deleteByNames__DELETE(tokenUser, [examples.namePrefix])` in `before` and `after`
NAME_PATTERN: `SpecFileAbbr.EntityAbbr.ActionOrIntent.${randomSuffix}`
CONSISTENCY: API setup values and UI verification values aligned

# UI behavior

SELECTOR_ACCESS: global variables — `commonUI`, `workflowPage`
LOCALIZATION: global `l10n`
THEME: global `colours`
CONSTRAINTS: import directly from `cypress/constants/{api,ui}/` — never via global
UI_COMMAND_FORMAT: `pageName__operation`, `componentName__operation`
UI_COMMAND_SCOPE: reused multi-step workflow actions
INLINE_SCOPE: direct `.click()`, `.type()`, `.clear()`, simple assertions
WORKFLOW_SCOPE: business terminology and complete user outcomes

# Readability

DIRECT_REFERENCE: `examples.group.instance` inline, never shadow with local `const`
ID_ASSIGN: `examples.group.instance.id = response.body.id`
ASSERTION_SCOPE: one user-visible workflow outcome per `it`
IT_BODY: 5 lines target — assertion plus direct setup only
CYPRESS_CHAIN: flat `cy.then()` blocks, no nesting beyond one level
TRIM: only comments that add meaning, necessary setup, used tokens

```javascript
import { workflow_examples as examples } from '../../e2e-examples/ui/workflow-name.ui.examples';

describe('Workflow.SubFlow: Given user is authenticated, workflow data exists', { testIsolation: false }, () => {
  let tokenUser;
  const cleanUp = () => cy.moduleName__deleteByNames__DELETE(tokenUser, [examples.namePrefix]);
  before(() => {
    cy.common__getTokenByRole__POST(userRoles.ADMIN).then((accessToken) => { tokenUser = accessToken; });
    cy.then(cleanUp);
    cy.common__getSessionUI(userRoles.ADMIN);
  });

  context('Workflow.SubFlow.ADMIN: When complete flow is submitted with all fields', () => {
    before(() => { cy.workflowPage__completeFlow(examples.completeFlow.withAllFields); });

    it('Workflow.SubFlow.ADMIN: Then workflow completes and summary shows completed status', { req: { p: 'P1' } }, () => {
      cy.get(workflowPage.status).should('contain', examples.completeFlow.withAllFields.expectedResult.status);
    });
  });

  after(cleanUp);
});
```

# Validation

STRUCTURE_CHECK: describe/context/it with `{ testIsolation: false }`
SEGMENTATION_CHECK: one workflow outcome per `it`
TITLE_CHECK: unique, flow-prefixed Given/When/Then
CLEANUP_CHECK: `before` + `after`, API-backed, name pattern
FLOW_CHECK: contexts follow business order of user journey
