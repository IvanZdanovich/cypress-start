const path = require('path');
const fs = require('fs');
const { readParsedCached } = require('./_scan-cache.js');

// ---------------------------------------------------------------------------
// Configuration
// ---------------------------------------------------------------------------

const _expectedPaths = {
  api: path.resolve(__dirname, './app-structure/modules.json'),
  ui: path.resolve(__dirname, './app-structure/components.json'),
  e2e: path.resolve(__dirname, './app-structure/workflows.json'),
};

const TEST_DIRS = {
  api: path.resolve(__dirname, '../cypress/integration/api'),
  ui: path.resolve(__dirname, '../cypress/integration/ui'),
  e2e: path.resolve(__dirname, '../cypress/e2e/ui'),
};

const FILE_PATTERNS = {
  api: /\.api\.spec\.js$/,
  ui: /\.ui\.spec\.js$/,
  e2e: /\.ui\.spec\.js$|\.ui\.spec\.draft\.js$/,
};

// Detect --fix mode
const _isFixMode = process.argv.includes('--fix');

// ---------------------------------------------------------------------------
// State: Generated structures from actual test files (built once per run)
// ---------------------------------------------------------------------------

/** @type {{ api: object|null, ui: object|null, e2e: object|null }} */
const _generatedStructures = {
  api: null,
  ui: null,
  e2e: null,
};

/** @type {{ api: object|null, ui: object|null, e2e: object|null }} */
const _currentStructures = {
  api: null,
  ui: null,
  e2e: null,
};

let _exitHandlerRegistered = false;

// Per-file caches keyed by mtime — structures are rebuilt cheaply on every run,
// but each unchanged file is read+parsed only once across the daemon's lifetime.
/** @type {Map<string, {mtimeMs: number, value: Set<string>}>} */
const _testFileCache = new Map();
/** @type {Map<string, {mtimeMs: number, value: object}>} */
const _structureJsonCache = new Map();

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Calculate the maximum nesting depth of an object.
 */
function getDepth(obj) {
  if (typeof obj !== 'object' || obj === null || Array.isArray(obj)) return 0;
  const keys = Object.keys(obj);
  if (keys.length === 0) return 0;
  return 1 + Math.max(...keys.map((k) => getDepth(obj[k])));
}

/**
 * Recursively sort object keys for readable, stable serialisation.
 */
function sortObjectKeys(obj) {
  if (typeof obj !== 'object' || obj === null || Array.isArray(obj)) {
    return obj;
  }
  return Object.keys(obj)
    .sort((a, b) => {
      const depthDiff = getDepth(obj[a]) - getDepth(obj[b]);
      return depthDiff !== 0 ? depthDiff : a.localeCompare(b);
    })
    .reduce((sorted, key) => {
      sorted[key] = sortObjectKeys(obj[key]);
      return sorted;
    }, {});
}

/**
 * Check whether a path string is well-formed (PascalCase segments separated by dots).
 */
function isValidStructurePath(pathStr) {
  if (!pathStr.includes('.')) return false;
  const parts = pathStr.split('.');
  const pascalCase = /^[A-Z][A-Za-z0-9]*$/;
  for (const part of parts) {
    if (!part || part.length < 2) return false;
    if (!pascalCase.test(part)) return false;
  }
  return true;
}

/**
 * Extract structure path from a test title (everything before the first colon).
 */
function extractStructurePath(title, partsToExclude = 0) {
  const fullPath = title.split(':')[0].trim();
  if (!isValidStructurePath(fullPath)) return null;
  if (partsToExclude === 0) return fullPath;
  const parts = fullPath.split('.');
  if (parts.length <= partsToExclude) return null;
  return parts.slice(0, -partsToExclude).join('.');
}

/**
 * Add a path to a structure object.
 */
function addPathToStructure(structure, pathStr) {
  const parts = pathStr.split('.');
  let currentLevel = structure;
  for (const part of parts) {
    if (!currentLevel[part]) {
      currentLevel[part] = {};
    }
    currentLevel = currentLevel[part];
  }
}

/**
 * Extract all test block titles from a JavaScript file using regex.
 */
function extractTitlesFromFile(content) {
  const titles = [];
  const blockPattern = /(?:describe|context|it)(?:\.skip)?\s*\(\s*(['"`])((?:(?!\1)[^\\]|\\.)*)\1/g;
  let match;
  while ((match = blockPattern.exec(content)) !== null) {
    const fullMatch = match[0];
    const title = match[2];
    let type;
    if (fullMatch.startsWith('describe')) {
      type = 'describe';
    } else if (fullMatch.startsWith('context')) {
      type = 'context';
    } else {
      type = 'it';
    }
    titles.push({ type, title });
  }
  return titles;
}

/**
 * Process a single test file and extract structure paths.
 * The parsed path set is cached and re-validated by the file's mtime.
 */
function processTestFile(filePath) {
  return (
    readParsedCached(_testFileCache, filePath, (content) => {
      const paths = new Set();
      const titles = extractTitlesFromFile(content);
      for (const { type, title } of titles) {
        if (title.startsWith('STATE:')) continue;
        const partsToExclude = type === 'describe' ? 2 : 0;
        const structurePath = extractStructurePath(title, partsToExclude);
        if (structurePath) {
          paths.add(structurePath);
        }
      }
      return paths;
    }) || new Set()
  );
}

/**
 * Build structure object from all test files of a given type.
 */
function buildStructureFromTests(testType) {
  const testDir = TEST_DIRS[testType];
  const pattern = FILE_PATTERNS[testType];

  if (!fs.existsSync(testDir)) {
    return {};
  }

  const structure = {};
  let files;
  try {
    files = fs.readdirSync(testDir).filter((f) => pattern.test(f));
  } catch {
    return {};
  }

  for (const file of files) {
    const filePath = path.join(testDir, file);
    const paths = processTestFile(filePath);
    for (const structurePath of paths) {
      addPathToStructure(structure, structurePath);
    }
  }

  return sortObjectKeys(structure);
}

/**
 * Load current structure from disk. Cached and re-validated by the file's mtime.
 */
function loadCurrentStructure(testType) {
  const filePath = _expectedPaths[testType];
  return (
    readParsedCached(_structureJsonCache, filePath, (content) => {
      try {
        return JSON.parse(content);
      } catch {
        return {};
      }
    }) || {}
  );
}

/**
 * Build all structures from test files.
 *
 * Runs on every rule invocation, but the underlying file reads/parses are
 * mtime-cached — so unchanged files cost only a `stat`, while edited, added, or
 * removed test files are picked up immediately. This replaces the previous
 * build-once latch that made a long-lived ESLint daemon serve stale structures.
 */
function buildAllStructures() {
  for (const testType of ['api', 'ui', 'e2e']) {
    _generatedStructures[testType] = buildStructureFromTests(testType);
    _currentStructures[testType] = loadCurrentStructure(testType);
  }
}

/**
 * Register exit handler to write updated structure files when fixing.
 */
function _registerExitHandler() {
  if (_exitHandlerRegistered) return;
  _exitHandlerRegistered = true;

  process.on('exit', () => {
    if (!_isFixMode) return;

    const structureDir = path.dirname(_expectedPaths.api);
    if (!fs.existsSync(structureDir)) {
      fs.mkdirSync(structureDir, { recursive: true });
    }

    for (const testType of ['api', 'ui', 'e2e']) {
      const generated = _generatedStructures[testType];
      const current = _currentStructures[testType];
      if (generated === null) continue;

      const generatedJson = JSON.stringify(generated, null, 2) + '\n';
      const currentJson = JSON.stringify(sortObjectKeys(current), null, 2) + '\n';

      if (generatedJson !== currentJson) {
        try {
          fs.writeFileSync(_expectedPaths[testType], generatedJson, 'utf8');
        } catch {
          // Silent
        }
      }
    }
  });
}

/**
 * Collect all paths from a structure object.
 */
function collectPaths(obj, prefix = '') {
  const paths = new Set();
  for (const key of Object.keys(obj)) {
    const fullPath = prefix ? `${prefix}.${key}` : key;
    paths.add(fullPath);
    if (typeof obj[key] === 'object' && Object.keys(obj[key]).length > 0) {
      for (const p of collectPaths(obj[key], fullPath)) {
        paths.add(p);
      }
    }
  }
  return paths;
}

// ---------------------------------------------------------------------------
// Rule
// ---------------------------------------------------------------------------

module.exports = {
  meta: {
    type: 'problem',
    docs: {
      description: 'verify that app-structure files reflect current test titles; use --fix to regenerate structure files',
      category: 'Best Practices',
      recommended: true,
    },
    fixable: 'code',
    schema: [],
  },
  create(context) {
    const filename = context.filename;
    let testType;

    if (filename.includes('e2e')) {
      testType = 'e2e';
    } else if (filename.endsWith('.api.spec.js')) {
      testType = 'api';
    } else if (filename.endsWith('.ui.spec.js')) {
      testType = 'ui';
    } else {
      return {};
    }

    // Build all structures once per ESLint run
    buildAllStructures();
    _registerExitHandler();

    const generatedStructure = _generatedStructures[testType];
    const currentStructure = _currentStructures[testType];

    // Compare structures
    const generatedPaths = collectPaths(generatedStructure);
    const currentPaths = collectPaths(currentStructure);

    const missingInCurrent = [...generatedPaths].filter((p) => !currentPaths.has(p));
    const staleInCurrent = [...currentPaths].filter((p) => !generatedPaths.has(p));

    const hasDiscrepancy = missingInCurrent.length > 0 || staleInCurrent.length > 0;

    // Track if we've reported the file-level error for this file
    let fileErrorReported = false;

    /**
     * Report structure discrepancy on the first test block in the file.
     */
    function reportStructureDiscrepancy(node) {
      if (fileErrorReported || !hasDiscrepancy) return;
      fileErrorReported = true;

      const fileMap = { ui: 'components.json', api: 'modules.json', e2e: 'workflows.json' };
      const file = fileMap[testType];

      let msg = `App-structure file "${file}" does not reflect current tests. `;

      if (staleInCurrent.length > 0) {
        const preview = staleInCurrent.slice(0, 3).join(', ');
        const more = staleInCurrent.length > 3 ? ` (+${staleInCurrent.length - 3} more)` : '';
        msg += `Stale paths to remove: ${preview}${more}. `;
      }

      if (missingInCurrent.length > 0) {
        const preview = missingInCurrent.slice(0, 3).join(', ');
        const more = missingInCurrent.length > 3 ? ` (+${missingInCurrent.length - 3} more)` : '';
        msg += `Missing paths to add: ${preview}${more}. `;
      }

      msg += 'Run with --fix to regenerate.';

      context.report({
        node,
        message: msg,
      });
    }

    // ----- AST visitors ----- //

    return {
      'CallExpression[callee.name="describe"]'(node) {
        reportStructureDiscrepancy(node);
      },
      'CallExpression[callee.object.name="describe"][callee.property.name="skip"]'(node) {
        reportStructureDiscrepancy(node);
      },
    };
  },
};
