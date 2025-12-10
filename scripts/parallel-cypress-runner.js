#!/usr/bin/env node
/**
 * Parallel Cypress Test Runner
 *
 * Discovers Cypress test files by naming patterns and executes them in parallel chunks
 * within a single Docker container.
 */

const { spawn, exec } = require('child_process');
const path = require('path');
const { glob } = require('glob');

// Configuration
const WORKSPACE_ROOT = process.env.WORKSPACE_ROOT || process.cwd();
const PARALLEL_STREAMS = Math.max(1, parseInt(process.env.PARALLEL_STREAMS || '3', 10));
const SPEC_PATTERN = process.env.SPEC_PATTERN || '';
const IS_CI = process.env.CI === 'true';

// Test domain patterns - used when SPEC_PATTERN is not provided
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
 * Start Xvfb servers for CI environment
 * @param {number} count - Number of Xvfb servers to start
 * @returns {Promise<void>}
 */
function startXvfbServers(count) {
  return new Promise((resolve, reject) => {
    if (!IS_CI) {
      console.log('Not in CI environment, skipping Xvfb setup');
      resolve();
      return;
    }

    console.log(`Starting ${count} Xvfb server(s) for parallel execution...`);

    const commands = [];
    for (let i = 99; i < 99 + count; i++) {
      commands.push(`Xvfb :${i} -screen 0 1280x1024x24 -ac -nolisten tcp -nolisten unix > /dev/null 2>&1 &`);
    }

    // Use newlines to properly separate background commands
    const startCommand = commands.join('\nsleep 0.1\n') + '\nsleep 0.5';

    exec(startCommand, { shell: '/bin/bash' }, (error) => {
      if (error) {
        console.error('Failed to start Xvfb servers:', error.message);
        reject(error);
        return;
      }

      // Give Xvfb servers time to initialize
      setTimeout(() => {
        console.log(`Xvfb servers started on displays :99 to :${98 + count}`);
        resolve();
      }, 500);
    });
  });
}

/**
 * Cleanup Xvfb servers on exit
 */
function cleanupXvfbServers() {
  if (!IS_CI) return;

  exec('pkill -f Xvfb', (error) => {
    if (error) {
      console.error('Failed to cleanup Xvfb servers:', error.message);
    }
  });
}

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
 * @param {number} displayNumber - Unique display number for Xvfb (99+)
 * @returns {Promise<number>} Exit code of the Cypress process
 */
function executeCypressChunk(specFiles, chunkName, displayNumber) {
  return new Promise((resolve) => {
    const specArg = specFiles.join(',');
    const startTime = Date.now();

    console.log(`[${chunkName}] Starting execution with ${specFiles.length} file(s) on display :${displayNumber}`);

    const cypressProcess = spawn('npx', ['cypress', 'run', '--spec', specArg], {
      stdio: 'inherit',
      cwd: WORKSPACE_ROOT,
      shell: true, // Enables cross-platform compatibility for npx
      env: {
        ...process.env,
        DISPLAY: `:${displayNumber}`, // Assign unique display to avoid Xvfb conflicts
      },
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
  console.log(`CI Environment: ${IS_CI ? 'Yes' : 'No'}`);

  if (SPEC_PATTERN) {
    console.log(`Spec Pattern: ${SPEC_PATTERN}`);
  }

  console.log('='.repeat(80));
  console.log('');

  // Start Xvfb servers if in CI environment
  try {
    await startXvfbServers(PARALLEL_STREAMS);
  } catch (error) {
    console.error('Failed to initialize Xvfb servers:', error.message);
    process.exit(1);
  }

  // Register cleanup handler
  process.on('exit', cleanupXvfbServers);
  process.on('SIGINT', () => {
    cleanupXvfbServers();
    process.exit(130);
  });
  process.on('SIGTERM', () => {
    cleanupXvfbServers();
    process.exit(143);
  });

  // Discover test files
  const domainFiles = {};

  if (SPEC_PATTERN) {
    // Use custom spec pattern
    console.log(`Discovering tests with custom pattern...`);
    const files = await discoverTestFiles(SPEC_PATTERN);
    domainFiles['custom'] = files;
    console.log(`  Found ${files.length} file(s)`);
  } else {
    // Use default domain patterns
    for (const [domainKey, domainConfig] of Object.entries(TEST_DOMAINS)) {
      console.log(`Discovering ${domainConfig.name}...`);
      const files = await discoverTestFiles(domainConfig.pattern);
      domainFiles[domainKey] = files;
      console.log(`  Found ${files.length} file(s)`);
    }
  }

  console.log('');

  // Create execution tasks
  const executionTasks = [];

  for (const [domainKey, files] of Object.entries(domainFiles)) {
    if (files.length === 0) continue;

    const domainName = SPEC_PATTERN ? 'Custom Pattern Tests' : TEST_DOMAINS[domainKey]?.name || domainKey;
    const chunks = splitIntoChunks(files, PARALLEL_STREAMS);

    console.log(`${domainName}: ${files.length} file(s) → ${chunks.length} chunk(s)`);

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
        const displayNumber = 99 + (taskId % PARALLEL_STREAMS); // Reuse display numbers from available Xvfb servers
        taskIndex++;

        // Add 1-second delay between starts to prevent race conditions during Xvfb initialization
        if (activePromises.size > 0) {
          await new Promise((resolve) => setTimeout(resolve, 1000));
        }

        const promise = executeCypressChunk(task.files, task.name, displayNumber).then((exitCode) => {
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
  console.log(`Success Rate: ${executionTasks.length > 0 ? (((executionTasks.length - failedTasks) / executionTasks.length) * 100).toFixed(1) : '0.0'}%`);
  console.log('='.repeat(80));

  // Exit with error code if any tasks failed
  process.exit(failedTasks > 0 ? 1 : 0);
}

// Execute main function
runParallelTests().catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});
