---
name: define-examples
description: Use when creating or updating example files that compose named API payloads, UI states, or E2E workflow data from constraints
---

# Definition

PURPOSE: organize named test data objects into example-based cases verified against specifications
SCOPE: `cypress/integration-examples/api/*.api.examples.js`, `cypress/integration-examples/ui/*.ui.examples.js`, `cypress/e2e-examples/ui/*.ui.examples.js`
STRUCTURE: root prefix, grouped by type or purpose instances, complete nested payloads with placeholders for dynamic fields, pre-calculated derived values, and imported boundary values
INTENT: single source of truth for test data, pre-composed for executable setup and assertions, maintained with clear ownership and inline coupling
COMMENTS: concise domain comments for shared aliases or non-obvious derived values
MAINTENANCE: direct imports, no cross-file hidden data coupling, same-instance ID ownership
API_LOCATION: `cypress/integration-examples/api/module-name.submodule-name.api.examples.js`
UI_LOCATION: `cypress/integration-examples/ui/page-name.component-name.ui.examples.js`
E2E_LOCATION: `cypress/e2e-examples/ui/workflow-name.ui.examples.js`
FILE_NAMES: kebab-case, spec mirror
EXPORT_NAME: `_examples` suffix
FORMAT: `{purpose}{QualifierSuffix?}` — single `lowerCamelCase` token
KEY_REGEX: `^[a-z][a-zA-Z0-9]*$`
CONTAINER_KEY: `lowerCamelCase` compose noun carrying entity by type or validity (`carts` `validItems`, `invalidItems`)
INSTANCE_KEY: `lowerCamelCase` noun phrase describing the single distinguishing intent of the instance, optionally ending in a PascalCase qualifier suffix
NAME_STYLE: semantic intent names (`withAllFields`, `firstnameAtMaxLength`, `missingFirstname`, `yesNoCompliant`), context-specific intent

# Data rules

CLEANUP_PREFIX: spec file specific root prefix `namePrefix`
DERIVED_VALUES: pre-calculated in examples
BOUNDARIES: imported constraints for boundary values
RANDOM_SOURCE: `utils`
DYNAMIC_FIELDS: type placeholders assigned, dynamically retrieved fields (IDs) accumulated back onto the related examples inline
INSTANCE_COMPLETENESS: all fields needed for executable setup and assertion
CONSTRAINT_TO_FIELD: field values use imported constraints where limits matter
SPEC_CALLS: pass `examples.instance` fields directly without rebuilding payloads in specs
EXPECTED_VALUES: precondition and assertion-ready values exposed through examples
