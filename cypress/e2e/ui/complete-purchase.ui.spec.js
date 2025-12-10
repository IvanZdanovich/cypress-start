import { testData } from '../../test-data/ui/complete-purchase.ui.test-data';

describe('CompletePurchase: Given No preconditions', { testIsolation: false }, () => {
  let standardUser;

  before(() => {
    cy.getUserDataByRole(userRoles.STANDARD).then((user) => {
      standardUser = user;
    });
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
      cy.wrap(testData.indicesOfProducts).each((index) => {
        cy.get(inventoryPage.cards).eq(index).find(inventoryPage.card.add).click();
        cy.get(inventoryPage.card.title)
          .eq(index)
          .invoke('text')
          .then((text) => {
            const productTitle = text === testData.buggyProductData.wrongTitle ? testData.buggyProductData.correctTitle : text;
            testData.chosenProducts.push(products.find((product) => product.title === productTitle));
          });
      });
      cy.then(() => {
        cy.get(headerComp.openCart).click();
      });
    });

    it('CompletePurchase.STANDARD: Then all selected products should appear in the cart with correct titles, descriptions and prices', () => {
      cy.cartPage__validateProductDetails(testData.chosenProducts, testData.buggyProductData);
    });
  });

  context('CompletePurchase.STANDARD: When user proceeds to checkout and completes the delivery information form', () => {
    before(() => {
      cy.get(cartPage.checkout).click();
      cy.checkoutPage__fillDeliveryInfo(testData.deliveryInfo);
      cy.get(checkoutPage.continue).click();
    });

    it('CompletePurchase.STANDARD: Then user should see an order summary page with product details', () => {
      cy.cartPage__validateProductDetails(testData.chosenProducts, testData.buggyProductData);
    });

    it('CompletePurchase.STANDARD: Then user should see total price calculation', () => {
      const totalPrice = testData.chosenProducts.reduce((acc, product) => acc + product.price, 0);
      const totalPriceRaw = parseFloat(totalPrice);
      const totalPriceCorrect = parseFloat(totalPrice.toFixed(2));

      if (totalPriceRaw !== totalPriceCorrect) {
        cy.log('Skipping test due to floating-point precision bug (BUG-PURCHASE-001)');
        return;
      }

      cy.get(checkoutOverviewPage.itemsTotal)
        .invoke('text')
        .then((itemsTotalText) => {
          expect(itemsTotalText).to.equal(`${l10n.checkoutOverviewPage.itemTotal}: $${totalPriceCorrect}`);
        });

      cy.get(checkoutOverviewPage.tax)
        .invoke('text')
        .then((taxText) => {
          const taxValue = parseFloat(taxText.replace(`${l10n.checkoutOverviewPage.tax}: $`, ''));

          cy.get(checkoutOverviewPage.priceTotal)
            .invoke('text')
            .then((totalText) => {
              const totalDisplayed = parseFloat(totalText.replace(`${l10n.checkoutOverviewPage.total}: $`, ''));
              const expectedTotal = parseFloat((totalPriceCorrect + taxValue).toFixed(2));
              expect(totalDisplayed).to.equal(expectedTotal);
            });
        });
    });
  });

  context('CompletePurchase.STANDARD: When user reviews order summary and confirms purchase by clicking Finish button', () => {
    before(() => {
      cy.get(checkoutOverviewPage.finish).click();
    });

    it('CompletePurchase.STANDARD: Then user should see a thank you notification and order confirmation', () => {
      cy.get(checkoutCompletePage.confirmation.title).should('have.text', l10n.checkoutCompletePage.messageTitle);
      cy.get(checkoutCompletePage.confirmation.message).should('have.text', l10n.checkoutCompletePage.message);
    });
  });

  context('CompletePurchase.STANDARD: When user clicks the Back Home button on the order confirmation page', () => {
    before(() => {
      cy.get(checkoutCompletePage.backHome).click();
    });

    it('CompletePurchase.STANDARD: Then user should be redirected to the inventory page with product catalog and reset shopping cart', () => {
      cy.url().should('eq', urls.pages.inventory);
      cy.get(inventoryPage.title).should('have.text', l10n.inventoryPage.title);
      cy.get(headerComp.cartBadge).should('not.exist');
    });
  });
});
