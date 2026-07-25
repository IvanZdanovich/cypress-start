# Custom ESLint Rules

This project ships a local ESLint plugin that enforces spec conventions no
off-the-shelf rule covers: title grammar, command naming, structure coverage,
data-loop bans, and dead-code detection.

## Where rules live

- **Implementations:** `eslint-plugin-custom-rules/<rule-name>.js`
- **Plugin export:** `eslint-plugin-custom-rules/index.js`
- **Registration:** `eslint.config.mjs`, under the `custom/` namespace (all rules set to `error`)
- **Structure data:** `eslint-plugin-custom-rules/app-structure/{modules,components,workflows}.json`

## Running lint

- `npm run lint` — report violations
- `npm run lint -- --fix` — auto-fix the fixable rules (blank lines, title terminology, structure files, single-line unused selectors/test-data)

## Rules by concern

**Titles and structure**

- `verify-test-title-pattern` — Given/When/Then title grammar per block type
- `verify-test-title-without-forbidden-symbols` — no whitespace/special chars in titles
- `prevent-duplicated-titles` — globally unique describe/context titles
- `standardize-test-titles` — canonical UI/API terminology (fixable)
- `enforce-spec-blank-lines` — blank-line layout inside spec bodies (fixable)
- `do-not-allow-empty-blocks` — no empty it/context blocks
- `verify-test-title-against-structure` — title paths tracked in `app-structure/` (fixable)

**Naming**

- `verify-api-command-naming` — `resource__action__METHOD` for API commands
- `verify-ui-command-naming` — `page__action` for UI commands
- `verify-req-config` — schema for the `req` metadata object on `it` blocks

**Data and examples**

- `prevent-examples-loops` — no loops over test data inside specs
- `find-unused-examples` — flag unused exported test-data instances (fixable)
- `find-unused-selectors` — flag unused selectors (fixable)

**Guardrails**

- `verify-todos-have-links` — TODO/FIXME comments need a tracker link

## Source of truth

The full invariant each rule enforces, its scope gate and exemptions, and the
inline suppression rules live in the
**[eslint-custom-rules skill](../.claude/skills/eslint-custom-rules/SKILL.md)**.
Update that skill (not this page) whenever a rule's behaviour changes.

## Related

- [Constraints → Examples → Specs](constraints-examples-specs-approach.md)
- [Coverage gap analysis](coverage-gap-analysis.md)
