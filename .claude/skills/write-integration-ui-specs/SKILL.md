---
name: write-integration-ui-specs
description: Use when writing or updating Integration UI specs that must be executable requirements backed by constraints, named examples.
---

# Principles

PURPOSE: create testable UI page/component requirements from named examples
SPEC: `cypress/integration/ui/page-name.component-name.ui.spec.js`
EXAMPLES: `cypress/integration-examples/ui/page-name.component-name.ui.examples.js`
SELECTORS: `cypress/selectors/selectors.js`
UI_COMMANDS: `cypress/commands/ui/`
API_COMMANDS: `cypress/commands/api/`
REVERSE_BRAINSTORM: "What would guarantee this spec gives false confidence, is unmaintainable, or misleads?"

# Structure

HIERARCHY: single `describe` → sequential `context` blocks → `it` blocks
ISOLATION: `{ testIsolation: false }` on `describe`
DESCRIBE_SETUP: `before` for token, cleanup, session
CONTEXT_SETUP: `before` for navigation or shared UI state
FLOW: related contexts in efficient order, explicit state per context
SKIP: `context.skip` or `it.skip` with clear description

# Titles

TITLE_DESCRIBE: `Page.Component: Given preconditions, created data`
TITLE_CONTEXT: `Page.Component.USER_ROLE: When condition`
TITLE_IT: `Page.Component.USER_ROLE: Then expected result`
UNIQUENESS: unique titles within `context`
SPECIFICITY: verified assumed outcome of example or business rule
PLAIN: no parentheses, no square brackets
VALUE_MEANING: "minimal price" not "price 1"
REQ_METADATA: optional `{ req: {} }` with fields `p`, `preconditions`, `refs`, `bugs`; omit when empty

# Data

INSTANCE_REUSE: create, update, delete within file lifecycle
ID_FIELDS: `String` placeholders, assigned immediately after API setup on same instance
CLEANUP: API-backed `const cleanUp = () => cy.moduleName__deleteByNames__DELETE(tokenUser, [examples.namePrefix])` in `before` and `after`
NAME_PATTERN: `SpecFileAbbr.EntityAbbr.ActionOrIntent.${randomSuffix}`
CONSISTENCY: API and UI property names aligned

# UI behavior

SELECTOR_ACCESS: global variables — `commonUI`, `templatesPage`
LOCALIZATION: global `l10n`
THEME: global `colours`
CONSTRAINTS: import directly from `cypress/constants/{api,ui}/` — never via global
UI_COMMAND_FORMAT: `pageName__operation`, `componentName__operation`
UI_COMMAND_SCOPE: reused multi-step interactions
INLINE_SCOPE: direct `.click()`, `.type()`, `.clear()`, simple assertions
PAGE_REF: `development-data/pages`

# Readability

DIRECT_REFERENCE: `examples.group.instance` inline, never shadow with local `const`
ID_ASSIGN: `examples.group.instance.id = response.body.id`
ASSERTION_SCOPE: one visible UI outcome per `it`, related checks within parent element when practical
IT_BODY: 5 lines target — assertion plus direct setup only
CYPRESS_CHAIN: flat `cy.then()` blocks, no nesting beyond one level
TRIM: only comments that add meaning, necessary setup, used tokens

```javascript
import { list_examples as examples } from '../../integration-examples/ui/page-name.component-name.ui.examples';

describe('Page.Component: Given user is authenticated, created data exists', { testIsolation: false }, () => {
  let tokenUser;
  const cleanUp = () => cy.moduleName__deleteByNames__DELETE(tokenUser, [examples.namePrefix]);
  before(() => {
    cy.common__getTokenByRole__POST(userRoles.ADMIN).then((accessToken) => { tokenUser = accessToken; });
    cy.then(cleanUp);
    cy.common__getSessionUI(userRoles.ADMIN);
  });

  context('Page.Component.ADMIN: When item with all fields is opened', () => {
    before(() => { cy.visit(uiUrls.pageName.component); });

    it('Page.Component.ADMIN: Then item name from the all-fields example is shown on the form', { req: {} }, () => {
      cy.get(componentPage.itemName).should('contain', examples.validItems.withAllFields.name);
    });
  });

  after(cleanUp);
});
```

# Validation

STRUCTURE_CHECK: describe/context/it with `{ testIsolation: false }`
SEGMENTATION_CHECK: one visible outcome per `it`
TITLE_CHECK: unique, page/component-prefixed Given/When/Then
CLEANUP_CHECK: `before` + `after`, API-backed, name pattern
SELECTOR_CHECK: global variables, no hardcoded CSS strings
L10N_CHECK: UI text via `l10n`, not hardcoded strings
