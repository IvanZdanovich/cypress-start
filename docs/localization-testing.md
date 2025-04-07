# Localization Testing in Cypress

## Overview
This guide explains how to perform localization testing in Cypress by dynamically loading localization strings from JSON files based on the language code.

## Implementation Details

### Environment Variables
- `LANGUAGE`: Specifies the language code.

### JSON Localization Files
Localization strings are stored in JSON files, organized by language.

### Pretest Script
A pretest script copies the appropriate localization file to a common file (`l10n.json`).
Run the pretest script during implementation to update it.

```bash
npm run pretest
```
### Accessing Localization Strings
In your tests, you can access the localization strings using global vaiable `l10n`.

