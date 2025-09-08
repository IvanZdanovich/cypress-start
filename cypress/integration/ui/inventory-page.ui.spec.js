import { test_data } from '../../test-data/inventory-page.test-data';

describe('InventoryPage: Given STANDARD user on Inventory page, no products are added to cart', { testIsolation: false }, () => {
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

  context('InventoryPage.STANDARD: When user visits the page', () => {
    it('InventoryPage.STANDARD: Then page URL should be displayed', () => {
      cy.url().should('eq', urls.pages.inventory);
    });
    it('InventoryPage.STANDARD: Then page title should be displayed', () => {
      cy.get(inventoryPage.title).should('have.text', l10n.inventoryPage.title);
    });
    it('InventoryPage.STANDARD: Then default sorting dropdown with default value', () => {
      cy.get(inventoryPage.sorting.container).should('be.visible');
      cy.get(inventoryPage.sorting.currentOption).should('have.text', l10n.inventoryPage.sort.options[reqs.inventoryPage.defaultSortOption]);
    });
    it('InventoryPage.Footer.STANDARD: Then LinkedIn icon with link should be displayed', () => {
      cy.get(footerComp.linkedin).should('have.attr', 'href', urls.external.linkedin).and('have.attr', 'target', '_blank').and('be.visible');
    });
    it(`InventoryPage.Footer.STANDARD: Then Twitter icon with link should be displayed\n${JSON.stringify(bugLog.footerComp_OutdatedTwitterLink)}`, () => {
      // TODO: fix the bug buglog.footerComp_OutdatedTwitterLink
      cy.get(footerComp.twitter).should('have.attr', 'href', 'https://twitter.com/saucelabs').and('have.attr', 'target', '_blank').and('be.visible');
    });
    it('InventoryPage.Footer.STANDARD: Then Facebook icon with link should be displayed', () => {
      cy.get(footerComp.facebook).should('have.attr', 'href', urls.external.facebook).and('have.attr', 'target', '_blank').and('be.visible');
    });
    it('InventoryPage.Footer.STANDARD: Then the Copyright notice with actual year should be displayed', () => {
      cy.get(footerComp.copyRight).should('have.text', l10n.footer.copyRight.replace('yearPlaceholder', new Date().getUTCFullYear())).and('be.visible');
    });
    it.skip(`InventoryPage.Footer.STANDARD: Then Terms Of Service link should be displayed\n${JSON.stringify(bugLog.footerComp_TermsOfServiceLink)}`, () => {
      // TODO: fix the bug buglog.footerComp_TermsOfServiceLink
    });
    it.skip(`InventoryPage.Footer.STANDARD: Then Privacy Policy link should be displayed\n${JSON.stringify(bugLog.footerComp_PrivacyPolicyLink)}`, () => {
      // TODO: fix the bug buglog.footerComp_PrivacyPolicyLink
    });
    it('InventoryPage.STANDARD: Then default number of product cards should be displayed', () => {
      cy.get(inventoryPage.cards).should('have.length', reqs.inventoryPage.numberOfProductsOnThePage);
    });
    it(`InventoryPage.Card.STANDARD: Then each product card Title should be displayed\n${JSON.stringify(bugLog.inventoryPage_cardTitleNotValidated)}`, () => {
      cy.get(inventoryPage.card.title).each(($title) => {
        cy.wrap($title)
          .invoke('text')
          .then((text) => {
            // TODO: fix the bug buglog.inventoryPage_cardTitleNotValidated
            if (text === 'Test.allTheThings() T-Shirt (Red)') {
              return; // Skip the check for the bugged title
            }
            const productExists = products.some((product) => product.title === text);
            expect(productExists).to.be.true;
          });
      });
    });
    it(`InventoryPage.Card.STANDARD: Then each product card Description should be displayed\n${JSON.stringify(bugLog.inventoryPage_cardDescriptionNotValidated)}`, () => {
      cy.get(inventoryPage.card.description).each(($description) => {
        cy.wrap($description)
          .invoke('text')
          .then((text) => {
            // TODO: fix the bug buglog.inventoryPage_cardDescriptionNotValidated
            if (text === 'carry.allTheThings() with the sleek, streamlined Sly Pack that melds uncompromising style with unequaled laptop and tablet protection.') {
              return; // Skip the check for the bugged title
            }
            const productExists = products.some((product) => product.description === text);
            expect(productExists).to.be.true;
          });
      });
    });
    it('InventoryPage.Card.STANDARD: Then each product card Image should be displayed', () => {
      cy.get(inventoryPage.card.image).each(($image) => {
        cy.wrap($image)
          .invoke('attr', 'src')
          .then((src) => {
            const productExists = products.some((product) => product.src === src);
            expect(productExists).to.be.true;
          });
      });
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
    it('InventoryPage.Card.STANDARD: Then each product card Add to cart button should be displayed', () => {
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
      cy.get(inventoryPage.sorting.dropdown).select(l10n.inventoryPage.sort.options.nameDescending);
    });
    it('InventoryPage.STANDARD: Then default sorting dropdown with value', () => {
      cy.get(inventoryPage.sorting.container).should('be.visible');
      cy.get(inventoryPage.sorting.currentOption).should('have.text', l10n.inventoryPage.sort.options.nameDescending);
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
      cy.get(inventoryPage.sorting.dropdown).select(l10n.inventoryPage.sort.options.priceAscending);
    });
    it('InventoryPage.STANDARD: Then default sorting dropdown with value', () => {
      cy.get(inventoryPage.sorting.container).should('be.visible');
      cy.get(inventoryPage.sorting.currentOption).should('have.text', l10n.inventoryPage.sort.options.priceAscending);
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
      cy.get(inventoryPage.sorting.dropdown).select(l10n.inventoryPage.sort.options.priceDescending);
    });
    it('InventoryPage.STANDARD: Then default sorting dropdown with value', () => {
      cy.get(inventoryPage.sorting.container).should('be.visible');
      cy.get(inventoryPage.sorting.currentOption).should('have.text', l10n.inventoryPage.sort.options.priceDescending);
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
      cy.get(inventoryPage.sorting.dropdown).select(l10n.inventoryPage.sort.options.nameAscending);
    });
    it('InventoryPage.STANDARD: Then default sorting dropdown with value', () => {
      cy.get(inventoryPage.sorting.container).should('be.visible');
      cy.get(inventoryPage.sorting.currentOption).should('have.text', l10n.inventoryPage.sort.options.nameAscending);
    });
    it('InventoryPage.STANDARD: Then products are sorted by name ascending', () => {
      cy.get(inventoryPage.card.title).then(($titles) => {
        const titles = $titles.map((index, el) => el.innerText).get();
        const sortedTitles = [...titles].sort();
        expect(titles).to.deep.equal(sortedTitles);
      });
    });
  });

  context('InventoryPage.STANDARD: When user clicks on Add to cart button for first random product', () => {
    before(() => {
      cy.get(inventoryPage.cards).eq(test_data.indicesOfProducts[0]).find(inventoryPage.card.add).click();
      cy.get(inventoryPage.card.title)
        .eq(test_data.indicesOfProducts[0])
        .invoke('text')
        .then((text) => {
          test_data.chosenProducts.push(products.find((product) => product.title === text));
        });
    });
    it('InventoryPage.Header.STANDARD: Then the Cart button with an appropriate number on the badge is displayed', () => {
      cy.get(headerComp.cartBadge).should('have.text', '1').and('be.visible');
    });
    it('InventoryPage.Card.STANDARD: Then the Add to cart button is changed to Remove button', () => {
      cy.get(inventoryPage.cards).eq(test_data.indicesOfProducts[0]).find(inventoryPage.card.remove).should('have.text', l10n.inventoryPage.remove).and('be.visible');
    });
  });

  context('InventoryPage.STANDARD: When user clicks on Add to cart button for second random product', () => {
    before(() => {
      cy.get(inventoryPage.cards).eq(test_data.indicesOfProducts[1]).find(inventoryPage.card.add).click();
      cy.get(inventoryPage.card.title)
        .eq(test_data.indicesOfProducts[1])
        .invoke('text')
        .then((text) => {
          test_data.chosenProducts.push(products.find((product) => product.title === text));
        });
    });
    it('InventoryPage.Header.STANDARD: Then the Cart button with an appropriate number on the badge is displayed', () => {
      cy.get(headerComp.cartBadge).should('have.text', '2').and('be.visible');
    });
    it('InventoryPage.Card.STANDARD: Then the Add to cart button is changed to Remove button', () => {
      cy.get(inventoryPage.cards).eq(test_data.indicesOfProducts[1]).find(inventoryPage.card.remove).should('have.text', l10n.inventoryPage.remove).and('be.visible');
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
    it(`InventoryPage.Card.STANDARD: Then appropriate products are presented in the table\n${JSON.stringify(bugLog.inventoryPage_cardTitleNotValidated)}`, () => {
      cy.get(cartPage.item.title).each(($title) => {
        cy.then(() => {
          cy.wrap($title)
            .invoke('text')
            .then((title) => {
              // TODO: fix the bug buglog.inventoryPage_cardTitleNotValidated
              if (title === 'Test.allTheThings() T-Shirt (Red)') {
                return; // Skip the check for the bugged title
              }
              test_data.chosenProducts.find((product) => product.title === title);
            });
        });
      });
    });
    it('InventoryPage.Card.STANDARD: Then the total number of products is correct', () => {
      cy.get(cartPage.items).should('have.length', 2);
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
      cy.get(headerComp.cartBadge).should('have.text', '2').and('be.visible');
    });
    it('InventoryPage.Card.STANDARD: Then the Remove button is displayed for the products added to the cart', () => {
      cy.get(inventoryPage.cards).eq(test_data.indicesOfProducts[0]).find(inventoryPage.card.remove).should('have.text', l10n.inventoryPage.remove).and('be.visible');
      cy.get(inventoryPage.cards).eq(test_data.indicesOfProducts[1]).find(inventoryPage.card.remove).should('have.text', l10n.inventoryPage.remove).and('be.visible');
    });
  });

  context('InventoryPage.STANDARD: When user clicks on Remove button for first random product', () => {
    before(() => {
      cy.get(inventoryPage.cards).eq(test_data.indicesOfProducts[0]).find(inventoryPage.card.remove).click();
    });
    it('InventoryPage.Header.STANDARD: Then the Cart button with an appropriate number on the badge is displayed', () => {
      cy.get(headerComp.cartBadge).should('have.text', '1').and('be.visible');
    });
    it('InventoryPage.Card.STANDARD: Then the Remove button is changed to Add button', () => {
      cy.get(inventoryPage.cards).eq(test_data.indicesOfProducts[0]).find(inventoryPage.card.add).should('have.text', l10n.inventoryPage.addToCart).and('be.visible');
    });
  });

  context('InventoryPage.STANDARD: When user clicks on Add to curt button for first random product again', () => {
    before(() => {
      cy.get(inventoryPage.cards).eq(test_data.indicesOfProducts[0]).find(inventoryPage.card.add).click();
    });
    it('InventoryPage.Header.STANDARD: Then the Cart button with an appropriate number on the badge is displayed', () => {
      cy.get(headerComp.cartBadge).should('have.text', '2').and('be.visible');
    });
    it('InventoryPage.Card.STANDARD: Then the Add to cart button is changed to Remove button', () => {
      cy.get(inventoryPage.cards).eq(test_data.indicesOfProducts[0]).find(inventoryPage.card.remove).should('have.text', l10n.inventoryPage.remove).and('be.visible');
    });
  });

  context(`InventoryPage.STANDARD: When user clicks on Title of product card that was not added to cart\n${JSON.stringify(bugLog.inventoryPage_cardTitleNotValidated)}`, () => {
    let productForReview;
    before(() => {
      cy.get(inventoryPage.card.title)
        .eq(test_data.indicesOfProducts[2])
        .invoke('text')
        .then((text) => {
          // TODO: fix the bug buglog.inventoryPage_cardTitleNotValidated
          if (text === 'Test.allTheThings() T-Shirt (Red)') {
            return; // Skip the check for the bugged title
          }
          productForReview = products.find((product) => product.title === text);
        });
      cy.then(() => {
        cy.get(inventoryPage.cards).eq(test_data.indicesOfProducts[2]).find(inventoryPage.card.title).click();
      });
    });
    it('InventoryPage.STANDARD: Then user should be redirected to the Product page', () => {
      cy.url().should('contain', urls.pages.item);
    });
    it(`InventoryPage.STANDARD: Then Product title should be displayed\n${JSON.stringify(bugLog.inventoryPage_cardTitleNotValidated)}`, () => {
      cy.get(productPage.title)
        .invoke('text')
        .then((text) => {
          // TODO: fix the bug buglog.inventoryPage_cardTitleNotValidated
          if (text === 'Test.allTheThings() T-Shirt (Red)') {
            return; // Skip the check for the bugged title
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
      cy.get(headerComp.cartBadge).should('have.text', '2').and('be.visible');
    });
    it('InventoryPage.Card.STANDARD: Then the Remove button is displayed for the products added to the cart', () => {
      cy.get(inventoryPage.cards).eq(test_data.indicesOfProducts[0]).find(inventoryPage.card.remove).should('have.text', l10n.inventoryPage.remove).and('be.visible');
      cy.get(inventoryPage.cards).eq(test_data.indicesOfProducts[1]).find(inventoryPage.card.remove).should('have.text', l10n.inventoryPage.remove).and('be.visible');
    });
  });

  context('InventoryPage.STANDARD: When user clicks Remove on all the added cards', () => {
    before(() => {
      cy.get(inventoryPage.cards).eq(test_data.indicesOfProducts[0]).find(inventoryPage.card.remove).click();
      cy.get(inventoryPage.cards).eq(test_data.indicesOfProducts[1]).find(inventoryPage.card.remove).click();
    });
    it('InventoryPage.Header.STANDARD: Then the Cart button badge is not existed', () => {
      cy.get(headerComp.cartBadge).should('not.exist');
    });
    it('InventoryPage.Card.STANDARD: Then the all the product cards have to Add to cart buttons', () => {
      cy.get(inventoryPage.card.add).should('have.length', reqs.inventoryPage.numberOfProductsOnThePage);
    });
  });
});
