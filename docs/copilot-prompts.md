# Refactoring of Tests

## Structuring Tests to Align with Guidelines

- Prompt: "Review and refactor this test file to comply with our test writing guidelines. Specifically:
  1. Ensure proper test structure (describe → context → it) with describe containing setup, context containing conditions, and it blocks containing only verifications
  2. Remove any hard-coded values and move them to appropriate configuration files
  3. Extract selectors to a selectors.js file instead of hiding them in utility commands
  4. Ensure test isolation is properly configured (testIsolation: false on describe block)
  5. Add skipped blocks for documented use cases that aren't implemented yet
  6. Implement proper localization using the global l10n variable
  7. Use random test data generation instead of static values
  8. Ensure there's only one describe block per file"

## Refactoring Titles and Descriptions of Tests

- Prompt: "Fix test titles in this file to conform to our naming conventions:
  1. For describe blocks, use: '{ModuleName}.{SubModule}.{ROLE}: Given {precondition context}'
  2. For context blocks, use: '{ModuleName}.{SubModule}.{ROLE}: When {condition}'
  3. For it blocks, use: '{ModuleName}.{SubModule}.{ROLE}: Then {expected result}'
  4. Ensure titles are properly formatted for the test type:
  - API tests: include endpoint and CRUD operation
  - UI tests: include page and component names
  - E2E tests: include flow and subflow names
  5. Remove any forbidden characters or whitespace from titles
  6. Ensure all titles are unique and follow the structure defined in the appropriate JSON config file
  7. Make descriptions specific and detailed rather than generic"
