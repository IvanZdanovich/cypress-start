# FAQ

This page explains the design decisions behind this framework and how each one is applied in the code. Read it when a
convention looks unusual or when you need to justify it in a review.

Questions 1–6 explain which common automation practices this framework avoids and why. Questions 7–17 explain the
conventions it uses instead.

## 1. Why not automate manual test cases?

The goal of test automation is risk reduction, fast feedback, and reliable product verification, not a count of
automated manual cases. Yet many teams still justify automation effort by reporting "N of M manual cases automated". The
automation suite then becomes a parallel copy of manual testing instead of an engineering activity.

This mindset creates several problems:

- **Effort goes into reproducing steps** — engineers re-create manual clicks instead of building meaningful checks.
- **Metrics lose business value** — a case count says nothing about how many requirements are verified, because each
  case covers a different number of them.
- **Suites grow without adding confidence** — the same login and navigation steps run again in every case, so pipelines
  slow down while coverage barely changes.
- **Teams optimize for coverage numbers** — the number of automated cases rises, but defect detection does not.
- **Two sources of truth** — every change must be made in the manual case and in the code, and the two drift apart.

To keep the copies aligned, teams add traceability matrices, extra reporting layers, and synchronization processes.
Each one raises maintenance cost without improving software quality.

This framework automates requirements directly and splits each requirement into three layers:

| Layer       | Location                                                 | Holds                                                   |
|-------------|----------------------------------------------------------|---------------------------------------------------------|
| Constraints | `cypress/constants/{api,ui}/*.constraints.js`            | Boundaries, formats, enums, and domain constants        |
| Examples    | `cypress/integration-examples/`, `cypress/e2e-examples/` | Named test-data instances built from constraints        |
| Specs       | `cypress/integration/`, `cypress/e2e/`                   | Given/When/Then tests, one `it` per requirement outcome |

Each value is defined once and traced from the constraint through the example to the assertion. The spec both documents
the requirement and verifies it, so there is no second copy to synchronize.

## 2. Why not use BDD frameworks?

Automating manual cases creates a synchronization problem across three artifacts:

```text
Requirements → Manual test cases → Automated checks
```

BDD frameworks such as Cucumber with Gherkin promise to solve it: write requirements, test cases, and automation in one
shared language. In practice, BDD often becomes one more abstraction layer between requirements and executable checks:

- Business-readable scenarios still need technical step definitions that someone must write and maintain.
- A change must be synchronized across requirements, `.feature` files, step definitions, and automation code.
- The same behaviour is described again at several levels of documentation.
- Communication overhead grows instead of shrinking, because each layer needs its own review.
- Teams spend effort maintaining the framework itself, such as step matching by text or regex, instead of validating
  the product.

BDD can work in domains where business people really write and review scenarios. Many teams, however, find that they
maintain the same information in several formats for little practical benefit.

The useful part of BDD is the Given/When/Then language. This framework keeps that language in test titles and drops the
mapping layer.

**Cucumber (not used here):**

```gherkin
Feature: Login

  Scenario: User logs in with valid credentials
    Given the user is on the login page
    When the user enters valid credentials
    And clicks the login button
    Then the user should be navigated to the Inventory page
```

```javascript
// login.steps.js
Given('the user is on the login page', () => cy.visit('/'));
When('the user enters valid credentials', () => {
    cy.get('#username').type('standardUser');
    cy.get('#password').type('password');
});
When('clicks the login button', () => cy.get('#login').click());
Then('the user should be navigated to the Inventory page', () => {
    cy.url().should('include', '/inventory');
});
```

**This framework — same Gherkin language, one file:**

```javascript
describe('LoginPage: Given STANDARD user on Login page', {testIsolation: false}, () => {
    context('LoginPage.STANDARD: When user logs in with valid credentials', () => {
        before(() => {
            cy.visit('/');
            cy.loginPage__logIn(standardUser);
        });
        it('LoginPage.STANDARD: Then user is navigated to Inventory page', () => {
            cy.url().should('eq', urls.pages.inventory);
        });
    });
});
```

`describe` holds the Given, each `context` holds one When, and each `it` holds one Then. Compared with BDD:

- The `.feature` file, step definitions, and test code become one spec file.
- Step matching and regex mapping become direct assertions.
- Several files per scenario become one `context` block.
- Reports read as Given/When/Then sentences straight from the titles, so business readers still get readable output.

## 3. Why is Page Object an anti-pattern?

The Page Object Model (POM) was meant to keep UI locators in one place and reduce maintenance. In many projects it grows
into "phantom" classes whose methods only wrap native framework actions:

```javascript
// Native click() call
cy.get(loginPage.login).click();

// POM wrapper
loginPage.clickLoginButton();

// ...which internally still runs
cy.get(this.loginButton).click();
```

As the project grows, this pattern leads to:

- Many boilerplate classes.
- Methods that only delegate basic actions such as click, type, select, or a visibility check.
- Extra jumps between files to understand a simple test flow.
- More maintenance with little or no business value.

Often the only real job such a class does is to hold locator strings. A plain object does that without the class.

**POM (not used here):**

```javascript
// login-page.js
class LoginPage {
    usernameInput = '#username';
    passwordInput = '#password';
    loginButton = '#login';

    navigate() {
        cy.visit('/');
    }

    enterUsername(username) {
        cy.get(this.usernameInput).type(username);
    }

    enterPassword(password) {
        cy.get(this.passwordInput).type(password);
    }

    clickLogin() {
        cy.get(this.loginButton).click();
    }
}

export default new LoginPage();

// login-page.ui.spec.js
import loginPage from './login-page';
import inventoryPage from './inventory-page';

context('LoginPage: When user logs in with valid credentials', () => {
    before(() => {
        loginPage.navigate();
        loginPage.enterUsername('user');
        loginPage.enterPassword('pass');
        loginPage.clickLogin();
    });
    it('LoginPage: Then user is navigated to Inventory page', () => {
        inventoryPage.getTitle().should('contain', 'Products');
    });
});
```

**This framework:**

```javascript
// cypress/selectors/selectors.js — plain objects, exposed as globals in cypress/support/e2e.js
const loginPage = {
    username: '[data-test=username]',
    password: '[data-test=password]',
    login: '[data-test="login-button"]',
};

// cypress/commands/ui/login-page.ui.commands.js — only reused multi-step flows become commands
Cypress.Commands.add('loginPage__logIn', (user) => {
    const {username, password} = user;
    cy.get(loginPage.username).type(username, {delay: 0});
    cy.get(loginPage.password).type(password, {log: false, delay: 0});
    cy.get(loginPage.login).click();
});

// cypress/integration/ui/login-page.ui.spec.js — no imports: selectors, urls, and l10n are globals
context('LoginPage.STANDARD: When user logs in with valid credentials', () => {
    before(() => {
        cy.visit('/');
        cy.loginPage__logIn(standardUser);
    });
    it('LoginPage.STANDARD: Then user is navigated to Inventory page', () => {
        cy.url().should('eq', urls.pages.inventory);
    });
});
```

The framework separates concerns directly:

- Locators are plain data, grouped by the page or component that owns them.
- A reusable command is extracted only when a multi-step operation is really reused.
- Flat composition of selectors, commands, and specs replaces page class hierarchies.
- Every abstraction is treated as a cost, not as an automatic improvement.

| Concern     | POM                              | This framework                                     |
|-------------|----------------------------------|----------------------------------------------------|
| Selectors   | Class fields                     | Global objects in `cypress/selectors/selectors.js` |
| Actions     | A method per click or type       | Inline Cypress calls; commands for reused flows    |
| Navigation  | A `navigate()` method per page   | `cy.visit()` with `urls.pages.*`                   |
| Structure   | Class hierarchy and dependencies | Flat files: selectors, commands, specs             |
| Readability | Flow hidden behind method names  | Flow visible in the spec                           |

The cost is a less familiar style and slightly longer specs. In return, a UI change touches one selector, and anyone can
follow a spec without opening other files. The `find-unused-selectors` lint rule reports selector keys that no spec or
command uses, so the selector file does not grow stale.

## 4. Why avoid framework-driven development?

Many automation projects end up serving the framework instead of testing the product. Instead of asking "What is the
simplest and most reliable way to verify this behaviour?", the team asks "How should this fit into our architecture?"

The result is a growing set of base classes, utility layers, service layers, page objects, component objects, builders,
factories, wrappers, and adapters. Each one looks reasonable alone. Together they form a system that is harder to
understand than the application under test.

A clear symptom: adding one automated check needs more changes in framework code than in test code.

This framework stays thin on purpose:

- There are no base classes, builders, factories, or wrappers. Specs call Cypress directly.
- Shared code is limited to Cypress custom commands, plain selector objects, and plain data modules.
- Adding a check usually means adding one `it` block. At most it also needs a selector key, an `l10n` key, or an
  example field.
- New structure is added only when a real testing problem needs it, such as `l10n` for multi-language checks or the
  coverage report for gap tracking.

Automation should be optimized for clarity and maintainability, not for architectural elegance.

## 5. Why accept some duplication instead of strict DRY?

DRY ("don't repeat yourself") is one of the most misunderstood principles in test automation. Teams remove every
duplication they see by extracting generic helpers. Duplication goes down, but complexity goes up.

A test that reads:

```text
Log in
Create user
Assign role
Verify access
```

becomes:

```javascript
executeWorkflow('userManagement');
```

The visible duplication is gone, and so is the readability. The helper also needs flags and branches to serve every
caller. When dozens of tests depend on one shared helper, any change to it risks all of them.

Tests are read far more often than they are written. A small, controlled amount of duplication is often cheaper than
another abstraction layer. In this framework:

- Single `.click()`, `.type()`, and simple assertions stay inline in the spec.
- Reused multi-step flows become commands, such as `loginPage__logIn` or `checkoutPage__fillDeliveryInfo`. Each command
  does one named operation, without flags.
- Shared values live in constraints and examples. This is the duplication worth removing, because a copied value
  silently drifts.

## 6. Why not apply product-code design patterns to test code?

Test automation is software, but it is not product software, and it has different goals.

| Product code is optimized for | Automation code is optimized for |
|-------------------------------|----------------------------------|
| Reusability                   | Fast feedback                    |
| Extensibility                 | Readability                      |
| Long-term feature growth      | Reliability                      |
|                               | Ease of maintenance              |

Applying every design pattern from product code leads to over-engineered frameworks that are hard to change and
expensive to maintain. A test that a new team member cannot read in one pass costs more than it saves.

The best automation is usually the simplest one that gives trustworthy feedback and stays easy for the whole team to
understand. Engineering discipline still applies where it pays off: linting, naming rules, a single source for each
value, and code review.

## 7. Why atomic tests, and why keep setup apart from checks?

Each `it` verifies one outcome. Setup and the action under test run in `before` hooks, never inside `it`. This gives:

- **Precise failures** — one failing `it` points to one broken requirement.
- **Accurate metrics** — each `it` is one counted test in the coverage report.
- **Isolated changes** — changing one assertion does not hide or break the others.
- **Readable reports** — the title says what failed, so nobody needs to read the code or add logging.

**One generic test (avoid):**

```javascript
it('Should display correct cart page', () => {
    cy.get(headerComp.openCart).click();
    cy.url().should('eq', urls.pages.cart);
    cy.get(cartPage.title).should('have.text', l10n['cartPage.title']);
    cy.get(cartPage.items).should('not.exist');
    cy.get(cartPage.checkout).should('have.text', l10n['cartPage.checkout']).and('be.enabled');
    cy.get(footerComp.linkedin).should('have.attr', 'href', urls.external.linkedin);
});
```

The first failed assertion stops the test. Later checks never run, and the report shows one vague failure.

**Atomic tests (this framework):**

```javascript
context('CartPage.STANDARD: When user visits the page', () => {
    before(() => {
        cy.get(headerComp.openCart).click();
    });
    it('CartPage.STANDARD: Then Cart page URL should be displayed', () => {
        cy.url().should('eq', urls.pages.cart);
    });
    it('CartPage.STANDARD: Then Cart page title should be displayed', () => {
        cy.get(cartPage.title).should('have.text', l10n['cartPage.title']);
    });
    it('CartPage.STANDARD: Then no items should be displayed', () => {
        cy.get(cartPage.items).should('not.exist');
    });
    it('CartPage.STANDARD: Then Checkout button is displayed', () => {
        cy.get(cartPage.checkout).should('have.text', l10n['cartPage.checkout']).and('be.visible').and('be.enabled');
    });
    it('CartPage.Footer.STANDARD: Then LinkedIn icon with link should be displayed', () => {
        cy.get(footerComp.linkedin).should('have.attr', 'href', urls.external.linkedin).and('be.visible');
    });
});
```

The action runs once in `before`. `{ testIsolation: false }` on the parent `describe` keeps the page, session, and
created data between blocks, so every `it` checks the same state without repeating navigation. Setup in hooks also
keeps preconditions out of the outcomes: a failing `it` means the outcome is wrong, while a failing hook means the setup
is broken.

## 8. Why one page or component per spec file?

All tests in one file share browser state. Limiting a file to one page or component gives:

- A clear state boundary, so another page's flow cannot leave state behind.
- Failures that trace to one area of the application.
- Changes to one page that do not break specs for unrelated pages.
- Files that run in parallel without conflicts in `npm run test:parallel`.
- Coverage that maps to the application structure.

**Several pages in one test (avoid):**

```javascript
it('Then order confirmation is displayed', () => {
    cy.visit(urls.pages.cart);
    cy.get(cartPage.checkout).click();
    cy.get(checkoutPage.firstName).type('John');
    cy.get(checkoutPage.lastName).type('Doe');
    cy.get(checkoutPage.continue).click();
    cy.get(checkoutPage.title).should('be.visible');
});
```

**One page per file (this framework):**

```javascript
// cypress/integration/ui/checkout-page.ui.spec.js (example layout; this spec is not in the repo yet)
context('CheckoutPage.STANDARD: When user submits valid delivery info', () => {
    before(() => {
        cy.checkoutPage__fillDeliveryInfo(examples.deliveryInfo);
        cy.get(checkoutPage.continue).click();
    });
    it('CheckoutPage.STANDARD: Then Checkout Overview page title is displayed', () => {
        cy.get(checkoutPage.title).should('have.text', l10n['checkoutOverviewPage.title']);
    });
});
```

A journey that must cross pages is an end-to-end flow. It belongs in `cypress/e2e/ui/`, named after the business flow,
for example `purchasing.complete-purchase.ui.spec.js`, with titles prefixed by the flow name such as
`CompletePurchase.STANDARD: When …`.

## 9. Why are naming conventions crucial?

Fixed names let tools check structure instead of people, and let anyone find a file or command by pattern.

| Item                 | Pattern                                                                            |
|----------------------|------------------------------------------------------------------------------------|
| UI `describe` title  | `Page.Component: Given preconditions`                                              |
| UI `context` title   | `Page.Component.USER_ROLE: When action`                                            |
| UI `it` title        | `Page.Component.USER_ROLE: Then expected result`                                   |
| API titles           | `Module.Submodule: Given …`, then `Module.Submodule.Operation.METHOD: When/Then …` |
| E2E titles           | `Flow.SubFlow: Given …`, then `Flow.SubFlow.USER_ROLE: When/Then …`                |
| Integration UI spec  | `cypress/integration/ui/<page-name>.ui.spec.js`                                    |
| Integration API spec | `cypress/integration/api/<domain>[.<scenario>].api.spec.js`                        |
| E2E spec             | `cypress/e2e/ui/<workflow-name>.ui.spec.js`                                        |
| UI command           | `page__action`, for example `loginPage__logIn`                                     |
| API command          | `resource__action__METHOD`, for example `restfullBooker__getAuthToken__POST`       |

Custom ESLint rules enforce these patterns on every `npm run lint` and pre-commit check:

- `verify-test-title-pattern` checks the Given/When/Then forms.
- `verify-test-title-against-structure` checks that each dotted prefix, such as `CartPage.Footer`, is registered in
  `eslint-plugin-custom-rules/app-structure/`. The same registry defines the expected coverage paths.
- `prevent-duplicated-titles` and `verify-test-title-without-forbidden-symbols` keep titles unique and clean.
- `verify-spec-file-paths`, `verify-ui-command-naming`, and `verify-api-command-naming` check file and command names.

## 10. Why keep values in constraints, examples, `l10n`, and `colours`?

Each value has one source, so a change is made once and applies everywhere. A literal in a spec drifts from its source
and hides which rule it checks.

| Value                       | Source                                                              |
|-----------------------------|---------------------------------------------------------------------|
| Boundaries and domain rules | `cypress/constants/{api,ui}/*.constraints.js`                       |
| Test data instances         | `cypress/integration-examples/`, `cypress/e2e-examples/`            |
| UI text                     | `l10n['page.key']`, loaded for the `LANGUAGE` of the run            |
| Theme colours               | `colours['key']`, loaded for the `COLOUR_THEME` of the run          |
| Selectors and URLs          | `cypress/selectors/selectors.js`, `urls.pages.*`, `urls.external.*` |

`l10n` and `colours` are flat key maps. `npm test` activates the locale and theme files before the run, so the same spec
verifies any language or theme without changes.

Titles state what a value means; assertions use the constant:

```javascript
import {PRICE} from '../../constants/api/rb.booking.api.constraints';

context('RestfulBooker.Booking.Create.POST: When booking with minimal price is provided', () => {
    it('RestfulBooker.Booking.Create.POST: Then created booking has minimal price', () => {
        expect(response.body.booking.totalprice).to.eq(PRICE.MIN);
    });
});
```

## 11. Why pick one random value instead of looping over test data?

A loop over every valid or invalid value multiplies run time and packs many requirements into one test, so the first
failing value hides the rest. Examples files pick one value per run with the `utils` helpers. Over many CI runs, the
suite still covers the whole range.

```javascript
// cypress/integration-examples/ui/cart-page.ui.examples.js
const _indicesOfProducts = utils.generateArrayOfRandomIndices(utils.getRandomNumber(1, PRODUCT_COUNT.total), PRODUCT_COUNT.total - 1);

export const cartPage__examples = {
    indicesOfProducts: _indicesOfProducts,
    randomIndex: utils.getRandomNumber(0, _indicesOfProducts.length),
};
```

Values that must be checked on every run, such as `PRICE.MIN` and `PRICE.MAX`, get their own `context`. The
`prevent-examples-loops` lint rule reports `forEach`, `for...of`, and `for...in` loops over test data inside `describe`,
`context`, and `it` blocks.

## 12. Why import data directly instead of using fixtures?

Static data, such as constraints and examples, is imported as a JavaScript module. Imports support autocompletion,
computed and random values, and references between instances, and they are easy to change while you write a test.

Use `cy.fixture` only for data that depends on the run. In this framework, that is user credentials for the current
environment: `common__getUserDataByRole` loads `cypress/sensitive-data/<envName>-users.json` and caches each role.
Credential files stay out of the code, and `env-users.example.json` shows their shape.

## 13. Why are tags discouraged?

Tags such as `@smoke` and `@regression` have no owner and mean different things to different teams, so filtering by them
is unreliable. File names and folders already filter specs:

- File suffix: `*.api.spec.js`, `*.ui.spec.js`.
- Folder: `cypress/integration/api/`, `cypress/integration/ui/`, `cypress/e2e/ui/`.
- The `SPEC_PATTERN` environment variable scopes a run, for example
  `SPEC_PATTERN="cypress/integration/api/**/*.spec.js" npm run test:parallel`.

Add `@cypress/grep` only if a filter cannot be built this way.

## 14. Why does execution speed matter?

- Developers get CI feedback sooner and fix issues while the change is fresh.
- The full suite can run on every change, not only nightly.
- Shorter runs cost less infrastructure.

Speed comes from:

- Setup once per `describe` or `context` in `before` hooks, with `{ testIsolation: false }`.
- Logins and API tokens cached across specs with `cy.session`.
- Preconditions created through API commands rather than the UI, wherever the application has an API.
- One random value instead of loops over test data.
- No BDD mapping layer.
- Parallel runs: `npm run test:parallel` runs spec files in streams, set by `PARALLEL_STREAMS` (default 3).

## 15. Why avoid test management tools?

Test management tools are the reporting layer that question 1 warns about. They split documentation across systems,
require mapping between manual cases and automated tests, report case counts instead of verified requirements, and add
integration work to CI. Every requirement change must be edited in the tool and in the code, and the copies drift.

Here, specs under version control are the single source of truth. Titles document the requirements, and the repo
generates the metrics from the specs and run results:

- `npm run report:coverage` — path coverage against the registered application structure, active vs. skipped tests,
  and missing paths.
- `npm run report:flaky` — tests that fail intermittently across CI runs recorded on the `test-results` branch.
- `npm run report:signoff` — an HTML checklist of every requirement with its result, priority, references, and bugs,
  for release sign-off and manual checks.

## 16. Why describe and skip non-implemented tests?

A skipped `it` with a full title records a requirement before it is automated. Everyone can see what is automated, what
needs a manual check, and what is still pending.

```javascript
context('CartPage.STANDARD: When user visits the page', () => {
    it('CartPage.STANDARD: Then Cart page URL should be displayed', () => {
        cy.url().should('eq', urls.pages.cart);
    });
    it.skip('CartPage.Footer.STANDARD: Then Terms Of Service link should be displayed', {req: {bugs: ['BUG-FOOTER-002']}}, () => {
    });
    it.skip('CartPage.STANDARD: Then cart items are restored after reload', () => {
    });
});
```

- Cypress reports skipped tests as pending, so every run shows the full scope.
- The coverage report counts a test as not implemented when it is skipped, sits in a skipped parent, or has an empty
  body, and lists paths that have only skipped tests.
- A `req.bugs` entry explains why a test is skipped. The ID, such as `BUG-FOOTER-002`, refers to an entry in
  `bug-log/bug-log.json` or task tracking tool.

## 17. Why put priority, links, and bugs in `req` instead of comments?

Tools can read a `req` object; they cannot read comments. A `// P1` or `// JIRA-123` comment is invisible to the reports
and drifts from the block it describes.

The optional config is `{ req: { p, preconditions, refs, bugs, note } }`:

| Field           | Value                                                   |
|-----------------|---------------------------------------------------------|
| `p`             | `'P1'` or `'P3'`; omit for `'P2'`, the default          |
| `preconditions` | Non-empty array of strings describing required state    |
| `refs`          | Non-empty array of HTTP or HTTPS links, such as tickets |
| `bugs`          | Non-empty array of `BUG-<CONTEXT>-NNN` IDs or bug URLs  |
| `note`          | Short text that adds meaning the title does not carry   |

Put `req` on the smallest block it is true for: `it` for one outcome, `context` for one action, `describe` for the whole
file. Omit empty fields. The `verify-req-config` lint rule rejects unknown fields and empty values, and the sign-off
report reads the fields to show priority, links, and bugs per requirement.

## Conclusion: stop adding layers

Many popular automation practices began as fixes for problems that earlier abstractions created. The typical chain:

```text
Manual test cases
        ↓  need traceability
BDD frameworks
        ↓  need technical organization
Page Object Model
        ↓  need framework consistency
More abstractions
        ↓
Higher maintenance cost
```

Instead of adding another layer, step back regularly and ask: are we solving a real testing problem, or a problem
introduced by a previous abstraction?

The most effective automation frameworks are often not the most sophisticated ones. They stay closest to the
requirements, need the least maintenance, and give clear, reliable feedback about product quality. This framework is
built on that principle: requirements become constraints, examples, and Given/When/Then specs, with nothing in between.
