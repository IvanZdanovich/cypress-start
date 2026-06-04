# Tagging strategy

## Recommendation

Avoid tags. Use naming conventions and folder structure to organize and filter tests instead.

Generic tags (`@smoke`, `@regression`, `@api`, `@ui`, module-specific) create ambiguity about which tests they include.
File-name-based filtering provides the same capability with no additional tooling.

## Tags in the framework

No tag implementation is provided. The framework relies on:

- File naming patterns for filtering (e.g. `*.api.spec.js`, `*.ui.spec.js`)
- Folder structure for test type separation (`cypress/integration/api/`, `cypress/integration/ui/`, `cypress/e2e/ui/`)
- `SPEC_PATTERN` environment variable for parallel execution scoping

If needed, `@cypress/grep` can be added for custom filtering.

## Exception: non-functional requirement tags

Tags may identify non-functional concerns (e.g. `@negative` for error-handling scenarios). Use caution in multi-step E2E
flows — tags that skip setup steps will break dependent assertions.

## Related

- [Naming conventions](naming-conventions.md)
- [Parallel execution](parallel-execution.md)
