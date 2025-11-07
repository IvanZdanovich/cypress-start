Cypress.Commands.add('footerComp__verifySocialLinks', () => {
  cy.get(footerComp.linkedin).should('have.attr', 'href', urls.external.linkedin).and('have.attr', 'target', '_blank').and('be.visible');

  // Bug Reference: BUG-FOOTER-001 - Twitter link uses outdated twitter.com URL
  cy.get(footerComp.twitter).should('have.attr', 'href', 'https://twitter.com/saucelabs').and('have.attr', 'target', '_blank').and('be.visible');

  cy.get(footerComp.facebook).should('have.attr', 'href', urls.external.facebook).and('have.attr', 'target', '_blank').and('be.visible');
});

Cypress.Commands.add('footerComp__verifyCopyright', () => {
  const currentYear = new Date().getUTCFullYear();
  cy.get(footerComp.copyRight).should('have.text', l10n.footer.copyRight.replace('yearPlaceholder', currentYear)).and('be.visible');
});
