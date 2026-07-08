---
name: eslint-custom-rules
description: Use when adding or updating a custom ESLint rule, hitting a `custom/*` lint error, suppressing a rule inline, or understanding what a project custom rule enforces and why.
---

# Principles

SOURCE_OF_TRUTH: this skill is the authoritative list of what each `custom/*` rule enforces; the human doc `docs/eslint-custom-rules.md` only points here — otherwise two descriptions drift and neither can be trusted
INVARIANT_FIDELITY: each rule line states the invariant as implemented in `eslint-plugin-custom-rules/<rule>.js`, not the aspiration — otherwise a rule reads as stricter or looser than it fires
SUPPRESSION_SCARCITY: suppress a `custom/*` rule inline only for a genuine false positive or unavoidable constraint, never to silence a real violation — otherwise the guardrail erodes silently and reviewers cannot tell intent from evasion
CONVENTION_OVER_ADHOC: naming, title, and structure rules replace human judgement with one enforced form so specs read uniformly — otherwise every author invents a dialect and traceability collapses

# Method

REGISTRATION: every rule lives in `eslint-plugin-custom-rules/<name>.js`, is exported from `eslint-plugin-custom-rules/index.js`, and is wired under the `custom/` plugin namespace in `eslint.config.mjs`; all 14 are set to `error` there
SCOPE_GATE: most rules self-limit by filename inside `create()` (`.spec.js`, `.api.commands.js`, `/commands/ui/`, `selectors.js`, `*.test-data.js`), so a rule stays silent outside its target files — a violation firing means the file matched the gate

## Titles and structure

VERIFY_TEST_TITLE_PATTERN: `describe` matches `Module.Sub: Given …`, `context` matches `Module.Sub.ROLE: When …`, `it` matches `Module.Sub.ROLE: Then …`, description 1-200 chars, no trailing space; `STATE:`-prefixed contexts are exempt
VERIFY_TEST_TITLE_WITHOUT_FORBIDDEN_SYMBOLS: `describe`/`context` titles carry no leading/trailing whitespace and none of `! @ # $ % ^ & * ( ) + = { } [ ] | \ ; " ' < > ? /` — otherwise punctuation breaks report parsing and grep
PREVENT_DUPLICATED_TITLES: every `describe`/`context` title (incl. `.skip`/`.only`) is globally unique per lint run — otherwise duplicate scenarios blur which spec failed
STANDARDIZE_TEST_TITLES: title terms normalize to the canonical vocabulary (`show`→`display`, `btn`→`button`, `respond with`→`return`, etc.), UI terms in UI/e2e specs and API terms in API specs, common terms everywhere; the full mapping list is the `COMMON_REPLACEMENTS`/`UI_REPLACEMENTS`/`API_REPLACEMENTS` arrays in `eslint-plugin-custom-rules/standardize-test-titles.js` (source of truth for the wording glossary); auto-fixable — otherwise synonyms fracture one behaviour across many phrasings
ENFORCE_SPEC_BLANK_LINES: inside `describe`/`context` bodies, no blank line between consecutive `it`/hook blocks and exactly one blank line before each nested `context`; auto-fixable, non-test statements reset the tracker
DO_NOT_ALLOW_EMPTY_BLOCKS: `it`, `context`, and `context.skip` bodies contain real statements, not just a title/comment; `STATE:`-prefixed contexts may be empty — otherwise a placeholder passes as a covered case
VERIFY_TEST_TITLE_AGAINST_STRUCTURE: the dotted prefix of each spec title exists in the matching `eslint-plugin-custom-rules/app-structure/{modules,components,workflows}.json`; `--fix` regenerates those files from current titles (additive, PascalCase-only, sorted) — otherwise a typo'd path or stale coverage entry goes unnoticed

## Naming

VERIFY_API_COMMAND_NAMING: in `cypress/support/commands/api/*.api.commands.js`, `Cypress.Commands.add` names match `resource__action__METHOD` — camelCase resource, camelCase action, uppercase method in GET/POST/PUT/PATCH/DELETE
VERIFY_UI_COMMAND_NAMING: in `cypress/support/commands/ui/*.ui.commands.js`, command names match exactly two camelCase parts `page__action`
VERIFY_REQ_CONFIG: when an `it` config object carries a `req` key, `req` is an object allowing only `p` (`'P1'|'P2'|'P3'`), `preconditions` (non-empty string array), `refs` (non-empty valid-URL array), `bugs` (non-empty array of `BUG-MODULE-NNN` ids or URLs), `note` (non-empty string comment about the checks); unknown keys, empty arrays, and empty notes error; `req` itself stays optional — otherwise metadata schema rots and bug/story links go unvalidated

## Data and examples

PREVENT_EXAMPLES_LOOPS: inside `describe`/`context`/`it` (but not hooks), no `.forEach`/`for...of`/`for...in` over data-shaped operands (names matching `testData|invalid|valid|Array|items|values|data`); pick one randomized value in the test-data file instead — otherwise looped cases hide flakiness behind a single passing iteration and multiply run time
FIND_UNUSED_EXAMPLES: first-level instances exported from `cypress/test-data/*.test-data.js` are referenced in some spec/command (import aliases resolved); single-line unused entries auto-fixable, multi-line removed by hand — otherwise stale fixtures accumulate
FIND_UNUSED_SELECTORS: selector paths in `cypress/support/selectors/selectors.js` are referenced across integration/e2e/commands; a parent survives if any child is used; single-line/empty entries auto-fixable — otherwise dead selectors mislead readers about live UI

## Guardrails

VERIFY_TODOS_HAVE_LINKS: any `TODO`/`FIXME`/`ToDo`/`FixMe` comment includes a bug-tracker URL (`…/browse/PROJ-123`); in spec files prefer `req.bugs` over inline TODOs, this rule is the fallback for non-spec files — otherwise untracked TODOs never resurface

## Suppression

SUPPRESS_PREFIX: custom rules disable under the `custom/` prefix, Cypress built-ins under `cypress/`; inline disable comments are the only accepted suppression and do not raise the count tracked by `scripts/thresholds.json`

```js
// eslint-disable-next-line custom/find-unused-selectors
reservedForFutureUse: '[data-test="future-element"]'
```

# Validation

REGISTRATION_CHECK: a new rule is exported in `index.js` and given a severity under `custom/` in `eslint.config.mjs`, or ESLint never loads it
INVARIANT_CHECK: each rule line here matches the behaviour in its `.js` source, including scope gate and `STATE:`/`req`-optional exemptions
FIX_ACCURACY_CHECK: only rules whose source sets `fixable`/provides a `fix` are described as auto-fixable — `enforce-spec-blank-lines`, `standardize-test-titles`, `verify-test-title-against-structure`, `find-unused-*`
SUPPRESSION_CHECK: every inline disable uses the correct `custom/`/`cypress/` prefix and names the specific rule, never a bare blanket disable
PATH_CHECK: declared paths exist in the workspace