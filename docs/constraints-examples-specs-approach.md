# Constraints → Examples → Specs

Human orientation to the methodology this project uses. The canonical rules live in the skills listed
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
    - Skill: [define-constraints](../.claude/skills/define-constraints/SKILL.md)
- **2. Examples** — named test-data instances composed *from* constraints; one key = one tested state.
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
    it(
      `RestfulBooker.Booking.Create.POST: Then return 200 and totalprice equals ${PRICE.MIN}`,
      { req: { p: 'P1' } },
      () => {
        cy.restfullBooker__createBooking__POST(testData.validBookings.allFieldsWithMinimalPrice)
          .then((res) => {
            expect(res.status).to.eq(200);
            expect(res.body.booking.totalprice).to.eq(PRICE.MIN);
          });
      },
    );
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
are documented in [Custom ESLint Rules](eslint-custom-rules.md).

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

## Reasoning principles

- **Single owner** — every data value has exactly one authoritative source that consumers import. Otherwise a second
  copy drifts and no reader knows which is canonical.
- **Layer separation** — constraints own boundaries, examples own composition, specs own assertions. Otherwise a
  boundary change ripples into files that should not care.
- **Chain integrity** — every value traces constraint → example → spec unbroken. Otherwise a mid-chain literal is an
  orphan that no requirement backs and no boundary governs.
- **Outcome titles** — a spec title states the business requirement, not the mechanics. Otherwise the requirement of
  record is vague and the assertion is untraceable.

## Output shape

- **Constraints** — boundary values, defaults, and system constants in `cypress/constants/`.
- **Examples** — executable named instances composed from constraints in `cypress/integration-examples/` and
  `cypress/e2e-examples/`.
- **Specs** — requirement titles and assertions in `cypress/integration/` and `cypress/e2e/`.
- **Chain direction** — constraint value → example field → spec title → assertion.
- **Boundary to example** — examples import constraint constants and compose fields from them.
- **Example to spec** — specs import examples and reference instances directly.
- **Spec to assertion** — the `it` title names the business outcome; the assertion verifies an example value or a
  constraint boundary.
- **Requirement to layers** — one business requirement → constraint boundary + example instance + spec assertion.
- **Boundary split** — one constraint file per domain concept.
- **Instance split** — one example key per distinct tested state.
- **Spec split** — one `it` per verified outcome; related property checks on the same element are allowed.
- **Multi-module** — each module keeps its own constraints and examples; a spec imports from all. Colocating another
  module's data would give it two owners.
- **API/UI divergence** — examples mirror the API field name; specs use `l10n` for UI text. The API name is the data's
  identity, the UI string is presentation.
- **Constraint overlap** — a boundary enforced across multiple modules or pages goes in a domain-tier file
  (`domain-name.api.constraints.js` or `domain-name.ui.constraints.js`), named after the domain concept, never after a
  consumer, so no consumer owns shared truth.
- **Example coupling** — a spec creates its own instance via an API command; never import another spec's examples.
  Cross-spec imports couple unrelated files and break isolation.
- **Broken-chain signal** — a literal in a spec that could trace to a constraint should be extracted to its owning
  layer.

## Validation checks

- **Trace check** — every asserted value resolves constraint → example field → spec title → assertion end to end.
- **Placement check** — no boundary literal in examples, no payload reconstruction in specs.
- **Single-owner check** — no duplicated definitions across layers.
- **Chain completeness** — every asserted value traces to its source; exported examples are consumed by specs; unused
  constraints require removal or a named shared-domain purpose.

## Source of truth

The skills and docs below govern the canonical rules for this methodology. This page is human orientation for the model;
where a linked source gives narrower guidance, follow that source.

- [define-constraints](../.claude/skills/define-constraints/SKILL.md) — constraint file layout, naming, and boundary
  authoring.
- [define-examples](../.claude/skills/define-examples/SKILL.md) — example file layout, instance naming, composition, and
  aliasing.
- [write-integration-api-specs](../.claude/skills/write-integration-api-specs/SKILL.md), [write-integration-ui-specs](../.claude/skills/write-integration-ui-specs/SKILL.md), [write-e2e-ui-specs](../.claude/skills/write-e2e-ui-specs/SKILL.md) —
  spec titles, structure, `req` usage, and cleanup.

## Related

- [Bug tracking](../.claude/skills/bug-tracking/SKILL.md)
- [Localization testing](../.claude/skills/localization-testing/SKILL.md)
- [FAQ](FAQ.md)
