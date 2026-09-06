# Localization

Tests assert localized UI text through the global `l10n` map, never hardcoded strings. Keys are flat, dot-namespaced,
and shared byte-for-byte with the frontend — the key string is the contract.

```javascript
cy.get(inventoryPage.title).should('have.text', l10n['inventoryPage.title']);
```

## How it works

- One flat JSON per language at `cypress/localization/{lang}-localization.json` (`"dotted.key": "Translated text"`, no
  nesting). These are the source files you edit.
- `pretest` copies the `LANGUAGE`-selected file to the generated `cypress/localization/l10n.json` (the global `l10n`
  map) and regenerates `cypress/support/l10n.d.ts` from the reference `en-localization.json`, so the typed key union is
  the complete, language-independent key set — a missing or renamed key is a dev-time error (per-language drift is
  reported by `npm run l10n:validate` / `npm run sync:l10n -- --check`).

```bash
LANGUAGE=en npm run pretest        # select language + regenerate types
npm run l10n:gen-types             # regenerate types on demand
npm run l10n:add -- <key> <value>  # add a key to every locale file (interactive if no args)
npm run l10n:remove -- <key>       # remove a key from every locale file
npm run sync:l10n                  # align locale files (add missing, sort)
```

All localization operations run through the single `scripts/l10n.js` CLI (`node scripts/l10n.js help`).

## Source of truth

The **[localization-testing skill](../.claude/skills/localization-testing/SKILL.md)** governs key grammar, feature
scopes, `common.*` reuse rules, normalization, and the add/rename/remove/dedupe procedures. Follow it when touching
keys — this page is only a human orientation.

## Related

- [Colour theme testing](colour-theme-testing.md)
- [Constraints → Examples → Specs](constraints-examples-specs-approach.md)
