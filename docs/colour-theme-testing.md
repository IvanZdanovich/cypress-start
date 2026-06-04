# Colour theme testing

## Configuration

| Variable       | Purpose                              | Default   |
|----------------|--------------------------------------|-----------|
| `COLOUR_THEME` | Theme code for colour file selection | `default` |

## How it works

1. Pretest script copies the appropriate colour theme file to `current-theme-colours.json`
2. Tests access colour values via global `colours` variable

```bash
COLOUR_THEME=default npm run pretest
```

## Usage in tests

Use `colours` global variable instead of hardcoded hex values:

```javascript
cy.get(loginPage.username).should('have.css', 'border-bottom-color', colours.ERROR);
```

## Related

- [Localization testing](localization-testing.md)
- [Test writing guideline](test-writing-guideline.md)
