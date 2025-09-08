Cypress.Commands.add('loginPage_Login', (user) => {
  const { username, password } = user;
  cy.get(loginPage.username).type(username, { delay: 0 });
  cy.get(loginPage.password).type(password, { log: false, delay: 0 });
  cy.get(loginPage.login).click();
});
