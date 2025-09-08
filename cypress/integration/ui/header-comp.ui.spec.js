import { test_data } from '../../test-data/header-comp.test-data';

describe('Header: Given STANDARD user on Inventory page', { testIsolation: false }, () => {
  let standardUser;
  before(() => {
    cy.getUserDataByRole(userRoles.STANDARD).then((user) => {
      standardUser = user;
    });
    cy.then(() => {
      cy.visit('/');
      cy.loginPage_Login(standardUser);
    });
  });
  context('Header.STANDARD: When user reviews the Component', () => {
    it('Header.STANDARD: Then user should see the Title', () => {
      cy.get(headerComp.title).should('have.text', l10n.header.title).and('be.visible');
    });
    it('Header.STANDARD: Then user should see the Cart button', () => {
      cy.get(headerComp.openCart).should('be.visible');
    });
    it('Header.STANDARD: Then user should see the Sidebar button', () => {
      cy.get(headerComp.sidebar.open).should('be.visible');
    });
    it('Header.STANDARD: Then sidebar should not be shown', () => {
      cy.get(headerComp.sidebar.container).should('not.be.visible');
    });
    it('Header.STANDARD: Then user should see the Cart button without Badge', () => {
      cy.get(headerComp.cartBadge).should('not.exist');
    });
  });

  context('Header.STANDARD: When user opens the Sidebar', () => {
    before(() => {
      cy.get(headerComp.sidebar.open).click();
    });
    it('Header.STANDARD: Then Sidebar should be shown', () => {
      cy.get(headerComp.sidebar.container).should('be.visible');
    });
    it('Header.STANDARD: Then Close button should be shown', () => {
      cy.get(headerComp.sidebar.close).should('be.visible');
    });
    it('Header.STANDARD: Then Inventory option should be shown', () => {
      cy.get(headerComp.sidebar.openInventory).should('have.text', l10n.header.sidebar.inventory).and('be.visible');
    });
    it('Header.STANDARD: Then About option should be shown with external link', () => {
      cy.get(headerComp.sidebar.openAbout).should('have.text', l10n.header.sidebar.about).and('have.attr', 'href', urls.external.about).and('be.visible');
    });
    it('Header.STANDARD: Then Reset App State option should be shown', () => {
      cy.get(headerComp.sidebar.resetAppState).should('have.text', l10n.header.sidebar.resetAppState).and('be.visible');
    });
    it('Header.STANDARD: Then Logout option should be shown', () => {
      cy.get(headerComp.sidebar.logout).should('have.text', l10n.header.sidebar.logout).and('be.visible');
    });
  });

  context('Header.STANDARD: When user closes the Sidebar', () => {
    before(() => {
      cy.get(headerComp.sidebar.close).click();
    });
    it('Header.STANDARD: Then same page should be shown', () => {
      cy.url().should('eq', urls.pages.inventory);
    });
    it('Header.STANDARD: Then user should see the Sidebar button', () => {
      cy.get(headerComp.sidebar.open).should('be.visible');
    });
    it('Header.STANDARD: Then sidebar should not be shown', () => {
      cy.get(headerComp.sidebar.container).should('not.be.visible');
    });
  });

  context('Header.STANDARD: When user adds products to cart', () => {
    before(() => {
      cy.get(inventoryPage.cards).then(($cards) => {
        test_data.indicesOfProducts.forEach((index) => {
          cy.wrap($cards[index]).find(inventoryPage.card.add).click();
        });
      });
    });
    it('Header.STANDARD: Then the Cart button with an appropriate number on the badge is displayed', () => {
      cy.get(headerComp.cartBadge).should('have.text', test_data.indicesOfProducts.length).and('be.visible');
    });
  });

  context('Header.STANDARD: When user clicks Reset App state', () => {
    before(() => {
      cy.get(headerComp.sidebar.open).click();
      cy.get(headerComp.sidebar.resetAppState).click();
    });
    it('Header.STANDARD: Then user should see the Cart button without Badge', () => {
      cy.get(headerComp.cartBadge).should('not.exist');
    });
    it('Header.STANDARD: Then sidebar should be shown', () => {
      cy.get(headerComp.sidebar.container).should('be.visible');
    });
    // TODO: fix the bug buglog.headerComp_ResetAppState
    it(`HeaderComponent.STANDARD: Then Remove buttons should be changed to Add\n${JSON.stringify(bugLog.headerComp_ResetAppState)}`, () => {
      cy.get(inventoryPage.cards).then(($cards) => {
        test_data.indicesOfProducts.forEach((index) => {
          // change remove button to add button after bug fix
          cy.wrap($cards[index]).find(inventoryPage.card.remove).should('be.visible');
        });
      });
    });
  });

  context('Header.STANDARD: When clicks on Cart page link', () => {
    before(() => {
      cy.get(headerComp.openCart).click();
    });
    it('Header.STANDARD: Then user should be redirected to the Cart page', () => {
      cy.url().should('eq', urls.pages.cart);
      cy.get(cartPage.title).should('have.text', l10n.cartPage.title);
    });
    it('Header.STANDARD: Then user should see the Cart button', () => {
      cy.get(headerComp.openCart).should('be.visible');
    });
    it('Header.STANDARD: Then user should see the Sidebar button', () => {
      cy.get(headerComp.sidebar.open).should('be.visible');
    });
    it('Header.STANDARD: Then sidebar should not be shown', () => {
      cy.get(headerComp.sidebar.container).should('not.be.visible');
    });
  });

  context('Header.STANDARD: When user clicks on Inventory option', () => {
    before(() => {
      cy.get(headerComp.sidebar.open).click();
      cy.get(headerComp.sidebar.openInventory).click();
    });
    it('Header.STANDARD: Then user should be redirected to the Inventory page', () => {
      cy.url().should('eq', urls.pages.inventory);
      cy.get(inventoryPage.title).should('have.text', l10n.inventoryPage.title);
    });
    it('Header.STANDARD: Then user should see the Cart button', () => {
      cy.get(headerComp.openCart).should('be.visible');
    });
    it('Header.STANDARD: Then user should see the Sidebar button', () => {
      cy.get(headerComp.sidebar.open).should('be.visible');
    });
    it('Header.STANDARD: Then sidebar should not be shown', () => {
      cy.get(headerComp.sidebar.container).should('not.be.visible');
    });
  });

  context('Header.STANDARD: When user logs out', () => {
    before(() => {
      cy.get(headerComp.sidebar.open).click();
      cy.get(headerComp.sidebar.logout).click();
    });
    it('Header.STANDARD: Then user should be redirected to the Login page', () => {
      cy.url().should('eq', `${Cypress.env('baseUrl')}/`);
      cy.get(loginPage.title).should('have.text', l10n.loginPage.title);
    });
  });
});
