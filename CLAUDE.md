# CLAUDE.md

Agent reference for the Cypress test framework. Read `AGENTS.md` for full project rules and values.

## Skill routing

- `cypress/constants/api/*.api.constraints.js` → `define-constraints`
- `cypress/constants/ui/*.ui.constraints.js` → `define-constraints`
- `cypress/integration-examples/api/*.api.examples.js` → `define-examples`
- `cypress/integration-examples/ui/*.ui.examples.js` → `define-examples`
- `cypress/e2e-examples/ui/*.ui.examples.js` → `define-examples`
- `cypress/integration/api/*.api.spec.js` → `write-integration-api-specs`
- `cypress/integration/ui/*.ui.spec.js` → `write-integration-ui-specs`
- `cypress/e2e/ui/*.ui.spec.js` → `write-e2e-ui-specs`
- `cypress/commands/api/*.api.commands.js` → `write-commands`
- `cypress/commands/ui/*.ui.commands.js` → `write-commands`
- `docs/*.md` → `write-documentation`
- `.claude/skills/<name>/SKILL.md` → `create-skill`
- Executable requirements design or review → `constraints-examples-specs-approach`
- Branching, committing, opening PRs → `git-strategy`