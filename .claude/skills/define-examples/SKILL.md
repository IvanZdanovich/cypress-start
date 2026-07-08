---
name: define-examples
description: Use when creating or updating example files that compose named test-data from constraints
---

# Principles

SINGLE_OWNER: examples own instance composition, specs reference without reconstruction — otherwise setup and assertion data drift apart across the specs that rebuild it
SEGMENTATION: one example file per spec mirror — otherwise a shared file couples unrelated specs and hides which data a spec depends on
DERIVATION: compute values from structure and read dependencies at access time, never restate them — otherwise hardcoded copies silently rot when the source changes
TRACEABILITY: boundary values flow from constraints into examples into specs — otherwise a value invented in the example breaks the constraint-to-spec chain

# Method

## Location

SCOPE: `cypress/integration-examples/{api,ui}/`, `cypress/e2e-examples/ui/`
API: `cypress/integration-examples/api/module-name.submodule-name.api.examples.js`
UI: `cypress/integration-examples/ui/page-name.component-name.ui.examples.js`
E2E: `cypress/e2e-examples/ui/workflow-name.ui.examples.js`
FILE_NAMES: kebab-case, spec mirror
EXPORT_NAME: `_examples` suffix

## Naming

INSTANCE_KEY: `{purpose}{QualifierSuffix?}` — single `lowerCamelCase` token (`^[a-z][a-zA-Z0-9]*$`)
CONTAINER_KEY: entity + type/validity (`validItems`, `invalidItems`)
NAME_STYLE: semantic intent (`withAllFields`, `firstnameAtMaxLength`, `missingFirstname`) — a reader infers the test aspect from the key alone
FIELD_MIRROR: property keys mirror exact API/UI field names — no renaming step between example and spec
NO_SUFFIX_PARALLELS: nested keyed instances over flat parallel keys (`questions: { hygiene, structure }` not `hygieneId`, `structureId`) — nesting keeps related instances co-located
NO_GENERIC: never `item1`, `data1`, `test1`, `standard`, `default` — generic keys carry no test intent

## Composition

DERIVED_GETTERS: dependent instances reference source IDs via ES getter — source holds placeholder, getter reads source property at access time, spec sets the placeholder once on source only, never re-assigns to dependents
DERIVE_AGGREGATES: compute aggregates from structure (`Object.keys(...).length`), never hardcode — the count stays correct as fields change
COMPOSED_NESTING: each nested instance holds every field including dynamic placeholders
NO_WRAPPER_CONSTS: compose inline, extract a const only when genuinely shared by multiple siblings
BOUNDARIES: imported constraints for boundary values
RANDOM_SOURCE: `utils` for generated names, dates, numbers

## Data rules

CLEANUP_PREFIX: spec-specific root `namePrefix`
INSTANCE_COMPLETENESS: every instance holds all fields needed for setup and assertion
SPEC_CALLS: pass `examples.instance` directly without rebuilding

# Validation

NAMING_CHECK: keys match `^[a-z][a-zA-Z0-9]*$`, export uses `_examples` suffix
MIRROR_CHECK: property keys mirror API/UI field names
DERIVE_CHECK: aggregates compute from structure
TRACE_CHECK: boundaries import from constraints, specs reference directly
COMPLETENESS_CHECK: every instance includes all fields for its spec context
CLEANUP_CHECK: root `namePrefix` present and used by spec cleanup
