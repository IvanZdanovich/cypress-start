Cypress.Commands.add('headerComp_ResetAppState', () => {
  cy.get(headerComp.sidebar.open).scrollIntoView();
  cy.get(headerComp.sidebar.open).click({ animationDistanceThreshold: 20 });
  cy.get(headerComp.sidebar.resetAppState).click();
  cy.get(headerComp.sidebar.close).click();
  cy.reload();
});
