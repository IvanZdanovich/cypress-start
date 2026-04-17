# Spec-as-Requirement: Merging Requirements into Test Files

## Problem

Maintaining separate `.reqs.js` files alongside spec files creates:

- Double maintenance — every requirement change touches two files
- Sync drift — specs and requirements can contradict each other
- Onboarding overhead — new engineers must learn the `.reqs.js` system

## Solution

**The spec IS the requirement.** All metadata is attached via Cypress's native `{ req: {...} }` config object on `it()`
blocks. Titles stay clean and human-readable. A script extracts structured requirements from specs into JSON, YAML, or
Markdown for non-technical stakeholders.

---

## Architecture

```
BEFORE (three layers):
  .reqs.js (requirements)  →  .examples.js (examples)  →  .spec.js (tests)

AFTER (two layers):
  constraints.js (boundary values)  →  .examples.js (named examples)  →  .spec.js (tests = requirements)
                                                ↑                                  |
                                                └──── linked via req.example ──────┘
```

---

## The Traceability Chain

### How `it()` links to its test data example

The `req.example` field explicitly names the test data instance being exercised:

```javascript
// ─── constraints.js ──────────────────────────────────────
// cypress/support/constants/rb.booking.constraints.js
export const PRICE = {MIN: 1, MAX: 100_000, ZERO: 0};

// ─── examples.js ────────────────────────────────────────
// cypress/integration-examples/api/restful-booker.booking.api.examples.js
import {PRICE} from '../../support/constants/rb.booking.constraints';

export const booking_testData = {
    validBookings: {
        standard: {
            bookingId: String,
            firstname: utils.generateRandomString(8),
            totalPrice: utils.getRandomNumber(100, 1000),
            // ...
        },
        minimalPrice: {
            bookingId: String,
            firstname: utils.generateRandomString(6),
            totalPrice: PRICE.MIN,           // ← boundary value from constraints
            // ...
        },
    },
};

// ─── spec.js ─────────────────────────────────────────────
// cypress/integration/api/restful-booker.booking.api.spec.js

it(
    'RestfulBooker.Booking.Create.POST: Then return 200 status code and booking is created',
    {
        req: {
            p: 'P1',
            desc: 'POST /booking with a valid complete payload returns 200 OK and a numeric bookingid',
            example: 'validBookings.standard',
        },
    },
    () => {
        cy.restfullBooker__createBooking__POST(booking_testData.validBookings.standard).then((response) => {
            expect(response.status).to.eq(200);
        });
    },
);

it(
    'RestfulBooker.Booking.Create.POST: Then return 200 status code and booking is created with price of 1',
    {
        req: {
            p: 'P2',
            desc: 'totalprice minimum valid value is 1, booking at that boundary is accepted',
            example: 'validBookings.minimalPrice',
        },
    },
    () => {
        cy.restfullBooker__createBooking__POST(booking_testData.validBookings.minimalPrice).then((response) => {
            expect(response.status).to.eq(200);
            expect(response.body.booking.totalprice).to.eq(PRICE.MIN);
        });
    },
);

// Bug example — metadata in req, NOT in comments
it(
    'RestfulBooker.Booking.Create.POST: Then return 500 status code and Internal Server Error',
    {
        req: {
            p: 'P1',
            desc: 'POST /booking with a missing required field returns 500 Internal Server Error',
            bugs: ['BUG-BOOKING-002'],
            example: 'invalidBookings.missingRequired',
        },
    },
    () => {
        cy.restfullBooker__createBooking__POST(testData, {failOnStatusCode: false}).then((response) => {
            expect(response.status).to.eq(500);
        });
    },
);
```

### The chain at a glance

```
PRICE.MIN = 1                    (constraints.js — single source of truth)
    ↓
minimalPrice.totalPrice = PRICE.MIN   (examples.js — named example)
    ↓
req.example = 'validBookings.minimalPrice'  (spec.js — links it() to example)
    ↓
expect(totalprice).to.eq(PRICE.MIN)   (spec.js — assertion uses constraint)
```

---

## `req` Config Object — Schema

| Field           | Type                   | Required      | Description                                                    |
|-----------------|------------------------|---------------|----------------------------------------------------------------|
| `p`             | `'P1' \| 'P2' \| 'P3'` | ✅             | Priority: P1 critical, P2 important, P3 nice-to-have           |
| `desc`          | `string`               | ✅             | Requirement rule text — the "what should happen" description   |
| `example`       | `string`               | recommended   | Dot-path to the test data instance: `'validBookings.standard'` |
| `bugs`          | `string[]`             | if applicable | Bug IDs from `bug-log/bug-log.json`: `['BUG-BOOKING-002']`     |
| `preconditions` | `string[]`             | if applicable | Titles of requirements that must pass first                    |

### Minimal example

```javascript
it('Title: Then expected result', {req: {p: 'P1', desc: 'Rule text'}}, () => {
});
```

### Full example

```javascript
it('Title: Then expected result', {
    req: {
        p: 'P1',
        desc: 'POST /booking with valid payload returns 200 OK',
        example: 'validBookings.standard',
        bugs: ['BUG-BOOKING-002'],
        preconditions: ['auth token obtained', 'booking created'],
    },
}, () => {
});
```

---

## Constraints — Single Source of Truth

Boundary values that specs and test data share live in constraint files:

```
cypress/support/constants/
  http.js                        ← HTTP_STATUS, HTTP_METHODS, HTTP_BODY
  rb.booking.constraints.js      ← PRICE, LONG_STAY_MIN_DAYS, DATE_FORMAT, REQUIRED_FIELDS
```

Constraint files are imported in BOTH spec files and examples files — never hardcoded.

---

## ESLint Enforcement

### `verify-req-config` rule (new)

Validates every `it()` block has `{ req: { p, desc } }` as the second argument:

- `req.p` must be `'P1'`, `'P2'`, or `'P3'`
- `req.desc` must be a string ≥ 10 characters
- `req.bugs` (optional) must be an array of `BUG-MODULE-NNN` strings
- `req.example` (optional) must be a string

Enabled as `warn` during migration, flip to `error` after.

### No changes to title rules

Titles remain clean — the existing `verify-test-title-pattern`, `standardize-test-titles`, and
`verify-test-title-without-forbidden-symbols` rules are unchanged.

---

## Generated Output Examples

### YAML (for stakeholders)

```yaml
RestfulBooker.Booking:
  precondition: "No preconditions"
  requirements:
    - operation: Create
      method: POST
      priority: P1
      when: "valid booking data with all fields is provided"
      rule: "return 200 status code and booking is created"
      description: "POST /booking with a valid complete payload returns 200 OK and a numeric bookingid"
      example: "validBookings.standard"

    - operation: Create
      method: POST
      priority: P1
      when: "required field is missing"
      rule: "return 500 status code and Internal Server Error"
      description: "POST /booking with a missing required field returns 500 Internal Server Error"
      example: "invalidBookings.missingRequired"
      bugs:
        - BUG-BOOKING-002
```

### Markdown (for review)

| # | Method | Operation | Priority | When                   | Then                              | Example                         | Bugs            |
|---|--------|-----------|----------|------------------------|-----------------------------------|---------------------------------|-----------------|
| 1 | POST   | Create    | P1       | valid booking data     | return 200 and booking is created | validBookings.standard          |                 |
| 2 | POST   | Create    | P1       | required field missing | return 500 Internal Server Error  | invalidBookings.missingRequired | BUG-BOOKING-002 |

---

## Scripts

```bash
npm run req:extract          # JSON to stdout
npm run req:extract:yaml     # YAML file → reports/requirements.yaml
npm run req:extract:md       # Markdown → reports/requirements.md
npm run req:extract:json     # JSON → reports/requirements.json
```

---

## Migration Guide

### Phase 1 — Add `{ req: {...} }` to existing specs (file by file)

```javascript
// BEFORE:
// Bug Reference: BUG-BOOKING-002
it('RestfulBooker.Booking.Create.POST: Then return 500 status code and Internal Server Error', () => {

// AFTER:
    it('RestfulBooker.Booking.Create.POST: Then return 500 status code and Internal Server Error',
        {
            req: {
                p: 'P1',
                desc: 'POST /booking with missing required field returns 500',
                bugs: ['BUG-BOOKING-002'],
                example: 'invalidBookings.missingRequired'
            }
        },
        () => {
```

### Phase 2 — Create constraint files

Extract boundary constants from `.reqs.js` into `cypress/support/constants/{module}.constraints.js`. Update test data to
import from constraints.

### Phase 3 — Flip ESLint to error, delete `.reqs.js`

1. Change `verify-req-config` from `warn` to `error`
2. Run `npm run req:extract:yaml` to verify all requirements are captured
3. Delete `.reqs.js` files

---

## What Does NOT Change

- ✅ `describe`/`context` Given/When/Then title pattern
- ✅ Single assertion per `it`
- ✅ `before`/`after` cleanup hooks
- ✅ Test data files and naming conventions
- ✅ All globals: `l10n`, `colours`, `utils`, `urls`, `userRoles`, selectors
- ✅ Custom commands
- ✅ Bug logging in `bug-log/bug-log.json`
