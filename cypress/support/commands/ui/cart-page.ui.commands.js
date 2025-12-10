Cypress.Commands.add('cartPage__validateProductDetails', (chosenProducts, buggyProductData) => {
  cy.get(cartPage.items).each(($item) => {
    cy.wrap($item).within(() => {
      cy.get(cartPage.item.title)
        .invoke('text')
        .then((title) => {
          if (title === buggyProductData.wrongTitle) {
            return;
          }

          const currentProduct = chosenProducts.find((product) => product.title === title);

          if (currentProduct.title === 'Sauce Labs Backpack') {
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
