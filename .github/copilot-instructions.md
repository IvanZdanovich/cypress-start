# Project Overview

TASK: Automate testing for web application using Cypress
COVERAGE: UI, API, E2E requirements
TARGET: High-quality, maintainable test suite

## Path Convention

USE `${WORKSPACE_ROOT}` FOR all file references
NO local usernames or machine-specific paths in committed docs

## Key Paths

**Tests:**
- `${WORKSPACE_ROOT}/cypress/e2e/ui/` - E2E workflows
- `${WORKSPACE_ROOT}/cypress/integration/ui/` - Integration UI (pages/components)
- `${WORKSPACE_ROOT}/cypress/integration/api/` - Integration API (modules/submodules)

**Support:**
- `${WORKSPACE_ROOT}/cypress/support/e2e.js` - Global imports and configs
- `${WORKSPACE_ROOT}/cypress/support/selectors/` - UI selectors by page/component
- `${WORKSPACE_ROOT}/cypress/support/commands/api/` - API commands by module
- `${WORKSPACE_ROOT}/cypress/support/commands/ui/` - UI commands by page/component
- `${WORKSPACE_ROOT}/cypress/support/utils/utils.js` - Utility functions
- `${WORKSPACE_ROOT}/cypress/support/requirements/requirements.js` - Requirements, error messages, constraints
- `${WORKSPACE_ROOT}/cypress/support/localization/` - Localization JSON
- `${WORKSPACE_ROOT}/cypress/support/colours/` - Theme colour JSON

**Data:**
- `${WORKSPACE_ROOT}/cypress/test-data/api/` - API test data
- `${WORKSPACE_ROOT}/cypress/test-data/ui/` - UI test data
- `${WORKSPACE_ROOT}/cypress/sensitive-data/` - User credentials (not committed)

**Config:**
- `${WORKSPACE_ROOT}/eslint-plugin-custom-rules/app-structure/` - Structure definitions for test title validation
- `${WORKSPACE_ROOT}/bug-log/bug-log.json` - Bug documentation
- `${WORKSPACE_ROOT}/docs/` - Guidelines and conventions
- `${WORKSPACE_ROOT}/development-data/` - Local reference data (Swagger, HTML pages)

## Out of Scope

NO accessibility (a11y), performance, load, stress testing
NO security, penetration testing
NO cross-browser, cross-device compatibility
NO visual regression, screenshot comparison
NO non-JavaScript/non-Cypress tools
NO mobile native apps
NO manual test case management

## Core Principles

FOLLOW existing folder structure and naming conventions
ADHERE TO Cypress + JavaScript (ES6+) ONLY
USE npm FOR dependency management
NO sensitive data exposure
CUSTOM COMMANDS: ONLY FOR complex multi-step interactions reused across multiple files
USE direct Cypress calls FOR simple actions (`.click()`, `.type()`, `.clear()`, assertions)

## Test Writing Instructions

FOLLOW test-specific instructions PER test type:
- E2E UI: `${WORKSPACE_ROOT}/.github/instructions/e2e-ui-tests.instructions.md`
- Integration UI: `${WORKSPACE_ROOT}/.github/instructions/integration-ui-tests.instructions.md`
- Integration API: `${WORKSPACE_ROOT}/.github/instructions/integration-api-tests.instructions.md`

REFER TO documentation:
- `${WORKSPACE_ROOT}/docs/test-writing-guideline.md`
- `${WORKSPACE_ROOT}/docs/naming-conventions.md`
- `${WORKSPACE_ROOT}/docs/localization-testing.md`
- `${WORKSPACE_ROOT}/docs/colour-theme-testing.md`

---

## Test Data Guidelines

### Test Data Naming Convention

**Self-Descriptive Names:**
- NAME instances TO describe their PURPOSE, not their values
- USE descriptive names that explain WHY the data exists
- AVOID generic names like `item1`, `item2`, `data1`

**Examples:**
```javascript
export const booking_testData = {
  validBookings: {
    standardCheckout: {},
    extendedStay: {},
    sameDayCheckout: {}
  },
  invalidBookings: {
    missingRequiredField: {},
    invalidDateFormat: {},
    checkoutBeforeCheckin: {},
    negativePrice: {}
  }
}
```

### Test Data Structure Requirements

General Rules:
- Separate Instances → per context (group, global, roles, environments)
- Constants → in requirements.js via global reqs
- Self-contained → include all required data + IDs
- Clear Naming → {context}{Purpose} (e.g., groupMinLength)
- Randomisation → all variable data via utils
- Direct References → use test data objects in tests
- Logical Grouping → by scenario/purpose
- Dynamic IDs → String placeholders, populate during execution
- Assign IDs Immediately → after creation

✅ DO:
- Use utils for randomisation (names, numbers, dates)
- Explicit field declarations + types
- Group fields by business scenario
- Assign IDs to same instance (instance.id)
- Reuse within file (create → update → delete)
- Prefix for cleanup: Prefix.Purpose.${randomSuffix}

❌ DON'T:
- Hard-code dates/names/values
- Use generic names (data1, test1)
- Cross-reference IDs between instances
- Add obvious comments

**Structure Example (Single Context):**
```javascript
export const booking_testData = {
  namePrefix: 'Booking',
  validBookings: {
    standardCheckout: {
      bookingId: String,
      firstname: utils.generateRandomString(8),
      lastname: utils.generateRandomString(10),
      totalprice: utils.getRandomNumber(100, 1000),
      depositpaid: true,
      bookingdates: {
        checkin: utils.getFutureDate(7),
        checkout: utils.getFutureDate(14)
      },
      additionalneeds: 'Breakfast'
    }
  },
  invalidBookings: {
    missingFirstname: {
      bookingId: String,
      // firstname: intentionally omitted
      lastname: utils.generateRandomString(10),
      totalprice: utils.getRandomNumber(100, 500),
      depositpaid: true,
      bookingdates: {
        checkin: utils.getFutureDate(7),
        checkout: utils.getFutureDate(14)
      },
      additionalneeds: null
    }
  }
};

// Usage - assign ID after creation
cy.booking__create__POST(testData.validBookings.standardCheckout).then((response) => {
  testData.validBookings.standardCheckout.bookingId = response.body.bookingid;
  expect(response.status).to.eq(200);
});

// Later tests access ID from same instance
cy.booking__update__PUT(
  testData.validBookings.standardCheckout.bookingId,
  testData.validBookings.standardCheckout
);

```

### Test Data Cleanup for Independence

**Requirements:**
- EACH test file MUST run independently IN isolation
- CLEANUP prevents data pollution FROM current AND previous runs
- ENSURES consistent database state BEFORE each execution

**Rules:**
- DEFINE: `const cleanUp = () => { /* delete logic */ }`
- CALL: IN both `before` AND `after` hooks
- DELETE: BY name patterns using `deleteByNames` commands
- NEVER: Delete by IDs only (IDs lost between runs)
- FORMAT: `Prefix.Purpose.${randomSuffix}` for all names

### Test Data Randomization

**Pattern:**
- USE functions FROM `utils` TO generate random values
- TEST ONE randomly selected value PER execution
- DIFFERENT test runs cover DIFFERENT values automatically

**Prohibited:**
- ❌ NO `forEach` loops over test data IN tests
- ❌ NO `for...of` loops over test data IN tests
- ❌ NO dynamic test generation WITH loops
- ❌ NO testing multiple values IN single `it` block

---

## Bug Logging Guidelines

DOCUMENT bugs IN `${WORKSPACE_ROOT}/bug-log/bug-log.json` FOR review and migration TO bug tracking system

### When to Log a Bug

LOG bug IF:

- API/UI returns incorrect HTTP status code
- Error message differs from documentation
- Required field validation is missing/improper
- Response format doesn't match specification
- Behavior is inconsistent or unreliable
- Security vulnerability detected
- Performance issue identified

DO NOT LOG IF:

- Issue is in test code (fix the test)
- Behavior matches documentation (update understanding)
- It's a known limitation (document in notes)

### Bug ID Convention

FORMAT: `BUG-[CONTEXT]-[NUMBER]`
CONTEXT depends ON test type:
- API tests: `BUG-[MODULE]-[NUMBER]` (e.g., `BUG-AUTH-042`)
- E2E UI tests: `BUG-[WORKFLOW]-[NUMBER]` (e.g., `BUG-CHECKOUT-005`)
- Integration UI tests: `BUG-[PAGE/COMPONENT]-[NUMBER]` (e.g., `BUG-FORM-003`)
INCREMENT sequentially WITHIN each context

### Bug Log Structure

Each bug entry in `${WORKSPACE_ROOT}/bug-log/bug-log.json` must include:

```json
{
  "id": "BUG-[MODULE]-XXX",
  "module": "ModuleName",
  "submodule": "SubmoduleName",
  "severity": "High|Medium|Low",
  "status": "Open|Resolved|Closed",
  "description": "Clear description of the issue",
  "expectedBehavior": "What should happen",
  "actualBehavior": "What actually happens",
  "endpoint": "HTTP_METHOD /endpoint/path",
  "reproducible": true,
  "dateReported": "YYYY-MM-DD",
  "affectedFields": [
    "field1",
    "field2"
  ],
  "notes": "Additional context"
}
```

### Test Adaptation Strategy

WHEN bug is logged:
- ADD bug reference comment ABOVE affected test
- UPDATE assertions TO validate ACTUAL behavior
- ADD `failOnStatusCode: false` IF testing error responses
- DOCUMENT expected vs actual IN test comments
- ENSURE test passes WITH current behavior

### Bug Log Maintenance

UPDATE `${WORKSPACE_ROOT}/bug-log/bug-log.json` WHEN:
- Bug fixed → status: "Resolved"
- Bug closed → status: "Closed" WITH resolution notes
- Severity changes → UPDATE severity field
- More details found → ADD TO notes field

PRESERVE:
- Original bug ID
- Original date reported
- Complete history IN notes

---