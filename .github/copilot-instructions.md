# Project Overview

This project automates testing for a web application using Cypress. It covers UI, API, and E2E requirements, ensuring
high-quality and maintainable coverage.

## Folder Structure
- `docs`: Documentation folder.
- `docs/naming-conventions.md`: Naming conventions for test files and components.
- `docs/test-writing-guideline.md`: Guidelines for writing tests.
- `docs/faq.md`: Frequently Asked Questions.
- `docs/localization-testing.md`: Instructions for localization testing.
- `docs/colour-theme-testing.md`: Instructions for colour theme testing.
- `.husky/`: Git hooks for pre-commit and pre-push actions.
- `eslint-plugin-custom-rules/`: Custom ESLint rules for enforcing test writing standards.
- `app-structure/`: JSON files defining the application structure for test title validation.
- `cypress.config.js`: Cypress configuration file.
- `cypress/`: Main Cypress folder containing tests and support files.
- `cypress/e2e/ui/`: End-to-end UI test files.
- `cypress/integration/ui/`: Integration UI test files.
- `cypress/integration/api/`: Integration API test files.
- `cypress/sensitive-data/`: Sensitive data like test user credentials (not committed to version control).
- `cypress/support/e2e.js`: Support file for E2E tests (includes global configurations and imports for both E2E and Integration tests).
- `cypress/support/selectors/`: UI selectors organized by pages and components.
- `cypress/support/commands/api/`: Custom commands for API interactions.
- `cypress/support/commands/ui/`: Custom commands for UI interactions.
- `cypress/support/utils/`: Utility functions for tests.
- `cypress/support/requirements/`: Project wide requirements, API error messages and configurations.
- `cypress/support/localization/`: Localization JSON files.
- `cypress/support/colours/`: Colour theme JSON files.
- `cypress/test-data/api/`: Isolated test data for API test files.
- `cypress/test-data/ui/`: Isolated test data for UI test files.
- `development-data/swagger/`: Contains local Swagger documentation as `.json` files for test development purposes.
- `development-data/pages/`: Contains local HTML pages for test development purposes.

## Key Principles

* Follow the existing folder structure and naming conventions.
* Do not suggest new frameworks, libraries, or tools.
* Adhere to Cypress and JavaScript (ES6+) only.
* Use npm for dependency management.
* Do not expose or suggest sensitive data.

## Test Writing Instructions

- For editing and adding new E2E UI tests, follow the instructions in `.github/instructions/e2e-ui-tests.instructions.md`.
- For editing and adding new Integration UI tests, follow the instructions in `.github/instructions/integration-ui-tests.instructions.md`.
- For editing and adding new Integration API tests, follow the instructions in `.github/instructions/integration-api-tests.instructions.md`.
- Refer to `docs/test-writing-guideline.md` for detailed test writing guidelines.
- Refer to `docs/naming-conventions.md` for naming conventions.
- Refer to `docs/localization-testing.md` for localization testing details.
- Refer to `docs/colour-theme-testing.md` for colour theme testing details.

---
