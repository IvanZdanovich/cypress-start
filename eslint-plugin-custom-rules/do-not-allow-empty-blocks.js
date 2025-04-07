module.exports = {
  meta: {
    type: 'problem',
    docs: {
      description: 'disallow empty it blocks',
      category: 'Best Practices',
      recommended: true,
    },
    schema: [], // no options
  },
  create(context) {
    return {
      'CallExpression[callee.name="it"], CallExpression[callee.name="context"], CallExpression[callee.object.name="context"][callee.property.name="skip"]'(node) {
        const args = node.arguments;
        const callback = args[args.length - 1];
        if (!callback || callback.type === 'ArrowFunctionExpression' || callback.type === 'FunctionExpression') {
          if (
            !callback ||
            (callback.body.type === 'BlockStatement' &&
              callback.body.body.every((statement) => statement.type === 'EmptyStatement' || (statement.type === 'ExpressionStatement' && statement.expression.type === 'Literal' && typeof statement.expression.value === 'string')))
          ) {
            context.report({
              node,
              message: 'Empty it/context block is not allowed.',
            });
          }
        } else if (args.length === 1 || (args.length === 2 && args[1].type === 'ObjectExpression')) {
          context.report({
            node,
            message: 'Empty it/context/context.skip block with only title or title and config object is not allowed.',
          });
        }
      },
    };
  },
};
