function getNodeTitle(node) {
  const arg = node.arguments[0];
  if (!arg) return null;
  if (arg.type === 'Literal' && typeof arg.value === 'string') return arg.value;
  if (arg.type === 'TemplateLiteral' && arg.expressions.length === 0) return arg.quasis[0].value.cooked;
  return null;
}

module.exports = {
  meta: {
    type: 'problem',
    docs: {
      description: 'disallow duplicated titles in describe and context blocks',
      category: 'Best Practices',
      recommended: true,
    },
    schema: [], // no options
  },
  create(context) {
    const globalTitles = new Set();

    function checkForDuplicate(node) {
      const title = getNodeTitle(node);
      if (title && globalTitles.has(title)) {
        context.report({
          node,
          message: `Duplicate title "${title}" is not allowed.`,
        });
      } else if (title) {
        globalTitles.add(title);
      }
    }

    return {
      'CallExpression[callee.name="describe"], CallExpression[callee.name="context"], CallExpression[callee.object.name="describe"][callee.property.name="skip"], CallExpression[callee.object.name="context"][callee.property.name="skip"], CallExpression[callee.object.name="describe"][callee.property.name="only"], CallExpression[callee.object.name="context"][callee.property.name="only"]':
        checkForDuplicate,
    };
  },
};
