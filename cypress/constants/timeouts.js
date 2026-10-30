/**
 * Categorised timeout defaults (milliseconds) shared by the Cypress global config, commands, and specs.
 *
 * Values are production-level response budgets: a wait that exceeds one fails the test, so slow responses surface
 * as failures instead of being absorbed by a permissive timeout.
 *
 * CommonJS so `config/cypress.base.config.js` can `require` it; specs and commands `import { TIMEOUTS }`.
 * These are defaults only: any command still accepts a per-call override, e.g. `cy.get(selector, { timeout })`
 * or `restOptions: { timeout }` on `cy.request`-based commands.
 *
 * See docs/timeouts.md.
 */
const TIMEOUTS = Object.freeze({
  /** Wait for an intercepted request to go out in `cy.wait('@alias')`; global `requestTimeout`. */
  apiRequest: 5000,
  /** Wait for a response in `cy.request` and `cy.wait('@alias')`; global `responseTimeout`. Also used for UI waits that depend on an API round trip (e.g. a list rendering after search). */
  apiResponse: 5000,
  /** DOM query and action timeout (`cy.get`, `cy.find`, `cy.click`, ...); global `defaultCommandTimeout`. */
  uiCommand: 4000,
  /** Retry window for an explicit `.should()` wait on an element already expected on the page (toasts, spinners). */
  uiAssertion: 3000,
  /** `cy.visit` and navigation timeout; global `pageLoadTimeout`. */
  pageLoad: 10000,
  /** Wait for an attachment upload to finish. */
  fileUpload: 10000,
  /** Wait for a file download (e.g. report export) to finish. */
  fileDownload: 10000,
});

module.exports = { TIMEOUTS };
