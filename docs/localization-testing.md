# Localization testing

## Configuration

| Variable   | Purpose                                       | Example |
|------------|-----------------------------------------------|---------|
| `LANGUAGE` | Language code for localization file selection | `en`    |

## How it works

1. Pretest script copies the appropriate localization file to `l10n.json`
2. Tests access localization strings via global `l10n` variable

```bash
LANGUAGE=en npm run pretest
```

## Usage in tests

Use `l10n` global variable instead of hardcoded text:

```javascript
cy.get(loginPage.title).should('have.text', l10n.loginPage.title);
```

## Related

- [Colour theme testing](colour-theme-testing.md)
- [Test writing guideline](test-writing-guideline.md)
