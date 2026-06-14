---
name: define-constraints
description: Use when creating or updating Cypress API or UI constraint files that define reusable boundaries, formats, enums, required fields, durations, or display options.
---

# Principles

PURPOSE: centralize boundary values consumed by examples and specs
SCOPE: `cypress/constants/api/*.api.constraints.js`, `cypress/constants/ui/*.ui.constraints.js`
ACCESS: direct named imports — never exposed as globals
SEGMENTATION: one domain concept per constant, one module/page per file
SINGLE_OWNER: constraints are the authoritative source for all boundary values

# API constraints

LOCATION: `cypress/constants/api/module-name.api.constraints.js`
FILE_NAMES: kebab-case, one module per file
EXPORTS: named ES constants, SCREAMING_SNAKE_CASE
ENUMS: `Object.freeze()`
BOUNDARY_KEYS: `MIN`, `MAX`, `MIN_LENGTH`, `MAX_LENGTH`, `ZERO`
FIELD_LISTS: `REQUIRED_FIELDS`
FORMAT_KEYS: `DATE_FORMAT`

# UI constraints

LOCATION: `cypress/constants/ui/page-name.ui.constraints.js`
FILE_NAMES: kebab-case, one page/component per file
EXPORTS: named ES constants, SCREAMING_SNAKE_CASE
KEY_STYLE: camelCase object keys
BOUNDARY_TYPES: durations, character limits, item counts, display options
RUNTIME_VALUES: functions for localized labels and theme-dependent values

# Access pattern

IMPORT_STYLE: `import { CONSTANT } from '../../constants/api/module-name.api.constraints';`
NO_GLOBALS: each consumer imports only what it needs
TRACEABILITY: import path shows owning module/page
MIGRATION: replace legacy `reqs.` global with direct named import

```javascript
export const PRICE = Object.freeze({ MIN: 1, MAX: 100_000, ZERO: 0 });
export const FIRSTNAME = Object.freeze({ MIN_LENGTH: 1, MAX_LENGTH: 50 });
export const DATE_FORMAT = 'YYYY-MM-DD';
export const REQUIRED_FIELDS = ['firstname', 'lastname', 'totalprice', 'depositpaid', 'bookingdates.checkin', 'bookingdates.checkout'];
```

# Validation

PATH_CHECK: files exist under `cypress/constants`
NAMING_CHECK: SCREAMING_SNAKE_CASE constants, camelCase keys, kebab-case files
FREEZE_CHECK: enum objects wrapped in `Object.freeze()`
CONSUMER_CHECK: every constant consumed by at least one example or spec
IMPORT_CHECK: consumers use direct imports, never global access
