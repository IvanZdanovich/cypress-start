# Bug Tracking

## Overview

Bugs found during testing should be tracked and documented to ensure they are addressed in a timely manner. All bugs
must be logged in the project's issue tracking system (e.g., GitHub Issues, Jira) and referenced directly in the test
code.

## Bug Tracking Process

1. **Create an Issue**: When a bug is discovered, create a detailed issue in the project's issue tracking system with:
    - Clear title describing the bug
    - Steps to reproduce
    - Expected vs. actual behavior
    - Screenshots or logs (if applicable)
    - Environment details (browser, OS, etc.)

2. **Reference in Test Code**: Add a `TODO` comment in the test code with a direct link to the issue.

3. **Skip or Mark Test**: Use `.skip()` for tests that cannot pass due to the bug, or configure the test to handle known
   issues.

4. **Monitor and Update**: Regularly monitor the issue tracker for updates on the bug. Once fixed, update the test code
   to remove the skip and verify the fix.

### Skipped Test with Bug Reference

```javascript
it.skip('CartPage.STANDARD: Then Checkout button is displayed and enabled', () => {
    // TODO: https://github.com/org/repo/issues/123
    cy.get(cartPage.checkout)
        .should('have.text', l10n.cartPage.checkout)
        .and('be.visible')
        .and('be.enabled');
});
```
