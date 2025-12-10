Cypress.Commands.add('inventoryPage__selectSortOption', (sortOptionValue) => {
  cy.get(inventoryPage.sorting.container).click();
  cy.get(inventoryPage.sorting.dropdown).select(sortOptionValue);
});

Cypress.Commands.add('inventoryPage__verifySortingDropdown', (expectedValue) => {
  const sortKey = Object.keys(reqs.inventoryPage.sortOptions).find((key) => reqs.inventoryPage.sortOptions[key] === expectedValue);
  cy.get(inventoryPage.sorting.dropdown).should('have.value', expectedValue);
  cy.get(inventoryPage.sorting.currentOption).should('have.text', l10n.inventoryPage.sort.options[sortKey]);
});

Cypress.Commands.add('inventoryPage__addProductToCart', (productIndex) => {
  cy.get(inventoryPage.cards).eq(productIndex).find(inventoryPage.card.add).click();
});

Cypress.Commands.add('inventoryPage__removeProductFromCart', (productIndex) => {
  cy.get(inventoryPage.cards).eq(productIndex).find(inventoryPage.card.remove).click();
});

Cypress.Commands.add('inventoryPage__verifyCartBadge', (expectedCount) => {
  if (expectedCount === 0) {
    cy.get(headerComp.cartBadge).should('not.exist');
  } else {
    cy.get(headerComp.cartBadge).should('have.text', String(expectedCount)).and('be.visible');
  }
});

Cypress.Commands.add('inventoryPage__verifyProductImages', () => {
  cy.get(inventoryPage.card.image).each(($image) => {
    cy.wrap($image)
      .invoke('attr', 'src')
      .then((src) => {
        // Extract path from full URL if needed (e.g., https://domain.com/path -> /path)
        const srcPath = src.startsWith('http') ? new URL(src).pathname : src;

        // Extract base filename without hash (e.g., sauce-backpack-1200x1500)
        // Format: /static/media/filename-WIDTHxHEIGHT.hash.jpg -> filename-WIDTHxHEIGHT
        const srcBase = srcPath.split('/').pop().split('.')[0];

        const productExists = products.some((product) => {
          const productBase = product.src.split('/').pop().split('.')[0];
          return productBase === srcBase;
        });

        expect(productExists, `Product with src base "${srcBase}" should exist in products list`).to.eq(true);
      });
  });
});
