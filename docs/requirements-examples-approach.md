# Requirements → Examples → Automated Tests

## The Three-Layer Chain

```
Requirements JS (live docs)  →  Named Examples (test-data JS)  →  Automated Tests (spec JS)
  id, rule, priority,              scenario at a boundary              executable assertion
  constraint values
```

| Layer            | Where it lives                                    | Responsibility                                                          |
|------------------|---------------------------------------------------|-------------------------------------------------------------------------|
| **Requirements** | `cypress/support/requirements/*.reqs.js`          | Define every verifiable rule once, with named constraint values and IDs |
| **Examples**     | `cypress/integration-examples/**/*.examples.js` | One data instance per requirement × boundary combination                |
| **Tests**        | `cypress/integration/**/*.spec.js`                | Assert the outcome of each named example against its requirement        |

---

## Why JS, Not Markdown

The requirement file **is** the data. There is no generation step, no sync risk, and no secondary artifact.

| Need                         | JS-first answer                                                         |
|------------------------------|-------------------------------------------------------------------------|
| Human-readable prose         | `rule:` field — plain string, self-contained, no separate annotations   |
| Machine-readable constraints | Plain object properties (`statusCode`, `limit`, `minValue`, `bugs`, …)  |
| IDE navigation               | Jump-to-definition from any test that imports the file                  |
| Auto-complete                | Works out of the box in any editor                                      |
| Coverage analysis            | `scripts/scan-req-coverage.js` scans `id:` values — no markdown parser  |
| Stakeholder docs             | Read the file directly, or run `npm run req:docs` to render HTML        |
| Traceability in test titles  | `` `...Then return 200 [${rb.create.success.id}]` `` — never hardcoded  |
| Bug traceability             | `bugs: ['BUG-…']` array in each requirement object → serialises to JSON |

---

## Layer 1 — Requirements as JS

### File Layout

One JS file per module, co-located with the other support files:

```
cypress/support/requirements/
  rb.booking.reqs.js          ← RestfulBooker Booking requirements
  ua.user-account.reqs.js     ← User Account requirements
  inv.inventory.reqs.js       ← Inventory page requirements
  requirements.js             ← Global UI constraints (shared across modules)
```

### File Naming

```
{prefix}.{kebab-module-name}.reqs.js
```

| File                      | Prefix | Import alias                                |
|---------------------------|--------|---------------------------------------------|
| `rb.booking.reqs.js`      | `rb`   | `import rb from '.../rb.booking.reqs'`      |
| `ua.user-account.reqs.js` | `ua`   | `import ua from '.../ua.user-account.reqs'` |
| `inv.inventory.reqs.js`   | `inv`  | `import inv from '.../inv.inventory.reqs'`  |

### Requirement Object Structure

Each named requirement is a plain JS object with these fields:

| Field           | Type       | Required  | Description                                                         |
|-----------------|------------|-----------|---------------------------------------------------------------------|
| `id`            | `string`   | ✅         | Machine-readable identifier, scanned for coverage                   |
| `rule`          | `string`   | ✅         | Human-readable, self-contained rule description                     |
| `priority`      | `string`   | ✅         | `P1` critical · `P2` important · `P3` nice-to-have                  |
| `method`        | `string`   | API only  | HTTP verb from `HTTP_METHODS` (`'GET'`, `'POST'`, …)                |
| `path`          | `string`   | API only  | URL path pattern (`'/booking'`, `'/booking/{id}'`, …)               |
| *(constraints)* | any        | as needed | `statusCode`, `limit`, `minValue`, `maxValue`, `bugs`, etc.         |
| `bugs`          | `string[]` | if needed | Bug IDs from `bug-log/bug-log.json` that affect this requirement    |
| `preconditions` | `string[]` | if needed | IDs of requirements that must pass before this one can be exercised |

No JSDoc tags per requirement — the object fields ARE the documentation. JSDoc at the top of the file (`@module`,
`@example`) is the only annotation needed.

### Requirement ID Convention

```
REQ-{PREFIX}-{NUMBER}
```

| Module prefix | Example IDs                |
|---------------|----------------------------|
| `RB`          | `REQ-RB-010`, `REQ-RB-011` |
| `UA`          | `REQ-UA-001`, `REQ-UA-002` |
| `INV`         | `REQ-INV-001`              |

Number ranges are loosely grouped by operation (e.g. 001–009 auth, 010–029 create, 030–049 retrieve).

### Requirement File Template

```javascript
/**
 * @module ModuleName
 * @description Requirements for the XYZ module.
 *   Single source of truth. Import in test data and spec files.
 *
 * @owner QA Team
 * @reviewed YYYY-MM-DD
 * @prefix xy
 *
 * @example
 *   import xy from '../../support/requirements/xy.module-name.reqs';
 *   xy.create.success.statusCode          // 201
 *   xy.create.success.id                  // 'REQ-XY-010'
 *   xy.create.usernameTooLong.bugs        // ['BUG-XY-001']
 */

import {HTTP_STATUS, HTTP_BODY, HTTP_METHODS} from './shared-api.reqs.js';

const USERNAME_MAX_LENGTH = 50;

const create = {
    success: {
        id: 'REQ-XY-010',
        rule: `POST /resource with a valid payload returns ${HTTP_STATUS.CREATED} Created.`,
        priority: 'P1',
        method: HTTP_METHODS.POST,
        path: '/resource',
        statusCode: HTTP_STATUS.CREATED,
    },

    usernameTooLong: {
        id: 'REQ-XY-011',
        rule: `POST /resource with username exceeding ${USERNAME_MAX_LENGTH} characters returns ${HTTP_STATUS.BAD_REQUEST} Bad Request.`,
        priority: 'P1',
        method: HTTP_METHODS.POST,
        path: '/resource',
        statusCode: HTTP_STATUS.BAD_REQUEST,
        limit: USERNAME_MAX_LENGTH,
        atBoundary: USERNAME_MAX_LENGTH,
        overBoundary: USERNAME_MAX_LENGTH + 1,
        underBoundary: USERNAME_MAX_LENGTH - 1,
    },

    forbiddenChars: {
        id: 'REQ-XY-012',
        rule: 'Username must not contain whitespace or special characters other than -, _, .',
        priority: 'P1',
        method: HTTP_METHODS.POST,
        path: '/resource',
        statusCode: HTTP_STATUS.BAD_REQUEST,
        forbidden: [' ', '@', '!', '#', '$', '%'],
        allowed: ['-', '_', '.'],
        bugs: ['BUG-XY-001'],
    },
};

export default {create};
```

### Import Pattern

```javascript
import xy from '../../support/requirements/xy.module-name.reqs';

xy.create.success.statusCode         // 201
xy.create.usernameTooLong.limit      // 50
xy.create.usernameTooLong.overBoundary // 51
```

---

## Composition Patterns

Requirements are not always isolated. JS lets you express shared values and relationships as plain data —
the final exported object is still inert and serialises to JSON for Python consumers.

### Pattern 1 — Shared constants file

HTTP status codes, body strings, and method names repeat across every module requirement file.
Define them once in `shared-api.reqs.js` and import only what each module needs.

**`cypress/support/requirements/shared-api.reqs.js`** (named exports only — no default export, exporter skips it):

```javascript
export const HTTP_STATUS = {
    OK: 200,
    CREATED: 201,
    BAD_REQUEST: 400,
    FORBIDDEN: 403,
    NOT_FOUND: 404,
    METHOD_NOT_ALLOWED: 405,
    SERVER_ERROR: 500, /* … */
};
export const HTTP_BODY = {
    FORBIDDEN: 'Forbidden',
    NOT_FOUND: 'Not Found',
    METHOD_NOT_ALLOWED: 'Method Not Allowed',
    SERVER_ERROR: 'Internal Server Error', /* … */
};
export const HTTP_METHODS = {GET: 'GET', POST: 'POST', PUT: 'PUT', PATCH: 'PATCH', DELETE: 'DELETE'};
```

**Any module file** imports and uses directly:

```javascript
import {HTTP_STATUS, HTTP_BODY, HTTP_METHODS} from './shared-api.reqs.js';

const update = {
    unauthorized: {
        id: 'REQ-RB-041',
        rule: `PUT /booking/{id} without a valid auth token returns ${HTTP_STATUS.FORBIDDEN} ${HTTP_BODY.FORBIDDEN}.`,
        priority: 'P1',
        method: HTTP_METHODS.PUT,   // ← change the constant once → every module stays in sync
        path: '/booking/{id}',
        statusCode: HTTP_STATUS.FORBIDDEN,
        body: HTTP_BODY.FORBIDDEN,
    },
};
```

### Pattern 2 — Derived boundary values

Compute boundary values from a named constant so the rule text and the test-data constraint
can never drift apart.

```javascript
const PRICE = {MIN: 1, MAX: 100000};

const create = {
    minimalPrice: {
        id: 'REQ-RB-012',
        rule: `totalprice minimum valid value is ${PRICE.MIN}; booking at that boundary is accepted.`,
        priority: 'P2',
        statusCode: STATUS.OK,
        minValue: PRICE.MIN,           // ← test data uses rb.create.minimalPrice.minValue
    },
    maximalPrice: {
        id: 'REQ-RB-013',
        rule: `totalprice maximum valid value is ${PRICE.MAX}; booking at that boundary is accepted.`,
        priority: 'P2',
        statusCode: STATUS.OK,
        maxValue: PRICE.MAX,
    },
};
```

Test data uses the constraint — never a hardcoded number:

```javascript
// Requirement: rb.create.minimalPrice [REQ-RB-012]
// Boundary: AT minimum — must be accepted
booking_price_AtMin: {
    totalPrice: rb.create.minimalPrice.minValue,  // 1, resolved from PRICE.MIN
}
,
```

### Pattern 3 — Shared field lists

When several requirements concern the same set of fields, define the list once:

```javascript
const REQUIRED_FIELDS = ['firstname', 'lastname', 'totalPrice', 'depositPaid', 'bookingDates.checkin', 'bookingDates.checkout'];

const create = {
    missingRequiredField: {id: 'REQ-RB-017', ..., requiredFields: REQUIRED_FIELDS},
    invalidDataType: {id: 'REQ-RB-018', ..., affectedFields: REQUIRED_FIELDS},
    emptyStringField: {id: 'REQ-RB-023', ..., affectedFields: REQUIRED_FIELDS},
};
```

### Pattern 4 — Preconditions (requirement dependencies)

Express that a requirement can only be tested once other requirements pass.
`preconditions` is a plain array of requirement IDs — no dynamic behaviour, pure data.

```javascript
// `auth` is defined first, then `create`, then `update` can reference both.
const update = {
    success: {
        id: 'REQ-RB-040',
        rule: 'PUT /booking/{id} with a valid auth token returns 200 OK.',
        priority: 'P1',
        statusCode: STATUS.OK,
        preconditions: [auth.validLogin.id, create.success.id], // ['REQ-RB-001', 'REQ-RB-010']
    },
};
```

Ordering rule: a namespace can only reference IDs from namespaces defined **above** it in the file.
The declaration order `auth → create → retrieve → update → partialUpdate → delete` naturally reflects
the operational dependency chain.

**Python usage:**

```python
rb = json.loads(Path('rb.booking.reqs.json').read_text())
# Check that all preconditions have been exercised before running an update test:
for req_id in rb['update']['success']['preconditions']:
    assert req_id in passed_req_ids, f"{req_id} must pass before {rb['update']['success']['id']}"
```

### Pattern 5 — Bug references

Add a `bugs` array field listing every bug ID from `bug-log/bug-log.json` that affects the requirement.
This is the only bug annotation needed — it is machine-readable, serialises to JSON, and is picked up
by the scanner and any external consumer.

```javascript
nonExistingId: {
    id: 'REQ-RB-042',
        rule
:
    `PUT /booking/{nonExisting} with a valid auth token returns ${HTTP_STATUS.METHOD_NOT_ALLOWED} ${HTTP_BODY.METHOD_NOT_ALLOWED}.`,
        priority
:
    'P1',
        method
:
    HTTP_METHODS.PUT,
        path
:
    '/booking/{id}',
        statusCode
:
    HTTP_STATUS.METHOD_NOT_ALLOWED,
        body
:
    HTTP_BODY.METHOD_NOT_ALLOWED,
        preconditions
:
    [auth.validLogin.id],
        bugs
:
    ['BUG-BOOKING-007'],  // ← array; multiple bugs: ['BUG-X-001', 'BUG-X-002']
}
,
```

When multiple requirements are affected by the same bug, each carries its own `bugs` entry — no
free-text duplication.

**JSON output** (after `npm run req:export`):

```json
{
  "nonExistingId": {
    "id": "REQ-RB-042",
    "method": "PUT",
    "path": "/booking/{id}",
    "statusCode": 405,
    "bugs": [
      "BUG-BOOKING-007"
    ]
  }
}
```

**Python usage:**

```python
rb = json.loads(Path('rb.booking.reqs.json').read_text())
bugs = rb['update']['nonExistingId'].get('bugs', [])   # ['BUG-BOOKING-007']
```

### What NOT to do

| Anti-pattern                                                     | Why it breaks                                                                            |
|------------------------------------------------------------------|------------------------------------------------------------------------------------------|
| Factory functions that generate `id` values                      | Scanner can't find literal `id: 'REQ-*'` strings inside function bodies                  |
| Computed `id` strings: `` id: `REQ-${n}` ``                      | Same — scanner requires string literals                                                  |
| Cross-requirement ID hardcoding: `preconditions: ['REQ-RB-010']` | If the ID changes, the reference silently becomes stale; use `create.success.id` instead |
| Circular references between namespaces                           | JS evaluates top-to-bottom; `auth` cannot reference `update`                             |

---

## Layer 2 — Named Examples (Test Data)

### Naming Convention

```
{module}_{field}_{BoundaryCondition}
```

| Suffix           | Meaning                                  |
|------------------|------------------------------------------|
| `AtMaxLength`    | Valid — exactly at the upper limit       |
| `OverMaxLength`  | Invalid — one step over the upper limit  |
| `AtMinLength`    | Valid — exactly at the lower limit       |
| `UnderMinLength` | Invalid — one step under the lower limit |
| `Missing`        | Required field absent                    |
| `Duplicate`      | Conflicts with an existing record        |
| `ForbiddenChar`  | Contains a disallowed character          |

### Test Data Example

```javascript
// cypress/integration-requirements-test-data/ui/user-registration.examples.js
import ua from '../../support/requirements/ua.user-account.reqs';

export const userRegistration_testData = {
    namePrefix: 'UI.Reg',

    // Requirement: ua.create.usernameAtMaxLength [REQ-UA-011]
    // Boundary: AT limit — 50 chars — must be accepted
    user_username_AtMaxLength: {
        userId: String,
        username: utils.extendStringWithPrefix('UI.Reg', ua.create.usernameTooLong.atBoundary),
        password: utils.generatePassword(12),
    },

    // Requirement: ua.create.usernameTooLong [REQ-UA-011]
    // Boundary: OVER limit — 51 chars — must be rejected
    user_username_OverMaxLength: {
        username: utils.extendStringWithPrefix('UI.Reg', ua.create.usernameTooLong.overBoundary),
        password: utils.generatePassword(12),
    },

    // Requirement: ua.create.forbiddenChars [REQ-UA-012]
    // Boundary: Contains one randomly selected forbidden character
    user_username_ForbiddenChar: {
        username: `UI.Reg${utils.pickRandom(ua.create.forbiddenChars.forbidden)}`,
        password: utils.generatePassword(12),
    },
};
```

**Rules:**

- Every instance has a two-line annotation: `// Requirement:` and `// Boundary:`
- All dynamic values come from `utils` — never hardcoded
- Constraint values come from the imported requirement object — never hardcoded
- Assign IDs immediately after creation: `testData.user_valid.userId = res.body.id`
- Cleanup prefix format: `Prefix.Purpose` (e.g. `UI.Reg`, `API.User`)

---

## Layer 3 — Automated Tests (Spec Files)

### Structure Mapping

| Block                 | Role                    | Content                                        |
|-----------------------|-------------------------|------------------------------------------------|
| `describe`            | Requirement group       | "Given preconditions for feature X"            |
| `context`             | Named example in action | Which scenario and boundary is being exercised |
| `before` in `context` | Example setup           | Actions that produce the boundary condition    |
| `it`                  | Requirement assertion   | One assertion — one outcome — one requirement  |

### Requirement IDs in Test Titles

IDs are evaluated from the imported requirement object — never hardcoded strings:

```javascript
it(`UserRegistration: Then a username-too-long error is shown [${ua.create.usernameTooLong.id}]`, () => { ...
});
//                                                          ↑ evaluates to "[REQ-UA-011]"
```

Context titles include constraint values from the requirement object:

```javascript
// ❌ context('When user enters a username that is too long', ...)
// ✅ context(`When user enters a username exceeding the ${ua.create.usernameTooLong.limit}-character limit`, ...)
```

### `STATE:` Contexts

Declare accumulated state between groups of sequential contexts with an empty `STATE:` block:

```javascript
context('STATE: form open · all fields empty', () => {
})

context('UserRegistration: When user enters an oversized username', () => { ...
});

context('STATE: username invalid · password field empty', () => {
})

context('UserRegistration: When user corrects the username to the exact limit', () => { ...
});
```

**Rules:**

- Body is always empty — no `it`, no `before`, no `after`
- Fields separated by `·`, field:value separated by ` · `
- Placed immediately before the first context that depends on that state

### UI Spec — Condensed Example

```javascript
// cypress/integration-requirements/ui/user-registration.ui.spec.js
import ua from '../../support/requirements/ua.user-account.reqs';
import {userRegistration_testData as testData} from '../../integration-requirements-test-data/ui/user-registration.examples';

const cleanUp = () => cy.userAccount__bulkDeleteByUsernamePrefix__DELETE(testData.namePrefix);

describe('UserRegistration: Given the registration page is accessible', {testIsolation: false}, () => {
    before(() => {
        cleanUp();
        cy.visit(urls.ui.registration);
    });
    after(() => {
        cleanUp();
    });

    context('STATE: form open · all fields empty', () => {
    })

    context('UserRegistration: When user opens the registration form', () => {
        it(`UserRegistration: Then Register button is disabled [${ua.create.registerDisabledUntilValid.id}]`, () => {
            cy.get(registrationPage.registerButton).should('be.disabled');
        });
    });

    context(`UserRegistration: When user enters a username exceeding the ${ua.create.usernameTooLong.limit}-character limit`, () => {
        before(() => {
            cy.get(registrationPage.usernameInput).type(testData.user_username_OverMaxLength.username).blur();
        });

        it(`UserRegistration: Then a username-too-long error is shown in error colour [${ua.create.usernameTooLong.id}]`, () => {
            cy.get(registrationPage.usernameValidation)
                .should('have.text', l10n.registration.usernameTooLong)
                .and('have.css', 'color', colours.TEXT_ERROR);
        });
    });

    context(`UserRegistration: When user corrects username to exactly ${ua.create.usernameTooLong.limit} characters`, () => {
        before(() => {
            cy.get(registrationPage.usernameInput).clear().type(testData.user_username_AtMaxLength.username).blur();
        });

        it(`UserRegistration: Then no username validation error is shown [${ua.create.usernameTooLong.id}]`, () => {
            cy.get(registrationPage.usernameValidation).should('not.exist');
        });
    });
});
```

### API Spec — Condensed Example

```javascript
// cypress/integration-requirements/api/restful-booker.booking.api.spec.js
import rb from '../../support/requirements/rb.booking.reqs';
import {booking_testData as testData} from '../../integration-requirements-test-data/api/restful-booker.booking.api.examples';

let authToken;
const cleanUp = () => cy.restfullBooker__bulkDelete__DELETE(authToken, testData);

describe('RestfulBooker.Booking: Given No preconditions', {testIsolation: false}, () => {
    before(() => {
        cy.commonAPI__getTokenByRole__POST(userRoles.ADMIN_API).then((token) => {
            authToken = token;
        });
        cleanUp();
    });
    after(() => {
        cleanUp();
    });

    context('STATE: auth token obtained · no bookings created', () => {
    })

    context('RestfulBooker.Booking.Create.POST: When a valid booking with all fields is provided', () => {
        before(() => {
            cy.restfullBooker__createBooking__POST(testData.standard).then((res) => {
                testData.standard.bookingId = res.body.bookingid;
            });
        });

        it(`RestfulBooker.Booking.Create.POST: Then return ${rb.create.success.statusCode} status code and booking is created [${rb.create.success.id}]`, () => {
            cy.restfullBooker__createBooking__POST(testData.standard).then((response) => {
                expect(response.status).to.eq(rb.create.success.statusCode);
            });
        });
    });

    context(`RestfulBooker.Booking.Delete.DELETE: When a valid booking ID is deleted with authentication`, () => {
        it(`RestfulBooker.Booking.Delete.DELETE: Then return ${rb.delete.success.statusCode} status code [${rb.delete.success.id}]`, () => {
            cy.restfullBooker__deleteBooking__DELETE(authToken, testData.standard.bookingId).then((response) => {
                expect(response.status).to.eq(rb.delete.success.statusCode);
            });
        });
    });
});
```

---

## Coverage Analysis

Because every `it` title contains `[REQ-XX-NNN]` evaluated from the imported requirement object,
coverage is automatically measurable without parsing any markdown.

```bash
# Full coverage report (CLI + markdown)
npm run req:coverage

# P1-only coverage gate — fail if below 90%
npm run req:coverage -- --priority=P1 --threshold=90

# Save markdown report for documentation
npm run req:coverage -- --format=markdown --output=reports/req-coverage.md
```

| Need                | How it is met                                                           |
|---------------------|-------------------------------------------------------------------------|
| Traceability matrix | `[REQ-*-*]` patterns in `it()` titles, sourced from requirement objects |
| Coverage gap report | All `.reqs.js` IDs minus covered IDs in spec files                      |
| CI gate             | `npm run req:coverage -- --threshold=80` exits 1 if below threshold     |

---

## Rules

| #  | Rule                                                                                                        |
|----|-------------------------------------------------------------------------------------------------------------|
| 1  | Write the requirement in a `.reqs.js` file **before** writing the test                                      |
| 2  | Every test-data instance has `// Requirement:` / `// Boundary:` two-line annotation                         |
| 3  | Constraint values come from the requirement object — **never hardcoded**                                    |
| 4  | Status codes come from the requirement object — **never hardcoded**                                         |
| 5  | Context titles include the constraint value: `` `...the ${req.limit}-character limit` ``                    |
| 6  | Every `it` title ends with `` [${req.id}] ``                                                                |
| 7  | Accumulated state is declared with an empty `STATE:` context — never a comment                              |
| 8  | Import alias matches the file prefix: `import rb from '...rb.booking.reqs'`                                 |
| 9  | Bug IDs go in `bugs: ['BUG-…']` array only — no `@bug` JSDoc, no singular `bug:` string                     |
| 10 | `.reqs.js` files are human-authored — no generated files, no build step                                     |
| 11 | Shared literals (`HTTP_STATUS`, `HTTP_BODY`, `HTTP_METHODS`) live in `shared-api.reqs.js` — never duplicated    |
| 12 | Boundary values are derived from named constants: `minValue: PRICE.MIN`, `overBoundary: limit + 1`          |
| 13 | Shared field lists are defined once and referenced by all requirements that use them                        |
| 14 | `preconditions` uses object references (`create.success.id`), never hardcoded ID strings                    |
| 15 | `id:` must always be a string literal — never computed or generated inside a factory function               |
| 16 | API endpoint is two fields: `method: HTTP_METHODS.X` and `path: '/resource/{id}'` — never a combined string |
| 17 | Every requirement must pass schema validation: `npm run req:validate`                                       |
| 18 | UI requirements must include `component` field; E2E requirements must include `workflow` field              |

---

## Schema Validation

Every `*.reqs.js` file is validated against typed schemas defined in `cypress/support/requirements/req-schemas.js`.

### Three Schema Types

| Type    | Detection                    | Mandatory (beyond base) | At-least-one group                                             |
|---------|------------------------------|-------------------------|----------------------------------------------------------------|
| **API** | Has `method` + `path` fields | `method`, `path`        | `statusCode` or `statusCodeCoercible`/`statusCodeNonCoercible` |
| **UI**  | Has `component` field        | `component`             | —                                                              |
| **E2E** | Has `workflow` field         | `workflow`              | —                                                              |

All types share base mandatory fields: `id`, `rule`, `priority`.

### Commands

```bash
npm run req:validate             # validate all — errors + warnings
npm run req:validate:strict      # treat warnings as errors (for CI)
npm run req:schema               # print full schema reference
```

Validation also runs automatically during `npm run req:export` and `npm run req:coverage`.

### Adding New Fields

When a requirement needs a field not yet in the schema:

1. Add the field to the `optional` section of the correct schema in `req-schemas.js`
2. Include a `validate` function and `description`
3. Run `npm run req:validate` to confirm

### Error Examples

```
# Missing mandatory field
ERROR: rb.booking.reqs.js → create.success: Missing mandatory field 'method' — HTTP verb from HTTP_METHODS

# Invalid value type
ERROR: rb.booking.reqs.js → create.success: Invalid value for 'priority' — expected: 'P1' | 'P2' | 'P3', got: "High"

# Unknown field (warning)
WARN: rb.booking.reqs.js → create.success: Unknown field 'endpoint' — not in api schema. Add to req-schemas.js or remove.

# Duplicate ID
ERROR: rb.booking.reqs.js: Duplicate ID 'REQ-RB-010'
```

---

## What Does Not Change

- ✅ One `describe` per spec file, `{ testIsolation: false }`
- ✅ Single assertion per `it`
- ✅ `before` / `after` cleanup in both `describe` and `context`
- ✅ Given / When / Then title pattern and all ESLint naming rules
- ✅ All globals: `l10n`, `colours`, `utils`, `urls`, `userRoles`, selectors
- ✅ Custom commands only for complex multi-step interactions reused across files
- ✅ Cleanup by name prefix, not by ID
