Cypress.Commands.add('footerComp__verifyCopyright', () => {
  const currentYear = new Date().getUTCFullYear();
  cy.get(footerComp.copyRight).should('have.text', l10n['footer.copyRight'].replace('yearPlaceholder', currentYear)).and('be.visible');
});
