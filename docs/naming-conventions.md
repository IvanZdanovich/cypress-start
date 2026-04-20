# Naming Conventions

## App Entities Names

## Test File Naming Convention

- Use kebab case for test file names.

### Integration API Test Files

- **Pattern:** `module-name.submodule-name.api.spec.js`
- **Example:** `restful-booker.booking.api.spec.js`

### Integration UI Test Files

- **Pattern:** `page-name.component-name.ui.spec.js`
- **Example:** `inventory-page.ui.spec.js`

### E2E UI Test Files

- **Pattern:** `business-flow-title.ui.spec.js`
- **Example:** `purchasing.complete-purchase.ui.spec.js`

---

## Test Naming Convention

- Use PascalCase for module and submodule names in component tests.
- Use PascalCase for page and component names in UI tests.
- Use PascalCase for user flows in E2E tests.
- The allowed special characters for test titles (after prefix and colon) are: Spaces ( ), Commas (,)
- Keep operation description concise and action-oriented for API tests (e.g., `Create`, `Update`, `Delete`, `Retrieve`)
- Include HTTP method for API tests (e.g., `POST`, `GET`, `PUT`, `DELETE`, `PATCH`)
- Include user role for UI tests (e.g., `STANDARD`)

### Describe Block Title

- Describe the preconditions.
- **Integration API Tests:** `ModuleName.SubmoduleName: Given 'preconditions', 'created data'`
- **Integration UI Tests:** `PageName.ComponentName: Given 'preconditions', 'created data'`
- **E2E UI Tests:** `FlowName.SubFlowName: Given 'preconditions', 'created data'`

### Context Block Title

- Provide the scope and condition being tested.
- **Integration API Tests:** `ModuleName.SubmoduleName.Operation.METHOD: When 'condition'`
- **Integration UI Tests:** `PageName.ComponentName.USER_ROLE: When 'condition'`
- **E2E UI Tests:** `FlowName.SubFlowName.USER_ROLE: When 'condition'`

### It Block Title

- Describe the expected result.
- **Integration API Tests:** `ModuleName.SubmoduleName.Operation.METHOD: Then 'expected result'`
- **Integration UI Tests:** `PageName.ComponentName.USER_ROLE: Then 'expected result'`
- **E2E UI Tests:** `FlowName.SubFlowName.USER_ROLE: Then 'expected result'`


---

### Integration UI Test Titles Example

```javascript
    describe('InventoryPage: Given No preconditions', () => {
        context('InventoryPage.STANDARD: When user clicks Remove on all the added cards', () => {
            it('InventoryPage.STANDARD: Then the Cart button badge is not existed', () => {
                // Test code here
            });
        });
    });
```

### Integration API Test Titles Example

```javascript
    describe('RestfulBooker.Booking: Given No preconditions', () => {
        context('RestfulBooker.Booking.Create.POST: When valid request is sent', () => {
            it('RestfulBooker.Booking.Create.POST: Then return 201 status code and booking is created', () => {
                // Test code here
            });
        });
    });
```

### E2E UI Test Titles Example

```javascript
    describe('CompletePurchase: Given No preconditions', () => {
        context('CompletePurchase.STANDARD: When user proceeds to checkout and completes the delivery information form', () => {
            it('CompletePurchase.STANDARD: Then user should see an order summary page with product details', () => {
                // Test code here
            });
        });
    });
```

### Relationship with ESLint Rules

These conventions are enforced by the custom ESLint rules in the project:

- `verify-test-title-pattern`: Ensures test titles follow the correct pattern with Given/When/Then
- `verify-test-title-against-structure`: Ensures test titles use terms from the app structure
- `verify-test-title-no-unallowed-characters`: Ensures test titles do not contain unallowed characters

Refer to the [ESLint Guide](./eslint-custom-rules.md) for more information on these rules.

---

## Cypress Commands Naming Convention

- Commands are separated by type: API commands, UI commands

### Cypress Commands Files Naming Convention

- **API Commands:** Located in `cypress/commands/api`
    - **Pattern:** `module-name.api.commands.js`
    - **Example:** `restful-booker.api.commands.js`

- **UI Commands:** Located in `cypress/commands/ui`
    - **Pattern:** `page-name.ui.commands.js`
    - **Example:** `checkout-page.ui.commands.js`

### Cypress API Commands Naming Convention

- Use camelCase for naming commands.
- Clearly indicate the unique endpoint name, operation, and HTTP method.
- **Pattern:** `endpointName__operationDescription__PUT`
- **Example:** `restfullBookerBooking__updateBooking__PUT`

### Cypress UI Commands Naming Convention

- Use camelCase for naming commands.
- Clearly indicate the page and action being performed.
- **Pattern:** `pageName__actionDescription`
- **Example:** `loginPage__logIn`

---

## Constants / Constraints Naming Convention

- Store boundary values and domain constants in `cypress/constants/api/` or `cypress/constants/ui/`.
- Use kebab-case for file names.
- **API Constants:** `{module-name}.api.constraints.js` — e.g., `rb.booking.api.constraints.js`
- **UI Constants:** `{page-name}.ui.constraints.js` — e.g., `login-page.ui.constraints.js`
- Import directly in both spec files and examples files — never hardcode boundary values.

---

## Example files Naming Convention

- Store named examples in javascript files in `cypress/integration-examples/api`, `cypress/integration-examples/ui`, `cypress/e2e-examples/ui`.
- Examples files should be named according to the spec files they support.
- Use camelCase for naming files.
- Use a hierarchical structure organized by module and submodule.
- **Pattern:** `module-name.submodule-name.api.examples.js`, `page-name.component-name.ui.examples.js`, `business-domain.flow-name.ui.examples.js`
- **Example:** `restful-booker.booking.api.examples.js`, `checkout-page.ui.examples.js`, `purchasing.complete-purchase.ui.examples.js`

---

## Example File Instances Naming Convention

### Instance Names

Instance names describe the **boundary condition or purpose**, not the values. Follow the pattern:

```
{entity}__{field}__{BoundaryCondition}
```

The double underscore (`__`) acts as a namespace separator between the three segments — consistent with the `__` convention used in Cypress command names (`entity__operation__METHOD`).

| Suffix             | Meaning                                      |
|--------------------|----------------------------------------------|
| `AtMaxLength`      | Valid — exactly at the upper character limit |
| `OverMaxLength`    | Invalid — one step over the upper limit      |
| `AtMinLength`      | Valid — exactly at the lower character limit |
| `UnderMinLength`   | Invalid — one step under the lower limit     |
| `MinimalPrice`     | Boundary minimum value for a numeric field   |
| `MaximalPrice`     | Boundary maximum value for a numeric field   |
| `Missing`          | Required field intentionally absent          |
| `Duplicate`        | Conflicts with an existing record            |
| `ForbiddenChar`    | Contains a disallowed character              |
| `SameDayCheckout`  | Edge-case date scenario (same-day)           |

**❌ Avoid:** `item1`, `data1`, `test1`, `validBooking1`, `booking2`

### Structure Rules

- **Group** instances by scenario category: `validBookings`, `invalidBookings`, `edgeCases`, etc.
- **Annotate** every instance with a `// Boundary:` comment explaining the scenario
- **Import** boundary values from constraint files — never hardcode them
- **Use `utils`** for all dynamic data (strings, numbers, dates, booleans)
- **Declare `bookingId: String`** (or equivalent ID field) as a placeholder — assign after creation
- **Include `namePrefix`** at the root for cleanup identification

### Example Structure

```javascript
// cypress/integration-examples/api/rb.booking.api.examples.js
import { PRICE, FIRSTNAME, REQUIRED_FIELDS } from '../../constants/api/rb.booking.api.constraints';

export const booking_examples = {
    namePrefix: 'API.Booking',

    validBookings: {
        standard: {
            // Boundary: all fields present, price within range — must be accepted
            bookingId: String,
            firstname: `API.Booking.${utils.generateRandomString(6)}`,
            lastname: utils.generateRandomString(8),
            totalprice: utils.getRandomNumber(PRICE.MIN, PRICE.MAX),
            depositpaid: true,
            bookingdates: {
                checkin: utils.getFutureDate(7),
                checkout: utils.getFutureDate(14),
            },
        },

        minimalPrice: {
            // Boundary: totalprice = PRICE.MIN (1) — lowest accepted value
            bookingId: String,
            firstname: `API.Booking.${utils.generateRandomString(6)}`,
            lastname: utils.generateRandomString(8),
            totalprice: PRICE.MIN,
            depositpaid: true,
            bookingdates: {
                checkin: utils.getFutureDate(1),
                checkout: utils.getFutureDate(7),
            },
        },

        firstname__AtMaxLength: {
            // Boundary: firstname = FIRSTNAME.MAX_LENGTH characters — must be accepted
            bookingId: String,
            firstname: utils.extendStringWithPrefix('API.Booking', FIRSTNAME.MAX_LENGTH),
            lastname: utils.generateRandomString(8),
            totalprice: utils.getRandomNumber(PRICE.MIN, PRICE.MAX),
            depositpaid: utils.getRandomBoolean(),
            bookingdates: {
                checkin: utils.getFutureDate(1),
                checkout: utils.getFutureDate(7),
            },
        },
    },

    invalidBookings: {
        missingRequired: {
            // Boundary: one randomly selected required field omitted per run
            baseBooking: {
                firstname: `API.Booking.${utils.generateRandomString(6)}`,
                lastname: utils.generateRandomString(8),
                totalprice: utils.getRandomNumber(PRICE.MIN, PRICE.MAX),
                depositpaid: true,
                bookingdates: {
                    checkin: utils.getFutureDate(1),
                    checkout: utils.getFutureDate(7),
                },
            },
            requiredFields: REQUIRED_FIELDS,
        },

        firstname__OverMaxLength: {
            // Boundary: firstname exceeds FIRSTNAME.MAX_LENGTH — must be rejected
            bookingId: String,
            firstname: utils.extendStringWithPrefix('API.Booking', FIRSTNAME.MAX_LENGTH + 1),
            lastname: utils.generateRandomString(8),
            totalprice: utils.getRandomNumber(PRICE.MIN, PRICE.MAX),
            depositpaid: true,
            bookingdates: {
                checkin: utils.getFutureDate(1),
                checkout: utils.getFutureDate(7),
            },
        },
    },
};
```

### Instance — Spec Traceability

Each named instance maps 1-to-1 to a boundary condition tested in a `context` block:

```
PRICE.MIN = 1                                     ← constraint
  → booking_examples.validBookings.minimalPrice   ← named instance
    → context: "When booking with price of 1..."  ← spec context (uses ${PRICE.MIN})
      → expect(totalprice).to.eq(PRICE.MIN)       ← assertion
```

---

## Selectors Naming Convention

- Use camelCase for selector names.
- Clearly indicate the element's purpose and type.
- **Static Elements:** Use nouns (e.g., `errorMessage`, `userNameInput`).
- **Action Elements:** Use verbs (e.g., `submitForm`, `openListingTab`).
- **Pattern:** `elementPurposeElementType` or `elementPurposeElementTypeState`
- **Example:** `submitForm`, `userNameInput`, `errorMessage`

---

## UI Elements Localization Keys Naming Convention

- Store localization keys in JSON files in `cypress/localization`.
- Use camelCase for naming keys.
- Use a hierarchical structure organized by page and component.
- **Static Text Elements:** Use nouns (e.g., `title`, `placeholder`).
- **Action Elements:** Use verbs (e.g., `clickButton`, `submitForm`).
- **Pattern:** `pageName.element` or `pageName.componentName.element`
- **Example:**

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

---

## Test Wording Naming Convention

### UI Interaction Words

| Preferred Term | Avoid Using             | Context                                 |
|----------------|-------------------------|-----------------------------------------|
| `display`      | show, render, present   | Use for UI elements appearing on screen |
| `click`        | press, tap, select      | Use for button/link interactions        |
| `input`        | enter, type, fill       | Use for entering data in form fields    |
| `select`       | choose, pick            | Use for dropdown/select elements        |
| `expand`       | open, unfold            | Use for expandable sections/accordions  |
| `collapse`     | close, fold             | Use for collapsing expanded sections    |
| `hover`        | mouseover, move over    | Use for hover interactions              |
| `navigate`     | go to, browse to, visit | Use for page navigation                 |
| `submit`       | send, post              | Use for form submissions                |
| `upload`       | attach                  | Use for file uploads                    |
| `download`     | get, retrieve           | Use for file downloads                  |
| `drag`         | move                    | Use for drag operations                 |
| `drop`         | place                   | Use for drop operations                 |
| `scroll`       | move down/up            | Use for scrolling actions               |
| `refresh`      | reload                  | Use for page refreshes                  |

### UI Element Words

| Preferred Term | Avoid Using               | Context                           |
|----------------|---------------------------|-----------------------------------|
| `button`       | btn, control              | Use for clickable button elements |
| `input field`  | textbox, field            | Use for text input elements       |
| `dropdown`     | select, combobox          | Use for dropdown elements         |
| `checkbox`     | check, tick box           | Use for checkbox elements         |
| `radio button` | radio, option button      | Use for radio button elements     |
| `toggle`       | switch                    | Use for toggle elements           |
| `icon`         | image, symbol             | Use for icon elements             |
| `tooltip`      | hint, popup               | Use for tooltip elements          |
| `modal`        | popup, dialog             | Use for modal dialogs             |
| `spinner`      | loader, loading indicator | Use for loading indicators        |
| `tab`          | page tab                  | Use for tabbed interface elements |
| `panel`        | section, area             | Use for panel elements            |
| `sidebar`      | side panel, side menu     | Use for sidebar elements          |
| `header`       | top bar, title bar        | Use for header elements           |
| `footer`       | bottom bar                | Use for footer elements           |
| `pagination`   | page navigation           | Use for pagination controls       |
| `notification` | alert, message            | Use for notification elements     |
| `toast`        | popup message             | Use for toast notifications       |

### Assertion Words

| Preferred Term   | Avoid Using                    | Context                            |
|------------------|--------------------------------|------------------------------------|
| `is displayed`   | is shown, is visible, appears  | Use for visibility assertions      |
| `is enabled`     | is active, is clickable        | Use for enabled state assertions   |
| `is disabled`    | is inactive, is not clickable  | Use for disabled state assertions  |
| `is selected`    | is checked, is chosen          | Use for selection state assertions |
| `contains`       | has, includes                  | Use for content assertions         |
| `matches`        | equals, is same as             | Use for equality assertions        |
| `exists`         | is present, is available       | Use for existence assertions       |
| `does not exist` | is not present, is unavailable | Use for non-existence assertions   |
| `has attribute`  | contains attribute             | Use for attribute assertions       |
| `has class`      | contains class                 | Use for class assertions           |
| `has value`      | contains value                 | Use for value assertions           |
| `has text`       | contains text                  | Use for text content assertions    |
| `has count`      | has length, has size           | Use for count assertions           |
| `is sorted`      | is ordered                     | Use for sorting assertions         |
| `is focused`     | has focus                      | Use for focus assertions           |

### API Test words

| Preferred Term    | Avoid Using               | Context                           |
|-------------------|---------------------------|-----------------------------------|
| `return`          | respond with, give back   | Use for API response descriptions |
| `status code`     | response code, HTTP code  | Use for HTTP status codes         |
| `body`            | payload, content          | Use for response body             |
| `header`          | HTTP header               | Use for request/response headers  |
| `parameter`       | param, arg                | Use for request parameters        |
| `query parameter` | query param, query string | Use for URL query parameters      |
| `path parameter`  | path param, URL param     | Use for URL path parameters       |
| `request`         | call, invoke              | Use for API requests              |
| `response`        | result, output            | Use for API responses             |
| `authenticate`    | authorize, login          | Use for authentication operations |
| `validate`        | verify, check             | Use for validation operations     |
| `create`          | add, insert               | Use for POST operations           |
| `retrieve`        | get, fetch                | Use for GET operations            |
| `update`          | modify, edit              | Use for PUT/PATCH operations      |
| `delete`          | remove                    | Use for DELETE operations         |
| `succeed`         | pass, be successful       | Use for successful operations     |
| `fail`            | error, be unsuccessful    | Use for failed operations         |

