---
name: write-integration-ui-specs
description: Use when writing, updating, or reviewing any single page or component UI test — asserting one page's visible behavior, elements, validation messages, or state after an action. Triggers on editing any `*.ui.spec.js` under `cypress/integration/ui/`, adding a page-level test (login, inventory, cart, etc.), asserting UI text/elements/errors, driving one page while seeding preconditions via API, or a spec whose asserted values must trace to constraints and named examples.
---

# Principles

TRACEABILITY: every asserted value traces to a named example or a constraint — inline literals break the constraints→examples→specs chain and drift silently
API_SETUP: build preconditions through API commands, drive only the behavior under test through the UI — otherwise slow UI setup fails for reasons unrelated to what the spec verifies
SEGMENTATION: one visible UI outcome per `it` — otherwise a block asserting several outcomes cannot name which one regressed
INVERSION: name what would make the spec give false confidence, be unmaintainable, or mislead, then check which you already do — otherwise forward writing misses these failures

# Method

## Paths

SPEC: `cypress/integration/ui/page-name.component-name.ui.spec.js` — kebab-case, e.g. `inventory-page.ui.spec.js`
EXAMPLES: `cypress/integration-examples/ui/page-name.component-name.ui.examples.js`
SELECTORS: `cypress/selectors/selectors.js`
UI_COMMANDS: `cypress/commands/ui/`
API_COMMANDS: `cypress/commands/api/`
CONSTRAINTS: import directly from `cypress/constants/{api,ui}/`

## Structure

HIERARCHY: single `describe` → sequential `context` blocks → `it` blocks
ISOLATION: `{ testIsolation: false }` on `describe` — shared setup persists across contexts within the file
DESCRIBE_SETUP: `before` for token, cleanup, session
CONTEXT_SETUP: `before` for navigation or shared UI state
FLOW: related contexts in efficient order, explicit state per context
SKIP: `context.skip` or `it.skip` with clear description

## Titles

TITLE_DESCRIBE: `Page.Component: Given preconditions, created data`
TITLE_CONTEXT: `Page.Component.USER_ROLE: When condition`
TITLE_IT: `Page.Component.USER_ROLE: Then expected result`
UNIQUENESS: unique titles within `context`
SPECIFICITY: title names the verified outcome of a constraint boundary or an example instance — not implementation mechanics
PLAIN: no parentheses, no square brackets
VALUE_MEANING: "minimal price" over "price 1" — the intent, not the literal
REQ_METADATA: optional `{ req: {} }` with fields `p`, `preconditions`, `refs`, `bugs`, `note` (non-empty string comment about the checks); omit when empty

## Data and cleanup

INSTANCE_REUSE: create, update, delete one instance across the file lifecycle — reruns stay deterministic
ID_FIELDS: placeholder on source instance only; set once on source after API setup; dependent instances read source IDs via ES getters defined in examples — manually assigning the same ID to multiple instances desyncs them
ID_ASSIGN: `examples.group.instance.id = response.body.id`
CLEANUP: API-backed `const cleanUp = () => cy.moduleName__deleteByNames__DELETE(tokenUser, [examples.namePrefix])` in `before` and `after` — clears current and prior data so a crashed run leaves nothing behind
NAME_PATTERN: `SpecFileAbbr.EntityAbbr.ActionOrIntent.${randomSuffix}`
CONSISTENCY: API and UI property names aligned

## Asserted value sources

CONSTRAINT: boundary values (`PRICE.MAX`, `TEXT_CAPACITY.MAX_LENGTH`, enum members) imported from `cypress/constants/{api,ui}/` — assert boundary enforcement
EXAMPLE: composed named instances from `cypress/integration-examples/ui/` — assert data display and CRUD outcomes
L10N: UI-visible text via global `l10n` — assert labels, buttons, messages match the current locale
COLOURS: theme-dependent hex values via global `colours` — assert visual styling
INLINE_LITERAL: only for structural expectations not owned by any layer (e.g. `'be.visible'`, `'be.disabled'`, attribute names)

## UI behavior

SELECTOR_ACCESS: global variables — `commonUI`, `templatesPage` — no hardcoded CSS strings
SELECTOR_NAMING: camelCase, purpose-driven, pattern `elementPurposeElementType` — static-text elements as nouns (`errorMessage`, `userNameInput`), action elements as verbs (`submitForm`, `openListingTab`)
LOCALIZATION: UI text via global `l10n`
THEME: hex colours via global `colours`
UI_COMMAND_FORMAT: `pageName__operation`, `componentName__operation`
UI_COMMAND_SCOPE: reused multi-step interactions
INLINE_SCOPE: direct `.click()`, `.type()`, `.clear()`, simple assertions

## Readability

DIRECT_REFERENCE: `examples.group.instance` inline, never shadowed by a local `const`
ASSERTION_SCOPE: one visible UI outcome per `it`, related checks scoped within the parent element when practical
IT_BODY: 5 lines target — assertion plus direct setup only
CYPRESS_CHAIN: flat `cy.then()` blocks, no nesting beyond one level
TRIM: only meaningful comments, necessary setup, used tokens

```javascript
import { list_examples as examples } from '../../integration-examples/ui/page-name.component-name.ui.examples';

describe('Page.Component: Given user is authenticated, created data exists', { testIsolation: false }, () => {
  let tokenUser;
  const cleanUp = () => cy.moduleName__deleteByNames__DELETE(tokenUser, [examples.namePrefix]);
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
TRACEABILITY_CHECK: every asserted value resolves to one of — constraint import, named example field, `l10n` key, `colours` key; no orphan literals
