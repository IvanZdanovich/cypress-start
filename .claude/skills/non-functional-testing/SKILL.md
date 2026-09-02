---
name: non-functional-testing
description: Use when designing or reviewing Cypress checks for performance, security, accessibility, or reliability inside functional flows.
---

# Reasoning Principles

INVERSION: ask "what would make this system slow, insecure, or unreliable?" then check what the tests miss — otherwise forward coverage silently misses the quality rule nobody asserted
EMBEDDING: non-functional checks ride inside functional automation as guarded assertions, not a separate suite — otherwise the quality rule drifts once it lives outside the flow that exercises it
ISOLATION: a non-functional assertion lives in its own spec-declared `it` block — otherwise a slow response fails the same verdict as a wrong response and breaks the functional flow
FLAKINESS_CONTAINMENT: timing and environment-sensitive checks stay off by default and run in a dedicated CI stage — otherwise always-on latency assertions turn green suites red on noise
LOCAL_QUALITY: threshold and depth match the operation — otherwise a read is held to a write's latency and a happy path is tested as hard as a boundary, getting both wrong

# Output Shape

## Gating & Structure

ENV_GATE: `NFR_CHECKS=true` from CI enables the checks, disabled by default
GUARD: reusable assertion commands guard internally with `if (Cypress.env('NFR_CHECKS'))`; callers never manage the flag
CI_USAGE: `NFR_CHECKS=true LANGUAGE=en COLOUR_THEME=default TARGET_ENV=qa npm run test`
THRESHOLD_SOURCE: import limits from constraints, never hardcode
DECLARATION_BOUNDARY: specs own `context`/`it` declarations; commands own guarded assertions only — otherwise Mocha tests are registered during command execution instead of spec definition
INLINE_STRUCTURE: spec holds `context` → `it` blocks for non-functional assertions; commands contain no `describe`/`context`/`it`
FAILURE_MODE: Cypress assertion failure carrying a descriptive message
SPEC_SHAPE: non-functional coverage uses a spec-declared `context('... — non-functional')` with focused `it` blocks that call guarded `nfr__` assertion commands

## Reusable Commands

REUSABLE_NAMING: `nfr__` prefix marks a shared non-functional assertion command callable from any spec or command
REUSABLE_LOCATION: `cypress/commands/api/` for API checks, `cypress/commands/ui/` for UI checks
API_SCOPE: response duration, payload size, sensitive fields, status code ranges, header presence
UI_SCOPE: element alignment, colour contrast, focus visibility, aria attributes, render timing
COMPOSABILITY: chain assertion commands for layered checks — `cy.nfr__assertResponsePerformance(response)` inside any API command, `cy.get(selector).nfr__assertElementAccessibility()` on any UI element
API_COMMAND_SHAPE: API `nfr__` commands accept the response and optional threshold, guard on `Cypress.env('NFR_CHECKS')`, and assert response duration, payload size, headers, or sensitive-field absence with descriptive messages
UI_COMMAND_SHAPE: UI `nfr__` commands use `{ prevSubject: 'element' }`, return `cy.wrap(subject)` when disabled, and assert accessibility, contrast, focus, or alignment on the yielded element

## Attribute Assertions

PERF_RESPONSE_TIME: assert `response.duration < threshold` per endpoint, measured separately so a slow one is pinned
PERF_PAYLOAD_SIZE: assert `JSON.stringify(response.body).length < MAX_PAYLOAD_BYTES`
PERF_PAGINATION: check list-response efficiency against its own list threshold
SEC_AUTH_ENFORCEMENT: prove unauthorized fails and role-based access is denied — assert the negative, not only the happy path
SEC_LAYERED_AUTH: probe auth at transport → resource → field level
SEC_PRELIMINARY_CHECK: verify auth is required before testing the feature behind it
SEC_SENSITIVE_FIELDS: assert response body excludes password, token, secret fields
SEC_INPUT_SANITIZATION: prove invalid and boundary input is rejected — probe aggressively at auth, input, and file-upload boundaries
SEC_LEAKAGE: verify error responses carry no stack traces
REL_ERROR_HANDLING: assert invalid input is rejected and state stays consistent after a failure
REL_DATA_INTEGRITY: verify concurrent-edit handling and safe retry behaviour
REL_MEDIATOR: `cy.intercept()` observes network behaviour without modifying it
A11Y_NAME: interactive elements expose an accessible name through visible text, associated label, `aria-label`, or `aria-labelledby`; ARIA is a fallback over native naming
A11Y_CONTRAST: assert `color` css against the expected colour
A11Y_FOCUS: assert focus visibility and element alignment

## Scope & Constraints

INCLUDES: response-time assertions, payload-size checks, auth validation, input sanitization, error handling, component alignment, accessibility checks, reliability monitoring
EXCLUDES: dedicated load testing, penetration testing, visual regression
CONSTRAINT_SHAPE: non-functional thresholds and security constants live in frozen constraint exports such as `PERF.MAX_RESPONSE_MS` and `SECURITY.SENSITIVE_FIELDS`

# Validation

COVERAGE_CHECK: security and performance contexts exist for endpoints named by the requirement, changed flow, or risk note
THRESHOLD_CHECK: thresholds come from constraints, not copied as literals
AUTH_CHECK: every protected endpoint tested with invalid and missing tokens
ISOLATION_CHECK: non-functional assertions live in spec-declared `it` blocks, commands declare no `describe`/`context`/`it`, functional flow unaffected
SCOPE_CHECK: within functional automation scope, no load or pen-test overlap
