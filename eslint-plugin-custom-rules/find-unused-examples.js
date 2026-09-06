const path = require('path');
const { walkCached, readParsedCached } = require('./_scan-cache.js');

// ---------------------------------------------------------------------------
// Module-level caches — persist for the entire ESLint process so that directory
// walking and file I/O are paid at most once, yet are re-validated against the
// filesystem via mtime so a long-lived ESLint daemon never serves stale results.
// ---------------------------------------------------------------------------

/** @type {{paths: string[]|null, dirMtimes: Map<string, number>|null}} */
const fileListState = { paths: null, dirMtimes: null };

/**
 * Per-file reference index, keyed by file path and validated by mtime.
 * @type {Map<string, {mtimeMs: number, value: {aliases: Map<string,string>, pathSet: Set<string>}}>}
 */
const cachedFileIndexes = new Map();

// ---------------------------------------------------------------------------

/**
 * Return (and cache) the list of test/command JS files to scan.
 * The directory tree is walked only when a scanned directory changes.
 * @param {string} workspaceRoot
 * @returns {string[]}
 */
function getTestFilePaths(workspaceRoot) {
  const testDirs = [path.join(workspaceRoot, 'cypress', 'integration'), path.join(workspaceRoot, 'cypress', 'e2e'), path.join(workspaceRoot, 'cypress', 'commands')];
  return walkCached(fileListState, testDirs, (name) => /\.(js|cy\.js)$/.test(name) && !name.includes('integration-examples'));
}

/**
 * Build a reference index for a single test/command file's content.
 *
 * The index contains:
 *   - aliases: Map<originalExportName, localName> — from named import statements
 *   - pathSet: Set<string> — every dotted-path reference found in the file,
 *     PLUS all its dot-prefixes (length ≥ 2).
 *
 * Storing prefixes lets us answer "is `a.b.c` referenced anywhere in this file?"
 * with a single O(1) Set.has() call, which replicates the \b…\b regex semantics
 * (a word boundary exists between the last identifier and a following `.`, so the
 * original regex also matched when the path was a prefix of a longer chain).
 *
 * @param {string} content
 * @returns {{aliases: Map<string,string>, pathSet: Set<string>}}
 */
function parseExampleIndex(content) {
  // --- Import alias resolution ---
  // Matches: import { originalName as alias } from '...'
  //      or: import { originalName } from '...'
  const aliases = new Map();
  // Match every `originalName as aliasName` pair anywhere in the file
  // (covers multi-import statements like `import { a as x, b as y } from '...'`)
  const importAliasRegex = /\b(\w+)\s+as\s+(\w+)\b/g;
  // Also match plain named imports (no alias) inside import braces
  const importBlockRegex = /import\s*\{([^}]+)}/g;
  let match;
  while ((match = importAliasRegex.exec(content)) !== null) {
    aliases.set(match[1], match[2]);
  }
  while ((match = importBlockRegex.exec(content)) !== null) {
    const block = match[1];
    const items = block.split(',');
    for (const item of items) {
      const parts = item.trim().split(' as ');
      if (parts.length === 1) {
        const name = parts[0].trim();
        if (name && !aliases.has(name)) {
          aliases.set(name, name);
        }
      }
    }
  }

  // --- Dotted-path reference extraction ---
  // For every `word.word[.word…]` chain, add the full path AND all its
  // prefixes (≥ 2 segments) to the set so that prefix lookups work.
  // Uses incremental string building instead of slice+join per prefix.
  const pathSet = new Set();
  const dotPathRegex = /\b(\w+(?:\.\w+)+)\b/g;
  while ((match = dotPathRegex.exec(content)) !== null) {
    const parts = match[1].split('.');
    let prefix = parts[0];
    for (let i = 1; i < parts.length; i++) {
      prefix += '.' + parts[i];
      pathSet.add(prefix);
    }
  }

  return { aliases, pathSet };
}

/**
 * Return the mtime-cached reference index for a test/command file.
 * @param {string} filePath
 * @returns {{aliases: Map<string,string>, pathSet: Set<string>} | null}
 */
function buildFileIndex(filePath) {
  return readParsedCached(cachedFileIndexes, filePath, parseExampleIndex);
}

// ---------------------------------------------------------------------------

/**
 * Extract all integration-examples instances from integration-examples files
 * Supports named exported object examples
 * Uses indentation-based tracking for accurate structure detection
 */
function extractTestDataInstances(sourceCode, filename) {
  const instances = new Map();
  const lines = sourceCode.split('\n');
  let currentExportName = null;
  const indentStack = [];

  lines.forEach((line, index) => {
    const trimmedLine = line.trim();

    // Skip empty lines and comments
    if (!trimmedLine || trimmedLine.startsWith('//')) {
      return;
    }

    // Detect named exports: export const exportName = {
    const namedExportMatch = trimmedLine.match(/^export\s+const\s+(\w+)\s*=\s*\{/);
    if (namedExportMatch) {
      currentExportName = namedExportMatch[1];
      const indent = line.search(/\S/);
      indentStack.length = 0;
      indentStack.push({ name: currentExportName, indent: indent });
      return;
    }

    if (!currentExportName) {
      return;
    }

    // Check if this is a closing brace line
    if (trimmedLine.match(/^}/)) {
      // Pop the stack based on indentation
      const currentIndent = line.search(/\S/);
      while (indentStack.length > 1 && indentStack[indentStack.length - 1].indent >= currentIndent) {
        indentStack.pop();
      }

      // If we're closing the root export, reset
      if (trimmedLine === '};' && indentStack.length === 1) {
        currentExportName = null;
        indentStack.length = 0;
      }
      return;
    }

    // Extract property keys
    const keyMatch = trimmedLine.match(/^(\w+):\s*/);
    if (keyMatch) {
      const key = keyMatch[1];
      const currentIndent = line.search(/\S/);

      // Pop stack items with greater or equal indentation
      while (indentStack.length > 1 && indentStack[indentStack.length - 1].indent >= currentIndent) {
        indentStack.pop();
      }

      // Build full path from stack
      const pathParts = indentStack.map((item) => item.name);
      pathParts.push(key);
      const fullPath = pathParts.join('.');

      // Check if this is a parent object
      const isParentObject = trimmedLine.match(/:\s*\{/);

      instances.set(fullPath, {
        line: index + 1,
        key: key,
        isParent: !!isParentObject,
        path: fullPath,
        exportName: currentExportName,
        filename: filename,
      });

      // If this is opening an object, push to stack
      if (isParentObject && !trimmedLine.match(/\{\s*}/)) {
        // Not an empty object on one line
        indentStack.push({ name: key, indent: currentIndent });
      }
    }
  });

  return instances;
}

/**
 * Check if a parent object is empty (has no children in the instances map).
 * Uses for...of with early return instead of forEach (which cannot break).
 */
function isEmptyParentObject(instanceValue, allInstances) {
  if (!instanceValue.isParent) {
    return false;
  }

  const prefix = instanceValue.path + '.';

  for (const fullPath of allInstances.keys()) {
    if (fullPath.startsWith(prefix)) {
      return false; // Has at least one child → not empty
    }
  }

  return true; // No children found → empty
}

/**
 * Search for integration-examples usage in test files.
 * Handles import aliases like: import { exportName as alias } from '...'
 *
 * Performance design:
 *   - Test file paths are discovered once and cached at module scope
 *     (getTestFilePaths), so directory walking happens only once per ESLint run.
 *   - Each file's content is read once and its reference index is cached at
 *     module scope (buildFileIndex), so repeated linting of multiple integration-examples
 *     files does not re-read or re-parse the same test files.
 *   - Instances are grouped by export name so the alias lookup for a given
 *     (file, export) pair is resolved once rather than once per instance.
 *   - Membership checks use Set.has() — O(1) — instead of compiling and
 *     executing a new RegExp per (instance, file) pair.
 *
 * @param {string} workspaceRoot
 * @param {Map<string, object>} testDataInstances
 * @returns {Set<string>}
 */
function findTestDataUsage(workspaceRoot, testDataInstances) {
  const testFilePaths = getTestFilePaths(workspaceRoot);
  const usedInstances = new Set();

  // Group instances by their root export name so alias resolution is done once
  // per (file × export) rather than once per (file × instance).
  // Map: exportName → Array<{ fullPath, propertySuffix }>
  const instancesByExport = new Map();
  testDataInstances.forEach((_value, fullPath) => {
    const parts = fullPath.split('.');
    if (parts.length < 2) return;
    const exportName = parts[0];
    const propertySuffix = parts.slice(1).join('.');
    if (!instancesByExport.has(exportName)) {
      instancesByExport.set(exportName, []);
    }
    instancesByExport.get(exportName).push({ fullPath, propertySuffix });
  });

  const totalInstances = testDataInstances.size;

  for (const filePath of testFilePaths) {
    // Early exit: nothing left to discover
    if (usedInstances.size === totalInstances) break;

    const index = buildFileIndex(filePath);
    if (!index) continue;

    instancesByExport.forEach((instances, exportName) => {
      // Resolve the local alias for this export in the current file.
      // Falls back to the original export name if no import alias is present.
      const alias = index.aliases.get(exportName) || exportName;

      for (const { fullPath, propertySuffix } of instances) {
        if (usedInstances.has(fullPath)) continue; // Already found — skip

        // O(1) Set lookup replaces per-instance RegExp compilation + test
        if (index.pathSet.has(`${alias}.${propertySuffix}`)) {
          usedInstances.add(fullPath);
        }
      }
    });
  }

  return usedInstances;
}

/**
 * Check for unused integration-examples instances
 */
function checkUnusedTestData(context, workspaceRoot) {
  const sourceCode = context.sourceCode;
  const text = sourceCode.getText();
  const filename = context.filename;

  const testDataInstances = extractTestDataInstances(text, filename);
  const usedInstances = findTestDataUsage(workspaceRoot, testDataInstances);

  // Identify first-level instances (exportName.instanceName)
  const firstLevelInstances = new Map();
  testDataInstances.forEach((value, fullPath) => {
    const parts = fullPath.split('.');
    // First level is: exportName.instanceName (2 parts)
    if (parts.length === 2) {
      firstLevelInstances.set(fullPath, value);
    }
  });

  // Check if any child of a first-level instance is used
  const firstLevelInstancesWithUsedChildren = new Set();
  usedInstances.forEach((usedPath) => {
    const parts = usedPath.split('.');
    if (parts.length >= 2) {
      // Get the first-level path (exportName.instanceName)
      const firstLevelPath = parts.slice(0, 2).join('.');
      firstLevelInstancesWithUsedChildren.add(firstLevelPath);
    }
  });

  // Report only first-level instances that are completely unused
  firstLevelInstances.forEach((value, fullPath) => {
    // Skip if this first-level instance or any of its children are used
    if (firstLevelInstancesWithUsedChildren.has(fullPath)) {
      return;
    }

    const isEmpty = isEmptyParentObject(value, testDataInstances);

    context.report({
      loc: { line: value.line, column: 0 },
      message: `Unused test-data instance: ${fullPath}`,
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
      description: 'Find unused integration-examples instances from integration-examples files',
      category: 'Best Practices',
      recommended: false,
    },
    fixable: 'code',
    schema: [],
  },
  create(context) {
    const filename = context.filename;
    const workspaceRoot = process.cwd();

    // Only run on files that live inside a integration-examples/ directory.
    // Using a path-separator-aware check prevents false matches on filenames
    // that merely contain the substring "integration-examples" (e.g. find-unused-integration-examples.js).
    const isTestDataFile = /[/\\]test-data[/\\]/.test(filename) && filename.endsWith('.js') && !filename.includes('node_modules');

    if (!isTestDataFile) {
      return {};
    }

    return {
      Program() {
        checkUnusedTestData(context, workspaceRoot);
      },
    };
  },
};
