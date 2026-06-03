/**
 * ESLint rule: verify-req-config
 *
 * When an `it()` block (including .skip and .only variants) has a Cypress config object with a
 * `req` property, validates all fields inside that object.
 *
 * The config object and the `req` property are both optional.
 * When present, `req` must be an object containing only the allowed fields.
 *
 * Allowed fields inside `req` (all optional):
 *   - p             — 'P1' | 'P2' | 'P3'  (omit when P2 — that is the default)
 *   - preconditions — non-empty array of non-empty strings.
 *   - refs          — non-empty array of valid HTTP/HTTPS URLs.
 *   - bugs          — non-empty array of BUG-MODULE-NNN strings or valid URLs.
 *
 * Any field name other than the four above is reported as unknown.
 *
 * Valid examples:
 *   it('title', { req: {} }, () => {})
 *   it('title', { req: { p: 'P1' } }, () => {})
 *   it('title', { req: { p: 'P1', preconditions: ['booking created via POST'] } }, () => {})
 *   it('title', { req: { p: 'P1', bugs: ['BUG-BOOKING-002'] } }, () => {})
 *   it('title', { req: { p: 'P1', bugs: ['https://jira.example.com/browse/PROJ-123'] } }, () => {})
 *   it('title', { req: { p: 'P1', refs: ['https://jira.example.com/browse/PROJ-123'] } }, () => {})
 */
module.exports = {
  meta: {
    type: 'problem',
    docs: {
      description: 'When { req: {...} } is provided in an it() block, validates p, preconditions, refs, bugs and rejects unknown fields',
      category: 'Best Practices',
      recommended: true,
    },
    schema: [],
  },
  create(context) {
    const VALID_PRIORITIES = ['P1', 'P2', 'P3'];
    const KNOWN_FIELDS = ['p', 'preconditions', 'refs', 'bugs'];
    const BUG_ID_PATTERN = /^BUG-[A-Z]+-\d{3}$/;
    const URL_PATTERN = /^https?:\/\/.+/;

    function getStaticValue(node) {
      if (!node) return undefined;
      if (node.type === 'Literal') return node.value;
      return undefined;
    }

    function checkItBlock(node) {
      const args = node.arguments;

      // Cypress signature: it(title, [config], fn)
      // config is the second argument when it is an ObjectExpression
      let configArg = null;
      if (args.length >= 2 && args[1].type === 'ObjectExpression') {
        configArg = args[1];
      }

      // config object and req property are both optional — only validate if present
      if (!configArg) return;

      const reqProp = configArg.properties.find((prop) => prop.key && (prop.key.name === 'req' || prop.key.value === 'req'));

      if (!reqProp) return;

      // ── req must be an object ───────────────────────────────────────────────
      if (reqProp.value.type !== 'ObjectExpression') {
        context.report({
          node: reqProp,
          message: '"req" must be an object literal, e.g. { req: {} } or { req: { p: \'P1\' } }.',
        });
        return;
      }

      const reqProps = {};
      for (const prop of reqProp.value.properties) {
        const key = prop.key.name || prop.key.value;
        reqProps[key] = prop;
      }

      // ── Reject unknown fields ───────────────────────────────────────────────
      for (const key of Object.keys(reqProps)) {
        if (!KNOWN_FIELDS.includes(key)) {
          context.report({
            node: reqProps[key],
            message: `Unknown field "${key}" in req. Allowed fields: ${KNOWN_FIELDS.join(', ')}.`,
          });
        }
      }

      // ── Validate p (priority) ───────────────────────────────────────────────
      if (reqProps.p) {
        const pVal = getStaticValue(reqProps.p.value);
        if (pVal !== undefined && !VALID_PRIORITIES.includes(pVal)) {
          context.report({
            node: reqProps.p,
            message: `req.p must be one of: ${VALID_PRIORITIES.join(', ')}. Got: "${pVal}".`,
          });
        }
      }

      // ── Validate preconditions (non-empty array of non-empty string literals) ─
      if (reqProps.preconditions) {
        const precNode = reqProps.preconditions.value;
        if (precNode.type !== 'ArrayExpression') {
          context.report({
            node: reqProps.preconditions,
            message: "req.preconditions must be an array of strings, e.g. preconditions: ['booking created via POST'].",
          });
        } else if (precNode.elements.length === 0) {
          context.report({
            node: reqProps.preconditions,
            message: 'req.preconditions must not be an empty array.',
          });
        } else {
          for (const element of precNode.elements) {
            const val = getStaticValue(element);
            if (element.type !== 'Literal' || typeof val !== 'string') {
              context.report({
                node: element,
                message: 'Each entry in req.preconditions must be a string literal.',
              });
            } else if (val.trim() === '') {
              context.report({
                node: element,
                message: 'req.preconditions entries must not be empty strings.',
              });
            }
          }
        }
      }

      // ── Validate refs (non-empty array of valid HTTP/HTTPS URLs) ───────────
      if (reqProps.refs) {
        const refsNode = reqProps.refs.value;
        if (refsNode.type !== 'ArrayExpression') {
          context.report({
            node: reqProps.refs,
            message: "req.refs must be an array of URLs, e.g. refs: ['https://jira.example.com/browse/PROJ-123'].",
          });
        } else if (refsNode.elements.length === 0) {
          context.report({
            node: reqProps.refs,
            message: 'req.refs must not be an empty array.',
          });
        } else {
          for (const element of refsNode.elements) {
            const val = getStaticValue(element);
            if (element.type !== 'Literal' || typeof val !== 'string') {
              context.report({
                node: element,
                message: 'Each entry in req.refs must be a string literal URL.',
              });
            } else if (!URL_PATTERN.test(val)) {
              context.report({
                node: element,
                message: `req.refs entries must be valid HTTP/HTTPS URLs. Got: "${val}".`,
              });
            }
          }
        }
      }

      // ── Validate bugs (non-empty array of BUG-MODULE-NNN strings or URLs) ───
      if (reqProps.bugs) {
        const bugsNode = reqProps.bugs.value;
        if (bugsNode.type !== 'ArrayExpression') {
          context.report({
            node: reqProps.bugs,
            message: "req.bugs must be an array, e.g. bugs: ['BUG-BOOKING-002'].",
          });
        } else if (bugsNode.elements.length === 0) {
          context.report({
            node: reqProps.bugs,
            message: 'req.bugs must not be an empty array.',
          });
        } else {
          for (const element of bugsNode.elements) {
            const val = getStaticValue(element);
            if (val !== undefined && !BUG_ID_PATTERN.test(val) && !URL_PATTERN.test(val)) {
              context.report({
                node: element,
                message: `req.bugs entries must match BUG-MODULE-NNN format or be a valid URL. Got: "${val}".`,
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
