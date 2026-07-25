---
name: write-e2e-ui-specs
description: Use when writing, updating, or reviewing any end-to-end UI journey that spans multiple pages or steps (create → modify → verify → complete) — checkout, purchase, signup, or other multi-page user flows. Triggers on editing any `*.spec.js` under `cypress/e2e/`, adding a new e2e/journey test, a `describe`/`it` chaining several pages together, "test the whole flow / user journey", reusing an entity created earlier in the flow, or a workflow spec that must trace to constraints and named examples.
---

# Principles

CONTINUITY: reuse entities created in earlier steps across the workflow (create → modify → verify → complete) — otherwise a journey that re-seeds fresh data per step tests isolated actions, not the end-to-end flow
BUSINESS_ORDER: sequence contexts in the order a real user lives the journey with explicit state per context — otherwise a spec reordered for test convenience stops mirroring the requirement it documents
EXECUTABLE_REQUIREMENT: title, example, and assertion state one verified business outcome — otherwise a spec that asserts less than its title claims gives false confidence
INVERSION: name what would make this spec give false confidence, be unmaintainable, or mislead — otherwise purely positive rules leave those failure modes unguarded and the spec ships them undetected

# Method

## Paths

SPEC: `cypress/e2e/ui/workflow-name.ui.spec.js` — kebab-case business-flow title, e.g. `complete-purchase.ui.spec.js`
EXAMPLES: `cypress/e2e-examples/ui/workflow-name.ui.examples.js`
SELECTORS: `cypress/selectors/selectors.js`
UI_COMMANDS: `cypress/commands/ui/`
API_COMMANDS: `cypress/commands/api/`
CONSTRAINTS: import directly from `cypress/constants/{api,ui}/` — never via global
REGISTRY: `eslint-plugin-custom-rules/app-structure/workflows.json`

## Structure

HIERARCHY: single `describe` → sequential `context` per workflow step → `it` blocks
ISOLATION: `{ testIsolation: false }` on `describe` — steps share state across the journey
DESCRIBE_SETUP: `before` for token, cleanup, session
CONTEXT_SETUP: `before` for workflow step setup or navigation
SKIP: `context.skip` or `it.skip` with clear description

## Titles

TITLE_DESCRIBE: `Flow.SubFlow: Given 'preconditions', 'created data'`
TITLE_CONTEXT: `Flow.SubFlow.USER_ROLE: When 'condition'`
TITLE_IT: `Flow.SubFlow.USER_ROLE: Then 'expected result'`
UNIQUENESS: unique titles within `context`
SPECIFICITY: state the verified outcome of an example or business rule
VALUE_MEANING: describe a value's meaning, not its literal
PLAIN: no parentheses, no square brackets
REQ_METADATA: optional `{ req: {} }` with fields `p`, `preconditions`, `refs`, `bugs`, `note` (non-empty string comment about the checks); omit when empty

## Data

WORKFLOW_DATA: setup, execution, and verification values live in the E2E examples file
ID_FIELDS: placeholder on source instance only → set once on source after setup → dependent instances read source IDs via ES getters in examples — never assign the same ID to multiple instances in setup
NAME_PATTERN: `SpecFileAbbr.EntityAbbr.ActionOrIntent.${randomSuffix}`
CONSISTENCY: API setup values and UI verification values aligned — a mismatch verifies a state the setup never produced
CLEANUP: API-backed `const cleanUp = () => cy.moduleName__deleteByNames__DELETE(tokenUser, [examples.namePrefix])` in `before` and `after`

## UI behavior

SELECTOR_ACCESS: global variables — `commonUI`, `workflowPage`
SELECTOR_NAMING: camelCase, purpose-driven, pattern `elementPurposeElementType` — static-text elements as nouns (`errorMessage`, `userNameInput`), action elements as verbs (`submitForm`, `openListingTab`)
LOCALIZATION: global `l10n`
THEME: global `colours`
UI_COMMAND_FORMAT: `pageName__operation`, `componentName__operation`
UI_COMMAND_SCOPE: reused multi-step workflow actions in business terminology
INLINE_SCOPE: direct `.click()`, `.type()`, `.clear()`, simple assertions

## Readability

DIRECT_REFERENCE: `examples.group.instance` inline, never shadowed by a local `const`
ID_ASSIGN: `examples.group.instance.id = response.body.id`
ASSERTION_SCOPE: one user-visible workflow outcome per `it`
IT_BODY: 5 lines target — assertion plus direct setup only
CYPRESS_CHAIN: flat `cy.then()` blocks, nesting no deeper than one level
TRIM: only comments that add meaning, necessary setup, used tokens

```javascript
import { workflow_examples as examples } from '../../e2e-examples/ui/workflow-name.ui.examples';

describe('Workflow.SubFlow: Given user is authenticated, workflow data exists', { testIsolation: false }, () => {
  let tokenUser;
  const cleanUp = () => cy.moduleName__deleteByNames__DELETE(tokenUser, [examples.namePrefix]);
  before(() => {
    cy.common__getTokenByRole__POST(userRoles.ADMIN).then((accessToken) => {
      tokenUser = accessToken;
    });
    cy.then(cleanUp);
    cy.common__getSessionUI(userRoles.ADMIN);
  });

  context('Workflow.SubFlow.ADMIN: When complete flow is submitted with all fields', () => {
    before(() => {
      cy.workflowPage__completeFlow(examples.completeFlow.withAllFields);
    });

    it('Workflow.SubFlow.ADMIN: Then workflow completes and summary shows completed status', { req: { p: 'P1' } }, () => {
      cy.get(workflowPage.status).should('contain', examples.completeFlow.withAllFields.expectedResult.status);
    });
  });

  after(cleanUp);
});
```

## Reverse brainstorming

SABOTAGE: list strategies that would make the spec give false confidence, become unmaintainable, or mislead
REALITY_CHECK: for each, ask "are we already doing this?" — matches are defects to fix before writing the spec

# Validation

STRUCTURE_CHECK: describe/context/it with `{ testIsolation: false }`
SEGMENTATION_CHECK: one workflow outcome per `it`
TITLE_CHECK: unique, flow-prefixed Given/When/Then
CLEANUP_CHECK: `before` + `after`, API-backed, name pattern
FLOW_CHECK: contexts follow business order of the user journey
