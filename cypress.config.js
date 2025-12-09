const { defineConfig } = require('cypress');

module.exports = defineConfig({
  watchForFileChanges: false,
  e2e: {
    specPattern: 'cypress/**/*.spec.js',
    excludeSpecPattern: ['**/node_modules/**', '**/dist/**', '**/build/**'],
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
      reportDir: 'cypress/reports/mochawesome',
      overwrite: true,
      html: true,
      json: false,
      charts: false,
      reportPageTitle: 'Cypress Test Report',
      reportFilename: '[status]_[datetime]-[name]-report',
      showHooks: 'always',
      embeddedScreenshots: true,
      inlineAssets: true,
      timestamp: 'longDate',
    },
    env: {
      grepFilterSpecs: true,
      grepOmitFiltered: true,
      typeDelay: 1,
      local: {
        envName: 'local',
        baseUrl: 'https://www.saucedemo.com',
        baseAPIUrl: 'https://restful-booker.herokuapp.com',
      },
      dev: {
        envName: 'dev',
        baseUrl: 'https://www.saucedemo.com',
        baseAPIUrl: 'https://restful-booker.herokuapp.com',
      },
    },
    setupNodeEvents(on, config) {
      const language = process.env.LANGUAGE || 'en';
      const colourTheme = process.env.COLOUR_THEME || 'default';
      const targetEnv = process.env.TARGET_ENV || 'dev';
      const specPattern = process.env.SPEC || 'cypress/**/*.spec.js';
      const browser = process.env.BROWSER || 'chrome';

      console.log(`Running tests with specPattern=${specPattern}, language=${language}, targetEnv=${targetEnv}, browser=${browser}, colourTheme=${colourTheme}`);

      // Update the config with the environment variables
      config.env = targetEnv ? config.env[targetEnv] : config.env.local;
      config.baseUrl = config.env.baseUrl;
      config.env.language = language;
      config.env.colourTheme = colourTheme;
      config.env.spec = specPattern;

      on('before:browser:launch', (browser = {}, launchOptions) => {
        if (browser.name === 'chrome' || browser.name === 'electron') {
          launchOptions.args.push('--no-sandbox');
          launchOptions.args.push('--disable-gpu');
          launchOptions.args.push('--disable-dev-shm-usage');
          launchOptions.args.push('--disable-extensions');
          launchOptions.args.push('--disable-background-timer-throttling');
          launchOptions.args.push('--disable-backgrounding-occluded-windows');
          launchOptions.args.push('--disable-renderer-backgrounding');
        }
        return launchOptions;
      });
      // Return the updated config
      return config;
    },
  },
});
