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
  let results = [];

  if (!fs.existsSync(dir)) {
    return results;
  }

  const files = fs.readdirSync(dir);

  for (const file of files) {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);

    if (stat.isDirectory()) {
      results = results.concat(findTestFiles(filePath, pattern));
    } else if (pattern.test(file)) {
      results.push(filePath);
    }
  }

  return results;
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

  const getCallback = (node) => [...node.arguments].reverse().find((argument) => ['ArrowFunctionExpression', 'FunctionExpression'].includes(argument.type));

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

  let allTestBlocks = [];
  const parseErrors = [];

  for (const file of testFiles) {
    const result = parseTestFile(file);
    allTestBlocks = allTestBlocks.concat(result.testBlocks);
    if (result.parseError) {
      parseErrors.push(result.parseError);
    }
  }

  const allStructure = buildStructureWithCounts(allTestBlocks);
  const activeStructure = buildStructureWithCounts(allTestBlocks.filter((block) => !block.isSkipped));
  const skippedOnlyPaths = Object.entries(allStructure.pathCounts)
    .filter(([, counts]) => counts.active === 0 && counts.skipped > 0)
    .map(([structurePath]) => structurePath)
    .sort();

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
  const paths = [];
  const keys = Object.keys(obj).filter((k) => k !== '__counts');

  if (keys.length === 0) {
    return prefix ? [prefix] : [];
  }

  for (const key of keys) {
    const currentPath = prefix ? `${prefix}.${key}` : key;
    const subPaths = getAllPaths(obj[key], currentPath);
    paths.push(...subPaths);
  }

  return paths;
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
  const grouped = {};

  for (const path of paths) {
    const topLevel = path.split('.')[0];
    if (!grouped[topLevel]) {
      grouped[topLevel] = [];
    }
    grouped[topLevel].push(path);
  }

  return grouped;
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
  return Object.entries(coverage)
    .sort(([keyA, a], [keyB, b]) => {
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
    })
    .reduce((acc, [key, value]) => {
      acc[key] = value;
      return acc;
    }, {});
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

    const grouped = groupByTopLevel(gaps.missing);
    const sortedGroups = Object.entries(grouped).sort(([, a], [, b]) => b.length - a.length);

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

/**
 * Generate Markdown report
 */
function generateMarkdownReport(result) {
  const { name, summary, gaps, coverageByComponent, parseErrors } = result;
  const timestamp = new Date().toISOString().replace('T', ' ').substring(0, 19);

  let md = `# Test Coverage Gap Analysis Report\n\n`;
  md += `**Generated**: ${timestamp}  \n`;
  md += `**Type**: ${name}\n\n`;

  // Summary
  md += `## Summary\n\n`;
  md += `- **Total Expected**: ${summary.totalExpected}\n`;
  md += `- **Active Paths**: ${summary.totalActual}\n`;
  md += `- **Declared Paths**: ${summary.totalDeclared}\n`;

  if (summary.totalTests !== undefined) {
    md += `- **Total Tests**: ${summary.totalTests}\n`;
    md += `- **Active Tests**: ${summary.activeTests}\n`;
    md += `- **Skipped Tests**: ${summary.skippedTests}\n`;
  }

  md += `- **Path Coverage**: ${summary.coveragePercent}%\n`;

  if (summary.testCoveragePercent !== undefined) {
    md += `- **Test Coverage**: ${summary.testCoveragePercent}% (active/total)\n`;
  }

  md += `- **Missing**: ${summary.missing}\n`;
  md += `- **Extra**: ${summary.extra}\n`;
  md += `- **Skipped-only paths**: ${summary.skippedOnly}\n\n`;

  const statusLabel = getCoverageLabel(summary.coveragePercent);
  let statusMessage;
  if (summary.coveragePercent >= 90) {
    statusMessage = 'All critical paths are well covered.';
  } else if (summary.coveragePercent >= 70) {
    statusMessage = 'Core paths are covered, but gaps exist.';
  } else {
    statusMessage = 'Major gaps in coverage must be addressed.';
  }
  md += `**Status**: ${statusLabel}. ${statusMessage}\n\n`;

  // Missing coverage
  if (gaps.missing.length > 0) {
    md += `## Missing Coverage (${gaps.missing.length} paths)\n\n`;

    const grouped = groupByTopLevel(gaps.missing);
    const sortedGroups = Object.entries(grouped).sort(([, a], [, b]) => b.length - a.length);

    for (const [component, paths] of sortedGroups) {
      md += `### ${component} (${paths.length} missing)\n\n`;
      paths.forEach((p) => {
        md += `- Missing: \`${p}\`\n`;
      });
      md += `\n`;
    }
  } else {
    md += `## Missing Coverage\n\n`;
    md += `No missing coverage. All expected paths are covered.\n\n`;
  }

  if (gaps.skippedOnly.length > 0) {
    md += `## Skipped-only Paths (${gaps.skippedOnly.length} paths)\n\n`;
    md += `These declared paths have tests, but none are active:\n\n`;
    gaps.skippedOnly.forEach((p) => {
      md += `- Skipped-only: \`${p}\`\n`;
    });
    md += `\n`;
  }

  // Extra coverage
  if (gaps.extra.length > 0) {
    md += `## Extra Coverage (${gaps.extra.length} paths)\n\n`;
    md += `These paths exist in actual tests but are not in the expected structure:\n\n`;
    gaps.extra.forEach((p) => {
      md += `- Extra: \`${p}\`\n`;
    });
    md += `\n`;
  }

  if (parseErrors.length > 0) {
    md += `## Parse Errors (${parseErrors.length} files)\n\n`;
    parseErrors.forEach(({ filePath, message }) => {
      md += `- **${filePath}** — ${message}\n`;
    });
    md += `\n`;
  }

  // Structural inconsistencies
  if (result.inconsistencies && result.inconsistencies.length > 0) {
    md += `## Structural Inconsistencies (${result.inconsistencies.length} paths)\n\n`;
    md += `These paths exist in both expected and actual structures but have different sub-structures:\n\n`;

    result.inconsistencies.forEach((item) => {
      md += `### Inconsistency: \`${item.path}\`\n\n`;
      md += `**Issue**: ${item.issue}\n\n`;

      if (item.onlyInExpected && item.onlyInExpected.length > 0) {
        const expectedList = item.onlyInExpected.map((k) => '`' + k + '`').join(', ');
        md += `**Only in expected**: ${expectedList}\n\n`;
      }

      if (item.onlyInActual && item.onlyInActual.length > 0) {
        const actualList = item.onlyInActual.map((k) => '`' + k + '`').join(', ');
        md += `**Only in actual**: ${actualList}\n\n`;
      }

      if (item.expectedChildren) {
        const childrenList = item.expectedChildren.length > 0 ? item.expectedChildren.map((k) => '`' + k + '`').join(', ') : 'none (leaf node)';
        md += `**Expected children**: ${childrenList}\n\n`;
      }

      if (item.actualChildren) {
        const childrenList = item.actualChildren.length > 0 ? item.actualChildren.map((k) => '`' + k + '`').join(', ') : 'none (leaf node)';
        md += `**Actual children**: ${childrenList}\n\n`;
      }
    });

    md += `\n`;
  }

  // Coverage by component
  md += `## Coverage by Component\n\n`;

  for (const [component, stats] of Object.entries(coverageByComponent)) {
    if (stats.status === 'extra-only') {
      // Component not in expected structure
      const testInfo = stats.tests.total > 0 ? `${stats.tests.active}/${stats.tests.total}` : 'N/A';
      const testCov = stats.tests.total > 0 ? `${stats.tests.coveragePercent}%` : 'N/A';
      md += `### ${component} — Extra\n\n`;
      md += `- **Expected Paths**: 0\n`;
      md += `- **Active Paths**: ${stats.actualPaths}\n`;
      md += `- **Path Coverage**: N/A\n`;
      md += `- **Tests (Active/Total)**: ${testInfo}\n`;
      md += `- **Test Coverage**: ${testCov}\n\n`;
    } else {
      const status = getCoverageLabel(stats.percent);
      const actualDisplay = stats.extra > 0 ? `${stats.actualPaths} (+${stats.extra} extra)` : String(stats.actualPaths);
      const testInfo = stats.tests.total > 0 ? `${stats.tests.active}/${stats.tests.total}` : 'N/A';
      const testCov = stats.tests.total > 0 ? `${stats.tests.coveragePercent}%` : 'N/A';
      md += `### ${component} — ${status}\n\n`;
      md += `- **Expected Paths**: ${stats.expected}\n`;
      md += `- **Active Paths**: ${actualDisplay}\n`;
      md += `- **Path Coverage**: ${stats.percent}%\n`;
      md += `- **Tests (Active/Total)**: ${testInfo}\n`;
      md += `- **Test Coverage**: ${testCov}\n\n`;
    }
  }

  // Recommendations
  md += `## Recommendations\n\n`;
  if (gaps.missing.length > 0) {
    const topMissing = Object.entries(groupByTopLevel(gaps.missing))
      .sort(([, a], [, b]) => b.length - a.length)
      .slice(0, 5);

    md += `### Priority Areas\n\n`;
    topMissing.forEach(([component, paths], index) => {
      md += `${index + 1}. **${component}** - ${paths.length} missing test path(s)\n`;
    });
    md += `\n`;

    md += `### Next Steps\n\n`;
    md += `1. Review missing coverage in priority components\n`;
    md += `2. Create test cases for critical user paths\n`;
    md += `3. Update expected structure if some paths are no longer needed\n`;
    md += `4. Re-run analysis after adding tests\n\n`;
  } else {
    md += `Expected active coverage is complete. Consider:\n\n`;
    md += `1. Maintaining this coverage level as features evolve\n`;
    md += `2. Reviewing and updating expected structure for new features\n`;
    md += `3. Ensuring test quality matches coverage quantity\n\n`;
  }

  return md;
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
    if (args.output && results.length > 1) {
      // Combine all results into one markdown file
      let combinedMd = `# Test Coverage Gap Analysis Report\n\n`;
      combinedMd += `**Generated**: ${new Date().toISOString().replace('T', ' ').substring(0, 19)}\n\n`;
      combinedMd += `## Summary Across All Test Types\n\n`;

      results.forEach((result) => {
        const status = getCoverageLabel(result.summary.coveragePercent);
        const testInfo = result.summary.totalTests > 0 ? `${result.summary.activeTests}/${result.summary.totalTests}` : 'N/A';
        const testCov = result.summary.totalTests > 0 ? `${result.summary.testCoveragePercent}%` : 'N/A';
        combinedMd += `### ${result.name} — ${status}\n\n`;
        combinedMd += `- **Expected Paths**: ${result.summary.totalExpected}\n`;
        combinedMd += `- **Active Paths**: ${result.summary.totalActual}\n`;
        combinedMd += `- **Declared Paths**: ${result.summary.totalDeclared}\n`;
        combinedMd += `- **Path Coverage**: ${result.summary.coveragePercent}%\n`;
        combinedMd += `- **Tests (Active/Total)**: ${testInfo}\n`;
        combinedMd += `- **Test Coverage**: ${testCov}\n`;
        combinedMd += `- **Missing**: ${result.summary.missing}\n`;
        combinedMd += `- **Extra**: ${result.summary.extra}\n`;
        combinedMd += `- **Skipped-only paths**: ${result.summary.skippedOnly}\n\n`;
      });

      combinedMd += `---\n\n`;

      // Add individual reports
      results.forEach((result) => {
        combinedMd += generateMarkdownReport(result);
        combinedMd += `\n---\n\n`;
      });

      const outputPath = path.resolve(args.output);
      const outputDir = path.dirname(outputPath);

      if (!fs.existsSync(outputDir)) {
        fs.mkdirSync(outputDir, { recursive: true });
      }

      fs.writeFileSync(outputPath, combinedMd, 'utf-8');
      console.log(colorize(`\nCombined markdown report written to: ${outputPath}`, 'green'));
    } else {
      // Single type or no output file - generate individual reports
      results.forEach((result) => {
        const md = generateMarkdownReport(result);

        if (args.output) {
          const outputPath = path.resolve(args.output);
          const outputDir = path.dirname(outputPath);

          if (!fs.existsSync(outputDir)) {
            fs.mkdirSync(outputDir, { recursive: true });
          }

          fs.writeFileSync(outputPath, md, 'utf-8');
          console.log(colorize(`\nMarkdown report written to: ${outputPath}`, 'green'));
        } else if (args.format === 'markdown') {
          // Output to stdout if no file specified
          console.log(md);
        }
      });
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
