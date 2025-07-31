# FAQ

## 1. Why is automating manual test cases ineffective?

Automating manual test cases is not recommended because manual tests are designed for human execution structured in
straight-forward way. often containing

ambiguous duplicated steps and lacking the suite structure needed for reliable automation. Attempting to automate them
leads to unclear
logic, superficial coverage, high maintenance costs and broken CI/CD processes due slow execution because of duplicated
steps.
Keeping automated tests have no benefits, since requires a lot of resources and provides no benefits, because creates
two sources of truth. aligned with manual cases requires
constant updates in both places, increasing the risk of inconsistencies and wasted effort. Metrics based on the number
of automated manual cases are misleading, cause number of verified requirements is different from test to test, and
integrating these tests with management tools adds unnecessary complexity.
Instead, automation should focus on directly validating requirements, resulting in more stable, precise, and
maintainable tests that truly reflect the application's intended behavior.

## 2. Why is using Page Object considered an anti-pattern?

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

**Pros:**

- Organized structure through OOP principles
    - Reusable page methods across tests
    - Encapsulation of page-specific logic
    - Standardized interface for page interactions

**Cons:**

- Unnecessary abstraction:
    - Duplicates framework functionality
    - Wraps simple operations in methods
    - Adds complexity to basic actions

- Maintenance challenges:
    - Multiple files to update for UI changes
    - Complex dependencies between classes

- Poor developer experience:
    - High cognitive load from OOP complexity
    - Difficult to trace test flow
    - Steep learning curve for new team members

- Technical limitations:
    - Reduced test performance
    - Complicated parallel execution
    - Version control conflicts in shared objects

- Documentation and visibility:
    - Hidden implementation details
    - Requires additional logging
    - Hard to understand for non-developers

**Recommended approach:**

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

- Simplified architecture:
    - No unnecessary abstraction layers
    - Clear separation of selectors, commands and tests
    - Direct access to framework functionality
- Improved maintainability:
    - Changes only require updates in relevant files
    - Centralized selector management
    - Focused test logic
- Better developer experience:
    - Easy onboarding with clear file structure
    - No OOP complexity to learn
    - Self-documenting test flow
- Single source of truth:
    - Atomic and focused tests
    - Clear test intentions
    - Direct mapping to requirements

**Cons:**

- More verbose than POM but provides better clarity
- Non-trivial approach requires some time to get used to, but once understood, it is more efficient

Why not just use selectors directly? Selectors are just strings. Hiding them in classes adds unnecessary complexity.
In summary, POM creates a complex, self-serving system that distracts from writing clear, maintainable
tests. It is an anti-pattern because it prioritizes OOP structure over test clarity and maintainability.

## 3. Why is using BDD frameworks counterproductive?

BDD frameworks introduce an extra layer of abstraction, which can make tests harder to maintain and slower to execute.
They are primarily aimed at automating manual test cases—a flawed approach that leads to unclear logic, superficial
coverage, and high maintenance costs (see above for details). While BDD frameworks intend to improve collaboration by
using human-readable language (like Gherkin), in practice, this rarely delivers real benefits. The added complexity of
step definitions and mapping to code often outweighs any advantages. Importantly, you can use BDD keywords and natural
human language directly in your test descriptions and structure—without BDD frameworks or extra abstractions. This keeps
tests readable and maintainable, while avoiding unnecessary indirection. Writing tests with clear structure, descriptive
names, and straightforward logic is more effective for both communication and maintenance.

**1. BDD framework approach: Gherkin feature file and step definitions**

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

**Pros:**

- Business-readable specifications
- Structured documentation
- Reusable step definitions
- Built-in reporting

**Cons:**

- Technical:
    - Complex setup and configuration
    - Slower test execution
    - Difficult debugging
    - Poor IDE support
    - Parallel execution challenges

- Maintenance:
    - Multiple files to maintain
    - Step definition overhead
    - Fragile step matching
    - Complex dependency management

- Development:
    - Steep learning curve
    - Extra abstraction layer
    - Code duplication in step definitions and assertions
    - Reduced code reuse
    - Slower feedback cycle

**2. Recommended approach: No BDD framework, just clear structure and naming**

This example uses Cypress with descriptive `context` and `it` blocks, following Gherkin-style language. No extra
abstraction or step mapping is needed.

```javascript
context('LoginPage.STANDARD: When user logins with valid credentials', () => {
    before(() => {
        cy.loginPage_Login(standardUser);
    });
    it('LoginPage.STANDARD: Then user should be navigated to the Inventory page', () => {
        cy.url().should('eq', urls.pages.inventory);
        cy.get(inventoryPage.title).should('have.text', l10n.inventoryPage.title).and('be.visible');
    });
});
```

**Pros:**

- Technical:
    - Fast test execution
    - Native IDE support
    - Simple debugging
    - Efficient parallel execution

- Development:
    - Clear file structure
    - Single source of truth
    - Straightforward test flow
    - Easy maintenance
    - Quick feedback cycle

- Documentation:
    - Self-documenting tests
    - Human-readable titles and reports
    - No mapping complexity
    - Transparent and precise coverage

- Implementation:
    - No configuration overhead
    - Direct assertions
    - Native framework features
    - Clear test organization

**Cons:**

- Technical:
    - More verbose test descriptions

---

**Summary:**  
You can achieve clear, human-readable tests using Gherkin-style language and naming conventions directly in your code,
without the complexity of BDD frameworks or step mapping. This keeps tests simple, maintainable, and easy to understand.

## 4. Why should tests be atomic (small and focused)? Why is it important to separate setup of preconditions and particular state under the test?

Atomic tests verify only one specific thing, making them faster, more reliable, and easier to maintain. They provide
precise feedback when failures occur, simplifying debugging and improving the accuracy of test metrics. Small, focused
tests are also easier to update and less likely to break when unrelated parts of the application change.

Here are two examples to illustrate the importance of small, focused tests:

**1. Bad Example: One generic test with many hidden steps**

This test has a vague title and multiple checks inside, making it hard to maintain and debug:

```javascript
it('Should display correct cart page', () => {
    cy.get(headerComp.openCart).click();
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
context('CartPage.STANDARD: When user visits the page', () => {
    before(() => {
        cy.get(headerComp.openCart).click();
    });
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
})
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

## 5. Why are naming conventions crucial in test automation?

Consistent naming conventions ensure that tests are well-structured, maintainable, and easy to understand. They enable
automation of internal checks, streamline onboarding for new team members, minimize logical mistakes, and improve
communication. Clear naming also makes it easier to track coverage, identify issues, and generate meaningful metrics.

## 6. Why should all constants in tests be stored in variables?

Storing constants in variables improves readability and maintainability. It makes updating values easier and reduces the
risk of errors from hardcoded values. This approach also increases test flexibility, as changes to constants only need
to be made in one place, rather than throughout the test code.

## 7. Why is using tags in tests discouraged?

Tags can create confusion and complicate test management, especially when used inconsistently. Generic tags like
`@smoke` or `@regression` are often unclear and inconsistently defined and applied, leading to confusion. They often
lack clear
definitions and can lead to ambiguity in test selection and reporting. Instead, use structured file organization and
meaningful test names to group and filter tests. This approach is more transparent and easier to maintain.

## 8. Why is test execution speed extremely important?

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

Here's a clearer and more detailed explanation of why UI tests should be tied to one page or component:

## 9. Why should UI tests be tied to one page or component?

Test file isolation is crucial in UI automation because test runs within a file share the same context. Organizing tests
by pages or components prevents state conflicts between functional areas and makes test failures easily traceable to
specific functionality. When each test file focuses on one page or component, updates to one area don't affect unrelated
tests. This creates clear boundaries for test responsibility and enables efficient parallel execution.

The modular approach simplifies maintenance, debugging and naturally aligns test organization with application
architecture. Coverage becomes clearly mapped to the application structure, making the test suite easier to scale as the
application grows.

**Example: Bad approach (mixing pages)**

```javascript
// checkout.ui.spec.js
context('Checkout: When user completes purchase', () => {
    it('Then order confirmation is displayed', () => {
        // Cart page actions
        cy.visit(urls.cart);
        cy.get(cartPage.checkoutButton).click();

        // Checkout page actions
        cy.get(checkoutPage.firstName).type('John');
        cy.get(checkoutPage.lastName).type('Doe');
        cy.get(checkoutPage.continueButton).click();

        // Confirmation page checks
        cy.get(confirmationPage.title).should('be.visible');
    });
});
```

**Example: Good approach (page-specific)**

```javascript
// cart-page.ui.spec.js
context('CartPage.STANDARD: When user proceeds to checkout', () => {
    before(() => {
        cy.visit(urls.cart);
    });

    it('CartPage.STANDARD: Then checkout button navigates to checkout page', () => {
        cy.get(cartPage.checkoutButton).click();
        cy.url().should('eq', urls.checkout);
    });
});

// checkout-page.ui.spec.js
context('CheckoutPage.STANDARD: When user submits valid details', () => {
    before(() => {
        cy.visit(urls.checkout);
        cy.get(checkoutPage.firstName).type('John');
        cy.get(checkoutPage.lastName).type('Doe');
    });

    it('CheckoutPage.STANDARD: Then user proceeds to confirmation', () => {
        cy.get(checkoutPage.continueButton).click();
        cy.url().should('eq', urls.confirmation);
    });
});
```

## 10. What are the risks of relying on test management tools for automation?

Test management tools often create more problems than they solve. They require complex integrations, increase
maintenance overhead, and introduce external dependencies. The metrics they provide are typically misleading - focusing
on raw test counts rather than actual requirement coverage or defect prevention.

These tools tend to:

- Fragment test documentation across multiple systems
- Create artificial mapping between manual and automated tests
- Generate unreliable metrics based on test counts
- Add integration complexity to CI/CD pipelines
- Increase maintenance costs without clear benefits
- Distract from writing robust, requirement-focused tests

Instead, use version control as the single source of truth, with clear test structure and descriptive names providing
natural documentation and metrics.

## 11. Why should you describe and skip non-implemented tests?

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

```text
      Spec                                              Tests  Passing  Failing  Pending  Skipped

┌────────────────────────────────────────────────────────────────────────────────────────────────┐
│ ✔ integration/ui/cart-page.ui.spec.js         00:01      3       1       -         2         - │
└────────────────────────────────────────────────────────────────────────────────────────────────┘
  ✖ 0 of 3 failed (0%)                          00:01      3       1       -         2         -

```

This approach clearly shows the scope and current coverage: with 1 out of 3 tests implemented, coverage is 33.3%, even
before all tests are completed.

## 12. Why Direct Data Imports Are Preferred Over Cypress Fixtures in Test Development?

Cypress fixtures are best used for dynamic data that depends on parameters, such as test users tied to environment
variables or other sensitive, runtime-defined values. For static data and during test development, prefer direct imports
for easier access and modification. Use direct imports for static datasets, and leverage fixtures when you need to load
or generate data dynamically based on test context or environment.
