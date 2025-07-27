# Refactoring of Tests

## Structuring Tests to Align with Guidelines

### Prompt
```Markdown
# Review the test file against these guidelines:
## Structure Requirements
- One describe block per file
- No test isolation within files (`testIsolation: false` at describe level)
- Test files must be independent
- Describe block: common setup steps
- Context block: conditions and state-specific setup
- It block: only state verifications
- Use 'cy.then()' to order commands and actions dependent on previous commands e.g. `cy.click()`

## Data Management
- Use `{pageName}.test-data.js` files for test data
- Prefer random data generation over static values
- Store localization in `l10n.json`
- Store theme colors in `current-theme-colours.json`
- Keep selectors in `selectors.js`, organized by page

## Documentation
- Mark unimplemented tests with `TODO` comments
- Include bug references from `bug-log.json` where applicable

# Review the test file
1. List of guideline violations
2. Code inconsistencies
3. Structural issues
4. Suggested fixes with code examples

# Provide final solution
```
