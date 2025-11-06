import { testData } from '../../test-data/ui/login-page.ui.test-data.js';

describe('LoginPage: Given authenticate page opened', { testIsolation: false }, () => {
  let standardUser, lockedUser;

  before(() => {
    cy.getUserDataByRole(userRoles.STANDARD).then((user) => {
      standardUser = user;
    });
    cy.getUserDataByRole(userRoles.LOCKED).then((user) => {
      lockedUser = user;
    });
    cy.visit('/');
  });

  context('LoginPage.STANDARD: When user reviews the page', () => {
    it('LoginPage.STANDARD: Then user should see Title', () => {
      cy.get(loginPage.title).should('have.text', l10n.loginPage.title).and('be.visible');
    });
    it('LoginPage.STANDARD: Then user should see Username field with placeholder and empty value', () => {
      cy.get(loginPage.username).should('have.attr', 'placeholder', l10n.loginPage.form.username).and('have.value', testData.field.emptyValue).and('be.visible');
    });
    it('LoginPage.STANDARD: Then user should see Password field with placeholder, password input and empty value', () => {
      cy.get(loginPage.password).should('have.attr', 'placeholder', l10n.loginPage.form.password).and('have.attr', 'type', testData.field.passwordType).and('have.value', testData.field.emptyValue).and('be.visible');
    });
    it('LoginPage.STANDARD: Then user should see authenticate button', () => {
      cy.get(loginPage.login).should('have.value', l10n.loginPage.form.login).and('be.visible').and('be.enabled');
    });
  });

  context('LoginPage.STANDARD: When user logs in with valid credentials', () => {
    before(() => {
      cy.loginPage__logIn(standardUser);
    });
    it('LoginPage.STANDARD: Then user should be navigated to the Inventory page', () => {
      cy.url().should('eq', urls.pages.inventory);
      cy.get(inventoryPage.title).should('have.text', l10n.inventoryPage.title).and('be.visible');
    });
  });

  context('LoginPage.STANDARD: When user logouts', () => {
    before(() => {
      cy.headerComp__logOut();
    });
    it('LoginPage.STANDARD: Then user should see Title', () => {
      cy.get(loginPage.title).should('have.text', l10n.loginPage.title).and('be.visible');
    });
    it('LoginPage.STANDARD: Then user should see Username field with placeholder and empty value', () => {
      cy.get(loginPage.username).should('have.attr', 'placeholder', l10n.loginPage.form.username).and('have.value', testData.field.emptyValue).and('be.visible');
    });
    it('LoginPage.STANDARD: Then user should see Password field with placeholder, password input and empty value', () => {
      cy.get(loginPage.password).should('have.attr', 'placeholder', l10n.loginPage.form.password).and('have.attr', 'type', testData.field.passwordType).and('have.value', testData.field.emptyValue).and('be.visible');
    });
    it('LoginPage.STANDARD: Then user should see authenticate button', () => {
      cy.get(loginPage.login).should('have.value', l10n.loginPage.form.login).and('be.visible').and('be.enabled');
    });
    it('LoginPage.STANDARD: Then fail notification should not be displayed', () => {
      cy.get(loginPage.errorMessage).should('not.exist');
    });
  });

  context('LoginPage.STANDARD: When user clicks on the authenticate without passing credentials', () => {
    before(() => {
      cy.get(loginPage.login).click();
    });
    it('LoginPage.STANDARD: Then colored fail notification about missing username should be shown', () => {
      cy.get(loginPage.errorMessage).should('have.text', l10n.loginPage.errors.usernameIsRequired).and('be.visible');
      cy.get(loginPage.error).should('have.css', 'background-color', colours.ERROR);
    });
    it('LoginPage.STANDARD: Then fail collapse button should be shown', () => {
      cy.get(loginPage.errorClose).should('be.visible').and('be.enabled');
    });
    it('LoginPage.STANDARD: Then username field should be highlighted and contain fail icon', () => {
      cy.get(loginPage.username).should('have.css', 'border-bottom-color', colours.ERROR);
      cy.get(loginPage.username).parent().find(loginPage.errorIcon).should('be.visible');
    });
    it('LoginPage.STANDARD: Then password field should be highlighted and contain fail icon', () => {
      cy.get(loginPage.password).should('have.css', 'border-bottom-color', colours.ERROR);
      cy.get(loginPage.password).parent().find(loginPage.errorIcon).should('be.visible');
    });
  });

  context('LoginPage.STANDARD: When user clicks on fail collapse button', () => {
    before(() => {
      cy.get(loginPage.errorClose).click();
    });
    it('LoginPage.STANDARD: Then fail notification should not be displayed', () => {
      cy.get(loginPage.errorMessage).should('not.exist');
    });
    it('LoginPage.STANDARD: Then username field should not be highlighted and contain fail icon', () => {
      cy.get(loginPage.username).should('not.have.css', 'border-bottom-color', colours.ERROR);
      cy.get(loginPage.username).parent().find(loginPage.errorIcon).should('not.exist');
    });
    it('LoginPage.STANDARD: Then password field should not be highlighted and contain fail icon', () => {
      cy.get(loginPage.password).should('not.have.css', 'border-bottom-color', colours.ERROR);
      cy.get(loginPage.password).parent().find(loginPage.errorIcon).should('not.exist');
    });
  });

  context('LoginPage.STANDARD: When user types actual username without password', () => {
    before(() => {
      cy.get(loginPage.username).type(standardUser.username, { delay: 0 });
      cy.get(loginPage.login).click();
    });
    it('LoginPage.STANDARD: Then colored fail notification about missing password should be shown', () => {
      cy.get(loginPage.errorMessage).should('have.text', l10n.loginPage.errors.passwordIsRequired).and('be.visible');
      cy.get(loginPage.error).should('have.css', 'background-color', colours.ERROR);
    });
    it('LoginPage.STANDARD: Then fail collapse button should be shown', () => {
      cy.get(loginPage.errorClose).should('be.visible').and('be.enabled');
    });
    // Bug Reference: BUG-LOGIN-001 - Username field incorrectly highlighted when only password is missing
    it('LoginPage.STANDARD: Then username field should be highlighted and contain error icon', () => {
      cy.get(loginPage.username).should('have.css', 'border-bottom-color', colours.ERROR);
      cy.get(loginPage.username).parent().find(loginPage.errorIcon).should('be.visible');
    });
    it('LoginPage.STANDARD: Then password field should be highlighted and contain fail icon', () => {
      cy.get(loginPage.password).should('have.css', 'border-bottom-color', colours.ERROR);
      cy.get(loginPage.password).parent().find(loginPage.errorIcon).should('be.visible');
    });
    after(() => {
      cy.get(loginPage.username).clear();
    });
  });

  context('LoginPage.STANDARD: When user types actual password without username', () => {
    before(() => {
      cy.get(loginPage.password).type(standardUser.password, { log: false, delay: 0 });
      cy.get(loginPage.login).click();
    });
    it('LoginPage.STANDARD: Then colored fail notification about missing username should be shown', () => {
      cy.get(loginPage.errorMessage).should('have.text', l10n.loginPage.errors.usernameIsRequired).and('be.visible');
      cy.get(loginPage.error).should('have.css', 'background-color', colours.ERROR);
    });
    it('LoginPage.STANDARD: Then fail collapse button should be shown', () => {
      cy.get(loginPage.errorClose).should('be.visible').and('be.enabled');
    });
    it('LoginPage.STANDARD: Then username field should be highlighted and contain fail icon', () => {
      cy.get(loginPage.username).should('have.css', 'border-bottom-color', colours.ERROR);
      cy.get(loginPage.username).parent().find(loginPage.errorIcon).should('be.visible');
    });
    // Bug Reference: BUG-LOGIN-002 - Password field incorrectly highlighted when only username is missing
    it('LoginPage.STANDARD: Then password field should be highlighted and contain error icon', () => {
      cy.get(loginPage.password).should('have.css', 'border-bottom-color', colours.ERROR);
      cy.get(loginPage.password).parent().find(loginPage.errorIcon).should('be.visible');
    });
    after(() => {
      cy.get(loginPage.password).clear();
    });
  });

  context('LoginPage.STANDARD: When user types valid username and invalid password', () => {
    before(() => {
      cy.loginPage__logIn({ username: standardUser.username, password: testData.invalidCredentials.password });
    });
    it('LoginPage.STANDARD: Then colored fail notification about credentials do not match any existing user should be shown', () => {
      cy.get(loginPage.errorMessage).should('have.text', l10n.loginPage.errors.userNotFound).and('be.visible');
      cy.get(loginPage.error).should('have.css', 'background-color', colours.ERROR);
    });
    it('LoginPage.STANDARD: Then fail collapse button should be shown', () => {
      cy.get(loginPage.errorClose).should('be.visible').and('be.enabled');
    });
    it('LoginPage.STANDARD: Then username field should be highlighted and contain fail icon', () => {
      cy.get(loginPage.username).should('have.css', 'border-bottom-color', colours.ERROR);
      cy.get(loginPage.username).parent().find(loginPage.errorIcon).should('be.visible');
    });
    it('LoginPage.STANDARD: Then password field should be highlighted and contain fail icon', () => {
      cy.get(loginPage.password).should('have.css', 'border-bottom-color', colours.ERROR);
      cy.get(loginPage.password).parent().find(loginPage.errorIcon).should('be.visible');
    });
    after(() => {
      cy.get(loginPage.username).clear();
      cy.get(loginPage.password).clear();
    });
  });

  context('LoginPage.STANDARD: When user tries to use locked account', () => {
    before(() => {
      cy.loginPage__logIn(lockedUser);
    });
    it('LoginPage.STANDARD: Then colored fail notification about locked user should be shown', () => {
      cy.get(loginPage.errorMessage).should('have.text', l10n.loginPage.errors.userIsLockedOut).and('be.visible');
      cy.get(loginPage.error).should('have.css', 'background-color', colours.ERROR);
    });
    it('LoginPage.STANDARD: Then fail collapse button should be shown', () => {
      cy.get(loginPage.errorClose).should('be.visible').and('be.enabled');
    });
    it('LoginPage.STANDARD: Then username field should be highlighted and contain fail icon', () => {
      cy.get(loginPage.username).should('have.css', 'border-bottom-color', colours.ERROR);
      cy.get(loginPage.username).parent().find(loginPage.errorIcon).should('be.visible');
    });
    it('LoginPage.STANDARD: Then password field should be highlighted and contain fail icon', () => {
      cy.get(loginPage.password).should('have.css', 'border-bottom-color', colours.ERROR);
      cy.get(loginPage.password).parent().find(loginPage.errorIcon).should('be.visible');
    });
  });

  context('LoginPage.STANDARD: When user tries to navigate to Inventory page without authenticate', () => {
    before(() => {
      cy.visit(urls.pages.inventory, { failOnStatusCode: false });
    });
    it('LoginPage.STANDARD: Then user should be navigated to the authenticate page', () => {
      cy.url().should('eq', urls.pages.login);
      cy.get(loginPage.title).should('have.text', l10n.loginPage.title).and('be.visible');
    });
    it('LoginPage.STANDARD: Then colored fail notification about access denied should be shown', () => {
      cy.get(loginPage.errorMessage).should('have.text', l10n.loginPage.errors.accessToPageDenied).and('be.visible');
      cy.get(loginPage.error).should('have.css', 'background-color', colours.ERROR);
    });
    it('LoginPage.STANDARD: Then fail collapse button should be shown', () => {
      cy.get(loginPage.errorClose).should('be.visible').and('be.enabled');
    });
    it('LoginPage.STANDARD: Then username field should be highlighted and contain fail icon', () => {
      cy.get(loginPage.username).should('have.css', 'border-bottom-color', colours.ERROR);
      cy.get(loginPage.username).parent().find(loginPage.errorIcon).should('be.visible');
    });
    it('LoginPage.STANDARD: Then password field should be highlighted and contain fail icon', () => {
      cy.get(loginPage.password).should('have.css', 'border-bottom-color', colours.ERROR);
      cy.get(loginPage.password).parent().find(loginPage.errorIcon).should('be.visible');
    });
    after(() => {
      cy.get(loginPage.errorClose).click();
    });
  });
});
