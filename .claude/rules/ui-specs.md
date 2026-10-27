---
paths:
  - 'cypress/integration/ui/*.spec.js'
  - 'cypress/integration/ui/*.spec.skip.js'
---

# Reasoning Principles

LIMIT_SPEC_TO_ONE_PAGE — Limit an integration UI spec to the visible behaviour of one page or component after an action.
Otherwise integration coverage drifts into end-to-end workflow testing. Multi-page cross-functional journeys belong in `cypress/e2e/ui/`.

CREATE_PRECONDITIONS_THROUGH_API — Create preconditions through API commands, and use the UI only for the behaviour under test.
Slow UI setup fails for reasons unrelated to the visible outcome. The cost is an API command for each precondition.

# Output Shape

PLACE_SPEC_BY_PAGE — Place each spec at `cypress/integration/ui/<page-name>[.<component>].ui.spec.js`, adding dot segments only when they clarify the scope.
Spec-specific examples mirror the spec name. The related paths are listed below.

```
examples      cypress/integration-examples/ui/<page-name>[.<component>].ui.examples.js
selectors     cypress/selectors/selectors.js
UI commands   cypress/commands/ui/<page-or-aspect>.ui.commands.js     reusable interactions
API commands  cypress/commands/api/<module-or-aspect>.api.commands.js     setup and cleanup
constraints   cypress/constants/{api,ui}/<page-or-module-name>.{api,ui}.constraints.js
```

NEST_CONTEXTS_IN_DESCRIBE — Nest one `describe`, then sequential `context` blocks, then `it` blocks.
This shape lets the report read as the page states and user actions under test.

DISABLE_TEST_ISOLATION — Disable isolation with `{ testIsolation: false }` on `describe` so the token, session, and created data persist across contexts.
Default isolation clears them and forces repeated setup.

SET_UP_IN_BEFORE_HOOKS — Set up in the `describe` `before` hook by getting a token, running cleanup, creating API data, and starting the session.
Each context `before` does the setup or navigation for its context, and `after` runs cleanup. Setup inside `it` blocks hides preconditions among outcomes.

FORMAT_TITLES_AS_GIVEN_WHEN_THEN — Format titles in the three Given, When, and Then forms below.
A fixed form lets a reader find the precondition, action, and outcome without reading the code.

```
Page.Component: Given preconditions, created data
Page.Component.USER_ROLE: When condition
Page.Component.USER_ROLE: Then expected result
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
Use `it` for one outcome, `context` for one action and all its outcomes, and `describe` for every block in the file.

NAME_ENTITIES_BY_PATTERN — Name created entities `SpecFileAbbr.EntityAbbr.ActionOrIntent.${randomSuffix}`.
The shared prefix lets cleanup find every record the spec made.

CLEAN_UP_BY_PREFIX — Clean up by name prefix through the API before and after the spec, with data independent of other files.
Leftovers from crashed or earlier runs can make later specs pass falsely or fail at random.

MOVE_INSTANCE_THROUGH_LIFECYCLE — Move one named instance through create, update, and delete across the file.
Separate instances per context multiply API calls without adding coverage.

ASSIGN_SOURCE_ID_ONCE — Assign `examples.group.source.id = response.body.id` once, and expose `get id() { return examples.group.source.id; }` on dependents.
The source example owns the placeholder `id`, so one assignment updates every reader. Copied IDs fall out of step with the entity that was created.

REFERENCE_EXAMPLES_DIRECTLY — Reference `examples.group.instance` directly in commands and assertions, and keep Cypress chains flat, instead of using local aliases and nested callbacks.
Aliases and nesting make the asserted source and command order harder to audit.

SOURCE_ASSERTED_VALUES — Source boundaries from constraints, displayed data from named examples, UI text from `l10n`, and theme colours from `colours`.
Inline literals are allowed only for Cypress chainer names, attribute names, or structural states. An inline value drifts from its source and hides which rule it verifies.

USE_GLOBAL_SELECTORS — Use global selector variables such as `commonUI` or page objects, named `elementPurposeElementType`, never literal CSS strings.
A literal breaks without warning when the selector changes, while purpose names stay valid when the markup changes.

SCOPE_ASSERTIONS_TO_PARENT — Scope assertions within the parent element of the component under test when practical.
A page-wide query can match a twin element elsewhere and pass for the wrong reason.

EXTRACT_REUSED_INTERACTIONS — Extract reused multi-step UI interactions into `pageName__action` or `componentName__action` commands.
One-off `.click()`, `.type()`, `.clear()`, and simple assertions stay inline. The cost is a command file to maintain.

REUSE_COMMON_UI_COMMANDS — Reuse the shared widget commands in `cypress/commands/ui/common.ui.commands.js`, such as `common__selectCompany`, `common__verifyToast`, and `common__pickDate`.
Inline copies of company selection, toasts, or date pickers miss the timing fixes in the shared command and fail at random. The cost is reading the common file before writing a step.

START_SESSION_FOR_TITLE_ROLE — Start the session with `cy.common__getSessionUI(userRoles.<ROLE>)` in the `before` hook of the first context for each role in the titles.
A missing or commented-out session runs the spec as the last cached user, so a role title can pass for another role. The cost is one login for each role change.

OPEN_PAGE_WITH_UI_URLS — Open the page under test with `cy.visit(uiUrls.<page>)`, and click through menus only when navigation is the behaviour under test.
A chain of menu clicks breaks every page spec when the menu changes, although the page itself still works. The cost is a separate context for navigation coverage.

RESTORE_STATE_IN_AFTER — Restore in the context `after` hook any page state the next context does not expect, such as an open dropdown or a typed filter.
Leftover state makes the next context pass or fail because of the previous one, not because of its own action. The cost is an extra hook per context.

WAIT_ON_ALIAS_OR_ASSERTION — Wait for page data with `cy.wait('@alias')` on a `cy.intercept` alias, or with a retrying `should`, rather than a fixed `cy.wait(ms)`.
A fixed wait is too short on a slow environment and wastes time on a fast one. Disabling `cypress/no-unnecessary-waiting` hides the problem from review. The cost is an intercept for each request.

KEEP_RUNTIME_VALUES_IN_SPEC — Keep values measured during the run, such as viewport sizes or cell texts, in spec-scope variables, and not on the examples object.
Runtime entity IDs are the exception and follow `ASSIGN_SOURCE_ID_ONCE`. Measurements stored on the imported examples object become shared state that later contexts read stale. The cost is a `let` in the spec.

KEEP_IT_BODIES_SHORT — Keep each `it` body near five lines, with one verified outcome and at most one level of `cy.then()` nesting.
Add comments only when they add behaviour meaning. A long body hides which outcome failed.

# Validation

PAGE_SCOPE_CHECK — Confirm the spec drives one page or component only, or move multi-page journeys to `cypress/e2e/ui/`.
STRUCTURE_CHECK — Verify the spec nests `describe`, `context`, and `it`, with `{ testIsolation: false }` on `describe`.
SEGMENTATION_CHECK — Verify each `it` asserts exactly one outcome.
TITLE_CHECK — Confirm every title is unique, prefixed with page or component, and in Given/When/Then form.
PRECONDITION_CHECK — Verify every precondition is created through an API command and not through the UI.
CLEANUP_CHECK — Confirm `before` and `after` both run API cleanup by the name pattern and the spec passes when run alone.
ID_OWNERSHIP_CHECK — Verify each runtime ID is assigned once to one instance, and any second assignment of that value is a getter instead.
SOURCE_CHECK — Confirm every asserted value resolves to a constraint, named example field, `l10n` key, or `colours` key, with no orphan literals.
SELECTOR_CHECK — Confirm selectors are global variables and no literal CSS strings remain.
START_SESSION_FOR_TITLE_ROLE_CHECK — Confirm each USER_ROLE in the titles has an active `common__getSessionUI` call for that role before its first context.
OPEN_PAGE_WITH_UI_URLS_CHECK — Verify every context that opens the page uses `cy.visit(uiUrls...)`, unless its title names navigation as the behaviour.
WAIT_ON_ALIAS_OR_ASSERTION_CHECK — Confirm no `cy.wait(ms)` and no commented-out `cy.intercept` remain, unless a `req.bugs` link explains the wait.
KEEP_RUNTIME_VALUES_IN_SPEC_CHECK — Verify the spec writes nothing to the examples object except runtime entity IDs.
REQ_METADATA_CHECK — Verify empty `req` fields are omitted, links sit in `refs`, bugs in `bugs`, and `note` adds meaning beyond the title.
REQ_SCOPE_CHECK — Confirm each `req` field sits on the smallest true block and is not repeated on a child.
COMMENT_CHECK — Verify no inline priority, Jira, bug, or TODO comment remains where a `req` field should carry it.
READABILITY_CHECK — Verify examples are referenced directly, chains are flat, and every comment adds behaviour meaning.

