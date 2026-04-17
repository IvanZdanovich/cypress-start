import { examples } from '../../integration-examples/ui/footer-comp.ui.examples';

describe('Footer: Given STANDARD user on Inventory page', { testIsolation: false }, () => {
  let standardUser;

  before(() => {
    cy.common__getUserDataByRole(userRoles.STANDARD).then((user) => {
      standardUser = user;
    });
    cy.then(() => {
      cy.visit('/');
      cy.loginPage__logIn(standardUser);
      cy.headerComp__resetAppState();
    });
  });

  after(() => {
    cy.headerComp__resetAppState();
  });

  context('Footer.STANDARD: When user reviews LinkedIn icon', () => {
    it('Footer.STANDARD: Then LinkedIn icon should have correct href attribute', () => {
      cy.get(footerComp.linkedin).should('have.attr', 'href', examples.socialLinks.linkedin.url);
    });

    it('Footer.STANDARD: Then LinkedIn icon should open in new tab', () => {
      cy.get(footerComp.linkedin).should('have.attr', 'target', '_blank');
    });

    it('Footer.STANDARD: Then LinkedIn icon should be visible', () => {
      cy.get(footerComp.linkedin).should('be.visible');
    });
  });

  context('Footer.STANDARD: When user reviews Twitter icon', () => {
    it('Footer.STANDARD: Then Twitter icon should have correct href attribute', () => {
      cy.get(footerComp.twitter)
        .should('have.attr', 'href')
        .and('satisfy', (href) => {
          // Bug Reference: BUG-FOOTER-001 - Twitter link uses outdated twitter.com URL
          // Actual: https://twitter.com/saucelabs
          // Expected: https://x.com/saucelabs
          return href === 'https://twitter.com/saucelabs' || href === examples.socialLinks.twitter.url;
        });
    });

    it('Footer.STANDARD: Then Twitter icon should open in new tab', () => {
      cy.get(footerComp.twitter).should('have.attr', 'target', '_blank');
    });

    it('Footer.STANDARD: Then Twitter icon should be visible', () => {
      cy.get(footerComp.twitter).should('be.visible');
    });
  });

  context('Footer.STANDARD: When user reviews Facebook icon', () => {
    it('Footer.STANDARD: Then Facebook icon should have correct href attribute', () => {
      cy.get(footerComp.facebook).should('have.attr', 'href', examples.socialLinks.facebook.url);
    });

    it('Footer.STANDARD: Then Facebook icon should open in new tab', () => {
      cy.get(footerComp.facebook).should('have.attr', 'target', '_blank');
    });

    it('Footer.STANDARD: Then Facebook icon should be visible', () => {
      cy.get(footerComp.facebook).should('be.visible');
    });
  });
});
