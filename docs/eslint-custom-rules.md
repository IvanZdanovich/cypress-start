# Custom ESLint Rules

This project ships a local ESLint plugin that enforces spec conventions no
off-the-shelf rule covers: title grammar, command naming, structure coverage,
data-loop bans, and dead-code detection.

## Where rules live

- **Implementations:** `eslint-plugin-custom-rules/<rule-name>.js`
- **Plugin export:** `eslint-plugin-custom-rules/index.js`
- **Registration:** `eslint.config.mjs`, under the `custom/` namespace; all custom rules are set to `error`
- **Structure data:** `eslint-plugin-custom-rules/app-structure/{modules,components,workflows}.json`

Most rules self-limit by filename or path in their `create()` function. A reported `custom/*` violation means the file
matched that rule's scope gate, such as `.spec.js`, `.api.commands.js`, `/commands/ui/`, a `selectors.js` basename, or a
`/test-data/` path segment.

## Running lint

- `npm run lint` — report violations
- `npm run lint -- --fix` — auto-fix the fixable rules (blank lines, title terminology, structure files, single-line unused selectors/test-data)

## Rules by concern

**Titles and structure**

- `verify-test-title-pattern` — `describe` titles match `Module.Sub: Given …`; `context` titles match
  `Module.Sub.ROLE: When …`; `it` titles match `Module.Sub.ROLE: Then …`. Descriptions are 1-200 characters with no
  trailing space. `STATE:`-prefixed contexts are exempt.
- `verify-test-title-without-forbidden-symbols` — `describe` and `context` titles have no leading/trailing whitespace and
  none of `! @ # $ % ^ & * ( ) + = { } [ ] | \ ; " ' < > ? /`.
- `prevent-duplicated-titles` — every `describe` and `context` title, including `.skip` and `.only`, is unique within the
  linted file.
- `standardize-test-titles` — title terms normalize to canonical common, UI, and API vocabulary. The mapping arrays in
  `eslint-plugin-custom-rules/standardize-test-titles.js` are the wording glossary. This rule is fixable.
- `enforce-spec-blank-lines` — inside `describe` and `context` bodies, consecutive `it`/hook blocks have no blank line
  between them, and each nested `context` has exactly one blank line before it. Non-test statements reset the tracker.
  This rule is fixable.
- `do-not-allow-empty-blocks` — `it`, `context`, and `context.skip` bodies contain real statements, not only a title or
  comment. `STATE:`-prefixed contexts may be empty.
- `verify-test-title-against-structure` — the dotted title prefix exists in the matching
  `eslint-plugin-custom-rules/app-structure/{modules,components,workflows}.json` file. `--fix` regenerates those files
  from current titles with additive, PascalCase-only, sorted entries.

**Naming**

- `verify-api-command-naming` — in `cypress/commands/api/*.api.commands.js`, `Cypress.Commands.add` names match
  `resource__action__METHOD`. `resource` and `action` are camelCase; `METHOD` is `GET`, `POST`, `PUT`, `PATCH`, or
  `DELETE`.
- `verify-ui-command-naming` — in `cypress/commands/ui/*.ui.commands.js`, command names match exactly two camelCase
  parts: `page__action`.
- `verify-req-config` — validates the shape of the optional `req` metadata object on `it`, `describe`, and `context`
  configs.

**`req` metadata schema**

The `req` object allows only these fields:

- `p` — priority value `'P1'`, `'P2'`, or `'P3'`. `P2` is the default and is conventionally omitted.
- `preconditions` — non-empty array of non-empty strings.
- `refs` — non-empty array of valid HTTP/HTTPS URLs.
- `bugs` — non-empty array of bug IDs or valid URLs. Bug IDs use `BUG-[A-Z0-9]+-NNN`, for example `BUG-AUDIT65-001`.
- `note` — non-empty string explaining the checks.

Unknown keys, empty arrays, and empty notes are errors. The rule validates field shape only; the spec-writing docs and
skills define what belongs in each field.

**Data and examples**

- `prevent-examples-loops` — inside `describe`, `context`, and `it` blocks, no `.forEach`, `for...of`, or `for...in` over
  data-shaped operands such as names matching `testData`, `invalid`, `valid`, `Array`, `items`, `values`, or `data`.
  Hooks are excluded. Pick one randomized value in the examples file instead of looping in the spec.
- `find-unused-examples` — flags first-level exported instances unused by any spec or command, with import aliases
  resolved. Single-line unused entries are fixable; multi-line entries are removed by hand. Its current scope gate fires
  only on `/test-data/`, while this repo stores examples under `cypress/integration-examples/` and
  `cypress/e2e-examples/`, so it remains dormant until the gate is intentionally migrated or existing unused examples
  are cleaned.
- `find-unused-selectors` — selector keys in `cypress/selectors/selectors.js` must be referenced across integration,
  e2e, or command files. A parent selector survives if any child selector is used. Single-line and empty entries are
  fixable.

**Guardrails**

- `verify-todos-have-links` — `TODO`, `FIXME`, `ToDo`, and `FixMe` comments include a bug-tracker URL containing a
  `/browse/PROJ-123`-style key. In spec files, prefer `req.bugs` over inline TODOs.

## Suppressing custom rules

Use inline disables only for false positives or unavoidable constraints. Disable the specific rule with the `custom/`
prefix; Cypress plugin rules use the `cypress/` prefix. Inline disables do not count toward the warning/error ratios in
`scripts/thresholds.json`.

```js
// eslint-disable-next-line custom/find-unused-selectors
reservedForFutureUse: '[data-test="future-element"]';
```

## Adding or changing a rule

- Implement the rule in `eslint-plugin-custom-rules/<rule-name>.js`.
- Export it from `eslint-plugin-custom-rules/index.js`.
- Register it under `custom/<rule-name>` in `eslint.config.mjs`.
- Keep the rule description on this page aligned with the implemented scope gate, exemptions, and fixability.
- Describe a rule as fixable only when its source provides a fixer. Current fixable custom rules are
  `enforce-spec-blank-lines`, `standardize-test-titles`, `verify-test-title-against-structure`, `find-unused-examples`,
  and `find-unused-selectors`.

## Related

- [Constraints → Examples → Specs](constraints-examples-specs-approach.md)
- [Coverage gap analysis](coverage-gap-analysis.md)
- [Pre-commit check](pre-commit-check.md)
