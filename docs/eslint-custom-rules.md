# Custom ESLint Rules

This document describes the custom ESLint rules implemented in this project to maintain code quality and consistency in
tests.

## Table of Contents

- [Do Not Allow Empty Blocks](#do-not-allow-empty-blocks)
- [Prevent Duplicated Titles](#prevent-duplicated-titles)
- [Prevent Test Data Loops](#prevent-examples-loops)
- [Verify Test Title Against Structure](#verify-test-title-against-structure)
- [Verify Test Title Pattern](#verify-test-title-pattern)
- [Verify TODOs Have Links](#verify-todos-have-links)
- [Verify Test Title Without Forbidden Symbols](#verify-test-title-without-forbidden-symbols)
- [Standardize Test Titles](#standardize-test-titles)
- [API Command Naming Rule](#api-command-naming-rule)
- [UI Command Naming Rule](#ui-command-naming-rule)
- [Find Unused Selectors](#find-unused-selectors)

## Do Not Allow Empty Blocks

**Rule file:** `eslint-plugin-custom-rules/do-not-allow-empty-blocks.js`

Disallows empty `it`, `context`, and `context.skip` blocks to ensure all tests contain assertions or actions, forcing
developers either to implement the test or mark tests as skipped with `it.skip()`.

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

Ensures that all test titles are unique across the test suite in `describe`, `context`, `it` blocks (including `.skip`
and `.only` variants), preventing confusion and improving clarity.

### Example

```javascript

describe('Module.Submodule: Given preconditions', () => {
    it('Module.Submodule.GET: Then return 200', () => {
    }); // Valid
    it('Module.Submodule.GET: Then return 200', () => {
    }); // ❌ Error: duplicate title
});
```

## Prevent Test Data Loops

**Rule file:** `eslint-plugin-custom-rules/prevent-examples-loops.js`

Prevents the use of loops (forEach, for...of, for...in) over test data arrays within test files. Enforces the use of
randomization functions instead.

### Rationale

- ONE test validates ONE behavior with ONE randomly selected value
- DIFFERENT test runs cover DIFFERENT values automatically
- FASTER test execution (no redundant loops)
- CLEANER test reports (no duplicate test titles)
- CONSISTENT with Cypress best practices

### Examples

**❌ Incorrect - Loop over test data:**

```javascript
const invalidIds = [0, -1, null, 'NaN', 1.2];

describe('Module.Submodule', () => {
    // ❌ Error: Do not use .forEach() to loop over test data
    invalidIds.forEach((id) => {
        it(`Should reject invalid ID: ${id}`, () => {
            cy.module__action__POST(id, {failOnStatusCode: false}).then((response) => {
                expect(response.status).to.eq(400);
            });
        });
    });

    // ❌ Error: Do not use for...of loops over test data
    for (const id of testData.invalidIds) {
        context(`When ID is ${id}`, () => {
            it('Should return error', () => {
                // test logic
            });
        });
    }
});
```

**✅ Correct - Use randomization:**

```javascript
// Test Data File
const invalidIdsArray = [0, -1, null, 'NaN', 1.2];
const getRandomInvalidId = () => invalidIdsArray[Math.floor(Math.random() * invalidIdsArray.length)];

export const module_testData = {
    invalidItems: {
        invalidId: getRandomInvalidId(), // ONE random value per execution
    },
};

// Test File
describe('Module.Submodule', () => {
    it('Module.Submodule.POST: Then return 400 status code for invalid ID', () => {
        cy.module__action__POST(testData.invalidItems.invalidId, {failOnStatusCode: false}).then((response) => {
            expect(response.status).to.eq(400);
        });
    });
});

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

- E2E tests: `./app-structure/expected/workflows.json`
- API tests: `./app-structure/expected/modules.json`
- UI tests: `./app-structure/expected/components.json`

### How It Works

The rule validates that each part in the dot-separated title exists in the JSON structure hierarchy.

## Verify Test Title Pattern

**Rule file:** `eslint-plugin-custom-rules/verify-test-title-pattern.js`

Enforces a specific pattern for test block titles, according to the naming conventions.

### Patterns

**`describe` blocks:**

- Pattern: `([A-Z][a-zA-Z]+\.){0,5}([A-Z][a-zA-Z]+): Given .{1,200}(?<!\s)$`
- Format: `ModuleName.SubModule: Given [preconditions]`
- Example: `Booking.Creation: Given the user is authenticated`

**`context` blocks:**

- Pattern: `([A-Z][a-zA-Z]+\.){1,6}[A-Z]{1,15}: When .{1,200}(?<!\s)$`
- Format: `ModuleName.SubModule.ROLE: When [action]`
- Example: `Booking.Creation.ADMIN: When user creates a new booking`

**`it` blocks:**

- Pattern: `([A-Z][a-zA-Z]+\.){1,6}[A-Z]{1,15}: Then .{1,200}(?<!\s)$`
- Format: `ModuleName.SubModule.ROLE: Then [expected outcome]`
- Example: `Booking.Creation.ADMIN: Then booking is created successfully`

### Requirements

- No leading or trailing whitespace
- Maximum 200 characters for the description part
- Applies to `describe`, `context`, `describe.skip`, `context.skip`, and `it` blocks

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

Prevents test titles from containing leading/trailing whitespace or special characters that could cause issues in
`describe`, `context`, `describe.skip`, and `context.skip` blocks.

### Forbidden Characters

The following characters are not allowed in test titles:

```
! @ # $ % ^ & * ( ) + = { } [ ] | \ ; " ' < > ? /
```

### Examples

```javascript
    context('LoginPage.STANDARD: When user logs in with valid credentials ', () => {
    // ❌ Error: Trailing space
});
context(' LoginPage.STANDARD: When user logs in with valid credentials', () => {
    // ❌ Error: Leading space
});
context('LoginPage.STANDARD: When user logs in with valid credentials!', () => {
    // ❌ Error: Special character "!"
});
context('LoginPage.STANDARD: When user logs in with valid credentials', () => {
    // ✅ Valid: No whitespace or special characters
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

## Find Unused Selectors

### Rule: `find-unused-selectors`

**Location:** `eslint-plugin-custom-rules/find-unused-selectors.js`

**Applies to:** Files in `cypress/support/selectors/` named `selectors.js`

### Purpose

Identifies selectors defined in selector files that are not used anywhere in the test suite (integration tests, e2e
tests, or commands). This helps maintain a clean codebase by removing obsolete selector definitions.

### How It Works

1. **Extraction Phase:**
    - Parses selector files to extract all defined selector keys
    - Tracks the full path of each selector (e.g., `auditsPage.list.rows`, `commonUI.spinner`)
    - Identifies parent objects and leaf properties

2. **Usage Analysis Phase:**
    - Searches through all test files in `cypress/integration/`, `cypress/e2e/`, and `cypress/commands/`
    - Looks for references to each selector path
    - Tracks which selectors are actually used in tests or commands

3. **Reporting Phase:**
    - Reports selectors that are defined but never used
    - Excludes parent objects if any of their children are used
    - Provides auto-fix for simple cases (single-line unused selectors)

### Auto-Fix Capability

The rule can automatically remove:

- Empty parent objects (e.g., `key: {}`)
- Single-line unused leaf properties

It will NOT auto-fix multi-line parent objects to avoid accidentally removing valid nested structures.

### Example

**Unused Selectors:**

```javascript
const auditsPage = {
    header: {
        title: '.page-title',           // ✅ Used in tests
        subtitle: '.page-subtitle',      // ❌ Unused - will be reported
    },
    emptySection: {},                  // ❌ Unused - will be reported and auto-fixed
    obsoleteButton: '.old-button',     // ❌ Unused - will be reported and auto-fixed
};
```

### Configuration

This rule is typically set to `warn` or `off` in the ESLint configuration, as it's more of a maintenance tool than a
strict requirement.
