## Cypress Test Writing Guideline

### Specification by Example

The "Specification by Example" approach uses concrete examples to illustrate and validate system behavior. This method
ensures that all stakeholders, developers, and testers have a clear understanding of the requirements and that tests
accurately reflect the desired functionality. The current approach aims to create live documentation, requiring all
specifications to be defined, even if not yet implemented.

### Rules

- **Do Not Automate Manual Test Cases**: Directly replicating manual test cases in automation is impractical and costly,
  yielding minimal benefits. Instead, focus on identifying and implementing the most valuable specifications.

- **Naming Conventions**: Follow the [Naming Conventions](naming-conventions.md).

- **Test Type Classification**: Organize tests into three categories:
    - E2E UI tests in `cypress/e2e/ui/`
    - Integration UI tests in `cypress/integration/ui/`
    - Integration API tests in `cypress/integration/api/`

- **Test Independence**: Specifications should be properly structured and ordered within each file. Tests within a file
  may be dependent to efficiently cover particular functionality, but specifications from different files should not
  overlap.

- **Test Structure**:
    - **`it` Block**: Specifies the expected result (specification) and contains only verification steps. To keep
      requirements unique, provide detailed descriptions. Avoid generic descriptions like "Should return 401
      Unauthorized error." Include specific details such as error messages. Ensure a single check per `it` block. For
      E2E UI tests, it may make sense to join
      several checks within one parent element:
       ```javascript
         it('LoginPage.STANDARD: Then username field should be highlighted and contain error icon', () => {
           cy.get(loginPage.username).should('have.css', 'border-bottom-color', colours.ERROR);
           cy.get(loginPage.username).parent().find(loginPage.errorIcon).should('be.visible');
         });
       ```
    - **`context` Block**: Outlines the conditions and includes preparation steps common to `it` blocks. Prepare test
      data within the context block. There is no need to prepare all data once in a `before` block; for better
      readability, provide conditions in sequential `context` blocks.
    - **`describe` Block**: Groups similar checks and includes initial preparation steps common for context blocks.

- **Sensitive Data**: Store credentials and sensitive information in `cypress/sensitive-data/`. Never commit this folder
  to version control.

- **Custom Commands**: Leverage existing custom commands from `cypress/support/commands/` before writing inline code.
  Create new commands for frequently used operations.

- **Requirements Reference**: Use project-wide requirements from `cypress/support/requirements/` for consistent error
  messages and configurations.

- **Automated Enforcement**: Custom ESLint rules in `eslint-plugin-custom-rules/` automatically enforce naming
  conventions and structure guidelines during development.

- **Store Localization in Variables**: Store localization keys in JSON files in `cypress/support/localization`. Use
  localization keys in tests instead of hardcoded values. Use the global `l10n` variable to obtain values from the
  `l10n.json` file that contains the applied localization file.

- **Store Colour Values in Variables**: Store colour values in JSON files in `cypress/support/colours`. Use colour
  values in tests instead of hardcoded values. Use the global `colours` variable to
  obtain values from the `current-theme-colours.json` file that contains the applied colour theme file.

- **Store Selectors in Variables**: Store selectors in the `cypress/support/selectors/selectors.js` file, grouped by
  pages and components. Storing selectors in well-named, global page variables helps keep the code clean and
  maintainable. Navigating to the selector by its variable allows you to easily find the selector and copy it for
  debugging or refactoring. For example:
   ```javascript
     before(() => {
        cy.get(headerComp.openCart).click();
     });
   ```

- **Test Data Isolation**: Keep test data used for tests isolated for each test file. Store test data in JavaScript
  files in `cypress/test-data`.

- **Test Data Randomization**: Use random data generation for test data. Do not use the same data for all tests.

- **Provide Empty `context` and `it` Blocks**: To track test coverage, provide descriptions for non-automated checks but
  leave them without implementation.

- **Tagging Strategy**: Test file filtering is based on test file names; therefore, do not apply tags.
