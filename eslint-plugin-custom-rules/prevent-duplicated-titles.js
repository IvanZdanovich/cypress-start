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
    const globalTitles = require('./global-titles/global-titles');

    function checkForDuplicate(node) {
      const title = node.arguments[0] && node.arguments[0].value && node.arguments[0].value.replace(/["'`]/g, '');
      if (title && globalTitles.has(title)) {
        context.report({
          node,
          message: `Duplicate title "${title}" is not allowed.`,
        });
      } else {
        globalTitles.add(title);
      }
    }

    return {
      'CallExpression[callee.name="describe"], CallExpression[callee.name="context"], CallExpression[callee.object.name="describe"][callee.property.name="skip"], CallExpression[callee.object.name="context"][callee.property.name="skip"], CallExpression[callee.object.name="describe"][callee.property.name="only"], CallExpression[callee.object.name="context"][callee.property.name="only"]':
        checkForDuplicate,
    };
  },
};
