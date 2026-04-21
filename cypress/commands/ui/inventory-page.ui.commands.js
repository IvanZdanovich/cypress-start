import { SORT_OPTIONS } from '../../constants/ui/inventory-page.ui.constraints';

Cypress.Commands.add('inventoryPage__selectSortOption', (sortOptionValue) => {
  cy.get(inventoryPage.sorting.container).click();
  cy.get(inventoryPage.sorting.dropdown).select(sortOptionValue);
});

Cypress.Commands.add('inventoryPage__verifySortingDropdown', (expectedValue) => {
  const sortKey = Object.keys(SORT_OPTIONS).find((key) => SORT_OPTIONS[key] === expectedValue);
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
    cy.wrap($image).should('be.visible').and('have.attr', 'src').and('not.be.empty');
  });
});
