// Compiled once at module scope — reused across every file and every call.
const VALID_METHODS = new Set(['GET', 'POST', 'PUT', 'PATCH', 'DELETE']);
const RESOURCE_PATTERN = /^[a-z]\w*$/;
const ACTION_PATTERN = /^[a-z][a-zA-Z0-9]*$/;

module.exports = {
  meta: {
    type: 'problem',
    docs: {
      description: 'Verify API command names follow the naming convention: endpointName__actionDescription__METHOD',
      category: 'Best Practices',
      recommended: true,
    },
    schema: [],
    messages: {
      invalidApiCommandName: 'API command name "{{commandName}}" does not follow the naming convention. Expected pattern: endpointName__actionDescription__METHOD',
      missingDoubleUnderscore: 'API command name "{{commandName}}" must use double underscores (__) as separators',
      invalidHttpMethod: 'API command name "{{commandName}}" must end with a valid HTTP method: GET, POST, PUT, PATCH, DELETE',
      invalidCasing: 'API command name "{{commandName}}" must use camelCase for resource and action parts',
    },
  },
  create(context) {
    const filename = context.filename;

    // Only apply this rule to API command files
    if (!filename.includes('/commands/api/') || !filename.endsWith('.api.commands.js')) {
      return {};
    }

    // Pattern: endpointName__actionDescription__METHOD
    // - resourceName: camelCase (may include underscores for nested resources like setting_auditRound)
    // - actionDescription: camelCase
    // - METHOD: uppercase HTTP method

    function validateApiCommandName(commandName) {
      if (!commandName.includes('__')) {
        return 'missingDoubleUnderscore';
      }

      const parts = commandName.split('__');

      if (parts.length !== 3) {
        return 'invalidApiCommandName';
      }

      const [resource, action, method] = parts;

      if (!VALID_METHODS.has(method)) {
        return 'invalidHttpMethod';
      }

      if (!RESOURCE_PATTERN.test(resource)) {
        return 'invalidCasing';
      }

      if (!ACTION_PATTERN.test(action)) {
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
