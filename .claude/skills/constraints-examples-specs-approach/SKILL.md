---
name: constraints-examples-specs-approach
description: Use when designing or reviewing executable requirements (specifications) to follow the project constraints to examples to specs traceability model
---

# Constraints examples specs approach

PURPOSE: enforce executable requirements through constraints, named examples, and testable specs
SCOPE: `cypress/constants/api/*.constraints.js`, `cypress/constants/ui/*.constraints.js`,
`cypress/e2e-examples/ui/*.examples.js`, `cypress/integration-examples/api/*.examples.js`,
`cypress/integration-examples/ui/*.examples.js`, `cypress/integration/api/*.spec.js`,
`cypress/integration/ui/*.spec.js`,`cypress/e2e/ui/*.spec.js`
CORE_IDEA: spec titles are requirements, examples are executable data, constraints are boundary sources

# Ownership

CONSTRAINTS: boundary values, formats, required fields, enums, durations, display options
EXAMPLES: named instances and payloads, one key per tested state of instance, pre-calculated derived values
SPECS: Given/When/Then requirement titles, setup, execution, assertions, req metadata
COMMANDS: reusable steps, complex interactions, and multi-step flows
GLOBALS: `utils`, `l10n`, `colours`, `apiUrls`, `uiUrls`, `userRoles`, `companies`, `reqs`, `apiErrors`, selectors

# Traceability

CHAIN: constraint value to example field or instance to spec title to assertion
BOUNDARY_SOURCE: import constraints in examples and specs
DATA_SOURCE: spec uses examples directly
ASSERTION_SOURCE: expected values from constraints, examples, globals, or pre-calculated derived values
REQ_METADATA: every `it()` can include metadata object `{ req: {} }`; fields `p`, `preconditions`, `refs`, `bugs`

# Data lifecycle

RANDOM_SOURCE: `utils` for generated names, dates, numbers, booleans, random selections
ID_FIELDS: `String` placeholders in examples
ID_ASSIGNMENT: immediate assignment after resource creation to same instance owner
INSTANCE_REUSE: within file lifecycle, same-instance IDs, context-specific keys
DERIVED_VALUES: pre-calculated in examples
CLEANUP: `const cleanUp = () => cy.module__deleteByNames__DELETE(token, [examples.namePrefix])` plus `before` and
`after`
DELETE_STRATEGY: name patterns and `deleteByNames` style commands
FILE_INDEPENDENCE: each spec runnable alone from clean or polluted environment

# Testability

SPEC_STRUCTURE: single `describe` defining the scenario, with sequential `context` blocks grouping setup conditions, and
`it` blocks asserting specifications
ISOLATION: `{ testIsolation: false }` on `describe`
FLOW: explicit state per context, efficient context order, flat `cy.then()` blocks
ASSERTION_SCOPE: expected result blocks, single-value `it` blocks where practical
ERROR_RESPONSES: pass `{ failOnStatusCode: false }` for expected non-2xx responses
BUG_HANDLING: bug IDs in `req.bugs`, current behavior asserted until fixed

# Naming

EXAMPLE_FORMAT: `{purpose}{QualifierSuffix?}` — single `lowerCamelCase` token; group container carries entity + validity, instance key describes the single distinguishing intent;
COMMAND_FORMAT_API: `moduleName__operationDetails__METHOD`
COMMAND_FORMAT_UI: `pageName__operation`, `componentName__operation`
TITLE_DESCRIBE: `Module.Submodule: Given 'preconditions', 'created data'`
TITLE_CONTEXT: `Module.Submodule.Operation.METHOD: When 'condition'`
TITLE_IT: `Module.Submodule.Operation.METHOD: Then 'expected result'`
TITLE_UNIQUENESS: unique describe, context, and `it` titles within `context`
TITLE_IT_SPECIFICITY: verified assumed outcome of example or business rule
NAME_STYLE: semantic purpose, context intent, stable business wording

# Readability

SPEC_GUARDRAILS: pre-composed examples, direct references, pre-calculated values, flat Cypress chains
DATA_GUARDRAILS: generated dates and names, semantic keys, same-instance IDs, useful comments
MAINTENANCE_GUARDRAILS: compact setup, visible data ownership, one context per example key
REVIEW_CHECK: boundary trace, ID lifecycle, cleanup hooks, req metadata, title uniqueness

