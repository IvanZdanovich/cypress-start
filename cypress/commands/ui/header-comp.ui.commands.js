Cypress.Commands.add('headerComp__resetAppState', () => {
  cy.then(() => {
    cy.get(headerComp.sidebar.open).scrollIntoView();
    cy.get(headerComp.sidebar.open).click({ animationDistanceThreshold: 1 });
  });
  cy.then(() => {
    cy.get(headerComp.sidebar.resetAppState).click({ animationDistanceThreshold: 1 });
    cy.get(headerComp.sidebar.close).click();
    cy.reload();
  });
});

Cypress.Commands.add('headerComp__logOut', () => {
  cy.get(headerComp.sidebar.open).click();
  cy.get(headerComp.sidebar.logout).click();
});

Cypress.Commands.add('headerComp__verifyCartBadge', (expectedCount) => {
  if (expectedCount === 0) {
    cy.get(headerComp.cartBadge).should('not.exist');
  } else {
    cy.get(headerComp.cartBadge).should('have.text', String(expectedCount)).and('be.visible');
  }
});
