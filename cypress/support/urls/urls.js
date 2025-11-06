const api = {
  auth: `${Cypress.env('baseAPIUrl')}/auth`,
  booking: `${Cypress.env('baseAPIUrl')}/booking`,
  ping: `${Cypress.env('baseAPIUrl')}/ping`,
};

const pages = {
  login: `${Cypress.env('baseUrl')}/`,
  inventory: `${Cypress.env('baseUrl')}/inventory.html`,
  cart: `${Cypress.env('baseUrl')}/cart.html`,
  item: `${Cypress.env('baseUrl')}/inventory-item.html`,
  checkout: `${Cypress.env('baseUrl')}/checkout-step-one.html`,
};

const external = {
  about: 'https://saucelabs.com/',
  linkedin: 'https://www.linkedin.com/company/sauce-labs/',
  linkedinBase: 'https://www.linkedin.com/',
  facebook: 'https://www.facebook.com/saucelabs',
  twitter: 'https://x.com/saucelabs',
};

export default {
  api,
  pages,
  external,
};
