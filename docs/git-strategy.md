# Git strategy

Feature branches off `main`, Conventional Commits, and squash-merge only. Every change threads a ticket key through
its branch, commit scope, and PR title.

- Branch from current `main`: `feature/<TICKET_KEY>-<short-kebab-description>`.
- One approval required; the reviewer runs tests locally.
- Pre-commit checks must pass before opening a PR — see [Pre-commit check](pre-commit-check.md).
- Merge with squash only, so `main` keeps a linear one-commit-per-change history.

## Source of truth

The **[git-strategy skill](../.claude/skills/git-strategy/SKILL.md)** governs branching, commit style, and pull-request
rules. Follow it when branching, committing, or opening PRs — this page is only a human orientation.

## Related

- [Pre-commit check](pre-commit-check.md)
