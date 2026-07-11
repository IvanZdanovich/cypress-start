import { completePurchase__examples as examples } from '../../e2e-examples/ui/purchasing.complete-purchase.ui.examples';
import { PRICE_DECIMAL_PLACES } from '../../constants/ui/common.ui.constraints';

describe('CompletePurchase: Given No preconditions', { testIsolation: false }, () => {
  let standardUser;

  before(() => {
    cy.common__getUserDataByRole(userRoles.STANDARD).then((user) => { standardUser = user; });
    cy.then(() => {
      cy.visit('/');
      cy.loginPage__logIn(standardUser);
      cy.headerComp__resetAppState();
    });
  });
  after(() => {
    cy.headerComp__resetAppState();
  });

  context('CompletePurchase.STANDARD: When user adds multiple products to the shopping cart', () => {
    before(() => {
      cy.inventoryPage__collectAndAddProductsToCart(examples.indicesOfProducts, examples.chosenProducts, examples.buggyProductData);
      cy.get(headerComp.openCart).click();
    });
    it('CompletePurchase.STANDARD: Then all selected products should appear in the cart with correct titles, descriptions and prices', () => {
      cy.cartPage__validateProductDetails(examples.chosenProducts, examples.buggyProductData);
    });
  });

  context('CompletePurchase.STANDARD: When user proceeds to checkout and completes the delivery information form', () => {
    before(() => {
      cy.get(cartPage.checkout).click();
      cy.checkoutPage__fillDeliveryInfo(examples.deliveryInfo);
      cy.get(checkoutPage.continue).click();
    });
    it('CompletePurchase.STANDARD: Then user should see an order summary page with product details', () => {
      cy.cartPage__validateProductDetails(examples.chosenProducts, examples.buggyProductData);
    });
    it('CompletePurchase.STANDARD: Then user should see total price calculation', () => {
      cy.checkoutOverviewPage__validatePriceSummary(examples.chosenProducts, PRICE_DECIMAL_PLACES);
    });
  });

  context('CompletePurchase.STANDARD: When user reviews order summary and confirms purchase by clicking Finish button', () => {
    before(() => {
      cy.get(checkoutOverviewPage.finish).click();
    });
    it('CompletePurchase.STANDARD: Then user should see a thank you notification and order confirmation', () => {
      cy.get(checkoutCompletePage.confirmation.title).should('have.text', l10n['checkoutCompletePage.messageTitle']);
      cy.get(checkoutCompletePage.confirmation.message).should('have.text', l10n['checkoutCompletePage.message']);
    });
  });

  context('CompletePurchase.STANDARD: When user clicks the Back Home button on the order confirmation page', () => {
    before(() => {
      cy.get(checkoutCompletePage.backHome).click();
    });
    it('CompletePurchase.STANDARD: Then user should be redirected to the inventory page with product catalog and reset shopping cart', () => {
      cy.url().should('eq', urls.pages.inventory);
      cy.get(inventoryPage.title).should('have.text', l10n['inventoryPage.title']);
      cy.get(headerComp.cartBadge).should('not.exist');
    });
  });
});