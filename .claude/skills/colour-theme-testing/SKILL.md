---
name: colour-theme-testing
description: Use when asserting theme CSS colours or maintaining flat `colours` keys across theme JSON, generated types, specs, and commands.
---

# Intent

Produce colour assertions that read every expected colour from one flat, typed key per visual concept, so a theme change needs one edit.
When entries conflict or none applies, choose the option that keeps one key per concept and fails loudly on a bad key.

# Reasoning Principles

TREAT_KEY_AS_CONTRACT — Treat the flat key string as the shared contract between the app theme and the tests.
Literal colour values spread across specs break without warning when the theme changes. The cost is a key lookup on every colour assertion.

KEEP_KEYS_FLAT — Keep keys as flat dot-separated strings, never nested objects.
The type union and the sync script miss nested keys, so a bad key passes unchecked.

KEEP_ONE_KEY_PER_COLOUR — Keep one key per visual concept and merge identical colours for that concept into it.
Two keys for one concept let a theme change fix half the usages and leave the rest stale. The cost is a merge pass when duplicates appear.

RENAME_KEYS_ONE_TO_ONE — Rename each old key to exactly one new key and update every usage in the same change.
A dangling reference passes under one theme and breaks under another. The cost is a wider diff for a small rename.

# Output Shape

EDIT_THEME_FILES_ONLY — Edit colours only in the theme files `cypress/colours/{theme}-theme-colours.json`, as flat `"dotted.key": "rgb(…)"` entries.
These hand-edited files are the source of truth. A colour kept anywhere else is missed when the theme changes.

LEAVE_ACTIVE_MAP_GENERATED — Leave `cypress/colours/colours.json` to the generator and never edit it by hand.
Pretest copies the `COLOUR_THEME` theme file there through `node scripts/colours.js activate` and exposes it as the global `colours`. A hand edit is lost on the next run.

REGENERATE_TYPES_AFTER_CHANGE — Regenerate `cypress/support/colours.d.ts` with `npm run colours:gen-types` after any add, remove, rename, or sync.
It builds the `ColourKey` union from `default-theme-colours.json`, so a bad key becomes a type error. Stale types let a removed key compile. Pretest also runs it.

ADD_KEY_FOR_NEW_COLOUR — Add a key when a spec needs a new colour or asserts a literal `rgb(…)` or hex value, then replace the literal.
A literal skips the theme and breaks when the app changes that colour.

FIX_MISSING_KEY — Fix a reference that shows a type error or returns undefined by adding the key or correcting the name.
Otherwise the assertion compares the element against undefined and fails for a reason unrelated to the colour.

UPDATE_VALUE_ON_APP_CHANGE — Update the value in the theme file when the app changes a colour, and split the key when its meaning splits.
One key with two meanings forces a wrong value on one of them. The cost is a rename pass for the usages that move.

REMOVE_DEAD_KEY — Remove a key that specs, commands, and the frontend no longer use, after a search confirms no usage.
Dead keys hide which colours the tests really cover. Removing a key that is still used breaks the type check.

RESTRUCTURE_PREFIX_COLLISION — Restructure a new key that would make an existing key its prefix, such as `a.b` beside `a.b.c`.
A key that is also a prefix breaks flatness, and `validate` rejects it.

ASSERT_THEME_FROM_ACTIVE_MAP — Assert `colours['key']` in a theme-switch spec run with the target `COLOUR_THEME`, never a literal value.
The expected value then comes from the active theme, so one spec covers every theme.

SHAPE_KEY_AS_COMPONENT_STATE — Shape keys as `component.state` or `component.element.state`, with `lowerCamelCase` segments, 2–3 segments preferred, and 4 at most.
Deeper keys are hard to scan and usually mix two concepts.

NAME_KEY_AFTER_COMPONENT — Name the first segment after the UI component, such as `button`, `checkbox`, `commentIcon`, `text`, or `toaster`.
This convention is not enforced, but without it `list --prefix` cannot find the reusable keys.

END_KEY_WITH_STATE — End the key with the visual state of the component.
A key named after its colour value loses its meaning when the theme changes the value. Common states are listed below.

```
compliant, nonCompliant, notAnswered, notApplicable, marked, default, hasComment, error, success
```

LIST_KEYS_BEFORE_ADDING — List existing keys with `node scripts/colours.js list --prefix=<prefix> --json` before adding a new visual concept.
Without the search, a near-duplicate key is added for a concept that already exists.

ADD_KEY_THROUGH_CLI — Add a key with `node scripts/colours.js add <key> <default-value> [--<theme>="value"]`, then regenerate types and update usages.
The CLI writes the key into every theme file in sorted position, as in `node scripts/colours.js add button.marked "rgb(20, 163, 139)"`. A hand edit misses a theme or breaks the sort.

RENAME_KEY_THROUGH_CLI — Rename a key with `node scripts/colours.js rename <old-key> <new-key>`, previewing with `--dry-run` before updating spec usages.
The CLI changes every theme file the same way, which a hand edit often does not.

REMOVE_KEY_THROUGH_CLI — Remove keys with `node scripts/colours.js remove <key> [<key> ...]`, as in `node scripts/colours.js remove toaster.error`.
The CLI removes the key from every theme file, so no theme keeps a stale copy.

MERGE_DUPLICATE_KEYS — Merge duplicate keys by pointing every usage at one surviving key, then removing the others through the CLI.
Removing first leaves usages that point at nothing.

CHECK_DRIFT_BEFORE_EDITING — Check drift with `node scripts/colours.js sync --check` before edits, and run `sync` to sort and fill missing theme keys.
An edit on drifted files mixes your change with old drift in one diff.

VALIDATE_THROUGH_CLI — Validate grammar, flatness, sort order, prefixes, and values with the read-only `node scripts/colours.js validate`.
It catches theme drift that the type union, built from one theme only, cannot see.

PREVIEW_WITH_DRY_RUN — Preview add, remove, rename, or sync with `--dry-run`, and add `--json` when the output feeds a script.
A preview shows every file the change will touch before anything is written.

REFRESH_ACTIVE_MAP — Refresh the active map with `COLOUR_THEME=default npm run pretest` when specs must see a changed value.
Regenerating types alone leaves `colours.json` with the old values.

PASS_ARGS_AFTER_DOUBLE_DASH — Pass arguments to npm wrappers after `--`, as in `npm run colours:list -- --prefix=button. --json`.
Without `--`, npm takes the flags for itself and the script receives none.

READ_WITH_LITERAL_BRACKETS — Read colours with literal bracket access such as `colours['toaster.success']`, never with dot access or a built key.
Only a literal key is checked against `ColourKey`. A fallback such as `colours[key] || ''` hides a missing key until the assertion fails.

FILTER_KEYS_BY_PREFIX — Filter related keys with `Object.keys(colours).filter((key) => key.startsWith('button.'))`.
The scan then stays inside the typed keys, with no nested path to get wrong.

# Validation

SHAPE_KEY_AS_COMPONENT_STATE_CHECK — Verify every key matches `component.state` or `component.element.state` with `lowerCamelCase` segments and at most 4 segments.
KEEP_KEYS_FLAT_CHECK — Confirm theme files hold no nested objects, no duplicate keys, and keys in sorted order.
PREFIX_CHECK — Verify no key is a strict prefix of another key.
KEEP_ONE_KEY_PER_COLOUR_CHECK — Confirm no two keys hold the same value for one visual concept.
REGENERATE_TYPES_AFTER_CHANGE_CHECK — Confirm `colours.d.ts` was regenerated after any add, rename, or remove, and every referenced key is in the union.
READ_WITH_LITERAL_BRACKETS_CHECK — Confirm no dot access `colours.<PROP>`, fallback, or built key remains in specs or commands.
PATH_CHECK — Verify every path this skill names exists in the workspace.
