---
name: define-constraints
description: Use when creating or updating Cypress API or UI constraint files that define reusable boundaries, formats, enums, required fields, durations, or display options.
---

# Principles

PURPOSE: centralize boundary values consumed by examples and specs
SCOPE: `cypress/constants/api/*.api.constraints.js`, `cypress/constants/ui/*.ui.constraints.js`
ACCESS: direct named imports — never exposed as globals
SEGMENTATION: one domain concept per constant, one module/page per file, one domain concept per domain file when the same rule spans multiple modules or pages
SINGLE_OWNER: constraints are the authoritative source for all boundary values

# Constraint kinds

Each export has exactly one kind; pick the kind first, then apply its key rules.

| Kind          | Shape                    | Required keys                                                                                                                                   |
|---------------|--------------------------|-------------------------------------------------------------------------------------------------------------------------------------------------|
| range         | `Object.freeze({ ... })` | `MIN`, `MAX`; add `ZERO` when zero has distinct semantic meaning; add `ABOVE_MAX`/`BELOW_MIN` only when a test scenario explicitly targets them |
| length        | `Object.freeze({ ... })` | `MIN_LENGTH`, `MAX_LENGTH`                                                                                                                      |
| enum          | `Object.freeze({ ... })` | camelCase keys mapping name → value                                                                                                             |
| field-list    | `Object.freeze([...])`   | string field paths                                                                                                                              |
| scalar-format | primitive string         | the format pattern itself                                                                                                                       |
| scalar-count  | primitive number         | the single boundary value                                                                                                                       |

OUT_OF_RANGE: declare `ABOVE_MAX = MAX + 1` / `BELOW_MIN = MIN - 1` in the constraint only when a named test scenario
targets that value; derive inline in examples (e.g. `-PRICE.MAX`) for ad-hoc invalid data
ZERO_AS_BELOW_MIN: when `ZERO < MIN`, `ZERO` serves as `BELOW_MIN` — do not add a separate `BELOW_MIN` key
SCALAR_VS_OBJECT: use a scalar export for a single standalone boundary; use a frozen object only when two or more
related keys belong together

# File tiers

Three tiers apply to both API and UI constraints. Assign the tier before naming the file.

| Tier | When to use | File pattern |
|---|---|---|
| Module / page | Boundary owned by one module or page | `module-name.api.constraints.js`, `page-name.ui.constraints.js` |
| Domain | Same business rule independently enforced on multiple modules or pages | `domain-name.api.constraints.js`, `domain-name.ui.constraints.js` |
| Common | Protocol-level, no domain specificity | `common.api.constraints.js`, `common.ui.constraints.js` |

TIER_DECISION: ask "which module or page owns this rule?" → if none, ask "which domain concept does it describe?" → if none, common
DOMAIN_SIGNAL: same business rule independently enforced on two or more pages or modules — the constraint is not borrowed from one page by another; each page enforces it on its own
NOT_DOMAIN: a constant defined on one page and imported by another spec for that page's data — that remains a page constraint

# API constraints

LOCATION: `cypress/constants/api/module-name.api.constraints.js`
FILE_NAMES: kebab-case, one module per file
EXPORTS: named ES constants, SCREAMING_SNAKE_CASE
ENUMS: `Object.freeze()`
BOUNDARY_KEYS: `MIN`, `MAX`, `MIN_LENGTH`, `MAX_LENGTH`, `ZERO`, `ABOVE_MAX`, `BELOW_MIN`
FIELD_LISTS: `REQUIRED_FIELDS`
FORMAT_KEYS: `DATE_FORMAT`

# Common API constraints

LOCATION: `cypress/constants/api/common.api.constraints.js`
SCOPE: protocol-level constants consumed by ≥2 modules with no single domain owner — HTTP status codes, generic
wire-level error messages
NOT_FOR: domain-specific values that belong to one module; those live in that module's own file
RULE: if only one module uses a constant, move it to that module's constraint file

# UI constraints

LOCATION: `cypress/constants/ui/page-name.ui.constraints.js`
FILE_NAMES: kebab-case, one page/component per file
EXPORTS: named ES constants, SCREAMING_SNAKE_CASE
KEY_STYLE: camelCase object keys; use semantically-meaningful keys from the constraint kind vocabulary (`total`, `min`,
`max`) — not arbitrary names like `limit` or `defaultValue`
BOUNDARY_TYPES: durations, character limits, item counts, display options
RUNTIME_VALUES: functions for localized labels and theme-dependent values
CROSS_LAYER: when a UI constant represents the display face of an API-validated field, import the API constraint and
derive from it — do not duplicate the boundary value

```javascript
// UI constraint referencing its API counterpart
import {PRICE} from '../api/rb.booking.api.constraints';

export const PRICE_DISPLAY = Object.freeze({...PRICE, decimalPlaces: 2, currencySymbol: '$'});
```

# Access pattern

IMPORT_STYLE: `import { CONSTANT } from '../../constants/api/module-name.api.constraints';`
NO_GLOBALS: each consumer imports only what it needs
TRACEABILITY: import path shows owning module/page
MIGRATION: replace legacy `reqs.` global with direct named import
COMPLETENESS: every field that appears in a named boundary scenario in examples (`AtMaxLength`, `OverMaxLength`,
`WithMinimalPrice`, etc.) must have a corresponding constraint entry — do not use bare literals for boundary values in
examples or specs

```javascript
export const PRICE = Object.freeze({MIN: 1, MAX: 100_000, ZERO: 0});
export const FIRSTNAME = Object.freeze({MIN_LENGTH: 1, MAX_LENGTH: 50});
export const DATE_FORMAT = 'YYYY-MM-DD';
export const REQUIRED_FIELDS = Object.freeze(['firstname', 'lastname', 'totalprice', 'depositpaid', 'bookingdates.checkin', 'bookingdates.checkout']);
```

# Validation

PATH_CHECK: files exist under `cypress/constants`
NAMING_CHECK: SCREAMING_SNAKE_CASE constants, semantically-meaningful camelCase keys, kebab-case files
FREEZE_CHECK: enum and field-list objects wrapped in `Object.freeze()`
CONSUMER_CHECK: every constant consumed by at least one example or spec
IMPORT_CHECK: consumers use direct imports, never global access
MAGIC_NUMBER_CHECK: `no-magic-numbers: warn` is enabled on all `*.spec.js` files — a warning in a spec means a boundary
value is missing from a constraint file
