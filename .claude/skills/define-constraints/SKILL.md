---
name: define-constraints
description: Use when creating or updating API or UI constraint files for reusable boundaries, formats, enums, required fields, durations, or system constants.
---

# Intent

Produce constraint files where every boundary value lives once, in the file of the module or page that owns it.
When entries conflict or none applies, choose the option that keeps one owner per value and a visible import path.

# Reasoning Principles

KEEP_VALUE_IN_ONE_CONSTRAINT — Keep each boundary value in one constraint and let consumers import it.
A value copied across examples and specs drifts apart when one copy changes. The cost is an import in every consumer.

SPLIT_BY_CONCEPT — Split constraints into one domain concept per constant and one module or page per file.
A file that mixes concepts forces unrelated specs to load it and hides which spec owns which rule.

DERIVE_UI_FROM_API — Derive a UI display boundary from its API-validated counterpart and never restate it.
Two independent copies of one rule diverge without warning when the API tightens. The cost is a cross-layer import.

CLASSIFY_TIER_BEFORE_NAMING — Classify the ownership tier of a rule before choosing its filename.
Naming first puts the value in a file where no consumer expects it.

# Output Shape

PLACE_IN_CONSTANTS_FOLDERS — Place API constraints in `cypress/constants/api/*.api.constraints.js` and UI constraints in `cypress/constants/ui/*.ui.constraints.js`.
Consumers and reviewers look only in these folders, so a constraint elsewhere is missed and duplicated.

IMPORT_BY_NAME — Import constraints by name from their owning file, never through globals.
The import path then shows the owning module or page, as in the example below.

```js
import { CONSTANT } from '../../constants/api/module-name.api.constraints';
```

FILE_OWNED_RULES_BY_OWNER — File a boundary owned by one module or page in that owner's file, such as `module-name.api.constraints.js` or `page-name.ui.constraints.js`.
Ask which module or page owns the rule. Only when none does, the rule goes to the common tier.

RESERVE_COMMON_FOR_PROTOCOL — Reserve `common.api.constraints.js` and `common.ui.constraints.js` for protocol-level values used by two or more modules with no domain owner.
Examples are HTTP status codes and generic wire-level error messages. A constant used by only one module moves to that module's file, or common becomes a dumping ground.

PICK_ONE_KIND_PER_EXPORT — Pick exactly one kind for each export first, then apply the keys of that kind.
Mixed kinds make consumers guess which keys exist. The kinds and their shapes are listed below.

```
range        Object.freeze({ MIN, MAX })            add ZERO when zero has its own test meaning
length       Object.freeze({ MIN_LENGTH, MAX_LENGTH })
enum         Object.freeze({ ... })                 camelCase keys mapping name to value
field list   Object.freeze([...])                   string field paths, exported as REQUIRED_FIELDS
format       primitive string                       the pattern itself, such as DATE_FORMAT
count        primitive number                       the single boundary value
```

EXPORT_SCALAR_FOR_SINGLE_VALUE — Export a primitive for a single standalone boundary, and a frozen object only when two or more related keys belong together.
Wrapping one value in an object adds a lookup with no grouping benefit.

FREEZE_GROUPED_EXPORTS — Freeze ranges, lengths, enums, and field lists with `Object.freeze(...)`, and declare each constraint as `export const NAME = value`.
An unfrozen object can be changed by one spec and corrupt the value for every later spec in the run.

DERIVE_OUT_OF_RANGE_INLINE — Derive one-off invalid data inline in examples, such as `-PRICE.MAX`, instead of adding a constraint for it.
A constraint per invalid value bloats the file with values no rule owns.

USE_ZERO_AS_BELOW_MIN — Use `ZERO` as the below-minimum value when `ZERO < MIN`, and do not add a separate `BELOW_MIN` key.
Two keys for one value split the consumers between them.

NAME_EXPORTS_IN_SCREAMING_SNAKE — Name API and UI exports in `SCREAMING_SNAKE_CASE` and files in kebab-case, one module, page, or component per file.
Consistent names let a search find every constraint and its owner.

NAME_UI_KEYS_BY_KIND — Name camelCase UI keys with the kind words `total`, `min`, and `max`, not vague words like `limit` or `defaultValue`.
A vague key leaves the reader unsure which side of the boundary it holds.

LIMIT_UI_CONSTRAINTS_TO_DISPLAY — Limit UI constraints to durations, character limits, item counts, and display options.
Other values belong to an API constraint or to the example that uses them.

EXPORT_RUNTIME_AS_FUNCTIONS — Export localized labels and theme-dependent values as functions, not constants.
A constant reads the locale or theme once at import time and stays stale after a switch.

SPREAD_API_CONSTRAINT_IN_UI — Spread the imported API constraint in a UI display constant and add only presentation fields such as `decimalPlaces` or `currencySymbol`.
This keeps the boundary value owned by the API layer.

# Validation

PATH_CHECK — Verify every constraint file exists under `cypress/constants/api` or `cypress/constants/ui`.
NAMING_CHECK — Confirm constants use `SCREAMING_SNAKE_CASE`, keys use meaningful camelCase, and files use kebab-case.
FREEZE_CHECK — Verify every range, length, enum, and field-list export is wrapped in `Object.freeze()`.
CONSUMER_CHECK — Confirm every constant has at least one example or spec consumer or a named shared-domain purpose, and remove it otherwise.
IMPORT_CHECK — Confirm every consumer uses a direct named import and none reads a constraint through a global.
BOUNDARY_LITERAL_CHECK — Verify each boundary literal in specs against constraint ownership, since ESLint does not enforce `no-magic-numbers` and silence proves nothing.
