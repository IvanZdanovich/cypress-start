# Constraints → Examples → Specs: The Testing Approach

## Core Idea

**The spec IS the requirement.** There are no separate requirement files, no mapping matrices, no magic
numbers. The Given/When/Then title structure across `describe`, `context`, and `it` blocks forms the
complete, human-readable requirement statement — executable, verifiable, and always in sync with the code.

Every requirement lives in exactly one place: the spec file. Every boundary value lives in exactly one place:
the constraint file. Every test payload lives in exactly one place: the named example instance.
Nothing is duplicated. Nothing can drift.

```
constraints.js           →     examples.js              →     spec.js
(boundary values)              (named data instances)         (tests = live requirements)

domain min/max,                one instance per               executable Given/When/Then
field lists, formats           boundary scenario              assertion + req metadata
```

---

## Why This Architecture

### The Problem with Separate Requirement Files

Traditional approaches maintain `.reqs.js` files (or test management tools) alongside spec files:

- **Double maintenance** — every requirement change must be applied in two places
- **Silent drift** — specs and requirements contradict each other with no automated detection
- **Magic numbers** — hardcoded boundary values (`50`, `100`, `'2026-01-01'`) with no traceable origin
- **Stale requirements** — documented requirements no longer reflect what is actually tested
- **Mapping overhead** — requirement-to-test traceability matrices become a maintenance burden of their own
- **Progress opacity** — no reliable way to measure what percentage of requirements are covered and verified

### What This Approach Delivers

**Live documentation.** The requirement statement is the test title. When the test passes, the requirement
is verified. The spec file IS the requirement document — always current, never outdated.

**No magic numbers.** Every boundary value (`PRICE.MIN`, `FIRSTNAME.MAX_LENGTH`) is declared once in a
constraint file and referenced by name everywhere — in titles, in test data, in assertions. Changing a
boundary value is a one-line edit with full propagation.

**Accurate progress measurement.** Because requirements exist only as `it()` blocks with
metadata, coverage is computed directly from the test suite.

**Single source of truth — verifiable by design.** Requirements cannot become stale because they are
executable. A passing test suite is proof that the stated requirements hold. A failing test is an
immediately actionable signal, not a documentation discrepancy to investigate.

**Lightweight and sustainable.** No extra file type to learn. No synchronisation rituals. No tooling
beyond the ESLint rules already enforcing naming and structure. The entire approach fits inside the
existing Cypress + JavaScript stack.

> This is the most direct, maintainable, and auditable approach available in modern test automation:
> requirements that prove themselves on every CI run.

---

## Layer 1 — Constraints (Single Source of Truth)

Boundary values shared between specs and examples live in constraint files:

```
cypress/constants/
  api/
    rb.booking.api.constraints.js   ← PRICE, LONG_STAY_MIN_DAYS, DATE_FORMAT, REQUIRED_FIELDS
    {module}.api.constraints.js     ← one file per API module
  ui/
    {page}.ui.constraints.js        ← one file per UI page (field lengths, counts, etc.)
```

**Rules:**
- Imported directly in BOTH spec files and examples files — never hardcoded
- Represent domain boundaries (min/max values, formats, field lists)
- Plain ES module named exports — no global injection

**Template:**

```javascript
// cypress/constants/api/rb.booking.api.constraints.js
export const PRICE = { MIN: 1, MAX: 100_000, ZERO: 0 };
export const FIRSTNAME = { MIN_LENGTH: 1, MAX_LENGTH: 50 };
export const DATE_FORMAT = 'YYYY-MM-DD';
export const REQUIRED_FIELDS = [
    'firstname', 'lastname', 'totalprice', 'depositpaid',
    'bookingdates.checkin', 'bookingdates.checkout',
];
```

---

## Layer 2 — Named Examples (Test Data)

### File Layout

Mirror the spec file structure:

```
cypress/integration-examples/
  api/
    rb.booking.api.examples.js     ← mirrors cypress/integration/api/rb.booking.api.spec.js
  ui/
    inventory.ui.examples.js       ← mirrors cypress/integration/ui/inventory.ui.spec.js
cypress/e2e-examples/
  ui/
    purchasing.complete-purchase.ui.examples.js  ← mirrors cypress/e2e/ui/purchasing.complete-purchase.ui.spec.js
```

### Instance Naming Convention

Instance names describe the **boundary condition or purpose**, not the values:

```
{entity}__{field}__{BoundaryCondition}
```

The double underscore (`__`) separates the three segments — consistent with the `__` convention used in
Cypress command names (`entity__operation__METHOD`).

| Suffix             | Meaning                                      |
|--------------------|----------------------------------------------|
| `AtMaxLength`      | Valid — exactly at the upper character limit |
| `OverMaxLength`    | Invalid — one step over the upper limit      |
| `AtMinLength`      | Valid — exactly at the lower character limit |
| `UnderMinLength`   | Invalid — one step under the lower limit     |
| `MinimalPrice`     | Boundary minimum value for a numeric field   |
| `MaximalPrice`     | Boundary maximum value for a numeric field   |
| `Missing`          | Required field intentionally absent          |
| `Duplicate`        | Conflicts with an existing record            |
| `ForbiddenChar`    | Contains a disallowed character              |
| `SameDayCheckout`  | Edge-case date scenario                      |

**❌ Avoid:** `item1`, `data1`, `test1`, `validBooking1`, `booking2`

### Structure Rules

- **Group** instances by scenario category: `validBookings`, `invalidBookings`, `edgeCases`, etc.
- **Annotate** every instance with a `// Boundary:` comment explaining the scenario
- **Import** boundary values from constraint files — never hardcode them
- **Use `utils`** for all dynamic data (strings, numbers, dates, booleans)
- **Declare ID fields as `String`** placeholder — assign immediately after creation in spec
- **Include `namePrefix`** at the root for cleanup identification (`Prefix.Purpose`)

### Full Example

```javascript
// cypress/integration-examples/api/rb.booking.api.examples.js
import { PRICE, FIRSTNAME, REQUIRED_FIELDS } from '../../constants/api/rb.booking.api.constraints';

export const booking_examples = {
    namePrefix: 'API.Booking',

    validBookings: {
        standard: {
            // Boundary: all fields present, price within range — must be accepted
            bookingId: String,
            firstname: `API.Booking.${utils.generateRandomString(6)}`,
            lastname: utils.generateRandomString(8),
            totalprice: utils.getRandomNumber(PRICE.MIN, PRICE.MAX),
            depositpaid: true,
            bookingdates: {
                checkin: utils.getFutureDate(7),
                checkout: utils.getFutureDate(14),
            },
            additionalneeds: 'Breakfast',
        },

        minimalPrice: {
            // Boundary: totalprice = PRICE.MIN (1) — lowest accepted value
            bookingId: String,
            firstname: `API.Booking.${utils.generateRandomString(6)}`,
            lastname: utils.generateRandomString(8),
            totalprice: PRICE.MIN,
            depositpaid: true,
            bookingdates: {
                checkin: utils.getFutureDate(1),
                checkout: utils.getFutureDate(7),
            },
        },

        firstname__AtMaxLength: {
            // Boundary: firstname = FIRSTNAME.MAX_LENGTH characters — must be accepted
            bookingId: String,
            firstname: utils.extendStringWithPrefix('API.Booking', FIRSTNAME.MAX_LENGTH),
            lastname: utils.generateRandomString(8),
            totalprice: utils.getRandomNumber(PRICE.MIN, PRICE.MAX),
            depositpaid: utils.getRandomBoolean(),
            bookingdates: {
                checkin: utils.getFutureDate(1),
                checkout: utils.getFutureDate(7),
            },
        },
    },

    invalidBookings: {
        missingRequired: {
            // Boundary: one randomly selected required field omitted per run
            baseBooking: {
                firstname: `API.Booking.${utils.generateRandomString(6)}`,
                lastname: utils.generateRandomString(8),
                totalprice: utils.getRandomNumber(PRICE.MIN, PRICE.MAX),
                depositpaid: true,
                bookingdates: {
                    checkin: utils.getFutureDate(1),
                    checkout: utils.getFutureDate(7),
                },
            },
            requiredFields: REQUIRED_FIELDS,
        },

        firstname__OverMaxLength: {
            // Boundary: firstname exceeds FIRSTNAME.MAX_LENGTH — must be rejected
            bookingId: String,
            firstname: utils.extendStringWithPrefix('API.Booking', FIRSTNAME.MAX_LENGTH + 1),
            lastname: utils.generateRandomString(8),
            totalprice: utils.getRandomNumber(PRICE.MIN, PRICE.MAX),
            depositpaid: true,
            bookingdates: {
                checkin: utils.getFutureDate(1),
                checkout: utils.getFutureDate(7),
            },
        },
    },
};
```

---

## Layer 3 — Spec Files (Tests = Live Requirements)

### Title Structure

The full requirement is assembled from three title blocks:

| Block       | Requirement Part | Content                                                 |
|-------------|------------------|---------------------------------------------------------|
| `describe`  | **Given**        | Initial state / preconditions                           |
| `context`   | **When**         | Current operation or boundary condition being exercised |
| `it` title  | **Then**         | Observable outcome — one assertion per `it`             |
| `req.state` | **State**        | Accumulated prior state in stateful sequences           |

Constraint values belong in titles — never hardcoded:

```javascript
// ❌ context('When booking with price of 1 is provided', ...)
// ✅ context(`When booking with price of ${PRICE.MIN} is provided`, ...)
```

### `req` Config Object

Every `it()` takes `{ req: {...} }` as its second argument — even if empty `{}`.

| Field   | Type                    | Required      | Default | Description                                                            |
|---------|-------------------------|---------------|---------|------------------------------------------------------------------------|
| `p`     | `'P1' \| 'P2' \| 'P3'` | optional      | `'P2'`  | Priority. Omit when P2.                                                |
| `state` | `string`                | if applicable | —       | Accumulated prior state for stateful sequences.                        |
| `ref`   | `string[]`              | if applicable | —       | External story / AC IDs: `['PROJ-123']`.                               |
| `bugs`  | `string[]`              | if applicable | —       | Defect IDs: `['BUG-BOOKING-002']`. Mirrored in `bug-log/bug-log.json`.|

```javascript
it('...Then return 200 and booking is created',  { req: {} }, () => { ... });                                            // P2 default
it('...Then return 200 and booking is created',  { req: { p: 'P1' } }, () => { ... });                                  // P1
it('...Then return 200 and all fields updated',  { req: { p: 'P1', state: 'booking created via POST' } }, () => { ... }); // stateful
it('...Then return 500 Internal Server Error',   { req: { p: 'P1', bugs: ['BUG-BOOKING-002'] } }, () => { ... });       // bug ref
it('...Then return 200 and booking is created',  { req: { p: 'P1', ref: ['PROJ-123'] } }, () => { ... });               // story ref
```

### Context Block Rules

**Same request, multiple edge-case assertions** → ONE context, multiple `it()` blocks:

```javascript
context('RestfulBooker.Booking.Create.POST: When valid booking data with all fields is provided', () => {
    it('...Then return 200 status code and bookingid is a number', { req: { p: 'P1' } }, () => { ... });
    it('...Then booking body contains all submitted field values', { req: { p: 'P1' } }, () => { ... });
});
```

**Separate requests needed** → SEPARATE contexts with a SPECIFIC "When" condition:

```javascript
context(`RestfulBooker.Booking.Create.POST: When booking with price of ${PRICE.MIN} is provided`, () => { ... });
context('RestfulBooker.Booking.Create.POST: When booking with same-day checkout is provided', () => { ... });
```

### Cleanup Pattern (mandatory)

Each spec file must run independently. Cleanup prevents data pollution from current and previous runs.
Delete by name prefix — never by ID alone (IDs are lost between runs).

```javascript
const cleanUp = () => cy.restfullBooker__bulkDelete__DELETE(authToken, testData);

describe('...', { testIsolation: false }, () => {
    before(() => { cleanUp(); /* setup... */ });
    after(() => { cleanUp(); });
});
```

### Full Spec Example

```javascript
// cypress/integration/api/rb.booking.api.spec.js
import { booking_examples as testData } from '../../integration-examples/api/rb.booking.api.examples';
import { PRICE, FIRSTNAME } from '../../constants/api/rb.booking.api.constraints';

let authToken;
const cleanUp = () => cy.restfullBooker__bulkDelete__DELETE(authToken, testData);

describe('RestfulBooker.Booking: Given no preconditions', { testIsolation: false }, () => {
    before(() => {
        cy.commonAPI__getTokenByRole__POST(userRoles.ADMIN_API).then((token) => { authToken = token; });
        cleanUp();
    });
    after(() => { cleanUp(); });

    context('RestfulBooker.Booking.Create.POST: When valid booking data with all fields is provided', () => {
        before(() => {
            cy.restfullBooker__createBooking__POST(testData.validBookings.standard).then((res) => {
                testData.validBookings.standard.bookingId = res.body.bookingid;
            });
        });

        it('RestfulBooker.Booking.Create.POST: Then return 200 status code and bookingid is a number',
            { req: { p: 'P1' } },
            () => { expect(typeof testData.validBookings.standard.bookingId).to.eq('number'); },
        );
    });

    context(`RestfulBooker.Booking.Create.POST: When booking with price of ${PRICE.MIN} is provided`, () => {
        it(
            `RestfulBooker.Booking.Create.POST: Then return 200 status code and totalprice equals ${PRICE.MIN}`,
            { req: { p: 'P2' } },
            () => {
                cy.restfullBooker__createBooking__POST(testData.validBookings.minimalPrice).then((res) => {
                    expect(res.status).to.eq(200);
                    expect(res.body.booking.totalprice).to.eq(PRICE.MIN);
                });
            },
        );
    });

    context(`RestfulBooker.Booking.Create.POST: When firstname exceeds ${FIRSTNAME.MAX_LENGTH} characters`, () => {
        it(
            `RestfulBooker.Booking.Create.POST: Then return 400 status code`,
            { req: { p: 'P1' } },
            () => {
                cy.restfullBooker__createBooking__POST(
                    testData.invalidBookings.firstname__OverMaxLength,
                    { failOnStatusCode: false },
                ).then((res) => { expect(res.status).to.eq(400); });
            },
        );
    });

    context('RestfulBooker.Booking.Create.POST: When a required field is missing', () => {
        it(
            'RestfulBooker.Booking.Create.POST: Then return 500 status code and Internal Server Error',
            { req: { p: 'P1', bugs: ['BUG-BOOKING-002'] } },
            () => {
                const { baseBooking, requiredFields } = testData.invalidBookings.missingRequired;
                const payload = utils.cloneObject(baseBooking);
                delete payload[utils.getRandomElement(requiredFields)];
                cy.restfullBooker__createBooking__POST(payload, { failOnStatusCode: false }).then((res) => {
                    expect(res.status).to.eq(500);
                });
            },
        );
    });

    context('RestfulBooker.Booking.Delete.DELETE: When a valid booking ID is deleted with authentication', () => {
        it('RestfulBooker.Booking.Delete.DELETE: Then return 201 status code and booking no longer exists',
            { req: { p: 'P1', state: 'booking created via POST' } },
            () => {
                cy.restfullBooker__deleteBooking__DELETE(authToken, testData.validBookings.standard.bookingId)
                    .then((res) => { expect(res.status).to.eq(201); });
            },
        );
    });
});
```

---

## The Traceability Chain

```
PRICE.MIN = 1                                        ← constraints.js — single source of truth
    ↓
validBookings.minimalPrice.totalprice = PRICE.MIN    ← examples.js — named, self-documenting instance
    ↓
testData.validBookings.minimalPrice                  ← spec.js — live reference in test body
    ↓
expect(totalprice).to.eq(PRICE.MIN)                  ← spec.js — assertion uses constraint directly
```

Each named instance maps 1-to-1 to a `context` block:

```
firstname__OverMaxLength instance    →    context: "When firstname exceeds 50 characters"
firstname__AtMaxLength instance      →    context: "When firstname is exactly 50 characters"
missingRequired instance             →    context: "When a required field is missing"
```

---

## ESLint Enforcement

| Rule | What it validates |
|------|-------------------|
| `verify-req-config` | Every `it()` has `{ req: {...} }` as second argument; `p` is P1/P2/P3; `bugs` follows `BUG-MODULE-NNN` format |
| `verify-test-title-pattern` | Titles follow Given/When/Then pattern |
| `standardize-test-titles` | Title formatting and casing |
| `verify-test-title-without-forbidden-symbols` | No disallowed characters in titles |
| `prevent-test-data-loops` | No `forEach`/`for...of` over test data in specs |
| `do-not-allow-empty-blocks` | No empty `context`/`it` blocks without `.skip()` |
| `prevent-duplicated-titles` | No duplicate `it` titles within a file |

---

## Scripts

```bash
npm run req:extract          # JSON to stdout
npm run req:extract:yaml     # YAML → reports/requirements.yaml (for stakeholders)
npm run req:extract:md       # Markdown → reports/requirements.md (for review)
npm run req:extract:json     # JSON → reports/requirements.json
npm run req:coverage         # P1/P2/P3 coverage counts
npm run req:coverage:check   # Fail if P1 coverage < 90%
```

### Generated Markdown Table

| # | Method | Operation | Priority | State                    | When                        | Then                              | Ref      | Bugs            |
|---|--------|-----------|----------|--------------------------|-----------------------------|-----------------------------------|----------|-----------------|
| 1 | POST   | Create    | P1       |                          | valid booking data provided | return 200 and booking is created | PROJ-123 |                 |
| 2 | PUT    | Update    | P1       | booking created via POST | full update payload         | return 200 and all fields updated | PROJ-456 |                 |
| 3 | POST   | Create    | P1       |                          | required field missing      | return 500 Internal Server Error  |          | BUG-BOOKING-002 |

---

## Bug Logging

Log a bug in `bug-log/bug-log.json` when API/UI behavior deviates from specification.
Reference it in `req.bugs` — no inline comment needed.

```javascript
// ✅ reference in req config only
it('...Then return 500 status code and Internal Server Error',
    { req: { p: 'P1', bugs: ['BUG-BOOKING-002'] } },
    () => { ... },
);
```

See `docs/bug-tracking.md` for the full bug log schema and severity guidelines.

---

## Rules Reference

| #  | Rule                                                                                                        |
|----|-------------------------------------------------------------------------------------------------------------|
| 1  | The spec IS the requirement — title = Given/When/Then; `req` config = metadata only                         |
| 2  | Every `it()` has `{ req: {...} }` as second argument (even `{}` when all defaults apply)                    |
| 3  | Constraint values come from constraint files — **never hardcoded** in specs or examples                     |
| 4  | Context and `it` titles include constraint values: `` `...the ${USERNAME.MAX_LENGTH}-character limit` ``    |
| 5  | Every example instance has a `// Boundary:` annotation explaining the scenario                              |
| 6  | IDs assigned immediately after creation: `testData.instance.bookingId = res.body.bookingid`                 |
| 7  | Cleanup runs in both `before` AND `after` — deletes by name prefix, never by ID alone                       |
| 8  | Bug IDs go in `req.bugs: ['BUG-…']` only — no inline `// Bug:` comments                                    |
| 9  | `req.state` documents accumulated prior state in stateful sequences                                         |
| 10 | One `describe` per spec file, `{ testIsolation: false }`                                                    |
| 11 | Single assertion per `it` (related assertions within one response are acceptable)                           |
| 12 | All globals available in tests: `l10n`, `colours`, `utils`, `urls`, `userRoles`, selectors                  |

---

## Migration from `.reqs.js` Files

### Phase 1 — Add `{ req: {...} }` to existing specs

```javascript
// BEFORE (no config):
it('RestfulBooker.Booking.Create.POST: Then return 500 status code and Internal Server Error', () => { ... });

// AFTER — P1 + bug reference:
it('RestfulBooker.Booking.Create.POST: Then return 500 status code and Internal Server Error',
    { req: { p: 'P1', bugs: ['BUG-BOOKING-002'] } },
    () => { ... },
);

// AFTER — P2 default:
it('RestfulBooker.Booking.Create.POST: Then return 200 status code and booking is created',
    { req: {} },
    () => { ... },
);

// AFTER — stateful sequence:
it('RestfulBooker.Booking.Update.PUT: Then return 200 status code and all fields are updated',
    { req: { p: 'P1', state: 'booking created via POST' } },
    () => { ... },
);
```

### Phase 2 — Create constraint files

Extract boundary constants from `.reqs.js` into `cypress/constants/{module}.constraints.js`.
Update examples files to import from constraint files.

### Phase 3 — Flip ESLint to error, delete `.reqs.js`

1. Change `verify-req-config` from `warn` to `error`
2. Run `npm run req:extract:yaml` to verify all requirements are captured
3. Delete `.reqs.js` files
