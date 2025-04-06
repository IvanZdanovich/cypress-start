## Branching and Merge Strategy

### Branches

- `main`: Contains stable tests ready for execution
- `feature/<KEY>-1234-<description>`: Feature branches for developing new specifications

### Merge Requirements

- Pull requests require at least one review
- Reviewer should run tests locally
- Only squashed PRs are allowed
- Code must pass pre-commit quality checks

## Contributing

1. Create a feature branch from `main`
2. Develop and test your changes
3. Run the pre-commit checks locally
4. Submit a pull request for review
5. Address any review comments
6. Once approved, squash and merge to `main`
