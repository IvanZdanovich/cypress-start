const path = require('path');
const fs = require('fs');

module.exports = {
  meta: {
    type: 'problem',
    docs: {
      description: 'verify that actual test structure paths exist in expected structure files',
      category: 'Best Practices',
      recommended: true,
    },
    schema: [], // no options
  },
  create: function (context) {
    const filename = context.filename;
    let expectedStructureFile;
    let actualStructureFile;
    let testType;

    // Determine test type and structure files
    if (filename.includes('e2e')) {
      expectedStructureFile = './app-structure/expected/workflows.json';
      actualStructureFile = './app-structure/actual/workflows.json';
      testType = 'e2e';
    } else if (filename.endsWith('.api.spec.js')) {
      expectedStructureFile = './app-structure/expected/modules.json';
      actualStructureFile = './app-structure/actual/modules.json';
      testType = 'api';
    } else if (filename.endsWith('.ui.spec.js')) {
      expectedStructureFile = './app-structure/expected/components.json';
      actualStructureFile = './app-structure/actual/components.json';
      testType = 'ui';
    } else {
      return {};
    }

    // Load or initialize expected structure
    const expectedStructurePath = path.resolve(__dirname, expectedStructureFile);
    const expectedStructureDir = path.dirname(expectedStructurePath);

    // Ensure expected directory exists
    if (!fs.existsSync(expectedStructureDir)) {
      fs.mkdirSync(expectedStructureDir, { recursive: true });
    }

    let expectedStructure = {};
    if (!fs.existsSync(expectedStructurePath)) {
      // Create the file with an empty structure if it doesn't exist
      try {
        fs.writeFileSync(expectedStructurePath, JSON.stringify(expectedStructure, null, 2), 'utf8');
      } catch {
        // Silent: expectedStructure stays {}, every path will fail validation surfacing the issue via context.report()
      }
    } else {
      try {
        // Clear require cache to get fresh data
        delete require.cache[expectedStructurePath];
        expectedStructure = require(expectedStructureFile);
      } catch {
        // Silent: fall back to empty structure; every path will fail validation surfacing the issue via context.report()
        expectedStructure = {};
      }
    }

    // Load or initialize actual structure
    const actualStructurePath = path.resolve(__dirname, actualStructureFile);
    const actualStructureDir = path.dirname(actualStructurePath);

    // Ensure actual directory exists
    if (!fs.existsSync(actualStructureDir)) {
      fs.mkdirSync(actualStructureDir, { recursive: true });
    }

    let actualStructure = {};
    if (fs.existsSync(actualStructurePath)) {
      try {
        const fileContent = fs.readFileSync(actualStructurePath, 'utf8');
        actualStructure = JSON.parse(fileContent);
      } catch {
        // If file is corrupted, start fresh
        actualStructure = {};
      }
    } else {
      // Create the file with an empty structure if it doesn't exist
      try {
        fs.writeFileSync(actualStructurePath, JSON.stringify(actualStructure, null, 2), 'utf8');
      } catch {
        // Silent: actual structure tracking is best-effort; lint still runs correctly
      }
    }

    /**
     * Add a path to the actual structure and save to file
     */
    function addPathToActualStructure(pathStr) {
      const parts = pathStr.split('.');
      let currentLevel = actualStructure;

      for (let i = 0; i < parts.length; i++) {
        const part = parts[i];
        if (!currentLevel[part]) {
          currentLevel[part] = {};
        }
        currentLevel = currentLevel[part];
      }

      // Save the updated structure to file
      try {
        fs.writeFileSync(actualStructurePath, JSON.stringify(actualStructure, null, 2), 'utf8');
      } catch {
        // Silent: actual structure tracking is best-effort; lint still runs correctly
      }
    }

    /**
     * Validate if a path is a valid structure path
     * Must have at least one dot and follow PascalCase convention
     * Each part must be a valid PascalCase identifier (no spaces, no lowercase words)
     */
    function isValidStructurePath(pathStr) {
      if (!pathStr.includes('.')) {
        return false;
      }

      const parts = pathStr.split('.');

      // PascalCase pattern: starts with uppercase, contains only letters and numbers, no spaces
      // Also allows common abbreviations like GET, POST, PUT, DELETE, ADMIN, etc.
      const pascalCasePattern = /^[A-Z][A-Za-z0-9]*$/;

      for (const part of parts) {
        if (!part || part.length < 2) return false;

        // Must match PascalCase pattern (no spaces allowed)
        if (!pascalCasePattern.test(part)) return false;

        // Reject parts that contain spaces (sentences)
        if (part.includes(' ')) return false;
      }

      return true;
    }

    /**
     * Extract structure path from test title (before colon)
     */
    function extractStructurePath(title, partsToExclude = 0) {
      const fullPath = title.split(':')[0].trim();

      if (!isValidStructurePath(fullPath)) {
        return null;
      }

      if (partsToExclude === 0) {
        return fullPath;
      }

      // For describe blocks, exclude last N parts
      const parts = fullPath.split('.');
      if (parts.length <= partsToExclude) {
        return null; // Not enough parts to validate
      }

      return parts.slice(0, -partsToExclude).join('.');
    }

    /**
     * Check if path exists in expected structure
     */
    function pathExistsInStructure(pathStr, structure) {
      const parts = pathStr.split('.');
      let currentLevel = structure;

      for (const part of parts) {
        if (currentLevel[part]) {
          currentLevel = currentLevel[part];
        } else {
          // Find the deepest valid path
          const validParts = [];
          let tempLevel = structure;
          for (const p of parts) {
            if (tempLevel[p]) {
              validParts.push(p);
              tempLevel = tempLevel[p];
            } else {
              break;
            }
          }

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
     * Build suggestion message for missing path
     */
    function buildSuggestionMessage(pathInfo, testType) {
      const { missingPart, validPath, fullPath } = pathInfo;

      let message = `Path "${fullPath}" not found in expected structure. `;

      if (validPath) {
        message += `Valid until "${validPath}", but "${missingPart}" is missing. `;
      } else {
        message += `"${missingPart}" does not exist. `;
      }

      message += `The path has been added to actual structure. `;
      message += `Update eslint-plugin-custom-rules/app-structure/expected/`;

      if (testType === 'ui') {
        message += 'components.json';
      } else if (testType === 'api') {
        message += 'modules.json';
      } else if (testType === 'e2e') {
        message += 'workflows.json';
      }

      message += ` to match the actual structure.`;

      return message;
    }

    /**
     * Validate test block title
     */
    function checkTitlePattern(node, partsToExclude = 0) {
      const title = node.arguments[0].value;
      if (!title) {
        return;
      }

      const structurePath = extractStructurePath(title, partsToExclude);
      if (!structurePath) {
        // Not a valid structure path or not enough parts
        return;
      }

      // Always add to actual structure (tracks what exists in tests)
      addPathToActualStructure(structurePath);

      // Validate against expected structure
      const validationResult = pathExistsInStructure(structurePath, expectedStructure);

      if (!validationResult.exists) {
        context.report({
          node,
          message: buildSuggestionMessage(validationResult, testType),
        });
      }
    }

    return {
      'CallExpression[callee.name="describe"]'(node) {
        checkTitlePattern(node, 2);
      },
      'CallExpression[callee.name="context"]'(node) {
        checkTitlePattern(node, 0);
      },
      'CallExpression[callee.object.name="describe"][callee.property.name="skip"]'(node) {
        checkTitlePattern(node, 2);
      },
      'CallExpression[callee.object.name="context"][callee.property.name="skip"]'(node) {
        checkTitlePattern(node, 0);
      },
      'CallExpression[callee.name="it"]'(node) {
        checkTitlePattern(node, 0);
      },
      'CallExpression[callee.object.name="it"][callee.property.name="skip"]'(node) {
        checkTitlePattern(node, 0);
      },
    };
  },
};
