---
name: write-integration-api-specs
description: Use when writing, updating, or reviewing integration API specs for endpoint contracts, statuses, payloads, headers, errors, or CRUD lifecycles.
---

# Reasoning Principles

API_SCOPE: a spec verifies request/response contract, status, payload, headers, error case, or CRUD lifecycle of an endpoint — otherwise UI behaviour belongs in UI skills
EXECUTABLE_REQUIREMENT: assertion states the assumed outcome of a named example or business rule — otherwise a failing assertion signals brittle test data rather than a real contradiction
TRACEABILITY: every asserted value traces through examples to constraints — otherwise inline literals drift from the source rule and hide what is verified
COMPUTING_EFFICIENCY: setup via API commands and one reused instance across create-update-delete lifecycle — otherwise per-`it` recreation multiplies calls without adding coverage
DETERMINISM: prefix cleanup before and after with file-independent order — otherwise leftovers from prior runs pass or poison later specs
REQUEST_SINGLE_SOURCE: path params, query, headers, and body come from one pre-composed example instance — otherwise rebuilt request parts fork from constraint-backed data
ID_OWNERSHIP: runtime IDs assigned once to the source example and shared through getters — otherwise copied IDs break single-source traceability
READABILITY: direct example references and flat Cypress chains over local aliases and nested callbacks — otherwise the asserted source and command order become harder to audit
METADATA_NOT_COMMENTS: requirement facts live in `req` fields the lint rule and reporter can read — otherwise inline `// P1`, `// TODO`, or Jira comments are invisible to tooling and drift from the block they describe
TITLE_OWNS_REQUIREMENT: the Given/When/Then title states the requirement; `req` only classifies, links, and scopes it — otherwise a verbose `note` duplicates the title and the two versions disagree
PERMISSION_TRUTH: role, endpoint, and expected status are validated through `validate-permissions-api` before writing — otherwise a wrong supplied status ships as a green spec
INVERSION: false confidence risks are named as untraced literals, shadowed examples, rebuilt payloads, and order dependence — otherwise a rebuilt payload or order-dependent context passes green while drifting from its constraint-backed example

# Output Shape

## Paths

SCOPE_PATH: `cypress/integration/api/**/*.api.spec.js`
SPEC_PATH: `cypress/integration/api/<kebab-domain>[.<kebab-scenario>].api.spec.js`, one or more dot-separated domain/scenario segments before `.api.spec.js`
EXAMPLES_PATH: `cypress/integration-examples/api/<kebab-domain>[.<kebab-scenario>].api.examples.js`, mirrored to the spec scope when examples are spec-specific
CONSTRAINTS_PATH: `cypress/constants/api/module-name.api.constraints.js`
COMMANDS_PATH: `cypress/commands/api/`
URLS_PATH: `cypress/urls/api-urls.js`
REGISTRY_PATH: `eslint-plugin-custom-rules/app-structure/modules.json`

## Structure & Lifecycle

HIERARCHY: single `describe` → sequential `context` blocks → `it` blocks
TEST_ISOLATION: `{ testIsolation: false }` on `describe` so token and created data persist across contexts
SETUP_LIFECYCLE: `before` obtains token and runs cleanup; context `before` performs shared request or created-data setup; `after` runs cleanup
FLOW_ORDER: contexts ordered by dependency with explicit state per context
EXPECTED_ERRORS: `{ failOnStatusCode: false }` on expected non-2xx requests

## Titles & Metadata

TITLE_FORMAT: `Module.Submodule: Given preconditions, created data`; `Module.Submodule.Operation.METHOD: When condition`; `Module.Submodule.Operation.METHOD: Then expected result`
TITLE_QUALITY: unique within `context`, constraint-backed, Given/When/Then, no parentheses or square brackets, value meaning over literal value
REQ_METADATA: optional `{ req: { p, preconditions, refs, bugs, note } }`; omit empty fields, set `p` only for `'P1'` or `'P3'` since `'P2'` is the default and is omitted, keep tickets in `refs`, tracked bugs in `bugs`, behaviour reason in `note`
NEAREST_SCOPE: `req` sits on the smallest block it is true for — `it` for one outcome, `context` for one action and all its outcomes, `describe` for every block in the file; parent metadata is not repeated on children

## Data & Requests

DATA_LIFECYCLE: one named instance moves through create, retrieve, update, partial update, and delete within the file when the endpoint lifecycle requires it
NAME_PATTERN: `SpecFileAbbr.EntityAbbr.ActionOrIntent.${randomSuffix}`
EXAMPLE_IDS: source example owns placeholder `id`; spec assigns `examples.group.source.id = response.body.id` once; dependent examples expose `get id() { return examples.group.source.id; }`
REQUEST_PREPARATION: every request composed as a named example instance grouped by operation before the spec uses it
SPEC_CALLS: command receives the pre-composed request instance; path params, query, headers, and body are not rebuilt inside the spec

## Commands

COMMAND_FORMAT: `moduleName__operationDetails__METHOD`
COMMAND_PARAMETERS: auth principal first → required route/path params in URL order → body/request data → optional context/header params → `restOptions` last
COMMAND_OPERATIONS: operation wording names the endpoint action precisely; CRUD verbs fit CRUD endpoints, while domain actions such as `move`, `recalculate`, `set`, or `deleteAll...` fit non-CRUD API behaviour

## Readability

READABILITY_SHAPE: `examples.group.instance` referenced inline, one core outcome per `it`, related fields asserted in one `.then()` when practical, `cy.then()` nesting no deeper than one level, comments only when they add behaviour meaning
REVERSE_BRAINSTORMING: risk checks list false confidence, hard-to-maintain code, or misleading-output risks; matches are treated as defects before writing the spec

# Validation

STRUCTURE_CHECK: describe/context/it with `{ testIsolation: false }`
SEGMENTATION_CHECK: one outcome per `it`
TITLE_CHECK: unique, constraint-backed Given/When/Then
CLEANUP_CHECK: `before` + `after`, name pattern, file independence
TRACE_CHECK: assertion values trace through examples to constraints
ID_OWNERSHIP_CHECK: each runtime ID is assigned in exactly one `then` of the spec and to exactly one instance — a second `instance.id = response.body.id` for the same value means the dependent needs a getter
REQUEST_SOURCE_CHECK: path params, query, headers, and body come from the named example instance, not rebuilt literals in the spec
REQUEST_PREPARATION_CHECK: every command call that sends data consumes a pre-composed example request instance rather than assembling body, query, or headers inline
PERMISSION_CHECK: every `401`, `403`, and role-dependent success expectation carries a `validate-permissions-api` verdict
ERROR_RESPONSE_CHECK: expected non-2xx requests use `{ failOnStatusCode: false }`
REQ_METADATA_CHECK: optional fields omitted when empty; `refs` owns requirement links; `bugs` owns tracked bugs; `note` adds behaviour meaning not already stated in the title
SCOPE_CHECK: each `req` field sits on the smallest block it is true for and is not repeated on a child
COMMENT_CHECK: no inline priority, Jira, bug, or TODO comment survives where a `req` field should carry it
COMMAND_CHECK: API commands follow `moduleName__operationDetails__METHOD` and auth-first, route-before-body, `restOptions`-last parameter order
READABILITY_CHECK: direct example references, flat Cypress chains, meaningful comments only
