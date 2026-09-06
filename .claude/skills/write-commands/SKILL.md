---
name: write-commands
description: Use when creating or updating Cypress command files for reusable multi-step flows, complex assertions, shared setup, or teardown.
---

# Reasoning Principles

SEGMENTATION: one module per API file, one page or component per UI file, one domain concept per domain file — otherwise a mixed file breaks the "which file owns this" lookup and commands become unfindable
EXTRACTION: extract to a command only when a sequence repeats across specs or needs setup context — otherwise a wrapper around a single action adds a name to learn while removing no duplication
INVERSION: name what stays inline as sharply as what becomes a command — otherwise single steps drift into commands and bloat the surface

# Output Shape

## Extraction Decision

COMMAND: multi-step flows, complex multi-assertion sequences, shared setup or teardown
INLINE: single `.click()`, `.type()`, `.clear()`, single-step navigations, simple one-line assertions
DECISION: same sequence appears in more than one spec, or requires setup context → extract to command
TIER_DECISION: ask "which page or component owns this action?" → if none, "which domain concept does it describe?" → if none, "is it a direct API call or UI action?" → if none, general

## Tiers

PAGE_TIER: action owned by one page or component → `page-name.ui.commands.js`, `comp-name.ui.commands.js`
DOMAIN_TIER: same action crosses multiple pages or components for one domain concept → `domain-name.ui.commands.js`
COMMON_TIER: protocol-level, no domain owner → `common.ui.commands.js`, `common.api.commands.js`
GENERAL_TIER: utility helpers that are neither direct API calls nor UI actions (e.g. fixture readers, role-based data loaders, shared cache logic) → `commands.js`; these commands are not subject to the API or UI naming rules
DOMAIN_SIGNAL: same command body imported or duplicated across two or more page files — extract to domain file
NOT_DOMAIN: a command originating on one page but called from another's spec stays a page command — call site does not move ownership

## API Commands

API_LOCATION: `cypress/commands/api/module-name.api.commands.js`
API_FORMAT: `cy.moduleName__operationDetails__METHOD()`
API_REGISTRATION: `Cypress.Commands.add('moduleName__operationDetails__METHOD', (args, restOptions = {}) => { ... })`
API_REQUEST: `return cy.request({ method, url, headers, body, ...restOptions })` — always return so specs chain off the response
API_MAPPING: resolve camelCase-to-API field mismatch inside the command — examples stay camelCase, command maps to wire format, so one mismatch lives in one place
API_REST_OPTIONS: accept `restOptions = {}` spread last for per-call overrides (auth, `failOnStatusCode`)
API_GLOBALS: `apiUrls` accessed directly as a registered global — no import needed
API_BODY_SHAPE: API commands register with `Cypress.Commands.add(...)`, return the `cy.request({ method, url, headers, body, ...restOptions })` call, and keep `restOptions` spread last

## UI Commands

UI_LOCATION: `cypress/commands/ui/page-name.ui.commands.js` or `cypress/commands/ui/comp-name.ui.commands.js`
UI_FORMAT: `cy.pageName__action()` or `cy.componentName__action()`
UI_REGISTRATION: `Cypress.Commands.add('pageName__action', (args) => { ... })`
UI_SELECTORS: global selector variables only — a literal attribute string bypasses the single source of truth for the locator
UI_CONSTRAINTS: import constraint constants for boundary values used inside assertions
UI_CHAIN: flat `cy.then()` blocks for sequential steps, no nested `.then()` callbacks
UI_GLOBALS: `l10n`, `colours`, `uiUrls` accessed directly as registered globals — no import needed
UI_BODY_SHAPE: UI commands register with `Cypress.Commands.add(...)`, use global selectors, import only constraints, and assert UI text or colours through `l10n` and `colours`

# Validation

PATH_CHECK: file exists under `cypress/commands/api/` or `cypress/commands/ui/`
NAMING_CHECK: API command matches `moduleName__operationDetails__METHOD`; UI command matches `pageName__action` or `componentName__action`
SCOPE_CHECK: command wraps multi-step flow or complex assertion; single-step actions remain inline in specs
TIER_CHECK: page-specific action in page file, protocol-level in common file, utility helpers that are neither API calls nor UI actions in `commands.js`
RETURN_CHECK: every API command returns `cy.request()` for chainability
SELECTOR_CHECK: UI commands reference global selector variables, not raw selector strings
CONSTRAINT_CHECK: boundary values in assertions are imported from constraint files, not copied as literals
