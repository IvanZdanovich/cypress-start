---
name: non-functional-testing
description: Use when designing or reviewing non-functional test approaches for performance, security, accessibility, and reliability concerns within Cypress specs.
---

# Principles

PURPOSE: identify non-functional quality attributes within functional test automation scope
SCOPE_INCLUDES: response time assertions, payload size checks, auth validation, input sanitization, error handling, component alignment, accessibility checks, and reliability monitoring
SCOPE_EXCLUDES: dedicated load testing, penetration testing, visual regression
CORE_TECHNIQUE: "What guarantees this system is insecure, slow, unreliable?" → check what we're NOT testing
INTEGRATION: non-functional checks embedded as dynamic assertions in commands (always-on) or as dedicated spec contexts (scenario-specific)

# Command integration

ACTIVATION: env variable `NFR_CHECKS=true` from CI — disabled by default to avoid flakiness and slowdown
GUARD: `if (Cypress.env('NFR_CHECKS'))` wraps non-functional context inside command
STRUCTURE: command contains `context` → `it` blocks for non-functional assertions, skipped when env is off
DURATION_CHECK: assert `response.duration < threshold`
SENSITIVE_FIELDS_CHECK: assert response body excludes password, token, secret fields
PAYLOAD_SIZE_CHECK: assert `JSON.stringify(response.body).length < MAX_PAYLOAD_BYTES`
THRESHOLD_SOURCE: import from constraints
FAILURE_MODE: Cypress assertion failure with descriptive message

```javascript
// Inside a command — env-gated non-functional checks with context/it structure
Cypress.Commands.add('moduleName__retrieve__GET', (token, id, restOptions = {}) => {
  return cy.request({ method: 'GET', url: apiUrls.module.byId(id), auth: { bearer: token }, ...restOptions }).then((response) => {
    if (Cypress.env('NFR_CHECKS')) {
      context('Module.Submodule.Retrieve.GET: When response is received — non-functional', () => {
        it('Module.Submodule.Retrieve.GET: Then response time is within threshold', () => {
          expect(response.duration).to.be.lessThan(PERF.MAX_RESPONSE_MS);
        });

        it('Module.Submodule.Retrieve.GET: Then no sensitive fields are exposed', () => {
          expect(JSON.stringify(response.body)).to.not.match(/password|secret/i);
        });
      });
    }
    return response;
  });
});
```

CI_USAGE: `NFR_CHECKS=true LANGUAGE=en COLOUR_THEME=default TARGET_ENV=qa npm run test`
ISOLATION: non-functional failures isolated in own `it` blocks, do not break functional flow
FLAKINESS_MITIGATION: disabled by default, enabled only in dedicated CI pipeline stage

# Reusable assertion commands

PURPOSE: shared non-functional assertion commands callable from any spec or command
LOCATION: `cypress/commands/api/` for API checks, `cypress/commands/ui/` for UI checks
GUARD: each command checks `Cypress.env('NFR_CHECKS')` internally — callers don't manage the flag
API_SCOPE: response duration, payload size, sensitive fields, status code ranges, header presence
UI_SCOPE: element alignment, colour contrast, focus visibility, aria attributes, render timing

```javascript
// API assertion command — reusable across any endpoint command
Cypress.Commands.add('nfr__assertResponsePerformance', (response, threshold = PERF.MAX_RESPONSE_MS) => {
  if (!Cypress.env('NFR_CHECKS')) return;
  expect(response.duration, `response time < ${threshold}ms`).to.be.lessThan(threshold);
});

Cypress.Commands.add('nfr__assertNoSensitiveFields', (response) => {
  if (!Cypress.env('NFR_CHECKS')) return;
  SECURITY.SENSITIVE_FIELDS.forEach((field) => {
    expect(response.body).to.not.have.property(field);
  });
});

// UI assertion command — reusable across any element
Cypress.Commands.add('nfr__assertElementAccessibility', { prevSubject: 'element' }, (subject) => {
  if (!Cypress.env('NFR_CHECKS')) return cy.wrap(subject);
  cy.wrap(subject).should('have.attr', 'aria-label').or('have.attr', 'aria-labelledby');
  return cy.wrap(subject);
});

Cypress.Commands.add('nfr__assertColourContrast', { prevSubject: 'element' }, (subject, expectedColour) => {
  if (!Cypress.env('NFR_CHECKS')) return cy.wrap(subject);
  cy.wrap(subject).should('have.css', 'color', expectedColour);
  return cy.wrap(subject);
});
```

USAGE_IN_COMMANDS: call `cy.nfr__assertResponsePerformance(response)` inside any API command after response
USAGE_IN_SPECS: call `cy.get(selector).nfr__assertElementAccessibility()` for any UI element
COMPOSABILITY: chain multiple assertion commands for layered checks
NAMING: `nfr__` prefix identifies non-functional commands

# Applied principles

SEGMENTATION: measure individual endpoint response times separately
EXTRACTION: auth validation in dedicated contexts per role
LOCAL_QUALITY: different thresholds per operation type (read vs write)
ASYMMETRY: test aggressively at boundaries — auth, input, file upload
INVERSION: prove unauthorized fails, prove invalid rejected
PRELIMINARY_ACTION: verify auth required before testing features
CUSHIONING: verify no stack traces in error responses
DYNAMICS: thresholds from constraints, not hardcoded
MEDIATOR: `cy.intercept()` to observe without modifying
NESTING: auth at transport → resource → field level

# Constraints template

```javascript
export const PERF = Object.freeze({ MAX_RESPONSE_MS: 2000, MAX_LIST_RESPONSE_MS: 3000, MAX_PAYLOAD_BYTES: 1_000_000 });
export const SECURITY = Object.freeze({ UNAUTHORIZED_STATUS: 401, FORBIDDEN_STATUS: 403, SENSITIVE_FIELDS: ['password', 'token', 'secret'] });
```

# Categories

PERFORMANCE: response duration, payload size, list pagination efficiency
SECURITY: auth enforcement, role-based access, input sanitization, error information leakage
RELIABILITY: error handling, malformed input rejection, state consistency after failures
DATA_INTEGRITY: concurrent modification handling, idempotency verification

# Validation

COVERAGE_CHECK: security and performance contexts for critical endpoints
THRESHOLD_CHECK: thresholds from constraints, not hardcoded
AUTH_CHECK: every protected endpoint tested with invalid/missing tokens
SCOPE_CHECK: within functional automation scope, no load/pen-test overlap
