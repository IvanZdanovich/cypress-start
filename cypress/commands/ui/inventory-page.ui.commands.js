import { SORT_OPTIONS } from '../../constants/ui/inventory-page.ui.constraints';

const SORT_L10N_KEY = {
  [SORT_OPTIONS.nameAscending]: 'inventoryPage.sort.options.nameAscending',
  [SORT_OPTIONS.nameDescending]: 'inventoryPage.sort.options.nameDescending',
  [SORT_OPTIONS.priceAscending]: 'inventoryPage.sort.options.priceAscending',
  [SORT_OPTIONS.priceDescending]: 'inventoryPage.sort.options.priceDescending',
};

Cypress.Commands.add('inventoryPage__selectSortOption', (sortOptionValue) => {
  cy.get(inventoryPage.sorting.container).click();
  cy.get(inventoryPage.sorting.dropdown).select(sortOptionValue);
});

Cypress.Commands.add('inventoryPage__verifySortingDropdown', (expectedValue) => {
  cy.get(inventoryPage.sorting.dropdown).should('have.value', expectedValue);
  cy.get(inventoryPage.sorting.currentOption).should('have.text', l10n[SORT_L10N_KEY[expectedValue]]);
});

Cypress.Commands.add('inventoryPage__addProductToCart', (productIndex) => {
  cy.get(inventoryPage.cards).eq(productIndex).find(inventoryPage.card.add).click();
});

Cypress.Commands.add('inventoryPage__removeProductFromCart', (productIndex) => {
  cy.get(inventoryPage.cards).eq(productIndex).find(inventoryPage.card.remove).click();
});

Cypress.Commands.add('inventoryPage__verifyProductImages', () => {
  cy.get(inventoryPage.card.image).each(($image) => {
    cy.wrap($image).should('be.visible').and('have.attr', 'src').and('not.be.empty');
  });
});

Cypress.Commands.add('inventoryPage__collectAndAddProductsToCart', (indices, chosenProducts, buggyProductData) => {
  cy.wrap(indices).each((index) => {
    cy.get(inventoryPage.cards)
      .eq(index)
      .within(() => {
        cy.get(inventoryPage.card.title).invoke('text').as('title');
        cy.get(inventoryPage.card.description).invoke('text').as('description');
        cy.get(inventoryPage.card.price).invoke('text').as('priceText');

        cy.then(function () {
          const isBuggy = this.title === buggyProductData.wrongTitle;
          chosenProducts.push({
            title: isBuggy ? buggyProductData.correctTitle : this.title,
            description: isBuggy ? undefined : this.description,
            price: parseFloat(this.priceText.replace('$', '')),
          });
        });

        cy.get(inventoryPage.card.add).click();
      });
  });
});
