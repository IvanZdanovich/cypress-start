#!/usr/bin/env node

/**
 * Coverage Gap Analysis Script
 *
 * Compares expected test structure with actual test structure
 * and generates coverage gap reports. Analyzes actual test files to count
 * it blocks, skipped tests, and calculate real test coverage.
 *
 * Usage:
 *   node scripts/analyze-coverage-gaps.js --type=integration-ui
 *   node scripts/analyze-coverage-gaps.js --type=all --format=markdown --output=report.md
 *   node scripts/analyze-coverage-gaps.js --type=integration-api --threshold=80
 *
 * Options:
 *   --type=<type>         Test type: integration-ui, integration-api, e2e-ui, all (default: all)
 *   --format=<format>     Output format: cli, markdown, both (default: both)
 *   --output=<path>       Save markdown report to file
 *   --threshold=<number>  Fail if coverage below percentage (0-100)
 *
 * Path coverage counts only paths with at least one active `it` block.
 * Tests skipped directly or through a skipped ancestor suite are pending.
 * Skipped-only paths are reported separately and do not independently fail.
 */

const fs = require('fs');
const path = require('path');
const espree = require('espree');

// Configuration
const CONFIG = {
  'integration-ui': {
    expectedFile: 'components.json',
    name: 'Integration UI',
    testDir: 'cypress/integration/ui',
    testPattern: /\.ui\.spec\.js$/,
  },
  'integration-api': {
    expectedFile: 'modules.json',
    name: 'Integration API',
    testDir: 'cypress/integration/api',
    testPattern: /\.api\.spec\.js$/,
  },
  'e2e-ui': {
    expectedFile: 'workflows.json',
    name: 'E2E UI',
    testDir: 'cypress/e2e/ui',
    testPattern: /\.spec\.js$/,
  },
};

// ANSI color codes
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  dim: '\x1b[2m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
  magenta: '\x1b[35m',
};

function colorize(text, color) {
  return `${colors[color]}${text}${colors.reset}`;
}

function getCoverageColor(percent) {
  if (percent >= 80) return 'green';
  if (percent >= 60) return 'yellow';
  return 'red';
}

function getCoverageLabel(percent) {
  if (percent >= 90) return 'Excellent';
  if (percent >= 70) return 'Good';
  return 'Critical';
}

/**
 * Parse command line arguments
 */
function parseArgs() {
  const args = process.argv.slice(2);
  const parsed = {
    type: 'all',
    format: 'both', // cli, markdown, both
    output: null,
    threshold: null,
  };

  for (const arg of args) {
    if (arg.startsWith('--type=')) {
      parsed.type = arg.slice(arg.indexOf('=') + 1);
    } else if (arg.startsWith('--format=')) {
      parsed.format = arg.slice(arg.indexOf('=') + 1);
    } else if (arg.startsWith('--output=')) {
      parsed.output = arg.slice(arg.indexOf('=') + 1);
    } else if (arg.startsWith('--threshold=')) {
      const value = arg.slice(arg.indexOf('=') + 1);
      parsed.threshold = value === '' ? NaN : Number(value);
    }
  }

  return parsed;
}

/**
 * Recursively find all test files in a directory
 */
function findTestFiles(dir, pattern) {
  if (!fs.existsSync(dir)) {
    return [];
  }

  return fs
    .readdirSync(dir, { withFileTypes: true, recursive: true })
    .filter((entry) => entry.isFile() && pattern.test(entry.name))
    .map((entry) => path.join(entry.parentPath, entry.name));
}

/**
 * Extract structure path from test title (before colon)
 */
function extractStructurePath(title) {
  const colonIndex = title.indexOf(':');
  if (colonIndex === -1) {
    return null;
  }

  const fullPath = title.substring(0, colonIndex).trim();

  // Must have at least one dot and follow PascalCase convention
  if (!fullPath.includes('.') || !/^([A-Z][a-zA-Z]+\.)*[A-Z]+$/.test(fullPath)) {
    return null;
  }

  return fullPath;
}

/**
 * Parse a test file and extract test block information
 */
function parseTestFile(filePath) {
  const content = fs.readFileSync(filePath, 'utf-8');
  const testBlocks = [];
  let ast;

  try {
    ast = espree.parse(content, {
      ecmaVersion: 'latest',
      sourceType: 'module',
    });
  } catch (error) {
    return {
      testBlocks,
      parseError: {
        filePath,
        message: error.message,
      },
    };
  }

  const getCallDescriptor = (callee) => {
    if (callee.type === 'Identifier' && ['describe', 'context', 'it'].includes(callee.name)) {
      return { name: callee.name, skipped: false };
    }

    if (
      callee.type === 'MemberExpression' &&
      !callee.computed &&
      callee.object.type === 'Identifier' &&
      ['describe', 'context', 'it'].includes(callee.object.name) &&
      callee.property.type === 'Identifier' &&
      ['only', 'skip'].includes(callee.property.name)
    ) {
      return {
        name: callee.object.name,
        skipped: callee.property.name === 'skip',
      };
    }

    return null;
  };

  const getCallback = (node) => node.arguments.findLast((argument) => ['ArrowFunctionExpression', 'FunctionExpression'].includes(argument.type));

  const getStringValue = (node) => {
    if (node?.type === 'Literal' && typeof node.value === 'string') {
      return node.value;
    }

    if (node?.type === 'TemplateLiteral' && node.expressions.length === 0) {
      return node.quasis[0].value.cooked ?? node.quasis[0].value.raw;
    }

    return null;
  };

  const hasBody = (callback) => {
    if (!callback) {
      return false;
    }

    return callback.body.type === 'BlockStatement' ? callback.body.body.length > 0 : true;
  };

  const visit = (node, suiteSkipped = false) => {
    if (!node || typeof node !== 'object') {
      return;
    }

    if (node.type === 'CallExpression') {
      const descriptor = getCallDescriptor(node.callee);

      if (descriptor?.name === 'describe' || descriptor?.name === 'context') {
        const callback = getCallback(node);
        if (callback) {
          visit(callback, suiteSkipped || descriptor.skipped);
        }
        return;
      }

      if (descriptor?.name === 'it') {
        const title = getStringValue(node.arguments[0]);
        const structurePath = extractStructurePath(title ?? '');

        if (structurePath) {
          testBlocks.push({
            title,
            structurePath,
            isSkipped: suiteSkipped || descriptor.skipped || !hasBody(getCallback(node)),
            filePath,
          });
        }
        return;
      }
    }

    for (const value of Object.values(node)) {
      if (Array.isArray(value)) {
        value.forEach((child) => visit(child, suiteSkipped));
      } else {
        visit(value, suiteSkipped);
      }
    }
  };

  visit(ast);
  return { testBlocks, parseError: null };
}

/**
 * Build a nested structure from flat test paths with counts
 */
function buildStructureWithCounts(testBlocks) {
  const structure = {};
  const pathCounts = {};

  // Count total and skipped tests for each path
  for (const block of testBlocks) {
    const structurePath = block.structurePath;

    pathCounts[structurePath] ??= { total: 0, skipped: 0, active: 0 };
    pathCounts[structurePath].total++;
    if (block.isSkipped) {
      pathCounts[structurePath].skipped++;
    } else {
      pathCounts[structurePath].active++;
    }
  }

  // Build nested structure
  for (const [dotPath, counts] of Object.entries(pathCounts)) {
    const parts = dotPath.split('.');
    let current = structure;

    for (let i = 0; i < parts.length; i++) {
      const part = parts[i];

      if (!current[part]) {
        current[part] = {};
      }

      // Store counts at the deepest level
      if (i === parts.length - 1) {
        current[part].__counts = counts;
      }

      current = current[part];
    }
  }

  return { structure, pathCounts };
}

/**
 * Get all test files and parse them
 */
function parseAllTestFiles(testDir, testPattern) {
  const rootDir = path.resolve(__dirname, '..');
  const fullTestDir = path.join(rootDir, testDir);
  const testFiles = findTestFiles(fullTestDir, testPattern);

  const parsedFiles = testFiles.map(parseTestFile);
  const allTestBlocks = parsedFiles.flatMap((result) => result.testBlocks);
  const parseErrors = parsedFiles.map((result) => result.parseError).filter(Boolean);

  const allStructure = buildStructureWithCounts(allTestBlocks);
  const activeStructure = buildStructureWithCounts(allTestBlocks.filter((block) => !block.isSkipped));
  const skippedOnlyPaths = Object.entries(allStructure.pathCounts)
    .filter(([, counts]) => counts.active === 0 && counts.skipped > 0)
    .map(([structurePath]) => structurePath)
    .toSorted();

  return {
    structure: allStructure.structure,
    activeStructure: activeStructure.structure,
    pathCounts: allStructure.pathCounts,
    skippedOnlyPaths,
    parseErrors,
  };
}

/**
 * Count leaf nodes in structure
 */
function countLeafNodes(obj, isRoot = false) {
  let count = 0;
  const keys = Object.keys(obj).filter((k) => k !== '__counts');

  if (keys.length === 0) {
    return isRoot ? 0 : 1;
  }

  for (const key of keys) {
    count += countLeafNodes(obj[key]);
  }

  return count;
}

/**
 * Count total test blocks in structure
 */
function countTestBlocks(obj, pathCounts, pathPrefix = '') {
  let counts = { total: 0, skipped: 0, active: 0 };

  function traverse(node, currentPath = '') {
    const keys = Object.keys(node).filter((k) => k !== '__counts');

    if (keys.length === 0) {
      // Leaf node - get counts from pathCounts
      if (pathCounts?.[currentPath]) {
        counts.total += pathCounts[currentPath].total;
        counts.skipped += pathCounts[currentPath].skipped;
        counts.active += pathCounts[currentPath].active;
      }
      return;
    }

    for (const key of keys) {
      const newPath = currentPath ? `${currentPath}.${key}` : key;
      traverse(node[key], newPath);
    }
  }

  traverse(obj, pathPrefix);
  return counts;
}

/**
 * Get all paths in structure as flat array
 */
function getAllPaths(obj, prefix = '') {
  const keys = Object.keys(obj).filter((k) => k !== '__counts');

  if (keys.length === 0) {
    return prefix ? [prefix] : [];
  }

  return keys.flatMap((key) => getAllPaths(obj[key], prefix ? `${prefix}.${key}` : key));
}

/**
 * Compare structures and find gaps using path sets
 */
function compareStructures(expected, actual) {
  const expectedPaths = new Set(getAllPaths(expected));
  const actualPaths = new Set(getAllPaths(actual));
  return {
    missing: [...expectedPaths].filter((p) => !actualPaths.has(p)),
    extra: [...actualPaths].filter((p) => !expectedPaths.has(p)),
  };
}

/**
 * Detect inconsistencies between expected and actual structures
 * Returns paths that exist in both but have different sub-structures
 */
function detectInconsistencies(expected, actual, pathPrefix = '') {
  const inconsistencies = [];

  for (const key in expected) {
    if (key === '__counts') continue;

    const currentPath = pathPrefix ? `${pathPrefix}.${key}` : key;

    if (key in actual) {
      const expectedKeys = Object.keys(expected[key])
        .filter((k) => k !== '__counts')
        .sort((a, b) => a.localeCompare(b));

      const actualKeys = Object.keys(actual[key])
        .filter((k) => k !== '__counts')
        .sort((a, b) => a.localeCompare(b));

      // Check if both are leaf nodes or both are branches
      const expectedIsLeaf = expectedKeys.length === 0;
      const actualIsLeaf = actualKeys.length === 0;

      if (expectedIsLeaf !== actualIsLeaf) {
        inconsistencies.push({
          path: currentPath,
          issue: expectedIsLeaf ? 'Expected leaf but found branch in actual' : 'Expected branch but found leaf in actual',
          expectedChildren: expectedKeys,
          actualChildren: actualKeys,
        });
      } else if (!expectedIsLeaf && !actualIsLeaf) {
        // Both are branches - check for structural differences at this level
        const expectedSet = new Set(expectedKeys);
        const actualSet = new Set(actualKeys);

        const onlyInExpected = expectedKeys.filter((k) => !actualSet.has(k));
        const onlyInActual = actualKeys.filter((k) => !expectedSet.has(k));

        if (onlyInExpected.length > 0 || onlyInActual.length > 0) {
          inconsistencies.push({
            path: currentPath,
            issue: 'Different child structure',
            onlyInExpected,
            onlyInActual,
          });
        }

        // Recurse into common children
        const commonKeys = expectedKeys.filter((k) => actualSet.has(k));
        for (const commonKey of commonKeys) {
          const subInconsistencies = detectInconsistencies(expected[key][commonKey], actual[key][commonKey], `${currentPath}.${commonKey}`);
          inconsistencies.push(...subInconsistencies);
        }
      }
    }
  }

  return inconsistencies;
}

/**
 * Group paths by top-level component/module
 */
function groupByTopLevel(paths) {
  return Object.groupBy(paths, (p) => p.split('.')[0]);
}

/**
 * Group paths by top-level component and order groups by size (largest first)
 */
function sortedGroupsByTopLevel(paths) {
  return Object.entries(groupByTopLevel(paths)).toSorted(([, a], [, b]) => b.length - a.length);
}

/**
 * Calculate coverage by top-level component/module
 */
function calculateCoverageByComponent(expected, activeActual, actualWithCounts, pathCounts) {
  const coverage = {};

  // Get all unique top-level keys from both structures
  const allKeys = new Set([...Object.keys(expected), ...Object.keys(activeActual).filter((k) => k !== '__counts')]);

  for (const key of allKeys) {
    const expectedCount = key in expected ? countLeafNodes(expected[key]) : 0;

    // Count active paths for path coverage and all tests for test health.
    const actualPathCount = key in activeActual ? countLeafNodes(activeActual[key]) : 0;
    const actualTestCounts = key in actualWithCounts ? countTestBlocks(actualWithCounts[key], pathCounts, key) : { total: 0, skipped: 0, active: 0 };

    const { missing: componentMissing, extra: componentExtra } = compareStructures(key in expected ? expected[key] : {}, key in activeActual ? activeActual[key] : {});
    const covered = expectedCount - componentMissing.length;
    let percent;

    if (expectedCount === 0 && actualPathCount > 0) {
      percent = 100;
    } else if (expectedCount === 0) {
      percent = 0;
    } else {
      percent = (covered / expectedCount) * 100;
    }

    // Calculate test coverage (active tests / total tests)
    const testCoveragePercent = actualTestCounts.total > 0 ? (actualTestCounts.active / actualTestCounts.total) * 100 : 0;

    coverage[key] = {
      expected: expectedCount,
      actualPaths: actualPathCount,
      covered: covered,
      percent: Math.round(percent * 10) / 10,
      extra: componentExtra.length,
      status: expectedCount === 0 && actualPathCount > 0 ? 'extra-only' : 'normal',
      tests: {
        total: actualTestCounts.total,
        active: actualTestCounts.active,
        skipped: actualTestCounts.skipped,
        coveragePercent: Math.round(testCoveragePercent * 10) / 10,
      },
    };
  }

  // Sort by status (normal first), then percent ascending, then by name
  return Object.fromEntries(
    Object.entries(coverage).toSorted(([keyA, a], [keyB, b]) => {
      // Put extra-only components at the end
      if (a.status !== b.status) {
        return a.status === 'extra-only' ? 1 : -1;
      }
      // Then sort by percent (worst first)
      if (a.percent !== b.percent) {
        return a.percent - b.percent;
      }
      // Finally by name
      return keyA.localeCompare(keyB);
    }),
  );
}

/**
 * Generate progress bar
 */
function generateProgressBar(percent, width = 10) {
  const filled = Math.min(width, Math.max(0, Math.round((percent / 100) * width)));
  return '[' + '█'.repeat(filled) + '░'.repeat(width - filled) + ']';
}

/**
 * Generate CLI report
 */
function generateCLIReport(result) {
  const { name, summary, gaps, coverageByComponent } = result;

  console.log(colorize('\n╔════════════════════════════════════════════════════════════╗', 'blue'));
  console.log(colorize('║         Test Coverage Gap Analysis Report                 ║', 'blue'));
  console.log(colorize('╚════════════════════════════════════════════════════════════╝', 'blue'));

  console.log(colorize(`\nType: ${name}`, 'bright'));
  console.log(colorize('='.repeat(60), 'cyan'));

  // Summary
  console.log(colorize('\nSUMMARY', 'bright'));
  console.log(colorize('\nStructure Coverage (test paths vs expected):', 'cyan'));
  console.log(`  Expected paths:        ${summary.totalExpected}`);
  console.log(`  Active paths:          ${summary.totalActual}`);
  console.log(`  Declared paths:        ${summary.totalDeclared}`);
  console.log(`  Missing paths:         ${colorize(summary.missing, summary.missing > 0 ? 'red' : 'green')}`);
  console.log(`  Extra paths:           ${colorize(summary.extra, summary.extra > 0 ? 'yellow' : 'green')}`);
  console.log(`  Skipped-only paths:    ${colorize(summary.skippedOnly, summary.skippedOnly > 0 ? 'yellow' : 'green')}`);

  const coverageColor = getCoverageColor(summary.coveragePercent);
  const coverageText = `${summary.coveragePercent}%`;
  console.log(`  ${colorize('→ Path Coverage:', 'bright')}     ${colorize(coverageText, coverageColor)}`);

  console.log(colorize('\nTest Implementation (active vs total tests):', 'cyan'));
  console.log(`  Total tests:           ${summary.totalTests || 0}`);
  console.log(`  Active tests:          ${summary.activeTests || 0}`);
  console.log(`  Skipped tests:         ${summary.skippedTests || 0}`);

  if (summary.testCoveragePercent !== undefined) {
    const testCoverageColor = getCoverageColor(summary.testCoveragePercent);
    const testCoverageText = `${summary.testCoveragePercent}%`;
    console.log(`  ${colorize('→ Test Coverage:', 'bright')}     ${colorize(testCoverageText, testCoverageColor)}`);
  }

  // Missing coverage
  if (gaps.missing.length > 0) {
    console.log(colorize(`\nMISSING COVERAGE (${gaps.missing.length} paths)`, 'red'));
    console.log(colorize('-'.repeat(60), 'dim'));

    const sortedGroups = sortedGroupsByTopLevel(gaps.missing);

    for (const [component, paths] of sortedGroups.slice(0, 10)) {
      console.log(colorize(`\n${component} (${paths.length} missing)`, 'yellow'));
      paths.slice(0, 5).forEach((p) => {
        console.log(`  ${colorize('-', 'red')} ${p}`);
      });
      if (paths.length > 5) {
        console.log(colorize(`  ... and ${paths.length - 5} more`, 'dim'));
      }
    }

    if (sortedGroups.length > 10) {
      console.log(colorize(`\n... and ${sortedGroups.length - 10} more components with missing coverage`, 'dim'));
    }
  } else {
    console.log(colorize('\nNo missing coverage.', 'green'));
  }

  if (gaps.skippedOnly.length > 0) {
    console.log(colorize(`\nSKIPPED-ONLY PATHS (${gaps.skippedOnly.length} paths)`, 'yellow'));
    console.log(colorize('-'.repeat(60), 'dim'));
    console.log(colorize('These declared paths have tests, but none are active:\n', 'dim'));
    gaps.skippedOnly.slice(0, 10).forEach((p) => {
      console.log(`  ${colorize('~', 'yellow')} ${p}`);
    });
    if (gaps.skippedOnly.length > 10) {
      console.log(colorize(`  ... and ${gaps.skippedOnly.length - 10} more`, 'dim'));
    }
  }

  // Extra coverage
  if (gaps.extra.length > 0) {
    console.log(colorize(`\nEXTRA COVERAGE (${gaps.extra.length} paths)`, 'yellow'));
    console.log(colorize('-'.repeat(60), 'dim'));
    console.log(colorize('These paths exist in actual tests but are not in the expected structure:\n', 'dim'));
    gaps.extra.slice(0, 10).forEach((p) => {
      console.log(`  ${colorize('+', 'yellow')} ${p}`);
    });
    if (gaps.extra.length > 10) {
      console.log(colorize(`  ... and ${gaps.extra.length - 10} more`, 'dim'));
    }
  }

  if (result.parseErrors.length > 0) {
    console.log(colorize(`\nPARSE ERRORS (${result.parseErrors.length} files)`, 'red'));
    console.log(colorize('-'.repeat(60), 'dim'));
    result.parseErrors.forEach(({ filePath, message }) => {
      console.log(`  ${colorize('!', 'red')} ${filePath}`);
      console.log(`     ${message}`);
    });
  }

  // Structural inconsistencies
  if (result.inconsistencies && result.inconsistencies.length > 0) {
    console.log(colorize(`\nSTRUCTURAL INCONSISTENCIES (${result.inconsistencies.length} paths)`, 'magenta'));
    console.log(colorize('-'.repeat(60), 'dim'));
    console.log(colorize('These paths exist in both expected and actual structures but have different sub-structures:\n', 'dim'));

    result.inconsistencies.slice(0, 10).forEach((item) => {
      console.log(`  ${colorize('!', 'magenta')} ${colorize(item.path, 'yellow')}`);
      console.log(`     ${colorize(item.issue, 'dim')}`);
      if (item.onlyInExpected && item.onlyInExpected.length > 0) {
        console.log(`     ${colorize('Only in expected:', 'dim')} ${item.onlyInExpected.join(', ')}`);
      }
      if (item.onlyInActual && item.onlyInActual.length > 0) {
        console.log(`     ${colorize('Only in actual:', 'dim')} ${item.onlyInActual.join(', ')}`);
      }
      console.log('');
    });

    if (result.inconsistencies.length > 10) {
      console.log(colorize(`  ... and ${result.inconsistencies.length - 10} more inconsistencies`, 'dim'));
    }
  }

  // Coverage by component
  console.log(colorize('\nCOVERAGE BY COMPONENT', 'bright'));
  console.log(colorize('-'.repeat(60), 'dim'));
  console.log(colorize('Format: Component [Path Coverage Bar] Path% (actual/expected) [Test Coverage Bar] Test% (active/total)\n', 'dim'));

  const entries = Object.entries(coverageByComponent);
  const maxNameLength = Math.max(...entries.map(([name]) => name.length), 20);

  for (const [component, stats] of entries.slice(0, 15)) {
    const paddedName = component.padEnd(maxNameLength);

    if (stats.status === 'extra-only') {
      // Component exists only in actual, not in expected (all extra coverage)
      const marker = colorize('+', 'yellow');
      const testInfo = stats.tests.total > 0 ? `${stats.tests.active}/${stats.tests.total} tests` : `${stats.actualPaths} paths`;
      const testInfoLabel = `(${testInfo})`;
      console.log(`  ${paddedName} ${marker} ${colorize('Not in expected', 'yellow')} ${colorize(testInfoLabel, 'dim')}`);
    } else {
      // Normal component with expected coverage
      const pathBar = generateProgressBar(Math.min(stats.percent, 100)); // Cap bar at 100%
      const pathColor = getCoverageColor(stats.percent);
      const pathPercent = `${stats.percent}%`.padStart(6);

      // Generate test coverage bar
      let testDisplay = '';
      if (stats.tests.total > 0) {
        const testBar = generateProgressBar(stats.tests.coveragePercent);
        const testColor = getCoverageColor(stats.tests.coveragePercent);
        const testPercent = `${stats.tests.coveragePercent}%`.padStart(6);
        const testCountLabel = `(${stats.tests.active}/${stats.tests.total})`;
        testDisplay = ` ${colorize(testBar, testColor)} ${colorize(testPercent, testColor)} ${colorize(testCountLabel, 'dim')}`;
      }

      console.log(`  ${paddedName} ${colorize(pathBar, pathColor)} ${colorize(pathPercent, pathColor)}${testDisplay}`);
    }
  }

  if (entries.length > 15) {
    console.log(colorize(`  ... and ${entries.length - 15} more components`, 'dim'));
  }

  console.log('');
}

const hasItems = (list) => Array.isArray(list) && list.length > 0;

const formatCodeList = (keys) => keys.map((k) => '`' + k + '`').join(', ');

const formatPercent = (percent) => (percent === null ? 'N/A' : `${percent}%`);

const mdHeading = (level, text) => `${'#'.repeat(level)} ${text}\n\n`;

function getCoverageStatusMessage(coveragePercent) {
  if (coveragePercent === null) return 'No expected paths are defined.';
  if (coveragePercent >= 90) return 'All critical paths are well covered.';
  if (coveragePercent >= 70) return 'Core paths are covered, but gaps exist.';
  return 'Major gaps in coverage must be addressed.';
}

/** Report header: the single title plus run metadata. */
function buildMdHeader(results, timestamp) {
  const typeLine = results.length === 1 ? `  \n**Type**: ${results[0].name}` : '';
  return `# Test Coverage Gap Analysis Report\n\n**Generated**: ${timestamp}${typeLine}\n\n`;
}

/** Status of the weakest view, so a combined report never hides a critical test type. */
function buildMdStatusLine(results) {
  const rated = results.filter((result) => result.summary.coveragePercent !== null);
  const lowest = rated.reduce((low, result) => (result.summary.coveragePercent < low.summary.coveragePercent ? result : low), rated[0]);
  const percent = lowest ? lowest.summary.coveragePercent : null;
  const scope = lowest && results.length > 1 ? ` Lowest Path Coverage: ${lowest.name} (${formatPercent(percent)}).` : '';
  return `**Status**: ${getCoverageLabel(percent)}. ${getCoverageStatusMessage(percent)}${scope}\n\n`;
}

const formatTestCoverage = (summary) => (summary.totalTests > 0 ? `${summary.testCoveragePercent}%` : 'N/A');

/** Headline metrics of one view, shown once in the Executive Summary. */
function buildMdHeadlineList(summary) {
  let md = `- **Path Coverage**: ${formatPercent(summary.coveragePercent)}\n`;
  md += `- **Test Coverage**: ${formatTestCoverage(summary)}\n`;
  md += `- **Missing Paths**: ${summary.missing}\n`;
  md += `- **Skipped-only Paths**: ${summary.skippedOnly}\n`;
  md += `- **Extra Paths**: ${summary.extra}\n\n`;
  return md;
}

/** Executive Summary table row of one view in a combined report. */
function buildMdCombinedSummaryEntry(result) {
  const { summary } = result;
  return `| ${result.name} | ${getCoverageLabel(summary.coveragePercent)} | ${formatPercent(summary.coveragePercent)} | ${formatTestCoverage(summary)} | ${summary.missing} | ${summary.skippedOnly} | ${summary.extra} |\n`;
}

function buildMdHeadlineTable(results) {
  const header = `| Test Type | Status | Path Coverage | Test Coverage | Missing Paths | Skipped-only Paths | Extra Paths |\n| --- | --- | --- | --- | --- | --- | --- |\n`;
  return `${header}${results.map(buildMdCombinedSummaryEntry).join('')}\n`;
}

function buildMdExecutiveSummary(results) {
  const metrics = results.length === 1 ? buildMdHeadlineList(results[0].summary) : buildMdHeadlineTable(results);
  return `${mdHeading(2, 'Executive Summary')}${buildMdStatusLine(results)}${metrics}`;
}

/** Path and test counts behind the headline percentages. */
function buildMdCounts(summary) {
  let md = `- **Paths**: ${summary.totalExpected} expected, ${summary.totalActual} active, ${summary.totalDeclared} declared\n`;
  md += `- **Tests**: ${summary.totalTests} total, ${summary.activeTests} active, ${summary.skippedTests} skipped\n\n`;
  return md;
}

function buildMdComponentRow(component, stats) {
  const hasTests = stats.tests.total > 0;
  const isExtraOnly = stats.status === 'extra-only';

  // Extra-only components are not in the expected structure.
  const status = isExtraOnly ? 'Extra' : getCoverageLabel(stats.percent);
  const expected = isExtraOnly ? 0 : stats.expected;
  const active = !isExtraOnly && stats.extra > 0 ? `${stats.actualPaths} (+${stats.extra} extra)` : String(stats.actualPaths);
  const pathCoverage = isExtraOnly ? 'N/A' : `${stats.percent}%`;
  const tests = hasTests ? `${stats.tests.active}/${stats.tests.total}` : 'N/A';
  const testCoverage = hasTests ? `${stats.tests.coveragePercent}%` : 'N/A';
  return `| ${component} | ${status} | ${expected} | ${active} | ${pathCoverage} | ${tests} | ${testCoverage} |\n`;
}

function buildMdComponents(coverageByComponent) {
  const entries = Object.entries(coverageByComponent);
  if (entries.length === 0) return '';
  const header = `| Component | Status | Expected Paths | Active Paths | Path Coverage | Tests (Active/Total) | Test Coverage |\n| --- | --- | --- | --- | --- | --- | --- |\n`;
  return `${header}${entries.map(([component, stats]) => buildMdComponentRow(component, stats)).join('')}\n`;
}

/** Heading of one view inside a standard section; omitted when the report has a single view. */
const viewHeading = (results, result) => (results.length > 1 ? mdHeading(3, result.name) : '');

function buildMdCoverageMetrics(results) {
  const views = results.map((result) => `${viewHeading(results, result)}${buildMdCounts(result.summary)}${buildMdComponents(result.coverageByComponent)}`);
  return `${mdHeading(2, 'Coverage Metrics')}${views.join('')}`;
}

const formatPathItem = (p) => `- \`${p}\``;

function buildMdMissingItems(missing) {
  return sortedGroupsByTopLevel(missing)
    .map(([component, paths]) => `**${component}** (${paths.length} missing)\n\n${paths.map((p) => formatPathItem(p) + '\n').join('')}\n`)
    .join('');
}

/** A gap sub-section listing each item on its own line; empty string when there are no items. */
function buildMdItemSection({ items, heading, level, intro, formatItem }) {
  if (!hasItems(items)) return '';
  const introLine = intro ? `${intro}\n\n` : '';
  const itemLines = items.map((item) => formatItem(item) + '\n').join('');
  return `${mdHeading(level, heading)}${introLine}${itemLines}\n`;
}

const formatChildren = (children) => (children.length > 0 ? formatCodeList(children) : 'none (leaf node)');

function buildMdInconsistency(item) {
  const details = [
    hasItems(item.onlyInExpected) ? `only in expected: ${formatCodeList(item.onlyInExpected)}` : '',
    hasItems(item.onlyInActual) ? `only in actual: ${formatCodeList(item.onlyInActual)}` : '',
    item.expectedChildren ? `expected children: ${formatChildren(item.expectedChildren)}` : '',
    item.actualChildren ? `actual children: ${formatChildren(item.actualChildren)}` : '',
  ].filter(Boolean);
  const suffix = details.length > 0 ? `; ${details.join('; ')}` : '';
  return `- \`${item.path}\` — ${item.issue}${suffix}`;
}

/** Missing, skipped-only, extra, structural and parse gaps of one view. */
function buildMdViewGaps(result, level) {
  const { gaps, inconsistencies, parseErrors } = result;
  const sections = [
    hasItems(gaps.missing) ? `${mdHeading(level, 'Missing Paths')}${buildMdMissingItems(gaps.missing)}` : '',
    buildMdItemSection({ items: gaps.skippedOnly, heading: 'Skipped-only Paths', level, intro: 'Declared paths whose tests are all skipped:', formatItem: formatPathItem }),
    buildMdItemSection({ items: gaps.extra, heading: 'Extra Paths', level, intro: 'Active paths that are not in the expected structure:', formatItem: formatPathItem }),
    buildMdItemSection({ items: inconsistencies, heading: 'Structural Inconsistencies', level, intro: null, formatItem: buildMdInconsistency }),
    buildMdItemSection({ items: parseErrors, heading: 'Parse Errors', level, intro: null, formatItem: ({ filePath, message }) => `- **${filePath}** — ${message}` }),
  ].join('');
  return sections || 'No gaps. Every expected path has an active test.\n\n';
}

function buildMdCoverageGaps(results) {
  const level = results.length > 1 ? 4 : 3;
  const views = results.map((result) => `${viewHeading(results, result)}${buildMdViewGaps(result, level)}`);
  return `${mdHeading(2, 'Coverage Gaps')}${views.join('')}`;
}

const formatNumberedItem = (item, index) => `${index + 1}. ${item}\n`;

/** Numbered, data-driven actions of one view: priority components first, then the other gap kinds. */
function buildMdViewActions(result) {
  const { gaps, inconsistencies, parseErrors } = result;
  const expectedFile = CONFIG[result.type]?.expectedFile ?? 'the expected structure';
  const priority = sortedGroupsByTopLevel(gaps.missing)
    .slice(0, 5)
    .map(([component, paths]) => `**${component}** (${paths.length})`)
    .join(', ');
  const actions = [
    priority ? `Add active tests for the priority components with the most missing paths: ${priority}.` : '',
    priority ? `Remove paths from \`${expectedFile}\` that are no longer needed.` : '',
    hasItems(gaps.skippedOnly) ? 'Activate the skipped-only tests, or remove them when the scope is dropped.' : '',
    hasItems(gaps.extra) ? `Add the extra paths to \`${expectedFile}\`, or correct the test titles.` : '',
    hasItems(inconsistencies) ? 'Align the structural inconsistencies between the expected structure and the test titles.' : '',
    hasItems(parseErrors) ? 'Fix the parse errors so those specs count toward coverage.' : '',
  ].filter(Boolean);
  if (actions.length === 0) return 'No gaps. Keep the expected structure current as features evolve.\n\n';
  return `${actions.map(formatNumberedItem).join('')}\n`;
}

function buildMdRecommendations(results) {
  const views = results.map((result) => `${viewHeading(results, result)}${buildMdViewActions(result)}`);
  return `${mdHeading(2, 'Recommendations & Next Actions')}${views.join('')}Re-run the analysis after adding tests or updating the expected structure.\n`;
}

/**
 * Generate one Markdown report for one or more test types: a single title and
 * Executive Summary, then each standard section with one subsection per test type.
 * @param {object[]} results analyzeTestType results.
 * @param {string} timestamp Shown in the header — passed in so the report stays pure.
 */
function generateMarkdownReport(results, timestamp) {
  return [buildMdHeader(results, timestamp), buildMdExecutiveSummary(results), buildMdCoverageMetrics(results), buildMdCoverageGaps(results), buildMdRecommendations(results)].join('');
}

/** Write a Markdown report, creating the output directory when needed. */
function writeMarkdownFile(output, md) {
  const outputPath = path.resolve(output);
  fs.mkdirSync(path.dirname(outputPath), { recursive: true });
  fs.writeFileSync(outputPath, md, 'utf-8');
  console.log(colorize(`\nMarkdown report written to: ${outputPath}`, 'green'));
}

/**
 * Analyze coverage for a specific test type
 */
function analyzeTestType(type, config) {
  const rootDir = path.resolve(__dirname, '..');
  const structureDir = path.join(rootDir, 'eslint-plugin-custom-rules/app-structure');

  // Load expected structure
  const expectedPath = path.join(structureDir, config.expectedFile);
  if (!fs.existsSync(expectedPath)) {
    console.log(colorize(`Expected structure not found: ${config.expectedFile}`, 'yellow'));
    console.log(colorize(`  Skipping ${type} analysis`, 'dim'));
    return null;
  }

  const expected = JSON.parse(fs.readFileSync(expectedPath, 'utf-8'));

  // Parse actual test files to get structure with counts
  const { structure: declaredActual, activeStructure, pathCounts, skippedOnlyPaths, parseErrors } = parseAllTestFiles(config.testDir, config.testPattern);

  // Compare structures
  const gaps = compareStructures(expected, activeStructure);
  gaps.skippedOnly = skippedOnlyPaths;

  // Detect structural inconsistencies
  const inconsistencies = detectInconsistencies(expected, activeStructure);

  // Calculate metrics
  const totalExpected = countLeafNodes(expected, true);
  const totalActual = countLeafNodes(activeStructure, true);
  const totalDeclared = countLeafNodes(declaredActual, true);
  const covered = totalExpected - gaps.missing.length;
  const coveragePercent = totalExpected > 0 ? Math.round((covered / totalExpected) * 100 * 10) / 10 : 0;

  // Calculate total test counts
  const totalTestCounts = countTestBlocks(declaredActual, pathCounts);
  const testCoveragePercent = totalTestCounts.total > 0 ? Math.round((totalTestCounts.active / totalTestCounts.total) * 100 * 10) / 10 : 0;

  const summary = {
    totalExpected,
    totalActual,
    totalDeclared,
    covered,
    coveragePercent,
    missing: gaps.missing.length,
    extra: gaps.extra.length,
    skippedOnly: gaps.skippedOnly.length,
    totalTests: totalTestCounts.total,
    activeTests: totalTestCounts.active,
    skippedTests: totalTestCounts.skipped,
    testCoveragePercent,
    inconsistencies: inconsistencies.length,
    parseErrors: parseErrors.length,
  };

  // Calculate coverage by component
  const coverageByComponent = calculateCoverageByComponent(expected, activeStructure, declaredActual, pathCounts);

  return {
    type,
    name: config.name,
    summary,
    gaps,
    inconsistencies,
    coverageByComponent,
    parseErrors,
  };
}

/**
 * Main execution
 */
function main() {
  const args = parseArgs();

  if (!['cli', 'markdown', 'both'].includes(args.format)) {
    console.error(`Invalid --format value: ${args.format}. Expected cli, markdown, or both.`);
    process.exit(1);
  }

  if (args.threshold !== null && (!Number.isFinite(args.threshold) || args.threshold < 0 || args.threshold > 100)) {
    console.error(`Invalid --threshold value: ${args.threshold}. Expected a finite number from 0 to 100.`);
    process.exit(1);
  }

  const types = args.type === 'all' ? ['integration-ui', 'integration-api', 'e2e-ui'] : [args.type];
  const results = [];

  for (const type of types) {
    if (!CONFIG[type]) {
      console.log(colorize(`\nUnknown test type: ${type}`, 'red'));
      console.log(colorize(`  Valid types: integration-ui, integration-api, e2e-ui, all`, 'dim'));
      continue;
    }

    const result = analyzeTestType(type, CONFIG[type]);
    if (result) {
      results.push(result);
    }
  }

  if (results.length === 0) {
    console.log(colorize('\nNo coverage analysis performed', 'red'));
    console.log(colorize('  Ensure expected structure files exist', 'dim'));
    process.exit(1);
  }

  // Generate reports
  if (args.format === 'cli' || args.format === 'both') {
    results.forEach((result) => generateCLIReport(result));
  }

  if (args.format === 'markdown' || args.format === 'both') {
    const timestamp = new Date().toISOString().replace('T', ' ').substring(0, 19);

    if (args.output) {
      writeMarkdownFile(args.output, generateMarkdownReport(results, timestamp));
    } else if (args.format === 'markdown') {
      // Output to stdout if no file specified
      console.log(generateMarkdownReport(results, timestamp));
    }
  }

  // Check threshold
  if (args.threshold !== null) {
    const lowestCoverage = Math.min(...results.map((r) => r.summary.coveragePercent));

    console.log(colorize(`\nThreshold check: ${lowestCoverage}% >= ${args.threshold}%`, 'bright'));

    if (lowestCoverage < args.threshold) {
      console.log(colorize(`Coverage below threshold.`, 'red'));
      process.exit(1);
    } else {
      console.log(colorize(`Coverage meets threshold.`, 'green'));
    }
  }
}

// Run
main();
