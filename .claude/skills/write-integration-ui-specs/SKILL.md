---
name: write-integration-ui-specs
description: Use when writing, updating, or reviewing integration UI specs for one page or component's visible behaviour, validation, text, or state.
---

# Reasoning Principles

PAGE_SCOPE: a spec verifies one page or component visible behaviour after an action — otherwise integration UI coverage drifts into end-to-end workflow testing
TRACEABILITY: every asserted value traces to a named example, constraint, `l10n` key, or `colours` key — otherwise inline literals break the constraints→examples→specs chain and drift silently
API_SETUP: preconditions created through API commands, UI used only for the behaviour under test — otherwise slow UI setup fails for reasons unrelated to the visible outcome
SEGMENTATION: one visible UI outcome per `it` — otherwise a block asserting several outcomes cannot name which one regressed
DETERMINISM: one reusable instance lifecycle with prefix cleanup before and after — otherwise leftovers from crashed or prior runs hide real failures
ID_OWNERSHIP: runtime IDs assigned once to the source example and shared through getters — otherwise copied IDs desync dependent examples from the created entity
READABILITY: direct example references and flat Cypress chains over local aliases and nested callbacks — otherwise the asserted source and command order become harder to audit
METADATA_NOT_COMMENTS: requirement facts live in `req` fields the lint rule and reporter can read — otherwise inline `// P1`, `// TODO`, or Jira comments are invisible to tooling and drift from the block they describe
TITLE_OWNS_REQUIREMENT: the Given/When/Then title states the requirement; `req` only classifies, links, and scopes it — otherwise a verbose `note` duplicates the title and the two versions disagree
PERMISSION_TRUTH: role-based visibility, enabled state, and page access are validated through `validate-permissions-ui` before writing — otherwise a wrong UI permission expectation ships as a green spec
INVERSION: false confidence, hard-to-maintain code, and misleading-title risks are named before writing assertions — otherwise a green spec can verify less than its title states

# Output Shape

## Paths

SCOPE_PATH: `cypress/integration/ui/**/*.ui.spec.js`
SPEC_PATH: `cypress/integration/ui/<page-name>[.<component-or-scenario>].ui.spec.js`, dot segments only when they clarify the covered component or scenario
EXAMPLES_PATH: `cypress/integration-examples/ui/<page-name>[.<component-or-scenario>].ui.examples.js`, mirrored to the spec scope when examples are spec-specific
SELECTORS_PATH: `cypress/selectors/selectors.js`
COMMAND_PATHS: `cypress/commands/ui/` for reusable interactions; `cypress/commands/api/` for setup and cleanup
CONSTRAINT_IMPORTS: constraints imported directly from `cypress/constants/{api,ui}/`

## Structure & Lifecycle

HIERARCHY: single `describe` → sequential `context` blocks → `it` blocks
TEST_ISOLATION: `{ testIsolation: false }` on `describe` so token, session, and created data persist across contexts
SETUP_LIFECYCLE: `before` obtains token, runs cleanup, creates API-backed data, and establishes session; context `before` navigates or prepares shared UI state; `after` runs cleanup

## Titles & Metadata

TITLE_FORMAT: `Page.Component: Given preconditions, created data`; `Page.Component.USER_ROLE: When condition`; `Page.Component.USER_ROLE: Then expected result`
TITLE_QUALITY: unique within `context`, page/component-prefixed, Given/When/Then, no parentheses or square brackets, value meaning over literal value
REQ_METADATA: optional `{ req: { p, preconditions, refs, bugs, note } }`; omit empty fields, set `p` only for `'P1'` or `'P3'` since `'P2'` is the default and is omitted, keep tickets in `refs`, tracked bugs in `bugs`, behaviour reason in `note`
NEAREST_SCOPE: `req` sits on the smallest block it is true for — `it` for one outcome, `context` for one action and all its outcomes, `describe` for every block in the file; parent metadata is not repeated on children

## Data & Values

DATA_LIFECYCLE: create, update, and delete one named instance across the file lifecycle with names matching `SpecFileAbbr.EntityAbbr.ActionOrIntent.${randomSuffix}`
EXAMPLE_IDS: source example owns placeholder `id`; spec assigns `examples.group.source.id = response.body.id` once; dependent examples expose `get id() { return examples.group.source.id; }`
ASSERTED_VALUE_SOURCES: boundary values from constraints; displayed data from named examples; UI text from global `l10n`; theme colours from global `colours`; inline literals only for Cypress chainer names, attribute names, or structural states

## Selectors, Commands & Readability

SELECTOR_ACCESS: global selector variables such as `commonUI` or page objects, no literal CSS strings
SELECTOR_NAMING: camelCase purpose-driven names using `elementPurposeElementType`; static text as nouns and actions as verbs
COMMAND_SCOPE: `pageName__operation` or `componentName__operation` commands for reused multi-step UI interactions; inline `.click()`, `.type()`, `.clear()`, and simple assertions for one-off actions
READABILITY_SHAPE: `examples.group.instance` referenced inline, assertions scoped within parent element when practical, `it` body targets five lines, `cy.then()` nesting no deeper than one level, comments only when they add behaviour meaning

# Validation

STRUCTURE_CHECK: describe/context/it with `{ testIsolation: false }`
PAGE_SCOPE_CHECK: the spec drives one page or component only; multi-page stateful journeys move to `write-e2e-ui-specs`
SEGMENTATION_CHECK: one visible outcome per `it`
TITLE_CHECK: unique, page/component-prefixed Given/When/Then
CLEANUP_CHECK: `before` + `after`, API-backed, name pattern
SELECTOR_CHECK: global variables, no literal CSS strings
L10N_CHECK: UI text via `l10n`, not literal strings
COLOUR_CHECK: theme-dependent colours via `colours`, not literal hex or RGB values
ID_OWNERSHIP_CHECK: each runtime ID is assigned in exactly one `then` of the spec and to exactly one instance — a second `instance.id = response.body.id` for the same value means the dependent needs a getter
TRACEABILITY_CHECK: every asserted value resolves to one of — constraint import, named example field, `l10n` key, `colours` key; no orphan literals
REQ_METADATA_CHECK: optional fields omitted when empty; `refs` owns requirement links; `bugs` owns tracked bugs; `note` adds behaviour meaning not already stated in the title
SCOPE_CHECK: each `req` field sits on the smallest block it is true for and is not repeated on a child
COMMENT_CHECK: no inline priority, Jira, bug, or TODO comment survives where a `req` field should carry it
READABILITY_CHECK: direct example references, flat Cypress chains, meaningful comments only
