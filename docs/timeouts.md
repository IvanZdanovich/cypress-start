# Timeouts

All default timeouts live in one frozen `TIMEOUTS` object in `cypress/constants/common/timeouts.js`.
The Cypress global config, commands, and specs read from it, so a default changes in one place.

The values are production-level response budgets. A response slower than its budget fails the test, so slow responses surface as failures instead of being absorbed by a permissive timeout.

## Categories

- `apiRequest` (5 s) — an intercepted request going out in `cy.wait('@alias')`; global `requestTimeout`.
- `apiResponse` (5 s) — server response for `cy.request` and `cy.wait('@alias')`; global `responseTimeout`. Also used for UI waits that depend on an API round trip, such as a list rendering after search.
- `uiCommand` (4 s) — DOM queries and actions; global `defaultCommandTimeout`.
- `uiAssertion` (3 s) — explicit `.should()` waits on elements already expected on the page, such as toasts and spinners.
- `pageLoad` (10 s) — `cy.visit` and navigation; global `pageLoadTimeout`.
- `fileUpload` (10 s) — attachment uploads.
- `fileDownload` (10 s) — file downloads such as template exports.
- `poll.timeout` / `poll.interval` (15 s / 1 s) — polling commands such as `audits__waitForStatus__GET`.
- `sessionTimeoutMS` (25 min) — max age of a cached UI session in `common__getSessionUI`.

`config/cypress.base.config.js` maps the four global Cypress timeouts to these values. The QA and dev configs spread `baseConfig.e2e`, so both inherit them.

## Importing

```javascript
import { TIMEOUTS } from '../../constants/common/timeouts';
```

`cypress/constants/ui/common.ui.constraints.js` re-exports `TIMEOUTS`, so existing imports keep working. `templateDownloadTimeout` stays as an alias of `fileDownload`.

## Overriding per call

The constants are defaults. Pass an explicit timeout when one call has a known, justified longer budget, such as report generation.

```javascript
cy.get(selector, { timeout: TIMEOUTS.apiResponse }).should('be.visible');
cy.audits__waitForStatus__GET(token, auditId, { timeout: 60000, retryInterval: 3000 });
cy.common__getSessionUI(userRoles.ADMIN, 40000);
```

`cy.request`-based commands spread `restOptions` last, so `{ timeout }` passed there overrides the global `responseTimeout`.

## Measuring actual response times locally

`cy.nfr__measureResponseTime(label, sendRequest, options)` (`cypress/commands/api/nfr.commands.js`) sends a request several times and yields min, max, mean, p50 and p95 in ms. It writes the results to `cypress/reports/performance/<label>.json`, which git ignores. Budgets and sample counts are in `cypress/constants/api/performance.api.constraints.js` (`PERF`).

While measuring, pass `{ timeout: PERF.MEASUREMENT_TIMEOUT_MS }` as `restOptions`. Otherwise the 5 s global `responseTimeout` cuts off a slow response before its duration is recorded.

```javascript
cy.nfr__measureResponseTime('templates-gateway-search-by-name', () =>
  cy.templates__searchViaGateway__GET(token, { templateName }, { timeout: PERF.MEASUREMENT_TIMEOUT_MS })
).then((stats) => {
  expect(stats.p95).to.be.at.most(PERF.MAX_LIST_RESPONSE_MS);
});
```

`cypress/integration/api/templates.local.api.spec.skip.js` measures the Templates search. It is a local debug spec: the default `specPattern` doesn't match it, so CI never runs it. Run it through `SPEC_PATTERN`:

```bash
TARGET_ENV=qa SPEC_PATTERN=cypress/integration/api/templates.local.api.spec.skip.js npx cypress run
```
