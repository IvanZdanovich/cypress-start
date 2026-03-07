#!/usr/bin/env node

/**
 * Script to update Swagger JSON schemas from various API sources
 *
 * Usage: npm run update-swagger
 *
 * This script downloads the latest Swagger/OpenAPI schemas from development and QA environments
 * and saves them to the development-data/swagger directory for reference and testing purposes.
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
  {
    url: 'https://swagger-url.com/swagger.json',
    filename: 'swagger-file-name.json',
    description: 'Swagger Schema',
  },
];

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
    console.log(`📥 Downloading: ${source.description}`);
    console.log(`   URL: ${source.url}`);

    const content = await downloadFile(source.url);
    const formattedContent = formatJson(content);

    fs.writeFileSync(filePath, formattedContent, 'utf8');

    console.log(`✅ Saved: ${source.filename}\n`);

    return {
      success: true,
      filename: source.filename,
      description: source.description,
    };
  } catch (error) {
    console.error(`❌ Failed: ${source.description}`);
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
  console.log('🚀 Starting Swagger schema update...\n');
  console.log(`📁 Target directory: ${SWAGGER_DIR}\n`);
  console.log(`📊 Total schemas to download: ${SCHEMA_SOURCES.length}\n`);
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
  console.log('\n📋 Summary:\n');

  const successful = results.filter((r) => r.success);
  const failed = results.filter((r) => !r.success);

  console.log(`✅ Successful: ${successful.length}`);
  console.log(`❌ Failed: ${failed.length}`);
  console.log(`📊 Total: ${results.length}\n`);

  if (failed.length > 0) {
    console.log('⚠️  Failed downloads:');
    failed.forEach((f) => {
      console.log(`   - ${f.description} (${f.filename})`);
      console.log(`     Error: ${f.error}`);
    });
    console.log('');
    process.exit(1);
  } else {
    console.log('🎉 All schemas updated successfully!\n');
    process.exit(0);
  }
}

// Run the script
main().catch((error) => {
  console.error('💥 Unexpected error:', error);
  process.exit(1);
});
