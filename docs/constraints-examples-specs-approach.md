# Constraints → Examples → Specs

Human orientation to the methodology this project uses. The canonical rules live in the skills listed
under [Source of truth](#source-of-truth); this page explains the _why_ and shows the three layers wired together end to
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
  - Skill: [define-constraints](../.claude/skills/define-constraints/SKILL.md)
- **2. Examples** — named test-data instances composed _from_ constraints; one key = one tested state.
  - Location: `cypress/integration-examples/{api,ui}/`, `cypress/e2e-examples/ui/`
  - Skill: [define-examples](../.claude/skills/define-examples/SKILL.md)
- **3. Specs** — requirement titles + assertions; `req` metadata; per-file cleanup.
  - Location: `cypress/integration/{api,ui}/`, `cypress/e2e/ui/`
  -
  Skills: [write-integration-api-specs](../.claude/skills/write-integration-api-specs/SKILL.md), [write-integration-ui-specs](../.claude/skills/write-integration-ui-specs/SKILL.md), [write-e2e-ui-specs](../.claude/skills/write-e2e-ui-specs/SKILL.md)

In an examples file the **key name** is the example (which case is tested) and the **object
value** is the test data (the payload that makes it executable). Both roles share one file so a
reader never chases the intent and the payload across two places. Detailed naming, composition,
aliasing, and cleanup rules are owned by the skills above — see [Source of truth](#source-of-truth).

## One worked example

The following shows a single boundary value — the minimum booking price — traced through all
three layers.

**Layer 1 — constraint** declares the boundary once:

```javascript
// cypress/constants/api/rb.booking.api.constraints.js
export const PRICE = { MIN: 1, MAX: 100_000 };
```

**Layer 2 — example** composes a named instance from that constraint (never a raw literal):

```javascript
// cypress/integration-examples/api/rb.booking.api.examples.js
import { PRICE } from '../../constants/api/rb.booking.api.constraints';

export const booking_examples = {
  namePrefix: 'API.Booking',
  validBookings: {
    // key names the tested case; value is the executable payload
    allFieldsWithMinimalPrice: {
      bookingId: String,
      firstname: `API.Booking.${utils.generateRandomString(6)}`,
      lastname: utils.generateRandomString(8),
      totalprice: PRICE.MIN,
      depositpaid: true,
      bookingdates: { checkin: utils.getFutureDate(1), checkout: utils.getFutureDate(7) },
    },
  },
};
```

**Layer 3 — spec** references the instance, and the title + assertion express the requirement.
The `context`/`it` titles reference the constraint (`PRICE.MIN`) rather than a raw `1`:

```javascript
// cypress/integration/api/rb.booking.api.spec.js
import { booking_examples as testData } from '../../integration-examples/api/rb.booking.api.examples';
import { PRICE } from '../../constants/api/rb.booking.api.constraints';

describe('RestfulBooker.Booking: Given no preconditions', { testIsolation: false }, () => {
  context(`RestfulBooker.Booking.Create.POST: When booking with price of ${PRICE.MIN} is provided`, () => {
    it(`RestfulBooker.Booking.Create.POST: Then return 200 and totalprice equals ${PRICE.MIN}`, { req: { p: 'P1' } }, () => {
      cy.restfullBooker__createBooking__POST(testData.validBookings.allFieldsWithMinimalPrice).then((res) => {
        expect(res.status).to.eq(200);
        expect(res.body.booking.totalprice).to.eq(PRICE.MIN);
      });
    });
  });
});
```

The chain resolves end to end:

```
PRICE.MIN = 1                                          ← constraint
  → validBookings.allFieldsWithMinimalPrice.totalprice ← example
    → context/it titles + assertion (expect … eq PRICE.MIN) ← spec
```

Each named example instance maps 1-to-1 to a `context` block, so the case tested and the requirement stated always
agree. The `{ req: {...} }` object on each `it` carries requirement metadata (priority, extra preconditions, story
`refs`, `bugs`, a free-text `note` about the checks) — its field-by-field schema and the ESLint rules that enforce it
are owned by the [eslint-custom-rules](../.claude/skills/eslint-custom-rules/SKILL.md) skill.

## Extracting requirements

Titles and `req` metadata are machine-extractable into requirement reports:

```bash
npm run req:extract          # JSON to stdout
npm run req:extract:yaml     # YAML → reports/requirements.yaml
npm run req:extract:md       # Markdown → reports/requirements.md
npm run req:extract:json     # JSON → reports/requirements.json
npm run req:coverage         # P1/P2/P3 coverage counts
npm run req:coverage:check   # Fail if P1 coverage below threshold
```

## Source of truth

The skills below govern the canonical rules for this methodology. This page is human
orientation only — where they disagree, the skills win.

- [constraints-examples-specs-approach](../.claude/skills/constraints-examples-specs-approach/SKILL.md) — the
  traceability model: principles, chain integrity, layer separation, outcome titles.
- [define-constraints](../.claude/skills/define-constraints/SKILL.md) — constraint file layout, naming, and boundary
  authoring.
- [define-examples](../.claude/skills/define-examples/SKILL.md) — example file layout, instance naming, composition, and
  aliasing.
- [write-integration-api-specs](../.claude/skills/write-integration-api-specs/SKILL.md), [write-integration-ui-specs](../.claude/skills/write-integration-ui-specs/SKILL.md), [write-e2e-ui-specs](../.claude/skills/write-e2e-ui-specs/SKILL.md) —
  spec titles, structure, `req` usage, and cleanup.
- [eslint-custom-rules](../.claude/skills/eslint-custom-rules/SKILL.md) — the `req` config field schema and the ESLint
  rules that enforce titles, naming, and structure.

## Related

- [Bug tracking](../.claude/skills/bug-tracking/SKILL.md)
- [Localization testing](../.claude/skills/localization-testing/SKILL.md)
- [FAQ](./faq.md)
