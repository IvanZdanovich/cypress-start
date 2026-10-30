# Timeouts

Use this page to find the default Cypress timeouts and to override one for a single call. All defaults are defined
once, by category, in `TIMEOUTS` in `cypress/constants/timeouts.js`. `config/cypress.base.config.js` maps four of them
onto the Cypress global timeouts in `baseConfig.e2e`. The QA and dev configs spread `baseConfig.e2e`, so both
environments inherit them.

## Defaults

| `TIMEOUTS` key  | Value | Cypress global          | Applies to                                                                  |
|-----------------|-------|-------------------------|-----------------------------------------------------------------------------|
| `uiCommand`     | 4 s   | `defaultCommandTimeout` | DOM queries and actions (`cy.get`, `cy.find`, `cy.click`, ...)              |
| `apiRequest`    | 5 s   | `requestTimeout`        | Waiting for an intercepted request to go out in `cy.wait('@alias')`         |
| `apiResponse`   | 5 s   | `responseTimeout`       | Server responses for `cy.request` and `cy.wait('@alias')`                   |
| `pageLoad`      | 10 s  | `pageLoadTimeout`       | `cy.visit` and page navigation                                              |
| `uiAssertion`   | 3 s   | —                       | Explicit `.should()` wait on an element already expected (toasts, spinners) |
| `fileUpload`    | 10 s  | —                       | An attachment upload finishing                                              |
| `fileDownload`  | 10 s  | —                       | A file download finishing                                                   |

A wait slower than its budget fails the test, so slow responses surface as failures instead of being hidden by a
permissive timeout. Change a default in `cypress/constants/timeouts.js` only when the whole suite needs it.

## Overriding one call

Import `TIMEOUTS` and pass `{ timeout }` when a single step needs a category other than the global default, such as a
list that renders after an API round trip:

```javascript
import { TIMEOUTS } from '../../constants/timeouts';

cy.get(cartPage.items, { timeout: TIMEOUTS.apiResponse }).should('have.length', examples.indicesOfProducts.length);
```

For `cy.request`-based commands, pass `restOptions: { timeout }`. Keep the override on the one call that needs it.
Raising a global default slows every failing test in the suite.

## Waiting for data

Wait for page data with an intercept alias or a retrying assertion, never with a fixed `cy.wait(ms)`:

```javascript
cy.intercept('GET', '**/booking/*').as('getBooking');
cy.wait('@getBooking');
```

A fixed wait is too short on a slow environment and wastes time on a fast one. The `cypress/no-unnecessary-waiting`
ESLint rule reports fixed waits.
