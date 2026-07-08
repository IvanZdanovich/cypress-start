---
name: write-commands
description: Use when creating or updating Cypress command files that encapsulate reusable multi-step flows, complex assertions, or shared setup and teardown.
---

# Principles

SEGMENTATION: one module per API file, one page or component per UI file, one domain concept per domain file — otherwise a mixed file breaks the "which file owns this" lookup and commands become unfindable
EXTRACTION: extract to a command only when a sequence repeats across specs or needs setup context — otherwise a wrapper around a single action adds a name to learn while removing no duplication
INVERSION: name what stays inline as sharply as what becomes a command — otherwise single steps drift into commands and bloat the surface

# Method

## Command scope

COMMAND: multi-step flows, complex multi-assertion sequences, shared setup or teardown
INLINE: single `.click()`, `.type()`, `.clear()`, single-step navigations, simple one-line assertions
DECISION: same sequence appears in more than one spec, or requires setup context → extract to command

## File tiers

TIER_DECISION: ask "which page or component owns this action?" → if none, "which domain concept does it describe?" → if none, common
PAGE_TIER: action owned by one page or component → `page-name.ui.commands.js`, `comp-name.ui.commands.js`
DOMAIN_TIER: same action crosses multiple pages or components for one domain concept → `domain-name.ui.commands.js`
COMMON_TIER: protocol-level, no domain specificity → `common.ui.commands.js`, `common.api.commands.js`
DOMAIN_SIGNAL: same command body imported or duplicated across two or more page files — extract to domain file
NOT_DOMAIN: a command originating on one page but called from another's spec stays a page command — call site does not move ownership

### API commands

LOCATION: `cypress/commands/api/module-name.api.commands.js`
FORMAT: `cy.moduleName__operationDetails__METHOD()`
REGISTRATION: `Cypress.Commands.add('moduleName__operationDetails__METHOD', (args, restOptions = {}) => { ... })`
REQUEST: `return cy.request({ method, url, headers, body, ...restOptions })` — always return so specs chain off the response
MAPPING: resolve camelCase-to-API field mismatch inside the command — examples stay camelCase, command maps to wire format, so one mismatch lives in one place
REST_OPTIONS: accept `restOptions = {}` spread last for per-call overrides (auth, `failOnStatusCode`)
GLOBALS: `urls` accessed directly — no import needed

```javascript
Cypress.Commands.add('module__createItem__POST', (body, restOptions = {}) => {
  return cy.request({
    method: 'POST',
    url: urls.api.items,
    headers: { 'Content-Type': 'application/json' },
    body,
    ...restOptions,
  });
});
```

## UI commands

LOCATION: `cypress/commands/ui/page-name.ui.commands.js` or `cypress/commands/ui/comp-name.ui.commands.js`
FORMAT: `cy.pageName__action()` or `cy.componentName__action()`
REGISTRATION: `Cypress.Commands.add('pageName__action', (args) => { ... })`
SELECTORS: global selector variables only — a hardcoded attribute string bypasses the single source of truth for the locator
CONSTRAINTS: import constraint constants for boundary values used inside assertions
CHAIN: flat `cy.then()` blocks for sequential steps, no nested `.then()` callbacks
GLOBALS: `l10n`, `colours`, `urls` accessed directly — no import needed

```javascript
import { SORT_OPTIONS } from '../../constants/ui/inventory-page.ui.constraints';

Cypress.Commands.add('inventoryPage__verifySortingDropdown', (expectedValue) => {
  const sortKey = Object.keys(SORT_OPTIONS).find((key) => SORT_OPTIONS[key] === expectedValue);
  cy.get(inventoryPage.sorting.dropdown).should('have.value', expectedValue);
  cy.get(inventoryPage.sorting.currentOption).should('have.text', l10n.inventoryPage.sort.options[sortKey]);
});
```

# Validation

PATH_CHECK: file exists under `cypress/commands/api/` or `cypress/commands/ui/`
NAMING_CHECK: API command matches `moduleName__operationDetails__METHOD`; UI command matches `pageName__action` or
`componentName__action`
SCOPE_CHECK: command wraps multi-step flow or complex assertion; single-step actions remain inline in specs
TIER_CHECK: page-specific action in page file, cross-page domain action in domain file, protocol-level in common file
RETURN_CHECK: every API command returns `cy.request()` for chainability
SELECTOR_CHECK: UI commands reference global selector variables, not raw selector strings
CONSTRAINT_CHECK: boundary values in assertions imported from constraint files, not hardcoded
