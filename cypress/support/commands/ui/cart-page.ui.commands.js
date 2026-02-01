Cypress.Commands.add('cartPage__validateProductDetails', (chosenProducts, buggyProductData) => {
  chosenProducts.forEach((product) => {
    if (product.title.includes(buggyProductData.correctTitle)) {
      return;
    }
    cy.get(cartPage.item.title)
      .contains(product.title)
      .parent()
      .parent()
      .parent()
      .within(() => {
        if (product.title === 'Sauce Labs Backpack') {
          cy.get(cartPage.item.title).should('have.text', product.title).and('be.visible');
          cy.get(cartPage.item.price).should('have.text', `$${product.price}`).and('be.visible');
          return;
        }
        cy.get(cartPage.item.title).should('have.text', product.title).and('be.visible');
        cy.get(cartPage.item.description).should('have.text', product.description).and('be.visible');
        cy.get(cartPage.item.price).should('have.text', `$${product.price}`).and('be.visible');
      });
  });
});
