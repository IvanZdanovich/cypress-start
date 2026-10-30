---
paths:
  - 'cypress/constants/**/*.constraints.js'
---

# Reasoning Principles

SPLIT_BY_CONCEPT — Split constraints into one domain concept per constant and one module or page per file.
A file that mixes concepts forces unrelated specs to load it and hides which spec owns which rule. The cost is more, smaller files.

DERIVE_UI_FROM_API — Derive a UI display boundary from its API-validated counterpart and never restate it.
Two independent copies of one rule diverge without warning when the API tightens. The cost is a cross-layer import.

# Output Shape

PLACE_IN_CONSTANTS_FOLDERS — Place API constraints in `cypress/constants/api/*.api.constraints.js` and UI constraints in `cypress/constants/ui/*.ui.constraints.js`.
Consumers and reviewers look only in these folders, so a constraint elsewhere is missed and duplicated.

FILE_OWNED_RULES_BY_OWNER — File a boundary owned by one module or page in that owner's file, such as `module-name.api.constraints.js` or `page-name.ui.constraints.js`.
Ask which module or page owns the rule before choosing the filename. Naming first puts the value in a file where no consumer expects it.

NAME_SHARED_FILES_BY_DOMAIN — Name a file for a boundary that several modules or pages enforce after the domain concept, as `domain-name.api.constraints.js` or `domain-name.ui.constraints.js`.
A file named after one consumer makes that consumer look like the owner of shared truth.

RESERVE_COMMON_FOR_PROTOCOL — Reserve `common.api.constraints.js` and `common.ui.constraints.js` for protocol-level values used by two or more modules with no domain owner.
Examples are HTTP status codes and generic wire-level error messages. A constant used by only one module moves to that module's file, or common becomes a dumping ground.

PICK_ONE_KIND_PER_EXPORT — Pick exactly one kind for each export first, then apply the keys of that kind.
Mixed kinds make consumers guess which keys exist. The kinds and their shapes are listed below.

```
range        { MIN, MAX }                           add ZERO when zero has its own test meaning
length       { MIN_LENGTH, MAX_LENGTH }
enum         { ... }                                camelCase keys mapping name to value
field list   [...]                                  string field paths, exported as REQUIRED_FIELDS
format       primitive string                       the pattern itself, such as DATE_FORMAT
count        primitive number                       the single boundary value
```

EXPORT_SCALAR_FOR_SINGLE_VALUE — Export a primitive for a single standalone boundary, and an object only when two or more related keys belong together.
Wrapping one value in an object adds a lookup with no grouping benefit.

DECLARE_READ_ONLY_EXPORTS — Declare each constraint as `export const NAME = value`, and let consumers copy it with a spread before changing anything.
A spec that writes to a shared object corrupts the value for every later spec in the run. `Object.freeze` is optional, because it locks only the top level. The cost is that nothing stops a write at run time.

USE_ZERO_AS_BELOW_MIN — Use `ZERO` as the below-minimum value when `ZERO < MIN`, and add no separate `BELOW_MIN` key.
Two keys for one value split the consumers between them.

NAME_EXPORTS_IN_SCREAMING_SNAKE — Name API and UI exports in `SCREAMING_SNAKE_CASE` and files in kebab-case, one module, page, or component per file.
Consistent names let a search find every constraint and its owner.

NAME_UI_KEYS_BY_KIND — Name camelCase UI keys with the kind words `total`, `min`, and `max`, not vague words like `limit` or `defaultValue`.
A vague key leaves the reader unsure which side of the boundary it holds.

LIMIT_UI_CONSTRAINTS_TO_DISPLAY — Limit UI constraints to durations, character limits, item counts, and display options.
Other values belong to an API constraint or to the example that uses them.

EXPORT_RUNTIME_AS_FUNCTIONS — Export localized labels and theme-dependent values as functions, not constants.
A constant reads the locale or theme once at import time and stays stale after a switch. The cost is a call at every use.

SPREAD_API_CONSTRAINT_IN_UI — Spread the imported API constraint in a UI display constant and add only presentation fields such as `decimalPlaces` or `currencySymbol`.
This keeps the boundary value owned by the API layer.

# Validation

PATH_CHECK — Verify every constraint file exists under `cypress/constants/api` or `cypress/constants/ui`.
NAMING_CHECK — Confirm constants use `SCREAMING_SNAKE_CASE`, keys use meaningful camelCase, and files use kebab-case.
MUTATION_CHECK — Verify no spec, example, or command assigns to a constraint export or to one of its keys.
KIND_CHECK — Confirm each export matches exactly one kind in `PICK_ONE_KIND_PER_EXPORT` and uses only its keys.
CONSUMER_CHECK — Confirm every constant has at least one example or spec consumer or a named shared-domain purpose, and remove it otherwise.
