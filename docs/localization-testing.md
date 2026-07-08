# Localization

Tests assert localized UI text through the global `l10n` map, never hardcoded strings. Keys are flat, dot-namespaced,
and shared byte-for-byte with the frontend — the key string is the contract.

```javascript
cy.get(auditType.creation.title).should('have.text', l10n['auditType.create.title']);
```

## How it works

- One flat JSON per language at `cypress/localization/{lang}-localization.json` (`"dotted.key": "Translated text"`, no
  nesting). These are the source files you edit.
- `pretest` copies the `LANGUAGE`-selected file to the generated `cypress/localization/l10n.json` (the global `l10n`
  map) and regenerates `cypress/support/l10n.d.ts`, which types keys so a missing or renamed key is a dev-time error.

```bash
LANGUAGE=en npm run pretest      # select language + regenerate types
npm run gen:l10n-types           # regenerate types on demand
```

## Source of truth

The **[localization-testing skill](../.claude/skills/localization-testing/SKILL.md)** governs key grammar, feature
scopes, `common.*` reuse rules, normalization, and the add/rename/remove/dedupe procedures. Follow it when touching
keys — this page is only a human orientation.

## Related

- [Colour theme testing](colour-theme-testing.md)
- [Constraints → Examples → Specs](requirements-examples-approach.md)