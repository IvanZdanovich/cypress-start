---
name: localization-testing
description: Use when asserting localized UI text or maintaining flat `l10n` keys across locale JSON, generated types, Cypress specs, and commands.
---

# Intent

Produce text assertions that read every expected string from one flat, typed key per concept, so a wording change needs one edit.
When entries conflict or none applies, choose the option that keeps one key per concept and fails loudly on a bad key.

# Reasoning Principles

TREAT_KEY_AS_CONTRACT — Treat the flat key string as the shared contract between the frontend and the tests.
Without one agreed key, the two code bases drift with no single place to join them again. The cost is a key lookup on every text assertion.

KEEP_KEYS_FLAT — Keep keys as flat dot-namespaced strings, never nested objects.
Nested keys break translation lookup and are missed by the type union.

KEEP_ONE_KEY_PER_CONCEPT — Keep exactly one key per concept and merge identical strings for that concept into it.
Two keys for one concept let a wording change fix half the usages and leave the rest stale.

RENAME_KEYS_ONE_TO_ONE — Rename each old key to exactly one new key and update every usage in the same change.
A dangling reference passes locally and breaks in another language or run.

NORMALIZE_SPELLINGS — Normalize inconsistent source spellings to one form per concept.
Mixed spellings split one concept across several keys and defeat reuse.

# Output Shape

EDIT_LOCALE_FILES_ONLY — Edit strings only in the locale files `cypress/localization/{lang}-localization.json`, as flat `"dotted.key": "value"` entries.
These hand-edited files are the source of truth. A string kept anywhere else is missed when the wording changes.

LEAVE_ACTIVE_MAP_GENERATED — Leave `cypress/localization/l10n.json` to the generator and never edit it by hand.
Pretest copies the `LANGUAGE` locale file there through `node scripts/l10n.js activate` and exposes it as the global `l10n`. A hand edit is lost on the next run.

REGENERATE_TYPES_AFTER_CHANGE — Regenerate `cypress/support/l10n.d.ts` with `npm run l10n:gen-types` after any add, remove, rename, or sync.
It types `l10n` as `Record<L10nKey, string>` from `en-localization.json`, so a bad key becomes a type error. Pretest also runs it, and the CLI `validate` and `sync` catch drift in other languages.

ADD_KEY_FOR_NEW_STRING — Add a key when the app gains a user-facing string or a spec asserts literal UI text, then replace the literal.
A literal skips the active language and breaks when the wording changes.

FIX_MISSING_KEY — Fix a reference that shows a type error or returns undefined by adding the key or correcting the name.
Otherwise the assertion compares the element against undefined and fails for a reason unrelated to the text.

UPDATE_VALUE_ON_WORDING_CHANGE — Update the value in place when the frontend changes the text, and split the key when its meaning splits.
One key with two meanings forces a wrong string on one of them.

RENAME_MISFIT_KEY — Rename a key that breaks the grammar, scope, or depth rules below.
A misfit key cannot be found by prefix search and invites a duplicate.

REMOVE_DEAD_KEY — Remove a key that specs, commands, and the frontend no longer use, after a search confirms no usage.
Dead keys hide which strings the tests really cover. Removing a key that is still used breaks the type check.

RESTRUCTURE_PREFIX_COLLISION — Restructure a new key that would make an existing key its prefix, such as `a.b` beside `a.b.c`.
A key that is also a prefix breaks flatness, and `validate` rejects it.

ASSERT_LANGUAGE_FROM_ACTIVE_MAP — Assert `l10n['key']` in a language-switch spec run with the target `LANGUAGE`, never a literal translation.
The expected text then comes from the active language, so one spec covers every language.

SHAPE_KEY_AS_FEATURE_PATH — Shape keys as `feature.area.element[.role]` with `lowerCamelCase` segments, 3–4 segments preferred, and 5 at most.
Five segments are for table headers and option groups only. Deeper keys are hard to scan and usually mix two concepts.

END_KEY_WITH_ROLE — End the key with a role from the lists below when the string has one.
A key named after its English text loses its meaning when the wording changes.

```
presentational  title, label, placeholder, hint, tooltip, message, option, column, tab, empty
validation      required, maxLength, minLength, duplicate, invalid, specialChars
```

GROUP_FIELD_STRINGS — Group all strings of one field under `feature.area.field.*`.
Scattered field strings make one field change touch several unrelated prefixes.

PROMOTE_SHARED_STRINGS — Promote a string to `common.*` only when it is identical everywhere and tied to a reusable component or domain noun.
Otherwise keep it under the owning feature. This test keeps shared strings single-sourced without turning `common` into a dumping ground.

```
common.button.*                  identical buttons
common.validation.specialChars   shared special-characters message
common.<component>.*             reusable components such as filter, paginator, list
common.entity.*                  domain noun labels reused across filters, tables, forms
common.status.*, common.priority.*, common.language.*, common.accessLevel.*, common.scoringType.*
common.toast.title.*             generic toast titles
```

LIST_KEYS_BEFORE_ADDING — List existing keys with `node scripts/l10n.js list --prefix=<prefix> --json` before adding a new concept, and reuse a match.
Without the search, a near-duplicate key is added for a concept that already exists.

ADD_KEY_THROUGH_CLI — Add a key with `node scripts/l10n.js add <key> <english-value> [--<lang>="value"]`, then regenerate types and update usages.
The CLI writes the key into every locale file in sorted position, as in `node scripts/l10n.js add common.button.save "Save"`. A hand edit misses a language or breaks the sort.

RENAME_KEY_THROUGH_CLI — Rename a key with `node scripts/l10n.js rename <old-key> <new-key>`, previewing with `--dry-run`, then update every `l10n['old']` usage.
The CLI changes every locale file the same way, which a hand edit often does not.

REMOVE_KEY_THROUGH_CLI — Remove keys with `node scripts/l10n.js remove <key> [<key> ...]`, as in `node scripts/l10n.js remove common.button.exportPdf`.
The CLI removes the key from every locale file, so no language keeps a stale copy.

MERGE_DUPLICATE_KEYS — Merge duplicate keys by promoting the survivor when shared, pointing every usage at it, then removing the others through the CLI.
Removing first leaves usages that point at nothing.

PICK_ONE_SPELLING — Pick one spelling per concept, and log real wording defects in `bug-log/`.
Use `toast` over `toaster` or `Toastr`, `common.list.noResults` over result-not-found variants, `create` over `creation`, and `{{var}}` over `{var}`. The log keeps product defects visible after the tests adapt.

CHECK_DRIFT_BEFORE_EDITING — Check drift with `node scripts/l10n.js sync --check` before edits, and run `sync` to sort and fill missing locale keys.
An edit on drifted files mixes your change with old drift in one diff.

VALIDATE_THROUGH_CLI — Validate grammar, flatness, sort order, prefixes, and values with the read-only `node scripts/l10n.js validate`.
It catches drift in other languages that the type union, built from English only, cannot see.

PREVIEW_WITH_DRY_RUN — Preview add, remove, rename, or sync with `--dry-run`, and add `--json` when the output feeds a script.
A preview shows every file the change will touch before anything is written.

REFRESH_ACTIVE_MAP — Refresh the active map with `LANGUAGE=en npm run pretest` when specs must see a changed value.
Regenerating types alone leaves `l10n.json` with the old strings.

PASS_ARGS_AFTER_DOUBLE_DASH — Pass arguments to npm wrappers after `--`, as in `npm run l10n:list -- --prefix=common.button. --json`.
Without `--`, npm takes the flags for itself and the script receives none. Another example is `npm run l10n:rename -- itemList.title itemList.page.title --dry-run`.

READ_WITH_LITERAL_BRACKETS — Read strings with literal bracket access such as `l10n['itemList.title']`, never through `t()`, `tGroup()`, nested access, or a built key.
Only a literal key is checked against `L10nKey`, so a renamed key fails at dev time. A fallback such as `l10n[key] || ''` hides a missing key until the assertion fails.

FILTER_KEYS_BY_PREFIX — Filter related keys with `Object.keys(l10n).filter((key) => key.startsWith('common.status.'))`.
The scan then stays inside the typed keys, with no wrapper or nested path to get wrong.

# Validation

SHAPE_KEY_AS_FEATURE_PATH_CHECK — Verify every key matches `feature.area.element[.role]` with `lowerCamelCase` segments and at most 5 segments.
KEEP_KEYS_FLAT_CHECK — Confirm locale files hold no nested objects, no duplicate keys, and keys in sorted order.
PREFIX_CHECK — Verify no key is a strict prefix of another key.
KEEP_ONE_KEY_PER_CONCEPT_CHECK — Confirm no two keys share one concept, no key spans differing wording, and no key is named after its English text.
REGENERATE_TYPES_AFTER_CHANGE_CHECK — Confirm `l10n.d.ts` was regenerated after any add, rename, or remove, and every referenced key is in the union.
READ_WITH_LITERAL_BRACKETS_CHECK — Confirm no `t()`, `tGroup()`, nested `l10n.<path>` access, fallback, or built key remains in specs or commands.
PICK_ONE_SPELLING_CHECK — Verify each concept uses one spelling and placeholder defects are logged in `bug-log/`.
PATH_CHECK — Verify every path this skill names exists in the workspace.
