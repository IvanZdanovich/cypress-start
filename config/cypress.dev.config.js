const { defineConfig, baseConfig, getSpecPattern } = require('./cypress.base.config');

/**
 * Dev Environment Configuration
 */
module.exports = defineConfig({
  ...baseConfig,
  e2e: {
    ...baseConfig.e2e,
    baseUrl: 'https://www.saucedemo.com',
    specPattern: getSpecPattern(process.env.SPEC_PATTERN),
    expose: {
      envName: 'dev',
      baseAPIUrl: 'https://restful-booker.herokuapp.com',
    },
  },
});
