# Test Writing Guideline

## Rules:

1. **Naming Conventions**: Follow the established naming conventions.

2. **Test Independence**:
   - Define all use cases to be covered, even if not yet implemented, to create live documentation.
   - Structure use cases properly within files and ensure they are connected (dependent). Use cases from different files should not overlap.
   - Test scenarios (files) should be independent of each other.
   - To keep browser and session data, configure the `describe` block with `{ testIsolation: false }`.
   - Include only one `describe` block per file.

3. **Do Not Automate Manual Test Cases**: Avoid directly replicating manual test cases. Focus on identifying and implementing the most valuable specifications.

4. **Test Structure**:
   - **`it` Block**: Specifies the expected result and contains only verification steps. Use detailed descriptions to make requirements unique. Avoid generic descriptions like "Should return 401 Unauthorized error." Instead, include specific details like error messages. Use a single check per `it` block.
   - **`context` Block**: Outlines conditions and includes steps common to `it` blocks, grouping them logically.
   - **`describe` Block**: Defines the functionality under test and optimized scenarios for use cases.

5. **Provide Skipped Empty Context and `it` Blocks**: Track test coverage by providing descriptions for non-automated use cases, marking them as skipped:
    ```javascript
    it.skip('Should display an error when submitting invalid data', () => {
      // Not implemented yet
    });
    ```

6. **No Hard-Coded Values in Tests**: Store all parameters that characterize the app (requirements, localization values, implementation details, selectors, etc.) in separate files and variables. Write tests that are easy to read and understand.

7. **Do Not Hide Selectors**: Store selectors in the `selectors.js` file, grouped by pages and components. For example:
    ```javascript
    cy.get(cartPage.continueShopping).click();
    ```
   This makes it easy to find and update selectors when needed.

8. **Use Gherkin Keywords**: Use Gherkin keywords to describe test scenarios and steps. This helps in understanding the test flow and makes it easier to communicate with non-technical stakeholders.

9. **Test Data Isolation**: Keep test data isolated for each test file.

10. **Test Data Management**: Store test data in dedicated files under the `cypress/test-data/` directory, organized by feature or flow.

11. **Test Data Randomization**: Generate random test data rather than using the same data across tests.

12. **External Resource Handling**: When testing links to external resources:
   - Remove the `target` attribute to keep navigation in the same window.
   - Handle uncaught exceptions appropriately.
   - Return to the application using `cy.go('back')`.

    Example:
    ```javascript
    cy.get(selector).invoke('removeAttr', 'target');
    cy.on('uncaught:exception', () => false); // Prevent test failure
    ```

13. **Track Issues**: Document issues in the GitHub issue tracker and mark affected code with comments:
    ```javascript
    // TODO: link to the issue description
    ```

14. **Custom Commands**: Create reusable custom commands for common operations.
