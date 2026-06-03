---
name: write-e2e-ui-specs
description: Use when writing or updating Cypress E2E UI workflow specs that validate complete user flows with examples, selectors, API setup, UI commands, cleanup, and req metadata.
---

# Write E2E UI specs

PURPOSE: create testable end-to-end workflow requirements from named workflow examples
SPEC: `cypress/e2e/ui/workflow-name.ui.spec.js`
EXAMPLES: `cypress/e2e-examples/ui/workflow-name.ui.examples.js`
SELECTORS: `cypress/selectors/selectors.js`
UI_COMMANDS: `cypress/commands/ui/`
API_COMMANDS: `cypress/commands/api/`
REGISTRY: `eslint-plugin-custom-rules/app-structure/workflows.json`

# Structure

STRUCTURE: single `describe` defining the scenario, with sequential `context` blocks grouping setup conditions, and `it` blocks asserting specifications
ISOLATION: `{ testIsolation: false }` on `describe`
DESCRIBE_SETUP: `before`
CONTEXT_SETUP: `before` for workflow step setup or navigation
FLOW: complete user journey in business order with explicit state per context
MANUAL: `context.skip` or `it.skip` with clear description
FILTERING: file names

# Titles

TITLE_DESCRIBE: `Flow.SubFlow: Given 'preconditions', 'created data'`
TITLE_CONTEXT: `Flow.SubFlow.USER_ROLE: When 'condition'`
TITLE_IT: `Flow.SubFlow.USER_ROLE: Then 'expected result'`
TITLE_UNIQUENESS: unique describe, context, and `it` titles within `context`
TITLE_IT_SPECIFICITY: verified assumed outcome of example or business rule
REQ_METADATA: every `it()` can include metadata object `{ req: {} }`; fields `p`, `preconditions`, `refs`, `bugs`
REQ_PRIORITY: omit `p` for default P2, set `P1` or `P3` when needed

# Data

DATA_SOURCE: E2E examples file
WORKFLOW_DATA: setup, execution, verification values
INSTANCE_REUSE: create, update, delete within file lifecycle
STATE: explicit per context and workflow step
ID_FIELDS: `String` placeholders in examples
ID_ASSIGNMENT: immediate, same instance owner after setup creation
RANDOM_SOURCE: examples use `utils`
CLEANUP: API-backed `const cleanUp = () => cy.moduleName__deleteByNames__DELETE(tokenUser, [testData.namePrefix])` in `before` and `after`
DELETE_STRATEGY: name patterns with `deleteByNames`
INSTANCE_NAME_CLEANUP_PATTERN: `SpecFileAbbr.EntityAbbr.ActionOrIntent.${randomSuffix}`
CONSISTENCY: API setup values and UI verification values aligned

# Workflow behavior

GLOBALS: `utils`, `l10n`, `colours`, `apiUrls`, `uiUrls`, `userRoles`, `companies`, `reqs`, `apiErrors`, selectors (accessible via global variables with page names)
SELECTOR_ACCESS: global variables, e.g. `commonUI`, `workflowPage`
LOCALIZATION: global `l10n`
THEME: global `colours`
PAGE_REF: `development-data/pages`
WORKFLOW_SCOPE: business terminology and complete user outcomes
COMMAND_SOURCE: `cypress/commands/api` for setup data
UI_COMMAND_SCOPE: reused multi-step workflow actions
INLINE_SCOPE: direct `.click()`, `.type()`, `.clear()`, simple assertions
COMMAND_FORMAT: `pageName__operation`, `componentName__operation`
PARAMETERS: decomposed business values

# Bugs

BUG_TYPES: workflow, component integration, data consistency, navigation, state
BUG_LOG: `bug-log/bug-log.json`
BUG_ID: `BUG-[WORKFLOW]-[NUMBER]`
BUG_CONTEXT: workflow and affected pages
BUG_REF: `req.bugs`
TEST_ADAPTATION: assert current workflow behavior and link known bug in req metadata

# Readability

SPEC_GUARDRAILS: scenario-level contexts, direct workflow examples, l10n and colours references
ASSERTION_SCOPE: one user-visible workflow outcome per `it`, related checks within parent element when practical
PRECONDITIONS: API-backed setup and `req.preconditions` for extra Given details
MAINTENANCE: business-order flow, stable selectors, semantic examples, flat Cypress chains

```javascript
import { workflow_examples as testData } from '../../e2e-examples/ui/workflow-name.ui.examples';

describe('Workflow.SubFlow: Given user is authenticated, workflow data exists', { testIsolation: false }, () => {
  let tokenUser;
  const cleanUp = () => cy.moduleName__deleteByNames__DELETE(tokenUser, [testData.namePrefix]);
  before(() => {
    cy.common__getTokenByRole__POST(userRoles.ADMIN).then((accessToken) => {
      tokenUser = accessToken;
    });
    cy.then(cleanUp);
    cy.common__getSessionUI(userRoles.ADMIN);
  });

  context('Workflow.SubFlow.ADMIN: When complete flow is submitted with all fields', () => {
    before(() => {
      cy.workflowPage__completeFlow(testData.completeFlow.workflow__WithAllFields);
    });

    it('Workflow.SubFlow.ADMIN: Then the workflow completes and the summary shows the completed status', { req: { p: 'P1' } }, () => {
      cy.get(workflowPage.status).should('contain', testData.completeFlow.workflow__WithAllFields.expectedResult.status);
    });
  });

  after(cleanUp);
});
```

