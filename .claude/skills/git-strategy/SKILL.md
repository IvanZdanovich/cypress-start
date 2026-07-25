---
name: git-strategy
description: Use when creating branches, writing commits, or opening pull requests in this repository.
---

# Principles

LINEAR_HISTORY: squash merge only, one commit per change — otherwise merge and rebase commits fracture `main` so it no longer bisects and a ticket no longer maps to a single revision
ATOMICITY: one logical change per commit — otherwise a mixed commit cannot be reverted or reviewed without collateral
INTENT_OVER_ACTION: commit body explains _why_, not _what_ — otherwise the reasoning is lost while the diff still shows what, and the part that decays goes unrecorded
TRACEABILITY: ticket key threads branch, commit scope, and PR title — otherwise a change with no ticket link strands its context

# Method

## Branching

SYNC: `git checkout main && git pull` before branching, so the branch starts from current base
BASE_BRANCH: `main`
BRANCH_NAME: `feature/<TICKET_KEY>-<short-kebab-description>`

## Commits

STYLE: Conventional Commits — `<type>(<scope>): <imperative summary>`
MOOD: imperative summary
SCOPE: optional, ticket key when helpful, e.g. `feat(B52-1234): add cart link`
BODY: optional, explain _why_

## Pull requests

CHECKS: pre-commit checks pass before pushing → open PR against `main`
TITLE: mirrors the squash-commit message
REVIEW: one approval required
PR_UPDATES: follow-up commits push to the same branch
MERGE: squash and merge once approved

# Validation

BRANCH_CHECK: branch name matches `feature/<TICKET_KEY>-<short-kebab-description>`
CHECKS_GATE: pre-commit checks pass before suggesting a PR
COMMIT_CHECK: each commit is a single logical change with a Conventional Commits summary
MERGE_CHECK: squash merge into `main`, no merge or rebase commits
