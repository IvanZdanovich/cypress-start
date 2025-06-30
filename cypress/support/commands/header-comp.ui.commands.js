Cypress.Commands.add('headerComp_ResetAppState', () => {
  cy.get(headerComp.sidebar.open).scrollIntoView();
  cy.then(() => {
    cy.get(headerComp.sidebar.open).click({ animationDistanceThreshold: 20 });
  });
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
