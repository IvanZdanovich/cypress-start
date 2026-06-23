---
name: write-commands
description: Use when creating or updating Cypress command files that encapsulate reusable multi-step flows, complex assertions, or shared setup and teardown.
---

# Principles

PURPOSE: encapsulate reusable multi-step flows and complex assertions as named Cypress commands
SCOPE: `cypress/commands/api/*.api.commands.js`, `cypress/commands/ui/*.ui.commands.js`
ACCESS: global via `Cypress.Commands.add()` — consumed in specs without import
SEGMENTATION: one module per API file, one page or component per UI file, one domain concept per domain file
SINGLE_RESPONSIBILITY: one command covers one reusable action or assertion sequence

# Command scope

COMMAND: multi-step flows, complex multi-assertion sequences, shared setup or teardown
INLINE: single `.click()`, `.type()`, `.clear()`, single-step navigations, simple one-line assertions
DECISION: extract to command when the same sequence appears in more than one spec or requires setup context

# File tiers

Three tiers apply to both API and UI commands. Assign the tier before naming the file.

| Tier             | When to use                                                              | File pattern                                           |
|------------------|--------------------------------------------------------------------------|--------------------------------------------------------|
| Page / component | Action owned by one page or component                                    | `page-name.ui.commands.js`, `comp-name.ui.commands.js` |
| Domain           | Same action crosses multiple pages/components for the same domain concept | `domain-name.ui.commands.js`                           |
| Common           | Protocol-level, no domain secificity                                     | `common.ui.commands.js`, `common.api.commands.js`      |

TIER_DECISION: ask "which page or component owns this action?" → if none, ask "which domain concept does it describe?" →
if none, common
DOMAIN_SIGNAL: same command body imported or duplicated across two or more page files — extract to domain file
NOT_DOMAIN: a command that originates on one page but is called from another's spec; that is still a page command

# API commands

LOCATION: `cypress/commands/api/module-name.api.commands.js`
FORMAT: `cy.moduleName__operationDetails__METHOD()`
REGISTRATION: `Cypress.Commands.add('moduleName__operationDetails__METHOD', (args, restOptions = {}) => { ... })`
REQUEST: `return cy.request({ method, url, headers, body, ...restOptions })` — always return for chainability
MAPPING: camelCase-to-API field mismatch resolved inside the command; examples use camelCase, command maps to wire
format
REST_OPTIONS: accept `restOptions = {}` spread last for per-call overrides (auth, `failOnStatusCode`, etc.)
GLOBALS: `urls` accessed directly — no import needed

```javascript
Cypress.Commands.add('module__createItem__POST', (body, restOptions = {}) => {
    return cy.request({
        method: 'POST',
        url: urls.api.items,
        headers: {'Content-Type': 'application/json'},
        body,
        ...restOptions,
    });
});
```

# UI commands

LOCATION: `cypress/commands/ui/page-name.ui.commands.js` or `cypress/commands/ui/comp-name.ui.commands.js`
FORMAT: `cy.pageName__action()` or `cy.componentName__action()`
REGISTRATION: `Cypress.Commands.add('pageName__action', (args) => { ... })`
SELECTORS: global selector variables only — never hardcode attribute strings
CONSTRAINTS: import constraint constants for boundary values used inside assertions
CHAIN: flat `cy.then()` blocks for sequential steps; avoid nested `.then()` callbacks
GLOBALS: `l10n`, `colours`, `urls` accessed directly — no import needed

```javascript
import {SORT_OPTIONS} from '../../constants/ui/inventory-page.ui.constraints';

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
