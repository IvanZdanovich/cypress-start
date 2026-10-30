# Constraints → Examples → Specs

Human orientation to the methodology this project uses. The canonical rules live in the skill and rules listed
under [Source of truth](#source-of-truth); this page explains the *why* and shows the three layers wired together end to
end.

## Core idea

**The spec IS the requirement.** Test titles (`describe` / `context` / `it`) form the complete Given/When/Then
requirement statement. There are no separate requirement documents and no mapping matrices — the executable test is the
requirement of record.

Each concept lives in exactly one place, and consumers import it rather than re-declaring it:

- **Boundary values** → constraint file
- **Named test data** → examples file
- **Requirements** → spec file (as executable tests)

```
constraints.js          →     examples.js              →     spec.js
(boundary values)             (named data instances)         (tests = live requirements)

domain min/max,               one instance per               executable Given/When/Then
field lists, formats          boundary scenario              assertion + req metadata
```

This gives **traceability**: a single boundary value flows unbroken from its constraint,
through the example that composes it, into the spec title and the assertion that verifies it.
If a literal appears mid-chain with no owning layer, it is an orphan no requirement backs.

## The three layers

- **1. Constraints** — boundary values, formats, required-field lists, enums; declared once, imported everywhere.
    - Location: `cypress/constants/{api,ui}/*.constraints.js`
    - Rule: [constraints](../.claude/rules/constraints.md)
- **2. Examples** — named test-data instances composed *from* constraints; one key = one tested state.
    - Location: `cypress/integration-examples/{api,ui}/`, `cypress/e2e-examples/ui/`
    - Rule: [examples](../.claude/rules/examples.md)
- **3. Specs** — requirement titles + assertions; `req` metadata; per-file cleanup.
    - Location: `cypress/integration/{api,ui}/`, `cypress/e2e/ui/`
    -
    Rules: [api-specs](../.claude/rules/api-specs.md), [ui-specs](../.claude/rules/ui-specs.md), [e2e-specs](../.claude/rules/e2e-specs.md)

In an examples file the **key name** is the example (which case is tested) and the **object
value** is the test data (the payload that makes it executable). Both roles share one file so a
reader never chases the intent and the payload across two places. Detailed naming, composition,
aliasing, and cleanup rules are owned by the rules above — see [Source of truth](#source-of-truth).

## One worked example

The following shows a single boundary value — the minimum booking price — traced through all
three layers.

**Layer 1 — constraint** declares the boundary once:

```javascript
// cypress/constants/api/rb.booking.api.constraints.js
export const PRICE = Object.freeze({
    MIN: 1,
    MAX: 100_000,
    ZERO: 0,
});
```

**Layer 2 — example** composes a named instance from that constraint, never from a raw literal. The key names the
tested case; the value is the payload:

```javascript
// cypress/integration-examples/api/restful-booker.booking.api.examples.js
import {PRICE} from '../../constants/api/rb.booking.api.constraints';

const namePrefix = `RbBk_${utils.generateRandomString(6)}_`;

export const booking__examples = {
    namePrefix,
    validBookings: {
        minimalPrice: {
            bookingId: undefined,
            firstname: `${namePrefix}${utils.generateRandomString(4)}`,
            lastname: `${namePrefix}${utils.generateRandomString(6)}`,
            totalPrice: PRICE.MIN,
            depositPaid: true,
            bookingDates: {checkin: utils.getFutureDate(3), checkout: utils.getFutureDate(5)},
            additionalNeeds: 'None',
        },
    },
};
```

**Layer 3 — spec** sends the instance and asserts against the constraint. The title states what the value means (
"minimal price"), not the literal `1`:

```javascript
// cypress/integration/api/restful-booker.booking.api.spec.js
import {booking__examples as examples} from '../../integration-examples/api/restful-booker.booking.api.examples';
import {HTTP_STATUS} from '../../constants/api/common.api.constraints';
import {PRICE} from '../../constants/api/rb.booking.api.constraints';

describe('RestfulBooker.Booking: Given no preconditions', {testIsolation: false}, () => {
    context('RestfulBooker.Booking.Create.POST: When booking with minimal price is provided', () => {
        it('RestfulBooker.Booking.Create.POST: Then return 200 status code and booking is created with minimal price', () => {
            cy.restfullBooker__createBooking__POST(examples.validBookings.minimalPrice).then((response) => {
                expect(response.status).to.eq(HTTP_STATUS.OK);
                expect(response.body.booking.totalprice).to.eq(PRICE.MIN);
            });
        });
    });
});
```

The chain resolves end to end:

```
PRICE.MIN = 1                                    ← constraint
  → validBookings.minimalPrice.totalPrice        ← example
    → assertion expect(…).to.eq(PRICE.MIN)       ← spec
```

Each named example instance maps to one `context` block, so the case tested and the requirement stated agree. An
optional `{ req: { ... } }` object on `it`, `context`, or `describe` adds requirement metadata: priority `p`,
`preconditions`, ticket `refs`, `bugs`, and a `note`. The `verify-req-config` rule validates its shape; see
[Custom ESLint Rules](eslint-custom-rules.md).

## Outputs

- **Specs as live requirements** — titles and `req` metadata are the requirement list; no other requirement document
  exists.
- **Sign-off report** — `npm run report:signoff` turns the specs and the latest run into the self-contained
  `reports/signoff-report.html`. A PDF is produced on demand with its **Print / Save PDF** button. See
  [Sign-off report](signoff-report.md).
- **Coverage report** — `npm run report:coverage` writes `reports/coverage-gaps.md`. See
  [Coverage gap analysis](coverage-gap-analysis.md).

## Source of truth

The skill and rules below govern the canonical rules for this methodology. This page is orientation only; where they
disagree, the skill and rules win.

- [constraints-examples-specs-approach](../.claude/skills/constraints-examples-specs-approach/SKILL.md) — layer order,
  end-to-end traceability, the authoring workflow, and the expected outputs.
- [constraints](../.claude/rules/constraints.md) — constraint file layout, naming, and boundary authoring.
- [examples](../.claude/rules/examples.md) — example file layout, instance naming, composition, and aliasing.
- [api-specs](../.claude/rules/api-specs.md), [ui-specs](../.claude/rules/ui-specs.md), [e2e-specs](../.claude/rules/e2e-specs.md) —
  spec titles, structure, `req` usage, and cleanup.
- [commands](../.claude/rules/commands.md) — command file ownership, naming, and parameters.

## Related

- [Bug tracking](../.claude/skills/bug-tracking/SKILL.md)
- [Localization testing](../.claude/skills/localization-testing/SKILL.md)
- [FAQ](faq.md)
