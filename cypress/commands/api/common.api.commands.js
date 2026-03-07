Cypress.Commands.add('commonAPI__getTokenByRole__POST', (role) => {
  let token;
  cy.then(() => {
    cy.session(
      `api-token-${role}`,
      () => {
        cy.common__getUserDataByRole(role).then((user) => {
          cy.restfullBooker__getAuthToken__POST(user).then((response) => {
            cy.log(`Access token received for role: ${role}`);
            window.localStorage.setItem(`${role}-token`, response.body.token);
          });
        });
      },
      {
        cacheAcrossSpecs: true,
        validate() {
          token = window.localStorage.getItem(`${role}-token`);
          return Boolean(token);
        },
      },
    );
  });
  return cy.then(() => {
    return token;
  });
});
