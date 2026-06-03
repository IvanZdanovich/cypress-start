// ***********************************************************
// This example support/e2e-requirements.js is processed and
// loaded automatically before your test files.
//
// This is a great place to put global configuration and
// behavior that modifies Cypress.
//
// You can change the location of this file or turn off
// automatically serving support files with the
// 'supportFile' configuration option.
//
// You can read more here:
// https://on.cypress.io/configuration
// ***********************************************************

// Import commands.js using ES2015 syntax:
import '../commands/commands';
import '../commands/ui/login-page.ui.commands';
import '../commands/ui/header-comp.ui.commands';
import '../commands/ui/inventory-page.ui.commands';
import '../commands/ui/footer-comp.ui.commands';
import '../commands/ui/cart-page.ui.commands';
import '../commands/ui/checkout-page.ui.commands';
import '../commands/api/common.api.commands';
import '../commands/api/restful-booker.api.commands';

// Import necessary modules and resources
import l10n from '../localization/l10n.json';
import colours from '../colours/default-theme-colours.json';
import selectors from '../selectors/selectors';
import urls from './urls/api-urls';
import utils from './utils/utils';
import userRoles from '../constants/user-roles';

// Make resources globally available
global.l10n = l10n;
global.colours = colours;
global.urls = urls;
global.utils = utils;
global.userRoles = userRoles.userRoles;

// Separate selectors by pages
global.loginPage = selectors.loginPage;
global.inventoryPage = selectors.inventoryPage;
global.cartPage = selectors.cartPage;
global.headerComp = selectors.headerComp;
global.footerComp = selectors.footerComp;
global.productPage = selectors.productPage;
global.checkoutPage = selectors.checkoutPage;
global.checkoutOverviewPage = selectors.checkoutOverview;
global.checkoutCompletePage = selectors.checkoutCompletePage;
