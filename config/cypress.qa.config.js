const { defineConfig, baseConfig, getSpecPattern, setupScreenshotOrdering } = require('./cypress.base.config');

/**
 * QA Environment Configuration
 */
module.exports = defineConfig({
  ...baseConfig,
  e2e: {
    ...baseConfig.e2e,
    baseUrl: 'https://www.saucedemo.com',
    specPattern: getSpecPattern(process.env.SPEC_PATTERN),
    setupNodeEvents(on) {
      setupScreenshotOrdering(on);
    },
    expose: {
      envName: 'qa',
      baseAPIUrl: 'https://restful-booker.herokuapp.com',
    },
  },
});
