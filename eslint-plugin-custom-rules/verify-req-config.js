/**
 * ESLint rule: verify-req-config
 *
 * Ensures every `it()` block has a Cypress config object with a `req` property
 * containing required metadata fields: priority, description.
 *
 * Optional fields: bugs, example, preconditions.
 *
 * Valid formats:
 *   it('title', { req: { p: 'P1', desc: '...' } }, () => {})
 *   it('title', { req: { p: 'P1', desc: '...', bugs: ['BUG-BOOKING-002'], example: 'validBookings.standard' } }, () => {})
 *
 * The `example` field links this requirement to a named test data instance,
 * creating a traceable chain: constraint → test data example → spec assertion.
 */
module.exports = {
  meta: {
    type: 'problem',
    docs: {
      description: 'Ensure every it() block has a { req: { p, desc } } config object',
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

      if (!configArg) {
        context.report({
          node,
          message: 'it() block must have a config object with { req: { p, desc } } as the second argument.',
        });
        return;
      }

      // Find req property
      const reqProp = configArg.properties.find(
        (prop) => prop.key && (prop.key.name === 'req' || prop.key.value === 'req'),
      );

      if (!reqProp) {
        context.report({
          node,
          message: 'it() config object must have a "req" property: { req: { p, desc } }.',
        });
        return;
      }

      if (reqProp.value.type !== 'ObjectExpression') {
        context.report({
          node,
          message: '"req" must be an object: { req: { p, desc } }.',
        });
        return;
      }

      const reqProps = {};
      for (const prop of reqProp.value.properties) {
        const key = prop.key.name || prop.key.value;
        reqProps[key] = prop;
      }

      // Validate required: p (priority)
      if (!reqProps.p) {
        context.report({
          node: reqProp,
          message: 'req must have a "p" (priority) field: P1, P2, or P3.',
        });
      } else {
        const pVal = getStaticValue(reqProps.p.value);
        if (pVal && !VALID_PRIORITIES.includes(pVal)) {
          context.report({
            node: reqProps.p,
            message: `req.p must be one of: ${VALID_PRIORITIES.join(', ')}. Got: "${pVal}".`,
          });
        }
      }

      // Validate required: desc (description / rule)
      if (!reqProps.desc) {
        context.report({
          node: reqProp,
          message: 'req must have a "desc" (description) field — the requirement rule text.',
        });
      } else {
        const descVal = getStaticValue(reqProps.desc.value);
        if (descVal !== undefined && (typeof descVal !== 'string' || descVal.length < 10)) {
          context.report({
            node: reqProps.desc,
            message: 'req.desc must be a descriptive string (at least 10 characters).',
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

      // Validate optional: example (string — path to test data instance)
      if (reqProps.example) {
        const exVal = getStaticValue(reqProps.example.value);
        if (exVal !== undefined && typeof exVal !== 'string') {
          context.report({
            node: reqProps.example,
            message: 'req.example must be a string naming the test data instance.',
          });
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

