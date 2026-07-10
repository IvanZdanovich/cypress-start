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

Cypress.Commands.add('inventoryPage__verifyCartBadge', (expectedCount) => {
  if (expectedCount === 0) {
    cy.get(headerComp.cartBadge).should('not.exist');
  } else {
    cy.get(headerComp.cartBadge).should('have.text', String(expectedCount)).and('be.visible');
  }
});

Cypress.Commands.add('inventoryPage__verifyProductImages', () => {
  cy.get(inventoryPage.card.image).each(($image) => {
    cy.wrap($image).should('be.visible').and('have.attr', 'src').and('not.be.empty');
  });
});
