---
name: constraints-examples-specs-approach
description: Use when designing or reviewing executable requirements (specifications) to follow the project constraints to examples to specs traceability model
---

# Principles

PURPOSE: cross-file traceability orchestration for constraints → examples → specs chain
SCOPE: `cypress/constants/`, `cypress/integration-examples/`, `cypress/e2e-examples/`, `cypress/integration/`, `cypress/e2e/`
CORE_IDEA: spec titles are requirements, examples are executable data, constraints are boundary sources
SINGLE_OWNER: every data value has exactly one authoritative source; consumers import, never duplicate
LAYER_SEPARATION: constraints own boundaries, examples own composition, specs own assertions

# Traceability chain

DIRECTION: constraint value → example field → spec title → assertion
BOUNDARY_TO_EXAMPLE: examples import constraint constants and compose fields from them
EXAMPLE_TO_SPEC: specs import examples and reference instances directly
SPEC_TO_ASSERTION: `it` title names the business outcome; assertion verifies example value or constraint boundary
BROKEN_CHAIN_SIGNAL: literal in spec that could trace to a constraint → extract

# Ownership

CONSTRAINTS_SKILL: `define-constraints` — boundary value authoring
EXAMPLES_SKILL: `define-examples` — instance composition authoring
SPEC_SKILLS: `write-integration-api-specs`, `write-integration-ui-specs`, `write-e2e-ui-specs`
GLOBALS: `utils`, `l10n`, `colours`, `apiUrls`, `uiUrls`, `userRoles`, `companies`, `reqs`, `apiErrors`, selectors

# Decomposition

REQUIREMENT_TO_LAYERS: one business requirement → constraint (boundary) + example (instance) + spec (assertion)
BOUNDARY_SPLIT: separate constraints per domain concept
INSTANCE_SPLIT: one example key per distinct tested state
SPEC_SPLIT: one `it` per verified outcome; related property checks on same element allowed
MULTI_MODULE: each module's constraints and examples remain in own files; spec imports from all

# Conflict resolution

API_UI_DIVERGENCE: examples mirror API field name; specs use `l10n` for UI text
CONSTRAINT_OVERLAP: boundary independently enforced on multiple modules or pages → domain-tier file (`domain-name.api.constraints.js` or `domain-name.ui.constraints.js`) named after the domain concept, not after any consumer
EXAMPLE_COUPLING: spec creates own instance via API command — never import another spec's examples

# Validation

TRACE_CHECK: constraint → example field → spec title → assertion
PLACEMENT_CHECK: no boundary literal in examples, no payload reconstruction in specs
SINGLE_OWNER_CHECK: no duplicated definitions across layers
CHAIN_COMPLETENESS: every constraint consumed by example; every example consumed by spec
