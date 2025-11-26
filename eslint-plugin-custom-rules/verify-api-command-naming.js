module.exports = {
  meta: {
    type: 'problem',
    docs: {
      description: 'Verify API command names follow the naming convention: resourceName__actionDescription__METHOD',
      category: 'Best Practices',
      recommended: true,
    },
    schema: [],
    messages: {
      invalidApiCommandName: 'API command name "{{commandName}}" does not follow the naming convention. Expected pattern: resourceName__actionDescription__METHOD (e.g., "settingAuditRound__add__POST", "templates__getById__GET")',
      missingDoubleUnderscore: 'API command name "{{commandName}}" must use double underscores (__) as separators',
      invalidHttpMethod: 'API command name "{{commandName}}" must end with a valid HTTP method: GET, POST, PUT, PATCH, DELETE',
      invalidCasing: 'API command name "{{commandName}}" must use camelCase for resource and action parts',
    },
  },
  create(context) {
    const filename = context.getFilename();

    // Only apply this rule to API command files
    if (!filename.includes('/commands/api/') || !filename.endsWith('.api.commands.js')) {
      return {};
    }

    // Valid HTTP methods
    const validMethods = ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'];

    // Pattern: resourceName__actionDescription__METHOD
    // - resourceName: camelCase (may include underscores for nested resources like setting_auditRound)
    // - actionDescription: camelCase
    // - METHOD: uppercase HTTP method
    const apiCommandPattern = /^[a-z][a-zA-Z0-9_]*__[a-z][a-zA-Z0-9]*__[A-Z]+$/;

    function validateApiCommandName(commandName) {
      // Check for double underscores
      if (!commandName.includes('__')) {
        return 'missingDoubleUnderscore';
      }

      // Split by double underscores
      const parts = commandName.split('__');

      // Must have exactly 3 parts: resource, action, method
      if (parts.length !== 3) {
        return 'invalidApiCommandName';
      }

      const [resource, action, method] = parts;

      // Validate HTTP method
      if (!validMethods.includes(method)) {
        return 'invalidHttpMethod';
      }

      // Validate resource name (must start with lowercase letter, can contain letters, numbers, underscores)
      if (!/^[a-z][a-zA-Z0-9_]*$/.test(resource)) {
        return 'invalidCasing';
      }

      // Validate action name (must start with lowercase letter, can contain letters and numbers)
      if (!/^[a-z][a-zA-Z0-9]*$/.test(action)) {
        return 'invalidCasing';
      }

      // Check overall pattern
      if (!apiCommandPattern.test(commandName)) {
        return 'invalidApiCommandName';
      }

      return null;
    }

    return {
      // Match Cypress.Commands.add('commandName', ...)
      'CallExpression[callee.object.object.name="Cypress"][callee.object.property.name="Commands"][callee.property.name="add"]'(node) {
        const commandNameNode = node.arguments[0];

        if (commandNameNode && commandNameNode.type === 'Literal') {
          const commandName = commandNameNode.value;

          // Skip utility commands that don't follow the pattern
          const utilityCommands = ['getTokenByRole', 'clearSessionCookies', 'getAllLanguages'];
          if (utilityCommands.includes(commandName)) {
            return;
          }

          const error = validateApiCommandName(commandName);

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
