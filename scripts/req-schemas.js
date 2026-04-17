/**
 * @module req-schemas
 * @description Schema definitions for requirement objects.
 *   Enforces mandatory/optional fields per requirement type (api, ui, e2e-requirements).
 *   Used by `scripts/validate-reqs.mjs` during export and CI.
 *
 * @example
 *   import { REQ_SCHEMAS, detectType } from './req-schemas.js';
 *   const type = detectType(reqObj);          // 'api' | 'ui' | 'e2e-requirements'
 *   const schema = REQ_SCHEMAS[type];
 *   schema.mandatory.forEach(f => assert(f in reqObj));
 */

// ─── Field type validators ────────────────────────────────────────────────────

const isString = (v) => typeof v === 'string' && v.length > 0;
const isNonEmptyString = isString;
const isReqId = (v) => isString(v) && /^REQ-[A-Z]+-\d{3}$/.test(v);
const isPriority = (v) => ['P1', 'P2', 'P3'].includes(v);
const isHttpMethod = (v) => ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'].includes(v);
const isNumber = (v) => typeof v === 'number' && !Number.isNaN(v);
const isStatusCode = (v) => isNumber(v) && v >= 100 && v < 600;
const isStringArray = (v) => Array.isArray(v) && v.every(isString);
const isBugArray = (v) => Array.isArray(v) && v.every((b) => /^BUG-[A-Z]+-\d{3}$/.test(b));
const isReqIdArray = (v) => Array.isArray(v) && v.every((r) => /^REQ-[A-Z]+-\d{3}$/.test(r));

// ─── Shared base (common to all types) ───────────────────────────────────────

const BASE_MANDATORY = {
  id: { validate: isReqId, description: "Requirement ID matching REQ-{PREFIX}-{NNN} (e.g. 'REQ-RB-010')" },
  rule: { validate: isNonEmptyString, description: 'Human-readable rule description' },
  priority: { validate: isPriority, description: "Testing priority: 'P1' | 'P2' | 'P3'" },
};

const BASE_OPTIONAL = {
  bugs: { validate: isBugArray, description: "Bug IDs from bug-log.json (e.g. ['BUG-BOOKING-002'])" },
  preconditions: { validate: isReqIdArray, description: "Requirement IDs that must pass first (e.g. ['REQ-RB-001'])" },
};

// ─── API requirement schema ──────────────────────────────────────────────────

const API_SCHEMA = {
  type: 'api',
  description: 'API endpoint requirement — one per HTTP operation × outcome.',
  mandatory: {
    ...BASE_MANDATORY,
    method: { validate: isHttpMethod, description: "HTTP verb from HTTP_METHODS (e.g. 'POST')" },
    path: { validate: isNonEmptyString, description: "URL path pattern (e.g. '/booking/{id}')" },
  },
  atLeastOne: {
    // At least one status code field must be present
    statusCode: { validate: isStatusCode, description: 'Expected HTTP status code (e.g. 200)' },
    statusCodeCoercible: { validate: isStatusCode, description: 'Status code for coercible invalid types' },
    statusCodeNonCoercible: { validate: isStatusCode, description: 'Status code for non-coercible invalid types' },
  },
  optional: {
    ...BASE_OPTIONAL,
    body: { validate: isNonEmptyString, description: 'Expected response body string' },
    reason: { validate: isNonEmptyString, description: 'Expected reason field value' },
    requiredFields: { validate: isStringArray, description: 'List of required payload fields' },
    affectedFields: { validate: isStringArray, description: 'List of fields affected by this rule' },
    statusCodeFloat: { validate: (v) => Array.isArray(v) && v.every(isStatusCode), description: 'Possible status codes for float ID edge case' },
    // Constraint value fields — any custom field is allowed, but known ones are typed
    minValue: { validate: isNumber, description: 'Minimum valid boundary value' },
    maxValue: { validate: isNumber, description: 'Maximum valid boundary value' },
    value: { validate: isNumber, description: 'Exact expected value' },
    limit: { validate: isNumber, description: 'Named constraint limit' },
    atBoundary: { validate: isNumber, description: 'Value at the boundary (valid)' },
    overBoundary: { validate: isNumber, description: 'Value over the boundary (invalid)' },
    underBoundary: { validate: isNumber, description: 'Value under the boundary (invalid)' },
    minStayDays: { validate: isNumber, description: 'Minimum stay duration in days' },
    expectedFormat: { validate: isNonEmptyString, description: 'Expected date/string format' },
    forbidden: { validate: isStringArray, description: 'Forbidden character list' },
    allowed: { validate: isStringArray, description: 'Allowed character list' },
  },
};

// ─── UI requirement schema ───────────────────────────────────────────────────

const UI_SCHEMA = {
  type: 'ui',
  description: 'UI component/page requirement — one per visible behavior or interaction.',
  mandatory: {
    ...BASE_MANDATORY,
    component: { validate: isNonEmptyString, description: "Page or component name (e.g. 'LoginPage', 'InventorySort')" },
  },
  atLeastOne: {},
  optional: {
    ...BASE_OPTIONAL,
    selector: { validate: isNonEmptyString, description: 'Primary CSS selector for the element under test' },
    state: { validate: isNonEmptyString, description: "Expected UI state (e.g. 'disabled', 'visible', 'hidden')" },
    text: { validate: isNonEmptyString, description: 'Expected text content (use l10n key reference in rule)' },
    colour: { validate: isNonEmptyString, description: 'Expected CSS colour (use colours key reference in rule)' },
    limit: { validate: isNumber, description: 'Numeric constraint (max length, item count, etc.)' },
    atBoundary: { validate: isNumber, description: 'Value at the boundary (valid)' },
    overBoundary: { validate: isNumber, description: 'Value over the boundary (invalid)' },
    underBoundary: { validate: isNumber, description: 'Value under the boundary (invalid)' },
    options: { validate: (v) => typeof v === 'object' && v !== null, description: 'Key-value map of valid options' },
    defaultValue: { validate: () => true, description: 'Default value for the component' },
    forbidden: { validate: isStringArray, description: 'Forbidden character list' },
    allowed: { validate: isStringArray, description: 'Allowed character list' },
  },
};

// ─── E2E requirement schema ──────────────────────────────────────────────────

const E2E_SCHEMA = {
  type: 'e2e',
  description: 'End-to-end workflow requirement — one per complete user journey outcome.',
  mandatory: {
    ...BASE_MANDATORY,
    workflow: { validate: isNonEmptyString, description: "Workflow name (e.g. 'CompletePurchase', 'UserRegistration')" },
  },
  atLeastOne: {},
  optional: {
    ...BASE_OPTIONAL,
    steps: { validate: isStringArray, description: 'Ordered list of high-level step descriptions' },
    roles: { validate: isStringArray, description: 'User roles involved in this workflow' },
    entryUrl: { validate: isNonEmptyString, description: 'Starting URL for the workflow' },
    exitUrl: { validate: isNonEmptyString, description: 'Expected URL after workflow completion' },
    expectedOutcome: { validate: isNonEmptyString, description: 'Final visible outcome description' },
  },
};

// ─── Type detection ──────────────────────────────────────────────────────────

/**
 * Detect requirement type from the object's fields.
 * @param {object} req — a single requirement object
 * @returns {'api'|'ui'|'e2e-requirements'|null}
 */
export function detectType(req) {
  if (req.method && req.path) return 'api';
  if (req.workflow) return 'e2e';
  if (req.component) return 'ui';
  return null;
}

/**
 * Detect requirement type from the filename convention.
 * Falls back to field-based detection if filename is ambiguous.
 * @param {string} filename — e.g. 'rb.booking.reqs.js'
 * @param {object} sampleReq — any requirement object from the file
 * @returns {'api'|'ui'|'e2e-requirements'|null}
 */
export function detectTypeFromFile(filename, sampleReq) {
  // Filename hints (can be extended as modules grow)
  // For now, rely on field-based detection as the canonical method
  return detectType(sampleReq);
}

// ─── Schema map ──────────────────────────────────────────────────────────────

export const REQ_SCHEMAS = {
  api: API_SCHEMA,
  ui: UI_SCHEMA,
  e2e: E2E_SCHEMA,
};

// ─── Validation ──────────────────────────────────────────────────────────────

/**
 * Validate a single requirement object against its detected schema.
 * @param {object} req — the requirement object
 * @param {string} reqPath — display path like 'create.success'
 * @param {'api'|'ui'|'e2e-requirements'|null} typeOverride — force a type instead of auto-detecting
 * @returns {{ errors: string[], warnings: string[] }}
 */
export function validateRequirement(req, reqPath, typeOverride = null) {
  const errors = [];
  const warnings = [];

  const type = typeOverride || detectType(req);
  if (!type) {
    errors.push(`${reqPath}: Cannot detect requirement type — missing 'method'+'path' (api), 'component' (ui), or 'workflow' (e2e).`);
    return { errors, warnings };
  }

  const schema = REQ_SCHEMAS[type];

  // 1. Check mandatory fields
  for (const [field, spec] of Object.entries(schema.mandatory)) {
    if (!(field in req)) {
      errors.push(`${reqPath}: Missing mandatory field '${field}' — ${spec.description}`);
    } else if (!spec.validate(req[field])) {
      errors.push(`${reqPath}: Invalid value for '${field}' — expected: ${spec.description}, got: ${JSON.stringify(req[field])}`);
    }
  }

  // 2. Check atLeastOne group (e.g. statusCode variants for API)
  if (schema.atLeastOne && Object.keys(schema.atLeastOne).length > 0) {
    const groupFields = Object.keys(schema.atLeastOne);
    const present = groupFields.filter((f) => f in req);
    if (present.length === 0) {
      errors.push(
        `${reqPath}: Must have at least one of [${groupFields.join(', ')}] — ${Object.values(schema.atLeastOne)
          .map((s) => s.description)
          .join(' | ')}`,
      );
    } else {
      for (const field of present) {
        const spec = schema.atLeastOne[field];
        if (!spec.validate(req[field])) {
          errors.push(`${reqPath}: Invalid value for '${field}' — expected: ${spec.description}, got: ${JSON.stringify(req[field])}`);
        }
      }
    }
  }

  // 3. Check optional fields (validate type if present)
  for (const [field, spec] of Object.entries(schema.optional)) {
    if (field in req && !spec.validate(req[field])) {
      warnings.push(`${reqPath}: Optional field '${field}' has invalid value — expected: ${spec.description}, got: ${JSON.stringify(req[field])}`);
    }
  }

  // 4. Detect unknown fields (not in mandatory, atLeastOne, or optional)
  const knownFields = new Set([...Object.keys(schema.mandatory), ...Object.keys(schema.atLeastOne || {}), ...Object.keys(schema.optional)]);
  for (const field of Object.keys(req)) {
    if (!knownFields.has(field)) {
      warnings.push(`${reqPath}: Unknown field '${field}' — not in ${type} schema. Add to req-schemas.js optional fields or remove.`);
    }
  }

  return { errors, warnings };
}

/**
 * Validate all requirements in an exported module object.
 * @param {object} moduleData — the default export from a *.reqs.js file
 * @param {string} filename — for error messages
 * @param {'api'|'ui'|'e2e-requirements'|null} typeOverride — force type for all reqs
 * @returns {{ errors: string[], warnings: string[], stats: { total: number, valid: number } }}
 */
export function validateModule(moduleData, filename, typeOverride = null) {
  const allErrors = [];
  const allWarnings = [];
  let total = 0;
  let valid = 0;
  const seenIds = new Set();

  function walk(obj, pathPrefix) {
    if (!obj || typeof obj !== 'object' || Array.isArray(obj)) return;

    // If this object has an `id` matching REQ-*, it's a requirement
    if (typeof obj.id === 'string' && /^REQ-[A-Z]+-\d{3}$/.test(obj.id)) {
      total++;
      const reqPath = `${filename} → ${pathPrefix}`;

      // Duplicate ID check
      if (seenIds.has(obj.id)) {
        allErrors.push(`${reqPath}: Duplicate ID '${obj.id}'`);
      }
      seenIds.add(obj.id);

      const { errors, warnings } = validateRequirement(obj, reqPath, typeOverride);
      allErrors.push(...errors);
      allWarnings.push(...warnings);

      if (errors.length === 0) valid++;
      return; // Don't recurse into requirement fields
    }

    // Otherwise recurse into namespace groups
    for (const [key, val] of Object.entries(obj)) {
      walk(val, pathPrefix ? `${pathPrefix}.${key}` : key);
    }
  }

  walk(moduleData, '');
  return { errors: allErrors, warnings: allWarnings, stats: { total, valid } };
}
