# Localization Testing in Cypress

## Overview

The project manages localizations using environment variable and file copying to support multiple color configurations.

## Implementation Details

### Environment Variables

- `LANGUAGE`: Specifies the language code.

### JSON Localization Files

Localization strings are stored in JSON files, organized by language.

### Pretest Script

A pretest script copies the appropriate localization file to a common file (`l10n.json`).
Run the pretest script during implementation to update it.

```bash
  LANGUAGE=en npm run pretest
```

### Accessing Localization Strings

In your tests, you can access the localization strings using global variable `l10n`.
