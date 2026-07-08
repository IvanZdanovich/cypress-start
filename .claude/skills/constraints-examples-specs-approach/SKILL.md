---
name: constraints-examples-specs-approach
description: Use when designing or reviewing specifications to follow constraints-examples-specs traceability model
---

# Principles

SINGLE_OWNER: every data value has exactly one authoritative source that consumers import — otherwise a second copy drifts and no reader knows which is canonical
LAYER_SEPARATION: constraints own boundaries, examples own composition, specs own assertions — otherwise a boundary change ripples into files that should not care
CHAIN_INTEGRITY: every value traces constraint → example → spec unbroken — otherwise a mid-chain literal is an orphan that no requirement backs and no boundary governs
OUTCOME_TITLES: a spec title states the business requirement, not the mechanics — otherwise the requirement of record is vague and the assertion is untraceable

# Method

## Layers

CONSTRAINTS: boundary values, defaults, system constants in `cypress/constants/`
EXAMPLES: executable named instances composed from constraints in `cypress/integration-examples/`, `cypress/e2e-examples/`
SPECS: requirement titles plus assertions in `cypress/integration/`, `cypress/e2e/`

## Traceability chain

DIRECTION: constraint value → example field → spec title → assertion
BOUNDARY_TO_EXAMPLE: examples import constraint constants and compose fields from them
EXAMPLE_TO_SPEC: specs import examples and reference instances directly
SPEC_TO_ASSERTION: `it` title names the business outcome; assertion verifies an example value or a constraint boundary

## Decomposition

REQUIREMENT_TO_LAYERS: one business requirement → constraint boundary + example instance + spec assertion
BOUNDARY_SPLIT: one constraint file per domain concept
INSTANCE_SPLIT: one example key per distinct tested state
SPEC_SPLIT: one `it` per verified outcome; related property checks on the same element allowed
MULTI_MODULE: each module keeps its own constraints and examples; a spec imports from all — colocating another module's data would give it two owners

## Conflict resolution

API_UI_DIVERGENCE: examples mirror the API field name; specs use `l10n` for UI text — the API name is the data's identity, the UI string is presentation
CONSTRAINT_OVERLAP: a boundary enforced across multiple modules or pages → a domain-tier file (`domain-name.api.constraints.js` or `domain-name.ui.constraints.js`) named after the domain concept, never after a consumer, so no consumer owns shared truth
EXAMPLE_COUPLING: a spec creates its own instance via an API command; never import another spec's examples — cross-spec imports couple unrelated files and break isolation
BROKEN_CHAIN_SIGNAL: a literal in a spec that could trace to a constraint → extract it to its owning layer

## Authoring handoff

CONSTRAINTS_SKILL: `define-constraints` for boundary authoring
EXAMPLES_SKILL: `define-examples` for instance composition
SPEC_SKILLS: `write-integration-api-specs`, `write-integration-ui-specs`, `write-e2e-ui-specs`

# Validation

TRACE_CHECK: constraint → example field → spec title → assertion resolves end to end
PLACEMENT_CHECK: no boundary literal in examples, no payload reconstruction in specs
SINGLE_OWNER_CHECK: no duplicated definitions across layers
CHAIN_COMPLETENESS: every constraint consumed by an example, every example consumed by a spec
