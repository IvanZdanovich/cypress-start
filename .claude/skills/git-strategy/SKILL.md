---
name: git-strategy
description: Use when creating branches, writing commits, or opening pull requests in this repository. Enforces branch naming, Conventional Commits style, squash-merge PRs, and the contributing workflow.
---

# Git strategy

PURPOSE: apply the project's branching, commit, and PR conventions consistently

# Commits

STYLE: Conventional Commits — `<type>(<scope>): <imperative summary>`
MOOD: imperative
SCOPE: optional; use ticket key when helpful, e.g. `feat(B52-1234): add cart link`
BODY: optional; explain *why*, not *what*

# Pull requests

TITLE: mirrors the squash-commit message — `<type>(<scope>): <imperative summary>`
BASE_BRANCH: `main`
MERGE_STRATEGY: squash merge only
REVIEW: at least one approval required before merge
CHECKS: pre-commit quality checks must pass

# Workflow

SYNC: `git checkout main && git pull` before branching
BRANCH: `git checkout -b feature/<TICKET_KEY>-<short-kebab-description>`
CHECKS: run pre-commit checks before pushing
PR_TARGET: `main`
REVIEW_UPDATES: follow-up commits on the same branch
MERGE: squash and merge once approved

# Guards

BRANCH_CHECK: branch name matches `feature/<TICKET_KEY>-<short-kebab-description>` before any push
PRE_COMMIT: pre-commit checks pass before suggesting a PR
