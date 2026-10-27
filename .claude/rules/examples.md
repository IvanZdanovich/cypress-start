---
paths:
  - 'cypress/integration-examples/**/*.js'
  - 'cypress/e2e-examples/**/*.js'
---

# Output Shape

PLACE_BY_LAYER — Place each example file in the layer folder that mirrors its spec, using the kebab-case patterns below.
Consumers find examples by spec path, so a file placed elsewhere gets duplicated.

```
API  cypress/integration-examples/api/<kebab-domain>[.<kebab-scenario>].api.examples.js
UI   cypress/integration-examples/ui/<page-name>[.<component-or-scenario>].ui.examples.js
E2E  cypress/e2e-examples/ui/<workflow-name>.ui.examples.js
```

SUFFIX_EXPORT_WITH_EXAMPLES — Suffix the export name with `_examples`.
The suffix separates example data from constraints and helpers at the import site.

SET_ROOT_NAME_PREFIX — Set a spec-specific root `namePrefix` that spec cleanup uses.
Without it, cleanup cannot find the records this spec created.

NAME_CONTAINER_BY_TYPE — Name containers by entity plus instance type, validity, role, or lifecycle, and nest related sibling instances under them.
Examples are `validQuestions`, `invalidQuestions`, `sourceQuestions`, `dependentAnswers`, and `answerRequests`, as in `questions: { hygiene, structure }` rather than `hygieneId` and `structureId`. Without grouping, valid, invalid, source, and dependent data mix and drift apart.

NAME_INSTANCE_BY_INTENT — Name each instance key as one `lowerCamelCase` token, `{purpose}{QualifierSuffix?}`, that states the test intent.
Examples are `withAllFields`, `firstnameAtMaxLength`, and `missingFirstname`. Generic keys such as `item1`, `data1`, `standard`, or `default` say nothing about the case when it fails.

MIRROR_FIELD_NAMES — Mirror the exact API or UI field names in property keys.
A rename step between example and spec is a place for silent mismatches.

COMPOSE_INSTANCES_INLINE — Compose each named instance fully in the example file, with static, constrained, randomized, setup, and assertion fields visible inline.
Each instance holds every field its spec needs, including dynamic placeholders in nested instances. Otherwise the reader cannot see how the case data is built. The cost is some repetition between siblings.

GROUP_REQUESTS_BY_OPERATION — Group each request the spec sends by operation, such as `createRequests`, as a named instance with its full command-argument object.
The instance carries path params, query, headers, and body. Otherwise request data scatters across spec contexts and forks from constraints.

EXPOSE_CASE_DATA — Expose case-differentiating data at the named instance, never behind factories, builders, `base`, `default`, or broad object spreads.
Extract a module-scope const only when several siblings share the exact value. Hidden differences make the requirement invisible to a reader of the example.

FACTOR_ONLY_SHARED_ENVELOPE — Factor only the request envelope shared by siblings into one helper, and pass each differing field as an argument at the call.
A factory may hide only fields identical across all siblings. Hiding more erases the difference that defines each case.

USE_GETTERS_FOR_RUNTIME_IDS — Use a getter only on the one field that holds an identifier or server value known after setup, such as `id`, `questionId`, or `userId`.
Static, constraint-derived, randomized, label, request-body, and expected values stay plain fields evaluated once. A getter on them, or on the enclosing case object, lets setup and assertion values drift between reads.

HOLD_PLACEHOLDER_IN_SOURCE — Hold the mutable placeholder, such as `id: undefined`, on the source instance, and let dependents read it through a getter.
The spec never reassigns dependent instances, so one assignment updates every reader.

READ_WITHOUT_THIS — Read the dependency of a getter through a module-scope `const` or the exported object name, never through `this`.
Destructuring, spreading, or copying changes `this`, and the getter then returns `undefined`.

DERIVE_VALUES_FROM_SOURCE — Derive aggregates and one-off invalid values from their source, such as `Object.keys(...).length` or `-PRICE.MAX`, and never hardcode them.
A hardcoded copy goes stale when the structure or boundary changes. A constraint per invalid value would bloat the constraint file with values no rule owns.

GENERATE_RANDOM_WITH_UTILS — Generate random names, dates, and numbers with `utils`.
A local generator produces collisions or formats that cleanup cannot match.

# Validation

NAMING_CHECK — Verify every instance key matches `^[a-z][a-zA-Z0-9]*$` and the export name ends with `_examples`.
GROUPING_CHECK — Confirm instances are grouped by entity plus type, validity, role, or lifecycle before individual case names.
MIRROR_CHECK — Verify property keys match the API or UI field names exactly.
GETTER_CHECK — Confirm getters appear only for runtime identifiers, server-generated values, or an envelope factory `body` that reads them.
GETTER_SCOPE_CHECK — Verify each getter sits on one dynamic field and no getter body contains `this`.
HIDDEN_COMPOSITION_CHECK — Confirm no factory, builder, default, base object, or broad spread hides case-differentiating data.
REQUEST_CHECK — Verify every request the spec sends resolves to a named instance grouped by operation with the full command-argument object.
COMPACT_CHECK — Confirm sibling requests that share an envelope factor it once and expose only their differing fields.
DERIVE_CHECK — Verify every aggregate and one-off invalid value is derived from its source and none is hardcoded.
COMPLETENESS_CHECK — Verify every instance includes all fields needed for its spec context.
CLEANUP_CHECK — Confirm a root `namePrefix` is present and used by spec cleanup.
