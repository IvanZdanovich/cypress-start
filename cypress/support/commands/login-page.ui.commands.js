Cypress.Commands.add('loginPage_FillLoginForm', (user) => {
  const { username, password } = user;
  cy.get(loginPage.username).type(username, { delay: 0 });
  cy.get(loginPage.password).type(password, { log: false, delay: 0 });
});
