---
paths:
  - 'cypress/integration/api/*.spec.js'
  - 'cypress/integration/api/*.spec.skip.js'
---

# Reasoning Principles

LIMIT_SPEC_TO_API_CONTRACT — Limit an API spec to the request and response contract, status, payload, headers, error cases, or CRUD lifecycle of an endpoint.
UI behaviour belongs in UI specs. Mixing layers hides which contract a failure breaks.

ASSERT_ASSUMED_OUTCOME — Assert the assumed outcome of a named example or business rule.
Otherwise a failing assertion points at brittle test data rather than a real contradiction.

# Output Shape

PLACE_SPEC_BY_DOMAIN — Place each spec at `cypress/integration/api/<kebab-domain>[.<kebab-scenario>].api.spec.js`, with one or more dot-separated segments.
Spec-specific examples mirror the spec name. The related paths are listed below.

```
examples     cypress/integration-examples/api/<kebab-domain>[.<kebab-scenario>].api.examples.js
constraints  cypress/constants/api/<module-name>.api.constraints.js
commands     cypress/commands/api/<module-or-aspect>.api.commands.js
urls         cypress/urls/api-urls.js
registry     eslint-plugin-custom-rules/app-structure/modules.json
```

NEST_CONTEXTS_IN_DESCRIBE — Nest one `describe`, then sequential `context` blocks, then `it` blocks.
This shape lets the report read as the states or lifecycle steps of the endpoint under test.

DISABLE_TEST_ISOLATION — Disable isolation with `{ testIsolation: false }` on `describe` so the token and created data persist across contexts.
Default isolation clears them and forces repeated setup.

SET_UP_IN_BEFORE_HOOKS — Set up in the `describe` `before` hook by getting a token, running cleanup, and creating API data.
Each context `before` does the setup for its context, and `after` runs cleanup. Setup inside `it` blocks hides preconditions among outcomes.

FORMAT_TITLES_AS_GIVEN_WHEN_THEN — Format titles in the three Given, When, and Then forms below.
A fixed form lets a reader find the precondition, request, and outcome without reading the code.

```
Module.Submodule: Given preconditions, created data
Module.Submodule.Operation.METHOD: When condition
Module.Submodule.Operation.METHOD: Then expected result
```

KEEP_TITLES_UNIQUE — Keep titles unique within a `context` and prefixed with their scope, with no parentheses or square brackets, stating value meaning over literal values.
Duplicate or literal titles make the report ambiguous.

STATE_REQUIREMENT_IN_TITLE — State the requirement in the Given/When/Then title, and use `req` only to classify, link, and scope it.
A long `note` duplicates the title, and the two versions then disagree.

RECORD_FACTS_IN_REQ — Record requirement facts in `req` fields that the lint rule and reporter can read, not in comments.
Inline `// P1`, `// TODO`, or Jira comments are invisible to tooling and drift from the block they describe.

OMIT_EMPTY_REQ_FIELDS — Omit empty fields in the optional `{ req: { p, preconditions, refs, bugs, note } }` metadata.
Set `p` only for `'P1'` or `'P3'`, because `'P2'` is the default. Keep tickets in `refs`, tracked bugs in `bugs`, and the behaviour reason in `note`.

PLACE_REQ_ON_NEAREST_BLOCK — Place `req` on the smallest block it is true for, and leave parent metadata off its children.
Use `it` for one outcome, `context` for one request and all its outcomes, and `describe` for every block in the file.

ORDER_CONTEXTS_BY_DEPENDENCY — Order contexts by dependency, with explicit state for each context.
A hidden dependency makes the spec fail when one context is skipped or moved.

NAME_ENTITIES_BY_PATTERN — Name created entities `SpecFileAbbr.EntityAbbr.ActionOrIntent.${randomSuffix}`.
The shared prefix lets cleanup find every record the spec made.

CLEAN_UP_BY_PREFIX — Clean up by name prefix through the API before and after the spec, with data independent of other files.
Leftovers from crashed or earlier runs can make later specs pass falsely or fail at random.

MOVE_INSTANCE_THROUGH_LIFECYCLE — Move one named instance through create, retrieve, update, partial update, and delete when the endpoint lifecycle requires it.
Separate instances per step multiply calls and stop the spec from proving the lifecycle.

ASSIGN_SOURCE_ID_ONCE — Assign `examples.group.source.id = response.body.id` once, and expose `get id() { return examples.group.source.id; }` on dependents.
The source example owns the placeholder `id`, so one assignment updates every reader. Copied IDs fall out of step with the entity that was created.

PASS_REQUEST_INSTANCE_UNCHANGED — Pass the pre-composed example request instance to the command unchanged.
Request data built in the spec forks from the constraint-backed data. Examples are a `const body = {...}`, a spread, or an inline object of IDs.

REFERENCE_EXAMPLES_DIRECTLY — Reference `examples.group.instance` directly and keep Cypress chains flat, instead of using local aliases and nested callbacks.
Aliases and nesting make the asserted source and command order harder to audit.

SOURCE_ASSERTED_VALUES — Source boundaries from constraints and expected response data from named examples.
Inline literals are allowed only for Cypress chainer names, property or header names, or structural states. An inline value drifts from its source and hides which rule it verifies.

ASSERT_STATUS_FIRST — Assert `response.status` as the first expectation of every response the spec verifies.
Without it, a 4xx or 5xx body with similar fields can pass the field checks, or fail with a message that hides the real cause. The cost is one line per block.

COMPARE_TO_EXPECTED_OBJECT — Compare a response part with many expected fields to one expected object from the example, using `deep.include` or `deep.equal`.
Long runs of one `expect` per field hide the case under repetition, and the first failure stops the block before the others show. The cost is an expected object kept beside the request in the examples file.

FIND_LIST_ITEMS_BY_KEY — Find an item in a response list by its ID or name with `.find()`, unless the order is the asserted behaviour.
An index such as `body[2].answerOptions[0]` breaks or reads the wrong item when the server changes its sort order. The cost is a longer lookup expression.

KEEP_IT_BODIES_SHORT — Keep each `it` body near five lines, with one verified outcome and at most one level of `cy.then()` nesting.
Add comments only when they add behaviour meaning. A long body hides which outcome failed.

# Validation

STRUCTURE_CHECK — Verify the spec nests `describe`, `context`, and `it`, with `{ testIsolation: false }` on `describe`.
SEGMENTATION_CHECK — Verify each `it` asserts exactly one outcome.
TITLE_CHECK — Verify every title is unique, constraint-backed, and in Given/When/Then form.
CLEANUP_CHECK — Confirm `before` and `after` both run API cleanup by the name pattern and the spec passes when run alone.
ID_OWNERSHIP_CHECK — Verify each runtime ID is assigned once to one instance, and any second assignment of that value is a getter instead.
REQUEST_SOURCE_CHECK — Verify path params, query, headers, and body come from the named example instance and none is a rebuilt literal.
REQUEST_PREPARATION_CHECK — Confirm every command call that sends data consumes a pre-composed example request instance.
SOURCE_CHECK — Confirm every asserted value resolves to a constraint or named example field, with no orphan literals.
ASSERT_STATUS_FIRST_CHECK — Confirm every verified response asserts `response.status` before any other expectation.
FIND_LIST_ITEMS_BY_KEY_CHECK — Verify every array index on a response list is either part of an order assertion or replaced by a lookup on ID or name.
REQ_METADATA_CHECK — Verify empty `req` fields are omitted, links sit in `refs`, bugs in `bugs`, and `note` adds meaning beyond the title.
REQ_SCOPE_CHECK — Confirm each `req` field sits on the smallest true block and is not repeated on a child.
COMMENT_CHECK — Verify no inline priority, Jira, bug, or TODO comment remains where a `req` field should carry it.
READABILITY_CHECK — Verify examples are referenced directly, chains are flat, and every comment adds behaviour meaning.

