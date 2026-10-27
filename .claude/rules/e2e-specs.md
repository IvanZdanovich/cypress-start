---
paths:
  - 'cypress/e2e/ui/*.spec.js'
  - 'cypress/e2e/ui/*.spec.skip.js'
---

# Reasoning Principles

LIMIT_SPEC_TO_JOURNEY — Limit an E2E spec to one user journey that spans several pages or steps.
Page-level checks belong in integration UI specs. Mixing them hides which journey a failure breaks.

REUSE_ENTITIES_ACROSS_STEPS — Reuse entities created in earlier steps across create, modify, verify, and complete.
Otherwise the test exercises isolated actions rather than the journey. The cost is that a failed step blocks the later ones.

ORDER_CONTEXTS_BY_JOURNEY — Order contexts the way a real user lives the workflow, with explicit state for each step.
Convenience ordering stops the spec from documenting the requirement.

MATCH_ASSERTIONS_TO_TITLE — Match the title, example, action, and assertion to one verified business outcome.
A spec that asserts less than its title claims gives false confidence.

# Output Shape

PLACE_SPEC_BY_WORKFLOW — Place each spec at `cypress/e2e/ui/<workflow-name>.ui.spec.js`, named in kebab-case after the business flow.
The related paths are listed below.

```
examples      cypress/e2e-examples/ui/<workflow-name>.ui.examples.js
selectors     cypress/selectors/selectors.js
UI commands   cypress/commands/ui/*.ui.commands.js     reusable workflow interactions
API commands  cypress/commands/api/*.api.commands.js    setup and cleanup
constraints   cypress/constants/{api,ui}/*.{api,ui}.constraints.js
registry      eslint-plugin-custom-rules/app-structure/workflows.json
```

NEST_CONTEXT_PER_STEP — Nest one `describe`, then one sequential `context` per workflow step, then `it` blocks.
This shape lets the report read as the steps of the journey.

DISABLE_TEST_ISOLATION — Disable isolation with `{ testIsolation: false }` on `describe` so the token, session, and created data persist across steps.
Default isolation clears them, forces repeated setup, and breaks the hand-over of state from one step to the next.

SET_UP_IN_BEFORE_HOOKS — Set up in the `describe` `before` hook by getting a token, running cleanup, creating API data, and starting the session.
Each step `before` does the navigation for its step, and `after` runs cleanup. Setup inside `it` blocks hides preconditions among outcomes.

FORMAT_TITLES_AS_GIVEN_WHEN_THEN — Format titles in the three Given, When, and Then forms below.
A fixed form lets a reader find the precondition, step, and outcome without reading the code.

```
Flow.SubFlow: Given preconditions, created data
Flow.SubFlow.USER_ROLE: When condition
Flow.SubFlow.USER_ROLE: Then expected result
```

KEEP_TITLES_UNIQUE — Keep titles unique within a `context` and prefixed with their flow, with no parentheses or square brackets, stating value meaning over literal values.
Duplicate or literal titles make the report ambiguous.

STATE_REQUIREMENT_IN_TITLE — State the requirement in the Given/When/Then title, and use `req` only to classify, link, and scope it.
A long `note` duplicates the title, and the two versions then disagree.

RECORD_FACTS_IN_REQ — Record requirement facts in `req` fields that the lint rule and reporter can read, not in comments.
Inline `// P1`, `// TODO`, or Jira comments are invisible to tooling and drift from the block they describe.

OMIT_EMPTY_REQ_FIELDS — Omit empty fields in the optional `{ req: { p, preconditions, refs, bugs, note } }` metadata.
Set `p` only for `'P1'` or `'P3'`, because `'P2'` is the default. Keep tickets in `refs`, tracked bugs in `bugs`, and the behaviour reason in `note`.

PLACE_REQ_ON_NEAREST_BLOCK — Place `req` on the smallest block it is true for, and leave parent metadata off its children.
Use `it` for one outcome, `context` for one step and all its outcomes, and `describe` for the whole journey.

NAME_ENTITIES_BY_PATTERN — Name created entities `SpecFileAbbr.EntityAbbr.ActionOrIntent.${randomSuffix}`.
The shared prefix lets cleanup find every record the journey made, including those created through the UI.

CLEAN_UP_BY_PREFIX — Clean up by name prefix through the API before and after the spec, with data independent of other files.
Leftovers from crashed or earlier runs can make later specs pass falsely or fail at random.

ASSIGN_SOURCE_ID_ONCE — Assign `examples.group.source.id = response.body.id` once, and expose `get id() { return examples.group.source.id; }` on dependents.
The source example owns the placeholder `id`, so one assignment updates every later step. Copied IDs fall out of step with the entity that was created.

KEEP_WORKFLOW_DATA_IN_EXAMPLES — Keep setup, execution, and verification values in the E2E examples file.
Values typed into the spec fork from the examples and hide what the journey verifies.

ALIGN_SETUP_WITH_ASSERTIONS — Align API setup values with UI verification values by taking both from the same instance.
Otherwise the assertion verifies a state the setup never produced.

REFERENCE_EXAMPLES_DIRECTLY — Reference `examples.group.instance` directly in commands and assertions, and keep Cypress chains flat, instead of using local aliases and nested callbacks.
Aliases and nesting make the asserted source and command order harder to audit.

SOURCE_ASSERTED_VALUES — Source boundaries from constraints, displayed data from named examples, UI text from `l10n`, and theme colours from `colours`.
Inline literals are allowed only for Cypress chainer names, attribute names, or structural states. An inline value drifts from its source and hides which rule it verifies.

USE_GLOBAL_SELECTORS — Use global selector variables such as `commonUI` or page objects, named `elementPurposeElementType`, never literal CSS strings.
A literal breaks without warning when the selector changes, while purpose names stay valid when the markup changes.

EXTRACT_REUSED_WORKFLOW_ACTIONS — Extract reused multi-step workflow actions into `pageName__action` or `componentName__action` commands named in business terms.
One-off `.click()`, `.type()`, `.clear()`, and simple assertions stay inline. The cost is a command file to maintain.

START_SESSION_FOR_TITLE_ROLE — Start the session with `cy.common__getSessionUI(userRoles.<ROLE>)` before the first step each role in the titles performs.
A missing session runs the step as the last cached user, so a hand-over between roles can pass for the wrong role. The cost is one login for each role change.

WAIT_ON_ALIAS_OR_ASSERTION — Wait for page data with `cy.wait('@alias')` on a `cy.intercept` alias, or with a retrying `should`, rather than a fixed `cy.wait(ms)`.
A fixed wait is too short on a slow environment and wastes time on a fast one, and a journey adds up every wait. The cost is an intercept for each request.

KEEP_IT_BODIES_SHORT — Keep each `it` body near five lines, with one verified outcome and at most one level of `cy.then()` nesting.
Add comments only when they add behaviour meaning. A long body hides which outcome failed.

# Validation

WORKFLOW_SCOPE_CHECK — Confirm the spec spans several user steps or pages and reuses workflow state, or move it to `cypress/integration/ui/`.
STRUCTURE_CHECK — Verify the spec nests `describe`, one `context` per step, and `it`, with `{ testIsolation: false }` on `describe`.
FLOW_CHECK — Confirm contexts follow the business order of the user journey.
SEGMENTATION_CHECK — Verify each `it` asserts exactly one outcome.
TITLE_CHECK — Confirm every title is unique, flow-prefixed, and in Given/When/Then form.
CLEANUP_CHECK — Confirm `before` and `after` both run API cleanup by the name pattern and the spec passes when run alone.
ID_OWNERSHIP_CHECK — Verify each runtime ID is assigned once to one instance, and any second assignment of that value is a getter instead.
ALIGNMENT_CHECK — Verify every UI assertion reads the same example instance that the API setup used.
SOURCE_CHECK — Confirm every asserted value resolves to a constraint, named example field, `l10n` key, or `colours` key, with no orphan literals.
SELECTOR_CHECK — Confirm selectors are global variables and no literal CSS strings remain.
START_SESSION_FOR_TITLE_ROLE_CHECK — Confirm each USER_ROLE in the titles has an active `common__getSessionUI` call before its first step.
WAIT_ON_ALIAS_OR_ASSERTION_CHECK — Confirm no `cy.wait(ms)` and no commented-out `cy.intercept` remain, unless a `req.bugs` link explains the wait.
REQ_METADATA_CHECK — Verify empty `req` fields are omitted, links sit in `refs`, bugs in `bugs`, and `note` adds meaning beyond the title.
REQ_SCOPE_CHECK — Confirm each `req` field sits on the smallest true block and is not repeated on a child.
COMMENT_CHECK — Verify no inline priority, Jira, bug, or TODO comment remains where a `req` field should carry it.
READABILITY_CHECK — Verify examples are referenced directly, chains are flat, and every comment adds behaviour meaning.

