---
name: localization-testing
description: Use when testing localized UI text or maintaining localization keys — asserting strings through the typed `l10n` map and keeping the flat dot-namespaced key convention consistent across locale files, generated types, specs, and commands. Triggers on new UI strings, hardcoded text in specs, missing-key type errors, duplicate values, wording changes, or language-switch assertions.
---

# Principles

CONTRACT: the flat key string is the shared contract between frontend and tests, and this skill governs its grammar, scopes, and reuse — otherwise the two code bases drift with no single authority to reconcile them
FLATNESS: keys stay flat dot-namespaced strings, never nested objects — otherwise nesting collides with ngx-translate/transloco resolution and hides keys the type union should expose
ONE_KEY_PER_CONCEPT: a concept owns exactly one key and identical strings collapse into it — otherwise one wording change fixes half the usages and rots the rest
TRACEABILITY: every rename maps exactly one old key to one new key with all usages updated in the same pass — otherwise dangling references pass locally and break elsewhere
NORMALIZATION: inconsistent source spellings resolve to one form per concept — otherwise mixed spellings fracture a single concept across keys and defeat reuse

# Method

## File model

LOCALE_FILES: one flat JSON per language at `cypress/localization/{lang}-localization.json`, entries `"dotted.key": "value"`, no nested objects — these are the hand-edited source of truth
ACTIVE_MAP: pretest copies the `LANGUAGE`-selected locale file to the generated `cypress/localization/l10n.json`, exposed as the global `l10n` — never hand-edit `l10n.json`, it is overwritten by `node scripts/l10n.js activate`
TYPED_UNION: `cypress/support/l10n.d.ts` types `l10n` as `Record<L10nKey, string>`, generated from the active map by REGEN

## Signals to operation

NEW_STRING: a new user-facing string in the app, or a spec needs to assert one → ADD_KEY
HARDCODED_TEXT: a spec or command asserts literal UI text instead of `l10n['key']` → ADD_KEY then replace the literal
MISSING_KEY: a referenced key is absent (TS error on `l10n['…']` or runtime undefined) → ADD_KEY or correct the reference
DUPLICATE_VALUE: one string under two keys, or repeated across features → DEDUPE
WORDING_CHANGE: frontend changes a string's text → update the value in place; if meaning forks, split into distinct keys
MISFIT_KEY: a key breaks grammar, scope, or depth → RENAME_KEY
DEAD_KEY: a key with no usage in specs, commands, or frontend → REMOVE_KEY
NEW_SCOPE: a feature area with no matching `FEATURE_SCOPE` → extend scopes in this skill together with usages
PREFIX_COLLISION: a new key would make an existing key its prefix (`a.b` value beside `a.b.c` key) → restructure to avoid the nesting clash
LANGUAGE_SWITCH: a spec asserts text after changing language → run with the target `LANGUAGE`, assert `l10n['key']` so the expectation resolves per active language, never a hardcoded translation

## Key grammar

SHAPE: `feature.area.element[.role]`, `lowerCamelCase` segments, dot-joined
DEPTH: 3-4 segments preferred, 5 the ceiling for table headers and option groups
ROLE_PRESENTATIONAL: `title`, `label`, `placeholder`, `hint`, `tooltip`, `message`, `option`, `column`, `tab`, `empty`
ROLE_VALIDATION: `required`, `maxLength`, `minLength`, `duplicate`, `invalid`, `specialChars`
FIELD_CLUSTER: all strings of one field grouped under `feature.area.field.*`

## Shared scope

FEATURE_SCOPES: `cartPage`, `checkoutCompletePage`, `checkoutOverviewPage`, `checkoutPage`, `common`, `footer`, `header`, `inventoryPage`, `loginPage` — extend both this list and `scripts/l10n-lib.js` when a new scope is needed (NEW_SCOPE signal)
PROMOTION_TEST: promote to `common.*` when the string is identical everywhere and tied to a reusable component or domain noun, otherwise keep it under the owning feature — the identical-and-reused test decides placement so shared strings stay single-sourced
COMMON_BUTTON: identical buttons collapse to `common.button.*`
COMMON_VALIDATION: shared special-characters message to `common.validation.specialChars`
COMMON_COMPONENT: reusable component strings to `common.<component>.*` — `filter`, `paginator`, `list`
COMMON_ENTITY: domain noun labels reused across filters, tables, forms to `common.entity.*`
COMMON_ENUM: `common.status.*`, `common.priority.*`, `common.language.*`, `common.accessLevel.*`, `common.scoringType.*`
COMMON_TOAST: generic toast titles to `common.toast.title.*`

## Maintenance operations

ADD_KEY: name per grammar under the owning `feature.area` → apply PROMOTION_TEST, reusing an existing key when the concept exists → run CLI_ADD so every locale file receives the key in sorted position → REGEN → USAGES
RENAME_KEY: pick the new key per grammar → run CLI_RENAME so every locale file changes consistently → update all `l10n['old']` to `l10n['new']` in one pass → REGEN
REMOVE_KEY: confirm no usage in specs, commands, or frontend → run CLI_REMOVE so every locale file loses the key consistently → REGEN
DEDUPE: keep one key per concept → promote per PROMOTION_TEST when shared → point all usages at the survivor → run CLI_REMOVE for redundant keys → REGEN
NORMALIZE: one spelling per concept — `toast` over `toaster`/`Toastr`, `common.list.noResults` over result-not-found variants, `create` over `creation`, `{{var}}` over `{var}` — and log real wording defects in `bug-log/`
REGEN: run `npm run l10n:gen-types` (also runs in `pretest`) to refresh `cypress/support/l10n.d.ts` — the `L10nKey` union that gives autocomplete and turns a bad key into a type error
USAGES: specs and commands read strings as `l10n['<key>']`; enumerate a namespace by prefix filter, never with a `t()`/`tGroup()` wrapper or nested `l10n.<path>` access

## CLI commands

CLI_ADD: use `node scripts/l10n.js add <key> <english-value> [--<lang>="value"]` for non-interactive agent changes; example `node scripts/l10n.js add common.button.save "Save"`
CLI_REMOVE: use `node scripts/l10n.js remove <key> [<key> ...]` for non-interactive deletion; example `node scripts/l10n.js remove common.button.exportPdf`
CLI_RENAME: use `node scripts/l10n.js rename <old-key> <new-key>` for one-to-one key renames; use `--dry-run` before updating spec usages
CLI_LIST: use `node scripts/l10n.js list --prefix=<prefix> --json` to discover existing reusable keys before adding a new concept
CLI_VALIDATE: use `node scripts/l10n.js validate` for read-only grammar, flatness, sort, prefix, and value checks
CLI_SYNC: use `node scripts/l10n.js sync --check` before edits to detect drift and `node scripts/l10n.js sync` to sort and backfill missing locale keys
CLI_DRY_RUN_JSON: append `--dry-run` to preview add, remove, rename, or sync without writes; append `--json` when an agent needs machine-readable output
CLI_TYPES: use `npm run l10n:gen-types` after add, remove, rename, or sync; use `LANGUAGE=en npm run pretest` when the active map also needs refreshing
CLI_NPM_ARGS: npm wrappers require `--` before forwarded args, e.g. `npm run l10n:add -- itemList.title "items"`, `npm run l10n:rename -- itemList.title itemList.page.title --dry-run`, and `npm run l10n:list -- --prefix=common.button. --json`

```js
// lookup returns the active-language value for the flat key
l10n['itemList.title'];
// enumerate a namespace for counting or listing options
Object.keys(l10n).filter((key) => key.startsWith('common.status.'));
```

## Access behavior

FAIL_LOUD: keys are typed against `L10nKey`, so a missing or renamed key surfaces as a dev-time type error exposing frontend/test drift — no runtime fallback masks it
LANGUAGE_SELECTION: the `LANGUAGE` env var drives the pretest copy of the selected locale file into the active map, so specs asserting `l10n['key']` are language-agnostic

# Validation

GRAMMAR_CHECK: every key matches `feature.area.element[.role]`, segments `lowerCamelCase`, depth 5 at most
SCOPE_CHECK: every `feature` segment is a declared feature scope
FLAT_CHECK: locale files hold no nested objects, keys sorted, no duplicates
NO_PREFIX_CHECK: no key is a strict prefix of another
ONE_CONCEPT_CHECK: no two keys hold the same string for one concept, no single key reused where wording or context differs, no key named after its English text
TYPES_FRESH_CHECK: `l10n.d.ts` regenerated after any add, rename, or remove; no referenced key absent from the union
USAGE_CHECK: no `t()`/`tGroup()` call and no nested `l10n.<path>` access remains; no fallback (`l10n[key] || ''`) or dynamically built key escapes the `L10nKey` check — access is a literal typed key
NORMALIZATION_CHECK: one spelling per concept, interpolation defects logged in `bug-log/`
PATH_CHECK: declared paths exist in the workspace
