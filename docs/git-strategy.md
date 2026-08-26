# Git strategy

Feature branches start from `main`, commits use Conventional Commits, and PRs merge with squash only. Every change
threads its ticket key through the branch name, commit scope when useful, and PR title so one ticket maps to one final
revision on `main`.

## Branches

- Sync before branching: `git checkout main && git pull`.
- Base every feature branch on `main`.
- Name feature branches `feature/<TICKET_KEY>-<short-kebab-description>`.
- Push follow-up fixes to the same branch while the PR is open.

## Commits

- Keep each commit to one logical change so it can be reviewed and reverted without collateral changes.
- Use Conventional Commits: `<type>(<scope>): <imperative summary>`.
- Use the ticket key as the scope when it adds traceability, for example `feat(B52-1234): add cart link`.
- Use the optional body for why the change exists; the diff already shows what changed.

## Pull requests

- Run pre-commit checks before opening the PR — see [Pre-commit check](pre-commit-check.md).
- Open PRs against `main`.
- Mirror the intended squash-commit message in the PR title.
- Require one approval; the reviewer runs relevant tests locally.
- Merge with squash only, so `main` keeps a linear one-commit-per-change history.

## Git execution in scripts

Repository scripts that spawn Git use `scripts/git-exec-lib.js` instead of ad-hoc `git` shell calls. The helper resolves
Git from trusted install locations, removes `node_modules` entries from `PATH`, preserves the running Node binary path,
and forces that sanitized environment for every Git call. This avoids executing a malicious `git` binary injected earlier
on `PATH` while keeping scripts portable across macOS, Linux, and Windows Git installs.

## Related

- [Pre-commit check](pre-commit-check.md)
