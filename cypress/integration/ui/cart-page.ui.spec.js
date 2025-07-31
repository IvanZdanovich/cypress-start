import { test_data } from '../../test-data/cart-page.test-data';

describe('CartPage: Given STANDARD user on Cart page and no products are added to cart', { testIsolation: false }, () => {
  let standardUser;
  before(() => {
    cy.getUserDataByRole(userRoles.STANDARD).then((user) => {
      standardUser = user;
    });
    cy.visit('/');
    cy.then(() => {
      cy.loginPage_Login(standardUser);
    });
    cy.then(() => {
      cy.headerComp_ResetAppState();
    });
  });

  after(() => {
    cy.headerComp_ResetAppState();
  });

  context('CartPage.STANDARD: When user visits the page', () => {
    before(() => {
      cy.get(headerComp.openCart).click();
    });
    it('CartPage.STANDARD: Then Cart page URL should be displayed', () => {
      cy.url().should('eq', urls.pages.cart);
    });
    it('CartPage.STANDARD: Then Cart page title should be displayed', () => {
      cy.get(cartPage.title).should('have.text', l10n.cartPage.title);
    });
    it('CartPage.STANDARD: Then no items should be displayed', () => {
      cy.get(cartPage.items).should('not.exist');
    });
    it('CartPage.STANDARD: Then Continue Shopping button is displayed', () => {
      cy.get(cartPage.continueShopping).should('have.text', l10n.cartPage.continueShopping).and('be.visible').and('be.enabled');
    });
    it(`CartPage.STANDARD: Then Checkout button is displayed\n${JSON.stringify(bugLog.cartPage_EmptyCartCheckout)}`, () => {
      // TODO: fix the bug buglog.cartPage_EmptyCartCheckout
      cy.get(cartPage.checkout).should('have.text', l10n.cartPage.checkout).and('be.visible').and('be.enabled');
    });
    it('CartPage.STANDARD: Then Quantity table header should be displayed', () => {
      cy.get(cartPage.quantityLabel).should('have.text', l10n.cartPage.quantity).and('be.visible');
    });
    it('CartPage.STANDARD: Then Description table header should be displayed', () => {
      cy.get(cartPage.descriptionLabel).should('have.text', l10n.cartPage.description).and('be.visible');
    });
    it('CartPage.Footer.STANDARD: Then LinkedIn icon with link should be displayed', () => {
      cy.get(footerComp.linkedin).should('have.attr', 'href', urls.external.linkedin).and('have.attr', 'target', '_blank').and('be.visible');
    });
    it(`CartPage.Footer.STANDARD: Then Twitter icon with link should be displayed\n${JSON.stringify(bugLog.footerComp_OutdatedTwitterLink)}`, () => {
      // TODO: fix the bug buglog.footerComp_OutdatedTwitterLink
      cy.get(footerComp.twitter).should('have.attr', 'href', 'https://twitter.com/saucelabs').and('have.attr', 'target', '_blank').and('be.visible');
    });
    it('CartPage.Footer.STANDARD: Then Facebook icon with link should be displayed', () => {
      cy.get(footerComp.facebook).should('have.attr', 'href', urls.external.facebook).and('have.attr', 'target', '_blank').and('be.visible');
    });
    it('CartPage.Footer.STANDARD: Then the Copyright notice with actual year should be displayd', () => {
      cy.get(footerComp.copyRight).should('have.text', l10n.footer.copyRight.replace('yearPlaceholder', new Date().getUTCFullYear())).and('be.visible');
    });
    it.skip(`CartPage.Footer.STANDARD: Then Terms Of Service link should be displayed\n${JSON.stringify(bugLog.footerComp_TermsOfServiceLink)}`, () => {
      // TODO: fix the bug buglog.footerComp_TermsOfServiceLink
    });
    it.skip(`CartPage.Footer.STANDARD: Then Privacy Policy link should be displayed\n${JSON.stringify(bugLog.footerComp_PrivacyPolicyLink)}`, () => {
      // TODO: fix the bug buglog.footerComp_PrivacyPolicyLink
    });
  });

  context('CartPage.STANDARD: When user clicks Continue Shopping button', () => {
    before(() => {
      cy.get(cartPage.continueShopping).click();
    });
    it('CartPage.STANDARD: Then user should be redirected to the Inventory page', () => {
      cy.url().should('eq', urls.pages.inventory);
      cy.get(inventoryPage.title).should('have.text', l10n.inventoryPage.title);
    });
  });

  context('CartPage.STANDARD: When user adds random products and clicks Cart button', () => {
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
    it('CartPage.STANDARD: Then user should be redirected to the Cart page', () => {
      cy.url().should('eq', urls.pages.cart);
      cy.get(cartPage.title).should('have.text', l10n.cartPage.title);
    });
    it('CartPage.STANDARD: Then number of items should correspond to the number of chosen products', () => {
      cy.get(cartPage.items).should('have.length', test_data.indicesOfProducts.length);
    });
    it('CartPage.STANDARD: Then the Cart button with an appropriate number on the badge is displayed', () => {
      cy.get(headerComp.cartBadge).should('have.text', test_data.indicesOfProducts.length).and('be.visible');
    });
    it('CartPage.STANDARD: Then Checkout button is displayed', () => {
      cy.get(cartPage.checkout).should('have.text', l10n.cartPage.checkout).and('be.visible').and('be.enabled');
    });
    it('CartPage.STANDARD: Then Continue Shopping button is displayed', () => {
      cy.get(cartPage.continueShopping).should('have.text', l10n.cartPage.continueShopping).and('be.visible').and('be.enabled');
    });
    it('CartPage.STANDARD: Then Quantity table header should be displayed', () => {
      cy.get(cartPage.quantityLabel).should('have.text', l10n.cartPage.quantity).and('be.visible');
    });
    it('CartPage.STANDARD: Then Description table header should be displayed', () => {
      cy.get(cartPage.descriptionLabel).should('have.text', l10n.cartPage.description).and('be.visible');
    });
    it('CartPage.STANDARD: Then on each item Remove button should be displayed', () => {
      cy.get(cartPage.items).each(($item) => {
        cy.wrap($item).within(() => {
          cy.get(cartPage.item.remove).should('have.text', l10n.cartPage.remove).and('be.visible').and('be.enabled');
        });
      });
    });
    it(`CartPage.STANDARD: Then on each item should have appropriate title, description and price\n${JSON.stringify(bugLog.inventoryPage_cardTitleNotValidated)}`, () => {
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

  context('CartPage.STANDARD: When user clicks Remove button on random item', () => {
    before(() => {
      test_data.randomIndex = utils.getRandomNumber(0, test_data.indicesOfProducts.length - 1);
      cy.get(cartPage.items)
        .eq(test_data.randomIndex)
        .within(() => {
          cy.get(cartPage.item.title)
            .invoke('text')
            .then((title) => {
              test_data.removedProductTitle = title;
            });
          cy.then(() => {
            cy.get(cartPage.item.remove).click();
          });
        });
    });
    it('CartPage.STANDARD: Then the number of products is decreased', () => {
      cy.get(cartPage.items).should('have.length', test_data.indicesOfProducts.length - 1);
    });
    it('CartPage.STANDARD: Then the Cart button with an appropriate number on the badge is displayed', () => {
      cy.get(headerComp.cartBadge)
        .should('have.text', test_data.indicesOfProducts.length - 1)
        .and('be.visible');
    });
    it('CartPage.STANDARD: Then the removed product is not displayed', () => {
      cy.get(cartPage.items).each(($item) => {
        cy.wrap($item).within(() => {
          cy.get(cartPage.item.title).should('not.have.text', test_data.removedProductTitle);
        });
      });
    });
  });

  context('CartPage.STANDARD: When user clicks Checkout button', () => {
    before(() => {
      cy.get(cartPage.checkout).click();
    });
    it('CartPage.STANDARD: Then user should be redirected to the Checkout page', () => {
      cy.url().should('eq', urls.pages.checkout);
      cy.get(checkoutPage.title).should('have.text', l10n.checkoutPage.title);
    });
  });
});
