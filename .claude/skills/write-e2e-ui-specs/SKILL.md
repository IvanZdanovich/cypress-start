---
name: write-e2e-ui-specs
description: Use when writing, updating, or reviewing E2E UI journeys that reuse state across multiple pages or workflow steps.
---

# Reasoning Principles

WORKFLOW_SCOPE: a spec verifies an end-to-end user journey spanning multiple pages or steps — otherwise page-level checks belong in integration UI specs
CONTINUITY: entities created in earlier steps reused across create → modify → verify → complete — otherwise the test exercises isolated actions rather than the journey
BUSINESS_ORDER: contexts follow the order a real user lives the workflow with explicit state per step — otherwise convenience ordering stops documenting the requirement
EXECUTABLE_REQUIREMENT: title, example, action, and assertion state one verified business outcome — otherwise a spec that asserts less than its title claims gives false confidence
TRACEABILITY: workflow setup, execution, and verification values trace to named E2E examples and constraints — otherwise the journey hides which business rule or example it verifies
DETERMINISM: API-backed prefix cleanup before and after with file-independent data — otherwise leftovers from prior runs pass or poison the workflow
ID_OWNERSHIP: runtime IDs assigned once to the source example and shared through getters — otherwise copied IDs break continuity across workflow steps
READABILITY: direct example references and flat Cypress chains over local aliases and nested callbacks — otherwise the journey source and step order become harder to audit
METADATA_NOT_COMMENTS: requirement facts live in `req` fields the lint rule and reporter can read — otherwise inline `// P1`, `// TODO`, or Jira comments are invisible to tooling and drift from the block they describe
TITLE_OWNS_REQUIREMENT: the Given/When/Then title states the requirement; `req` only classifies, links, and scopes it — otherwise a verbose `note` duplicates the title and the two versions disagree
PERMISSION_TRUTH: each journey-step role is validated through `validate-permissions-ui` against the permissions that step requires — otherwise the journey fails for a permission reason unrelated to the workflow
INVERSION: false confidence, hard-to-maintain code, and misleading-title risks are named before writing assertions — otherwise broken step continuity or a copied runtime ID passes green while the journey no longer verifies the end-to-end outcome

# Output Shape

## Paths

SCOPE_PATH: `cypress/e2e/ui/**/*.ui.spec.js`
SPEC_PATH: `cypress/e2e/ui/<workflow-name>.ui.spec.js`, kebab-case business-flow name
EXAMPLES_PATH: `cypress/e2e-examples/ui/workflow-name.ui.examples.js`
SELECTORS_PATH: `cypress/selectors/selectors.js`
COMMAND_PATHS: `cypress/commands/ui/` for reusable workflow interactions; `cypress/commands/api/` for setup and cleanup
CONSTRAINT_IMPORTS: constraints imported directly from `cypress/constants/{api,ui}/`, never via global
REGISTRY_PATH: `eslint-plugin-custom-rules/app-structure/workflows.json`

## Structure & Lifecycle

HIERARCHY: single `describe` → sequential `context` per workflow step → `it` blocks
TEST_ISOLATION: `{ testIsolation: false }` on `describe` so workflow state persists across steps
SETUP_LIFECYCLE: `before` obtains token, runs cleanup, creates API-backed preconditions, and establishes session; context `before` performs workflow step setup or navigation; `after` runs cleanup

## Titles & Metadata

TITLE_FORMAT: `Flow.SubFlow: Given preconditions, created data`; `Flow.SubFlow.USER_ROLE: When condition`; `Flow.SubFlow.USER_ROLE: Then expected result`
TITLE_QUALITY: unique within `context`, flow-prefixed, Given/When/Then, no parentheses or square brackets, value meaning over literal value
REQ_METADATA: optional `{ req: { p, preconditions, refs, bugs, note } }`; omit empty fields, set `p` only for `'P1'` or `'P3'` since `'P2'` is the default and is omitted, keep tickets in `refs`, tracked bugs in `bugs`, behaviour reason in `note`
NEAREST_SCOPE: `req` sits on the smallest block it is true for — `it` for one outcome, `context` for one action and all its outcomes, `describe` for every block in the file; parent metadata is not repeated on children

## Data & Values

WORKFLOW_DATA: setup, execution, and verification values live in the E2E examples file
DATA_LIFECYCLE: workflow entities use names matching `SpecFileAbbr.EntityAbbr.ActionOrIntent.${randomSuffix}` and are cleaned by prefix before and after
EXAMPLE_IDS: source example owns placeholder `id`; spec assigns `examples.group.source.id = response.body.id` once; dependent examples expose `get id() { return examples.group.source.id; }`
CONSISTENCY: API setup values and UI verification values aligned — otherwise the assertion verifies a state the setup never produced
ASSERTED_VALUE_SOURCES: business data from named E2E examples; boundary values from constraints; UI text from global `l10n`; theme colours from global `colours`; inline literals only for Cypress chainer names, attribute names, or structural states

## Selectors, Commands & Readability

SELECTOR_ACCESS: global selector variables such as `commonUI` or workflow page objects, no literal CSS strings
SELECTOR_NAMING: camelCase purpose-driven names using `elementPurposeElementType`; static text as nouns and actions as verbs
COMMAND_SCOPE: `pageName__operation` or `componentName__operation` commands for reused multi-step workflow actions in business terminology; inline `.click()`, `.type()`, `.clear()`, and simple assertions for one-off actions
READABILITY_SHAPE: `examples.group.instance` referenced inline, one user-visible workflow outcome per `it`, `it` body targets five lines, `cy.then()` nesting no deeper than one level, comments only when they add behaviour meaning
REVERSE_BRAINSTORMING: risk checks list false confidence, hard-to-maintain code, or misleading-output risks; matches are treated as defects before writing the spec

# Validation

STRUCTURE_CHECK: describe/context/it with `{ testIsolation: false }`
WORKFLOW_SCOPE_CHECK: the spec spans multiple user steps or pages and reuses workflow state; single-page visible behaviour moves to `write-integration-ui-specs`
SEGMENTATION_CHECK: one workflow outcome per `it`
TITLE_CHECK: unique, flow-prefixed Given/When/Then
CLEANUP_CHECK: `before` + `after`, API-backed, name pattern
FLOW_CHECK: contexts follow business order of the user journey
ID_OWNERSHIP_CHECK: each runtime ID is assigned in exactly one `then` of the spec and to exactly one instance — a second `instance.id = response.body.id` for the same value means the dependent needs a getter
TRACEABILITY_CHECK: setup, execution, and asserted values resolve to named E2E examples, constraints, `l10n`, or `colours`; no orphan literals
REQ_METADATA_CHECK: optional fields omitted when empty; `refs` owns requirement links; `bugs` owns tracked bugs; `note` adds behaviour meaning not already stated in the title
SCOPE_CHECK: each `req` field sits on the smallest block it is true for and is not repeated on a child
COMMENT_CHECK: no inline priority, Jira, bug, or TODO comment survives where a `req` field should carry it
SELECTOR_CHECK: global selector variables, no literal CSS strings
L10N_CHECK: UI text via `l10n`, not literal strings
COLOUR_CHECK: theme-dependent colours via `colours`, not literal hex or RGB values
READABILITY_CHECK: direct example references, flat Cypress chains, meaningful comments only
