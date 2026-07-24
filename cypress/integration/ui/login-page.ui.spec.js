import { loginPage__examples as examples } from '../../integration-examples/ui/login-page.ui.examples.js';

describe('LoginPage: Given authenticate page opened', { testIsolation: false }, () => {
  let standardUser, lockedUser;

  before(() => {
    cy.common__getUserDataByRole(userRoles.STANDARD).then((user) => {
      standardUser = user;
    });
    cy.common__getUserDataByRole(userRoles.LOCKED).then((user) => {
      lockedUser = user;
    });
    cy.visit('/');
  });

  context('LoginPage.STANDARD: When user reviews the page', () => {
    it('LoginPage.STANDARD: Then login page title text matches the localization value', () => {
      cy.get(loginPage.title).should('have.text', l10n['loginPage.title']).and('be.visible');
    });
    it('LoginPage.STANDARD: Then username field placeholder matches the localization value and is empty', () => {
      cy.get(loginPage.username).should('have.attr', 'placeholder', l10n['loginPage.form.username']).and('have.value', examples.formField.emptyValue).and('be.visible');
    });
    it('LoginPage.STANDARD: Then password field placeholder matches the localization value, has password type and is empty', () => {
      cy.get(loginPage.password).should('have.attr', 'placeholder', l10n['loginPage.form.password']).and('have.attr', 'type', examples.formField.passwordType).and('have.value', examples.formField.emptyValue).and('be.visible');
    });
    it('LoginPage.STANDARD: Then authenticate button matches the localization value and is enabled', () => {
      cy.get(loginPage.login).should('have.value', l10n['loginPage.form.login']).and('be.visible').and('be.enabled');
    });
  });

  context('LoginPage.STANDARD: When user logs in with valid credentials', () => {
    before(() => {
      cy.loginPage__logIn(standardUser);
    });
    it('LoginPage.STANDARD: Then URL changes to the Inventory page', () => {
      cy.url().should('eq', urls.pages.inventory);
    });
    it('LoginPage.STANDARD: Then Inventory page title is displayed', () => {
      cy.get(inventoryPage.title).should('have.text', l10n['inventoryPage.title']).and('be.visible');
    });
  });

  context('LoginPage.STANDARD: When user logouts', () => {
    before(() => {
      cy.headerComp__logOut();
    });
    it('LoginPage.STANDARD: Then login page title text matches the localization value', () => {
      cy.get(loginPage.title).should('have.text', l10n['loginPage.title']).and('be.visible');
    });
    it('LoginPage.STANDARD: Then username field placeholder matches the localization value and is empty', () => {
      cy.get(loginPage.username).should('have.attr', 'placeholder', l10n['loginPage.form.username']).and('have.value', examples.formField.emptyValue).and('be.visible');
    });
    it('LoginPage.STANDARD: Then password field placeholder matches the localization value, has password type and is empty', () => {
      cy.get(loginPage.password).should('have.attr', 'placeholder', l10n['loginPage.form.password']).and('have.attr', 'type', examples.formField.passwordType).and('have.value', examples.formField.emptyValue).and('be.visible');
    });
    it('LoginPage.STANDARD: Then authenticate button matches the localization value and is enabled', () => {
      cy.get(loginPage.login).should('have.value', l10n['loginPage.form.login']).and('be.visible').and('be.enabled');
    });
    it('LoginPage.STANDARD: Then error notification is not displayed', () => {
      cy.get(loginPage.errorMessage).should('not.exist');
    });
  });

  context('LoginPage.STANDARD: When user clicks on the authenticate without passing credentials', () => {
    before(() => {
      cy.get(loginPage.login).click();
    });
    it('LoginPage.STANDARD: Then error message text says username is required', () => {
      cy.get(loginPage.errorMessage).should('have.text', l10n['loginPage.errors.usernameIsRequired']).and('be.visible');
    });
    it('LoginPage.STANDARD: Then error banner background is error colour', () => {
      cy.get(loginPage.error).should('have.css', 'background-color', colours['error']);
    });
    it('LoginPage.STANDARD: Then error collapse button is displayed', () => {
      cy.get(loginPage.errorClose).should('be.visible').and('be.enabled');
    });
    it('LoginPage.STANDARD: Then username field border is highlighted with error colour', () => {
      cy.get(loginPage.username).should('have.css', 'border-bottom-color', colours['error']);
    });
    it('LoginPage.STANDARD: Then username field contains error icon', () => {
      cy.get(loginPage.username).parent().find(loginPage.errorIcon).should('be.visible');
    });
    it('LoginPage.STANDARD: Then password field border is highlighted with error colour', () => {
      cy.get(loginPage.password).should('have.css', 'border-bottom-color', colours['error']);
    });
    it('LoginPage.STANDARD: Then password field contains error icon', () => {
      cy.get(loginPage.password).parent().find(loginPage.errorIcon).should('be.visible');
    });
  });

  context('LoginPage.STANDARD: When user clicks on error collapse button', () => {
    before(() => {
      cy.get(loginPage.errorClose).click();
    });
    it('LoginPage.STANDARD: Then error notification is not displayed', () => {
      cy.get(loginPage.errorMessage).should('not.exist');
    });
    it('LoginPage.STANDARD: Then username field border is not highlighted with error colour', () => {
      cy.get(loginPage.username).should('not.have.css', 'border-bottom-color', colours['error']);
    });
    it('LoginPage.STANDARD: Then username field does not contain error icon', () => {
      cy.get(loginPage.username).parent().find(loginPage.errorIcon).should('not.exist');
    });
    it('LoginPage.STANDARD: Then password field border is not highlighted with error colour', () => {
      cy.get(loginPage.password).should('not.have.css', 'border-bottom-color', colours['error']);
    });
    it('LoginPage.STANDARD: Then password field does not contain error icon', () => {
      cy.get(loginPage.password).parent().find(loginPage.errorIcon).should('not.exist');
    });
  });

  context('LoginPage.STANDARD: When user types actual username without password', () => {
    before(() => {
      cy.get(loginPage.username).type(standardUser.username, { delay: 0 });
      cy.get(loginPage.login).click();
    });
    it('LoginPage.STANDARD: Then error message text says password is required', () => {
      cy.get(loginPage.errorMessage).should('have.text', l10n['loginPage.errors.passwordIsRequired']).and('be.visible');
    });
    it('LoginPage.STANDARD: Then error banner background is error colour', () => {
      cy.get(loginPage.error).should('have.css', 'background-color', colours['error']);
    });
    it('LoginPage.STANDARD: Then error collapse button is displayed', () => {
      cy.get(loginPage.errorClose).should('be.visible').and('be.enabled');
    });
    it('LoginPage.STANDARD: Then username field border is highlighted with error colour', { req: { bugs: ['BUG-LOGIN-001'] } }, () => {
      cy.get(loginPage.username).should('have.css', 'border-bottom-color', colours['error']);
    });
    it('LoginPage.STANDARD: Then username field contains error icon', { req: { bugs: ['BUG-LOGIN-001'] } }, () => {
      cy.get(loginPage.username).parent().find(loginPage.errorIcon).should('be.visible');
    });
    it('LoginPage.STANDARD: Then password field border is highlighted with error colour', () => {
      cy.get(loginPage.password).should('have.css', 'border-bottom-color', colours['error']);
    });
    it('LoginPage.STANDARD: Then password field contains error icon', () => {
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
    it('LoginPage.STANDARD: Then error message text says username is required', () => {
      cy.get(loginPage.errorMessage).should('have.text', l10n['loginPage.errors.usernameIsRequired']).and('be.visible');
    });
    it('LoginPage.STANDARD: Then error banner background is error colour', () => {
      cy.get(loginPage.error).should('have.css', 'background-color', colours['error']);
    });
    it('LoginPage.STANDARD: Then error collapse button is displayed', () => {
      cy.get(loginPage.errorClose).should('be.visible').and('be.enabled');
    });
    it('LoginPage.STANDARD: Then username field border is highlighted with error colour', () => {
      cy.get(loginPage.username).should('have.css', 'border-bottom-color', colours['error']);
    });
    it('LoginPage.STANDARD: Then username field contains error icon', () => {
      cy.get(loginPage.username).parent().find(loginPage.errorIcon).should('be.visible');
    });
    it('LoginPage.STANDARD: Then password field border is highlighted with error colour', { req: { bugs: ['BUG-LOGIN-002'] } }, () => {
      cy.get(loginPage.password).should('have.css', 'border-bottom-color', colours['error']);
    });
    it('LoginPage.STANDARD: Then password field contains error icon', { req: { bugs: ['BUG-LOGIN-002'] } }, () => {
      cy.get(loginPage.password).parent().find(loginPage.errorIcon).should('be.visible');
    });
    after(() => {
      cy.get(loginPage.password).clear();
    });
  });

  context('LoginPage.STANDARD: When user types valid username and invalid password', () => {
    before(() => {
      cy.loginPage__logIn({ username: standardUser.username, password: examples.invalidCredentials.password });
    });
    it('LoginPage.STANDARD: Then error message text says credentials do not match any existing user', () => {
      cy.get(loginPage.errorMessage).should('have.text', l10n['loginPage.errors.userNotFound']).and('be.visible');
    });
    it('LoginPage.STANDARD: Then error banner background is error colour', () => {
      cy.get(loginPage.error).should('have.css', 'background-color', colours['error']);
    });
    it('LoginPage.STANDARD: Then error collapse button is displayed', () => {
      cy.get(loginPage.errorClose).should('be.visible').and('be.enabled');
    });
    it('LoginPage.STANDARD: Then username field border is highlighted with error colour', () => {
      cy.get(loginPage.username).should('have.css', 'border-bottom-color', colours['error']);
    });
    it('LoginPage.STANDARD: Then username field contains error icon', () => {
      cy.get(loginPage.username).parent().find(loginPage.errorIcon).should('be.visible');
    });
    it('LoginPage.STANDARD: Then password field border is highlighted with error colour', () => {
      cy.get(loginPage.password).should('have.css', 'border-bottom-color', colours['error']);
    });
    it('LoginPage.STANDARD: Then password field contains error icon', () => {
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
    it('LoginPage.STANDARD: Then error message text says user is locked out', () => {
      cy.get(loginPage.errorMessage).should('have.text', l10n['loginPage.errors.userIsLockedOut']).and('be.visible');
    });
    it('LoginPage.STANDARD: Then error banner background is error colour', () => {
      cy.get(loginPage.error).should('have.css', 'background-color', colours['error']);
    });
    it('LoginPage.STANDARD: Then error collapse button is displayed', () => {
      cy.get(loginPage.errorClose).should('be.visible').and('be.enabled');
    });
    it('LoginPage.STANDARD: Then username field border is highlighted with error colour', () => {
      cy.get(loginPage.username).should('have.css', 'border-bottom-color', colours['error']);
    });
    it('LoginPage.STANDARD: Then username field contains error icon', () => {
      cy.get(loginPage.username).parent().find(loginPage.errorIcon).should('be.visible');
    });
    it('LoginPage.STANDARD: Then password field border is highlighted with error colour', () => {
      cy.get(loginPage.password).should('have.css', 'border-bottom-color', colours['error']);
    });
    it('LoginPage.STANDARD: Then password field contains error icon', () => {
      cy.get(loginPage.password).parent().find(loginPage.errorIcon).should('be.visible');
    });
  });

  context('LoginPage.STANDARD: When user tries to navigate to Inventory page without authentication', () => {
    before(() => {
      cy.visit(urls.pages.inventory, { failOnStatusCode: false });
    });
    it('LoginPage.STANDARD: Then URL is the authenticate page', () => {
      cy.url().should('eq', urls.pages.login);
    });
    it('LoginPage.STANDARD: Then login page title text matches the localization value', () => {
      cy.get(loginPage.title).should('have.text', l10n['loginPage.title']).and('be.visible');
    });
    it('LoginPage.STANDARD: Then error message text says access to page is denied', () => {
      cy.get(loginPage.errorMessage).should('have.text', l10n['loginPage.errors.accessToPageDenied']).and('be.visible');
    });
    it('LoginPage.STANDARD: Then error banner background is error colour', () => {
      cy.get(loginPage.error).should('have.css', 'background-color', colours['error']);
    });
    it('LoginPage.STANDARD: Then error collapse button is displayed', () => {
      cy.get(loginPage.errorClose).should('be.visible').and('be.enabled');
    });
    it('LoginPage.STANDARD: Then username field border is highlighted with error colour', () => {
      cy.get(loginPage.username).should('have.css', 'border-bottom-color', colours['error']);
    });
    it('LoginPage.STANDARD: Then username field contains error icon', () => {
      cy.get(loginPage.username).parent().find(loginPage.errorIcon).should('be.visible');
    });
    it('LoginPage.STANDARD: Then password field border is highlighted with error colour', () => {
      cy.get(loginPage.password).should('have.css', 'border-bottom-color', colours['error']);
    });
    it('LoginPage.STANDARD: Then password field contains error icon', () => {
      cy.get(loginPage.password).parent().find(loginPage.errorIcon).should('be.visible');
    });
    after(() => {
      cy.get(loginPage.errorClose).click();
    });
  });
});
