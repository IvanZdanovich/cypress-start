module.exports = {
  meta: {
    type: 'problem',
    docs: {
      description: 'verify titles of describe, context, and it blocks follow appropriate patterns',
      category: 'Best Practices',
      recommended: true,
    },
    schema: [], // no options
  },
  create(context) {
    const describeBlockTitlePattern = /^([A-Z][a-zA-Z]+\.?){1,4}: Given .{1,200}(?<!\s)$/;
    const contextBlockTitlePattern = /^([A-Z][a-zA-Z]+\.){1,4}[A-Z]{1,10}: When .{1,200}(?<!\s)$/;
    const itBlockTitlePattern = /^([A-Z][a-zA-Z]+\.){1,4}[A-Z]{1,10}: Then .{1,200}(?<!\s)$/;

    function checkTitlePattern(node, pattern) {
      const title = node.arguments[0] && node.arguments[0].value;
      if (title && !pattern.test(title)) {
        context.report({
          node,
          message: `Title "${title}" does not follow the pattern. \nPattern: ${pattern}.`,
        });
      }
    }

    return {
      'CallExpression[callee.name="describe"]'(node) {
        checkTitlePattern(node, describeBlockTitlePattern);
      },
      'CallExpression[callee.name="context"]'(node) {
        checkTitlePattern(node, contextBlockTitlePattern);
      },
      'CallExpression[callee.name="it"]'(node) {
        checkTitlePattern(node, itBlockTitlePattern);
      },
    };
  },
};
