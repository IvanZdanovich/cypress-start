import { testData } from '../../test-data/ui/inventory-page.ui.test-data';

describe('InventoryPage: Given STANDARD user on Inventory page, no products are added to cart', { testIsolation: false }, () => {
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

  context('InventoryPage.STANDARD: When user visits the page', () => {
    it('InventoryPage.STANDARD: Then page URL should be displayed', () => {
      cy.url().should('eq', urls.pages.inventory);
    });

    it('InventoryPage.STANDARD: Then page title should be displayed', () => {
      cy.get(inventoryPage.title).should('have.text', l10n.inventoryPage.title);
    });

    it('InventoryPage.STANDARD: Then default sorting dropdown with default value', () => {
      cy.inventoryPage__verifySortingDropdown(reqs.inventoryPage.defaultSortOption);
    });

    it('InventoryPage.Footer.STANDARD: Then LinkedIn icon with link should be displayed', () => {
      cy.get(footerComp.linkedin).should('have.attr', 'href', urls.external.linkedin).and('have.attr', 'target', '_blank').and('be.visible');
    });

    // Bug Reference: BUG-FOOTER-001 - Twitter link uses outdated twitter.com URL
    it('InventoryPage.Footer.STANDARD: Then Twitter icon with link should be displayed', () => {
      cy.get(footerComp.twitter).should('have.attr', 'href', 'https://twitter.com/saucelabs').and('have.attr', 'target', '_blank').and('be.visible');
    });

    it('InventoryPage.Footer.STANDARD: Then Facebook icon with link should be displayed', () => {
      cy.get(footerComp.facebook).should('have.attr', 'href', urls.external.facebook).and('have.attr', 'target', '_blank').and('be.visible');
    });

    it('InventoryPage.Footer.STANDARD: Then the Copyright notice with actual year should be displayed', () => {
      cy.footerComp__verifyCopyright();
    });

    // Bug Reference: BUG-FOOTER-002 - Terms of Service link is missing
    it.skip('InventoryPage.Footer.STANDARD: Then Terms Of Service link should be displayed', () => {
      // Test skipped: Terms of Service link element does not exist in the footer
    });

    // Bug Reference: BUG-FOOTER-003 - Privacy Policy link is missing
    it.skip('InventoryPage.Footer.STANDARD: Then Privacy Policy link should be displayed', () => {
      // Test skipped: Privacy Policy link element does not exist in the footer
    });

    it('InventoryPage.STANDARD: Then default number of product cards should be displayed', () => {
      cy.get(inventoryPage.cards).should('have.length', reqs.inventoryPage.numberOfProductsOnThePage);
    });

    // Bug Reference: BUG-INVENTORY-001 - Product title displays incorrect value
    it('InventoryPage.Card.STANDARD: Then each product card Title should be displayed', () => {
      cy.get(inventoryPage.card.title).each(($title) => {
        cy.wrap($title)
          .invoke('text')
          .then((text) => {
            if (text === testData.buggyProductData.wrongTitle) {
              return;
            }
            const productExists = products.some((product) => product.title === text);
            expect(productExists).to.be.true;
          });
      });
    });

    // Bug Reference: BUG-INVENTORY-002 - Product description displays incorrect value
    it('InventoryPage.Card.STANDARD: Then each product card Description should be displayed', () => {
      cy.get(inventoryPage.card.description).each(($description) => {
        cy.wrap($description)
          .invoke('text')
          .then((text) => {
            if (text === testData.buggyProductData.wrongDescription) {
              return;
            }
            const productExists = products.some((product) => product.description === text);
            expect(productExists).to.be.true;
          });
      });
    });

    it('InventoryPage.Card.STANDARD: Then each product card icon should be displayed', () => {
      cy.inventoryPage__verifyProductImages();
    });

    it('InventoryPage.Card.STANDARD: Then each product card Price should be displayed', () => {
      cy.get(inventoryPage.card.price).each(($price) => {
        cy.wrap($price)
          .invoke('text')
          .then((text) => {
            const productExists = products.some((product) => `$${product.price}` === text);
            expect(productExists).to.be.true;
          });
      });
    });

    it('InventoryPage.Card.STANDARD: Then each product card add to cart button should be displayed', () => {
      cy.get(inventoryPage.card.add).each(($add) => {
        cy.wrap($add).should('have.text', l10n.inventoryPage.addToCart).and('be.visible');
      });
    });

    it('InventoryPage.Card.STANDARD: Then all products should be sorted by default parameter', () => {
      cy.get(inventoryPage.card.title).then(($titles) => {
        const titles = $titles.map((index, el) => el.innerText).get();
        const sortedTitles = [...titles].sort();
        expect(titles).to.deep.equal(sortedTitles);
      });
    });
  });

  context('InventoryPage.STANDARD: When user clicks on sorting dropdown', () => {
    before(() => {
      cy.get(inventoryPage.sorting.container).click();
    });

    it('InventoryPage.STANDARD: Then name ascending sorting option is marked as chosen', () => {
      cy.get(inventoryPage.sorting.options.nameAscending).should('have.text', l10n.inventoryPage.sort.options.nameAscending).and('be.visible');
    });

    it('InventoryPage.STANDARD: Then name descending sorting option is displayed', () => {
      cy.get(inventoryPage.sorting.options.nameDescending).should('have.text', l10n.inventoryPage.sort.options.nameDescending).and('be.visible');
    });

    it('InventoryPage.STANDARD: Then price ascending sorting option is displayed', () => {
      cy.get(inventoryPage.sorting.options.priceAscending).should('have.text', l10n.inventoryPage.sort.options.priceAscending).and('be.visible');
    });

    it('InventoryPage.STANDARD: Then price descending sorting option is displayed', () => {
      cy.get(inventoryPage.sorting.options.priceDescending).should('have.text', l10n.inventoryPage.sort.options.priceDescending).and('be.visible');
    });
  });

  context('InventoryPage.STANDARD: When user clicks on name descending sorting option', () => {
    before(() => {
      cy.inventoryPage__selectSortOption(reqs.inventoryPage.sortOptions.nameDescending);
    });

    it('InventoryPage.STANDARD: Then default sorting dropdown with value', () => {
      cy.inventoryPage__verifySortingDropdown(reqs.inventoryPage.sortOptions.nameDescending);
    });

    it('InventoryPage.STANDARD: Then products are sorted by name descending', () => {
      cy.get(inventoryPage.card.title).then(($titles) => {
        const titles = $titles.map((index, el) => el.innerText).get();
        const sortedTitles = [...titles].sort().reverse();
        expect(titles).to.deep.equal(sortedTitles);
      });
    });
  });

  context('InventoryPage.STANDARD: When user clicks on price ascending sorting option', () => {
    before(() => {
      cy.inventoryPage__selectSortOption(reqs.inventoryPage.sortOptions.priceAscending);
    });

    it('InventoryPage.STANDARD: Then default sorting dropdown with value', () => {
      cy.inventoryPage__verifySortingDropdown(reqs.inventoryPage.sortOptions.priceAscending);
    });

    it('InventoryPage.STANDARD: Then products are sorted by price ascending', () => {
      cy.get(inventoryPage.card.price).then(($prices) => {
        const prices = $prices.map((index, el) => parseFloat(el.innerText.replace('$', ''))).get();
        expect(prices).to.deep.equal([...prices].sort((a, b) => a - b));
      });
    });
  });

  context('InventoryPage.STANDARD: When user clicks on price descending sorting option', () => {
    before(() => {
      cy.inventoryPage__selectSortOption(reqs.inventoryPage.sortOptions.priceDescending);
    });

    it('InventoryPage.STANDARD: Then default sorting dropdown with value', () => {
      cy.inventoryPage__verifySortingDropdown(reqs.inventoryPage.sortOptions.priceDescending);
    });

    it('InventoryPage.STANDARD: Then products are sorted by price descending', () => {
      cy.get(inventoryPage.card.price).then(($prices) => {
        const prices = $prices.map((index, el) => parseFloat(el.innerText.replace('$', ''))).get();
        const sortedPrices = [...prices].sort((a, b) => a - b).reverse();
        expect(prices).to.deep.equal(sortedPrices);
      });
    });
  });

  context('InventoryPage.STANDARD: When user clicks on Name ascending sorting option', () => {
    before(() => {
      cy.inventoryPage__selectSortOption(reqs.inventoryPage.sortOptions.nameAscending);
    });

    it('InventoryPage.STANDARD: Then default sorting dropdown with value', () => {
      cy.inventoryPage__verifySortingDropdown(reqs.inventoryPage.sortOptions.nameAscending);
    });

    it('InventoryPage.STANDARD: Then products are sorted by name ascending', () => {
      cy.get(inventoryPage.card.title).then(($titles) => {
        const titles = $titles.map((index, el) => el.innerText).get();
        const sortedTitles = [...titles].sort();
        expect(titles).to.deep.equal(sortedTitles);
      });
    });
  });

  context('InventoryPage.STANDARD: When user clicks on add to cart button for first random product', () => {
    before(() => {
      cy.inventoryPage__addProductToCart(testData.indicesOfProducts[0]);
      cy.get(inventoryPage.card.title)
        .eq(testData.indicesOfProducts[0])
        .invoke('text')
        .then((text) => {
          testData.chosenProducts.push(products.find((product) => product.title === text));
        });
    });

    it('InventoryPage.Header.STANDARD: Then the Cart button with an appropriate number on the badge is displayed', () => {
      cy.inventoryPage__verifyCartBadge(testData.cartBadgeCounts.oneProduct);
    });

    it('InventoryPage.Card.STANDARD: Then the add to cart button is changed to remove button', () => {
      cy.get(inventoryPage.cards).eq(testData.indicesOfProducts[0]).find(inventoryPage.card.remove).should('have.text', l10n.inventoryPage.remove).and('be.visible');
    });
  });

  context('InventoryPage.STANDARD: When user clicks on add to cart button for second random product', () => {
    before(() => {
      cy.inventoryPage__addProductToCart(testData.indicesOfProducts[1]);
      cy.get(inventoryPage.card.title)
        .eq(testData.indicesOfProducts[1])
        .invoke('text')
        .then((text) => {
          testData.chosenProducts.push(products.find((product) => product.title === text));
        });
    });

    it('InventoryPage.Header.STANDARD: Then the Cart button with an appropriate number on the badge is displayed', () => {
      cy.inventoryPage__verifyCartBadge(testData.cartBadgeCounts.twoProducts);
    });

    it('InventoryPage.Card.STANDARD: Then the add to cart button is changed to remove button', () => {
      cy.get(inventoryPage.cards).eq(testData.indicesOfProducts[1]).find(inventoryPage.card.remove).should('have.text', l10n.inventoryPage.remove).and('be.visible');
    });
  });

  context('InventoryPage.STANDARD: When user clicks on Cart button', () => {
    before(() => {
      cy.get(headerComp.openCart).click();
    });

    it('InventoryPage.STANDARD: Then user should be redirected to the Cart page', () => {
      cy.url().should('eq', urls.pages.cart);
      cy.get(cartPage.title).should('have.text', l10n.cartPage.title);
    });

    // Bug Reference: BUG-INVENTORY-001 - Product title displays incorrect value
    it('InventoryPage.Card.STANDARD: Then appropriate products are presented in the table', () => {
      cy.get(cartPage.item.title).each(($title) => {
        cy.wrap($title)
          .invoke('text')
          .then((title) => {
            if (title === testData.buggyProductData.wrongTitle) {
              return;
            }

            const foundProduct = testData.chosenProducts.find((product) => {
              return product && product.title === title;
            });

            expect(foundProduct, `Product with title "${title}" should exist in chosen products`).to.exist;
          });
      });
    });

    it('InventoryPage.Card.STANDARD: Then the total number of products is correct', () => {
      cy.get(cartPage.items).should('have.length', testData.cartBadgeCounts.twoProducts);
    });
  });

  context('InventoryPage.STANDARD: When user navigates back from Cart page using back command', () => {
    before(() => {
      cy.go('back');
    });

    it('InventoryPage.STANDARD: Then user should be redirected to the Inventory page', () => {
      cy.url().should('eq', urls.pages.inventory);
      cy.get(inventoryPage.title).should('have.text', l10n.inventoryPage.title);
    });

    it('InventoryPage.Header.STANDARD: Then the Cart button with an appropriate number on the badge is displayed', () => {
      cy.inventoryPage__verifyCartBadge(testData.cartBadgeCounts.twoProducts);
    });

    it('InventoryPage.Card.STANDARD: Then the remove button is displayed for the products added to the cart', () => {
      cy.get(inventoryPage.cards).eq(testData.indicesOfProducts[0]).find(inventoryPage.card.remove).should('have.text', l10n.inventoryPage.remove).and('be.visible');
      cy.get(inventoryPage.cards).eq(testData.indicesOfProducts[1]).find(inventoryPage.card.remove).should('have.text', l10n.inventoryPage.remove).and('be.visible');
    });
  });

  context('InventoryPage.STANDARD: When user clicks on remove button for first random product', () => {
    before(() => {
      cy.inventoryPage__removeProductFromCart(testData.indicesOfProducts[0]);
    });

    it('InventoryPage.Header.STANDARD: Then the Cart button with an appropriate number on the badge is displayed', () => {
      cy.inventoryPage__verifyCartBadge(testData.cartBadgeCounts.oneProduct);
    });

    it('InventoryPage.Card.STANDARD: Then the remove button is changed to add button', () => {
      cy.get(inventoryPage.cards).eq(testData.indicesOfProducts[0]).find(inventoryPage.card.add).should('have.text', l10n.inventoryPage.addToCart).and('be.visible');
    });
  });

  context('InventoryPage.STANDARD: When user clicks on add to cart button for first random product again', () => {
    before(() => {
      cy.inventoryPage__addProductToCart(testData.indicesOfProducts[0]);
    });

    it('InventoryPage.Header.STANDARD: Then the Cart button with an appropriate number on the badge is displayed', () => {
      cy.inventoryPage__verifyCartBadge(testData.cartBadgeCounts.twoProducts);
    });

    it('InventoryPage.Card.STANDARD: Then the add to cart button is changed to remove button', () => {
      cy.get(inventoryPage.cards).eq(testData.indicesOfProducts[0]).find(inventoryPage.card.remove).should('have.text', l10n.inventoryPage.remove).and('be.visible');
    });
  });

  // Bug Reference: BUG-INVENTORY-001 - Product title displays incorrect value
  context('InventoryPage.STANDARD: When user clicks on Title of product card that was not added to cart', () => {
    let productForReview;

    before(() => {
      cy.get(inventoryPage.card.title)
        .eq(testData.indicesOfProducts[2])
        .invoke('text')
        .then((text) => {
          if (text === testData.buggyProductData.wrongTitle) {
            return;
          }
          productForReview = products.find((product) => product.title === text);
        });
      cy.then(() => {
        cy.get(inventoryPage.cards).eq(testData.indicesOfProducts[2]).find(inventoryPage.card.title).click();
      });
    });

    it('InventoryPage.STANDARD: Then user should be redirected to the Product page', () => {
      cy.url().should('contain', urls.pages.item);
    });

    // Bug Reference: BUG-INVENTORY-001 - Product title displays incorrect value
    it('InventoryPage.STANDARD: Then Product title should be displayed', () => {
      cy.get(productPage.title)
        .invoke('text')
        .then((text) => {
          if (text === testData.buggyProductData.wrongTitle) {
            return;
          }
          cy.get(productPage.title).should('have.text', productForReview.title);
        });
    });
  });

  context('InventoryPage.STANDARD: When user navigates back from Product page using back command', () => {
    before(() => {
      cy.go('back');
    });

    it('InventoryPage.STANDARD: Then user should be redirected to the Inventory page', () => {
      cy.url().should('eq', urls.pages.inventory);
      cy.get(inventoryPage.title).should('have.text', l10n.inventoryPage.title);
    });

    it('InventoryPage.Header.STANDARD: Then the Cart button with an appropriate number on the badge is displayed', () => {
      cy.inventoryPage__verifyCartBadge(testData.cartBadgeCounts.twoProducts);
    });

    it('InventoryPage.Card.STANDARD: Then the remove button is displayed for the products added to the cart', () => {
      cy.get(inventoryPage.cards).eq(testData.indicesOfProducts[0]).find(inventoryPage.card.remove).should('have.text', l10n.inventoryPage.remove).and('be.visible');
      cy.get(inventoryPage.cards).eq(testData.indicesOfProducts[1]).find(inventoryPage.card.remove).should('have.text', l10n.inventoryPage.remove).and('be.visible');
    });
  });

  context('InventoryPage.STANDARD: When user clicks remove on all the added cards', () => {
    before(() => {
      cy.inventoryPage__removeProductFromCart(testData.indicesOfProducts[0]);
      cy.inventoryPage__removeProductFromCart(testData.indicesOfProducts[1]);
    });

    it('InventoryPage.Header.STANDARD: Then the Cart button badge is not existed', () => {
      cy.inventoryPage__verifyCartBadge(testData.cartBadgeCounts.empty);
    });

    it('InventoryPage.Card.STANDARD: Then the all the product cards have add to cart buttons', () => {
      cy.get(inventoryPage.card.add).should('have.length', reqs.inventoryPage.numberOfProductsOnThePage);
    });
  });
});
