# Custom ESLint Rules

This document describes the custom ESLint rules implemented in this project to maintain code quality and consistency in
tests.

## Enforce Spec Blank Lines

**Rule file:** `eslint-plugin-custom-rules/enforce-spec-blank-lines.js`
**Fixable:** Yes — `--fix` auto-corrects violations

Enforces a single consistent blank-line convention inside `*.spec.js` files:

| Situation                                                                   | Rule                      |
|-----------------------------------------------------------------------------|---------------------------|
| Between consecutive `it` blocks                                             | ❌ No blank line           |
| Between `it` and any hook (`before` / `beforeEach` / `after` / `afterEach`) | ❌ No blank line           |
| Between consecutive hook blocks                                             | ❌ No blank line           |
| Immediately before a `context` block                                        | ✅ One blank line required |

The rule only activates inside the bodies of `describe` and `context` callbacks, and only in `*.spec.js` files.
Non-test statements (variable declarations, helper constants) reset the tracker and are not checked.

## Do Not Allow Empty Blocks

**Rule file:** `eslint-plugin-custom-rules/do-not-allow-empty-blocks.js`

Disallows empty `it`, `context`, and `context.skip` blocks to ensure all tests contain assertions or actions, forcing
developers either to implement the test or mark tests as skipped with `it.skip()`.

### Example

```javascript
describe('ActionPriorityPage.Creation: Given the user navigates to the Creation component of Action Priority page', { testIsolation: false }, () => {
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

### Examples

**❌ Incorrect - Loop over test data:**

```javascript
const invalidIds = [0, -1, null, 'NaN', 1.2];

describe('Module.Submodule', () => {
  // ❌ Error: Do not use .forEach() to loop over test data
  invalidIds.forEach((id) => {
    it(`Should reject invalid ID: ${id}`, () => {
      cy.module__action__POST(id, { failOnStatusCode: false }).then((response) => {
        expect(response.status).to.eq(400);
      });
    });
  });

  // ❌ Error: Do not use for...of loops over test data
  for (const id of examples.invalidIds) {
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
    cy.module__action__POST(examples.invalidItems.invalidId, { failOnStatusCode: false }).then((response) => {
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

**Structure files (single source of truth):**

- E2E tests: `./app-structure/expected/workflows.json`
- API tests: `./app-structure/expected/modules.json`
- UI tests: `./app-structure/expected/components.json`

These files serve two purposes:

1. **Validation** — test title prefixes must match a path in the structure
2. **Coverage tracking** — manually added paths that don't yet have tests represent planned coverage

### How It Works

1. **Extracts structure paths** from test titles (the `Module.Submodule.Operation.METHOD` part before the colon)
2. **Validates against expected structure** — reports an error if the path is not found
3. **Auto-adds on `--fix`** — when ESLint runs with `--fix`, valid new paths are added to `expected/` automatically
4. **Only well-formed paths are accepted** — each segment must be PascalCase (≥ 2 chars), preventing junk accumulation

### Workflow

**Adding new paths (organic growth):**

1. Developer writes a test with a new component/module/workflow path
2. `npm run lint --fix` → path is auto-added to the appropriate `expected/` structure file
3. Commit the updated `expected/` file alongside the test

**Planned coverage (backlog tracking):**

1. Tech lead manually adds paths to `expected/` that don't yet have tests
2. `npm run coverage:report` reports these as missing coverage
3. Tests are written over time to fill the gaps

**Typo prevention (validation):**

1. Developer writes a test with an incorrect path
2. `npm run lint` (no fix) → error with the valid prefix and missing segment highlighted
3. Developer fixes the typo

### Benefits

- Single source of truth — one folder, no intermediate artifacts
- `--fix` is additive-only — never removes manually added paths
- Output is always sorted alphabetically for stable diffs
- Feeds directly into `npm run coverage:report` for gap analysis

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

In spec files (`cypress/integration/**/*.spec.js`, `cypress/e2e/**/*.spec.js`), prefer
`req.bugs` metadata on the `describe`, `context`, or `it` config object over inline `// TODO:`
comments — see [Bug tracking](bug-tracking.md) and the [Verify Req Config](#verify-req-config)
rule. This linked-TODO rule remains the fallback for non-spec files (commands, examples,
scripts) where `req.bugs` does not apply.

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

## Verify Req Config

**Rule file:** `eslint-plugin-custom-rules/verify-req-config.js`

Enforces that every `it()` block (including `.skip` and `.only` variants) declares a Cypress config object with a `req`
property as its **second argument**, and validates all fields inside that object.

### When It Activates

The rule only fires when a `req` property is actually present inside the config object. Both the
config object itself and the `req` property are **optional** — the rule never reports a missing `req`.

### Allowed Fields

| Field           | Type                       | Description                                                | Default |
|-----------------|----------------------------|------------------------------------------------------------|---------|
| `p`             | `'P1'` \| `'P2'` \| `'P3'` | Test priority. Omit when P2.                               | `'P2'`  |
| `preconditions` | non-empty string array     | Extra preconditions not expressed in the `describe` block. | —       |
| `refs`          | non-empty URL array        | Links to stories / ACs (must be valid HTTP/HTTPS URLs).    | —       |
| `bugs`          | non-empty string array     | Bug IDs (`BUG-MODULE-NNN`) or valid HTTP/HTTPS URLs.       | —       |

Any key not in the table above is reported as an **unknown field** error.

### Valid Examples

```javascript
it('Module.Op.METHOD: Then return 200',
  { req: {} },
  () => { /* ... */
  });

it('Module.Op.METHOD: Then return 200',
  { req: { p: 'P1' } },
  () => { /* ... */
  });

it('Module.Op.METHOD: Then return 200',
  { req: { p: 'P1', preconditions: ['booking created via POST'] } },
  () => { /* ... */
  });

it('Module.Op.METHOD: Then return 200',
  { req: { p: 'P1', refs: ['https://jira.example.com/browse/PROJ-123'] } },
  () => { /* ... */
  });

it('Module.Op.METHOD: Then return 500',
  { req: { p: 'P1', bugs: ['BUG-BOOKING-002'] } },
  () => { /* ... */
  });

it('Module.Op.METHOD: Then return 500',
  { req: { p: 'P1', bugs: ['https://jira.example.com/browse/PROJ-123'] } },
  () => { /* ... */
  });
```

### Invalid Examples

```javascript
// ❌ req is not an object
it('Module.Op.METHOD: Then return 200', { req: 'P1' }, () => { /* ... */
});

// ❌ Unknown field in req
it('Module.Op.METHOD: Then return 200', { req: { priority: 'P1' } }, () => { /* ... */
});

// ❌ Invalid priority value
it('Module.Op.METHOD: Then return 200', { req: { p: 'P4' } }, () => { /* ... */
});

// ❌ preconditions is not an array
it('Module.Op.METHOD: Then return 200', { req: { preconditions: 'booking created via POST' } }, () => { /* ... */
});

// ❌ preconditions is an empty array
it('Module.Op.METHOD: Then return 200', { req: { preconditions: [] } }, () => { /* ... */
});

// ❌ preconditions contains an empty string
it('Module.Op.METHOD: Then return 200', { req: { preconditions: [''] } }, () => { /* ... */
});

// ❌ refs is not an array
it('Module.Op.METHOD: Then return 200', { req: { refs: 'https://jira.example.com/browse/PROJ-123' } }, () => { /* ... */
});

// ❌ refs is an empty array
it('Module.Op.METHOD: Then return 200', { req: { refs: [] } }, () => { /* ... */
});

// ❌ refs entry is not a valid URL
it('Module.Op.METHOD: Then return 200', { req: { refs: ['PROJ-123'] } }, () => { /* ... */
});

// ❌ bugs entry does not match BUG-MODULE-NNN format or URL
it('Module.Op.METHOD: Then return 500', { req: { bugs: ['BUG-123'] } }, () => { /* ... */
});

// ❌ bugs is an empty array
it('Module.Op.METHOD: Then return 500', { req: { bugs: [] } }, () => { /* ... */
});
```

### Field Validation Details

**`p`** — must be the string literal `'P1'`, `'P2'`, or `'P3'`. Any other value is an error. Omit entirely when the
priority is P2 (the default).

**`preconditions`** — must be a non-empty array of non-empty string literals. Each element describes one extra
precondition not already captured by the `describe` block title
(e.g. `['booking created via POST', 'user is authenticated']`).

**`refs`** — must be a non-empty array of string literals. Each element must be a valid HTTP/HTTPS URL pointing to a
story, AC, or external specification (e.g. `'https://jira.example.com/browse/PROJ-123'`).

**`bugs`** — must be a non-empty array of string literals. Each element must either:

- Match the pattern `BUG-[A-Z]+-NNN` (e.g. `'BUG-BOOKING-002'`, `'BUG-AUTH-042'`), **or**
- Be a valid HTTP/HTTPS URL (e.g. `'https://jira.example.com/browse/PROJ-123'`).

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
    - Tracks the full path of each selector (e.g., `homePage.list.rows`, `commonUI.spinner`)
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
const homePage = {
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

## Find Unused Test Data

### Rule: `find-unused-test-data`

**Location:** `eslint-plugin-custom-rules/find-unused-examples.js`

**Applies to:** Files in `cypress/test-data/` ending with `*.test-data.js`

### Purpose

Identifies first-level instances of exported test-data objects that are never referenced in any test or command file.
Helps maintain clean test-data files by preventing accumulation of stale or obsolete test data definitions.

### How It Works

1. **Extraction Phase:**
    - Parses test-data files to extract all first-level property keys from exported objects
    - Tracks the full path of each instance (e.g., `booking_testData.validBookings.standard`)
    - Identifies parent objects and leaf properties using indentation-based structure detection

2. **Usage Analysis Phase:**
    - Searches through all files in `cypress/integration/`, `cypress/e2e/`, and `cypress/commands/`
    - Resolves import aliases (e.g., `import { booking_testData as testData }`)
    - Looks for references to each test-data instance path
    - Marks instances as used if they appear anywhere in tests or commands

3. **Reporting Phase:**
    - Reports first-level instances that are defined but never used
    - Excludes parent objects if any of their nested properties are used
    - Provides auto-fix for simple cases (single-line unused instances)

### Auto-Fix Capability

The rule can automatically remove (with `eslint --fix`):

- **Empty objects on a single line** (e.g., `emptyObject: {}`)
- **Single-line unused leaf properties** (e.g., `obsoleteKey: 'value'`)

It will **NOT** auto-fix:

- **Multi-line parent objects with nested content** - these must be removed manually to prevent accidental data loss

**Important:** Only single-line instances are auto-fixable. If an unused test-data instance spans multiple lines (e.g.,
objects with nested properties), you must manually remove it to avoid accidentally deleting important data.

### Example

**Test Data File:**

```javascript
export const booking_testData = {
  namePrefix: 'Booking',              // ❌ Unused - will be reported
  validBookings: {
    standard: { /* ... */ },          // ✅ Used in tests
    extended: { /* ... */ },          // ❌ Unused - will be reported
  },
  obsoleteBooking: { /* ... */ },     // ❌ Unused - will be reported and auto-fixed
};
```

This rule is typically set to `warn` to avoid blocking commits while still alerting developers to cleanup opportunities.

**Note:** This rule is compatible with ESLint v9+ flat config system using `context.filename` and `context.sourceCode`
properties.

---

## Suppressing Rules in Exceptional Cases

Inline ESLint disable comments are the only accepted way to suppress a rule for a specific line or block.
Use suppression sparingly — only when the violation is a genuine false-positive or an unavoidable technical constraint.

### Syntax Reference

| Scope             | Syntax                                                             |
|-------------------|--------------------------------------------------------------------|
| Next line only    | `// eslint-disable-next-line rule-name`                            |
| Current line only | `code; // eslint-disable-line rule-name`                           |
| Block of lines    | `/* eslint-disable rule-name */` … `/* eslint-enable rule-name */` |
| Whole file        | `/* eslint-disable rule-name */` at the very top of the file       |

For **custom rules** in this project always use the `custom/` prefix:

```javascript
// eslint-disable-next-line custom/find-unused-selectors
reservedForFutureUse: '[data-test="future-element"]'
```

For **Cypress built-in rules** use the `cypress/` prefix:

```javascript
// eslint-disable-next-line cypress/no-unnecessary-waiting
cy.wait(300); // required: animation has no deterministic end event

// eslint-disable-next-line cypress/no-force
cy.get(selector).click({ force: true }); // element obscured by overlay during transition
```

### Pre-Commit Impact

Suppression comments are respected by the linter and **do not** increase the error/warning count tracked by
`scripts/thresholds.json`. However, reviewers will flag unjustified suppressions during code review.
Use `git commit --no-verify` only in emergencies and always follow up with a fix.
