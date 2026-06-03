# AI Agent Guide for Cypress Test Framework

# Manifest

SCOPE: every contribution honours these values; trade-offs resolve in listed priority order

COMPUTING_TIME_EFFICIENCY: functions and scripts run fast; avoid redundant work, prefer API setup over UI setup, reuse instances within file lifecycle, batch network calls, no needless loops
READABILITY: scenarios, titles, and example variable names read as plain intent; Gherkin-style titles, semantic instance keys, no generic names
SELF_DESCRIPTIVENESS: specs explain themselves; pre-composed examples, direct references, flat `cy.then()` chains, focused atomic `it` blocks that cover one aspect (single element's properties, single API call's response) with several related assertions allowed, avoiding over-split blocks that bloat test-run reports
TRACEABILITY: constraints feed examples feed specs; one source of truth per concept, no duplicated content
DETERMINISM: stable, isolated, repeatable runs; cleanup current and previous run data, randomised data via `utils`, file-independent specs
CONSISTENCY: aligned API and UI property names, naming enforced by custom ESLint rules, conventions over ad-hoc choices
MAINTAINABILITY: reusable commands for multi-step flows, inline simple actions in tests, no dead code
HONESTY: tests assert real behaviour; log deviations as bugs, reference them in `req.bugs`, assert current behaviour

VALUE_PRIORITY: correctness, readability, traceability, computing time efficiency

# Project architecture

PROJECT: Cypress automation for UI, API, E2E specifications by defined examples and constraints
ARCHITECTURE: self-descriptive specs, Gherkin-style titles, no page objects, no BDD abstraction layer
STACK: Cypress, JavaScript ES6, npm
STRUCTURE: keep existing folders and naming
SUPPORT: `cypress/support/e2e.js`
NAMING_ENFORCEMENT: custom ESLint rules
TEST_TYPES: `cypress/integration/api/*.api.spec.js`, `cypress/integration/ui/*.ui.spec.js`, `cypress/e2e/ui/*.ui.spec.js`
TEST_TYPE_MEANING: Integration API for module endpoints, Integration UI for page or component behavior, E2E UI for complete user workflows
ISOLATION_STYLE: `describe(..., { testIsolation: false }, ...)`
ASSERTION_STYLE: single assertion per `it` block, related checks within one parent element allowed

```javascript
describe('Module.Submodule: Given preconditions', { testIsolation: false }, () => {
  context('Module.Submodule.Operation.METHOD: When condition', () => {
    it('Module.Submodule.Operation.METHOD: Then expected result', () => {
      // Single assertion per it block
    });
  });
});
```

GLOBAL_SOURCE: `cypress/support/e2e.js`
GLOBALS: `utils`, `l10n`, `colours`, `apiUrls`, `uiUrls`, `userRoles`, `companies`, `reqs`, `apiErrors`, selectors accessible via global page-name variables
CONSTANTS: `cypress/constants/api`, `cypress/constants/ui`
EXAMPLES: `cypress/integration-examples/api`, `cypress/integration-examples/ui`, `cypress/e2e-examples/ui`
SPECS: `cypress/integration/api`, `cypress/integration/ui`, `cypress/e2e/ui`
REFERENCE: `docs`, `development-data`, `bug-log/bug-log.json`
SECRETS: `cypress/sensitive-data`, local storage
VALIDATION: `eslint-plugin-custom-rules/app-structure`
SCOPE_INCLUDED: functional API, UI, E2E tests
SPECIALTY_SCOPE: accessibility, performance, security, compatibility, visual regression, native mobile, manual test management handled by dedicated frameworks

# Critical workflows

ENVIRONMENT_CONFIG_SOURCE: `cypress.config.js`
TEST_COMMAND: `LANGUAGE=en COLOUR_THEME=default TARGET_ENV=dev BROWSER=electron npm run test`
PARALLEL_RUNNER_SOURCE: `scripts/parallel-cypress-runner.js`
PARALLEL_COMMAND: `PARALLEL_STREAMS=6 npm run test:parallel`
PARALLEL_STRATEGY: naming-pattern splits, local runner, no Cypress Cloud dependency
PRETEST_SETUP_SOURCE: `package.json` pretest script
PRETEST_STEPS: `node scripts/copyLocalization.js`, `node scripts/copyColours.js`
HOOK_SETUP_SOURCE: `scripts/setup-git-hooks.js`
ESLINT_RULES_LOCATION: `eslint-plugin-custom-rules/`
ESLINT_RULESET_SIZE: 14 enabled custom rules
LINT_COMMAND: `npm run lint`
LINT_EFFECT: auto-fix formatting, fail on structural violations

```bash
LANGUAGE=en COLOUR_THEME=default TARGET_ENV=dev BROWSER=electron npm run test
PARALLEL_STREAMS=6 npm run test:parallel
```

# Project patterns

EXAMPLES_LOCATION: `cypress/integration-examples/{api,ui}/`, `cypress/e2e-examples/ui/`
RANDOM_SOURCE: `utils`
DATA_SOURCE: examples files compose instances
SPEC_SCOPE: assign dynamic IDs, call pre-composed examples, assert expected values
DATA_GUARDRAILS: generated dates and names, immediate ID assignment, purpose-based instance names, same-file instance reuse
PREFERRED_DATA: explicit fields, complete instances, semantic names, same-instance IDs
INSTANCE_LIFECYCLE: create, update, delete within one file lifecycle
ID_FIELDS: `String` placeholders
INSTANCE_NAME_STYLE: `{purpose}{QualifierSuffix?}` — single `lowerCamelCase` token (e.g. `missingFirstname`, `maximalPrice`, `sameDayCheckout`, `firstnameAtMaxLength`, `yesNoCompliant`); container key (`validBookings`, `invalidBookings`, `expectedResponses`) carries entity and validity;
INSTANCE_REUSE: within file lifecycle
NAMING_STYLE: `{context}{Purpose}`
GROUPING: scenario or purpose
INSTANCE_NAME_CLEANUP_PATTERN: `SpecFileAbbr.EntityAbbr.ActionOrIntent.${randomSuffix}`
ID_ASSIGNMENT: `testData.validBookings.allFieldsWithAllowedPrice.bookingId = response.body.bookingid`
API_COMPOSITION: request bodies, expected values, patch bodies, query params live in examples
SPEC_CALLS: pass `examples.instance` fields directly without rebuilding payloads in specs
DERIVED_VALUES: pre-calculated in examples
CY_FLOW: flat `cy.then()` blocks
PRECONDITIONS: direct calls per instance
ASSERTION_SCOPE: expected result blocks
SPEC_GUARDRAILS: pre-composed examples, direct references, pre-calculated values, flat Cypress chains, focused `it` blocks
CLEANUP_FUNCTION: `const cleanUp = () => cy.module__deleteByNames__DELETE(token, [examples.namePrefix])`
CLEANUP_STRATEGY: delete by name pattern through `deleteByNames`
CLEANUP_HOOKS: `before`, `after`
FILE_INDEPENDENCE: each spec cleans current and previous run data
STATE_BASELINE: current and previous run data cleaned

```javascript
const cleanUp = () => {
  cy.module__deleteByNames__DELETE(token, [examples.namePrefix]);
};

before(() => {
  cleanUp();
});

after(() => {
  cleanUp();
});
```

COMMAND_LOCATION: `cypress/commands/{api,ui}/`
COMMAND_GROUPING: module for API, page or component for UI
COMMAND_SCOPE: reusable multi-step flows, reusable complex assertions, shared setup or teardown
INLINE_SCOPE: direct `.click()`, `.type()`, `.clear()`, simple assertions
API_COMMAND_FORMAT: `cy.moduleName__operationDetails__METHOD()`
UI_COMMAND_FORMAT: `cy.componentName__action()`
COMMAND_EXAMPLES: `cy.templates__templateDeletionById__DELETE()`, `cy.loginPage__logIn()`
SELECTOR_GROUPING: page and component objects
SELECTOR_USAGE: global selector variables in specs and commands

```javascript
const loginPage = {
  username: '[data-test=username]',
  password: '[data-test=password]',
  login: '[data-test="login-button"]',
};

cy.get(loginPage.username).type('user');
```

BUG_LOG: `bug-log/bug-log.json`
BUG_ID: `BUG-[CONTEXT]-[NUMBER]`
API_BUG_ID: `BUG-[MODULE]-[NUMBER]`
E2E_BUG_ID: `BUG-[WORKFLOW]-[NUMBER]`
UI_BUG_ID: `BUG-[PAGE/COMPONENT]-[NUMBER]`
BUG_CRITERIA: status, validation, response shape, error message, consistency, security, performance findings
TEST_ADAPTATION: reference bug in `req.bugs`, assert current behavior, use `failOnStatusCode: false` for error responses
BUG_FIELDS: `id`, `module`, `submodule`, `severity`, `status`, `description`, `expectedBehavior`, `actualBehavior`, `endpoint`, `reproducible`, `dateReported`, `affectedFields`, `notes`
BUG_MAINTENANCE: preserve original ID and date, update status, severity, notes

```json
{
  "id": "BUG-AUTH-042",
  "severity": "High|Medium|Low",
  "status": "Open",
  "expectedBehavior": "Should return 401",
  "actualBehavior": "Returns 200 with {reason: 'Bad credentials'}"
}
```

# Integration points

TEST_FILTERING: file-based patterns
FILTER_PATTERNS: `cypress/integration/api/*.api.spec.js`, `cypress/integration/ui/*.ui.spec.js`, `cypress/e2e/ui/*.ui.spec.js`
COVERAGE_COMMAND: `npm run coverage:report`
COVERAGE_SCOPE: compare defined requirements in `describe` or `context` or `it` blocks against implemented non-empty blocks
COVERAGE_THRESHOLDS: `scripts/thresholds.json`
SENSITIVE_DATA_LOCATION: `cypress/sensitive-data/{envName}-users.json`
SENSITIVE_DATA_STORAGE: git-ignored user data files per environment
SENSITIVE_DATA_ACCESS: `cy.common__getUserDataByRole(userRoles.STANDARD)`

# Guardrails

DATA_VARIATION_STYLE: randomized instances via `utils`, explicit scenarios instead of collection loops
DATA_VARIATION_RULE: `prevent-examples-loops`
TITLE_GUARDRAILS: unique, specific, structure-aligned titles with module, page, or workflow context
TITLE_RULES: `prevent-duplicated-titles`, `verify-test-title-against-structure`, `verify-test-title-pattern`, `verify-test-title-without-forbidden-symbols`, `standardize-test-titles`
BLOCK_GUARDRAILS: non-empty `context` and `it` blocks, `.skip()` for manual placeholders
BLOCK_RULE: `do-not-allow-empty-blocks`
TODO_GUARDRAILS: linked TODO references only
TODO_RULE: `verify-todos-have-links`
LOCALIZATION_GUARDRAILS: `l10n` values instead of hardcoded UI text
COLOUR_GUARDRAILS: `colours` values instead of hardcoded hex codes

# Quick reference

DOC_REFERENCES: `docs/naming-conventions.md`, `docs/eslint-custom-rules.md`
SCRIPT_REFERENCES: `npm run test`, `npm run test:parallel`, `npm run lint`, `npm run coverage:report`, `npx cypress open`
STRUCTURE_VALIDATION_FILES: `eslint-plugin-custom-rules/app-structure/modules.json`, `eslint-plugin-custom-rules/app-structure/components.json`, `eslint-plugin-custom-rules/app-structure/workflows.json`

