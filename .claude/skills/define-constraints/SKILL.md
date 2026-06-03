---
name: define-constraints
description: Use when creating or updating Cypress API or UI constraint files that define reusable boundaries, formats, enums, required fields, durations, or display options.
---

# Define constraints

PURPOSE: centralize boundary values consumed by examples and specs
SCOPE: `cypress/constants/api/*.api.constraints.js`, `cypress/constants/ui/*.ui.constraints.js`
BOUNDARY_SOURCE: imported by examples and specs

# API constraints

LOCATION: `cypress/constants/api/module-name.api.constraints.js`
FILE_NAMES: kebab-case, one module per file
EXPORTS: named ES constants
CONSTANT_STYLE: SCREAMING_SNAKE_CASE
ENUMS: `Object.freeze()`
BOUNDARY_KEYS: `MIN`, `MAX`, `MIN_LENGTH`, `MAX_LENGTH`, `ZERO`
FIELD_LISTS: `REQUIRED_FIELDS`
FORMAT_KEYS: `DATE_FORMAT`
VALUES: static, domain-specific, locally scoped
DOMAIN_SCOPE: one domain concept per constant
IMPORT_STYLE: `import { PRICE, FIRSTNAME } from '../../constants/api/module-name.api.constraints';`

# UI constraints

LOCATION: `cypress/constants/ui/page-name.ui.constraints.js`
FILE_NAMES: kebab-case, one page or component per file
EXPORTS: named ES constants
CONSTANT_STYLE: SCREAMING_SNAKE_CASE
KEY_STYLE: camelCase object keys
BOUNDARY_TYPES: durations, character limits, item counts, display options
VALUES: static values plus runtime references
RUNTIME_VALUES: functions for localized labels and theme-dependent values
IMPORT_STYLE: `import { UI_CONSTRAINTS } from '../../constants/ui/common.ui.constraints';`

# Traceability

CONSTRAINT_USE: examples build payload fields from constraints
SPEC_USE: titles and assertions reference constraints for expected values
TITLE_VALUES: interpolate constraint values in spec titles for boundary scenarios
REVIEW_CHAIN: constraint constant to example key to context title to assertion

# Readability

NAME_STYLE: explicit domain concept names, stable boundary names
GROUPING: related constants together, blank lines between domains
MAINTENANCE: update one constraint to update all consuming examples and specs
GUARDRAILS: static API values, runtime UI functions, named exports, direct imports

```javascript
export const PRICE = Object.freeze({ MIN: 1, MAX: 100_000, ZERO: 0 });
export const FIRSTNAME = Object.freeze({ MIN_LENGTH: 1, MAX_LENGTH: 50 });
export const DATE_FORMAT = 'YYYY-MM-DD';
export const REQUIRED_FIELDS = [
  'firstname',
  'lastname',
  'totalprice',
  'depositpaid',
  'bookingdates.checkin',
  'bookingdates.checkout',
];
```

