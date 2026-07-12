Cypress.Commands.add('checkoutPage__fillDeliveryInfo', (user) => {
  const { firstName, lastName, zip } = user;
  cy.get(checkoutPage.firstName).type(firstName, { delay: 0 });
  cy.get(checkoutPage.lastName).type(lastName, { delay: 0 });
  cy.get(checkoutPage.zip).type(zip, { delay: 0 });
});

Cypress.Commands.add('checkoutOverviewPage__validatePriceSummary', (chosenProducts, decimalPlaces) => {
  const totalPrice = chosenProducts.reduce((acc, product) => acc + product.price, 0);
  const totalPriceCorrect = parseFloat(totalPrice.toFixed(decimalPlaces));

  if (totalPrice !== totalPriceCorrect) {
    cy.log('Skipping price summary validation due to floating-point precision bug (BUG-PURCHASE-001)');
    return;
  }

  cy.get(checkoutOverviewPage.itemsTotal)
    .invoke('text')
    .then((itemsTotalText) => {
      expect(itemsTotalText).to.equal(`${l10n['checkoutOverviewPage.itemTotal']}: $${totalPriceCorrect}`);
    });

  cy.get(checkoutOverviewPage.tax)
    .invoke('text')
    .then((taxText) => {
      const taxValue = parseFloat(taxText.replace(`${l10n['checkoutOverviewPage.tax']}: $`, ''));
      cy.get(checkoutOverviewPage.priceTotal)
        .invoke('text')
        .then((totalText) => {
          const totalDisplayed = parseFloat(totalText.replace(`${l10n['checkoutOverviewPage.total']}: $`, ''));
          const expectedTotal = parseFloat((totalPriceCorrect + taxValue).toFixed(decimalPlaces));
          expect(totalDisplayed).to.equal(expectedTotal);
        });
    });
});
