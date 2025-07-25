# FAQ

## 1. Why is automating manual test cases ineffective?

Automating manual test cases is not recommended because manual tests are designed for human execution, often containing
ambiguous steps and lacking the structure needed for reliable automation. Attempting to automate them leads to unclear
logic, superficial coverage, and high maintenance costs. Keeping automated tests aligned with manual cases requires
constant updates in both places, increasing the risk of inconsistencies and wasted effort. Metrics based on the number
of automated manual cases are misleading, and integrating these tests with management tools adds unnecessary complexity.
Instead, automation should focus on directly validating requirements, resulting in more stable, precise, and
maintainable tests that truly reflect the application's intended behavior.

## 2. Why should you automate specifications, not test cases?

Specifications provide a clear, detailed, and up-to-date description of system behavior, serving as the single source of
truth. Automating specifications ensures that tests are accurate, maintainable, and traceable to requirements. Test
cases, on the other hand, are often written without formalized specifications, leading to gaps, redundancy, and
imprecise coverage. By automating specifications, you ensure that your tests directly validate what the system is
supposed to do, making it easier to assess coverage and adapt to changes.

## 3. Why is using Page Object considered an anti-pattern?

The Page Object Model (POM) is tightly coupled with object-oriented programming (OOP): each page becomes a class, each
element a field, and every action a method wrapping a simple operation. At first glance, this seems elegant:

**Test using POM (anti-pattern):**

```javascript
// loginPage.js
class LoginPage {
    usernameInput = '#username';
    passwordInput = '#password';
    loginButton = '#login';

    navigate() {
        cy.visit('/login');
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

// dashboardPage.js
class DashboardPage {
    title = 'h1';

    getTitle() {
        return cy.get(this.title);
    }
}

export default new DashboardPage();

// login-page.ui.spec.js
import loginPage from './loginPage';
import dashboardPage from './dashboardPage';

context('LoginPage: When user logins with valid credentials', () => {
    before(() => {
        loginPage.navigate();
        loginPage.enterUsername('user');
        loginPage.enterPassword('pass');
        loginPage.clickLogin();
    });

    it('LoginPage: Then user should be navigated to the Dashboard', () => {
        dashboardPage.getTitle().should('contain', 'Dashboard');
    });
});
```

**Cons:**

- Extra classes and methods for trivial actions
- More files to maintain

**Recommended approach (centralized selectors):**

```javascript
// selectors.js
export const loginPage = {
    usernameInput: '#username',
    passwordInput: '#password',
    loginButton: '#login'
};
export const dashboardPage = {
    title: 'h1'
};

// urls.js
export const urls = {
    login: '/login',
};

// login-page.ui.commands.js
Cypress.Commands.add('loginPage_Login', (user) => {
    const {username, password} = user;
    cy.get(loginPage.username).type(username, {delay: 0});
    cy.get(loginPage.password).type(password, {log: false, delay: 0});
    cy.then(() => {
        cy.get(loginPage.login).click();
    });
});

// login-page.ui.spec.js
import {loginPage} from './selectors';
import {dashboardPage} from './selectors';
import {urls} from './urls';

context('LoginPage: When user logins with valid credentials', () => {
    before(() => {
        cy.visit(urls.login);
        cy.then(() => {
            cy.loginPage_Login('user', 'pass');
        });
    });

    it('LoginPage: Then user should be navigated to the Dashboard', () => {
        cy.get(dashboardPage.title).should('contain', 'Dashboard');
    });
});
```

**Pros:**

- No unnecessary abstraction layers
- Only files with selectors and tests, no extra classes
- Tests are clear and focused
- Only needed commands are defined, no extra methods for trivial actions

Why not just use selectors directly? Selectors are just strings. Hiding them in classes adds unnecessary complexity.
Modern frameworks allow centralized selector storage (e.g., a `selectors.js` file), making updates simple and tests
transparent. In summary, POM creates a complex, self-serving system that distracts from writing clear, maintainable
tests. It is an anti-pattern because it prioritizes OOP structure over test clarity and maintainability.

## 4. Why is using BDD frameworks counterproductive?

BDD frameworks introduce an extra layer of abstraction, which can make tests harder to maintain and slower to execute.
They are primarily aimed at automating manual test cases—a flawed approach that leads to unclear logic, superficial
coverage, and high maintenance costs (see above for details). While BDD frameworks intend to improve collaboration by
using human-readable language (like Gherkin), in practice, this rarely delivers real benefits. The added complexity of
step definitions and mapping to code often outweighs any advantages. Importantly, you can use BDD keywords and natural
human language directly in your test descriptions and structure—without BDD frameworks or extra abstractions. This keeps
tests readable and maintainable, while avoiding unnecessary indirection. Writing tests with clear structure, descriptive
names, and straightforward logic is more effective for both communication and maintenance.

**1. Recommended approach: No BDD framework, just clear structure and naming**

This example uses Cypress with descriptive `context` and `it` blocks, following Gherkin-style language. No extra
abstraction or step mapping is needed.

```javascript
context('LoginPage.STANDARD: When user logins with valid credentials', () => {
    before(() => {
        cy.loginPage_FillLoginForm(standardUser);
        cy.then(() => {
            cy.get(loginPage.login).click();
        });
    });
    it('LoginPage.STANDARD: Then user should be navigated to the Inventory page', () => {
        cy.url().should('eq', urls.pages.inventory);
        cy.get(inventoryPage.title).should('have.text', l10n.inventoryPage.title).and('be.visible');
    });
});
```

- **Pros:**
    - No extra files or step mapping
    - Test names are self-documenting and readable
    - No need for external reporting tools—test output is clear

---

**2. BDD framework approach: Gherkin feature file and step definitions**

This example uses a BDD framework (like Cucumber) with a `.feature` file and step definitions in code.

*login.feature*:

```gherkin
Feature: Login

  Scenario: User logs in with valid credentials
    Given the user is on the login page
    When the user enters valid credentials
    And clicks the login button
    Then the user should be navigated to the Inventory page
```

*login.steps.js*:

```javascript
const {Given, When, Then} = require('@cucumber/cucumber');

Given('the user is on the login page', () => {
    cy.visit('/');
});

When('the user enters valid credentials', () => {
    cy.get('#username').type('standardUser');
    cy.get('#password').type('password');
});

When('clicks the login button', () => {
    cy.get('#login').click();
});

Then('the user should be navigated to the Inventory page', () => {
    cy.url().should('eq', '/inventory');
    cy.get('h1').should('have.text', 'Inventory').and('be.visible');
});
```

**Cons:**

- Requires maintaining both feature files and step definitions
- Adds an extra abstraction layer
- Slower feedback and more boilerplate

**Summary:**  
You can achieve clear, human-readable tests using Gherkin-style language and naming conventions directly in your code,
without the complexity of BDD frameworks or step mapping. This keeps tests simple, maintainable, and easy to understand.

## 5. Why should tests be tied to one page or component?

Tests that focus on a single page or component are easier to maintain, debug, and update. This isolation allows you to
quickly identify where issues occur and minimizes the impact of changes in one area on unrelated tests. It also helps
keep the test suite organized and scalable as the application grows.

## 6. Why should tests be atomic? Why is it important to keep tests small and focused?

Atomic tests verify only one specific thing, making them faster, more reliable, and easier to maintain. They provide
precise feedback when failures occur, simplifying debugging and improving the accuracy of test metrics. Small, focused
tests are also easier to update and less likely to break when unrelated parts of the application change.

Here are two examples to illustrate the importance of small, focused tests:

**1. Bad Example: One generic test with many hidden steps**

This test has a vague title and multiple checks inside, making it hard to maintain and debug:

```javascript
it('CartPage: Should display correct cart page', () => {
    cy.url().should('eq', urls.pages.cart);
    cy.get(cartPage.title).should('have.text', l10n.cartPage.title);
    cy.get(cartPage.items).should('not.exist');
    cy.get(cartPage.continueShopping).should('have.text', l10n.cartPage.continueShopping).and('be.visible').and('be.enabled');
    cy.get(cartPage.checkout).should('have.text', l10n.cartPage.checkout).and('be.visible').and('be.enabled');
    cy.get(cartPage.quantityLabel).should('have.text', l10n.cartPage.quantity).and('be.visible');
    cy.get(cartPage.descriptionLabel).should('have.text', l10n.cartPage.description).and('be.visible');
    cy.get(footerComp.linkedin).should('have.attr', 'href', urls.external.linkedin).and('have.attr', 'target', '_blank').and('be.visible');
    cy.get(footerComp.twitter).should('have.attr', 'href', 'https://twitter.com/saucelabs').and('have.attr', 'target', '_blank').and('be.visible');
    cy.get(footerComp.facebook).should('have.attr', 'href', urls.external.facebook).and('have.attr', 'target', '_blank').and('be.visible');
    cy.get(footerComp.copyRight).should('have.text', l10n.footer.copyRight.replace('yearPlaceholder', new Date().getUTCFullYear())).and('be.visible');
});
```

**2. Good Example: Small, focused, atomic tests with descriptive titles**

Each test checks a single thing, and the title clearly describes what is being verified:

```javascript
it('CartPage.STANDARD: Then Cart page URL should be displayed', () => {
    cy.url().should('eq', urls.pages.cart);
});
it('CartPage.STANDARD: Then Cart page title should be displayed', () => {
    cy.get(cartPage.title).should('have.text', l10n.cartPage.title);
});
it('CartPage.STANDARD: Then no items should be displayed', () => {
    cy.get(cartPage.items).should('not.exist');
});
it('CartPage.STANDARD: Then Continue Shopping button is displayed', () => {
    cy.get(cartPage.continueShopping).should('have.text', l10n.cartPage.continueShopping).and('be.visible').and('be.enabled');
});
it('CartPage.STANDARD: Then Checkout button is displayed', () => {
    cy.get(cartPage.checkout).should('have.text', l10n.cartPage.checkout).and('be.visible').and('be.enabled');
});
it('CartPage.STANDARD: Then Quantity table header should be displayed', () => {
    cy.get(cartPage.quantityLabel).should('have.text', l10n.cartPage.quantity).and('be.visible');
});
it('CartPage.STANDARD: Then Description table header should be displayed', () => {
    cy.get(cartPage.descriptionLabel).should('have.text', l10n.cartPage.description).and('be.visible');
});
it('CartPage.Footer.STANDARD: Then LinkedIn icon with link should be displayed', () => {
    cy.get(footerComp.linkedin).should('have.attr', 'href', urls.external.linkedin).and('have.attr', 'target', '_blank').and('be.visible');
});
it('CartPage.Footer.STANDARD: Then Twitter icon with link should be displayed', () => {
    cy.get(footerComp.twitter).should('have.attr', 'href', 'https://twitter.com/saucelabs').and('have.attr', 'target', '_blank').and('be.visible');
});
it('CartPage.Footer.STANDARD: Then Facebook icon with link should be displayed', () => {
    cy.get(footerComp.facebook).should('have.attr', 'href', urls.external.facebook).and('have.attr', 'target', '_blank').and('be.visible');
});
it('CartPage.Footer.STANDARD: Then the Copyright notice with actual year should be displayed', () => {
    cy.get(footerComp.copyRight).should('have.text', l10n.footer.copyRight.replace('yearPlaceholder', new Date().getUTCFullYear())).and('be.visible');
});
```

**Summary:**  
Concise, focused tests make it straightforward to trace failures, maintain the suite, and ensure every requirement is
covered. Descriptive test names and structure act as built-in documentation, removing the need for extra logging or
reporting. This leads to a more efficient, reliable suite with minimal redundancy and clear identification of coverage
gaps. The method is accessible to both technical and non-technical team members, enhancing collaboration and
communication. Tests are self-explanatory, allowing anyone to quickly grasp their intent and scope without reading the
code. This clarity streamlines onboarding and supports a shared understanding of coverage and objectives. Test reports
are more meaningful, accurately reflecting the application's state. Additionally, small, atomic tests—together with
clearly described, skipped tests for unimplemented scenarios—offer transparent coverage metrics and assist in planning
manual regression checks. The test suite becomes a single source of truth, documenting requirements and use cases, so
everyone can easily see what is automated, what needs manual testing, and what is yet to be implemented.

## 7. Why are naming conventions crucial in test automation?

Consistent naming conventions ensure that tests are well-structured, maintainable, and easy to understand. They enable
automation of internal checks, streamline onboarding for new team members, minimize logical mistakes, and improve
communication. Clear naming also makes it easier to track coverage, identify issues, and generate meaningful metrics.

## 8. Why should all constants in tests be stored in variables?

Storing constants in variables improves readability and maintainability. It makes updating values easier and reduces the
risk of errors from hardcoded values. This approach also increases test flexibility, as changes to constants only need
to be made in one place, rather than throughout the test code.

## 9. Why is using tags in tests discouraged?

Tags can create confusion and complicate test management, especially when used inconsistently. Generic tags like
`@smoke` or `@regression` are often unclear and inconsistently applied, leading to confusion. They often lack clear
definitions and can lead to ambiguity in test selection and reporting. Instead, use structured file organization and
meaningful test names to group and filter tests. This approach is more transparent and easier to maintain.

## 10. Why is test execution speed extremely important?

Fast test execution is critical for efficient development and product release cycles. Slow tests create bottlenecks in
CI/CD pipelines, delay feedback for developers, and increase the time needed to identify and fix issues. Fast tests
enable rapid iteration, better resource utilization, and a smoother development process. They also reduce infrastructure
costs and allow for more frequent, comprehensive test runs.

**Key arguments:**

- Fast feedback: Developers receive results quickly and can address issues sooner.
- Increased productivity: Less time is spent waiting for test results, allowing more focus on development.
- CI/CD optimization: Faster builds and releases improve delivery timelines.
- Cost reduction: Shorter test runs lower infrastructure expenses, especially at scale.
- Improved scalability: Quick tests make it feasible to run the entire suite more often, ensuring thorough coverage.

## 11. Why is "Do not repeat yourself" (DRY) not relevant in test automation?

In test automation, readability and clarity are more important than minimizing code duplication. Explicit,
well-described tests are easier to understand, maintain, and debug. Over-applying DRY principles can lead to overly
abstracted code that is hard to follow and update, especially for new team members.

## 12. Why is it a problem to write test cases before specifications?

Writing test cases before formalizing specifications leads to imprecise coverage, confusion, and inefficiency. Without
clear specifications, it's difficult to ensure that tests are relevant and comprehensive. Specifications should be the
foundation for test cases, ensuring that automation efforts are aligned with actual requirements and can be easily
maintained as the system evolves.

## 13. What are the risks of relying on test management tools for automation?

Integrating test management tools with automation increases complexity, maintenance costs, and tool dependency. Metrics
and reports from such tools are often imprecise and do not accurately reflect true coverage or quality. Relying on these
tools can also distract from focusing on requirement-based automation and clear test structure.

## 14. Why should you describe and skip non-implemented tests?

Clearly describing and skipping non-implemented tests turns your repository into a transparent source of truth for all
use cases. This approach provides accurate automation coverage metrics and clearly outlines the intended scope. It
enables everyone—including manual testers—to see what is automated, what requires manual checks, and what is still
pending. The test suite serves as a unified reference for both automated and manual verification, enhancing team
transparency and planning.

**Example:**

```javascript
// cart-page.ui.spec.js

context('CartPage.STANDARD: When user visits the page', () => {
    before(() => {
        cy.visit(urls.pages.cart);
    });
    it('CartPage.STANDARD: Then direct URL should be open', () => {
        // implemented test
        cy.url().should('eq', urls.pages.cart);
    });

    it.skip('CartPage.STANDARD: Then error message is shown for unauthorized user', () => {
        // Not implemented yet
    });

    it.skip('CartPage.STANDARD: Then cart items are restored after reload', () => {
        // Not implemented yet
    });
});
```

and here is the output of the test run:

       Spec                                              Tests  Passing  Failing  Pending  Skipped

┌────────────────────────────────────────────────────────────────────────────────────────────────┐
│ ✔ integration/ui/cart-page.ui.spec.js 00:01 3 1 - 2 - │
└────────────────────────────────────────────────────────────────────────────────────────────────┘
✖ 0 of 6 failed (0%)                        00:01 3 1 - 2 -

This makes the scope and current coverage explicit, even before all tests are implemented.
