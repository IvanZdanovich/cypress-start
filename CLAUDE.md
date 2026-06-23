# CLAUDE.md

Agent reference for the Cypress test framework. Read `AGENTS.md` for full project rules and values.

## Skill routing

- `cypress/constants/api/*.api.constraints.js` — use `define-constraints`
- `cypress/constants/ui/*.ui.constraints.js` — use `define-constraints`
- `cypress/integration-examples/api/*.api.examples.js` — use `define-examples`
- `cypress/integration-examples/ui/*.ui.examples.js` — use `define-examples`
- `cypress/e2e-examples/ui/*.ui.examples.js` — use `define-examples`
- `cypress/integration/api/*.api.spec.js` — use `write-integration-api-specs`
- `cypress/integration/ui/*.ui.spec.js` — use `write-integration-ui-specs`
- `cypress/e2e/ui/*.ui.spec.js` — use `write-e2e-ui-specs`
- `cypress/commands/api/*.api.commands.js` — use `write-commands`
- `cypress/commands/ui/*.ui.commands.js` — use `write-commands`
- `docs/*.md` — use `write-documentation`
- `.claude/skills/<name>/SKILL.md` — use `create-skill`
- Executable requirements design or review — use `constraints-examples-specs-approach`
- Branching, committing, opening PRs — use `git-strategy`