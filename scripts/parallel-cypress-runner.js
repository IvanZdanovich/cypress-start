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

// Pre-setup tests that must run first
const PRE_SETUP_PATTERN = 'cypress/support/00-global-before.hook.spec.js';

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
 * Classify files into domains based on their paths and patterns
 * @param {string[]} files - Array of file paths
 * @returns {Object} Object with domain keys and arrays of files
 */
function classifyFilesIntoDomains(files) {
  const domainFiles = {
    integrationApi: [],
    integrationUi: [],
    e2eUi: [],
  };

  files.forEach((file) => {
    // Normalize path for consistent matching
    const normalizedPath = file.replace(/\\/g, '/');

    // Check against each domain pattern
    if (normalizedPath.match(/^cypress\/integration\/api\/.*\.api\.spec\.js$/)) {
      domainFiles.integrationApi.push(file);
    } else if (normalizedPath.match(/^cypress\/integration\/ui\/.*\.ui\.spec\.js$/)) {
      domainFiles.integrationUi.push(file);
    } else if (normalizedPath.match(/^cypress\/e2e\/.*\.ui\.spec\.js$/)) {
      domainFiles.e2eUi.push(file);
    }
    // Files that don't match any domain pattern are ignored (shouldn't happen with proper patterns)
  });

  return domainFiles;
}

/**
 * Execute Cypress for a specific set of spec files
 * @param {string[]} specFiles - Array of spec file paths
 * @param {string} chunkName - Name identifier for this chunk
 * @param {number} displayNumber - Unique display number for Xvfb (99+)
 * @param {boolean} bufferOutput - Whether to buffer output for sequential display
 * @returns {Promise<{exitCode: number, output: string, duration: number, chunkName: string, specFiles: string[]}>} Result object
 */
function executeCypressChunk(specFiles, chunkName, displayNumber, bufferOutput = false) {
  return new Promise((resolve) => {
    const specArg = specFiles.join(',');
    const startTime = Date.now();
    const browser = process.env.BROWSER || 'chrome';

    if (!bufferOutput) {
      console.log(`[${chunkName}] Starting execution with ${specFiles.length} file(s) on display :${displayNumber}`);
    }

    let outputBuffer = '';

    // Use default Cypress folders for screenshots and reports
    const reporterOptions = `reportDir=cypress/reports/separate-reports,reportFilename=[name]-[status]-[datetime]-report,overwrite=false,html=true,json=false,charts=false,reportPageTitle=Cypress Test Report,showHooks=always,embeddedScreenshots=true,inlineAssets=true,timestamp=longDate`;
    const cypressArgs = ['cypress', 'run', '--spec', specArg, '--browser', browser, '--reporter', 'mochawesome', '--reporter-options', reporterOptions];

    // Prepare environment variables - always unset SPEC_PATTERN to prevent cypress.config.js override
    const processEnv = { ...process.env };
    delete processEnv.SPEC_PATTERN;

    // Determine the correct npx command for cross-platform compatibility
    // On Windows, npx is a .cmd file that requires shell or explicit .cmd extension
    const isWindows = process.platform === 'win32';
    const npxCommand = isWindows ? 'npx.cmd' : 'npx';

    const cypressProcess = spawn(npxCommand, cypressArgs, {
      stdio: bufferOutput ? 'pipe' : 'inherit',
      cwd: WORKSPACE_ROOT,
      env: {
        ...processEnv,
        DISPLAY: `:${displayNumber}`, // Assign unique display to avoid Xvfb conflicts
      },
    });

    // Buffer output if requested
    if (bufferOutput) {
      cypressProcess.stdout?.on('data', (data) => {
        outputBuffer += data.toString();
      });

      cypressProcess.stderr?.on('data', (data) => {
        outputBuffer += data.toString();
      });
    }

    cypressProcess.on('close', (exitCode) => {
      const duration = ((Date.now() - startTime) / 1000).toFixed(2);
      // Handle null exit code (abnormal termination)
      const actualExitCode = exitCode !== null ? exitCode : 1;

      if (bufferOutput) {
        resolve({
          exitCode: actualExitCode,
          output: outputBuffer,
          duration: parseFloat(duration),
          chunkName,
          specFiles,
        });
      } else {
        if (actualExitCode === 0) {
          console.log(`[${chunkName}] ✔ Completed successfully in ${duration}s`);
        } else {
          console.error(`[${chunkName}] ✖ Failed with exit code ${actualExitCode} after ${duration}s`);
        }

        resolve({
          exitCode: actualExitCode,
          output: '',
          duration: parseFloat(duration),
          chunkName,
          specFiles,
        });
      }
    });

    cypressProcess.on('error', (error) => {
      const duration = ((Date.now() - startTime) / 1000).toFixed(2);
      const errorMsg = `[${chunkName}] ✖ Process error: ${error.message}`;

      if (bufferOutput) {
        outputBuffer += errorMsg + '\n';
        resolve({
          exitCode: 1,
          output: outputBuffer,
          duration: parseFloat(duration),
          chunkName,
          specFiles,
        });
      } else {
        console.error(errorMsg);
        resolve({
          exitCode: 1,
          output: '',
          duration: parseFloat(duration),
          chunkName,
          specFiles,
        });
      }
    });
  });
}

/**
 * Execute pre-setup tests sequentially before parallel execution
 * @returns {Promise<{exitCode: number, preSetupFiles: string[]}>} Exit code and discovered files
 */
async function executePreSetupTests() {
  console.log('='.repeat(80));
  console.log('Pre-Setup Tests Execution');
  console.log('='.repeat(80));
  console.log(`Pattern: ${PRE_SETUP_PATTERN}`);
  console.log('');

  const preSetupFiles = await discoverTestFiles(PRE_SETUP_PATTERN);

  if (preSetupFiles.length === 0) {
    console.log('No pre-setup tests found. Skipping.');
    console.log('='.repeat(80));
    console.log('');
    return { exitCode: 0, preSetupFiles: [] };
  }

  console.log(`Found ${preSetupFiles.length} pre-setup test file(s):`);
  preSetupFiles.forEach((file) => console.log(`  - ${file}`));
  console.log('');

  const result = await executeCypressChunk(preSetupFiles, 'pre-setup', 99, false);

  console.log('='.repeat(80));
  console.log('');

  if (result.exitCode !== 0) {
    console.error('Pre-setup tests failed. Aborting parallel execution.');
    return { exitCode: result.exitCode, preSetupFiles };
  }

  console.log('Pre-setup tests completed successfully. Proceeding to parallel execution...');
  console.log('');
  return { exitCode: 0, preSetupFiles };
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

  // Register cleanup handlers (use once to prevent duplicates)
  const handleExit = () => {
    cleanupXvfbServers();
  };

  const handleSigInt = () => {
    cleanupXvfbServers();
    process.exit(130);
  };

  const handleSigTerm = () => {
    cleanupXvfbServers();
    process.exit(143);
  };

  process.once('exit', handleExit);
  process.once('SIGINT', handleSigInt);
  process.once('SIGTERM', handleSigTerm);

  // Execute pre-setup tests first
  const { exitCode: preSetupExitCode, preSetupFiles } = await executePreSetupTests();
  if (preSetupExitCode !== 0) {
    console.error('Exiting due to pre-setup test failure.');
    process.exit(preSetupExitCode);
  }

  // Use pre-setup files discovered during execution to exclude them from parallel execution
  const preSetupFilesSet = new Set(preSetupFiles);

  // Discover test files
  const domainFiles = {};

  if (SPEC_PATTERN) {
    // Use custom spec pattern but classify into domains
    console.log(`Discovering tests with custom pattern...`);
    const files = await discoverTestFiles(SPEC_PATTERN);
    // Filter out pre-setup files
    const filteredFiles = files.filter((file) => !preSetupFilesSet.has(file));

    // Classify files into domains for better organization
    const classifiedDomains = classifyFilesIntoDomains(filteredFiles);

    // Only include domains that have files
    let totalClassified = 0;
    for (const [domainKey, filesInDomain] of Object.entries(classifiedDomains)) {
      if (filesInDomain.length > 0) {
        domainFiles[domainKey] = filesInDomain;
        totalClassified += filesInDomain.length;
        console.log(`  ${TEST_DOMAINS[domainKey].name}: ${filesInDomain.length} file(s)`);
      }
    }

    // If some files couldn't be classified, add them to a generic domain
    if (totalClassified < filteredFiles.length) {
      const unclassifiedFiles = filteredFiles.filter((file) => {
        return !Object.values(classifiedDomains).some((domainFileList) => domainFileList.includes(file));
      });

      if (unclassifiedFiles.length > 0) {
        domainFiles['custom'] = unclassifiedFiles;
        console.log(`  Custom Pattern Tests: ${unclassifiedFiles.length} file(s) (unclassified)`);
      }
    }

    console.log(`  Total: ${files.length} file(s) found, ${filteredFiles.length} after filtering pre-setup`);
  } else {
    // Use default domain patterns
    for (const [domainKey, domainConfig] of Object.entries(TEST_DOMAINS)) {
      console.log(`Discovering ${domainConfig.name}...`);
      const files = await discoverTestFiles(domainConfig.pattern);
      // Filter out pre-setup files
      const filteredFiles = files.filter((file) => !preSetupFilesSet.has(file));
      domainFiles[domainKey] = filteredFiles;
      console.log(`  Found ${files.length} file(s), ${filteredFiles.length} after filtering pre-setup`);
    }
  }

  console.log('');

  // Create execution tasks
  const executionTasks = [];

  // Collect all files from all domains into a single array for unified chunking
  const allFiles = [];
  for (const [, files] of Object.entries(domainFiles)) {
    allFiles.push(...files);
  }

  if (allFiles.length > 0) {
    // Split all files into chunks without domain separation
    const chunks = splitIntoChunks(allFiles, PARALLEL_STREAMS);

    console.log('Unified Chunking Strategy (no domain separation):');
    console.log(`  Total files: ${allFiles.length}`);
    console.log(`  Chunks created: ${chunks.length}`);
    console.log(`  Files per chunk: ${chunks.map((c) => c.length).join(', ')}`);
    console.log('');

    chunks.forEach((chunk, index) => {
      const chunkName = `stream-${index + 1}`;
      executionTasks.push({
        name: chunkName,
        domain: 'mixed', // Indicates mixed domain content
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
    const displayMap = new Map(); // Track which display is assigned to which active task

    console.log('Starting parallel execution with buffered output...');
    console.log('');

    while (taskIndex < executionTasks.length || activePromises.size > 0) {
      // Start new tasks up to the parallel limit
      while (taskIndex < executionTasks.length && activePromises.size < PARALLEL_STREAMS) {
        const task = executionTasks[taskIndex];
        const taskId = taskIndex;

        // Find available display number (99 to 99+PARALLEL_STREAMS-1)
        let displayNumber = 99;
        const usedDisplays = new Set(displayMap.values());
        for (let i = 0; i < PARALLEL_STREAMS; i++) {
          const candidate = 99 + i;
          if (!usedDisplays.has(candidate)) {
            displayNumber = candidate;
            break;
          }
        }
        displayMap.set(taskId, displayNumber);

        console.log(`[${task.name}] Starting execution with ${task.files.length} file(s) on display :${displayNumber}`);

        taskIndex++;

        // Add 1-second delay between starts to prevent race conditions during Xvfb initialization
        await new Promise((resolve) => setTimeout(resolve, 1000));

        const promise = executeCypressChunk(task.files, task.name, displayNumber, true).then((result) => {
          console.log(`[${result.chunkName}] ${result.exitCode === 0 ? '✔' : '✖'} Completed in ${result.duration}s`);
          results.push({ task, result });
          activePromises.delete(taskId);
          displayMap.delete(taskId); // Free up the display number
          return result;
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

  // Display buffered outputs sequentially
  console.log('');
  console.log('='.repeat(80));
  console.log('Sequential Output from Parallel Streams');
  console.log('='.repeat(80));
  console.log('');

  taskResults.forEach(({ result }) => {
    console.log('─'.repeat(80));
    console.log(`Stream: ${result.chunkName} | Duration: ${result.duration}s | Status: ${result.exitCode === 0 ? 'PASSED' : 'FAILED'}`);
    console.log(`Files: ${result.specFiles.length}`);
    result.specFiles.forEach((file) => console.log(`  - ${file}`));
    console.log('─'.repeat(80));
    if (result.output) {
      console.log(result.output);
    } else {
      console.log('(No output captured)');
    }
    console.log('');
  });

  // Calculate summary
  const failedTasks = taskResults.filter((r) => r.result.exitCode !== 0).length;
  const totalDuration = ((Date.now() - startTime) / 1000).toFixed(2);

  console.log('');
  console.log('='.repeat(80));
  console.log('Execution Summary');
  console.log('='.repeat(80));
  console.log(`Total Duration: ${totalDuration}s`);
  console.log(`Total Tasks: ${executionTasks.length}`);
  console.log(`Failed Tasks: ${failedTasks}`);
  console.log(`Success Rate: ${executionTasks.length > 0 ? (((executionTasks.length - failedTasks) / executionTasks.length) * 100).toFixed(1) : '0.0'}%`);
  console.log('');
  console.log('Artifacts:');
  console.log(`  Screenshots: ${WORKSPACE_ROOT}/cypress/screenshots/`);
  console.log(`  Reports: ${WORKSPACE_ROOT}/cypress/reports/separate-reports/`);
  console.log('='.repeat(80));

  // Exit with error code if any tasks failed
  process.exit(failedTasks > 0 ? 1 : 0);
}

// Execute main function
runParallelTests().catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});
