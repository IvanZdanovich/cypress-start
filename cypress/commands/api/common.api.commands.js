Cypress.Commands.add('commonAPI__getTokenByRole__POST', (role) => {
  let token;
  cy.then(() => {
    cy.session(
      `api-token-${role}`,
      () => {
        cy.common__getUserDataByRole(role)
          .then((user) => cy.restfullBooker__getAuthToken__POST(user))
          .then((response) => {
            cy.log(`Access token received for role: ${role}`);
            window.localStorage.setItem(`${role}-token`, response.body.token);
          });
      },
      {
        cacheAcrossSpecs: true,
        validate() {
          token = window.localStorage.getItem(`${role}-token`);
          if (!token) return false;
          // restful-booker rotates/expires tokens on dyno restart, so confirm the server still accepts it — otherwise
          // a stale cached session (cacheAcrossSpecs) would be reused and every authenticated write would 403.
          return cy
            .request({
              method: 'PUT',
              url: `${urls.api.booking}/1`,
              failOnStatusCode: false,
              headers: { 'Content-Type': 'application/json', Cookie: `token=${token}` },
              body: {},
            })
            .then((res) => res.status !== 403);
        },
      },
    );
  });
  return cy.then(() => {
    return token;
  });
});
