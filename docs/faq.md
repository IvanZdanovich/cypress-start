# FAQ

## 1. Why not automate manual test cases?

Manual tests are designed for human execution — ambiguous, duplicated steps, lacking structure for reliable automation.
Automating them leads to superficial coverage, high maintenance, and slow CI/CD. Two parallel sources of truth require
constant synchronization with no added benefit.

Instead: validate requirements directly. Result: stable, precise, maintainable tests reflecting intended behavior.

## 2. Why is Page Object an anti-pattern?

POM wraps simple framework operations in class methods — duplicating functionality, adding layers, increasing cognitive
load.

- **Selectors** — POM puts them in class fields; here, global page objects.
- **Actions** — POM wraps `.click()` in class methods; here, Cypress custom commands.
- **Navigation** — POM uses a method per page; here, `cy.visit(urls.page)`.
- **Complexity** — POM builds an OOP hierarchy; here, a flat file structure.

Recommended: selectors in `cypress/selectors/selectors.js`, reusable flows in `cypress/commands/{api,ui}/`, tests import
directly.

```javascript
// selectors.js — global page objects
export const loginPage = {
  usernameInput: '#username',
  passwordInput: '#password',
  loginButton: '#login',
};

// login-page.ui.commands.js — multi-step reusable flow
Cypress.Commands.add('loginPage__logIn', (user) => {
  cy.get(loginPage.usernameInput).type(user.username, { delay: 0 });
  cy.get(loginPage.passwordInput).type(user.password, { log: false, delay: 0 });
  cy.get(loginPage.loginButton).click();
});

// spec — direct, transparent
context('LoginPage.STANDARD: When user logs in with valid credentials', () => {
  before(() => {
    cy.loginPage__logIn(standardUser);
  });
  it('LoginPage.STANDARD: Then user is navigated to Inventory page', { req: {} }, () => {
    cy.url().should('eq', urls.pages.inventory);
  });
});
```

## 3. Why not use BDD frameworks?

BDD frameworks (Cucumber, Gherkin) add step-mapping abstraction without real collaboration benefit. The same
Given/When/Then language is used directly in test titles — no extra layer needed.

Where BDD adds a layer, this project collapses it:

- `.feature` + step definitions + test code → a single spec file.
- Step matching, regex, and mapping overhead → direct assertions.
- Multiple files per scenario → one `context` block.
- Slow execution and poor debugging → native Cypress speed.

## 4. Why atomic (small, focused) tests?

- **Precise failure identification** — one assertion = one failure reason.
- **Accurate metrics** — each `it` = one requirement = one coverage point.
- **Easy maintenance** — changing one assertion doesn't break others.
- **Manual coverage mapping** — pending `it.skip` blocks show unimplemented scope.

```javascript
// Each check is a separate requirement
context('CartPage.STANDARD: When user visits the page', () => {
  before(() => {
    cy.get(headerComp.openCart).click();
  });
  it('CartPage.STANDARD: Then Cart page URL is displayed', { req: {} }, () => {
    cy.url().should('eq', urls.pages.cart);
  });
  it('CartPage.STANDARD: Then Cart page title is displayed', { req: {} }, () => {
    cy.get(cartPage.title).should('have.text', l10n['cartPage.title']);
  });
  it('CartPage.STANDARD: Then no items are displayed', { req: {} }, () => {
    cy.get(cartPage.items).should('not.exist');
  });
});
```

## 6. Why are naming conventions crucial?

- Enable ESLint automation of structural validation
- Map test titles to app structure for coverage tracking
- Streamline onboarding — predictable patterns
- Generate meaningful reports from test titles alone

The naming rules live in the spec-writing skills ([API](../.claude/skills/write-integration-api-specs/SKILL.md), [integration UI](../.claude/skills/write-integration-ui-specs/SKILL.md), [E2E UI](../.claude/skills/write-e2e-ui-specs/SKILL.md)) and the [eslint-custom-rules skill](../.claude/skills/eslint-custom-rules/SKILL.md), which enforces them.

## 7. Why store constants in variables?

Single source of truth: change once, applied everywhere. Constraint files hold boundary values; examples reference them.
Specs interpolate constraint values in titles for traceability.

```javascript
// constraints
export const PRICE = { MIN: 1, MAX: 10000 };

// spec title uses constraint
context(`Module.Create.POST: When booking with price of ${PRICE.MIN} is provided`, () => {});
```

## 9. Why are tags discouraged?

File-name patterns and folder structure provide the same filtering with zero ambiguity. Tags (`@smoke`, `@regression`)
lack clear ownership and consistent definitions across teams.

Filtering relies on file-name patterns (`*.api.spec.js`, `*.ui.spec.js`), folder structure
(`cypress/integration/api/`, `cypress/integration/ui/`, `cypress/e2e/ui/`), and the `SPEC_PATTERN` env var for parallel
scoping. Add `@cypress/grep` only if custom filtering is genuinely needed.

## 10. Why is test execution speed important?

- Fast CI/CD feedback loops
- More frequent full-suite runs
- Lower infrastructure costs
- Developer productivity (no long waits)

Achieved by: no loops over test data, randomized single-value instances, no BDD overhead, parallel execution.

## 11. Why one page/component per test file?

- Shared `context` within a file = shared state boundary
- Failures trace directly to specific functionality
- Updates to one area don't affect unrelated tests
- Enables parallel execution without conflicts
- Coverage maps naturally to application architecture

## 12. Why avoid test management tools?

They fragment documentation across systems, create artificial mapping, generate misleading count-based metrics, and add
integration complexity. Instead: specs under version control as single source of truth, with clear structure providing
natural documentation and metrics.

See [Approach comparison](comparison-spec-vs-rm-tool.md).

## 13. Why describe and skip non-implemented tests?

```javascript
it.skip('CartPage.STANDARD: Then error message is displayed for unauthorized user', () => {});
```

Benefits:

- Transparent automation coverage metrics
- Manual testers see what needs manual checking
- Planning visibility — pending scope is explicit
- `npm run report:coverage` counts skipped as unimplemented

## Related

- [Constraints → Examples → Specs](constraints-examples-specs-approach.md)
- [Approach comparison](comparison-spec-vs-rm-tool.md)
- [Requirements examples approach](constraints-examples-specs-approach.md)
