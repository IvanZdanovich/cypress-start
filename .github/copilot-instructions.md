# Project Overview

This project automates testing for a web application using Cypress. It covers UI, API, and E2E requirements, ensuring
high-quality and maintainable coverage.

## Folder Structure

**Note**: When referencing files in AI prompts or AI instructions, always use **absolute paths** from the workspace root
via the `${WORKSPACE_ROOT}`. Never include your real local username or machine-specific path in committed docs.

- `${WORKSPACE_ROOT}/docs/` - Documentation folder
    - `naming-conventions.md` - Naming conventions for test files and components
    - `test-writing-guideline.md` - Guidelines for writing tests
    - `faq.md` - Frequently Asked Questions
    - `localization-testing.md` - Instructions for localization testing
    - `colour-theme-testing.md` - Instructions for colour theme testing
- `${WORKSPACE_ROOT}/.husky/` - Git hooks for pre-commit and pre-push actions
- `${WORKSPACE_ROOT}/eslint-plugin-custom-rules/` - Custom ESLint rules for enforcing test writing standards
- `${WORKSPACE_ROOT}/app-structure/` - JSON files defining the application structure for test title validation
- `${WORKSPACE_ROOT}/cypress.config.js` - Cypress configuration file
- `${WORKSPACE_ROOT}/cypress/` - Main Cypress folder containing tests and support files
    - `e2e/ui/` - End-to-end UI test files
    - `integration/ui/` - Integration UI test files
    - `integration/api/` - Integration API test files
    - `sensitive-data/` - Sensitive data like test user credentials (not committed to version control)
    - `support/e2e.js` - Support file for E2E tests (includes global configurations and imports)
    - `support/selectors/` - UI selectors organized by pages and components
    - `support/commands/api/` - Custom commands for API interactions
    - `support/commands/ui/` - Custom commands for UI interactions
    - `support/utils/` - Utility functions for tests
    - `support/requirements/` - Project wide requirements, API error messages and configurations
    - `support/localization/` - Localization JSON files
    - `support/colours/` - Colour theme JSON files
    - `test-data/api/` - Isolated test data for API test files
    - `test-data/ui/` - Isolated test data for UI test files
- `${WORKSPACE_ROOT}/development-data/` - Local development reference data
    - `swagger/` - Swagger documentation as `.json` files or other documentation for test development
    - `pages/` - HTML pages for test development purposes

## Out of Scope

- Accessibility (a11y) testing
- Performance, load, or stress testing
- Security or penetration testing
- Cross-browser or cross-device compatibility testing
- Visual regression or screenshot comparison
- Suggesting or using non-JavaScript/Non-Cypress tools or frameworks
- Mobile native app testing
- Manual test case management

## Key Principles

* Follow the existing folder structure and naming conventions.
* Do not suggest new frameworks, libraries, or tools.
* Adhere to Cypress and JavaScript (ES6+) only.
* Use npm for dependency management.
* Do not expose or suggest sensitive data.

## Test Writing Instructions

- For editing and adding new E2E UI tests, follow the instructions in
  `${WORKSPACE_ROOT}/.github/instructions/e2e-ui-tests.instructions.md`.
- For editing and adding new Integration UI tests, follow the instructions in
  `${WORKSPACE_ROOT}/.github/instructions/integration-ui-tests.instructions.md`.
- For editing and adding new Integration API tests, follow the instructions in
  `${WORKSPACE_ROOT}/.github/instructions/integration-api-tests.instructions.md`.
- Refer to `${WORKSPACE_ROOT}/docs/test-writing-guideline.md` for detailed test writing guidelines.
- Refer to `${WORKSPACE_ROOT}/docs/naming-conventions.md` for naming conventions.
- Refer to `${WORKSPACE_ROOT}/docs/localization-testing.md` for localization testing details.
- Refer to `${WORKSPACE_ROOT}/docs/colour-theme-testing.md` for colour theme testing details.

---

## Workaround for Path Management

Define once per terminal / prompt session:

```bash
# Example: Replace with your actual workspace path
export WORKSPACE_ROOT="/absolute/path/to/your/cypress-start"
```

Then reference:

```bash
$WORKSPACE_ROOT/cypress/integration/api/module-name.submodule.api.spec.js
```

If scripting, expand before passing to AI tooling.

---

## Bug Logging Guidelines

**Note**: When discovering API or UI bugs during test development, document them in
`${WORKSPACE_ROOT}/bug-log/bug-log.json` for review and migration to the bug tracking system.

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

FORMAT: `BUG-[MODULE]-[NUMBER]`

EXAMPLES:

- `BUG-AUTH-042` - 42nd bug in Auth module

INCREMENT sequentially within each module.

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
    ADD bug reference comment above affected test
    UPDATE assertions to validate ACTUAL behavior
    ADD failOnStatusCode: false if testing error responses
    DOCUMENT expected vs actual in test comments
    ENSURE test passes with current behavior

### Bug Log Maintenance

UPDATE ${WORKSPACE_ROOT}/bug-log/bug-log.json
WHEN:
    Bug is fixed => change status to "Resolved"
    Bug is closed => change status to "Closed" with resolution notes
    Severity changes => update severity field
    More details discovered => add to notes field
PRESERVE:
    Original bug ID
    Original date reported
    Complete history in notes

---