---
name: colour-theme-testing
description: Use when asserting theme CSS colours or maintaining flat `colours` keys across theme JSON, generated types, specs, and commands.
---

# Reasoning Principles

CONTRACT: the flat key string is the shared contract between the app's theme and tests, and this skill sets its grammar and reuse — otherwise literal colour values scatter across specs and a theme change breaks assertions silently
FLATNESS: keys stay flat dot-namespaced strings, never nested objects — otherwise nested keys are missed by the type union and the sync script
ONE_KEY_PER_COLOUR: a visual concept owns exactly one key and identical colours collapse into it — otherwise one theme change fixes half the usages and rots the rest
TRACEABILITY: every rename maps exactly one old key to one new key with all usages updated in the same pass — otherwise dangling references pass locally and break elsewhere

# Output Shape

## Sources & Generated Files

THEME_FILES: one flat JSON per theme at `cypress/colours/{theme}-theme-colours.json`, entries `"dotted.key": "rgb(…)"`, no nested objects — these are the hand-edited source of truth
ACTIVE_MAP: pretest copies the `COLOUR_THEME`-selected theme file to the generated `cypress/colours/colours.json`, exposed as the global `colours` — never hand-edit `colours.json`, it is overwritten by `node scripts/colours.js activate`
TYPED_UNION: `cypress/support/colours.d.ts` types `colours` as `Record<ColourKey, string>` and is generated from `default-theme-colours.json`; CLI validate/sync catches per-theme drift

## Triggers

NEW_COLOUR: a new CSS colour to assert in a spec → ADD_KEY
HARDCODED_VALUE: a spec or command asserts a literal `rgb(…)` or hex value instead of `colours['key']` → ADD_KEY then replace the literal
MISSING_KEY: a referenced key is absent (TS error on `colours['…']` or runtime undefined) → ADD_KEY or correct the reference
DUPLICATE_VALUE: same colour value under two keys for one visual concept → DEDUPE
VALUE_CHANGE: the app changes a colour → update the value in the theme file; if the meaning splits, split into distinct keys
MISFIT_KEY: a key breaks grammar, scope, or depth → RENAME_KEY
DEAD_KEY: a key with no usage in specs, commands, or frontend → REMOVE_KEY
PREFIX_COLLISION: a new key would make an existing key its prefix (`a.b` value beside `a.b.c` key) → restructure to avoid the nesting clash
THEME_SWITCH: a spec asserts colours after switching theme → run with the target `COLOUR_THEME`, assert `colours['key']` so the expected value comes from the active theme, never a literal value

## Key Grammar

KEY_SHAPE: `component.state`, `lowerCamelCase` segments, dot-joined
KEY_DEPTH: 2-3 segments preferred, 4 the ceiling
KEY_COMPONENTS: name the leading segment after the UI component — e.g. `button`, `checkbox`, `commentIcon`, `text`, `toaster` (convention, not enforced)
KEY_STATE_SUFFIXES: visual state of the component — `compliant`, `nonCompliant`, `notAnswered`, `notApplicable`, `marked`, `default`, `hasComment`, `error`, `success`

## Operations

ADD_KEY: name per grammar under the owning component scope → run CLI_ADD so every theme file receives the key in sorted position → REGEN → USAGES
RENAME_KEY: pick the new key per grammar → run CLI_RENAME so every theme file changes consistently → update all `colours['old']` to `colours['new']` in one pass → REGEN
REMOVE_KEY: confirm no usage in specs, commands, or frontend → run CLI_REMOVE so every theme file loses the key consistently → REGEN
DEDUPE: keep one key per visual concept → point all usages at the survivor → run CLI_REMOVE for redundant keys → REGEN
REGEN: run `npm run colours:gen-types` (also runs in `pretest`) to refresh `cypress/support/colours.d.ts` from the reference `default-theme-colours.json` — the `ColourKey` union that gives autocomplete and turns a bad key into a type error
USAGES: specs and commands read colours as `colours['<key>']`; list related keys with a prefix filter, never with dot-access `colours.<PROP>` or dynamically built keys

## CLI

CLI_ADD: use `node scripts/colours.js add <key> <default-value> [--<theme>="value"]` for non-interactive agent changes; example `node scripts/colours.js add button.marked "rgb(20, 163, 139)"`
CLI_REMOVE: use `node scripts/colours.js remove <key> [<key> ...]` for non-interactive deletion; example `node scripts/colours.js remove toaster.error`
CLI_RENAME: use `node scripts/colours.js rename <old-key> <new-key>` for one-to-one key renames; use `--dry-run` before updating spec usages
CLI_LIST: use `node scripts/colours.js list --prefix=<prefix> --json` to discover existing reusable keys before adding a new visual concept
CLI_VALIDATE: use `node scripts/colours.js validate` for read-only grammar, flatness, sort, prefix, and value checks
CLI_SYNC: use `node scripts/colours.js sync --check` before edits to detect drift and `node scripts/colours.js sync` to sort and backfill missing theme keys
CLI_DRY_RUN_JSON: append `--dry-run` to preview add, remove, rename, or sync without writes; append `--json` when an agent needs machine-readable output
CLI_TYPES: use `npm run colours:gen-types` after add, remove, rename, or sync; use `COLOUR_THEME=default npm run pretest` when the active map also needs refreshing
CLI_NPM_ARGS: npm wrappers require `--` before forwarded args, e.g. `npm run colours:add -- checkbox.compliant "rgb(20, 163, 139)"` or `npm run colours:list -- --prefix=button. --json`

## Access

FAIL_LOUD: keys are typed against `ColourKey`, so a missing or renamed key surfaces as a dev-time type error — no runtime fallback masks it
THEME_SELECTION: the `COLOUR_THEME` env var drives the pretest copy of the selected theme file into the active map, so specs asserting `colours['key']` work for any active theme
LOOKUP_SHAPE: specs and commands use literal bracket access `colours['toaster.success']`; prefix scans use `Object.keys(colours).filter((key) => key.startsWith('button.'))`

# Validation

GRAMMAR_CHECK: every key matches `component.state` or `component.element.state`, segments `lowerCamelCase`, depth 4 at most
FLAT_CHECK: theme files hold no nested objects, keys sorted, no duplicates
NO_PREFIX_CHECK: no key is a strict prefix of another
ONE_CONCEPT_CHECK: no two keys hold the same value for one visual concept
TYPES_FRESH_CHECK: `colours.d.ts` regenerated after any add, rename, or remove; no referenced key absent from the union
USAGE_CHECK: no dot-access `colours.<PROP>` remains; no fallback or dynamically built key escapes the `ColourKey` check — access is a literal typed key
PATH_CHECK: declared paths exist in the workspace
