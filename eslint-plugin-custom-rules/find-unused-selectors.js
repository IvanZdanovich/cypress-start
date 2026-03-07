const fs = require('fs');
const path = require('path');

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
 * Search for selector usage in test files and commands
 */
function findSelectorUsage(workspaceRoot, selectorKeys) {
  const testDirs = [path.join(workspaceRoot, 'cypress', 'integration'), path.join(workspaceRoot, 'cypress', 'e2e'), path.join(workspaceRoot, 'cypress', 'commands')];

  const usedSelectors = new Set();

  function searchInFile(filePath) {
    try {
      const content = fs.readFileSync(filePath, 'utf8');

      // Check each selector key
      selectorKeys.forEach((value, fullPath) => {
        // Match patterns like: auditsPage.list.rows, commonUI.spinner, etc.
        const parts = fullPath.split('.');
        if (parts.length >= 2) {
          const objectName = parts[0];
          const propertyPath = parts.slice(1).join('.');

          // Create regex to match the full path usage
          const pattern = new RegExp(`\\b${objectName}\\.${propertyPath.replace(/\./g, '\\.')}\\b`);

          if (pattern.test(content)) {
            usedSelectors.add(fullPath);
          }
        }
      });
    } catch {
      // Skip files that can't be read
    }
  }

  function walkDirectory(dir) {
    try {
      const entries = fs.readdirSync(dir, { withFileTypes: true });

      entries.forEach((entry) => {
        const fullPath = path.join(dir, entry.name);

        if (entry.isDirectory()) {
          walkDirectory(fullPath);
        } else if (entry.isFile() && /\.(js|cy\.js)$/.test(entry.name)) {
          searchInFile(fullPath);
        }
      });
    } catch {
      // Skip directories that can't be read
    }
  }

  testDirs.forEach((dir) => {
    if (fs.existsSync(dir)) {
      walkDirectory(dir);
    }
  });

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

    const line = lines[value.line - 1];
    // Check if it's a single-line empty object: `key: {},` or `key: {}`
    return /^\s*\w+:\s*{\s*}\s*,?\s*$/.test(line);
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

    // Only run on selector definition files
    const isSelectorsFile = filename.includes('selectors.js');

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
