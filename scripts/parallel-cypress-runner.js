#!/usr/bin/env node
/**
 * Parallel Cypress Test Runner
 *
 * Discovers Cypress test files by naming patterns and executes them in parallel chunks
 * within a single Docker container.
 *
 * Usage:
 *   PARALLEL_STREAMS=4 node scripts/parallel-cypress-runner.js
 *
 * Environment Variables:
 *   PARALLEL_STREAMS - Number of parallel streams (default: 3)
 *   WORKSPACE_ROOT - Project root directory (default: process.cwd())
 *
 * Test Patterns:
 *   - E2E UI: cypress/e2e/**\/*.ui.spec.js
 *   - Integration UI: cypress/integration/ui/**\/*.ui.spec.js
 *   - Integration API: cypress/integration/api/**\/*.api.spec.js
 */

const { spawn } = require('child_process');
const path = require('path');
const { glob } = require('glob');

// Configuration
const WORKSPACE_ROOT = process.env.WORKSPACE_ROOT || process.cwd();
const PARALLEL_STREAMS = Math.max(1, parseInt(process.env.PARALLEL_STREAMS || '3', 10));

// Test domain patterns
const TEST_DOMAINS = {
  integrationApi: {
    name: 'Integration API Tests',
    pattern: 'cypress/integration/api/**/*.api.spec.js',
  },
  integrationUi: {
    name: 'Integration UI Tests',
    pattern: 'cypress/integration/ui/**/*.ui.spec.js',
  },
  e2eUi: {
    name: 'E2E UI Tests',
    pattern: 'cypress/e2e/**/*.ui.spec.js',
  },
};

/**
 * Discover test files matching a glob pattern
 * @param {string} pattern - Glob pattern to match files
 * @returns {Promise<string[]>} Array of relative file paths
 */
async function discoverTestFiles(pattern) {
  try {
    const absolutePattern = path.join(WORKSPACE_ROOT, pattern);
    const files = await glob(absolutePattern, {
      nodir: true,
      absolute: false,
    });

    // Convert to relative paths from workspace root
    return files.map((file) => path.relative(WORKSPACE_ROOT, file)).sort();
  } catch (error) {
    console.error(`Error discovering files for pattern ${pattern}:`, error.message);
    return [];
  }
}

/**
 * Split files into chunks using round-robin distribution
 * @param {string[]} files - Array of file paths
 * @param {number} numChunks - Number of chunks to create
 * @returns {string[][]} Array of file chunks
 */
function splitIntoChunks(files, numChunks) {
  const chunks = Array.from({ length: numChunks }, () => []);

  files.forEach((file, index) => {
    chunks[index % numChunks].push(file);
  });

  // Filter out empty chunks
  return chunks.filter((chunk) => chunk.length > 0);
}

/**
 * Execute Cypress for a specific set of spec files
 * @param {string[]} specFiles - Array of spec file paths
 * @param {string} chunkName - Name identifier for this chunk
 * @returns {Promise<number>} Exit code of the Cypress process
 */
function executeCypressChunk(specFiles, chunkName) {
  return new Promise((resolve) => {
    const specArg = specFiles.join(',');
    const startTime = Date.now();

    console.log(`[${chunkName}] Starting execution with ${specFiles.length} file(s)`);

    const cypressProcess = spawn('npx', ['cypress', 'run', '--spec', specArg], {
      stdio: 'inherit',
      cwd: WORKSPACE_ROOT,
    });

    cypressProcess.on('close', (exitCode) => {
      const duration = ((Date.now() - startTime) / 1000).toFixed(2);

      if (exitCode === 0) {
        console.log(`[${chunkName}] ✓ Completed successfully in ${duration}s`);
      } else {
        console.error(`[${chunkName}] ✗ Failed with exit code ${exitCode} after ${duration}s`);
      }

      resolve(exitCode);
    });

    cypressProcess.on('error', (error) => {
      console.error(`[${chunkName}] ✗ Process error:`, error.message);
      resolve(1);
    });
  });
}

/**
 * Main execution function
 */
async function runParallelTests() {
  console.log('='.repeat(80));
  console.log('Cypress Parallel Test Runner');
  console.log('='.repeat(80));
  console.log(`Workspace: ${WORKSPACE_ROOT}`);
  console.log(`Parallel Streams: ${PARALLEL_STREAMS}`);
  console.log('='.repeat(80));
  console.log('');

  // Discover test files for each domain
  const domainFiles = {};

  for (const [domainKey, domainConfig] of Object.entries(TEST_DOMAINS)) {
    console.log(`Discovering ${domainConfig.name}...`);
    const files = await discoverTestFiles(domainConfig.pattern);
    domainFiles[domainKey] = files;
    console.log(`  Found ${files.length} file(s)`);
  }

  console.log('');

  // Create execution tasks
  const executionTasks = [];

  for (const [domainKey, files] of Object.entries(domainFiles)) {
    if (files.length === 0) continue;

    const domainConfig = TEST_DOMAINS[domainKey];
    const chunks = splitIntoChunks(files, PARALLEL_STREAMS);

    console.log(`${domainConfig.name}: ${files.length} file(s) → ${chunks.length} chunk(s)`);

    chunks.forEach((chunk, index) => {
      const chunkName = `${domainKey}-chunk-${index + 1}`;
      executionTasks.push({
        name: chunkName,
        domain: domainKey,
        files: chunk,
      });
    });
  }

  console.log('');
  console.log(`Total execution tasks: ${executionTasks.length}`);
  console.log('='.repeat(80));
  console.log('');

  if (executionTasks.length === 0) {
    console.log('No test files found. Exiting.');
    process.exit(0);
  }

  // Execute tasks with concurrency control
  const startTime = Date.now();
  const results = [];
  const activePromises = new Map();

  async function executeTasksInParallel() {
    let taskIndex = 0;

    while (taskIndex < executionTasks.length || activePromises.size > 0) {
      // Start new tasks up to the parallel limit
      while (taskIndex < executionTasks.length && activePromises.size < PARALLEL_STREAMS) {
        const task = executionTasks[taskIndex];
        const taskId = taskIndex;
        taskIndex++;

        const promise = executeCypressChunk(task.files, task.name).then((exitCode) => {
          results.push({ task, exitCode });
          activePromises.delete(taskId);
          return exitCode;
        });

        activePromises.set(taskId, promise);
      }

      // Wait for at least one task to complete before continuing
      if (activePromises.size > 0) {
        await Promise.race(activePromises.values());
      }
    }

    return results;
  }

  const taskResults = await executeTasksInParallel();

  // Calculate summary
  const failedTasks = taskResults.filter((r) => r.exitCode !== 0).length;
  const totalDuration = ((Date.now() - startTime) / 1000).toFixed(2);

  console.log('');
  console.log('='.repeat(80));
  console.log('Execution Summary');
  console.log('='.repeat(80));
  console.log(`Total Duration: ${totalDuration}s`);
  console.log(`Total Tasks: ${executionTasks.length}`);
  console.log(`Failed Tasks: ${failedTasks}`);
  console.log(`Success Rate: ${(((executionTasks.length - failedTasks) / executionTasks.length) * 100).toFixed(1)}%`);
  console.log('='.repeat(80));

  // Exit with error code if any tasks failed
  process.exit(failedTasks > 0 ? 1 : 0);
}

// Execute main function
runParallelTests()
  .then((exitCode) => {
    process.exit(exitCode);
  })
  .catch((error) => {
    console.error('Fatal error:', error);
    process.exit(1);
  });
