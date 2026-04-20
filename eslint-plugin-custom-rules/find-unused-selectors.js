const fs = require('fs');
const path = require('path');

// ---------------------------------------------------------------------------
// Module-level caches — persist for the entire ESLint process so directory
// walking and file I/O are paid at most once per lint run.
// ---------------------------------------------------------------------------

/** @type {string[] | null} */
let cachedTestFilePaths = null;

/**
 * Per-file reference index.
 * null entry = file was unreadable (avoids repeated read attempts).
 * @type {Map<string, {pathSet: Set<string>} | null>}
 */
const cachedFileIndexes = new Map();

// ---------------------------------------------------------------------------

/**
 * Return (and cache) the sorted list of test/command JS files to scan.
 * The directory tree is walked only once per ESLint process.
 * @param {string} workspaceRoot
 * @returns {string[]}
 */
function getTestFilePaths(workspaceRoot) {
  if (cachedTestFilePaths !== null) {
    return cachedTestFilePaths;
  }

  const testDirs = [path.join(workspaceRoot, 'cypress', 'integration'), path.join(workspaceRoot, 'cypress', 'e2e'), path.join(workspaceRoot, 'cypress', 'commands')];

  const files = [];

  function walkDirectory(dir) {
    try {
      const entries = fs.readdirSync(dir, { withFileTypes: true });
      for (const entry of entries) {
        const fullPath = path.join(dir, entry.name);
        if (entry.isDirectory()) {
          walkDirectory(fullPath);
        } else if (entry.isFile() && /\.(js|cy\.js)$/.test(entry.name)) {
          files.push(fullPath);
        }
      }
    } catch {
      // Skip directories that can't be read
    }
  }

  testDirs.forEach((dir) => {
    if (fs.existsSync(dir)) {
      walkDirectory(dir);
    }
  });

  cachedTestFilePaths = files;
  return files;
}

/**
 * Build (and cache) a reference index for a single test/command file.
 *
 * pathSet contains every dotted-path reference found in the file PLUS all its
 * dot-prefixes (length ≥ 2), enabling O(1) Set.has() membership checks that
 * replicate the \b…\b word-boundary semantics of the original per-key regex.
 *
 * @param {string} filePath
 * @returns {{pathSet: Set<string>} | null}
 */
function buildFileIndex(filePath) {
  if (cachedFileIndexes.has(filePath)) {
    return cachedFileIndexes.get(filePath);
  }

  let content;
  try {
    content = fs.readFileSync(filePath, 'utf8');
  } catch {
    cachedFileIndexes.set(filePath, null);
    return null;
  }

  // Extract every `word.word[.word…]` chain and add the full path AND all its
  // prefixes (≥ 2 segments) so prefix lookups work correctly.
  // Uses incremental string building instead of slice+join per prefix.
  const pathSet = new Set();
  const dotPathRegex = /\b(\w+(?:\.\w+)+)\b/g;
  let match;
  while ((match = dotPathRegex.exec(content)) !== null) {
    const parts = match[1].split('.');
    let prefix = parts[0];
    for (let i = 1; i < parts.length; i++) {
      prefix += '.' + parts[i];
      pathSet.add(prefix);
    }
  }

  const index = { pathSet };
  cachedFileIndexes.set(filePath, index);
  return index;
}

// ---------------------------------------------------------------------------

/**
 * Extract all selector keys from selectors.js
 */
function extractSelectorKeys(sourceCode) {
  const selectorKeys = new Map();
  const lines = sourceCode.split('\n');
  let currentObject = null;
  let nestedLevel = 0;
  let objectStack = [];

  lines.forEach((line, index) => {
    const trimmedLine = line.trim();

    // Detect object declarations (e.g., const auditsPage = {)
    const objectMatch = trimmedLine.match(/^const\s+(\w+)\s*=\s*\{/);
    if (objectMatch) {
      currentObject = objectMatch[1];
      objectStack = [currentObject];
      nestedLevel = 1;
      return;
    }

    if (currentObject && nestedLevel > 0) {
      // Count braces to track nesting (but ignore braces inside template literals)
      let lineForBraceCounting = line;
      // Remove content inside template literals to avoid counting braces in ${...}
      lineForBraceCounting = lineForBraceCounting.replace(/`[^`]*`/g, '');
      const openBraces = (lineForBraceCounting.match(/\{/g) || []).length;
      const closeBraces = (lineForBraceCounting.match(/}/g) || []).length;

      // Extract property keys (key: value or key: {)
      // Also match functions: key: (args) => ...
      const keyMatch = trimmedLine.match(/^(\w+):\s*(?:[\['"{\w]|\.|\()/);
      if (keyMatch && !trimmedLine.startsWith('//')) {
        const key = keyMatch[1];
        const fullPath = [...objectStack, key].join('.');
        const isParentObject = trimmedLine.match(/^(\w+):\s*\{/);

        selectorKeys.set(fullPath, {
          line: index + 1,
          key: key,
          isParent: !!isParentObject,
          path: fullPath,
        });
      }

      // Track nested objects (but not arrow functions)
      if (trimmedLine.match(/^(\w+):\s*\{/) && !trimmedLine.includes('=>')) {
        const nestedKey = trimmedLine.match(/^(\w+):/)[1];
        objectStack.push(nestedKey);
      }

      nestedLevel += openBraces - closeBraces;

      // Pop from stack when closing nested object
      // Only pop if we're actually closing an object (not inline braces)
      if (closeBraces > 0 && objectStack.length > 1 && !trimmedLine.includes('=>')) {
        for (let i = 0; i < closeBraces; i++) {
          if (objectStack.length > 1) objectStack.pop();
        }
      }

      if (nestedLevel === 0) {
        currentObject = null;
        objectStack = [];
      }
    }
  });

  return selectorKeys;
}

/**
 * Search for selector usage in test files and commands.
 * Handles import aliases like: import { selectorObj as alias } from '...'
 *
 * Performance design:
 *   - Test file paths are discovered once and cached at module scope
 *     (getTestFilePaths), so directory walking happens only once per ESLint run.
 *   - Each file's content is read once and its reference index is cached at
 *     module scope (buildFileIndex), so repeated linting of multiple selector
 *     files does not re-read or re-parse the same test files.
 *   - Keys are grouped by object name so per-file work is amortised.
 *   - Membership checks use Set.has() — O(1) — instead of compiling and
 *     executing a new RegExp per (key, file) pair.
 *
 * @param {string} workspaceRoot
 * @param {Map<string, object>} selectorKeys
 * @returns {Set<string>}
 */
function findSelectorUsage(workspaceRoot, selectorKeys) {
  const testFilePaths = getTestFilePaths(workspaceRoot);
  const usedSelectors = new Set();

  // Group keys by their root object name so the per-file lookup is batched.
  // Map: objectName → Array<{ fullPath, propertySuffix }>
  const keysByObject = new Map();
  selectorKeys.forEach((_value, fullPath) => {
    const parts = fullPath.split('.');
    if (parts.length < 2) return;
    const objectName = parts[0];
    const propertySuffix = parts.slice(1).join('.');
    if (!keysByObject.has(objectName)) {
      keysByObject.set(objectName, []);
    }
    keysByObject.get(objectName).push({ fullPath, propertySuffix });
  });

  const totalKeys = selectorKeys.size;

  for (const filePath of testFilePaths) {
    // Early exit: nothing left to discover
    if (usedSelectors.size === totalKeys) break;

    const index = buildFileIndex(filePath);
    if (!index) continue;

    keysByObject.forEach((keys, objectName) => {
      for (const { fullPath, propertySuffix } of keys) {
        if (usedSelectors.has(fullPath)) continue; // Already found — skip

        // O(1) Set lookup replaces per-key RegExp compilation + test
        if (index.pathSet.has(`${objectName}.${propertySuffix}`)) {
          usedSelectors.add(fullPath);
        }
      }
    });
  }

  return usedSelectors;
}

/**
 * Check for unused selectors
 */
function checkUnusedSelectors(context, workspaceRoot) {
  const sourceCode = context.sourceCode;
  const text = sourceCode.getText();
  const lines = sourceCode.lines;

  const selectorKeys = extractSelectorKeys(text);
  const usedSelectors = findSelectorUsage(workspaceRoot, selectorKeys);

  // Identify parent objects whose children are used
  const parentsWithUsedChildren = new Set();
  selectorKeys.forEach((value, fullPath) => {
    if (usedSelectors.has(fullPath)) {
      // Mark all parent paths as having used children
      const parts = fullPath.split('.');
      for (let i = 1; i < parts.length; i++) {
        const parentPath = parts.slice(0, i).join('.');
        parentsWithUsedChildren.add(parentPath);
      }
    }
  });

  // Check if a parent object is empty (no children or pattern: `key: {}`)
  function isEmptyParentObject(value) {
    if (!value.isParent) return false;

    const line = lines[value.line - 1].trim();
    // Check if it's a single-line empty object: `key: {},` or `key: {}`
    // Trimmed line eliminates leading/trailing whitespace, reducing backtracking risk
    return /^\w+:\s*{}\s*,?$/.test(line);
  }

  // Report each unused selector individually at its actual line location
  selectorKeys.forEach((value, fullPath) => {
    // Skip if selector is used
    if (usedSelectors.has(fullPath)) {
      return;
    }

    // Skip parent objects if any of their children are used
    if (value.isParent && parentsWithUsedChildren.has(fullPath)) {
      return;
    }

    const isEmpty = isEmptyParentObject(value);

    context.report({
      loc: { line: value.line, column: 0 },
      message: `Unused selector: ${fullPath}`,
      fix(fixer) {
        // Auto-fix empty parent objects (single line: `key: {}`)
        if (value.isParent && isEmpty) {
          const lineStartIndex = sourceCode.getIndexFromLoc({ line: value.line, column: 0 });
          const lineEndIndex = sourceCode.getIndexFromLoc({ line: value.line + 1, column: 0 });
          return fixer.removeRange([lineStartIndex, lineEndIndex]);
        }

        // Don't auto-fix non-empty parent objects (multi-line blocks)
        if (value.isParent && !isEmpty) {
          return null;
        }

        // Auto-fix leaf properties (single line)
        const lineStartIndex = sourceCode.getIndexFromLoc({ line: value.line, column: 0 });
        const lineEndIndex = sourceCode.getIndexFromLoc({ line: value.line + 1, column: 0 });
        return fixer.removeRange([lineStartIndex, lineEndIndex]);
      },
    });
  });
}

module.exports = {
  meta: {
    type: 'suggestion',
    docs: {
      description: 'Find unused selectors',
      category: 'Best Practices',
      recommended: false,
    },
    fixable: 'code',
    schema: [],
  },
  create(context) {
    const filename = context.filename;
    const workspaceRoot = process.cwd();

    // basename check ensures we only run on files literally named 'selectors.js',
    // preventing false matches on files like 'find-unused-selectors.js' which
    // contain 'selectors.js' as a substring of their own filename.
    const isSelectorsFile = path.basename(filename) === 'selectors.js';

    if (!isSelectorsFile) {
      return {};
    }

    return {
      Program() {
        checkUnusedSelectors(context, workspaceRoot);
      },
    };
  },
};
