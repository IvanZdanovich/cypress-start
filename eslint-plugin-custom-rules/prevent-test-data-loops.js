/**
 * ESLint Rule: prevent-test-data-loops
 * // ...existing code...
 */

// Patterns compiled once at module scope — reused across every file and every
// matching AST node instead of being re-allocated inside visitor callbacks.
const FOREACH_SUSPICIOUS_PATTERNS = [/testData/i, /invalid/i, /valid/i, /Array/, /items/i, /values/i, /data/i];
const FOROF_SUSPICIOUS_PATTERNS = [/testData/i, /invalid/i, /valid/i, /Array/, /items/i, /values/i, /data/i];
const FORIN_SUSPICIOUS_PATTERNS = [/testData/i, /invalid/i, /valid/i, /items/i, /values/i, /data/i];

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
    let describeDepth = 0;
    let testDepth = 0;
    let hookDepth = 0; // Tracks before/after/beforeEach/afterEach - loops here are setup, not test generation

    return {
      // Track when we're inside describe/context/it blocks using depth counters
      CallExpression(node) {
        const calleeName = node.callee.name;
        if (['describe', 'context', 'it', 'specify', 'test'].includes(calleeName)) {
          if (['describe', 'context'].includes(calleeName)) {
            describeDepth++;
          } else {
            testDepth++;
          }
        }

        // Track hook depth - loops inside hooks are legitimate setup/teardown, not test generation
        if (['before', 'after', 'beforeEach', 'afterEach'].includes(calleeName)) {
          hookDepth++;
        }

        // Check for .forEach() calls within test blocks (but not inside hooks)
        if (hookDepth === 0 && (describeDepth > 0 || testDepth > 0) && node.callee.type === 'MemberExpression' && node.callee.property.name === 'forEach') {
          // Check if it's likely iterating over test data (arrays or objects)
          const objectName = context.sourceCode.getText(node.callee.object);

          const isSuspicious = FOREACH_SUSPICIOUS_PATTERNS.some((pattern) => pattern.test(objectName));

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
            describeDepth--;
          } else {
            testDepth--;
          }
        }
        if (['before', 'after', 'beforeEach', 'afterEach'].includes(calleeName)) {
          hookDepth--;
        }
      },

      // Check for for...of loops within test blocks
      ForOfStatement(node) {
        if (hookDepth === 0 && (describeDepth > 0 || testDepth > 0)) {
          const rightSource = context.sourceCode.getText(node.right);

          const isSuspicious = FOROF_SUSPICIOUS_PATTERNS.some((pattern) => pattern.test(rightSource));

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
        if (hookDepth === 0 && (describeDepth > 0 || testDepth > 0)) {
          const rightSource = context.sourceCode.getText(node.right);

          const isSuspicious = FORIN_SUSPICIOUS_PATTERNS.some((pattern) => pattern.test(rightSource));

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
