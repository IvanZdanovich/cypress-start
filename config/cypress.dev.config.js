const { defineConfig, baseConfig, getSpecPattern, setupScreenshotOrdering } = require('./cypress.base.config');

/**
 * Dev Environment Configuration
 */
module.exports = defineConfig({
  ...baseConfig,
  e2e: {
    ...baseConfig.e2e,
    baseUrl: 'https://www.saucedemo.com',
    specPattern: getSpecPattern(process.env.SPEC_PATTERN),
    setupNodeEvents(on, config) {
      setupScreenshotOrdering(on, config);
    },
    expose: {
      envName: 'dev',
      baseUrl: 'https://www.saucedemo.com',
      baseAPIUrl: 'https://restful-booker.herokuapp.com',
    },
  },
});
