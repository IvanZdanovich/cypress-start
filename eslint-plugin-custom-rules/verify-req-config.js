/**
 * ESLint rule: verify-req-config
 *
 * Ensures every `it()` block has a Cypress config object with a `req` property.
 * If the `req` object is provided, it must contain at least one of: p, state, ref, bugs.
 *
 * Valid formats:
 *   it('title', { req: {} }, () => {})                                        — all defaults (P2, no state/ref/bugs)
 *   it('title', { req: { p: 'P1' } }, () => {})                               — priority only
 *   it('title', { req: { p: 'P1', state: 'booking created via POST' } }, () => {})
 *   it('title', { req: { p: 'P1', bugs: ['BUG-BOOKING-002'] } }, () => {})
 *   it('title', { req: { p: 'P1', ref: ['PROJ-123'] } }, () => {})
 */
module.exports = {
  meta: {
    type: 'problem',
    docs: {
      description: 'When { req: {...} } is provided in an it() block, validate its fields (p, state, ref, bugs)',
      category: 'Best Practices',
      recommended: true,
    },
    schema: [],
  },
  create(context) {
    const VALID_PRIORITIES = ['P1', 'P2', 'P3'];
    const BUG_ID_PATTERN = /^BUG-[A-Z]+-\d{3}$/;

    function getStaticValue(node) {
      if (!node) return undefined;
      if (node.type === 'Literal') return node.value;
      return undefined;
    }

    function checkItBlock(node) {
      const args = node.arguments;

      // Find the config object — it's the second argument if it's an ObjectExpression,
      // or the second argument could be the callback. Cypress signature:
      //   it(title, [config], fn)
      let configArg = null;
      if (args.length >= 3 && args[1].type === 'ObjectExpression') {
        configArg = args[1];
      } else if (args.length === 2 && args[1].type === 'ObjectExpression') {
        // Could be config without callback (empty block) — unlikely but handle
        configArg = args[1];
      }

      // config object and req property are both optional — only validate if present
      if (!configArg) return;

      const reqProp = configArg.properties.find((prop) => prop.key && (prop.key.name === 'req' || prop.key.value === 'req'));

      if (!reqProp) return;

      if (reqProp.value.type !== 'ObjectExpression') {
        context.report({
          node,
          message: '"req" must be an object, e.g. { req: {} } or { req: { p: \'P1\' } }.',
        });
        return;
      }

      const reqProps = {};
      for (const prop of reqProp.value.properties) {
        const key = prop.key.name || prop.key.value;
        reqProps[key] = prop;
      }

      const KNOWN_FIELDS = ['p', 'state', 'ref', 'bugs'];
      const hasAtLeastOne = KNOWN_FIELDS.some((f) => reqProps[f]);

      if (!hasAtLeastOne && reqProp.value.properties.length > 0) {
        context.report({
          node: reqProp,
          message: `req object must contain at least one of: ${KNOWN_FIELDS.join(', ')}.`,
        });
      }

      // Validate optional: p (priority)
      if (reqProps.p) {
        const pVal = getStaticValue(reqProps.p.value);
        if (pVal && !VALID_PRIORITIES.includes(pVal)) {
          context.report({
            node: reqProps.p,
            message: `req.p must be one of: ${VALID_PRIORITIES.join(', ')}. Got: "${pVal}".`,
          });
        }
      }

      // Validate optional: bugs (array of BUG-MODULE-NNN strings)
      if (reqProps.bugs) {
        const bugsNode = reqProps.bugs.value;
        if (bugsNode.type === 'ArrayExpression') {
          for (const element of bugsNode.elements) {
            const val = getStaticValue(element);
            if (val && !BUG_ID_PATTERN.test(val)) {
              context.report({
                node: element,
                message: `Bug ID must match format BUG-MODULE-NNN. Got: "${val}".`,
              });
            }
          }
        }
      }
    }

    return {
      'CallExpression[callee.name="it"]'(node) {
        checkItBlock(node);
      },
      'CallExpression[callee.object.name="it"][callee.property.name="skip"]'(node) {
        checkItBlock(node);
      },
      'CallExpression[callee.object.name="it"][callee.property.name="only"]'(node) {
        checkItBlock(node);
      },
    };
  },
};
