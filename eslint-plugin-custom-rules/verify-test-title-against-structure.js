module.exports = {
  meta: {
    type: 'problem',
    docs: {
      description: 'verify titles of describe, context, and it blocks follow the declared JSON structure',
      category: 'Best Practices',
      recommended: true,
    },
    schema: [], // no options
  },
  create: function (context) {
    const filename = context.filename;
    let structureFile;

    if (filename.includes('e2e')) {
      structureFile = './app-structure/workflows.json';
    } else if (filename.endsWith('.api.spec.js')) {
      structureFile = './app-structure/modules.json';
    } else if (filename.endsWith('.ui.spec.js')) {
      structureFile = './app-structure/components.json';
    } else {
      return {};
    }

    const moduleStructure = require(structureFile);

    // Recursively sort all object properties alphabetically
    function sortObjectPropertiesRecursively(obj) {
      if (typeof obj !== 'object' || obj === null || Array.isArray(obj)) {
        return obj;
      }

      const sortedObj = {};
      const keys = Object.keys(obj).sort((a, b) => a.localeCompare(b));

      for (const key of keys) {
        sortedObj[key] = sortObjectPropertiesRecursively(obj[key]);
      }

      return sortedObj;
    }

    const sortedStructure = sortObjectPropertiesRecursively(moduleStructure);

    function validateTitleAgainstStructure(title, structure, partsToExclude = 0) {
      const parts = title.split(':')[0].trim().split('.');

      // Exclude last N parts for container blocks (describe/context)
      const partsToValidate = partsToExclude > 0 && parts.length > partsToExclude ? parts.slice(0, -partsToExclude) : parts;

      let currentLevel = structure;

      // Navigate through the structure
      for (let i = 0; i < partsToValidate.length; i++) {
        const element = partsToValidate[i];

        // Navigate to the next level
        if (currentLevel[element]) {
          currentLevel = currentLevel[element];
        } else {
          return `Part "${element}" does not exist in the declared JSON structure.`;
        }
      }
      return true;
    }

    function checkTitlePattern(node, partsToExclude = 0) {
      const title = node.arguments[0].value;
      if (title) {
        const validationResult = validateTitleAgainstStructure(title, sortedStructure, partsToExclude);
        if (validationResult !== true) {
          context.report({
            node,
            message: `Title "${title}" does not follow the declared JSON structure: ${validationResult}`,
          });
        }
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
    };
  },
};
