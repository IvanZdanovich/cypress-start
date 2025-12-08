/**
 * ESLint Rule: prevent-test-data-loops
 *
 * Prevents the use of loops (forEach, for...of) over test data arrays within test files.
 * Enforces the use of randomization functions instead.
 *
 * Examples of incorrect code:
 * - testData.items.forEach(item => it('test', () => {}))
 * - for (const item of testData.items) { it('test', () => {}) }
 * - invalidIds.forEach(id => { context('test', () => {}) })
 *
 * Rationale:
 * - One test should validate one behavior with one randomly selected value
 * - Different test runs cover different values automatically
 * - Faster test execution (no redundant loops)
 * - Cleaner test reports (no duplicate test titles)
 */

module.exports = {
  meta: {
    type: 'problem',
    docs: {
      description: 'Prevent loops over test data arrays in test files. Use randomization functions instead.',
      category: 'Best Practices',
      recommended: true,
    },
    messages: {
      noForEachLoop: 'Do not use .forEach() to loop over test data. Use randomization functions to select ONE value per test execution.',
      noForOfLoop: 'Do not use for...of loops over test data. Use randomization functions to select ONE value per test execution.',
      noForInLoop: 'Do not use for...in loops over test data. Use randomization functions to select ONE value per test execution.',
      noArrayLoop: 'Do not loop over arrays within test blocks. Use randomization functions in test data file to select ONE value per test execution.',
    },
    schema: [],
  },

  create(context) {
    let inTestBlock = false;
    let inDescribeBlock = false;

    return {
      // Track when we're inside describe/context blocks
      CallExpression(node) {
        const calleeName = node.callee.name;
        if (['describe', 'context', 'it', 'specify', 'test'].includes(calleeName)) {
          if (['describe', 'context'].includes(calleeName)) {
            inDescribeBlock = true;
          } else {
            inTestBlock = true;
          }
        }

        // Check for .forEach() calls within test blocks
        if ((inDescribeBlock || inTestBlock) && node.callee.type === 'MemberExpression' && node.callee.property.name === 'forEach') {
          // Check if it's likely iterating over test data (arrays or objects)
          const objectName = context.getSourceCode().getText(node.callee.object);

          // Common patterns that suggest test data iteration
          const suspiciousPatterns = [/testData/i, /invalid/i, /valid/i, /Array/, /items/i, /values/i, /data/i];

          const isSuspicious = suspiciousPatterns.some((pattern) => pattern.test(objectName));

          if (isSuspicious) {
            context.report({
              node,
              messageId: 'noForEachLoop',
            });
          }
        }
      },

      'CallExpression:exit'(node) {
        const calleeName = node.callee.name;
        if (['describe', 'context', 'it', 'specify', 'test'].includes(calleeName)) {
          if (['describe', 'context'].includes(calleeName)) {
            inDescribeBlock = false;
          } else {
            inTestBlock = false;
          }
        }
      },

      // Check for for...of loops within test blocks
      ForOfStatement(node) {
        if (inDescribeBlock || inTestBlock) {
          const rightSource = context.getSourceCode().getText(node.right);

          const suspiciousPatterns = [/testData/i, /invalid/i, /valid/i, /Array/, /items/i, /values/i, /data/i];

          const isSuspicious = suspiciousPatterns.some((pattern) => pattern.test(rightSource));

          if (isSuspicious) {
            context.report({
              node,
              messageId: 'noForOfLoop',
            });
          }
        }
      },

      // Check for for...in loops within test blocks
      ForInStatement(node) {
        if (inDescribeBlock || inTestBlock) {
          const rightSource = context.getSourceCode().getText(node.right);

          const suspiciousPatterns = [/testData/i, /invalid/i, /valid/i, /items/i, /values/i, /data/i];

          const isSuspicious = suspiciousPatterns.some((pattern) => pattern.test(rightSource));

          if (isSuspicious) {
            context.report({
              node,
              messageId: 'noForInLoop',
            });
          }
        }
      },
    };
  },
};
