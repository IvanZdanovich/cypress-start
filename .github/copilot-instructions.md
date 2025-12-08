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
- `${WORKSPACE_ROOT}/cypress/support/utils/` - Utility functions
- `${WORKSPACE_ROOT}/cypress/support/requirements/` - Requirements, error messages, constraints
- `${WORKSPACE_ROOT}/cypress/support/localization/` - Localization JSON
- `${WORKSPACE_ROOT}/cypress/support/colours/` - Theme colour JSON

**Data:**
- `${WORKSPACE_ROOT}/cypress/test-data/api/` - API test data
- `${WORKSPACE_ROOT}/cypress/test-data/ui/` - UI test data
- `${WORKSPACE_ROOT}/cypress/sensitive-data/` - User credentials (not committed)

**Config:**
- `${WORKSPACE_ROOT}/app-structure/` - Structure definitions for test title validation
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
❌ BAD - unclear purpose
```javascript
export const booking_testData = {
    validItems: {
        item1: {},
        item2: {}
    }
}
```
✅ GOOD - clear purpose
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

**Complete Field Documentation:**
- DECLARE ALL fields explicitly, even if optional
- USE randomization FOR variable data
- GROUP related fields logically
- USE `String` type placeholders FOR dynamic IDs populated during execution

**Randomization:**
- USE `utils` functions FOR all variable data (names, numbers, dates)
- AVOID hard-coded dates that will become outdated
- ENSURE test data is unique per execution TO avoid conflicts

**Dynamic ID Assignment:**
- ASSIGN dynamically obtained IDs (bookingId, itemId, etc.) TO the test data object immediately after creation
- USE descriptive property names matching the response (e.g., `bookingId`, not `id`)
- IMPROVES test readability by keeping all related data in one place
- ENABLES easy access in subsequent tests within same file

**Structure Example:**
```javascript
export const booking_testData = {
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
    },
    extendedStay: {
      bookingId: String,
      firstname: utils.generateRandomString(8),
      lastname: utils.generateRandomString(10),
      totalprice: utils.getRandomNumber(2000, 5000),
      depositpaid: false,
      bookingdates: {
        checkin: utils.getFutureDate(30),
        checkout: utils.getFutureDate(60)
      },
      additionalneeds: 'Late checkout, Airport transfer'
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
    },
    invalidDateFormat: {
      ddmmyyyy: {
        bookingId: String,
        firstname: utils.generateRandomString(8),
        lastname: utils.generateRandomString(10),
        totalprice: utils.getRandomNumber(100, 500),
        depositpaid: true,
        bookingdates: {
          checkin: utils.getRandomInvalidDate('DD-MM-YYYY'),
          checkout: utils.getRandomInvalidDate('DD-MM-YYYY')
        },
        additionalneeds: null
      },
      mmddyyyy: {
        bookingId: String,
        firstname: utils.generateRandomString(8),
        lastname: utils.generateRandomString(10),
        totalprice: utils.getRandomNumber(100, 500),
        depositpaid: true,
        bookingdates: {
          checkin: utils.getRandomInvalidDate('MM/DD/YYYY'),
          checkout: utils.getRandomInvalidDate('MM/DD/YYYY')
        },
        additionalneeds: null
      }
    }
  },
};

// Usage in tests - assign ID immediately after creation
cy.booking__create__POST(bookingData).then((response) => {
  // Assign bookingId to test data for reuse in subsequent tests
  booking_testData.validBookings.standardCheckout.bookingId = response.body.bookingid;
  expect(response.status).to.eq(200);
});

// Later tests can access the ID easily
cy.booking__update__PUT(booking_testData.validBookings.standardCheckout.bookingId, updatedData);
```

### Test Data Best Practices

**DO:**
- ✅ USE randomization FOR variable data (names, numbers, dates)
- ✅ DECLARE all fields explicitly WITH their expected types
- ✅ GROUP test data BY business scenario or test purpose
- ✅ NAME instances TO describe test purpose
- ✅ ADD inline comments FOR non-obvious field purposes ONLY (no obvious comments)
- ✅ STORE dynamically obtained IDs IN test data object immediately after creation
- ✅ ASSIGN IDs TO the specific test data instance (e.g., `testData.validBookings.standardCheckout.bookingId = response.body.bookingid`)
- ✅ REUSE test data instances ACROSS tests WITHIN same file
- ✅ USE readable name patterns WITH prefix FOR cleanup identification (e.g., `Prefix.Purpose.RandomSuffix`)

**DON'T:**
- ❌ HARD-CODE dates that will become outdated
- ❌ USE generic names like `data1`, `test1`, `item1`
- ❌ OMIT field declarations without documentation
- ❌ MIX valid and invalid data in same group
- ❌ DUPLICATE similar data structures
- ❌ CREATE multiple instances when one can be reused
- ❌ RELY fully randomized values FOR cleanup queries (use readable prefixes)
- ❌ ADD obvious comments that restate code logic

### Test Data Cleanup for Independence

**File Independence Requirement:**
- EACH test file MUST run independently in isolation
- CLEANUP prevents data pollution from current AND previous test runs
- ENSURES consistent database state before each test execution

**Cleanup Implementation:**
- DEFINE cleanup method: `const cleanUp = () => { /* cleanup logic */ }`
- CALL cleanup IN both `before` AND `after` hooks
- DELETE by NAME PATTERNS using dedicated commands (e.g., `cy.module__deleteByNames__DELETE([namePrefix])`)
- DO NOT delete by IDs only - IDs may be lost between runs
- ENSURE removal of data from both current AND previous test runs

**Readable Name Pattern:**
```javascript
// Define name prefix in test data file
const namePrefix = 'TestFileRef.Purpose';

// Use prefix in all test data instances
const templateName = `${namePrefix}Purpose.${utils.generateRandomString(10)}`;

export const module_testData = {
  namePrefix: 'TestFileRef.Purpose', // Export for cleanup usage
  validItems: {
    standardItem: {
      itemId: String,
      name: `${namePrefix}StandardItem.${utils.generateRandomString(8)}`,
      // ...
    },
  },
};
```

**Cleanup Pattern:**
```javascript
// In test file
import { module_testData } from '../../test-data/api/module.submodule.test-data';

const testData = module_testData;

const cleanUp = () => {
  // Delete by name pattern, not by IDs
  cy.module__deleteByNames__DELETE(token, [testData.namePrefix], { options });
};

before(() => {
  cy.then(()=>{
    cleanUp(); // Remove leftover data from previous runs
  });
  // Setup test data...
});

after(() => {
  cleanUp(); // Clean up data from current run
});
```

### Negative Test Data Randomization

**Randomize Negative Scenarios:**
- DEFINE arrays of invalid values in test data file
- CREATE random selection functions
- USE randomized values in test data instances
- AVOIDS testing all permutations (improves execution time)
- ENSURES different coverage across multiple test runs

### Edge Case Testing

**Separate Edge Cases:**
- CREATE individual test data instances FOR each edge case
- NAME clearly TO indicate edge case type
- TEST each edge case in separate `context` block
- VERIFY specific edge case behavior explicitly

### Invalid Data Testing

**Single Status Code Per Test:**
- ONE test should validate ONE expected state
- NO accepting multiple states
- IF behavior is uncertain, LOG bug and validate ACTUAL behavior
- SEPARATE tests FOR different validation scenarios

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

### Bug Severity Classification

**High Severity:**

- Data corruption/loss
- Security vulnerabilities
- Complete feature failure
- Incorrect validation allowing bad data
- Reliability issues affecting core functionality

**Medium Severity:**

- Incorrect status codes
- Missing/improper error messages
- Non-critical validation issues
- Inconsistent behavior

**Low Severity:**

- Minor deviations from standards
- Cosmetic issues
- Documentation discrepancies

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