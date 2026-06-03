---
name: write-integration-ui-specs
description: Use when writing or updating Cypress Integration UI specs for page or component behavior with API-backed setup, examples, selectors, localization, theme values, cleanup, and req metadata.
---

# Write integration UI specs

PURPOSE: create testable UI page or component requirements from named examples
SPEC: `cypress/integration/ui/page-name.component-name.ui.spec.js`
EXAMPLES: `cypress/integration-examples/ui/page-name.component-name.ui.examples.js`
SELECTORS: `cypress/selectors/selectors.js`
UI_COMMANDS: `cypress/commands/ui/`
API_COMMANDS: `cypress/commands/api/`
REGISTRY: `eslint-plugin-custom-rules/app-structure/components.json`

# Structure

STRUCTURE: single `describe` defining the scenario, with sequential `context` blocks grouping setup conditions, and `it` blocks asserting specifications
ISOLATION: `{ testIsolation: false }` on `describe`
DESCRIBE_SETUP: `before`
CONTEXT_SETUP: `before` for navigation or shared UI state
FLOW: related contexts in efficient order, explicit state per context
MANUAL: `context.skip` or `it.skip` with clear description
FILTERING: file names

# Titles

TITLE_DESCRIBE: `Page.Component: Given 'preconditions', 'created data'`
TITLE_CONTEXT: `Page.Component.USER_ROLE: When 'condition'`
TITLE_IT: `Page.Component.USER_ROLE: Then 'expected result'`
TITLE_UNIQUENESS: unique describe, context, and `it` titles within `context`
TITLE_IT_SPECIFICITY: verified assumed outcome of example or business rule
REQ_METADATA: every `it()` can include metadata object `{ req: {} }`; fields `p`, `preconditions`, `refs`, `bugs`
REQ_PRIORITY: omit `p` for default P2, set `P1` or `P3` when needed

# Data

DATA_SOURCE: examples file
INSTANCE_REUSE: create, update, delete within file lifecycle
STATE: explicit per context
ID_FIELDS: `String` placeholders in examples
ID_ASSIGNMENT: immediate, same instance owner after API setup
RANDOM_SOURCE: examples use `utils`
CLEANUP: API-backed `const cleanUp = () => cy.moduleName__deleteByNames__DELETE(tokenUser, [testData.namePrefix])` in `before` and `after`
DELETE_STRATEGY: name patterns with `deleteByNames`
INSTANCE_NAME_CLEANUP_PATTERN: `SpecFileAbbr.EntityAbbr.ActionOrIntent.${randomSuffix}`
CONSISTENCY: API and UI property names aligned

# UI behavior

GLOBALS: `utils`, `l10n`, `colours`, `apiUrls`, `uiUrls`, `companies`, `userRoles`, `reqs`, `apiErrors`, selectors (accessible via global variables with page names)
SELECTOR_ACCESS: global variables, e.g. `commonUI`, `templatesPage`
LOCALIZATION: global `l10n`
THEME: global `colours`
PAGE_REF: `development-data/pages`
UI_COMMAND_SCOPE: reused multi-step interactions, login, navigation, form submission
API_COMMAND_SCOPE: setup and teardown data
INLINE_SCOPE: direct `.click()`, `.type()`, `.clear()`, simple assertions
COMMAND_FORMAT: `pageName__operation`, `componentName__operation`
PARAMETERS: decomposed business values

# Bugs

BUG_TYPES: rendering, validation, messages, state, localization
BUG_LOG: `bug-log/bug-log.json`
BUG_ID: `BUG-[PAGE/COMPONENT]-[NUMBER]`
BUG_REF: `req.bugs`
TEST_ADAPTATION: assert current UI behavior and link known bug in req metadata

# Readability

SPEC_GUARDRAILS: pre-composed examples, selector globals, l10n and colours references
ASSERTION_SCOPE: one visible UI outcome per `it`, related checks within parent element when practical
PRECONDITIONS: direct setup calls and `req.preconditions` for extra Given details
MAINTENANCE: API-backed cleanup, stable selectors, semantic examples, flat Cypress chains

```javascript
import { list_examples as testData } from '../../integration-examples/ui/page-name.component-name.ui.examples';

describe('Page.Component: Given user is authenticated, created data exists', { testIsolation: false }, () => {
  let tokenUser;
  const cleanUp = () => cy.moduleName__deleteByNames__DELETE(tokenUser, [testData.namePrefix]);
  before(() => {
    cy.common__getTokenByRole__POST(userRoles.ADMIN).then((accessToken) => {
      tokenUser = accessToken;
    });
    cy.then(cleanUp);
    cy.common__getSessionUI(userRoles.ADMIN);
  });

  context('Page.Component.ADMIN: When item with all fields is opened', () => {
    before(() => {
      cy.visit(uiUrls.pageName.component);
    });

    it('Page.Component.ADMIN: Then item name from the all-fields example is shown on the form', { req: {} }, () => {
      cy.get(componentPage.itemName).should('contain', testData.validItems.item__WithAllFields.name);
    });
  });

  after(cleanUp);
});
```

