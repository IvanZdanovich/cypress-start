---
paths:
  - 'cypress/commands/**/*.commands.js'
---

# Reasoning Principles

EXTRACT_ONLY_REPEATED_SEQUENCES — Extract a command only for a multi-step flow, a multi-assertion check, or setup and teardown that repeats across specs.
A single `.click()`, `.type()`, `.clear()`, one-step navigation, or one-line assertion stays inline in the spec. A wrapper around one action adds a name to learn and removes no duplication.

CHOOSE_FILE_BY_OWNER — Choose the file by asking, in order, which page or component owns the command, which domain concept, and which layer.
One owner per file keeps each command findable, so it is not written twice. A body shared by two or more pages moves to a domain file. The files are listed below.

```
API page   cypress/commands/api/module-name.api.commands.js       one module
UI page    cypress/commands/ui/page-name.ui.commands.js           one page or component
domain     cypress/commands/ui/domain-name.ui.commands.js         one concept, several pages
common     cypress/commands/{api,ui}/common.{api,ui}.commands.js  protocol level, no domain owner
general    commands.js                                            fixture readers, role data loaders, cache logic
```

KEEP_OWNERSHIP_AT_ORIGIN — Keep a command that starts on one page in that page's file, even when another page's spec calls it.
The call site does not move ownership. Moving it scatters one page's actions across files.

# Output Shape

IMPORT_FILE_IN_SUPPORT — Import every new command file in `cypress/support/e2e.js`.
Commands register only when their file is imported, so a missing import fails every caller with "cy.x is not a function".

NAME_COMMAND_BY_OWNER — Name each command `owner__action`, and add `__METHOD` only for a command that sends an HTTP request.
The owner prefix tells the reader which file holds the command, and the method shows the request without opening it. The `verify-api-command-naming` and `verify-ui-command-naming` lint rules check the shape, but not that the prefix matches the owner. The cost is a long name at every call site.

```
file kind  file                          name shape                     example
API        users.api.commands.js         apiResource__operation__METHOD users__getById__GET
API        billing.api.commands.js       apiResource__operation__METHOD invoices__create__POST
API common common.api.commands.js        common__operation__METHOD      common__getAuthToken__POST
UI page    login-page.ui.commands.js     pageNamePage__action           loginPage__fillCredentials
UI domain  date-picker.ui.commands.js    domainName__action             datePicker__pickDate
UI common  common.ui.commands.js         common__action                 common__verifyToast
helper     metrics.commands.js           domainName__action             metrics__measureResponseTime
```

NAME_OPERATIONS_PRECISELY — Name the API operation as verb, then scope, then target, then qualifier, matching the endpoint.
Use CRUD verbs (`add`, `get`, `getAll`, `update`, `patch`, `delete`) for CRUD endpoints and domain verbs (`move`, `copy`, `assign`, `recalculate`, `set`, `bulkDelete`) otherwise. Scope is the access level or tenant layer, such as `Admin` or `Tenant`; qualifiers include `ById`, `ByNames`, `ByLanguage`. A vague `update` on a move endpoint hides what it does. The cost is a longer name.

NAME_UI_ACTIONS_BY_GESTURE — Name each UI action by opening with the user gesture or check it performs, then name the control or element.
Use `click<Label>`, `fill<Form>`, `clear<Form>`, `choose<Option>`, `open<Panel>`, `find<Item>InTable`, `verify<State>`, and `get<Value>`, as in `homePage__clickExport`. Drop filler words such as `Button` or `The` in new names. A vague `handle` or `process` hides what the user does. Rename an existing command only with `scripts/rename-commands.js`, which also updates every caller.

ACCEPT_WHOLE_EXAMPLE — Accept the complete example instance as one parameter and destructure it inside the command.
The spec then reads as "who does what with which data", with no field picking. Runtime values that no example can hold, such as created IDs, go in a separate `context = {}` parameter. The cost is that a command may receive fields it does not use.

ORDER_API_PARAMETERS — Order API command parameters as `(user, example, context = {}, restOptions = {})`.
A fixed order lets callers pass arguments without opening the command. `context` holds runtime values such as created IDs or the active company, and a command with no body drops `example`. A different order passes wrong values of the right type, and the request fails with a confusing status.

```
// spec
cy.invoices__create__POST(users.admin, invoiceExamples.valid, { companyId });

// command
Cypress.Commands.add('invoices__create__POST', (user, example, context = {}, restOptions = {}) => {
  const { amount, dueDate } = example;
  const { companyId } = context;
  return cy.request({
    method: 'POST',
    url: apiUrls.invoices.base,
    headers: companyId ? { 'X-Company-Id': companyId } : {},
    auth: { bearer: user },
    body: { amount, due_date: dueDate },
    ...restOptions,
  });
});
```

ORDER_UI_PARAMETERS — Order UI command parameters as `(example, context = {})`, with no user or token.
The spec starts the browser session, so a user parameter would duplicate it and could disagree with it. `context` holds runtime or display values the example cannot hold, such as a company name or a row index. A different order passes a context value as example data, and the form fills with wrong text.

```
// spec
cy.invoicePage__fillForm(invoiceExamples.valid, { companyName });
cy.invoicePage__clickSave().then((invoiceId) => { invoiceExamples.valid.id = invoiceId; });

// command
Cypress.Commands.add('invoicePage__fillForm', (example, context = {}) => {
  const { amount, note } = example;
  const { companyName } = context;
  if (amount != null) cy.get(invoicePage.form.amountInput).clear().type(amount, { delay: 0 });
  if (note != null) cy.get(invoicePage.form.noteInput).clear().type(note, { delay: 0 });
  if (companyName) cy.common__selectCompany(companyName);
});

Cypress.Commands.add('invoicePage__clickSave', () => {
  cy.intercept('POST', uiUrls.intercepts.createInvoice).as('createInvoice');
  cy.get(invoicePage.form.save).click();
  return cy.wait('@createInvoice').then(({ response }) => response.body.id);
});
```

BUILD_REQUEST_INSIDE_COMMAND — Build the URL, headers, auth, and wire-format body inside the API command from the example and `context`.
Examples stay camelCase, and each header or field mismatch lives in one place. Building them in specs repeats them at every call and hides the test intent. A negative test that needs a broken header passes it through `restOptions`.

RETURN_REQUEST_CHAIN — Return `cy.request({ method, url, headers, body, ...restOptions })` from every API command.
Without the return, specs cannot chain off the response and assert its status.

SPREAD_REST_OPTIONS_LAST — Spread `restOptions` last in the request object, for per-call overrides such as auth or `failOnStatusCode`.
Spreading earlier lets the defaults overwrite the caller's override, so negative tests fail before they assert.

SKIP_ABSENT_FIELDS — Skip every field whose example value is `null` or `undefined` in a UI command.
One `fill…` command then serves create, edit, and partial-update examples, and one `find…` command matches on any subset of columns. A `find…` command with no field to match throws, because it would match any row. The cost is that a missing field fails silently, so the spec assertion must catch it.

USE_GLOBAL_SELECTORS — Use selector variables from `cypress/selectors/selectors.js` in UI commands, never literal CSS or attribute strings.
For a locator that depends on a value, add a selector function such as `optionByName(name)` to `selectors.js`. A literal bypasses the single source of the locator and breaks without warning when the markup changes.

MATCH_TEXT_THROUGH_L10N — Match and choose visible labels through `l10n` keys, never literal UI text.
A literal label breaks on the first language switch or copy change. Load the localization-testing skill before adding a new key.

WAIT_ON_ALIAS_OR_STATE — Wait on a `cy.intercept` alias or a retrying element state, never a fixed `cy.wait(ms)`.
Register the intercept before the click that sends the request, then `cy.wait('@alias')` after it. Wait for state with `should`, such as `should('not.be.disabled')` before a save. A fixed wait is too short on a slow run and wastes time on a fast one. The cost is one intercept URL to keep in `uiUrls.intercepts`.

RETURN_RESULT_TO_SPEC — Return the value the spec needs next from a UI command, such as the matched row, `null`, or a created ID.
The spec then asserts or stores the result, and the command stays free of test verdicts. A command that returns nothing forces the spec to query the page again. The cost is that every caller must handle a `null` result.

READ_GLOBALS_WITHOUT_IMPORT — Read `apiUrls`, `uiUrls`, `l10n`, and `colours` directly as registered globals, with no import.
An imported copy can disagree with the registered one, and text or colours read at import time stay stale after a language or theme switch.

IMPORT_ASSERTION_BOUNDARIES — Import constraint constants for boundary values used inside command assertions.
A copied literal drifts from the constraint when the rule changes.

FLATTEN_SEQUENTIAL_STEPS — Flatten sequential steps into flat `cy.then()` blocks with no nested `.then()` callbacks.
Nested callbacks hide step order and make failures hard to locate. The cost is a value passed between blocks through a closure variable.

# Validation

EXTRACT_ONLY_REPEATED_SEQUENCES_CHECK — Verify each command wraps a multi-step flow, a multi-assertion check, or shared setup or teardown, and not a single action.
CHOOSE_FILE_BY_OWNER_CHECK — Confirm each command sits in the file of its page, module, domain, or `common`.
IMPORT_FILE_IN_SUPPORT_CHECK — Verify every file under `cypress/commands/` is imported in `cypress/support/e2e.js`.
NAME_COMMAND_BY_OWNER_CHECK — Confirm each command prefix matches its owner file and only HTTP commands end in `__METHOD`.
NAME_OPERATIONS_PRECISELY_CHECK — Verify each API operation uses a CRUD verb for a CRUD endpoint, a domain verb otherwise, and states its access level or tenant scope where the endpoint has one.
NAME_UI_ACTIONS_BY_GESTURE_CHECK — Verify each new UI action opens with a gesture or check verb and holds no `Button` or `The` filler.
ACCEPT_WHOLE_EXAMPLE_CHECK — Confirm no spec passes single example fields to a command that could take the whole example.
ORDER_API_PARAMETERS_CHECK — Confirm every API command takes `(user, example, context = {}, restOptions = {})`, or `(user, context = {}, restOptions = {})` without a body.
ORDER_UI_PARAMETERS_CHECK — Confirm every UI command takes `(example, context = {})`, or fewer, and no user or token.
BUILD_REQUEST_INSIDE_COMMAND_CHECK — Confirm no spec builds headers, URLs, or wire-format bodies for an API command call.
RETURN_REQUEST_CHAIN_CHECK — Verify every API command returns `cy.request()`.
SPREAD_REST_OPTIONS_LAST_CHECK — Confirm `...restOptions` is the last property of every request object.
SKIP_ABSENT_FIELDS_CHECK — Confirm every `fill…` and `find…` command skips `null` fields and every `find…` throws when no field is given.
USE_GLOBAL_SELECTORS_CHECK — Confirm UI commands reference selector variables or selector functions and contain no raw selector strings.
MATCH_TEXT_THROUGH_L10N_CHECK — Confirm no UI command compares or chooses a visible label by a literal string.
WAIT_ON_ALIAS_OR_STATE_CHECK — Confirm no UI command calls `cy.wait` with a number.
RETURN_RESULT_TO_SPEC_CHECK — Verify every `find…` command returns the row or `null` and every save that creates an entity returns its ID.
READ_GLOBALS_WITHOUT_IMPORT_CHECK — Confirm no command file imports `apiUrls`, `uiUrls`, `l10n`, or `colours`.
FLATTEN_SEQUENTIAL_STEPS_CHECK — Confirm no command nests a `.then()` callback inside another `.then()` callback.

