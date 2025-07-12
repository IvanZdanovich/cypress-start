# Custom ESLint Rules

This document describes the custom ESLint rules implemented in this project to maintain code quality and consistency in
tests.

## Table of Contents

- [Do Not Allow Empty Blocks](#do-not-allow-empty-blocks)
- [Prevent Duplicated Titles](#prevent-duplicated-titles)
- [Verify Test Title Against Structure](#verify-test-title-against-structure)
- [Verify Test Title Pattern](#verify-test-title-pattern)
- [Verify TODOs Have Links](#verify-todos-have-links)
- [Verify Test Title Without Forbidden Symbols](#verify-test-title-without-forbidden-symbols)
- [Standardize Test Titles](#standardize-test-titles)

## Do Not Allow Empty Blocks

**Rule file:** `eslint-plugin-custom-rules/do-not-allow-empty-blocks.js`

Disallows empty test blocks to ensure all tests contain assertions or actions, forcing developers either to implement
the test or mark tests as skipped.

### Invalid Examples

```javascript
it('should do something', () => {
  // Empty block
});

context('when action is done', () => {
  // Empty block
});

it('should do something'); // Missing function body
```

### Valid Examples

```javascript
it('should do something', () => {
  expect(true).to.be.true;
});

context('when action is done', () => {
  cy.get('.element').should('be.visible');
});

it.skip('should do something'); // Skipped test without implementation is allowed
```

## Prevent Duplicated Titles

**Rule file:** `eslint-plugin-custom-rules/prevent-duplicated-titles.js`

Ensures that all test titles are unique across the test suite, preventing confusion and improving clarity.

### Invalid Examples

```javascript
describe('UserManagement', () => {
  // ...
});

// Later in the same test suite or another file
describe('UserManagement', () => {
  // This will trigger the rule violation
});
```

### Valid Examples

```javascript
describe('UserManagement.Create', () => {
  // ...
});

describe('UserManagement.Delete', () => {
  // ...
});
```

## Verify Test Title Against Structure

**Rule file:** `eslint-plugin-custom-rules/verify-test-title-against-structure.js`

Verifies that test titles follow a predefined structure defined in JSON configuration files. Different structures are
applied based on the test type (e2e, api, ui). The rule forces developers to use the correct structure and naming of app instances.

### Configuration Files

- E2E tests: `./app-names/workflows.json`
- API tests: `./app-names/modules.json`
- UI tests: `./app-names/components.json`

### How It Works

The rule validates that each part in the dot-separated title exists in the JSON structure hierarchy.

## Verify Test Title Pattern

**Rule file:** `eslint-plugin-custom-rules/verify-test-title-pattern.js`

Enforces a specific pattern for test block titles:

- `describe` blocks: Must follow `ModuleName.SubModule.ROLE: Given context` pattern
- `context` blocks: Must follow `ModuleName.SubModule.ROLE: When condition` pattern
- `it` blocks: Must follow `ModuleName.SubModule.ROLE: Then expectation` pattern

### Invalid Examples

```javascript
describe('User login', () => {});
context('clicking submit', () => {});
it('works correctly', () => {});
```

### Valid Examples

```javascript
describe('Auth.Login.ADMIN: Given a user on the login page', () => {});
context('Auth.Login.ADMIN: When credentials are valid', () => {});
it('Auth.Login.ADMIN: Then user should be redirected to dashboard', () => {});
```

## Verify TODOs Have Links

**Rule file:** `eslint-plugin-custom-rules/verify-todos-have-links.js`

Ensures that all TODO, FIXME, and similar comments include a JIRA link for tracking purposes.

- Not applied to current project since the bug tracking implemented localy.

### Invalid Examples

```javascript
// TODO: Fix this later
// FIXME: This is broken
```

### Valid Examples

```javascript
// TODO: Fix validation issues - https://company.atlassian.net/browse/PROJ-123
// FIXME: Handle edge case - https://company.atlassian.net/browse/PROJ-456
```

## Verify Test Title Without Forbidden Symbols

**Rule file:** `eslint-plugin-custom-rules/verify-test-title-witout-forbidden-symbols.js`

Prevents test titles from containing leading/trailing whitespace or special characters that could cause issues.

### Invalid Examples

```javascript
describe('Auth.Login: Given a user on the login page ', () => {}); // Trailing space
describe(' Auth.Login: Given a user on the login page', () => {}); // Leading space
describe('Auth.Login: Given a user on the login page!', () => {}); // Special character "!"
```

### Valid Examples

```javascript
describe('Auth.Login: Given a user on the login page', () => {});
context('Auth.Login: When credentials are valid', () => {});
```

## Standardize Test Titles

**Rule file:** `eslint-plugin-custom-rules/standardize-test-titles.js`

Ensures that test titles use consistent and standardized terminology for UI interactions, elements, assertions, and API terms. This improves clarity and uniformity across the test suite.

### How It Works

The rule scans the titles of `describe`, `context`, and `it` blocks and automatically suggests replacements for non-standard terms (e.g., replacing `show` with `display`, `btn` with `button`, `is shown` with `is displayed`, etc.).

### Invalid Examples

```javascript
describe('User clicks btn to show popup', () => {
});
it('should render loader when data is loading', () => {
});
```

### Valid Examples

```javascript
describe('User clicks button to display tooltip', () => {
});
it('should display spinner when data is loading', () => {
});
```
