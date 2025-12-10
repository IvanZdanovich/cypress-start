import { testData } from '../../test-data/ui/header-comp.ui.test-data';

describe('Header: Given STANDARD user on Inventory page', { testIsolation: false }, () => {
  let standardUser;

  before(() => {
    cy.getUserDataByRole(userRoles.STANDARD).then((user) => {
      standardUser = user;
    });
    cy.then(() => {
      cy.visit('/');
      cy.loginPage__logIn(standardUser);
    });
  });

  context('Header.STANDARD: When user reviews the Component', () => {
    it('Header.STANDARD: Then Title is displayed', () => {
      cy.get(headerComp.title).should('have.text', l10n.header.title).and('be.visible');
    });

    it('Header.STANDARD: Then Cart button is displayed', () => {
      cy.get(headerComp.openCart).should('be.visible');
    });

    it('Header.STANDARD: Then Sidebar button is displayed', () => {
      cy.get(headerComp.sidebar.open).should('be.visible');
    });

    it('Header.STANDARD: Then Sidebar is not displayed', () => {
      cy.get(headerComp.sidebar.container).should('not.be.visible');
    });

    it('Header.STANDARD: Then Cart badge is not displayed', () => {
      cy.get(headerComp.cartBadge).should('not.exist');
    });
  });

  context('Header.STANDARD: When user opens the Sidebar', () => {
    before(() => {
      cy.get(headerComp.sidebar.open).click();
    });

    it('Header.STANDARD: Then Sidebar is displayed', () => {
      cy.get(headerComp.sidebar.container).should('be.visible');
    });

    it('Header.STANDARD: Then Close button is displayed', () => {
      cy.get(headerComp.sidebar.close).should('be.visible');
    });

    it('Header.STANDARD: Then Inventory option is displayed', () => {
      cy.get(headerComp.sidebar.openInventory).should('have.text', l10n.header.sidebar.inventory).and('be.visible');
    });

    it('Header.STANDARD: Then About option is displayed with external link', () => {
      cy.get(headerComp.sidebar.openAbout).should('have.text', l10n.header.sidebar.about).and('have.attr', 'href', urls.external.about).and('be.visible');
    });

    it('Header.STANDARD: Then Reset App State option is displayed', () => {
      cy.get(headerComp.sidebar.resetAppState).should('have.text', l10n.header.sidebar.resetAppState).and('be.visible');
    });

    it('Header.STANDARD: Then Logout option is displayed', () => {
      cy.get(headerComp.sidebar.logout).should('have.text', l10n.header.sidebar.logout).and('be.visible');
    });
  });

  context('Header.STANDARD: When user closes the Sidebar', () => {
    before(() => {
      cy.get(headerComp.sidebar.close).click();
    });

    it('Header.STANDARD: Then user remains on the same page', () => {
      cy.url().should('eq', urls.pages.inventory);
    });

    it('Header.STANDARD: Then Sidebar button is displayed', () => {
      cy.get(headerComp.sidebar.open).should('be.visible');
    });

    it('Header.STANDARD: Then Sidebar is not displayed', () => {
      cy.get(headerComp.sidebar.container).should('not.be.visible');
    });
  });

  context('Header.STANDARD: When user adds products to cart', () => {
    before(() => {
      cy.get(inventoryPage.cards).then(($cards) => {
        const selectedIndex = testData.randomProductIndices[0];
        cy.wrap($cards[selectedIndex]).find(inventoryPage.card.add).click();
      });
    });

    it('Header.STANDARD: Then Cart badge displays count of added products', () => {
      cy.get(headerComp.cartBadge).should('have.text', '1').and('be.visible');
    });
  });

  context('Header.STANDARD: When user clicks Reset App State', () => {
    before(() => {
      cy.get(headerComp.sidebar.open).scrollIntoView();
      cy.get(headerComp.sidebar.open).click({ animationDistanceThreshold: testData.sidebarAnimationThreshold });
      cy.get(headerComp.sidebar.resetAppState).click();
      cy.get(headerComp.sidebar.close).click();
    });

    it('Header.STANDARD: Then Cart badge is not displayed', () => {
      cy.get(headerComp.cartBadge).should('not.exist');
    });

    it('Header.STANDARD: Then Sidebar is displayed', () => {
      cy.get(headerComp.sidebar.container).should('be.visible');
    });

    // Bug Reference: BUG-HEADER-001 - Reset App State does not reset product Add/Remove button states
    it('Header.STANDARD: Then Remove buttons remain unchanged', () => {
      cy.get(inventoryPage.cards).then(($cards) => {
        const selectedIndex = testData.randomProductIndices[0];
        cy.wrap($cards[selectedIndex]).find(inventoryPage.card.remove).should('be.visible');
      });
    });
  });

  context('Header.STANDARD: When user clicks on Cart button', () => {
    before(() => {
      cy.get(headerComp.openCart).click();
    });

    it('Header.STANDARD: Then user is redirected to the Cart page', () => {
      cy.url().should('eq', urls.pages.cart);
      cy.get(cartPage.title).should('have.text', l10n.cartPage.title);
    });

    it('Header.STANDARD: Then Cart button is displayed', () => {
      cy.get(headerComp.openCart).should('be.visible');
    });

    it('Header.STANDARD: Then Sidebar button is displayed', () => {
      cy.get(headerComp.sidebar.open).should('be.visible');
    });

    it('Header.STANDARD: Then Sidebar is not displayed', () => {
      cy.get(headerComp.sidebar.container).should('not.be.visible');
    });
  });

  context('Header.STANDARD: When user clicks on Inventory option', () => {
    before(() => {
      cy.get(headerComp.sidebar.open).click();
      cy.get(headerComp.sidebar.openInventory).click();
    });

    it('Header.STANDARD: Then user is redirected to the Inventory page', () => {
      cy.url().should('eq', urls.pages.inventory);
      cy.get(inventoryPage.title).should('have.text', l10n.inventoryPage.title);
    });

    it('Header.STANDARD: Then Cart button is displayed', () => {
      cy.get(headerComp.openCart).should('be.visible');
    });

    it('Header.STANDARD: Then Sidebar button is displayed', () => {
      cy.get(headerComp.sidebar.open).should('be.visible');
    });

    it('Header.STANDARD: Then Sidebar is not displayed', () => {
      cy.get(headerComp.sidebar.container).should('not.be.visible');
    });
  });

  context('Header.STANDARD: When user logs out', () => {
    before(() => {
      cy.headerComp__logOut();
    });

    it('Header.STANDARD: Then user is redirected to the Login page', () => {
      cy.url().should('eq', `${Cypress.env('baseUrl')}/`);
      cy.get(loginPage.title).should('have.text', l10n.loginPage.title);
    });
  });
});
