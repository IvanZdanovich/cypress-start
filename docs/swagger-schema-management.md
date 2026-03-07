# Swagger Schema Management

This document describes how to manage and update Swagger/OpenAPI schema files used for API testing reference.

## Overview

The project maintains local copies of Swagger JSON schemas from various API environments. These schemas are stored in
`${WORKSPACE_ROOT}/development-data/swagger/` and serve as reference documentation for API testing.

## Updating Schemas

### Manual Update

To manually update all Swagger schemas from their sources, run:

```bash
npm run update-swagger
```

This script will:

1. Download the latest Swagger JSON from all configured sources
2. Validate the JSON format
3. Format the JSON with proper indentation
4. Save to `${WORKSPACE_ROOT}/development-data/swagger/`
5. Display a summary of successful and failed downloads

### Script Location

The update script is located at:

```
${WORKSPACE_ROOT}/scripts/update-swagger-schemas.js
```

## When to Update

Update the schemas when:

- API endpoints change (new endpoints, modified parameters, etc.)
- Response structures are updated
- Starting work on new API integration tests
- After major API releases or updates
- When encountering unexpected API behavior

## Troubleshooting

### Network Errors

If downloads fail due to network issues:

- Check your internet connection
- Verify the API URLs are accessible
- Check if VPN is required for certain environments

### Invalid JSON

If JSON validation fails:

- The API might be temporarily unavailable
- Check if the Swagger endpoint URL has changed
- Verify the endpoint is returning valid JSON

### Permission Errors

If file write errors occur:

- Ensure the `development-data/swagger/` directory exists
- Check write permissions for the directory

## Adding New Schema Sources

To add a new schema source, edit `${WORKSPACE_ROOT}/scripts/update-swagger-schemas.js`:

1. Add a new entry to the `SCHEMA_SOURCES` array:

    ```Javascript
      const SCHEMA_SOURCES = [
        { 
          url: 'https://api.example.com/swagger.json',
          filename: 'api.example.com.swagger.json',
          description: 'Example API Description',
        },
      ];
    ```

2. Run the update script to test:

    ```bash
      npm run update-swagger
    ```

## File Naming Convention

Schema files follow this naming pattern:

```
{hostname}.{swagger-path}.json
```

## Notes

- Schemas are NOT committed to version control if they are too large
- Update schemas locally as needed for development reference
- The script downloads schemas sequentially with a 500ms delay between requests
- All downloaded JSON is automatically formatted with 2-space indentation
- Failed downloads will cause the script to exit with code 1

