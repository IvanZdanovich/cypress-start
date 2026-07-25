/**
 * Main Cypress Configuration Loader
 * Loads the appropriate environment-specific configuration
 *
 * Usage:
 *   Default (QA):     cypress run
 *   Specific config:  cypress run --config-file config/cypress.dev.config.js
 *   Or via package.json scripts with TARGET_ENV environment variable
 */

const targetEnv = process.env.TARGET_ENV || 'qa';

// Map environment names to config files
const configMap = {
  qa: 'config/cypress.qa.config.js',
  dev: 'config/cypress.dev.config.js',
};

const configFile = configMap[targetEnv];

if (!configFile) {
  console.error(`Invalid TARGET_ENV: ${targetEnv}. Valid options: qa, dev`);
  process.exit(1);
}

const path = require('path');
const absoluteConfigFile = path.resolve(__dirname, configFile);

console.log(`Loading Cypress configuration for environment: ${targetEnv}`);
console.log(`Config file: ${configFile}`);

module.exports = {
  ...require(absoluteConfigFile),
};
