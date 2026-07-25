---
name: define-examples
description: Use when creating or updating example files that compose named test-data from constraints
---

# Principles

SINGLE_OWNER: examples own instance composition, specs reference without reconstruction — otherwise setup and assertion data drift apart across the specs that rebuild it
SEGMENTATION: one example file per spec mirror — otherwise a shared file couples unrelated specs and hides which data a spec depends on
DERIVATION: compute values from structure and read dependencies at access time, never restate them — otherwise hardcoded copies silently rot when the source changes
TRACEABILITY: boundary values flow from constraints into examples into specs — otherwise a value invented in the example breaks the constraint-to-spec chain
VISIBILITY: examples fully show how each case is built — otherwise builders, defaults, and broad spreads hide the data that explains the requirement
RUNTIME_ONLY_GETTERS: getters exist only for values unavailable until setup response time — otherwise static example data becomes unnecessarily lazy and hard to inspect

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
CONTAINER_KEY: entity + instance type, validity, role, or lifecycle (`validQuestions`, `invalidQuestions`, `sourceQuestions`, `dependentAnswers`)
NAME_STYLE: semantic intent (`withAllFields`, `firstnameAtMaxLength`, `missingFirstname`) — a reader infers the test aspect from the key alone
FIELD_MIRROR: property keys mirror exact API/UI field names — no renaming step between example and spec
NO_SUFFIX_PARALLELS: nested keyed instances over flat parallel keys (`questions: { hygiene, structure }` not `hygieneId`, `structureId`) — nesting keeps related instances co-located
NO_GENERIC: never `item1`, `data1`, `test1`, `standard`, `default` — generic keys carry no test intent

## Composition

FULLY_CONSTRUCTED_INSTANCES: each named instance is fully composed in the example file with its static, constrained, randomized, setup, and assertion fields visible inline — otherwise the reader cannot see how that case's data is built
GROUP_BY_INSTANCE_TYPE: group sibling examples by entity plus instance type, validity, role, or lifecycle before the named case — otherwise unrelated valid, invalid, source, and dependent data become mixed
DYNAMIC_ID_GETTERS_ONLY: getters are allowed only for runtime-populated identifiers or server-generated values unavailable until setup response time, such as `id`, `questionId`, `auditId`, or `userId`
DYNAMIC_SOURCE_PLACEHOLDER: the source instance owns the mutable placeholder field (`id: undefined` or equivalent); dependent instances read it with a getter and are never reassigned by the spec
NO_STATIC_GETTERS: static values, constraint-derived values, randomized values, labels, request bodies, expected values, and known cross-field copies are plain fields — otherwise examples become lazy without runtime need
DERIVE_AGGREGATES: compute aggregates from structure (`Object.keys(...).length`), never hardcode — the count stays correct as fields change
COMPOSED_NESTING: each nested instance holds every field including dynamic placeholders
NO_HIDDEN_COMPOSITION: do not hide case data behind factories, builders, `base`, `default`, or broad object spreads — otherwise the important field differences are invisible at the named instance
SHARED_CONSTS_ONLY: extract a const only when the exact value is genuinely shared by multiple siblings and does not hide case-specific fields
BOUNDARIES: imported constraints for boundary values
RANDOM_SOURCE: `utils` for generated names, dates, numbers

## Data rules

CLEANUP_PREFIX: spec-specific root `namePrefix`
INSTANCE_COMPLETENESS: every instance holds all fields needed for setup and assertion
EXPLICIT_CASE_DATA: each case shows its concrete request, setup, and assertion values directly in the named instance — otherwise the spec cannot be audited from examples alone
SPEC_CALLS: pass `examples.instanceType.instanceName` directly without rebuilding
SPEC_DYNAMIC_ASSIGNMENT: specs assign runtime IDs only to source placeholders; specs never rebuild dependent instances or manually copy IDs into them

# Validation

NAMING_CHECK: keys match `^[a-z][a-zA-Z0-9]*$`, export uses `_examples` suffix
GROUPING_CHECK: instances are grouped by entity plus type, validity, role, or lifecycle before individual case names
MIRROR_CHECK: property keys mirror API/UI field names
GETTER_CHECK: getters appear only for runtime dynamic identifiers or server-generated values; static, constrained, randomized, expected, and display values are plain fields
HIDDEN_COMPOSITION_CHECK: no factories, builders, generic defaults, broad base objects, or broad spreads hide case-specific data
DERIVE_CHECK: aggregates compute from structure
TRACE_CHECK: boundaries import from constraints, specs reference directly
COMPLETENESS_CHECK: every instance includes all fields for its spec context
CLEANUP_CHECK: root `namePrefix` present and used by spec cleanup
