Cypress.Commands.add('checkoutPage_FillDeliveryInfo', (user) => {
  const { firstName, lastName, zip } = user;
  cy.get(checkoutPage.firstName).type(firstName, { delay: 0 });
  cy.get(checkoutPage.lastName).type(lastName, { delay: 0 });
  cy.get(checkoutPage.zip).type(zip, { delay: 0 });
});
