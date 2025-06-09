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
    const filename = context.getFilename();
    let structureFile;

    if (filename.includes('e2e')) {
      structureFile = './app-names/workflows.json';
    } else if (filename.endsWith('.api.spec.js')) {
      structureFile = './app-names/modules.json';
    } else if (filename.endsWith('.ui.spec.js')) {
      structureFile = './app-names/components.json';
    } else {
      return {};
    }

    const moduleStructure = require(structureFile);

    function validateTitleAgainstStructure(title, structure) {
      const parts = title.split(':')[0].trim().split('.');
      if (parts.length > 1 && /^[A-Z]+$/.test(parts[parts.length - 1])) {
        parts.pop(); // Remove the last part if it is uppercase
      }
      let currentLevel = structure;

      for (const element of parts) {
        if (currentLevel[element]) {
          currentLevel = currentLevel[element];
        } else {
          return `Part "${element}" does not exist in the declared JSON structure.`;
        }
      }
      return true;
    }

    function checkTitlePattern(node) {
      const title = node.arguments[0].value;
      if (title) {
        const validationResult = validateTitleAgainstStructure(title, moduleStructure);
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
        checkTitlePattern(node);
      },
      'CallExpression[callee.name="context"]'(node) {
        checkTitlePattern(node);
      },
      'CallExpression[callee.object.name="describe"][callee.property.name="skip"]'(node) {
        checkTitlePattern(node);
      },
      'CallExpression[callee.object.name="context"][callee.property.name="skip"]'(node) {
        checkTitlePattern(node);
      },
      'CallExpression[callee.name="it"]'(node) {
        checkTitlePattern(node);
      },
    };
  },
};
