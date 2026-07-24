# Colour theme testing

Tests assert CSS colour values through the global `colours` map, never hardcoded `rgb(…)` strings. Keys are flat,
dot-namespaced, and typed — a missing or renamed key is a dev-time error.

```javascript
cy.get(inventoryPage.card.add).should('have.css', 'background-color', colours['button.compliant']);
```

## How it works

- One flat JSON per theme at `cypress/colours/{theme}-theme-colours.json` (`"dotted.key": "rgb(…)"`, no nesting). These
  are the source files you edit.
- `pretest` copies the `COLOUR_THEME`-selected file to the generated `cypress/colours/colours.json` (the global
  `colours` map) and regenerates `cypress/support/colours.d.ts`, which types keys so a missing or renamed key is a
  dev-time error.

```bash
COLOUR_THEME=default npm run pretest      # select theme + regenerate types
npm run colours:gen-types                  # regenerate types on demand
npm run colours add <key> <value>          # add a key to every theme file (interactive if no args)
npm run colours remove <key>               # remove a key from every theme file
npm run colours sync                       # align theme files (add missing, sort)
```

All colour operations run through the single `scripts/colours.js` CLI (`node scripts/colours.js help`).

## Source of truth

The **[colour-theme-testing skill](../.claude/skills/colour-theme-testing/SKILL.md)** governs key grammar, component
scopes, the add/rename/remove/dedupe procedures, and the sync pipeline. Follow it when touching keys — this page is only
a human orientation.

## Related

- [Localization](localization-testing.md)
- [Constraints → Examples → Specs](constraints-examples-specs-approach.md)
