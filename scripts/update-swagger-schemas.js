#!/usr/bin/env node

/**
 * Script to update Swagger JSON schemas from various API sources
 *
 * Usage: npm run update-swagger
 *
 * This script downloads the latest Swagger/OpenAPI schemas from development and QA environments
 * and saves them to the development-data/swagger directory for reference and testing purposes.
 *
 * The development-data/ folder is git-ignored and local-only. It is created on demand here
 * (see mkdirSync below) and is never committed to version control.
 */

const https = require('https');
const http = require('http');
const fs = require('fs');
const path = require('path');

const SWAGGER_DIR = path.join(__dirname, '..', 'development-data', 'swagger');

// Ensure the swagger directory exists
if (!fs.existsSync(SWAGGER_DIR)) {
  fs.mkdirSync(SWAGGER_DIR, { recursive: true });
}

/**
 * Schema source mappings
 * Format: { url: string, filename: string, description: string }
 */
const SCHEMA_SOURCES = [
  // Audit65 DEV env
  {
    url: 'https://audit65apidev.foodalert.com/swagger/v1-global/swagger.json',
    filename: 'audit65apidev.foodalert.com.v1-global.json',
    description: 'Alert65.Audit65.Api Global Settings',
  },
  {
    url: 'https://audit65apidev.foodalert.com/swagger/v1-group/swagger.json',
    filename: 'audit65apidev.foodalert.com.v1-group.json',
    description: 'Alert65.Audit65.Api Group Settings',
  },
  {
    url: 'https://audit65apidev.foodalert.com/swagger/audits/swagger.json',
    filename: 'audit65apidev.foodalert.com.audits.json',
    description: 'Alert65.Audit65.Api Audits functionality',
  },

  // Dynamic Forms DEV env
  {
    url: 'https://dformsapidev.foodalert.com/swagger/v2-group-template/swagger.json',
    filename: 'dformsapidev.foodalert.com.v2-group-template.json',
    description: 'Template Group Endpoints',
  },
  {
    url: 'https://dformsapidev.foodalert.com/swagger/v2-global/swagger.json',
    filename: 'dformsapidev.foodalert.com.v2-global.json',
    description: 'Global Endpoints',
  },
  {
    url: 'https://dformsapidev.foodalert.com/swagger/dforms/swagger.json',
    filename: 'dformsapidev.foodalert.com.dforms.json',
    description: 'Dynamic Forms Endpoints',
  },

  // Audit65 Reports DEV env
  {
    url: 'https://reportsapidev.foodalert.com/swagger/reports/swagger.json',
    filename: 'reportsapidev.foodalert.com.reports.json',
    description: 'Alert65.Reports Endpoints',
  },

  // Audit65 Gateway QA env
  {
    url: 'https://audit65qa.foodalert.com/swagger/v1-userManagement/swagger.json',
    filename: 'audit65qa.foodalert.com.v1-userManagement.json',
    description: 'User Management Endpoints',
  },
  {
    url: 'https://audit65qa.foodalert.com/swagger/settings/swagger.json',
    filename: 'audit65qa.foodalert.com.settings.json',
    description: 'Settings Endpoints',
  },
  {
    url: 'https://audit65qa.foodalert.com/swagger/templates/swagger.json',
    filename: 'audit65qa.foodalert.com.templates.json',
    description: 'Template Endpoints',
  },
  {
    url: 'https://audit65qa.foodalert.com/swagger/dforms/swagger.json',
    filename: 'audit65qa.foodalert.com.dforms.json',
    description: 'Dynamic Forms Endpoints',
  },
  {
    url: 'https://audit65qa.foodalert.com/swagger/audits/swagger.json',
    filename: 'audit65qa.foodalert.com.audits.json',
    description: 'Audit Endpoints',
  },
  {
    url: 'https://audit65qa.foodalert.com/swagger/mocks/swagger.json',
    filename: 'audit65qa.foodalert.com.mocks.json',
    description: 'Mocks',
  },

  // Unity Document Management
  {
    url: 'https://unitydocapiqa.azurewebsites.net/swagger/v1/swagger.json',
    filename: 'unitydocapiqa.azurewebsites.net.v1.json',
    description: 'Unity.Doc.Management.API',
  },
];

const RETRY_ATTEMPTS = 3;
const RETRY_BASE_DELAY_MS = 1000;

/**
 * Wait for a given number of milliseconds
 * @param {number} ms - Milliseconds to wait
 * @returns {Promise<void>}
 */
function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Download a file from a URL
 * @param {string} url - The URL to download from
 * @returns {Promise<string>} - The downloaded content as a string
 */
function downloadFile(url) {
  return new Promise((resolve, reject) => {
    const protocol = url.startsWith('https') ? https : http;

    protocol
      .get(url, (res) => {
        if (res.statusCode === 301 || res.statusCode === 302) {
          // Handle redirects
          downloadFile(res.headers.location).then(resolve).catch(reject);
          return;
        }

        if (res.statusCode !== 200) {
          reject(new Error(`HTTP ${res.statusCode}: ${res.statusMessage}`));
          return;
        }

        let data = '';

        res.on('data', (chunk) => {
          data += chunk;
        });

        res.on('end', () => {
          try {
            // Validate JSON
            JSON.parse(data);
            resolve(data);
          } catch (err) {
            reject(new Error(`Invalid JSON response: ${err.message}`));
          }
        });
      })
      .on('error', (err) => {
        reject(err);
      });
  });
}

/**
 * Download a file with retry logic and exponential backoff
 * @param {string} url - The URL to download from
 * @param {number} attempts - Maximum number of attempts
 * @returns {Promise<string>} - The downloaded content as a string
 */
async function downloadFileWithRetry(url, attempts = RETRY_ATTEMPTS) {
  for (let attempt = 1; attempt <= attempts; attempt++) {
    try {
      return await downloadFile(url);
    } catch (err) {
      const isLastAttempt = attempt === attempts;
      if (isLastAttempt) {
        throw err;
      }
      const delayMs = RETRY_BASE_DELAY_MS * Math.pow(2, attempt - 1);
      console.log(`   Attempt ${attempt}/${attempts} failed: ${err.message}`);
      console.log(`   Retrying in ${delayMs}ms...`);
      await sleep(delayMs);
    }
  }
}

/**
 * Format JSON with proper indentation
 * @param {string} jsonString - The JSON string to format
 * @returns {string} - Formatted JSON string
 */
function formatJson(jsonString) {
  const obj = JSON.parse(jsonString);
  return JSON.stringify(obj, null, 2);
}

/**
 * Download and save a schema
 * @param {object} source - Schema source object
 * @returns {Promise<object>} - Result object with status
 */
async function downloadSchema(source) {
  const filePath = path.join(SWAGGER_DIR, source.filename);

  try {
    console.log(`Downloading: ${source.description} (up to ${RETRY_ATTEMPTS} attempts)`);
    console.log(`   URL: ${source.url}`);

    const content = await downloadFileWithRetry(source.url);
    const formattedContent = formatJson(content);

    fs.writeFileSync(filePath, formattedContent, 'utf8');

    console.log(`Saved: ${source.filename}\n`);

    return {
      success: true,
      filename: source.filename,
      description: source.description,
    };
  } catch (error) {
    console.error(`FAIL after ${RETRY_ATTEMPTS} attempts: ${source.description}`);
    console.error(`   Error: ${error.message}\n`);

    return {
      success: false,
      filename: source.filename,
      description: source.description,
      error: error.message,
    };
  }
}

/**
 * Main execution function
 */
async function main() {
  console.log('Starting Swagger schema update...\n');
  console.log(`Target directory: ${SWAGGER_DIR}\n`);
  console.log(`Total schemas to download: ${SCHEMA_SOURCES.length}\n`);
  console.log('═'.repeat(80));
  console.log('\n');

  const results = [];

  // Download schemas sequentially to avoid overwhelming the servers
  for (const source of SCHEMA_SOURCES) {
    const result = await downloadSchema(source);
    results.push(result);

    // Small delay between requests
    await new Promise((resolve) => setTimeout(resolve, 500));
  }

  console.log('═'.repeat(80));
  console.log('\nSummary:\n');

  const successful = results.filter((r) => r.success);
  const failed = results.filter((r) => !r.success);

  console.log(`Successful: ${successful.length}`);
  console.log(`Failed:     ${failed.length}`);
  console.log(`Total:      ${results.length}\n`);

  if (failed.length > 0) {
    console.log('Failed downloads:');
    failed.forEach((f) => {
      console.log(`   - ${f.description} (${f.filename})`);
      console.log(`     Error: ${f.error}`);
    });
    console.log('');
    process.exit(1);
  } else {
    console.log('All schemas updated successfully.\n');
    process.exit(0);
  }
}

// Run the script
main().catch((error) => {
  console.error('FAIL Unexpected error:', error);
  process.exit(1);
});
