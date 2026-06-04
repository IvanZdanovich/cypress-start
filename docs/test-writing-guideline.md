# Test writing guideline

Specification by Example: the spec IS the requirement. Test titles form Given/When/Then statements. All specifications
are defined, even if not yet implemented.

## Test types

| Type            | Location                   | Scope                      |
|-----------------|----------------------------|----------------------------|
| Integration API | `cypress/integration/api/` | Module endpoint behavior   |
| Integration UI  | `cypress/integration/ui/`  | Page or component behavior |
| E2E UI          | `cypress/e2e/ui/`          | Complete user workflows    |

## Structure

- **`describe`** — preconditions, initial setup common to all contexts
- **`context`** — conditions and preparation steps for `it` blocks
- **`it`** — single expected result (specification), contains only verification steps

Sequential `context` blocks improve readability over a monolithic `before`.

```javascript
describe('Page.Component: Given user is authenticated', { testIsolation: false }, () => {
  context('Page.Component.ADMIN: When item is created', () => {
    it('Page.Component.ADMIN: Then item name is displayed', { req: {} }, () => {
      cy.get(componentPage.itemName).should('contain', testData.validItems.item__WithAllFields.name);
    });
  });
});
```

Related checks within one parent element are acceptable in a single `it`:

```javascript
it('LoginPage.STANDARD: Then username field is highlighted and contains error icon', { req: {} }, () => {
  cy.get(loginPage.username).should('have.css', 'border-bottom-color', colours.ERROR);
  cy.get(loginPage.username).parent().find(loginPage.errorIcon).should('be.visible');
});
```

## Data approach

| Layer       | Location                                                 | Role                            |
|-------------|----------------------------------------------------------|---------------------------------|
| Constraints | `cypress/constants/{api,ui}/`                            | Boundary values, formats, enums |
| Examples    | `cypress/integration-examples/`, `cypress/e2e-examples/` | Named instances per context     |
| Specs       | `cypress/integration/`, `cypress/e2e/`                   | Executable requirements         |

See [Constraints → Examples → Specs](requirements-examples-approach.md) for full details.

## Rules

- **Naming**: follow [Naming conventions](naming-conventions.md)
- **File independence**: each spec runnable alone from clean or polluted state
- **Cleanup**: `before` and `after` hooks using `deleteByNames` pattern
- **Random data**: use `utils` for all randomised values, no loops over test data
- **Selectors**: global variables grouped by page/component in `cypress/selectors/selectors.js`
- **Localization**: global `l10n` variable, never hardcode UI text
- **Colours**: global `colours` variable, never hardcode colour values
- **Sensitive data**: `cypress/sensitive-data/`, never committed
- **Commands**: leverage existing commands from `cypress/commands/{api,ui}/` before writing inline code
- **Manual placeholders**: `context.skip` or `it.skip` with descriptive titles for unimplemented specs
- **Filtering**: file-name-based, no tags
- **Enforcement**: custom ESLint rules in `eslint-plugin-custom-rules/` — see [ESLint rules](eslint-custom-rules.md)
- **Bug references**: use `req.bugs` metadata, not inline comments — see [Bug tracking](bug-tracking.md)

## Related

- [Requirements examples approach](requirements-examples-approach.md)
- [Naming conventions](naming-conventions.md)
- [ESLint custom rules](eslint-custom-rules.md)
- [Pre-commit check](pre-commit-check.md)
