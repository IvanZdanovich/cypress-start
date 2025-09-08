describe('Footer: Given STANDARD user on Inventory page', { testIsolation: false }, () => {
  let standardUser;
  before(() => {
    cy.getUserDataByRole(userRoles.STANDARD).then((user) => {
      standardUser = user;
    });
    cy.then(() => {
      cy.visit('/');
      cy.loginPage_Login(standardUser);
    });
  });

  context('Footer.STANDARD: When user clicks on LinkedIn icon', () => {
    before(() => {
      cy.get(footerComp.linkedin).invoke('removeAttr', 'target');
      // Add uncaught:exception event listener
      cy.on('uncaught:exception', () => {
        // Return false to prevent Cypress from failing the test
        // TODO: fix the bug buglog.backtraceApi_UnauthorizedError
        return false;
      });
      cy.then(() => {
        cy.get(footerComp.linkedin).click();
      });
    });
    it('Footer.STANDARD: Then user should be redirected to LinkedIn page', () => {
      cy.url().should('contain', urls.external.linkedinBase);
    });
    after(() => {
      cy.go('back');
    });
  });

  context('Footer.STANDARD: When user clicks on Twitter icon', () => {
    before(() => {
      cy.get(footerComp.twitter).invoke('removeAttr', 'target');
      // Add uncaught:exception event listener
      cy.on('uncaught:exception', () => {
        // Return false to prevent Cypress from failing the test
        // TODO: fix the bug buglog.backtraceApi_UnauthorizedError
        return false;
      });
      cy.then(() => {
        cy.get(footerComp.twitter).click();
      });
    });
    it('Footer.STANDARD: Then user should be redirected to Twitter page', () => {
      cy.url().should('contain', urls.external.twitter);
    });
    after(() => {
      cy.go('back');
    });
  });

  context('Footer.STANDARD: When user clicks on Facebook icon', () => {
    before(() => {
      cy.get(footerComp.facebook).invoke('removeAttr', 'target');
      // Add uncaught:exception event listener
      cy.on('uncaught:exception', () => {
        // Return false to prevent Cypress from failing the test
        // TODO: fix the bug buglog.backtraceApi_UnauthorizedError
        return false;
      });
      cy.then(() => {
        cy.get(footerComp.facebook).click();
      });
    });
    it('Footer.STANDARD: Then user should be redirected to Facebook page', () => {
      cy.url().should('contain', urls.external.facebook);
    });
    after(() => {
      cy.go('back');
    });
  });
});
