---
name: define-constraints
description: Use when defining or changing any reusable test boundary — min/max lengths, ranges, formats, regex, enums, allowed/required fields, status codes, durations, timeouts, display options, or valid/invalid value sets. Triggers on new constraint files, editing any `*.constraints.js` file under `cypress/constants/`, a hardcoded boundary/enum/format literal appearing in a spec or example, "add a validation rule", "what are the valid values", boundary or edge-case values, or duplicated limits that need one owner.
---

# Principles

SINGLE_OWNER: centralize each boundary value in one constraint and let consumers import it — otherwise the same value duplicated across examples and specs drifts apart
SEGMENTATION: one domain concept per constant, one module or page per file — otherwise a file mixing concepts forces unrelated specs to reload it and blurs which spec owns which rule
CROSS_LAYER_TRUTH: derive a UI display boundary from its API-validated counterpart, never restate it — otherwise two independent copies of the same rule diverge silently when the API tightens
TIER_BEFORE_NAME: classify a rule's ownership tier before choosing its filename — otherwise naming first lands the value in a file where no consumer expects it

# Method

## Placement

SCOPE: `cypress/constants/api/*.api.constraints.js`, `cypress/constants/ui/*.ui.constraints.js`
ACCESS: direct named imports, never exposed as globals — the import path shows the owning module or page
IMPORT_STYLE: `import { CONSTANT } from '../../constants/api/module-name.api.constraints';`

## File tiers

TIER_MODULE_PAGE: boundary owned by one module or page → `module-name.api.constraints.js`, `page-name.ui.constraints.js`
TIER_COMMON: protocol-level with no domain specificity → `common.api.constraints.js`, `common.ui.constraints.js`
TIER_DECISION: ask "which module or page owns this rule?" → if none, common
COMMON_SCOPE: protocol-level constants consumed by two or more modules with no single domain owner — HTTP status codes, generic wire-level error messages
COMMON_NOT_FOR: a constant used by only one module moves to that module's own file

## Constraint kinds

ONE_KIND: each export has exactly one kind — pick the kind first, then apply its keys
KIND_RANGE: `Object.freeze({ MIN, MAX })`; add `ZERO` when zero carries distinct semantic meaning
KIND_LENGTH: `Object.freeze({ MIN_LENGTH, MAX_LENGTH })`
KIND_ENUM: `Object.freeze({ ... })` camelCase keys mapping name → value
KIND_FIELD_LIST: `Object.freeze([...])` of string field paths, exported as `REQUIRED_FIELDS`
KIND_SCALAR_FORMAT: primitive string — the format pattern itself, e.g. `DATE_FORMAT`
KIND_SCALAR_COUNT: primitive number — the single boundary value
SCALAR_VS_OBJECT: scalar export for a single standalone boundary; frozen object only when two or more related keys belong together
OUT_OF_RANGE: derive inline in examples (e.g. `-PRICE.MAX`) for ad-hoc invalid data
ZERO_AS_BELOW_MIN: when `ZERO < MIN`, `ZERO` serves as `BELOW_MIN` — do not add a separate `BELOW_MIN` key

```javascript
export const PRICE = Object.freeze({ MIN: 1, MAX: 100_000, ZERO: 0 });
export const FIRSTNAME = Object.freeze({ MIN_LENGTH: 1, MAX_LENGTH: 50 });
export const DATE_FORMAT = 'YYYY-MM-DD';
export const REQUIRED_FIELDS = Object.freeze(['firstname', 'lastname', 'totalprice', 'depositpaid', 'bookingdates.checkin', 'bookingdates.checkout']);
```

## Naming

API_EXPORTS: named ES constants, SCREAMING_SNAKE_CASE
UI_EXPORTS: named ES constants, SCREAMING_SNAKE_CASE
FILE_NAMES: kebab-case, one module, page, or component per file
UI_KEY_STYLE: camelCase object keys drawn from the constraint kind vocabulary (`total`, `min`, `max`) — not arbitrary names like `limit` or `defaultValue`

## UI specifics

UI_BOUNDARY_TYPES: durations, character limits, item counts, display options
RUNTIME_VALUES: functions for localized labels and theme-dependent values
CROSS_LAYER: when a UI constant represents the display face of an API-validated field, import the API constraint and derive from it — do not duplicate the boundary value

```javascript
// UI constraint referencing its API counterpart
import { PRICE } from '../api/rb.booking.api.constraints';

export const PRICE_DISPLAY = Object.freeze({ ...PRICE, decimalPlaces: 2, currencySymbol: '$' });
```

# Validation

PATH_CHECK: files exist under `cypress/constants`
NAMING_CHECK: SCREAMING_SNAKE_CASE constants, semantically-meaningful camelCase keys, kebab-case files
FREEZE_CHECK: enum and field-list objects wrapped in `Object.freeze()`
CONSUMER_CHECK: every constant consumed by at least one example or spec
IMPORT_CHECK: consumers use direct imports, never global access
MAGIC_NUMBER_CHECK: `no-magic-numbers: warn` on all `*.spec.js` — a spec warning means a boundary value is missing from a constraint file
