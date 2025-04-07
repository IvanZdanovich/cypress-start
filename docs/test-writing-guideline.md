## Cypress Test Writing Guideline

### Rules:

1. **Naming Conventions**: Follow the Naming Conventions. Pay attention to code examples with `describe`, `context`, and
   `it` block descriptions.

2. **Tagging Strategy**: Avoid usage of tags in the tests. But in any case follow the Tagging Strategy.

3. **Localization Testing**: Organise the central storage for localization values, use values used in app build.

4. **Test Independence**: The current approach aims at creating live documentation. This approach requires defining all
   the use cases that should be covered, even if they are not implemented yet. The use cases should be
   properly structured and ordered within the file and be connected (dependent). The use cases from different files
   should not overlap each other. Test scenarios (files) should be independent of each other. To keep the browser and
   session data, configure the `describe` block with the `testIsolation: false` parameter. Only one `describe` block should per file.

5. **Test Data Isolation**: It is important to keep test data used for tests isolated for each test file.

6. **No Hard Coded Values in Tests**: Avoid hard coded values in tests. All parameters that characterise the app under the test (requirements, localization values, details of implementation, selectors etc.) should be
   stored in the separate files and variables. The test should be written in a way that it is easy to read and understand.

7. **Test Structure**:
   - **IT Block**: Specifies the expected result (use case) and contains only verification steps. To keep
     requirements unique, provide detailed descriptions. Avoid generic descriptions like "Should return 401
     Unauthorized error." Include specific details such as error messages. Ensure a single check per `it` block.
   - **Context Block**: Outlines the conditions and includes condition steps common to `it` blocks and groups them.
   - **Describe Block**: Defines the part of functionality under the test and optimised scenario for use cases.

8. **Do Not Automate Manual Test Cases**: Directly replicating manual test cases in automation is impractical and
   costly, yielding minimal benefits. Instead, focus on identifying and implementing the most valuable specifications.

9. **Do Not Hide Selectors**: Do not use util commands that hide the selector itself, e.g.,
   `cy.getTitleByKey('filter').should('have.text', 'Filter');`. Store selectors in the
   `selectors.js` file grouped by pages and components. Storing selectors in well-named
   variables helps keep the code clean and maintainable. For example:
    ```javascript
    cy.get(cartPage.continueShopping).click();
    ```
   Navigating to the selector by its variable allows you to easily find the selector and copy it for debugging or
   refactoring.

10. **Provide Skipped Empty Context and IT Blocks**: To track test coverage, provide descriptions for non-automated use cases but
    leave them without implementation and mark as skipped.

11. **Test Data Randomization**: Use random data generation for test data. Do not use the same data for all tests.