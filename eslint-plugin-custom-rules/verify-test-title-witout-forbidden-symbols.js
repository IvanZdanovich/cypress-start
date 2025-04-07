module.exports = {
  meta: {
    type: 'problem',
    docs: {
      description: 'verify describe and context blocks do not have trailing whitespace, leading whitespace, or special characters',
      category: 'Best Practices',
      recommended: true,
    },
    schema: [], // no options
  },
  create(context) {
    const invalidCharactersPattern = /[!@#$%^&*()+={}[\]|\\;"'<>?/]/g;

    function checkTitle(node) {
      const title = node.arguments[0] && node.arguments[0].value;
      if (title) {
        if (title.trim() !== title) {
          context.report({
            node,
            message: `Title "${title}" has leading or trailing whitespace.`,
          });
        } else {
          const invalidCharacters = [];
          let match;
          while ((match = invalidCharactersPattern.exec(title)) !== null) {
            invalidCharacters.push({ char: match[0], index: match.index });
          }
          if (invalidCharacters.length > 0) {
            const invalidCharsString = invalidCharacters.map((ic) => `"${ic.char}" at position ${ic.index}`).join(', ');
            context.report({
              node,
              message: `Title "${title}" contains invalid characters: ${invalidCharsString}.`,
            });
          }
        }
      }
    }

    return {
      'CallExpression[callee.name="describe"]'(node) {
        checkTitle(node);
      },
      'CallExpression[callee.name="context"]'(node) {
        checkTitle(node);
      },
      'CallExpression[callee.name="describe.skip"]'(node) {
        checkTitle(node);
      },
      'CallExpression[callee.name="context.skip"]'(node) {
        checkTitle(node);
      },
    };
  },
};
