# Color Theme Testing in Cypress

## Overview

The project manages color themes in a similar way to localization, using environment variables and file copying to
support multiple color configurations.

## Implementation Details

### Environment Variables

- `COLOUR_THEME`: Specifies the theme code to use (defaults to "default" if not set)

### JSON Theme Files

Color values are stored in JSON files following the naming pattern:

- `{theme-name}-theme-colours.json`

### Pretest Script
A pretest script copies the appropriate colour theme file to a common file (`default-theme-colours.json`).
Run the pretest script during implementation to update it.

```bash
npm run pretest
```

### Accessing Theme Colors
In your tests, you can access the colour values using global variable `colours`.
