---
name: colour-theme-testing
description: Use when testing colour-themed UI elements or maintaining colour keys — asserting CSS colours through the typed `colours` map and keeping the flat dot-namespaced key convention consistent across theme files, generated types, specs, and commands. Triggers on new colour assertions, hardcoded RGB/hex values in specs, missing-key type errors, duplicate values, theme-switch assertions, or colour value changes.
---

# Principles

CONTRACT: the flat key string is the shared contract between the app's theme and tests, and this skill governs its grammar, scopes, and reuse — otherwise hardcoded colour values scatter across specs and a theme change breaks assertions silently
FLATNESS: keys stay flat dot-namespaced strings, never nested objects — otherwise nesting hides keys the type union should expose and complicates the sync script's flatness guard
ONE_KEY_PER_COLOUR: a visual concept owns exactly one key and identical colours collapse into it — otherwise one theme change fixes half the usages and rots the rest
TRACEABILITY: every rename maps exactly one old key to one new key with all usages updated in the same pass — otherwise dangling references pass locally and break elsewhere

# Method

## File model

THEME_FILES: one flat JSON per theme at `cypress/colours/{theme}-theme-colours.json`, entries `"dotted.key": "rgb(…)"`, no nested objects — these are the hand-edited source of truth
ACTIVE_MAP: pretest copies the `COLOUR_THEME`-selected theme file to the generated `cypress/colours/colours.json`, exposed as the global `colours` — never hand-edit `colours.json`, it is overwritten by `scripts/copy-colours.js`
TYPED_UNION: `cypress/support/colours.d.ts` types `colours` as `Record<ColourKey, string>`, generated from the active map by REGEN

## Signals to operation

NEW_COLOUR: a new CSS colour to assert in a spec → ADD_KEY
HARDCODED_VALUE: a spec or command asserts a literal `rgb(…)` or hex value instead of `colours['key']` → ADD_KEY then replace the literal
MISSING_KEY: a referenced key is absent (TS error on `colours['…']` or runtime undefined) → ADD_KEY or correct the reference
DUPLICATE_VALUE: same colour value under two keys for one visual concept → DEDUPE
VALUE_CHANGE: the app changes a colour → update the value in the theme file; if the semantic meaning forks, split into distinct keys
MISFIT_KEY: a key breaks grammar, scope, or depth → RENAME_KEY
DEAD_KEY: a key with no usage in specs, commands, or frontend → REMOVE_KEY
NEW_SCOPE: a UI component area with no matching `COMPONENT_SCOPE` → extend scopes in this skill together with usages
PREFIX_COLLISION: a new key would make an existing key its prefix (`a.b` value beside `a.b.c` key) → restructure to avoid the nesting clash
THEME_SWITCH: a spec asserts colours after switching theme → run with the target `COLOUR_THEME`, assert `colours['key']` so the expectation resolves per active theme, never a hardcoded value

## Key grammar

SHAPE: `component.state`, `lowerCamelCase` segments, dot-joined
DEPTH: 2-3 segments preferred, 4 the ceiling
COMPONENT_SCOPES: `button`, `checkbox`, `commentIcon`, `text`, `toaster`
STATE_SUFFIXES: visual state of the component — `compliant`, `nonCompliant`, `notAnswered`, `notApplicable`, `marked`, `default`, `hasComment`, `error`, `success`

## Maintenance operations

ADD_KEY: name per grammar under the owning component scope → insert into every `cypress/colours/*-theme-colours.json` in sorted position → REGEN → USAGES
RENAME_KEY: pick the new key per grammar → rename the entry in every theme file, keeping sort order → update all `colours['old']` to `colours['new']` in one pass → REGEN
REMOVE_KEY: confirm no usage in specs, commands, or frontend → delete from every theme file → REGEN
DEDUPE: keep one key per visual concept → point all usages at the survivor → delete the redundant keys → REGEN
REGEN: run `npm run gen:colours-types` (also runs in `pretest`) to refresh `cypress/support/colours.d.ts` — the `ColourKey` union that gives autocomplete and turns a bad key into a type error
USAGES: specs and commands read colours as `colours['<key>']`; enumerate a namespace by prefix filter, never with dot-access `colours.<PROP>` or dynamically built keys

```js
// lookup returns the active-theme value for the flat key
colours['toaster.success']
// enumerate a namespace for listing all button colours
Object.keys(colours).filter((key) => key.startsWith('button.'))
```

## Access behavior

FAIL_LOUD: keys are typed against `ColourKey`, so a missing or renamed key surfaces as a dev-time type error — no runtime fallback masks it
THEME_SELECTION: the `COLOUR_THEME` env var drives the pretest copy of the selected theme file into the active map, so specs asserting `colours['key']` are theme-agnostic

# Validation

GRAMMAR_CHECK: every key matches `component.state` or `component.element.state`, segments `lowerCamelCase`, depth 4 at most
SCOPE_CHECK: every leading segment is a declared component scope
FLAT_CHECK: theme files hold no nested objects, keys sorted, no duplicates
NO_PREFIX_CHECK: no key is a strict prefix of another
ONE_CONCEPT_CHECK: no two keys hold the same value for one visual concept
TYPES_FRESH_CHECK: `colours.d.ts` regenerated after any add, rename, or remove; no referenced key absent from the union
USAGE_CHECK: no dot-access `colours.<PROP>` remains; no fallback or dynamically built key escapes the `ColourKey` check — access is a literal typed key
PATH_CHECK: declared paths exist in the workspace
