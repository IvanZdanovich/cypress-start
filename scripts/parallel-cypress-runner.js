#!/usr/bin/env node
/**
 * Parallel Cypress Test Runner
 *
 * Discovers Cypress test files by naming patterns and executes them in parallel chunks
 * within a single Docker container.
 */

const { spawn, exec } = require('child_process');
const path = require('path');
const { finished } = require('stream');
const { glob } = require('glob');

// Configuration
const WORKSPACE_ROOT = process.env.WORKSPACE_ROOT || process.cwd();
const PARALLEL_STREAMS = Math.max(1, parseInt(process.env.PARALLEL_STREAMS || '3', 10));
const SPEC_PATTERN = process.env.SPEC_PATTERN || '';
const IS_CI = process.env.CI === 'true';
const CHUNK_STRATEGY = process.env.CHUNK_STRATEGY || 'unified'; // 'unified' or 'domain'

// Pre-setup tests that must run first
const PRE_SETUP_PATTERN = '';

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

const STDOUT_WRITE_CHUNK_SIZE = 64 * 1024;

// ANSI colour codes (ESC[...m) that Cypress wraps its run summary in. ESC is
// built from its char code so the pattern holds no control-character escape.
const ANSI_SGR_PATTERN = new RegExp(`${String.fromCharCode(27)}\\[[0-9;]*m`, 'g');

/**
 * Write text to stdout and wait until each chunk is flushed, so piped output is not truncated on exit
 * @param {string} text - Text to write
 * @returns {Promise<void>}
 */
async function writeToStdout(text) {
  const data = Buffer.from(text, 'utf8');
  for (let offset = 0; offset < data.length; offset += STDOUT_WRITE_CHUNK_SIZE) {
    const chunk = data.subarray(offset, offset + STDOUT_WRITE_CHUNK_SIZE);
    await new Promise((resolve) => process.stdout.write(chunk, () => resolve()));
  }
}

/**
 * Wait until the given readable streams have finished emitting data
 * @param {Array<import('stream').Readable|null|undefined>} streams - Streams to wait for
 * @returns {Promise<void>}
 */
function waitForStreamsToFinish(streams) {
  return Promise.all(
    streams.filter(Boolean).map(
      (stream) =>
        new Promise((resolve) => {
          if (stream.destroyed || stream.readableEnded) {
            resolve();
            return;
          }
          finished(stream, () => resolve());
        }),
    ),
  );
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
    return files.map((file) => path.relative(WORKSPACE_ROOT, file)).toSorted();
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

  for (const [index, file] of files.entries()) {
    chunks[index % numChunks].push(file);
  }

  // Filter out empty chunks
  return chunks.filter((chunk) => chunk.length > 0);
}

// Domain key → spec path pattern (matched against forward-slash paths).
const DOMAIN_PATTERNS = [
  ['integrationApi', /^cypress\/integration\/api\/.*\.api\.spec\.js$/],
  ['integrationUi', /^cypress\/integration\/ui\/.*\.ui\.spec\.js$/],
  ['e2eUi', /^cypress\/e2e\/.*\.ui\.spec\.js$/],
];

/**
 * Classify files into domains based on their paths and patterns. Pure: no logging.
 * @param {string[]} files - Array of file paths
 * @returns {{ domainFiles: Object<string, string[]>, unmatchedFiles: string[] }}
 */
function classifyFilesIntoDomains(files) {
  const groups = Object.groupBy(files, (file) => {
    const normalizedPath = file.replace(/\\/g, '/');
    return DOMAIN_PATTERNS.find(([, pattern]) => pattern.test(normalizedPath))?.[0] ?? 'unmatched';
  });

  return {
    domainFiles: Object.fromEntries(DOMAIN_PATTERNS.map(([key]) => [key, groups[key] ?? []])),
    unmatchedFiles: groups.unmatched ?? [],
  };
}

/**
 * Warn about files that don't match any domain pattern
 * @param {string[]} unmatchedFiles
 */
function warnUnmatchedFiles(unmatchedFiles) {
  if (unmatchedFiles.length === 0) return;

  console.warn(`Warning: ${unmatchedFiles.length} file(s) did not match any domain pattern and will be ignored:`);
  for (const file of unmatchedFiles) console.warn(`  - ${file}`);
  console.warn('  Expected patterns:');
  console.warn('    - cypress/integration/api/**/*.api.spec.js');
  console.warn('    - cypress/integration/ui/**/*.ui.spec.js');
  console.warn('    - cypress/e2e/**/*.ui.spec.js');
  console.warn('');
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

    const cypressArgs = ['cypress', 'run', '--spec', specArg, '--browser', browser];

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
      cypressProcess.stdout?.setEncoding('utf8');
      cypressProcess.stderr?.setEncoding('utf8');

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

    cypressProcess.on('error', async (error) => {
      const duration = ((Date.now() - startTime) / 1000).toFixed(2);
      const errorMsg = `[${chunkName}] ✖ Process error: ${error.message}`;

      if (bufferOutput) {
        await waitForStreamsToFinish([cypressProcess.stdout, cypressProcess.stderr]);
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
 * Find "<failed> of <total> failed" in whitespace-separated tokens.
 * @param {string} text Output with ANSI colour codes stripped
 * @returns {number|null} Failed count, or null when the summary is missing
 */
function parseFailedSpecCount(text) {
  const tokens = text.split(/\s+/);
  const isCount = (token) => /^\d+$/.test(token);
  for (let i = 0; i + 3 < tokens.length; i++) {
    if (tokens[i + 1] === 'of' && tokens[i + 3] === 'failed' && isCount(tokens[i]) && isCount(tokens[i + 2])) {
      return parseInt(tokens[i], 10);
    }
  }
  return null;
}

/**
 * Count failed spec files in a chunk from Cypress's run-summary line
 * ("✖  2 of 10 failed (20%)"), which is spec-file level. When the line is
 * missing from a failed chunk, counts it as 1 failed spec file.
 * @param {{exitCode: number, output: string, specFiles: string[]}} result
 * @returns {number} Failed spec files in the chunk
 */
function countFailedSpecFiles(result) {
  if (result.exitCode === 0) return 0;
  const plain = (result.output || '').replace(ANSI_SGR_PATTERN, '');
  const failed = parseFailedSpecCount(plain);
  return failed ?? 1;
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
  console.log(`Chunking Strategy: ${CHUNK_STRATEGY}`);
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
    process.exitCode = preSetupExitCode;
    return;
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
    const { domainFiles: classifiedDomains, unmatchedFiles } = classifyFilesIntoDomains(filteredFiles);
    warnUnmatchedFiles(unmatchedFiles);

    // Only include domains that have files
    for (const [domainKey, filesInDomain] of Object.entries(classifiedDomains)) {
      if (filesInDomain.length > 0) {
        domainFiles[domainKey] = filesInDomain;
        console.log(`  ${TEST_DOMAINS[domainKey].name}: ${filesInDomain.length} file(s)`);
      }
    }

    // If some files couldn't be classified, add them to a generic domain
    if (unmatchedFiles.length > 0) {
      domainFiles['custom'] = unmatchedFiles;
      console.log(`  Custom Pattern Tests: ${unmatchedFiles.length} file(s) (unclassified)`);
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

  if (CHUNK_STRATEGY === 'domain') {
    // Domain-separated strategy: split each domain independently into chunks
    console.log('Domain-Separated Chunking Strategy:');

    for (const [domainKey, files] of Object.entries(domainFiles)) {
      if (files.length === 0) continue;

      const domainName = TEST_DOMAINS[domainKey]?.name || `${domainKey} tests`;
      const chunks = splitIntoChunks(files, PARALLEL_STREAMS);

      console.log(`  ${domainName}:`);
      console.log(`    Total files: ${files.length}`);
      console.log(`    Chunks: ${chunks.length}`);
      console.log(`    Files per chunk: ${chunks.map((c) => c.length).join(', ')}`);

      executionTasks.push(...chunks.map((chunk, index) => ({ name: `${domainKey}-${index + 1}`, domain: domainKey, files: chunk })));
    }

    console.log(`  Total tasks: ${executionTasks.length}`);
  } else {
    // Unified strategy: collect all files from all domains into a single array
    const allFiles = Object.values(domainFiles).flat();

    if (allFiles.length > 0) {
      // Split all files into chunks without domain separation
      const chunks = splitIntoChunks(allFiles, PARALLEL_STREAMS);

      console.log('Unified Chunking Strategy (no domain separation):');
      console.log(`  Total files: ${allFiles.length}`);
      console.log(`  Chunks created: ${chunks.length}`);
      console.log(`  Files per chunk: ${chunks.map((c) => c.length).join(', ')}`);

      // 'mixed' indicates mixed domain content
      executionTasks.push(...chunks.map((chunk, index) => ({ name: `stream-${index + 1}`, domain: 'mixed', files: chunk })));
    }
  }

  console.log('');
  console.log(`Total execution tasks: ${executionTasks.length}`);
  console.log('='.repeat(80));
  console.log('');

  if (executionTasks.length === 0) {
    console.log('No test files found. Exiting.');
    process.exitCode = 0;
    return;
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

  for (const { result } of taskResults) {
    console.log('─'.repeat(80));
    console.log(`Stream: ${result.chunkName} | Duration: ${result.duration}s | Status: ${result.exitCode === 0 ? 'PASSED' : 'FAILED'}`);
    console.log(`Files: ${result.specFiles.length}`);
    result.specFiles.forEach((file) => console.log(`  - ${file}`));
    console.log('─'.repeat(80));
    if (result.output) {
      await writeToStdout(result.output.endsWith('\n') ? result.output : `${result.output}\n`);
    } else {
      console.log('(No output captured)');
    }
    console.log('');
  }

  // Calculate summary
  const failedTasks = taskResults.filter((r) => r.result.exitCode !== 0).length;
  const totalSpecFiles = taskResults.reduce((sum, r) => sum + r.result.specFiles.length, 0);
  const failedSpecFiles = taskResults.reduce((sum, r) => sum + countFailedSpecFiles(r.result), 0);
  const totalDuration = ((Date.now() - startTime) / 1000).toFixed(2);

  console.log('');
  console.log('='.repeat(80));
  console.log('Execution Summary');
  console.log('='.repeat(80));
  console.log(`Total Duration: ${totalDuration}s`);
  console.log(`Total Tasks: ${executionTasks.length} (failed: ${failedTasks})`);
  console.log(`Total Spec Files: ${totalSpecFiles}`);
  console.log(`Failed Spec Files: ${failedSpecFiles}`);
  console.log(`Success Rate (spec files): ${totalSpecFiles > 0 ? (((totalSpecFiles - failedSpecFiles) / totalSpecFiles) * 100).toFixed(1) : '0.0'}%`);
  console.log('='.repeat(80));

  // Set exit code instead of exiting so stdout/stderr are fully flushed before Node exits
  process.exitCode = failedTasks > 0 ? 1 : 0;
}

// Execute main function
runParallelTests().catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});
