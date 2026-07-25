// Custom commands are organised by tier under commands/api/ and commands/ui/.
// General-purpose helpers that are neither API calls nor UI actions live here.
// See the write-commands skill for conventions.

/**
 * Establishes a cached browser session for the given user role via UI login.
 * Uses cy.session so the login is performed once per role and restored on subsequent calls.
 *
 * IMPORTANT: After this command, always navigate via cy.visit('/') — not directly to an
 * interior route (e.g. /inventory.html). SauceDemo is an SPA; interior routes return 404
 * when visited directly. Starting from '/' lets the SPA auth-check redirect automatically.
 */
Cypress.Commands.add('common__getSessionUI', (role) => {
  cy.session(
    `ui-session-${role}`,
    () => {
      cy.common__getUserDataByRole(role).then((user) => {
        cy.visit('/');
        cy.loginPage__logIn(user);
        cy.url().should('include', 'inventory');
      });
    },
    {
      cacheAcrossSpecs: true,
      validate() {
        // Re-run setup if the auth key is no longer present in localStorage.
        return cy.window().then((win) => Boolean(win.localStorage.getItem('session-username')));
      },
    },
  );
});

const _userCache = {};

Cypress.Commands.add('common__getUserDataByRole', (role) => {
  if (!Object.values(userRoles).includes(role)) {
    throw new Error(`Invalid user: ${role}`);
  }

  const user = _userCache[role];
  if (user) {
    cy.log(`User found in environment for role: ${role}`);
    return cy.wrap(user);
  }

  return cy.fixture(`../sensitive-data/${Cypress.expose('envName')}-users.json`).then((users) => {
    const userData = users[role];
    if (!userData) {
      throw new Error(`User data not found for role: ${role}`);
    }
    _userCache[role] = userData;
    return cy.wrap(userData);
  });
});
