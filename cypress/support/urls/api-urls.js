const api = {
  auth: `${Cypress.expose('baseAPIUrl')}/auth`,
  booking: `${Cypress.expose('baseAPIUrl')}/booking`,
  ping: `${Cypress.expose('baseAPIUrl')}/ping`,
};

const pages = {
  login: `${Cypress.expose('baseUrl')}/`,
  inventory: `${Cypress.expose('baseUrl')}/inventory.html`,
  cart: `${Cypress.expose('baseUrl')}/cart.html`,
  item: `${Cypress.expose('baseUrl')}/inventory-item.html`,
  checkout: `${Cypress.expose('baseUrl')}/checkout-step-one.html`,
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
