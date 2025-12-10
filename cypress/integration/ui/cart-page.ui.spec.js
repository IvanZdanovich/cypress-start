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

    it('CartPage.STANDARD: Then Checkout button is displayed', () => {
      cy.get(cartPage.checkout).should('have.text', l10n.cartPage.checkout).and('be.visible').and('be.enabled');
    });

    it('CartPage.STANDARD: Then Quantity table header should be displayed', () => {
      cy.get(cartPage.quantityLabel).should('have.text', l10n.cartPage.quantity).and('be.visible');
    });

    it('CartPage.STANDARD: Then Description table header should be displayed', () => {
      cy.get(cartPage.descriptionLabel).should('have.text', l10n.cartPage.description).and('be.visible');
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
      cy.wrap(testData.indicesOfProducts).each((index) => {
        cy.get(inventoryPage.cards).eq(index).find(inventoryPage.card.add).click();
        cy.get(inventoryPage.card.title)
          .eq(index)
          .invoke('text')
          .then((text) => {
            let productTitle = text;
            if (text === testData.buggyProductData.wrongTitle) {
              productTitle = testData.buggyProductData.correctTitle;
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
      cy.cartPage__validateProductDetails(testData.chosenProducts, testData.buggyProductData);
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
