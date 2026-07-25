Cypress.Commands.add('cartPage__validateProductDetails', (chosenProducts, buggyProductData) => {
  chosenProducts.forEach((product) => {
    if (product.title === buggyProductData.correctTitle) {
      return;
    }
    cy.get(cartPage.item.title)
      .contains(product.title)
      .parent()
      .parent()
      .parent()
      .within(() => {
        cy.get(cartPage.item.title).should('have.text', product.title).and('be.visible');
        cy.get(cartPage.item.description).should('have.text', product.description).and('be.visible');
        cy.get(cartPage.item.price).should('have.text', `$${product.price}`).and('be.visible');
      });
  });
});

/**
 * Iterates over cart item titles and asserts each one exists in the given chosenProducts array.
 * Skips the known buggy product title (BUG-INVENTORY-001).
 */
Cypress.Commands.add('cartPage__validateChosenProductTitles', (chosenProducts, buggyProductData) => {
  cy.get(cartPage.item.title).each(($title) => {
    cy.wrap($title)
      .invoke('text')
      .then((title) => {
        if (title === buggyProductData.wrongTitle) return;
        const found = chosenProducts.find((p) => p && p.title === title);
        expect(found, `Product "${title}" should be in chosen products`).to.not.eq(undefined);
      });
  });
});

/**
 * Asserts that a removed product is no longer present in the cart.
 * When remainingCount is 0, asserts the cart has no items.
 * Otherwise, asserts none of the remaining items has the removed product's title.
 */
Cypress.Commands.add('cartPage__verifyProductRemoved', (removedTitle, remainingCount) => {
  if (remainingCount === 0) {
    cy.get(cartPage.items).should('not.exist');
    return;
  }
  cy.get(cartPage.items).each(($item) => {
    cy.wrap($item).find(cartPage.item.title).should('not.have.text', removedTitle);
  });
});
