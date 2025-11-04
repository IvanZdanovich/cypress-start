# Color Theme Testing in Cypress

## Overview

The project manages color themes using environment variable and file copying to support multiple color configurations.

## Implementation Details

### Environment Variables

- `COLOUR_THEME`: Specifies the theme code to use (defaults to "default" if not set)

### JSON Theme Files

Colour values are stored in JSON files, organized by themes.

### Pretest Script

A pretest script copies the appropriate colour theme file to a common file (`current-theme-colours.json`) before tests
run.

Run the pretest script to update the current theme:

```bash
  COLOUR_THEME=default npm run pretest
```

### Accessing Theme Colors

In your tests, you can access the colour values using global variable `colours`.

