const { defineConfig } = require('cypress');

/**
 * Base Cypress Configuration
 * Shared settings across all environments
 */
const baseConfig = {
  watchForFileChanges: false,
  testIsolation: false,
  e2e: {
    trashAssetsBeforeRuns: false,
    supportFile: 'cypress/support/e2e.js',
    slowTestThreshold: 200,
    chromeWebSecurity: false,
    numTestsKeptInMemory: 200,
    video: false,
    videosFolder: './cypress/reports/videos',
    screenshotsFolder: './cypress/reports/screenshots',
    viewportWidth: 1600,
    viewportHeight: 1200,
    modifyObstructiveCode: false,
    pageLoadTimeout: 10000,
    defaultCommandTimeout: 7000,
    requestTimeout: 7000,
    responseTimeout: 25000,
    language: process.env.LANGUAGE || 'en',
    colourTheme: process.env.COLOUR_THEME || 'default',
    reporter: 'spec',
  },
};

/**
 * Get spec pattern based on environment variable or default
 * @param {string} customSpec - Custom spec pattern from SPEC_PATTERN env variable
 * @returns {string|string[]} Spec pattern(s)
 */
function getSpecPattern(customSpec) {
  if (customSpec) {
    return customSpec;
  }

  return ['cypress/integration/ui/**/*.ui.spec.js', 'cypress/integration/api/**/*.api.spec.js', 'cypress/e2e/**/*.ui.spec.js'];
}

module.exports = {
  defineConfig,
  baseConfig,
  getSpecPattern,
};
