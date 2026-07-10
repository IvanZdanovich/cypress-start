import '../commands/commands';
import '../commands/ui/login-page.ui.commands';
import '../commands/ui/header-comp.ui.commands';
import '../commands/ui/inventory-page.ui.commands';
import '../commands/ui/footer-comp.ui.commands';
import '../commands/ui/cart-page.ui.commands';
import '../commands/ui/checkout-page.ui.commands';
import '../commands/api/common.api.commands';
import '../commands/api/restful-booker.api.commands';

import l10n from '../localization/l10n.json';
import colours from '../colours/default-theme-colours.json';
import selectors from '../selectors/selectors';
import urls from './urls/api-urls';
import utils from './utils/utils';
import userRoles from '../constants/user-roles';

global.l10n = l10n;
global.colours = colours;
global.urls = urls;
global.utils = utils;
global.userRoles = userRoles.userRoles;

global.loginPage = selectors.loginPage;
global.inventoryPage = selectors.inventoryPage;
global.cartPage = selectors.cartPage;
global.headerComp = selectors.headerComp;
global.footerComp = selectors.footerComp;
global.productPage = selectors.productPage;
global.checkoutPage = selectors.checkoutPage;
global.checkoutOverviewPage = selectors.checkoutOverviewPage;
global.checkoutCompletePage = selectors.checkoutCompletePage;
