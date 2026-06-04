# Naming conventions

## Test file naming

Kebab-case for all test file names.

| Type            | Pattern                                  | Example                              |
|-----------------|------------------------------------------|--------------------------------------|
| Integration API | `module-name.submodule-name.api.spec.js` | `restful-booker.booking.api.spec.js` |
| Integration UI  | `page-name.component-name.ui.spec.js`    | `inventory-page.ui.spec.js`          |
| E2E UI          | `business-flow-title.ui.spec.js`         | `complete-purchase.ui.spec.js`       |

## Test title conventions

- PascalCase for module, page, component, and workflow names
- Allowed special characters after prefix and colon: spaces (` `), commas (`,`)
- API tests include operation and HTTP method (e.g. `Create.POST`)
- UI tests include user role (e.g. `STANDARD`, `ADMIN`)

### Title patterns

| Block      | Integration API                                             | Integration UI                                     | E2E UI                                           |
|------------|-------------------------------------------------------------|----------------------------------------------------|--------------------------------------------------|
| `describe` | `Module.Submodule: Given 'preconditions'`                   | `Page.Component: Given 'preconditions'`            | `Flow.SubFlow: Given 'preconditions'`            |
| `context`  | `Module.Submodule.Operation.METHOD: When 'condition'`       | `Page.Component.USER_ROLE: When 'condition'`       | `Flow.SubFlow.USER_ROLE: When 'condition'`       |
| `it`       | `Module.Submodule.Operation.METHOD: Then 'expected result'` | `Page.Component.USER_ROLE: Then 'expected result'` | `Flow.SubFlow.USER_ROLE: Then 'expected result'` |

### Examples

```javascript
// Integration API
describe('RestfulBooker.Booking: Given no preconditions', { testIsolation: false }, () => {
  context('RestfulBooker.Booking.Create.POST: When valid request is sent', () => {
    it('RestfulBooker.Booking.Create.POST: Then return 201 status code', { req: {} }, () => {
    });
  });
});

// Integration UI
describe('InventoryPage: Given no preconditions', { testIsolation: false }, () => {
  context('InventoryPage.STANDARD: When user clicks Remove on all added cards', () => {
    it('InventoryPage.STANDARD: Then Cart button badge does not exist', { req: {} }, () => {
    });
  });
});

// E2E UI
describe('CompletePurchase: Given no preconditions', { testIsolation: false }, () => {
  context('CompletePurchase.STANDARD: When user completes checkout', () => {
    it('CompletePurchase.STANDARD: Then order summary with product details is displayed', { req: {} }, () => {
    });
  });
});
```

### ESLint enforcement

| Rule                                          | Purpose                    |
|-----------------------------------------------|----------------------------|
| `verify-test-title-pattern`                   | Given/When/Then pattern    |
| `verify-test-title-against-structure`         | Titles match app structure |
| `verify-test-title-without-forbidden-symbols` | No disallowed characters   |
| `standardize-test-titles`                     | Consistent terminology     |

See [ESLint custom rules](eslint-custom-rules.md) for details.

## Command naming

### Command files

| Type | Location                | Pattern                       | Example                          |
|------|-------------------------|-------------------------------|----------------------------------|
| API  | `cypress/commands/api/` | `module-name.api.commands.js` | `restful-booker.api.commands.js` |
| UI   | `cypress/commands/ui/`  | `page-name.ui.commands.js`    | `checkout-page.ui.commands.js`   |

### Command names

| Type | Pattern                                | Example                                     |
|------|----------------------------------------|---------------------------------------------|
| API  | `moduleName__operationDetails__METHOD` | `restfullBookerBooking__updateBooking__PUT` |
| UI   | `pageName__actionDescription`          | `loginPage__logIn`                          |


## Example naming

Location: `cypress/integration-examples/{api,ui}/`, `cypress/e2e-examples/ui/`

### Single rule

```
{purpose}{QualifierSuffix?}
```

- `lowerCamelCase` for every example key — group containers and instance leaves.
- Container key carries entity and validity (`validBookings`, `invalidBookings`, `expectedResponses`, `auditRounds`).
- Instance key describes the *one thing* that distinguishes this instance — a noun phrase, with an optional
  PascalCase qualifier suffix drawn from the vocabulary below when the variant is a boundary, edge, or update.
- Regex shape: `^[a-z][a-zA-Z0-9]*$`.

### Layered shape

| Layer        | Style                            | Carries                                                                       |
|--------------|----------------------------------|-------------------------------------------------------------------------------|
| File export  | `{topic}_examples` (snake)       | spec topic                                                                    |
| Group key    | `lowerCamelCase` collective noun | entity + validity (`validBookings`, `invalidBookings`, `expectedResponses`)   |
| Instance key | `lowerCamelCase` noun phrase     | the single distinguishing intent of the instance                              |

### Qualifier-suffix vocabulary

| Suffix                   | Meaning                                      |
|--------------------------|----------------------------------------------|
| `AtMaxLength`            | Valid — exactly at upper character limit     |
| `OverMaxLength`          | Invalid — one over upper limit               |
| `AtMinLength`            | Valid — exactly at lower character limit     |
| `UnderMinLength`         | Invalid — one under lower limit              |
| `WithMinimalPrice`       | Boundary minimum for numeric field           |
| `WithMaximalPrice`       | Boundary maximum for numeric field           |
| `MissingRequiredField`   | Required field intentionally absent          |
| `Duplicate`              | Conflicts with existing record               |
| `WithForbiddenChar`      | Contains disallowed character                |
| `WithAllFields`          | All optional fields present — Create context |
| `WithMandatoryFields`    | Only required fields — Create context        |
| `UpdatedToAllFields`     | Full replacement payload — Update context    |
| `UpdatedToMinimalFields` | Strips optional fields — Update context      |

### Pattern in practice

```javascript
export const booking_examples = {
  namePrefix: 'API.Booking',
  validBookings: {
    allFieldsWithAllowedPrice: { /* ... */ },
    allFieldsWithMinimalPrice: { /* ... */ },
    firstnameAtMaxLength:      { /* ... */ },
    updatedToAllFields:        { /* ... */ },
  },
  invalidBookings: {
    missingFirstname:       { /* ... */ },
    firstnameOverMaxLength: { /* ... */ },
    duplicateBooking:       { /* ... */ },
  },
  expectedResponses: {
    yesNoCompliant:                          { /* ... */ },
    yesNoNotApplicable:                      { /* ... */ },
    dropdownCriticalFailNonCompliantAbove69: { /* ... */ },
  },
};
```

Avoid: `item1`, `data1`, `test1`, `validBooking1`, `standard`, `default`, `entity__field__boundary`.

## Selector naming

- camelCase, purpose-driven names
- Static text elements: nouns (`errorMessage`, `userNameInput`)
- Action elements: verbs (`submitForm`, `openListingTab`)
- Pattern: `elementPurposeElementType`

## Localization key naming

Location: `cypress/localization/`

- camelCase, hierarchical by page and component
- Pattern: `pageName.element` or `pageName.componentName.element`

```json
{
  "loginPage": {
    "title": "Swag Labs",
    "form": {
      "login": "Login",
      "username": "Username"
    }
  }
}
```

## Test wording

### UI interaction terms

| Preferred  | Avoid                   |
|------------|-------------------------|
| `display`  | show, render, present   |
| `click`    | press, tap, select      |
| `input`    | enter, type, fill       |
| `select`   | choose, pick            |
| `expand`   | open, unfold            |
| `collapse` | close, fold             |
| `hover`    | mouseover               |
| `navigate` | go to, browse to, visit |
| `submit`   | send, post              |
| `upload`   | attach                  |
| `download` | get, retrieve           |
| `scroll`   | move down/up            |
| `refresh`  | reload                  |

### UI element terms

| Preferred      | Avoid                     |
|----------------|---------------------------|
| `button`       | btn, control              |
| `input field`  | textbox, field            |
| `dropdown`     | select, combobox          |
| `checkbox`     | check, tick box           |
| `radio button` | radio, option button      |
| `toggle`       | switch                    |
| `modal`        | popup, dialog             |
| `spinner`      | loader, loading indicator |
| `toast`        | popup message             |
| `notification` | alert, message            |
| `pagination`   | page navigation           |

### Assertion terms

| Preferred        | Avoid                          |
|------------------|--------------------------------|
| `is displayed`   | is shown, is visible, appears  |
| `is enabled`     | is active, is clickable        |
| `is disabled`    | is inactive, is not clickable  |
| `is selected`    | is checked, is chosen          |
| `contains`       | has, includes                  |
| `exists`         | is present, is available       |
| `does not exist` | is not present, is unavailable |
| `has count`      | has length, has size           |

### API terms

| Preferred     | Avoid                    |
|---------------|--------------------------|
| `return`      | respond with, give back  |
| `status code` | response code, HTTP code |
| `body`        | payload, content         |
| `create`      | add, insert              |
| `retrieve`    | get, fetch               |
| `update`      | modify, edit             |
| `delete`      | remove                   |
| `validate`    | verify, check            |
| `succeed`     | pass, be successful      |
| `fail`        | error, be unsuccessful   |

## Related

- [Test writing guideline](test-writing-guideline.md)
- [ESLint custom rules](eslint-custom-rules.md)
- [Requirements examples approach](requirements-examples-approach.md)
