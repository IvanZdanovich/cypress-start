function getNodeTitle(node) {
  const arg = node.arguments[0];
  if (!arg) return null;
  if (arg.type === 'Literal' && typeof arg.value === 'string') return arg.value;
  if (arg.type === 'TemplateLiteral' && arg.expressions.length === 0) return arg.quasis[0].value.cooked;
  return null;
}
const describeBlockTitlePattern = /^([A-Z][a-zA-Z]+\.){0,5}([A-Z][a-zA-Z]+): Given .{1,200}(?<!\s)$/;
const contextBlockTitlePattern = /^([A-Z][a-zA-Z]+\.){1,6}[A-Z]{1,15}: When .{1,200}(?<!\s)$/;
const itBlockTitlePattern = /^([A-Z][a-zA-Z]+\.){1,6}[A-Z]{1,15}: Then .{1,200}(?<!\s)$/;
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
    function checkTitlePattern(node, pattern) {
      const title = getNodeTitle(node);
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
        const title = getNodeTitle(node);
        if (title?.startsWith('STATE:')) return;
        checkTitlePattern(node, contextBlockTitlePattern);
      },
      'CallExpression[callee.object.name="describe"][callee.property.name="skip"]'(node) {
        checkTitlePattern(node, describeBlockTitlePattern);
      },
      'CallExpression[callee.object.name="context"][callee.property.name="skip"]'(node) {
        const title = getNodeTitle(node);
        if (title?.startsWith('STATE:')) return;
        checkTitlePattern(node, contextBlockTitlePattern);
      },
      'CallExpression[callee.name="it"]'(node) {
        checkTitlePattern(node, itBlockTitlePattern);
      },
    };
  },
};
