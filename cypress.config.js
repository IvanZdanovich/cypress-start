const { defineConfig } = require('cypress');

module.exports = defineConfig({
  watchForFileChanges: false,
  e2e: {
    specPattern: '**/*.spec.js',
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
    reporter: 'mochawesome',
    reporterOptions: {
      reporterEnabled: 'mochawesome',
      mochawesomeReporterOptions: {
        reportDir: 'cypress/reports',
        overwrite: false,
        json: true,
        html: true,
        showHooks: 'always',
        reportFilename: '[name]-[status]-[datetime]-report',
        timestamp: 'longDate',
      },
    },
    env: {
      grepFilterSpecs: true,
      grepOmitFiltered: true,
      typeDelay: 1,
      local: {
        envName: 'local',
        baseUrl: 'https://www.saucedemo.com',
      },
      dev: {
        envName: 'dev',
        baseUrl: 'https://www.saucedemo.com',
      },
    },
    setupNodeEvents(on, config) {
      const language = process.env.LANGUAGE || 'en';
      const targetEnv = process.env.TARGET_ENV || 'dev';
      const specPattern = process.env.SPEC || `**/*.spec.js`;
      const browser = process.env.BROWSER || 'chrome';

      console.log(`Running tests with specPattern=${specPattern}, language=${language}, targetEnv=${targetEnv}, browser=${browser}`);

      // Update the config with the environment variables
      config.env = targetEnv ? config.env[targetEnv] : config.env.local;
      config.baseUrl = config.env.baseUrl;
      config.env.language = language;
      config.env.spec = specPattern;

      // Return the updated config
      return config;
    },
  },
});
