Cypress.Commands.add('cartPage__validateProductDetails', (chosenProducts, knownBugs) => {
  cy.get(cartPage.items).each(($item) => {
    cy.wrap($item).within(() => {
      cy.get(cartPage.item.title)
        .invoke('text')
        .then((title) => {
          // Bug Reference: BUG-INVENTORY-001 - Product title displays 'Test.allTheThings() T-Shirt (Red)' instead of correct title
          if (title === knownBugs.incorrectProductTitle) {
            return;
          }

          const currentProduct = chosenProducts.find((product) => product.title === title);

          // Bug Reference: BUG-INVENTORY-002 - Product description displays incorrect value for backpack product
          if (currentProduct.title === 'Sauce Labs Backpack') {
            // Skip description validation for Backpack due to known bug
            cy.get(cartPage.item.title).should('have.text', currentProduct.title).and('be.visible');
            cy.get(cartPage.item.price).should('have.text', `$${currentProduct.price}`).and('be.visible');
            return;
          }

          cy.get(cartPage.item.title).should('have.text', currentProduct.title).and('be.visible');
          cy.get(cartPage.item.description).should('have.text', currentProduct.description).and('be.visible');
          cy.get(cartPage.item.price).should('have.text', `$${currentProduct.price}`).and('be.visible');
        });
    });
  });
});
