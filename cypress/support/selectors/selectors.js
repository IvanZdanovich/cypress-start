const loginPage = {
  title: '.login_logo',
  username: '[data-test=username]',
  password: '[data-test=password]',
  errorIcon: '[data-icon="times-circle"]',
  login: '[data-test="login-button"]',
  error: '.error-message-container',
  errorMessage: '[data-test="error"]',
  errorClose: '[data-test="error-button"]',
};

const inventoryPage = {
  title: '[data-test="title"]',
  cards: '[data-test="inventory-item"]',
  sorting: {
    container: '.select_container',
    dropdown: '[data-test="product-sort-container"]',
    currentOption: '[data-test="active-option"]',
    options: {
      nameAscending: 'option[value="az"]',
      nameDescending: 'option[value="za"]',
      priceAscending: 'option[value="lohi"]',
      priceDescending: 'option[value="hilo"]',
    },
  },
  card: {
    title: '[data-test="inventory-item-name"]',
    description: '[data-test="inventory-item-desc"]',
    image: '.inventory_item_img img',
    remove: '[data-test^="remove-"]',
    add: '[data-test^="add-to-cart-"]',
    price: '[data-test="inventory-item-price"]',
  },
};

const footerComp = {
  linkedin: 'li.social_linkedin a',
  twitter: 'li.social_twitter a',
  facebook: 'li.social_facebook a',
  copyRight: '[data-test="footer-copy"]',
};

const productPage = {
  title: '[data-test="inventory-item-name"]',
};

const cartPage = {
  title: '[data-test="title"]',
  quantityLabel: '[data-test="cart-quantity-label"]',
  descriptionLabel: '[data-test="cart-desc-label"]',
  continueShopping: '[data-test="continue-shopping"]',
  checkout: '[data-test="checkout"]',
  items: '[data-test="inventory-item"]',
  item: {
    title: '[data-test="inventory-item-name"]',
    description: '[data-test="inventory-item-desc"]',
    price: '[data-test="inventory-item-price"]',
    remove: '[data-test^="remove-"]',
  },
};

const checkoutPage = {
  title: '[data-test="title"]',
  firstName: '[data-test="firstName"]',
  lastName: '[data-test="lastName"]',
  zip: '[data-test="postalCode"]',
  continue: '[data-test="continue"]',
};

const checkoutOverview = {};

const checkoutCompletePage = {
  confirmation: {
    title: '[data-test="complete-header"]',
    message: '[data-test="complete-text"]',
  },
  backHome: '[data-test="back-to-products"]',
};

const headerComp = {
  title: '.app_logo',
  openCart: '[data-test="shopping-cart-link"]',
  cartBadge: '[data-test="shopping-cart-badge"]',
  sidebar: {
    container: '.bm-menu-wrap',
    open: '.bm-burger-button button',
    close: '.bm-cross-button',
    openInventory: '[data-test="inventory-sidebar-link"]',
    logout: '[data-test="logout-sidebar-link"]',
    resetAppState: '[data-test="reset-sidebar-link"]',
    openAbout: '[data-test="about-sidebar-link"]',
  },
};

export default {
  loginPage,
  inventoryPage,
  cartPage,
  productPage,
  checkoutPage,
  checkoutOverview,
  checkoutCompletePage,
  headerComp,
  footerComp,
};
