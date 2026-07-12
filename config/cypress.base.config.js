const path = require('path');
const fs = require('fs');

const { defineConfig } = require('cypress');

/**
 * Tracks screenshot order per spec file and prepends the order index to the
 * screenshot filename so that the first failure in a file is clearly
 * identifiable (e.g. "1.test name -- attempt 1.png").
 *
 * Handles:
 * - Counter reset per spec via before:spec
 * - Filename conflicts from previous runs (trashAssetsBeforeRuns: false)
 *   by appending a collision suffix (e.g. "1.test name.1.png")
 * - Rename failures: falls back to the original path so the screenshot
 *   is never silently lost
 */
function setupScreenshotOrdering(on) {
  let screenshotCounter = 0;

  on('before:spec', () => {
    screenshotCounter = 0;
  });

  on('after:screenshot', async (details) => {
    screenshotCounter++;

    const dir = path.dirname(details.path);
    const ext = path.extname(details.path);
    const baseName = path.basename(details.path, ext);

    // Truncate baseName so the final filename (prefix + "." + baseName + ext) stays within 255 chars.
    // Reserve space for: counter digits (up to 4) + "." separator + ext + optional ".N" collision suffix (up to 6).
    const MAX_FILENAME = 255;
    const reserved = String(screenshotCounter).length + 1 + ext.length + 6;
    const truncatedBaseName = baseName.length + reserved > MAX_FILENAME ? baseName.slice(0, MAX_FILENAME - reserved) : baseName;

    // Resolve a conflict-free target path
    let newPath = path.join(dir, `${screenshotCounter}.${truncatedBaseName}${ext}`);
    let collision = 0;

    while (fs.existsSync(newPath)) {
      collision++;
      newPath = path.join(dir, `${screenshotCounter}.${truncatedBaseName}.${collision}${ext}`);
    }

    try {
      await fs.promises.rename(details.path, newPath);
      return { path: newPath };
    } catch (err) {
      console.error(`[screenshot-ordering] Failed to rename screenshot (counter=${screenshotCounter}): ${err.message}`);
      return { path: details.path };
    }
  });
}

/**
 * Base Cypress Configuration
 * Shared settings across all environments
 */
const baseConfig = {
  watchForFileChanges: false,
  allowCypressEnv: false,
  e2e: {
    // testIsolation: false,
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
    // mochawesome emits one report per spec into separate-reports/.
    //   json:true  — REQUIRED: scripts/collect-test-results.js parses the per-spec
    //                JSON to build the flaky ledger; without it nothing is recorded.
    //   html:true  — human-readable per-spec report bundled in the CI artifact.
    //   [name] in reportFilename keys each file on its spec, so parallel streams
    //                never overwrite one another; overwrite:false is belt-and-braces.
    reporter: 'mochawesome',
    reporterOptions: {
      reportDir: 'cypress/reports/separate-reports',
      reportFilename: '[status]_[datetime]-[name]-report',
      overwrite: false,
      json: true,
      html: false,
      charts: true,
      reportPageTitle: 'Cypress Test Report',
      showHooks: 'always',
      embeddedScreenshots: true,
      inlineAssets: true,
      timestamp: 'longDate',
    },
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
  setupScreenshotOrdering,
};
