import { cartPage__examples as examples } from '../../integration-examples/ui/cart-page.ui.examples';

describe('CartPage: Given STANDARD user on Cart page and no products are added to cart', { testIsolation: false }, () => {
  let standardUser;
  let chosenProducts = [];
  let removedProductTitle;

  before(() => {
    cy.common__getUserDataByRole(userRoles.STANDARD).then((user) => {
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
      cy.get(cartPage.title).should('have.text', l10n['cartPage.title']);
    });
    it('CartPage.STANDARD: Then no items should be displayed', () => {
      cy.get(cartPage.items).should('not.exist');
    });
    it('CartPage.STANDARD: Then Continue Shopping button is displayed', () => {
      cy.get(cartPage.continueShopping).should('have.text', l10n['cartPage.continueShopping']).and('be.visible').and('be.enabled');
    });
    it('CartPage.STANDARD: Then Checkout button is displayed', () => {
      cy.get(cartPage.checkout).should('have.text', l10n['cartPage.checkout']).and('be.visible').and('be.enabled');
    });
    it('CartPage.Footer.STANDARD: Then LinkedIn icon with link should be displayed', () => {
      cy.get(footerComp.linkedin).should('have.attr', 'href', urls.external.linkedin).and('have.attr', 'target', '_blank').and('be.visible');
    });
    it('CartPage.Footer.STANDARD: Then Twitter icon with link should be displayed', { req: { bugs: ['BUG-FOOTER-001'] } }, () => {
      cy.get(footerComp.twitter).should('have.attr', 'href', urls.external.twitter).and('have.attr', 'target', '_blank').and('be.visible');
    });
    it('CartPage.Footer.STANDARD: Then Facebook icon with link should be displayed', () => {
      cy.get(footerComp.facebook).should('have.attr', 'href', urls.external.facebook).and('have.attr', 'target', '_blank').and('be.visible');
    });
    it('CartPage.Footer.STANDARD: Then the Copyright notice with actual year should be displayed', () => {
      cy.footerComp__verifyCopyright();
    });
    it.skip('CartPage.Footer.STANDARD: Then Terms Of Service link should be displayed', { req: { bugs: ['BUG-FOOTER-002'] } }, () => {});
    it.skip('CartPage.Footer.STANDARD: Then Privacy Policy link should be displayed', { req: { bugs: ['BUG-FOOTER-003'] } }, () => {});
    it('CartPage.STANDARD: Then Quantity table header should be displayed', () => {
      cy.get(cartPage.quantityLabel).should('have.text', l10n['cartPage.quantity']).and('be.visible');
    });
    it('CartPage.STANDARD: Then Description table header should be displayed', () => {
      cy.get(cartPage.descriptionLabel).should('have.text', l10n['cartPage.description']).and('be.visible');
    });
  });

  context('CartPage.STANDARD: When user clicks Continue Shopping button', () => {
    before(() => {
      cy.get(cartPage.continueShopping).click();
    });
    it('CartPage.STANDARD: Then user should be redirected to the Inventory page URL', () => {
      cy.url().should('eq', urls.pages.inventory);
    });
    it('CartPage.STANDARD: Then Inventory page title is displayed', () => {
      cy.get(inventoryPage.title).should('have.text', l10n['inventoryPage.title']);
    });
  });

  context('CartPage.STANDARD: When user adds random products and clicks Cart button', () => {
    before(() => {
      cy.inventoryPage__collectAndAddProductsToCart(examples.indicesOfProducts, chosenProducts, examples.buggyProductData);
      cy.then(() => {
        cy.get(headerComp.openCart).click();
      });
    });
    it('CartPage.STANDARD: Then user should be redirected to the Cart page URL', () => {
      cy.url().should('eq', urls.pages.cart);
    });
    it('CartPage.STANDARD: Then Cart page title is displayed', () => {
      cy.get(cartPage.title).should('have.text', l10n['cartPage.title']);
    });
    it('CartPage.STANDARD: Then number of items should correspond to the number of chosen products', () => {
      cy.get(cartPage.items).should('have.length', examples.indicesOfProducts.length);
    });
    it('CartPage.STANDARD: Then the Cart button with an appropriate number on the badge is displayed', () => {
      cy.headerComp__verifyCartBadge(examples.indicesOfProducts.length);
    });
    it('CartPage.STANDARD: Then Checkout button is displayed', () => {
      cy.get(cartPage.checkout).should('have.text', l10n['cartPage.checkout']).and('be.visible').and('be.enabled');
    });
    it('CartPage.STANDARD: Then Continue Shopping button is displayed', () => {
      cy.get(cartPage.continueShopping).should('have.text', l10n['cartPage.continueShopping']).and('be.visible').and('be.enabled');
    });
    it('CartPage.STANDARD: Then Quantity table header should be displayed', () => {
      cy.get(cartPage.quantityLabel).should('have.text', l10n['cartPage.quantity']).and('be.visible');
    });
    it('CartPage.STANDARD: Then Description table header should be displayed', () => {
      cy.get(cartPage.descriptionLabel).should('have.text', l10n['cartPage.description']).and('be.visible');
    });
    it('CartPage.STANDARD: Then on each item delete button should be displayed', () => {
      cy.get(cartPage.items).each(($item) => {
        cy.wrap($item).find(cartPage.item.remove).should('have.text', l10n['cartPage.remove']).and('be.visible').and('be.enabled');
      });
    });
    it('CartPage.STANDARD: Then on each item should have appropriate title, description and price', () => {
      cy.cartPage__validateProductDetails(chosenProducts, examples.buggyProductData);
    });
  });

  context('CartPage.STANDARD: When user clicks delete button on random item', () => {
    before(() => {
      cy.get(cartPage.items)
        .eq(examples.randomIndex)
        .find(cartPage.item.title)
        .invoke('text')
        .then((title) => {
          removedProductTitle = title;
        });
      cy.then(() => {
        cy.get(cartPage.items).eq(examples.randomIndex).find(cartPage.item.remove).click();
      });
    });
    it('CartPage.STANDARD: Then the number of products is decreased', () => {
      cy.get(cartPage.items).should('have.length', examples.indicesOfProducts.length - 1);
    });
    it('CartPage.STANDARD: Then the Cart button with an appropriate number on the badge is displayed', () => {
      cy.headerComp__verifyCartBadge(examples.indicesOfProducts.length - 1);
    });
    it('CartPage.STANDARD: Then the removed product is not displayed', () => {
      cy.cartPage__verifyProductRemoved(removedProductTitle, examples.indicesOfProducts.length - 1);
    });
  });

  context('CartPage.STANDARD: When user clicks Checkout button', () => {
    before(() => {
      cy.get(cartPage.checkout).click();
    });
    it('CartPage.STANDARD: Then user should be redirected to the Checkout page URL', () => {
      cy.url().should('eq', urls.pages.checkout);
    });
    it('CartPage.STANDARD: Then Checkout page title is displayed', () => {
      cy.get(checkoutPage.title).should('have.text', l10n['checkoutPage.title']);
    });
  });
});
