module.exports = {
  meta: {
    type: 'problem',
    docs: {
      description: 'Verify UI command names follow the naming convention: pageName__actionDescription',
      category: 'Best Practices',
      recommended: true,
    },
    schema: [],
    messages: {
      invalidUiCommandName: 'UI command name "{{commandName}}" does not follow the naming convention. Expected pattern: pageName__actionDescription (e.g., "loginPage__logIn", "checkoutPage__fillForm")',
      missingDoubleUnderscore: 'UI command name "{{commandName}}" must use double underscores (__) as separator',
      invalidCasing: 'UI command name "{{commandName}}" must use camelCase for page and action parts',
      tooManyParts: 'UI command name "{{commandName}}" must have exactly two parts: pageName__actionDescription',
    },
  },
  create(context) {
    const filename = context.getFilename();

    // Only apply this rule to UI command files
    if (!filename.includes('/commands/ui/') || !filename.endsWith('.ui.commands.js')) {
      return {};
    }

    // Pattern: pageName__actionDescription
    // - pageName: camelCase
    // - actionDescription: camelCase

    function validateUiCommandName(commandName) {
      // Check for double underscores
      if (!commandName.includes('__')) {
        return 'missingDoubleUnderscore';
      }

      // Split by double underscores
      const parts = commandName.split('__');

      // Must have exactly 2 parts: page, action
      if (parts.length !== 2) {
        return 'tooManyParts';
      }

      const [page, action] = parts;

      // Validate page name (must start with lowercase letter, can contain letters and numbers)
      if (!/^[a-z][a-zA-Z0-9]*$/.test(page)) {
        return 'invalidCasing';
      }

      // Validate action name (must start with lowercase letter, can contain letters and numbers)
      if (!/^[a-z][a-zA-Z0-9]*$/.test(action)) {
        return 'invalidCasing';
      }

      return null;
    }

    return {
      // Match Cypress.Commands.add('commandName', ...)
      'CallExpression[callee.object.object.name="Cypress"][callee.object.property.name="Commands"][callee.property.name="add"]'(node) {
        const commandNameNode = node.arguments[0];

        if (commandNameNode && commandNameNode.type === 'Literal') {
          const commandName = commandNameNode.value;

          const error = validateUiCommandName(commandName);

          if (error) {
            context.report({
              node: commandNameNode,
              messageId: error,
              data: {
                commandName,
              },
            });
          }
        }
      },
    };
  },
};
