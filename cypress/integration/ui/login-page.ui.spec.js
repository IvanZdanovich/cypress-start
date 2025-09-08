describe('LoginPage: Given Login page opened', { testIsolation: false }, () => {
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
      cy.get(loginPage.username).should('have.attr', 'placeholder', l10n.loginPage.form.username).and('have.value', '').and('be.visible');
    });
    it('LoginPage.STANDARD: Then user should see Password field with placeholder, password type and empty value', () => {
      cy.get(loginPage.password).should('have.attr', 'placeholder', l10n.loginPage.form.password).and('have.attr', 'type', 'password').and('have.value', '').and('be.visible');
    });
    it('LoginPage.STANDARD: Then user should see Login button', () => {
      cy.get(loginPage.login).should('have.value', l10n.loginPage.form.login).and('be.visible').and('be.enabled');
    });
  });

  context('LoginPage.STANDARD: When user logins with valid credentials', () => {
    before(() => {
      cy.loginPage_Login(standardUser);
    });
    it(`LoginPage.STANDARD: Then user should be navigated to the Inventory page`, () => {
      cy.url().should('eq', urls.pages.inventory);
      cy.get(inventoryPage.title).should('have.text', l10n.inventoryPage.title).and('be.visible');
    });
  });

  context('LoginPage.STANDARD: When user logouts', () => {
    before(() => {
      cy.get(headerComp.sidebar.open).click();
      cy.get(headerComp.sidebar.logout).click();
    });
    it('LoginPage.STANDARD: Then user should see Title', () => {
      cy.get(loginPage.title).should('have.text', l10n.loginPage.title).and('be.visible');
    });
    it('LoginPage.STANDARD: Then user should see Username field with placeholder and empty value', () => {
      cy.get(loginPage.username).should('have.attr', 'placeholder', l10n.loginPage.form.username).and('have.value', '').and('be.visible');
    });
    it('LoginPage.STANDARD: Then user should see Password field with placeholder, password type and empty value', () => {
      cy.get(loginPage.password).should('have.attr', 'placeholder', l10n.loginPage.form.password).and('have.attr', 'type', 'password').and('have.value', '').and('be.visible');
    });
    it('LoginPage.STANDARD: Then user should see Login button', () => {
      cy.get(loginPage.login).should('have.value', l10n.loginPage.form.login).and('be.visible').and('be.enabled');
    });
    it('LoginPage.STANDARD: Then error message should not be displayed', () => {
      cy.get(loginPage.errorMessage).should('not.exist');
    });
  });

  context('LoginPage.STANDARD: When user clicks on the Login without passing credentials', () => {
    before(() => {
      cy.get(loginPage.login).click();
    });
    it('LoginPage.STANDARD: Then colored error message about missing username should be shown', () => {
      cy.get(loginPage.errorMessage).should('have.text', l10n.loginPage.errors.usernameIsRequired).and('be.visible');
      cy.get(loginPage.error).should('have.css', 'background-color', colours.ERROR);
    });
    it('LoginPage.STANDARD: Then error close button should be shown', () => {
      cy.get(loginPage.errorClose).should('be.visible').and('be.enabled');
    });
    it('LoginPage.STANDARD: Then username field should be highlighted and contain error icon', () => {
      cy.get(loginPage.username).should('have.css', 'border-bottom-color', colours.ERROR);
      cy.get(loginPage.username).parent().find(loginPage.errorIcon).should('be.visible');
    });
    it('LoginPage.STANDARD: Then password field should be highlighted and contain error icon', () => {
      cy.get(loginPage.password).should('have.css', 'border-bottom-color', colours.ERROR);
      cy.get(loginPage.password).parent().find(loginPage.errorIcon).should('be.visible');
    });
  });

  context('LoginPage.STANDARD: When user clicks on Error close button', () => {
    before(() => {
      cy.get(loginPage.errorClose).click();
    });
    it('LoginPage.STANDARD: Then error message should not be displayed', () => {
      cy.get(loginPage.errorMessage).should('not.exist');
    });
    it('LoginPage.STANDARD: Then username field should not be highlighted and contain error icon', () => {
      cy.get(loginPage.username).should('not.have.css', 'border-bottom-color', colours.ERROR);
      cy.get(loginPage.username).parent().find(loginPage.errorIcon).should('not.exist');
    });
    it('LoginPage.STANDARD: Then password field should not be highlighted and contain error icon', () => {
      cy.get(loginPage.password).should('not.have.css', 'border-bottom-color', colours.ERROR);
      cy.get(loginPage.password).parent().find(loginPage.errorIcon).should('not.exist');
    });
  });

  context('LoginPage.STANDARD: When user types actual username without password', () => {
    before(() => {
      cy.get(loginPage.username).type(standardUser.username, { delay: 0 });
      cy.get(loginPage.login).click();
    });
    it('LoginPage.STANDARD: Then colored error message about missing password should be shown', () => {
      cy.get(loginPage.errorMessage).should('have.text', l10n.loginPage.errors.passwordIsRequired).and('be.visible');
      cy.get(loginPage.error).should('have.css', 'background-color', colours.ERROR);
    });
    it('LoginPage.STANDARD: Then error close button should be shown', () => {
      cy.get(loginPage.errorClose).should('be.visible').and('be.enabled');
    });
    // TODO: fix the bug bugLog.loginPage_credentialsFieldIcon
    it(`LoginPage.STANDARD: Then username field should not be highlighted and not contain error icon\n${JSON.stringify(bugLog.loginPage_credentialsFieldIcon)}`, () => {
      cy.get(loginPage.username).should('have.css', 'border-bottom-color', colours.ERROR);
      cy.get(loginPage.username).parent().find(loginPage.errorIcon).should('be.visible');
    });
    it('LoginPage.STANDARD: Then password field should be highlighted and contain error icon', () => {
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
    it('LoginPage.STANDARD: Then colored error message about missing username should be shown', () => {
      cy.get(loginPage.errorMessage).should('have.text', l10n.loginPage.errors.usernameIsRequired).and('be.visible');
      cy.get(loginPage.error).should('have.css', 'background-color', colours.ERROR);
    });
    it('LoginPage.STANDARD: Then error close button should be shown', () => {
      cy.get(loginPage.errorClose).should('be.visible').and('be.enabled');
    });
    it('LoginPage.STANDARD: Then username field should be highlighted and contain error icon', () => {
      cy.get(loginPage.username).should('have.css', 'border-bottom-color', colours.ERROR);
      cy.get(loginPage.username).parent().find(loginPage.errorIcon).should('be.visible');
    });
    // TODO: fix the bug bugLog.loginPage_credentialsFieldIcon
    it(`LoginPage.STANDARD: Then password field should be highlighted and contain error icon\n${JSON.stringify(bugLog.loginPage_credentialsFieldIcon)}`, () => {
      cy.get(loginPage.password).should('have.css', 'border-bottom-color', colours.ERROR);
      cy.get(loginPage.password).parent().find(loginPage.errorIcon).should('be.visible');
    });
    after(() => {
      cy.get(loginPage.password).clear();
    });
  });

  context('LoginPage.STANDARD: When user types valid username and invalid password', () => {
    before(() => {
      cy.loginPage_Login({ username: standardUser.username, password: 'invalid' });
    });
    it('LoginPage.STANDARD: Then colored error message about credentials do not match any existing user should be shown', () => {
      cy.get(loginPage.errorMessage).should('have.text', l10n.loginPage.errors.userNotFound).and('be.visible');
      cy.get(loginPage.error).should('have.css', 'background-color', colours.ERROR);
    });
    it('LoginPage.STANDARD: Then error close button should be shown', () => {
      cy.get(loginPage.errorClose).should('be.visible').and('be.enabled');
    });
    it('LoginPage.STANDARD: Then username field should be highlighted and contain error icon', () => {
      cy.get(loginPage.username).should('have.css', 'border-bottom-color', colours.ERROR);
      cy.get(loginPage.username).parent().find(loginPage.errorIcon).should('be.visible');
    });
    it('LoginPage.STANDARD: Then password field should be highlighted and contain error icon', () => {
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
      cy.loginPage_Login(lockedUser);
    });
    it('LoginPage.STANDARD: Then colored error message about locked user should be shown', () => {
      cy.get(loginPage.errorMessage).should('have.text', l10n.loginPage.errors.userIsLockedOut).and('be.visible');
      cy.get(loginPage.error).should('have.css', 'background-color', colours.ERROR);
    });
    it('LoginPage.STANDARD: Then error close button should be shown', () => {
      cy.get(loginPage.errorClose).should('be.visible').and('be.enabled');
    });
    it('LoginPage.STANDARD: Then username field should be highlighted and contain error icon', () => {
      cy.get(loginPage.username).should('have.css', 'border-bottom-color', colours.ERROR);
      cy.get(loginPage.username).parent().find(loginPage.errorIcon).should('be.visible');
    });
    it('LoginPage.STANDARD: Then password field should be highlighted and contain error icon', () => {
      cy.get(loginPage.password).should('have.css', 'border-bottom-color', colours.ERROR);
      cy.get(loginPage.password).parent().find(loginPage.errorIcon).should('be.visible');
    });
  });

  context('LoginPage.STANDARD: When user tries to navigate to Inventory page without login', () => {
    before(() => {
      cy.visit(urls.pages.inventory, { failOnStatusCode: false });
    });
    it('LoginPage.STANDARD: Then user should be navigated to the Login page', () => {
      cy.url().should('eq', urls.pages.login);
      cy.get(loginPage.title).should('have.text', l10n.loginPage.title).and('be.visible');
    });
    it('LoginPage.STANDARD: Then colored error message about locked user should be shown', () => {
      cy.get(loginPage.errorMessage).should('have.text', l10n.loginPage.errors.accessToPageDenied).and('be.visible');
      cy.get(loginPage.error).should('have.css', 'background-color', colours.ERROR);
    });
    it('LoginPage.STANDARD: Then error close button should be shown', () => {
      cy.get(loginPage.errorClose).should('be.visible').and('be.enabled');
    });
    it('LoginPage.STANDARD: Then username field should be highlighted and contain error icon', () => {
      cy.get(loginPage.username).should('have.css', 'border-bottom-color', colours.ERROR);
      cy.get(loginPage.username).parent().find(loginPage.errorIcon).should('be.visible');
    });
    it('LoginPage.STANDARD: Then password field should be highlighted and contain error icon', () => {
      cy.get(loginPage.password).should('have.css', 'border-bottom-color', colours.ERROR);
      cy.get(loginPage.password).parent().find(loginPage.errorIcon).should('be.visible');
    });
    after(() => {
      cy.get(loginPage.errorClose).click();
    });
  });
});
