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
- **Example:** `complete-purchase.ui.spec.js`

---

## Test Naming Convention

- Use PascalCase for module and submodule names in component tests.
- Use PascalCase for page and component names in UI tests.
- Use PascalCase for user flows in E2E tests.
- The allowed special characters for test titles (after prefix and colon) are: Spaces ( ), Commas (,)
- Keep action description concise and action-oriented for API tests (e.g., `Create`, `Update`, `Delete`, `Retrieve`)
- Include HTTP method for API tests (e.g., `POST`, `GET`, `PUT`, `DELETE`, `PATCH`)
- Include user role for UI tests (e.g., `STANDARD`)

### Describe Block Title

- Describe the preconditions.
- **Integration API Tests:** `ModuleName.SubmoduleName: Given 'preconditions', 'created data'`
- **Integration UI Tests:** `PageName.ComponentName: Given 'preconditions', 'created data'`
- **E2E UI Tests:** `FlowName.SubFlowName: Given 'preconditions', 'created data'`

### Context Block Title

- Provide the scope and condition being tested.
- **Integration API Tests:** `ModuleName.SubmoduleName.Action.METHOD: When 'condition'`
- **Integration UI Tests:** `PageName.ComponentName.USER_ROLE: When 'condition'`
- **E2E UI Tests:** `FlowName.SubFlowName.USER_ROLE: When 'condition'`

### It Block Title

- Describe the expected result.
- **Integration API Tests:** `ModuleName.SubmoduleName.Action.METHOD: Then 'expected result'`
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

- **API Commands:** Located in `cypress/support/commands/api`
    - **Pattern:** `module-name.api.commands.js`
    - **Example:** `restful-booker.api.commands.js`

- **UI Commands:** Located in `cypress/support/commands/ui`
    - **Pattern:** `page-name.ui.commands.js`
    - **Example:** `checkout-page.ui.commands.js`

### Cypress API Commands Naming Convention

- Use camelCase for naming commands.
- Clearly indicate the resource, action, and HTTP method.
- **Pattern:** `resourceName__actionDescription__METHOD`
- **Example:** `dformsAudits__obtainItemById__GET`

### Cypress UI Commands Naming Convention

- Use camelCase for naming commands.
- Clearly indicate the page and action being performed.
- **Pattern:** `pageName__actionDescription`
- **Example:** `actionPriorityPage__fillCreationForm`

---

## Test Data Naming Convention

- Store test data in javascript files in `cypress/test-data`.
- Test data files should be named according to the test files they support.
- Use camelCase for naming files.
- Use a hierarchical structure organized by module and submodule.
- **Pattern:** `module-name.submodule-name.test-data.js`
- **Example:** `audit.settings-audit-round.test-data.js`

---

## Selectors Naming Convention

- Use camelCase for selector names.
- Clearly indicate the element's purpose and type.
- **Static Text Elements:** Use nouns (e.g., `errorMessage`, `userNameInput`).
- **Action Elements:** Use verbs (e.g., `submitForm`, `openListingTab`).
- **Pattern:** `elementPurposeElementType` or `elementPurposeElementTypeState`
- **Example:** `submitForm`, `userNameInput`, `errorMessage`

---

## UI Elements Localization Keys Naming Convention

- Store localization keys in JSON files in `cypress/support/localization`.
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

