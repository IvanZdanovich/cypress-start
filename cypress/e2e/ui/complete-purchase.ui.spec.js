import { test_data } from '../../test-data/ui/complete-purchase.ui.test-data';

describe('CompletePurchase: Given STANDARD user on Inventory page', { testIsolation: false }, () => {
  let standardUser;
  before(() => {
    cy.getUserDataByRole(userRoles.STANDARD).then((user) => {
      standardUser = user;
    });
    cy.then(() => {
      cy.visit('/');
      cy.loginPage_Login(standardUser);
      cy.headerComp_ResetAppState();
    });
  });

  after(() => {
    cy.headerComp_ResetAppState();
  });

  context('CompletePurchase.STANDARD: When user adds multiple products to the shopping cart', () => {
    before(() => {
      test_data.indicesOfProducts.forEach((index) => {
        cy.get(inventoryPage.cards).eq(index).find(inventoryPage.card.add).click();
        cy.get(inventoryPage.card.title)
          .eq(index)
          .invoke('text')
          .then((text) => {
            if (text === 'Test.allTheThings() T-Shirt (Red)') {
              text = 'Sauce Labs T-Shirt (Red)';
            }
            test_data.chosenProducts.push(products.find((product) => product.title === text));
          });
      });
      cy.then(() => {
        cy.get(headerComp.openCart).click();
      });
    });
    it(`CompletePurchase.STANDARD: Then all selected products should appear in the cart with correct titles, descriptions and prices\n${JSON.stringify(bugLog.inventoryPage_cardTitleNotValidated)}`, () => {
      cy.get(cartPage.items).each(($item) => {
        cy.wrap($item).within(() => {
          cy.get(cartPage.item.title)
            .invoke('text')
            .then((title) => {
              // TODO: fix the bug buglog.inventoryPage_cardTitleNotValidated
              if (title === 'Test.allTheThings() T-Shirt (Red)') {
                return;
              }
              const currentProduct = test_data.chosenProducts.find((product) => product.title === title);
              // TODO: fix the bug buglog.inventoryPage_cardDescriptionNotValidated
              if (
                currentProduct.description ===
                'Carry all your essentials with the sleek and streamlined Sauce Labs Backpack. This stylish pack offers unparalleled protection for your laptop and tablet, ensuring your devices stay safe while you stay fashionable.'
              ) {
                return;
              }
              cy.then(() => {
                cy.get(cartPage.item.title).should('have.text', currentProduct.title).and('be.visible');
                cy.get(cartPage.item.description).should('have.text', currentProduct.description).and('be.visible');
                cy.get(cartPage.item.price).should('have.text', `$${currentProduct.price}`).and('be.visible');
              });
            });
        });
      });
    });
  });

  context('CompletePurchase.STANDARD: When user proceeds to checkout and completes the delivery information form', () => {
    before(() => {
      cy.get(cartPage.checkout).click();
      cy.checkoutPage_FillDeliveryInfo(test_data.user);
      cy.get(checkoutPage.continue).click();
    });
    it('CompletePurchase.STANDARD: Then user should see an order summary page with product details', () => {
      cy.get(cartPage.items).each(($item) => {
        cy.wrap($item).within(() => {
          cy.get(cartPage.item.title)
            .invoke('text')
            .then((title) => {
              // TODO: fix the bug buglog.inventoryPage_cardTitleNotValidated
              if (title === 'Test.allTheThings() T-Shirt (Red)') {
                return;
              }
              const currentProduct = test_data.chosenProducts.find((product) => product.title === title);
              // TODO: fix the bug buglog.inventoryPage_cardDescriptionNotValidated
              if (
                currentProduct.description ===
                'Carry all your essentials with the sleek and streamlined Sauce Labs Backpack. This stylish pack offers unparalleled protection for your laptop and tablet, ensuring your devices stay safe while you stay fashionable.'
              ) {
                return;
              }
              cy.then(() => {
                cy.get(cartPage.item.title).should('have.text', currentProduct.title).and('be.visible');
                cy.get(cartPage.item.description).should('have.text', currentProduct.description).and('be.visible');
                cy.get(cartPage.item.price).should('have.text', `$${currentProduct.price}`).and('be.visible');
              });
            });
        });
      });
    });
    it(`CompletePurchase.STANDARD: Then user should see total price calculation\n${JSON.stringify(bugLog.checkoutOverviewPage_FloatingPointPrecisionIssues)}`, () => {
      // TODO: fix the bug buglog.checkoutOverviewPage_FloatingPointPrecisionIssues
      const totalPrice = test_data.chosenProducts.reduce((acc, product) => acc + product.price, 0);
      const totalPriceRaw = parseFloat(totalPrice);
      const totalPriceCorrect = parseFloat(totalPrice.toFixed(2));
      if (totalPriceRaw !== totalPriceCorrect) {
        return;
      }
      let taxValue = 0;
      cy.get(checkoutOverviewPage.itemsTotal)
        .invoke('text')
        .then((price) => {
          expect(price).to.equal(`${l10n.checkoutOverviewPage.itemTotal}: $${totalPriceCorrect}`);
        });
      cy.get(checkoutOverviewPage.tax)
        .invoke('text')
        .then((taxText) => {
          taxValue = parseFloat(taxText.replace(`${l10n.checkoutOverviewPage.tax}: $`, ''));
          cy.then(() => {
            cy.get(checkoutOverviewPage.priceTotal)
              .invoke('text')
              .then((itemsTotal) => {
                const price = parseFloat(itemsTotal.replace(`${l10n.checkoutOverviewPage.total}: $`, ''));
                const expectedTotal = totalPriceCorrect + taxValue;
                expect(price).to.equal(expectedTotal);
              });
          });
        });
    });
  });

  context('CompletePurchase.STANDARD: When user reviews order summary and confirms purchase by clicking Finish button', () => {
    before(() => {
      cy.get(checkoutOverviewPage.finish).click();
    });
    it('CompletePurchase.STANDARD: Then user should see a thank you message and order confirmation', () => {
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
