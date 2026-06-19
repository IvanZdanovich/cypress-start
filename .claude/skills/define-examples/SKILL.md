---
name: define-examples
description: Use when creating or updating example files that compose named API payloads, UI states, or E2E workflow data from constraints
---

# Principles

PURPOSE: single source of truth for test data, pre-composed for setup and assertions
SCOPE: `cypress/integration-examples/{api,ui}/`, `cypress/e2e-examples/ui/`
SEGMENTATION: one example key per spec context, one file per spec mirror
SINGLE_OWNER: examples own instance composition; specs reference without reconstruction

# Location

API: `cypress/integration-examples/api/module-name.submodule-name.api.examples.js`
UI: `cypress/integration-examples/ui/page-name.component-name.ui.examples.js`
E2E: `cypress/e2e-examples/ui/workflow-name.ui.examples.js`
FILE_NAMES: kebab-case, spec mirror
EXPORT_NAME: `_examples` suffix

# Naming

INSTANCE_KEY: `{purpose}{QualifierSuffix?}` — single `lowerCamelCase` token (`^[a-z][a-zA-Z0-9]*$`)
CONTAINER_KEY: entity + type/validity (`validItems`, `invalidItems`)
NAME_STYLE: semantic intent (`withAllFields`, `firstnameAtMaxLength`, `missingFirstname`)
FIELD_MIRROR: property keys mirror exact API/UI field names
NO_SUFFIX_PARALLELS: nested keyed instances, not flat parallel keys (`questions: { hygiene, structure }` not `hygieneId`, `structureId`)
NO_GENERIC: never `item1`, `data1`, `test1`, `standard`, `default`

# Composition

DERIVED_GETTERS: ES getter syntax for all derived values — inter-instance ID references and computed aggregates
DERIVE_AGGREGATES: compute from structure (`Object.keys(...).length`), never hardcode
COMPOSED_NESTING: each nested instance holds every field including dynamic placeholders
NO_WRAPPER_CONSTS: compose inline, extract const only when genuinely shared by multiple siblings
BOUNDARIES: imported constraints for boundary values
RANDOM_SOURCE: `utils` for generated names, dates, numbers

# Data rules

CLEANUP_PREFIX: spec-specific root `namePrefix`
ID_FIELDS: `String` placeholder on source instance; dependent instances reference source IDs via ES getter
INSTANCE_COMPLETENESS: all fields needed for setup and assertion
SPEC_CALLS: pass `examples.instance` directly without rebuilding
NO_REASSIGNMENT: no renaming fields between examples and specs

# Validation

NAMING_CHECK: keys match `^[a-z][a-zA-Z0-9]*$`, export uses `_examples` suffix
MIRROR_CHECK: property keys mirror API/UI field names
DERIVE_CHECK: aggregates compute from structure
TRACE_CHECK: boundaries import from constraints, specs reference directly
COMPLETENESS_CHECK: every instance includes all fields for its spec context
CLEANUP_CHECK: root `namePrefix` present and used by spec cleanup
