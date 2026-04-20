const path = require('path');
const fs = require('fs');

function getNodeTitle(node) {
  const arg = node.arguments[0];
  if (!arg) return null;
  if (arg.type === 'Literal' && typeof arg.value === 'string') return arg.value;
  if (arg.type === 'TemplateLiteral' && arg.expressions.length === 0) return arg.quasis[0].value.cooked;
  return null;
}

// Detect --fix mode: new paths are added to expected/ only when fixing.
const _isFixMode = process.argv.includes('--fix');

// ---------------------------------------------------------------------------
// Single source of truth: expected/ structure files.
// Loaded once per ESLint process per type, then cached.
// ---------------------------------------------------------------------------

/** @type {{ api: object|null, ui: object|null, e2e: object|null }} */
const _expectedStructures = {
  api: null,
  ui: null,
  e2e: null,
};

// Track whether an expected file was modified during this run (needs write).
const _expectedDirty = {
  api: false,
  ui: false,
  e2e: false,
};

let _exitHandlerRegistered = false;

const _expectedPaths = {
  api: path.resolve(__dirname, './app-structure/expected/modules.json'),
  ui: path.resolve(__dirname, './app-structure/expected/components.json'),
  e2e: path.resolve(__dirname, './app-structure/expected/workflows.json'),
};

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Calculate the maximum nesting depth of an object.
 * Empty `{}` → 0, `{ A: {} }` → 1, `{ A: { B: {} } }` → 2, etc.
 */
function getDepth(obj) {
  if (typeof obj !== 'object' || obj === null || Array.isArray(obj)) return 0;
  const keys = Object.keys(obj);
  if (keys.length === 0) return 0;
  return 1 + Math.max(...keys.map((k) => getDepth(obj[k])));
}

/**
 * Recursively sort object keys for readable, stable serialisation.
 * Within each level keys are ordered by:
 *   1. Nesting depth (leaves first, then shallowest children, …)
 *   2. Alphabetically within the same depth group
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
 * Load (and cache) the expected structure for the given test type.
 * The file is read from disk exactly once per ESLint process per type.
 *
 * @param {'api'|'ui'|'e2e'} testType
 * @returns {object}
 */
function _loadExpectedStructure(testType) {
  if (_expectedStructures[testType] !== null) {
    return _expectedStructures[testType];
  }

  const filePath = _expectedPaths[testType];
  const fileDir = path.dirname(filePath);

  // Bootstrap: ensure directory and file exist.
  if (!fs.existsSync(fileDir)) {
    fs.mkdirSync(fileDir, { recursive: true });
  }
  if (!fs.existsSync(filePath)) {
    try {
      fs.writeFileSync(filePath, JSON.stringify({}, null, 2) + '\n', 'utf8');
    } catch {
      // Silent – fall back to empty structure
    }
  }

  let structure = {};
  try {
    structure = JSON.parse(fs.readFileSync(filePath, 'utf8'));
  } catch {
    // Silent – every path will fail validation
  }

  _expectedStructures[testType] = structure;
  return structure;
}

/**
 * Register a one-time process exit handler that writes modified expected
 * structure files to disk (sorted, with trailing newline).
 */
function _registerExitHandler() {
  if (_exitHandlerRegistered) return;
  _exitHandlerRegistered = true;

  process.on('exit', () => {
    if (!_isFixMode) return;

    for (const type of ['api', 'ui', 'e2e']) {
      if (!_expectedDirty[type]) continue;
      const structure = _expectedStructures[type];
      if (structure === null) continue;
      try {
        fs.writeFileSync(_expectedPaths[type], JSON.stringify(sortObjectKeys(structure), null, 2) + '\n', 'utf8');
      } catch {
        // Silent – structure tracking is best-effort
      }
    }
  });
}

// ---------------------------------------------------------------------------
// Rule
// ---------------------------------------------------------------------------

module.exports = {
  meta: {
    type: 'problem',
    docs: {
      description: 'verify that test structure paths exist in expected structure files; ' + 'use --fix to auto-add valid new paths',
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

    const expectedStructure = _loadExpectedStructure(testType);
    _registerExitHandler();

    // ----- helpers local to this file's context ----- //

    /**
     * Check whether a path string is well-formed (PascalCase / uppercase
     * abbreviation segments separated by dots).  Only well-formed paths are
     * eligible for auto-addition to expected structure.
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
     * Extract the structure path from a test title (everything before the
     * first colon).  Returns `null` when the path is not valid.
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
     * Walk the expected structure for `pathStr`.  Returns an object describing
     * whether the full path exists and, if not, the deepest valid prefix.
     */
    function pathExistsInStructure(pathStr) {
      const parts = pathStr.split('.');
      let currentLevel = expectedStructure;
      const validParts = [];

      for (const part of parts) {
        if (currentLevel[part]) {
          validParts.push(part);
          currentLevel = currentLevel[part];
        } else {
          return {
            exists: false,
            missingPart: part,
            validPath: validParts.length > 0 ? validParts.join('.') : null,
            fullPath: pathStr,
          };
        }
      }

      return { exists: true };
    }

    /**
     * Add a path to the in-memory expected structure.  Only called in --fix
     * mode for paths that pass format validation.  The actual file write is
     * deferred to the process exit handler.
     */
    function addPathToExpected(pathStr) {
      const parts = pathStr.split('.');
      let currentLevel = expectedStructure;

      for (const part of parts) {
        if (!currentLevel[part]) {
          currentLevel[part] = {};
        }
        currentLevel = currentLevel[part];
      }

      _expectedDirty[testType] = true;
    }

    /**
     * Build a human-readable error message for a missing path.
     */
    function buildMessage(pathInfo, type) {
      const { missingPart, validPath, fullPath } = pathInfo;
      const file = type === 'ui' ? 'components.json' : type === 'api' ? 'modules.json' : 'workflows.json';

      let msg = `Path "${fullPath}" not found in expected structure. `;
      msg += validPath ? `Valid until "${validPath}", but "${missingPart}" is missing. ` : `"${missingPart}" does not exist. `;
      msg += `Run with --fix to auto-add, or update eslint-plugin-custom-rules/app-structure/expected/${file} manually.`;
      return msg;
    }

    /**
     * Core check applied to every describe / context / it node.
     */
    function checkTitle(node, partsToExclude = 0) {
      const title = getNodeTitle(node);
      if (!title) return;

      const structurePath = extractStructurePath(title, partsToExclude);
      if (!structurePath) return;

      const result = pathExistsInStructure(structurePath);

      if (!result.exists) {
        if (_isFixMode) {
          // Auto-add the validated path to expected structure.
          addPathToExpected(structurePath);
        }

        context.report({
          node,
          message: buildMessage(result, testType),
        });
      }
    }

    // ----- AST visitors ----- //

    return {
      'CallExpression[callee.name="describe"]'(node) {
        checkTitle(node, 2);
      },
      'CallExpression[callee.name="context"]'(node) {
        checkTitle(node, 0);
      },
      'CallExpression[callee.object.name="describe"][callee.property.name="skip"]'(node) {
        checkTitle(node, 2);
      },
      'CallExpression[callee.object.name="context"][callee.property.name="skip"]'(node) {
        checkTitle(node, 0);
      },
      'CallExpression[callee.name="it"]'(node) {
        checkTitle(node, 0);
      },
      'CallExpression[callee.object.name="it"][callee.property.name="skip"]'(node) {
        checkTitle(node, 0);
      },
    };
  },
};
