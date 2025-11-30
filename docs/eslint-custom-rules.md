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
- [API Command Naming Rule](#api-command-naming-rule)
- [UI Command Naming Rule](#ui-command-naming-rule)

## Do Not Allow Empty Blocks

**Rule file:** `eslint-plugin-custom-rules/do-not-allow-empty-blocks.js`

Disallows empty test blocks to ensure all tests contain assertions or actions, forcing developers either to implement
the test or mark tests as skipped.

### Example

```javascript
describe('ActionPriorityPage.Creation: Given the user navigates to the Creation component of Action Priority page', {testIsolation: false}, () => {
    context('ActionPriorityPage.Creation.ADMIN: When User navigates to the component', () => {
        // Empty block - this will trigger the rule violation
    });
    context('ActionPriorityPage.Creation.ADMIN: When User navigates to the component', () => {
        it('ActionPriorityPage.Creation.ADMIN: Then Title is displayed', () => {
            // Empty block - this will trigger the rule violation
        });
        it.skip('ActionPriorityPage.Creation.ADMIN: Then Name Input field with label and placeholder is displayed', () => {
            // Valid - skipped test without implementation is allowed
        });
    });
});
```

## Prevent Duplicated Titles

**Rule file:** `eslint-plugin-custom-rules/prevent-duplicated-titles.js`

Ensures that all test titles are unique across the test suite, preventing confusion and improving clarity.

### Example

```javascript
describe('UserManagement', () => {
    // ...
});

// Later in the same test suite or another file
describe('UserManagement', () => {
    // This will trigger the rule violation
});
```

## Verify Test Title Against Structure

**Rule file:** `eslint-plugin-custom-rules/verify-test-title-against-structure.js`

Verifies that test titles follow a predefined structure defined in JSON configuration files. Different structures are
applied based on the test type (e2e, api, ui). The rule forces developers to use the correct structure and naming of app
instances.

### Configuration Files

- E2E tests: `./app-names/workflows.json`
- API tests: `./app-names/modules.json`
- UI tests: `./app-names/components.json`

### How It Works

The rule validates that each part in the dot-separated title exists in the JSON structure hierarchy.

## Verify Test Title Pattern

**Rule file:** `eslint-plugin-custom-rules/verify-test-title-pattern.js`

Enforces a specific pattern for test block titles, according to the naming conventions.

## Verify TODOs Have Links

**Rule file:** `eslint-plugin-custom-rules/verify-todos-have-links.js`

Ensures that all TODO, FIXME, and similar comments include a bug tracking system ticket link for tracking purposes.

### Invalid Examples

```javascript
// TODO: Fix this later
// FIXME: This is broken
```

### Valid Examples

```javascript
// TODO: Fix validation issues - https://company.org.net/browse/PROJ-123
// FIXME: Handle edge case - https://company.org.net/browse/PROJ-456
```

## Verify Test Title Without Forbidden Symbols

**Rule file:** `eslint-plugin-custom-rules/verify-test-title-without-forbidden-symbols.js`

Prevents test titles from containing leading/trailing whitespace or special characters that could cause issues.

### Examples

```javascript
    context('LoginPage.STANDARD: When user logs in with valid credentials ', () => {
        // Trailing space
    });
    context(' LoginPage.STANDARD: When user logs in with valid credentials', () => {
        // Leading space
    }); 
    context('LoginPage.STANDARD: When user logs in with valid credentials!', () => {
        // Special character "!"
    }); 
```


## Standardize Test Titles

**Rule file:** `eslint-plugin-custom-rules/standardize-test-titles.js`

Ensures that test titles use consistent and standardized terminology for UI interactions, elements, assertions, and API
terms. This improves clarity and uniformity across the test suite.

### How It Works

The rule scans the titles of `describe`, `context`, and `it` blocks and automatically suggests replacements for
non-standard terms (e.g., replacing `show` with `display`, `btn` with `button`, `is shown` with `is displayed`, etc.).


## API Command Naming Rule

### Rule: `verify-api-command-naming`

**Location:** `eslint-plugin-custom-rules/verify-api-command-naming.js`

**Applies to:** Files in `cypress/support/commands/api/` ending with `.api.commands.js`

### Pattern
```
resourceName__actionDescription__METHOD
```

### Requirements
1. **Three parts separated by double underscores (`__`)**
    - Resource name (e.g., `restfullBooker`, `templates`)
    - Action description (e.g., `add`, `getById`, `update`, `delete`)
    - HTTP method (e.g., `GET`, `POST`, `PUT`, `PATCH`, `DELETE`)

2. **Resource name**
    - Must start with lowercase letter
    - Can contain letters, numbers, and underscores
    - Use camelCase
    - Examples: `restfullBooker`, `templates`

3. **Action description**
    - Must start with lowercase letter
    - Can contain letters and numbers only
    - Use camelCase
    - Examples: `add`, `getById`, `update`, `delete`, `getAll`, `addComment`

4. **HTTP method**
    - Must be uppercase
    - Valid methods: `GET`, `POST`, `PUT`, `PATCH`, `DELETE`

## UI Command Naming Rule

### Rule: `verify-ui-command-naming`

**Location:** `eslint-plugin-custom-rules/verify-ui-command-naming.js`

**Applies to:** Files in `cypress/support/commands/ui/` ending with `.ui.commands.js`

### Pattern
```
pageName__actionDescription
```

### Requirements
1. **Two parts separated by double underscores (`__`)**
    - Page/component name (e.g., `loginPage`, `checkoutPage`)
    - Action description (e.g., `logIn`, `fillForm`, `submitData`)

2. **Page name**
    - Must start with lowercase letter
    - Can contain letters and numbers only
    - Use camelCase
    - Examples: `loginPage`, `checkoutPage`

3. **Action description**
    - Must start with lowercase letter
    - Can contain letters and numbers only
    - Use camelCase
    - Examples: `logIn`, `fillForm`, `submitData`, `clickButton`
