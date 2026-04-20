/**
 * ESLint Rule: enforce-spec-blank-lines
 *
 * Enforces consistent blank line usage inside spec files:
 *   - No blank lines between consecutive it blocks
 *   - No blank lines between it blocks and hook blocks (before/beforeEach/after/afterEach)
 *   - Exactly one blank line required before every context block (when preceded by another test-relevant block)
 *
 * Applies only to *.spec.js files.
 *
 * Examples of incorrect code:
 *
 *   context('...', () => {
 *     it('A', () => { ... });
 *                            // ← blank line not allowed here
 *     it('B', () => { ... });
 *   });
 *
 *   context('First', () => { ... });
 *   context('Second', () => { ... }); // ← missing blank line before context
 *
 * Examples of correct code:
 *
 *   context('...', () => {
 *     before(() => { ... });
 *     it('A', () => { ... });
 *     it('B', () => { ... });
 *     after(() => { ... });
 *   });
 *
 *   context('First', () => { ... });
 *
 *   context('Second', () => { ... });
 */

const HOOKS = new Set(['before', 'beforeEach', 'after', 'afterEach']);
const TESTS = new Set(['it', 'test', 'specify']);
const CONTEXTS = new Set(['context', 'describe']);

/**
 * Counts the number of TRULY blank lines (whitespace-only) in the raw text
 * that sits between two AST nodes.
 * Comment lines (e.g. `// …` or `/* … *\/`) are NOT counted as blank lines.
 *
 * The text layout is:
 *   "<end of prev line>\n[middle lines]\n<indent of curr line>"
 * We skip the first and last segments because they belong to the surrounding lines.
 */
function countTrueBlankLines(textBetween) {
  const lines = textBetween.split('\n');
  // lines[0]             → tail of the previous node's line (never blank on its own)
  // lines[1..length-2]   → the actual between-node lines we care about
  // lines[lines.length-1] → indentation of the current node's line
  let count = 0;
  for (let i = 1; i < lines.length - 1; i++) {
    if (/^\s*$/.test(lines[i])) {
      count++;
    }
  }
  return count;
}

/** Returns the base call name for an ExpressionStatement (handles .skip / .only variants). */
function getCallName(node) {
  if (!node || node.type !== 'ExpressionStatement') return null;
  const expr = node.expression;
  if (!expr || expr.type !== 'CallExpression') return null;
  const { callee } = expr;
  if (callee.type === 'Identifier') return callee.name;
  // Handles it.skip, context.skip, it.only, etc.
  if (callee.type === 'MemberExpression' && callee.object.type === 'Identifier') {
    return callee.object.name;
  }
  return null;
}

module.exports = {
  meta: {
    type: 'layout',
    docs: {
      description: 'Enforce consistent blank lines in spec files: no blank lines between it/hook blocks, one blank line required before context blocks.',
      category: 'Stylistic Issues',
      recommended: true,
    },
    fixable: 'whitespace',
    schema: [],
    messages: {
      missingBlankLineBeforeContext: "Expected a blank line before 'context' block.",
      unexpectedBlankLine: "Unexpected blank line(s) before '{{name}}' block. Remove blank lines between it/hook blocks.",
    },
  },

  create(context) {
    const filename = context.filename || (context.getFilename && context.getFilename()) || '';
    if (!filename.endsWith('.spec.js')) return {};

    const sourceCode = context.sourceCode || context.getSourceCode();
    const fullText = sourceCode.getText();

    /**
     * Checks consecutive siblings inside a describe/context body and reports
     * blank-line violations between relevant test nodes.
     */
    function checkSiblings(statements) {
      let prevRelevant = null;

      for (const stmt of statements) {
        const name = getCallName(stmt);
        const isHook = HOOKS.has(name);
        const isTest = TESTS.has(name);
        const isCtx = CONTEXTS.has(name);

        if (!isHook && !isTest && !isCtx) {
          // Non-test statement (variable declaration, helper function, etc.).
          // Reset tracking so we don't enforce blank lines across non-test code.
          prevRelevant = null;
          continue;
        }

        if (prevRelevant !== null) {
          const prevName = getCallName(prevRelevant);
          const rangeStart = prevRelevant.range[1];
          const rangeEnd = stmt.range[0];
          const textBetween = fullText.slice(rangeStart, rangeEnd);
          // Count only whitespace-only lines — comment lines are NOT blank lines.
          const blankLines = countTrueBlankLines(textBetween);

          if (isCtx && blankLines < 1) {
            // ── context block with no preceding blank line ─────────────────
            context.report({
              node: stmt,
              messageId: 'missingBlankLineBeforeContext',
              fix(fixer) {
                // Insert one extra newline after the first line-break in the gap.
                const fixed = textBetween.replace('\n', '\n\n');
                return fixer.replaceTextRange([rangeStart, rangeEnd], fixed);
              },
            });
          } else if ((isHook || isTest) && (HOOKS.has(prevName) || TESTS.has(prevName)) && blankLines > 0) {
            // ── it / hook block with unexpected blank line(s) before it ────
            context.report({
              node: stmt,
              messageId: 'unexpectedBlankLine',
              data: { name },
              fix(fixer) {
                // Collapse all consecutive blank lines into a single newline.
                const fixed = textBetween.replace(/\n([ \t]*\n)+/, '\n');
                return fixer.replaceTextRange([rangeStart, rangeEnd], fixed);
              },
            });
          }
        }

        prevRelevant = stmt;
      }
    }

    /** Extracts the callback body from a describe/context call and triggers sibling checks. */
    function visitContainer(node) {
      const { arguments: args } = node;
      if (!args || args.length < 1) return;
      const callback = args[args.length - 1];
      if (!callback || !['ArrowFunctionExpression', 'FunctionExpression'].includes(callback.type)) return;
      const { body } = callback;
      if (!body || body.type !== 'BlockStatement') return;
      checkSiblings(body.body);
    }

    return {
      'CallExpression[callee.name="describe"]': visitContainer,
      'CallExpression[callee.name="context"]': visitContainer,
      // Also handle describe.skip / context.skip variants
      'CallExpression[callee.object.name="describe"]': visitContainer,
      'CallExpression[callee.object.name="context"]': visitContainer,
    };
  },
};
