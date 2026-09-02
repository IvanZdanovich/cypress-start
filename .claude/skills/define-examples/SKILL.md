---
name: define-examples
description: Use when creating or updating example files that compose named test-data instances from constraints for specs and commands.
---

# Reasoning Principles

SINGLE_OWNER: examples own instance composition, specs reference without reconstruction — otherwise setup and assertion data drift apart across the specs that rebuild it
SEGMENTATION: one example file per spec mirror — otherwise a shared file couples unrelated specs and hides which data a spec depends on
DERIVATION: compute values from structure and read dependencies at access time, never restate them — otherwise copied values silently rot when the source changes
TRACEABILITY: boundary values flow from constraints into examples into specs — otherwise a value invented in the example breaks the constraint-to-spec chain
VISIBILITY: each case shows the fields that make it distinct; only structure identical across siblings may be factored — otherwise builders, defaults, and broad spreads hide the data that explains the requirement
RUNTIME_ONLY_GETTERS: getters exist only for values not known until setup response time — otherwise static example data becomes needlessly lazy and hard to inspect
PREPARED_REQUESTS: every request a spec sends is a named instance composed here in advance — path params, query, headers, body — otherwise the spec assembles ad-hoc payloads that fork from constraints and cannot be audited from examples alone

# Output Shape

## Location & Naming

SCOPE: `cypress/integration-examples/{api,ui}/`, `cypress/e2e-examples/ui/`
API: `cypress/integration-examples/api/<kebab-domain>[.<kebab-scenario>].api.examples.js`
UI: `cypress/integration-examples/ui/<page-name>[.<component-or-scenario>].ui.examples.js`
E2E: `cypress/e2e-examples/ui/<workflow-name>.ui.examples.js`
FILE_NAMES: kebab-case, spec mirror
EXPORT_NAME: `_examples` suffix
INSTANCE_KEY: `{purpose}{QualifierSuffix?}` — single `lowerCamelCase` token (`^[a-z][a-zA-Z0-9]*$`)
CONTAINER_KEY: entity + instance type, validity, role, or lifecycle (`validQuestions`, `invalidQuestions`, `sourceQuestions`, `dependentAnswers`, `answerRequests`)
NAME_STYLE: test intent (`withAllFields`, `firstnameAtMaxLength`, `missingFirstname`) — a reader infers the tested aspect from the key alone
FIELD_MIRROR: property keys mirror exact API/UI field names — no renaming step between example and spec
NO_SUFFIX_PARALLELS: nested keyed instances over flat parallel keys (`questions: { hygiene, structure }` not `hygieneId`, `structureId`) — nesting keeps related instances co-located
NO_GENERIC: never `item1`, `data1`, `test1`, `standard`, `default` — generic keys carry no test intent

## Instance Composition

FULLY_CONSTRUCTED_INSTANCES: each named instance is fully composed in the example file with its static, constrained, randomized, setup, and assertion fields visible inline — otherwise the reader cannot see how that case's data is built
REQUEST_INSTANCES: compose each request the spec sends as a named instance holding its full command-argument object, grouped by operation (`answerRequests`, `createRequests`) — otherwise request data scatters across spec contexts and forks from constraints
GROUP_BY_INSTANCE_TYPE: group sibling examples by entity plus instance type, validity, role, or lifecycle before the named case — otherwise unrelated valid, invalid, source, and dependent data become mixed

## Getters

DYNAMIC_ID_GETTERS_ONLY: getters are allowed only for runtime-populated identifiers or server-generated values not known until setup response time, such as `id`, `questionId`, `auditId`, or `userId`
DYNAMIC_SOURCE_PLACEHOLDER: the source instance owns the mutable placeholder field (`id: undefined` or equivalent); dependent instances read it with a getter and are never reassigned by the spec
NO_STATIC_GETTERS: static, constraint-derived, randomized, label, request-body, expected, and copied values are plain fields evaluated once — otherwise setup and assertion values drift between reads
GETTER_SCOPE: put the getter on the one dynamic field itself, never on the enclosing case object — otherwise each read rebuilds static fields and hides which field is dynamic
NO_THIS_BINDING: a getter reads its dependency through a module-scope `const` or the exported object name, never `this` — otherwise destructuring, spreading, or copying can make the getter return `undefined`

## Derivation & Factoring

DERIVE_AGGREGATES: compute aggregates from structure (`Object.keys(...).length`), never hardcode — the count stays correct as fields change
COMPOSED_NESTING: each nested instance holds every field including dynamic placeholders
NO_HIDDEN_COMPOSITION: never hide case-differentiating data behind factories, builders, `base`, `default`, or broad object spreads — otherwise the field differences that explain the requirement become invisible at the named instance
ENVELOPE_FACTORY: factor only the request envelope shared by sibling instances into one helper; pass each differing field as an argument at the call site — otherwise repeated envelope code hides the fields that define the case
CASE_FIELD_INLINE: keep every field that differs between sibling requests literally visible at the call; a factory may hide only fields identical across all siblings — otherwise factoring erases the difference that defines each case
SHARED_CONSTS_ONLY: extract a const only when the exact value is genuinely shared by multiple siblings and does not hide case-specific fields
BOUNDARIES: imported constraints for boundary values
RANDOM_SOURCE: `utils` for generated names, dates, numbers
CLEANUP_PREFIX: spec-specific root `namePrefix`

## Spec Consumption

INSTANCE_COMPLETENESS: every instance holds all fields needed for setup and assertion
EXPLICIT_CASE_DATA: each case shows its concrete request, setup, and assertion values directly in the named instance — otherwise the spec cannot be audited from examples alone
SPEC_CALLS: pass `examples.instanceType.instanceName` directly without rebuilding
SPEC_DYNAMIC_ASSIGNMENT: specs assign runtime IDs only to source placeholders; specs never rebuild dependent instances or manually copy IDs into them

# Validation

NAMING_CHECK: keys match `^[a-z][a-zA-Z0-9]*$`, export uses `_examples` suffix
GROUPING_CHECK: instances are grouped by entity plus type, validity, role, or lifecycle before individual case names
MIRROR_CHECK: property keys mirror API/UI field names
GETTER_CHECK: getters appear only for runtime dynamic identifiers, server-generated values, or an envelope factory's `body` that reads them; static, constrained, randomized, expected, and display values are plain fields
GETTER_SCOPE_CHECK: each getter sits on the single dynamic field, never wrapping a whole case object; no getter body contains `this` — the dependency is read via a module-scope `const` or the file's own exported object name
HIDDEN_COMPOSITION_CHECK: no factory, builder, generic default, broad base object, or broad spread hides case-differentiating data; a factory fills only the envelope shared identically by siblings
REQUEST_CHECK: every request the spec sends resolves to a named example instance grouped by operation and carrying the full command-argument object
COMPACT_CHECK: sibling requests sharing an envelope factor it once and expose only their differing fields per instance
DERIVE_CHECK: aggregates compute from structure
TRACE_CHECK: boundaries import from constraints, specs reference directly
COMPLETENESS_CHECK: every instance includes all fields for its spec context
CLEANUP_CHECK: root `namePrefix` present and used by spec cleanup
