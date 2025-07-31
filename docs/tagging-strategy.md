# Tagging Strategy

## Warning

Tags in tests are used to filter and compose specific test suites. Generic tags like \@smoke, \@regression, \@api, \@ui,
or module-specific tags can cause confusion, as their application may not be clear. Ideally, avoid using tags
altogether. Instead, define and use naming conventions to structure specifications in test files. Specify the module,
submodule, and type of test in the names. Use folder structures to separate different types of tests.

## Tags in the Framework

Using tags in the actual framework to decrease the scope for duration reduction offers no benefits, so there is no
implementation provided. However, if you find it useful, you can implement your own tagging strategy in the framework
using an additional dependency like \@cypress/grep.

Tags could be applied to the tests as identifiers of related non-functional requirements, e.g., usability, performance,
but it is out of the scope of the framework.

## P.S.

Here is an example of using tags. You can mark negative test cases that check negative scenarios, such as errors. This
approach is clear and helps reduce test run duration.

- **Tag:** \@negative
  - **Description:** Tests that validate behavior with invalid inputs or unexpected conditions.
  - **Usage:** Ensure error handling is properly tested.
  - **Warning:** Be cautious when using tags in large linked scenarios with multiple steps, as it could break the
    logic of long scenarios. To avoid confusion during test runs, you can either place negative cases at the end of
    the script or make all actions from before and after code blocks mandatory for all cases to keep the flow
    constant. However, this will decrease the benefit of using tags.
