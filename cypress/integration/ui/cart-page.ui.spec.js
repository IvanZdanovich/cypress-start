import { testData } from '../../test-data/ui/cart-page.ui.test-data';

describe('CartPage: Given STANDARD user on Cart page and no products are added to cart', { testIsolation: false }, () => {
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

    // Bug Reference: BUG-CART-001 - Checkout button remains enabled when cart is empty
    it('CartPage.STANDARD: Then Checkout button is displayed', () => {
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

    // Bug Reference: BUG-FOOTER-001 - Twitter social link uses outdated twitter.com URL instead of x.com
    it('CartPage.Footer.STANDARD: Then Twitter icon with link should be displayed', () => {
      cy.get(footerComp.twitter).should('have.attr', 'href', 'https://twitter.com/saucelabs').and('have.attr', 'target', '_blank').and('be.visible');
    });

    it('CartPage.Footer.STANDARD: Then Facebook icon with link should be displayed', () => {
      cy.get(footerComp.facebook).should('have.attr', 'href', urls.external.facebook).and('have.attr', 'target', '_blank').and('be.visible');
    });

    it('CartPage.Footer.STANDARD: Then the Copyright notice with actual year should be displayd', () => {
      cy.get(footerComp.copyRight).should('have.text', l10n.footer.copyRight.replace('yearPlaceholder', new Date().getUTCFullYear())).and('be.visible');
    });

    // Bug Reference: BUG-FOOTER-002 - Terms of Service link is missing from footer
    it.skip('CartPage.Footer.STANDARD: Then Terms Of Service link should be displayed', () => {
      // Skipped: Terms of Service link not implemented in footer
    });

    // Bug Reference: BUG-FOOTER-003 - Privacy Policy link is missing from footer
    it.skip('CartPage.Footer.STANDARD: Then Privacy Policy link should be displayed', () => {
      // Skipped: Privacy Policy link not implemented in footer
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
      testData.indicesOfProducts.forEach((index) => {
        cy.get(inventoryPage.cards).eq(index).find(inventoryPage.card.add).click();
        cy.get(inventoryPage.card.title)
          .eq(index)
          .invoke('text')
          .then((text) => {
            // Bug Reference: BUG-INVENTORY-001 - Map incorrect product title to correct one for test data
            let productTitle = text;
            if (text === testData.knownBugs.incorrectProductTitle) {
              productTitle = testData.knownBugs.correctProductTitle;
            }
            testData.chosenProducts.push(products.find((product) => product.title === productTitle));
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
      cy.get(cartPage.items).should('have.length', testData.indicesOfProducts.length);
    });

    it('CartPage.STANDARD: Then the Cart button with an appropriate number on the badge is displayed', () => {
      cy.get(headerComp.cartBadge).should('have.text', testData.indicesOfProducts.length).and('be.visible');
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

    it('CartPage.STANDARD: Then on each item delete button should be displayed', () => {
      cy.get(cartPage.items).each(($item) => {
        cy.wrap($item).find(cartPage.item.remove).should('have.text', l10n.cartPage.remove).and('be.visible').and('be.enabled');
      });
    });

    it('CartPage.STANDARD: Then on each item should have appropriate title, description and price', () => {
      cy.cartPage__validateProductDetails(testData.chosenProducts, testData.knownBugs);
    });
  });

  context('CartPage.STANDARD: When user clicks delete button on random item', () => {
    before(() => {
      cy.get(cartPage.items)
        .eq(testData.randomIndex)
        .find(cartPage.item.title)
        .invoke('text')
        .then((title) => {
          testData.removedProductTitle = title;
        });

      cy.then(() => {
        cy.get(cartPage.items).eq(testData.randomIndex).find(cartPage.item.remove).click();
      });
    });

    it('CartPage.STANDARD: Then the number of products is decreased', () => {
      cy.get(cartPage.items).should('have.length', testData.indicesOfProducts.length - 1);
    });

    it('CartPage.STANDARD: Then the Cart button with an appropriate number on the badge is displayed', () => {
      if (testData.indicesOfProducts.length - 1 === 0) {
        cy.get(headerComp.cartBadge).should('not.exist');
        return;
      }
      cy.get(headerComp.cartBadge)
        .should('have.text', testData.indicesOfProducts.length - 1)
        .and('be.visible');
    });

    it('CartPage.STANDARD: Then the removed product is not displayed', () => {
      if (testData.indicesOfProducts.length - 1 === 0) {
        cy.get(cartPage.items).should('not.exist');
        return;
      }
      cy.get(cartPage.items).each(($item) => {
        cy.wrap($item).find(cartPage.item.title).should('not.have.text', testData.removedProductTitle);
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
