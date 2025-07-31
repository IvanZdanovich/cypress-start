# Bug Tracking

## Current Approach

The project tracks bugs in a JSON file (`cypress/support/bugs/bug-log.json`). This method offers:

- A centralized repository for known bugs
- Bug references are usable in tests to indicate known issues
- Structured information including ID, title, and description

Example bug entry:

```json
{
  "loginPage_credentialsFieldIcon": {
    "id": "BUG-001",
    "title": "LoginPage: When either the username or password field is empty, the appropriate field should be highlighted and contain an error icon",
    "description": "Steps to reproduce: 1. Open the Login page; 2. Leave the Username or Password field empty and click on the Login button; 3. Verify that both fields are highlighted in red and have an error icon."
  }
}
```

### Current Usage Pattern

In test files, bugs should be referenced with a `TODO` comment containing a link. The bug description can be parsed in
the test title. Tests can be skipped or configured to ignore the bug if it is not consistently reproducible.

```javascript
it(`CartPage.STANDARD: Then Checkout button is displayed\n${JSON.stringify(bugLog.cartPage_EmptyCartCheckout)}`, () => {
    // TODO: fix the bug buglog.cartPage_EmptyCartCheckout
    cy.get(cartPage.checkout).should('have.text', l10n.cartPage.checkout).and('be.visible').and('be.enabled');
});
```
