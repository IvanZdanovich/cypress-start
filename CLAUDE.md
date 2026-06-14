# CLAUDE.md

Agent reference for the Cypress test framework. Read `AGENTS.md` for full project rules and values.

## Skills

| Skill | Trigger | SKILL.md |
|-------|---------|----------|
| `write-integration-api-specs` | Creating or updating Integration API specs | `.claude/skills/write-integration-api-specs/SKILL.md` |
| `write-integration-ui-specs` | Creating or updating Integration UI specs | `.claude/skills/write-integration-ui-specs/SKILL.md` |
| `write-e2e-ui-specs` | Creating or updating E2E UI workflow specs | `.claude/skills/write-e2e-ui-specs/SKILL.md` |
| `define-examples` | Creating or updating example files | `.claude/skills/define-examples/SKILL.md` |
| `define-constraints` | Creating or updating constraint files | `.claude/skills/define-constraints/SKILL.md` |
| `constraints-examples-specs-approach` | Designing or reviewing executable requirements | `.claude/skills/constraints-examples-specs-approach/SKILL.md` |
| `write-documentation` | Creating or updating `docs/` Markdown files | `.claude/skills/write-documentation/SKILL.md` |
| `git-strategy` | Branching, committing, or opening PRs | `.claude/skills/git-strategy/SKILL.md` |
| `create-skill` | Creating or updating skill files in `.claude/skills/` | `.claude/skills/create-skill/SKILL.md` |

## File ownership

| Artifact | Location | Skill |
|----------|----------|-------|
| API constraints | `cypress/constants/api/*.api.constraints.js` | `define-constraints` |
| UI constraints | `cypress/constants/ui/*.ui.constraints.js` | `define-constraints` |
| API examples | `cypress/integration-examples/api/*.api.examples.js` | `define-examples` |
| UI examples | `cypress/integration-examples/ui/*.ui.examples.js` | `define-examples` |
| E2E examples | `cypress/e2e-examples/ui/*.ui.examples.js` | `define-examples` |
| API specs | `cypress/integration/api/*.api.spec.js` | `write-integration-api-specs` |
| UI specs | `cypress/integration/ui/*.ui.spec.js` | `write-integration-ui-specs` |
| E2E specs | `cypress/e2e/ui/*.ui.spec.js` | `write-e2e-ui-specs` |
| Docs | `docs/*.md` | `write-documentation` |
| Skills | `.claude/skills/<name>/SKILL.md` | `create-skill` |

## Traceability chain

```
constraints → examples → specs
   ↓              ↓         ↓
boundary       named      Given/
values         payloads   When/Then
```

## Key conventions

```
API command:   cy.moduleName__operationDetails__METHOD()
UI command:    cy.pageName__action()
describe:      'Module.Submodule: Given preconditions'
context:       'Module.Submodule.Operation.METHOD: When condition'
it:            'Module.Submodule.Operation.METHOD: Then expected result'
```

## Globals

`utils`, `l10n`, `colours`, `apiUrls`, `uiUrls`, `userRoles`, `companies`, `apiErrors`, selector page variables

## Related

- [AGENTS.md](AGENTS.md)
- [Naming conventions](docs/naming-conventions.md)
- [ESLint custom rules](docs/eslint-custom-rules.md)
- [Test writing guideline](docs/test-writing-guideline.md)
- [Requirements examples approach](docs/requirements-examples-approach.md)

