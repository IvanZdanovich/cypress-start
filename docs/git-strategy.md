# Git strategy

## Branches

| Branch                             | Purpose                                 |
|------------------------------------|-----------------------------------------|
| `main`                             | Stable tests ready for execution        |
| `feature/<KEY>-1234-<description>` | Feature branches for new specifications |

## Merge requirements

- Pull requests require at least one review
- Reviewer runs tests locally
- Only squash merges allowed
- Code passes pre-commit quality checks — see [Pre-commit check](pre-commit-check.md)

## Contributing workflow

1. Create feature branch from `main`
2. Develop and test changes
3. Run pre-commit checks locally
4. Submit pull request for review
5. Address review comments
6. Squash and merge to `main`
