Cypress.Commands.add('headerComp__resetAppState', () => {
  cy.get(headerComp.sidebar.open).scrollIntoView();
  cy.get(headerComp.sidebar.open).click({ animationDistanceThreshold: 20 });
  cy.get(headerComp.sidebar.resetAppState).click();
  cy.get(headerComp.sidebar.close).click();
  cy.reload();
});

Cypress.Commands.add('headerComp__logOut', () => {
  cy.get(headerComp.sidebar.open).click();
  cy.get(headerComp.sidebar.logout).click();
});
