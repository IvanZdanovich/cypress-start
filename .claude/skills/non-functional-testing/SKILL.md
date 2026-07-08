---
name: non-functional-testing
description: Use when designing or reviewing non-functional test approaches for performance, security, accessibility, and reliability concerns within Cypress specs.
---

# Principles

INVERSION: ask "what guarantees this system is slow, insecure, unreliable?" then check what we are NOT testing — otherwise forward coverage silently misses the attribute nobody asserted
EMBEDDING: non-functional checks ride inside functional automation as dynamic assertions, not a separate suite — otherwise the quality attribute drifts once it lives outside the flow that exercises it
ISOLATION: a non-functional assertion lives in its own `it` block — otherwise a slow response fails the same verdict as a wrong response and breaks the functional flow
FLAKINESS_CONTAINMENT: timing and environment-sensitive checks stay off by default and run in a dedicated CI stage — otherwise always-on latency assertions turn green suites red on noise
LOCAL_QUALITY: threshold and rigor track the operation — otherwise a read is held to a write's latency and a happy path is probed as hard as a boundary, mispricing both

# Method

## Activation

ENV_GATE: `NFR_CHECKS=true` from CI enables the checks, disabled by default
GUARD: `if (Cypress.env('NFR_CHECKS'))` wraps the non-functional context inside a command; reusable assertion commands guard internally so callers never manage the flag
CI_USAGE: `NFR_CHECKS=true LANGUAGE=en COLOUR_THEME=default TARGET_ENV=qa npm run test`
THRESHOLD_SOURCE: import limits from constraints, never hardcode

## Inline command integration

STRUCTURE: command holds `context` → `it` blocks for non-functional assertions, skipped when the env is off
FAILURE_MODE: Cypress assertion failure carrying a descriptive message

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

## Reusable assertion commands

NAMING: `nfr__` prefix marks a shared non-functional assertion command callable from any spec or command
LOCATION: `cypress/commands/api/` for API checks, `cypress/commands/ui/` for UI checks
API_SCOPE: response duration, payload size, sensitive fields, status code ranges, header presence
UI_SCOPE: element alignment, colour contrast, focus visibility, aria attributes, render timing
COMPOSABILITY: chain assertion commands for layered checks — `cy.nfr__assertResponsePerformance(response)` inside any API command, `cy.get(selector).nfr__assertElementAccessibility()` on any UI element

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

## Performance

RESPONSE_TIME: assert `response.duration < threshold` per endpoint, measured separately so a slow one is pinned
PAYLOAD_SIZE: assert `JSON.stringify(response.body).length < MAX_PAYLOAD_BYTES`
PAGINATION: check list-response efficiency against its own list threshold

## Security

AUTH_ENFORCEMENT: prove unauthorized fails and role-based access is denied — assert the negative, not only the happy path
LAYERED_AUTH: probe auth at transport → resource → field level
PRELIMINARY_CHECK: verify auth is required before testing the feature behind it
SENSITIVE_FIELDS: assert response body excludes password, token, secret fields
INPUT_SANITIZATION: prove invalid and boundary input is rejected — probe aggressively at auth, input, and file-upload boundaries
LEAKAGE: verify error responses carry no stack traces

## Reliability

ERROR_HANDLING: assert malformed input is rejected and state stays consistent after a failure
DATA_INTEGRITY: verify concurrent-modification handling and idempotency
MEDIATOR: `cy.intercept()` observes network behaviour without modifying it

## Accessibility

ARIA: assert `aria-label` or `aria-labelledby` presence on interactive elements
CONTRAST: assert `color` css against the expected colour
FOCUS: assert focus visibility and element alignment

## Scope

INCLUDES: response-time assertions, payload-size checks, auth validation, input sanitization, error handling, component alignment, accessibility checks, reliability monitoring
EXCLUDES: dedicated load testing, penetration testing, visual regression

## Constraints template

```javascript
export const PERF = Object.freeze({ MAX_RESPONSE_MS: 2000, MAX_LIST_RESPONSE_MS: 3000, MAX_PAYLOAD_BYTES: 1_000_000 });
export const SECURITY = Object.freeze({ UNAUTHORIZED_STATUS: 401, FORBIDDEN_STATUS: 403, SENSITIVE_FIELDS: ['password', 'token', 'secret'] });
```

# Validation

COVERAGE_CHECK: security and performance contexts exist for critical endpoints
THRESHOLD_CHECK: thresholds sourced from constraints, not hardcoded
AUTH_CHECK: every protected endpoint tested with invalid and missing tokens
ISOLATION_CHECK: non-functional assertions live in own `it` blocks, functional flow unaffected
SCOPE_CHECK: within functional automation scope, no load or pen-test overlap