---
name: define-examples
description: Use when creating or updating example files that compose named test-data instances from constraints for specs and commands.
---

# Intent

Produce example files that compose every named test-data instance a spec needs, with the fields that distinguish each case visible inline.
When entries conflict or none applies, choose the option that keeps case data visible and traceable from constraint to spec.

# Reasoning Principles

OWN_COMPOSITION_IN_EXAMPLES — Own instance composition in example files and let specs reference instances without rebuilding them.
Setup and assertion data drift apart across specs that rebuild them. The cost is an example edit for every new case.

MIRROR_ONE_FILE_PER_SPEC — Mirror one example file per spec.
A shared file couples unrelated specs and hides which data each spec depends on.

DERIVE_VALUES_FROM_SOURCE — Derive values from structure and read dependencies at access time, never restating them.
Copied values go stale without warning when the source changes.

TRACE_BOUNDARIES_TO_CONSTRAINTS — Trace boundary values from constraints, through examples, into specs.
A value invented in the example breaks the constraint-to-spec chain, so a tightened rule goes untested.

SHOW_DISTINCT_FIELDS — Show the fields that make each case distinct, and factor out only structure that is identical across siblings.
Builders, defaults, and broad spreads hide the data that explains the requirement. The cost is some repetition between siblings.

LIMIT_GETTERS_TO_RUNTIME_VALUES — Limit getters to values not known until the setup response arrives.
Static data behind getters becomes lazy and hard to inspect.

PREPARE_EVERY_REQUEST — Prepare every request a spec sends as a named instance here, with its path params, query, headers, and body.
Otherwise the spec builds ad-hoc payloads that fork from constraints and cannot be audited from examples alone.

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

NAME_INSTANCE_BY_INTENT — Name each instance key as one `lowerCamelCase` token, `{purpose}{QualifierSuffix?}`, that states the test intent.
Examples are `withAllFields`, `firstnameAtMaxLength`, and `missingFirstname`. A reader then infers the tested aspect from the key alone.

REPLACE_GENERIC_KEYS — Replace generic keys such as `item1`, `data1`, `test1`, `standard`, or `default` with intent names.
They carry no test intent, so a failure report says nothing about the case.

NAME_CONTAINER_BY_TYPE — Name containers by entity plus instance type, validity, role, or lifecycle, and group sibling instances under them.
Examples are `validQuestions`, `invalidQuestions`, `sourceQuestions`, `dependentAnswers`, and `answerRequests`. Without grouping, valid, invalid, source, and dependent data mix.

MIRROR_FIELD_NAMES — Mirror the exact API or UI field names in property keys.
A rename step between example and spec is a place for silent mismatches.

NEST_RELATED_INSTANCES — Nest related instances under one key, as in `questions: { hygiene, structure }`, instead of parallel keys like `hygieneId` and `structureId`.
Nesting keeps related instances together, while parallel keys drift apart.

COMPOSE_INSTANCES_INLINE — Compose each named instance fully in the example file, with static, constrained, randomized, setup, and assertion fields visible inline.
Each instance holds every field its spec needs, including dynamic placeholders in nested instances. Otherwise the reader cannot see how the case data is built.

GROUP_REQUESTS_BY_OPERATION — Group each request the spec sends by operation, such as `createRequests`, as a named instance with its full command-argument object.
Otherwise request data scatters across spec contexts and forks from constraints.

USE_GETTERS_FOR_RUNTIME_IDS — Use getters only for identifiers or server values known after setup, such as `id`, `questionId`, `auditId`, or `userId`.
Static, constraint-derived, randomized, label, request-body, expected, and copied values stay plain fields evaluated once. A getter on them lets setup and assertion values drift between reads.

HOLD_PLACEHOLDER_IN_SOURCE — Hold the mutable placeholder, such as `id: undefined`, on the source instance, and let dependents read it through a getter.
The spec never reassigns dependent instances, so one assignment updates every reader.

PUT_GETTER_ON_FIELD — Put the getter on the one dynamic field, never on the enclosing case object.
A getter on the object rebuilds static fields on every read and hides which field is dynamic.

READ_WITHOUT_THIS — Read the dependency of a getter through a module-scope `const` or the exported object name, never through `this`.
Destructuring, spreading, or copying changes `this`, and the getter then returns `undefined`.

COMPUTE_AGGREGATES — Compute aggregates from structure, such as `Object.keys(...).length`, and never hardcode them.
The count then stays correct as fields change.

EXPOSE_CASE_DATA — Expose case-differentiating data at the named instance, never behind factories, builders, `base`, `default`, or broad object spreads.
Hidden differences make the requirement invisible to a reader of the example.

FACTOR_ONLY_SHARED_ENVELOPE — Factor only the request envelope shared by siblings into one helper, and pass each differing field as an argument at the call.
A factory may hide only fields identical across all siblings. Hiding more erases the difference that defines each case.

EXTRACT_SHARED_CONSTS_ONLY — Extract a const only when several siblings share the exact value and it hides no case-specific field.
Otherwise the const becomes a hidden default.

IMPORT_BOUNDARY_VALUES — Import boundary values from constraint files.
A boundary typed into the example is not updated when the constraint changes.

GENERATE_RANDOM_WITH_UTILS — Generate random names, dates, and numbers with `utils`.
A local generator produces collisions or formats that cleanup cannot match.

SET_ROOT_NAME_PREFIX — Set a spec-specific root `namePrefix` that spec cleanup uses.
Without it, cleanup cannot find the records this spec created.

PASS_INSTANCES_DIRECTLY — Pass `examples.instanceType.instanceName` from specs directly, without rebuilding it.
A rebuilt copy forks from the example and hides the data under test.

ASSIGN_IDS_TO_SOURCES_ONLY — Assign runtime IDs in specs only to source placeholders, never rebuilding dependents or copying IDs into them.
Copied IDs go stale when setup runs again.

# Validation

NAMING_CHECK — Verify every instance key matches `^[a-z][a-zA-Z0-9]*$` and the export name ends with `_examples`.
GROUPING_CHECK — Confirm instances are grouped by entity plus type, validity, role, or lifecycle before individual case names.
MIRROR_CHECK — Verify property keys match the API or UI field names exactly.
GETTER_CHECK — Confirm getters appear only for runtime identifiers, server-generated values, or an envelope factory `body` that reads them.
GETTER_SCOPE_CHECK — Verify each getter sits on one dynamic field and no getter body contains `this`.
HIDDEN_COMPOSITION_CHECK — Confirm no factory, builder, default, base object, or broad spread hides case-differentiating data.
REQUEST_CHECK — Verify every request the spec sends resolves to a named instance grouped by operation with the full command-argument object.
COMPACT_CHECK — Confirm sibling requests that share an envelope factor it once and expose only their differing fields.
DERIVE_CHECK — Verify every aggregate is computed from structure and none is hardcoded.
TRACE_CHECK — Confirm boundary values are imported from constraints and specs reference instances directly.
COMPLETENESS_CHECK — Verify every instance includes all fields needed for its spec context.
CLEANUP_CHECK — Confirm a root `namePrefix` is present and used by spec cleanup.
