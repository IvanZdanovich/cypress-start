Cypress.Commands.add('headerComp_ResetAppState', () => {
  cy.get(headerComp.sidebar.open).scrollIntoView().click();
  cy.then(() => {
    cy.get(headerComp.sidebar.resetAppState).click();
  });
  cy.then(() => {
    cy.get(headerComp.sidebar.close).click();
  });
  cy.then(() => {
    cy.reload();
  });
});
