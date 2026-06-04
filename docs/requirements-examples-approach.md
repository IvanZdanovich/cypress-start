# Constraints → Examples → Specs

## Core Idea

**The spec IS the requirement.** Test titles (`describe` / `context` / `it`) form the complete
Given/When/Then requirement statement. No separate requirement files, no mapping matrices.

Each thing lives in exactly one place:

- Boundary values → constraint file
- Test payloads → examples file
- Requirements → spec file (as executable tests)

```
constraints.js           →     examples.js              →     spec.js
(boundary values)              (named data instances)         (tests = live requirements)

domain min/max,                one instance per               executable Given/When/Then
field lists, formats           boundary scenario              assertion + req metadata
```

### Why One File for Examples and Test Data

In each `*.examples.js` file, the **key name** is the example (what case is tested) and the
**object value** is the test data (what payload is sent). Both roles live in one file because
splitting them would mean importing from two places while every key still needs a complete payload.

```
examples.js
├── key name       →  the Example  (what boundary condition is being tested)
│   "firstname__OverMaxLength"
│
└── object value   →  the Test Data (what payload makes the test executable)
    { firstname: utils.extendString(..., MAX + 1), lastname: utils.random(8), ... }
```

## Layer 1 — Constraints

Boundary values used by both specs and examples. Declared once, imported everywhere.

```
cypress/constants/
  api/
    rb.booking.api.constraints.js   ← PRICE, DATE_FORMAT, REQUIRED_FIELDS
    {module}.api.constraints.js     ← one file per API module
  ui/
    {page}.ui.constraints.js        ← one file per UI page
```

**Rules:**

- Imported in both spec and examples files — never hardcoded
- Plain ES module named exports — no global injection

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

## Layer 2 — Named Examples

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

Names describe the **distinguishing intent** of the instance — not the values. The name alone
must make the case unambiguous; no comments needed.

```
{purpose}{QualifierSuffix?}
```

- Single `lowerCamelCase` token for every example key (group containers and instance leaves).
  (`module__action__METHOD`, `pageName__action`).
- The container key (`validBookings`, `invalidBookings`, `expectedResponses`, workflow-scenario
  nouns) carries the entity and the validity context.
- The instance key describes the single distinguishing intent of the instance, optionally ending
  in a PascalCase qualifier suffix drawn from the vocabulary below.
- Regex shape: `^[a-z][a-zA-Z0-9]*$`.

| Suffix                   | Meaning                                      |
|--------------------------|----------------------------------------------|
| `AtMaxLength`            | Valid — exactly at upper character limit     |
| `OverMaxLength`          | Invalid — one over upper limit               |
| `AtMinLength`            | Valid — exactly at lower character limit     |
| `UnderMinLength`         | Invalid — one under lower limit              |
| `WithMinimalPrice`       | Boundary minimum for a numeric field         |
| `WithMaximalPrice`       | Boundary maximum for a numeric field         |
| `MissingRequiredField`   | Required field intentionally absent          |
| `Duplicate`              | Conflicts with existing record               |
| `WithForbiddenChar`      | Contains a disallowed character              |
| `WithSameDayCheckout`    | Edge-case date scenario                      |
| `WithAllFields`          | All optional fields present — Create context |
| `WithMandatoryFields`    | Only required fields — Create context        |
| `UpdatedToAllFields`     | Full replacement payload — Update context    |
| `UpdatedToMinimalFields` | Strips optional fields — Update context      |

**❌ Avoid:** `item1`, `data1`, `test1`, `validBooking1`, `standard`, `default`.

### Structure Rules

- **One example key = one context.** Each key is consumed by exactly one `context` block.
- **Named aliases instead of duplication.** If two contexts share the same data, declare one `const`
  and assign it under two descriptive keys. No data is copied.
- **ID cross-references are allowed.** A context may read `examples.createAllFields.id` to target
  an already-created resource.
- **Names carry all meaning.** If a key needs a comment, rename it instead.
- **Group** by scenario category: `validBookings`, `invalidBookings`, `edgeCases`, etc.
- **Import** boundary values from constraints — never hardcode.
- **Use `utils`** for all dynamic data (strings, numbers, dates, booleans).
- **Declare ID fields as `String`** placeholder — assign after creation in spec.
- **Include `namePrefix`** at root for cleanup identification.

### Full Example

`allFieldsWithAllowedPrice` and `updatedToAllFields` point to the same object — each key is
named after the context that reads it.

```javascript
// cypress/integration-examples/api/rb.booking.api.examples.js
import { PRICE, FIRSTNAME, REQUIRED_FIELDS } from '../../constants/api/rb.booking.api.constraints';

// Shared object — referenced under multiple context-specific keys below
const bookingWithAllFieldsAndAllowedPrice = {
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
};

export const booking_examples = {
  namePrefix: 'API.Booking',

  validBookings: {
    // Create.POST context
    allFieldsWithAllowedPrice: bookingWithAllFieldsAndAllowedPrice,
    // Update.PUT context — same data, context-specific name
    updatedToAllFields: bookingWithAllFieldsAndAllowedPrice,

    // Create.POST context — totalprice at the lowest accepted boundary
    allFieldsWithMinimalPrice: {
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

    // Create.POST context — firstname exactly at the upper character boundary
    firstname__AtMaxLength: {
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
    // Create.POST context — one randomly selected required field omitted per run
    missingOneRequiredField: {
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

    // Create.POST context — firstname one character over the upper boundary
    firstname__OverMaxLength: {
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

### Key Assignment Rules

| Situation                                         | Action                                                                     |
|---------------------------------------------------|----------------------------------------------------------------------------|
| Two contexts share **same data**                  | One `const`, two context-specific keys                                     |
| Two contexts need **different values**            | Two separate objects, each under its own key                               |
| A context needs only the **ID** of a prior object | Read `testData.validBookings.allFieldsWithAllowedPrice.bookingId` directly |
| A context needs a **subset of fields**            | New key pointing to a new object with only those fields                    |

**❌ Don't reuse the same key for Create and Update — intent becomes ambiguous:**

```javascript
cy.booking__create__POST(token, examples.validBookings.allFieldsWithAllowedPrice);
cy.booking__update__PUT(token, id, examples.validBookings.allFieldsWithAllowedPrice); // unclear intent
```

**✅ Use context-specific keys even when data is identical:**

```javascript
cy.booking__create__POST(token, examples.validBookings.allFieldsWithAllowedPrice);
cy.booking__update__PUT(token, id, examples.validBookings.updatedToAllFields); // intent is explicit
```

## Layer 3 — Spec Files (Tests = Requirements)

### Title Structure

The requirement is assembled from three blocks:

| Block               | Role              | Content                                                           |
|---------------------|-------------------|-------------------------------------------------------------------|
| `describe`          | **Given**         | Preconditions                                                     |
| `context`           | **When**          | Operation or boundary condition                                   |
| `it`                | **Then**          | Expected outcome — one assertion per `it`                         |
| `req.preconditions` | **Given (extra)** | Preconditions not in `describe` (e.g. "booking created via POST") |

Use constraint references in titles — never raw numbers:

```javascript
// ❌ context('When booking with price of 1 is provided', ...)
// ✅ context(`When booking with price of ${PRICE.MIN} is provided`, ...)
```

### `req` Config Object

Every `it()` takes `{ req: {...} }` as its second argument. Only these fields are allowed:

- **`p`** — `'P1'` | `'P2'` | `'P3'`. Defaults to `'P2'`; omit when P2.
- **`preconditions`** — string array. Extra preconditions beyond the `describe`: `['booking created via POST']`.
- **`refs`** — URL array. Links to stories / ACs: `['https://jira.example.com/browse/PROJ-123']`.
- **`bugs`** — string array. Defect IDs: `['BUG-BOOKING-002']`.

```javascript
    it('...Then return 200', { req: {} }, () => {
});
it('...Then return 200', { req: { p: 'P1' } }, () => {
});
it('...Then return 200', { req: { p: 'P1', preconditions: ['booking created'] } }, () => {
});
it('...Then return 500', { req: { p: 'P1', bugs: ['BUG-BOOKING-002'] } }, () => {
});
it('...Then return 200', { req: { p: 'P1', refs: ['https://jira.example.com/browse/PROJ-123'] } }, () => {
});
```

### Context Block Rules

**Same request, multiple assertions** → one context, multiple `it()` blocks:

```javascript
    context('RestfulBooker.Booking.Create.POST: When valid booking data with all fields is provided', () => {
  it('...Then return 200 status code and bookingid is a number', { req: { p: 'P1' } }, () => {
  });
  it('...Then booking body contains all submitted field values', { req: { p: 'P1' } }, () => {
  });
});
```

**Different requests** → separate contexts with specific "When" conditions:

```javascript
    context(`RestfulBooker.Booking.Create.POST: When booking with price of ${PRICE.MIN} is provided`, () => {
});
context('RestfulBooker.Booking.Create.POST: When booking with same-day checkout is provided', () => {
});
```

### Cleanup Pattern

Each spec runs independently. Cleanup prevents data pollution from current and previous runs.
Delete by name prefix — never by ID alone (IDs are lost between runs).

```javascript
    const cleanUp = () => cy.restfullBooker__bulkDelete__DELETE(authToken, examples);

describe('...', { testIsolation: false }, () => {
  before(() => {
    cleanUp(); /* setup... */
  });
  after(() => {
    cleanUp();
  });
});
```

### Full Spec Example

```javascript
// cypress/integration/api/rb.booking.api.spec.js
import { booking_examples as testData } from '../../integration-examples/api/rb.booking.api.examples';
import { FIRSTNAME, PRICE } from '../../constants/api/rb.booking.api.constraints';

let authToken;
const cleanUp = () => cy.restfullBooker__bulkDelete__DELETE(authToken, testData);

describe('RestfulBooker.Booking: Given no preconditions', { testIsolation: false }, () => {
  before(() => {
    cy.commonAPI__getTokenByRole__POST(userRoles.ADMIN_API).then((token) => {
      authToken = token;
    });
    cleanUp();
  });
  after(() => {
    cleanUp();
  });

  context('RestfulBooker.Booking.Create.POST: When valid booking data with all fields is provided', () => {
    before(() => {
      cy.restfullBooker__createBooking__POST(testData.validBookings.standard).then((res) => {
        testData.validBookings.standard.bookingId = res.body.bookingid;
      });
    });

    it('RestfulBooker.Booking.Create.POST: Then return 200 status code and bookingid is a number',
      { req: { p: 'P1' } },
      () => {
        expect(typeof testData.validBookings.standard.bookingId).to.eq('number');
      },
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
    it(`RestfulBooker.Booking.Create.POST: Then return 400 status code`, { req: { p: 'P1' } }, () => {
        cy.restfullBooker__createBooking__POST(
          testData.invalidBookings.firstname__OverMaxLength,
          { failOnStatusCode: false },
        ).then((res) => {
          expect(res.status).to.eq(400);
        });
      },
    );
  });

  context('RestfulBooker.Booking.Create.POST: When a required field is missing', () => {
    it('RestfulBooker.Booking.Create.POST: Then return 500 status code and Internal Server Error', {
        req: {
          p: 'P1',
          bugs: ['BUG-BOOKING-002']
        }
      }, () => {
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
    it('RestfulBooker.Booking.Delete.DELETE: Then return 201 status code and booking no longer exists', {
        req: {
          p: 'P1',
          preconditions: ['booking created via POST']
        }
      }, () => {
        cy.restfullBooker__deleteBooking__DELETE(authToken, testData.validBookings.standard.bookingId)
          .then((res) => {
            expect(res.status).to.eq(201);
          });
      },
    );
  });
});
```

## Traceability Chain

How a boundary value flows from constraint to assertion:

```
PRICE.MIN = 1                                        ← constraints.js
    ↓
examples.validBookings.minimalPrice = PRICE.MIN      ← examples.js
    ↓
examples.validBookings.minimalPrice                  ← spec.js (test body)
    ↓
expect(totalprice).to.eq(PRICE.MIN)                  ← spec.js (assertion)
```

Each named instance maps 1-to-1 to a `context` block:

```
firstname__OverMaxLength    →  context: "When firstname exceeds 50 characters"      (Create.POST)
firstname__AtMaxLength      →  context: "When firstname is exactly 50 characters"   (Create.POST)
missingOneRequiredField     →  context: "When a required field is missing"           (Create.POST)
updatedToAllFields          →  context: "When full update payload is provided"       (Update.PUT)
```

> `updatedToAllFields` and `allFieldsWithAllowedPrice` point to the same object — the key name
> describes the context, not the data.

## ESLint Enforcement

| Rule                                          | What it validates                                                                                                                                                                                          |
|-----------------------------------------------|------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| `verify-req-config`                           | When `{ req: {...} }` is present in `it()`, validates `p` (P1/P2/P3), `preconditions` (non-empty string array), `refs` (non-empty URL array), `bugs` (BUG-MODULE-NNN or URL array); rejects unknown fields |
| `verify-test-title-pattern`                   | Titles follow Given/When/Then pattern                                                                                                                                                                      |
| `standardize-test-titles`                     | Title formatting and casing                                                                                                                                                                                |
| `verify-test-title-without-forbidden-symbols` | No disallowed characters in titles                                                                                                                                                                         |
| `prevent-test-data-loops`                     | No `forEach`/`for...of` over test data in specs                                                                                                                                                            |
| `do-not-allow-empty-blocks`                   | No empty `context`/`it` blocks without `.skip()`                                                                                                                                                           |
| `prevent-duplicated-titles`                   | No duplicate `it` titles within a file                                                                                                                                                                     |

## Scripts

```bash
npm run req:extract          # JSON to stdout
npm run req:extract:yaml     # YAML → reports/requirements.yaml
npm run req:extract:md       # Markdown → reports/requirements.md
npm run req:extract:json     # JSON → reports/requirements.json
npm run req:coverage         # P1/P2/P3 coverage counts
npm run req:coverage:check   # Fail if P1 coverage < 90%
```

### Generated Markdown Table

| # | Method | Operation | Priority | Preconditions            | When                        | Then                              | Ref      | Bugs            |
|---|--------|-----------|----------|--------------------------|-----------------------------|-----------------------------------|----------|-----------------|
| 1 | POST   | Create    | P1       |                          | valid booking data provided | return 200 and booking is created | PROJ-123 |                 |
| 2 | PUT    | Update    | P1       | booking created via POST | full update payload         | return 200 and all fields updated | PROJ-456 |                 |
| 3 | POST   | Create    | P1       |                          | required field missing      | return 500 Internal Server Error  |          | BUG-BOOKING-002 |

---

## Rules Reference

| #  | Rule                                                                                                  |
|----|-------------------------------------------------------------------------------------------------------|
| 1  | The spec IS the requirement — title = Given/When/Then                                                 |
| 2  | `{ req: {...} }` as second argument to `it()` — contains metadata only                                |
| 3  | Boundary values come from constraint files — **never hardcoded** in specs or examples                 |
| 4  | Titles include constraint values: `` `...the ${USERNAME.MAX_LENGTH}-character limit` ``               |
| 5  | One example key = one context                                                                         |
| 5a | Named aliases over duplication — one `const`, two context-specific keys; no object is copied          |
| 5b | ID cross-references between contexts are allowed                                                      |
| 5c | Names carry all meaning — rename instead of commenting                                                |
| 6  | IDs assigned immediately after creation: `examples.instance.bookingId = response.body.bookingid`      |
| 7  | Cleanup in both `before` AND `after` — delete by name prefix, never by ID alone                       |
| 8  | Bug IDs go in `req.bugs` only — no inline `// Bug:` comments                                          |
| 9  | `req.preconditions` for preconditions not expressed in the `describe` block                           |
| 10 | One `describe` per spec file, `{ testIsolation: false }`                                              |
| 11 | Single assertion per `it` (related assertions within one response are acceptable)                     |
| 12 | Globals available: `l10n`, `colours`, `utils`, `urls`, `userRoles`, selectors                         |
| 13 | Examples and test data share one file — key = example (spec role), value = test data (execution role) |
