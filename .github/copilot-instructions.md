# Project Overview

TASK: Automate testing for web application using Cypress
COVERAGE: UI, API, E2E requirements
TARGET: High-quality, maintainable test suite

## Path Convention

USE `${WORKSPACE_ROOT}` FOR all file references
NO local usernames or machine-specific paths in committed docs

## Key Paths

**Tests:**
- `cypress/e2e/ui/` - E2E workflows
- `cypress/integration/ui/` - Integration UI (pages/components)
- `cypress/integration/api/` - Integration API (modules/submodules)

**Support:**
- `cypress/support/e2e.js` - Global imports and configs
- `cypress/support/selectors/` - UI selectors by page/component
- `cypress/support/commands/api/` - API commands by module
- `cypress/support/commands/ui/` - UI commands by page/component
- `cypress/support/utils/` - Utility functions
- `cypress/support/requirements/` - Requirements, error messages, constraints
- `cypress/support/localization/` - Localization JSON
- `cypress/support/colours/` - Theme colour JSON

**Data:**
- `cypress/test-data/api/` - API test data
- `cypress/test-data/ui/` - UI test data
- `cypress/sensitive-data/` - User credentials (not committed)

**Config:**
- `app-structure/` - Structure definitions for test title validation
- `bug-log/bug-log.json` - Bug documentation
- `docs/` - Guidelines and conventions
- `development-data/` - Local reference data (Swagger, HTML pages)

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