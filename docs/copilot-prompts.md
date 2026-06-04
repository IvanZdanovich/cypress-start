# Copilot prompts

Ready-to-use prompts for AI assistants working with test files.

## Integration API tests

### Refactoring

```
TASK: Refactor Integration API test TO production standards
INPUT: attached test file
FOLLOW:
  - .github/instructions/integration.api.instructions.md
  - .github/instructions/constraints.api.instructions.md
  - .github/instructions/integration-examples.api.instructions.md

EXECUTE:
1. EXTRACT hard-coded values TO constraints and examples:
   - Constraints: cypress/constants/api/[module].api.constraints.js
   - Examples: cypress/integration-examples/api/[module].[submodule].api.examples.js
   - USE utils for dynamic data, boundary values from constraints
   - EXPORT namePrefix for cleanup

2. IMPLEMENT cleanup:
   - cleanUp() using cy.module__deleteByNames__DELETE(token, [namePrefix])
   - CALL in both before AND after hooks

3. RANDOMIZE test data:
   - ONE random value per execution, NO forEach/for...of loops

4. ADD req metadata to it blocks:
   - { req: { p: 'P1'|'P2'|'P3', bugs: [], preconditions: [], refs: [] } }

5. VALIDATE naming PER docs/naming-conventions.md

6. LOG bugs to bug-log/bug-log.json, reference via req.bugs

OUTPUT:
- Refactored spec file
- Constraints file (if new boundaries found)
- Examples file
- API commands file (if new operations needed)
```

### Creating new tests

```
TASK: Create Integration API tests for [module/endpoint]
INPUT: API documentation or Swagger specification
FOLLOW:
  - .github/instructions/integration.api.instructions.md
  - .github/instructions/constraints.api.instructions.md
  - .github/instructions/integration-examples.api.instructions.md
  - .github/instructions/commands.api.instructions.md

EXECUTE:
1. CREATE files:
   - Spec: cypress/integration/api/[module].[submodule].api.spec.js
   - Constraints: cypress/constants/api/[module].api.constraints.js
   - Examples: cypress/integration-examples/api/[module].[submodule].api.examples.js
   - Commands: cypress/commands/api/[module].api.commands.js

2. REGISTER in eslint-plugin-custom-rules/app-structure/expected/modules.json

3. COVER: happy path, validation errors, auth errors, boundary values, error handling

4. LOG bugs to bug-log/bug-log.json

OUTPUT:
- Complete spec, constraints, examples, commands files
- Updated modules.json
```

## Integration UI tests

### Refactoring

```
TASK: Refactor Integration UI test TO production standards
INPUT: attached test file
FOLLOW:
  - .github/instructions/integration.ui.instructions.md
  - .github/instructions/constraints.ui.instructions.md
  - .github/instructions/integration-examples.ui.instructions.md

EXECUTE:
1. EXTRACT hard-coded values:
   - Localization: use global l10n variable
   - Colours: use global colours variable
   - Constraints: cypress/constants/ui/[page].ui.constraints.js
   - Examples: cypress/integration-examples/ui/[page].[component].ui.examples.js

2. IMPLEMENT cleanup using API commands in before/after hooks

3. RANDOMIZE test data, NO loops

4. VALIDATE selectors from cypress/selectors/selectors.js

5. ADD req metadata to it blocks

6. LOG bugs to bug-log/bug-log.json, reference via req.bugs

OUTPUT:
- Refactored spec file
- Constraints file (if needed)
- Examples file
- UI commands file (if needed)
```

### Creating new tests

```
TASK: Create Integration UI tests for [page/component]
INPUT: Page or component specifications
FOLLOW:
  - .github/instructions/integration.ui.instructions.md
  - .github/instructions/constraints.ui.instructions.md
  - .github/instructions/integration-examples.ui.instructions.md
  - .github/instructions/commands.ui.instructions.md

EXECUTE:
1. CREATE files:
   - Spec: cypress/integration/ui/[page].[component].ui.spec.js
   - Examples: cypress/integration-examples/ui/[page].[component].ui.examples.js
   - Commands: cypress/commands/ui/[page].ui.commands.js (if needed)

2. REGISTER in eslint-plugin-custom-rules/app-structure/expected/components.json

3. ADD selectors to cypress/selectors/selectors.js

4. COVER: element visibility, user interactions, validation messages, state changes, l10n, colours

OUTPUT:
- Complete spec, examples, commands files
- Updated components.json and selectors
```

## E2E UI tests

### Refactoring

```
TASK: Refactor E2E UI test TO production standards
INPUT: attached test file
FOLLOW:
  - .github/instructions/e2e.ui.instructions.md
  - .github/instructions/e2e-examples.ui.instructions.md

EXECUTE:
1. EXTRACT hard-coded values:
   - Examples: cypress/e2e-examples/ui/[workflow].ui.examples.js
   - USE l10n, colours globals

2. IMPLEMENT cleanup using API commands in before/after hooks

3. RANDOMIZE test data, NO loops

4. ADD req metadata to it blocks

5. LOG bugs to bug-log/bug-log.json, reference via req.bugs

OUTPUT:
- Refactored spec file
- Examples file
- Updated commands (if needed)
```

### Creating new tests

```
TASK: Create E2E UI tests for [user workflow]
INPUT: User workflow or story specifications
FOLLOW:
  - .github/instructions/e2e.ui.instructions.md
  - .github/instructions/e2e-examples.ui.instructions.md

EXECUTE:
1. CREATE files:
   - Spec: cypress/e2e/ui/[workflow].ui.spec.js
   - Examples: cypress/e2e-examples/ui/[workflow].ui.examples.js

2. REGISTER in eslint-plugin-custom-rules/app-structure/expected/workflows.json

3. USE existing commands from cypress/commands/{api,ui}/

4. COVER: complete happy path, alternative paths, error scenarios, cross-page data persistence

OUTPUT:
- Complete spec and examples files
- Updated workflows.json
```

## Bug investigation

```
TASK: Investigate and resolve test failure
INPUT: Failing test details and error message

EXECUTE:
1. ANALYZE: test code issue OR actual functionality bug?

2. IF test code issue:
   - FIX test code, update assertions, ensure proper selectors/commands

3. IF functionality bug:
   - LOG to bug-log/bug-log.json
   - ADD bug ID to req.bugs in spec
   - Assert ACTUAL behavior (test must pass)
   - Document EXPECTED behavior in bug-log entry

OUTPUT:
- Fixed test code
- Updated bug-log.json (if bug found)
- Root cause explanation
```

## Coverage gap analysis

```
TASK: Analyze test coverage gaps for [type: api|ui|e2e|all]
INPUT: Application specifications + existing test files

EXECUTE:
1. COMPARE documented functionality vs implemented specs
2. CHECK eslint-plugin-custom-rules/app-structure/expected/ vs actual test files
3. RUN npm run coverage:report for automated analysis
4. IDENTIFY: untested endpoints/components/workflows, missing boundary tests, missing error scenarios
5. PRIORITIZE: critical business functionality first

OUTPUT:
- Coverage summary by area
- Prioritized list of missing tests
- Recommended next tests to create
```

## Usage reference

| Prompt                | Use when                           |
|-----------------------|------------------------------------|
| API refactoring       | Improving existing API test files  |
| UI refactoring        | Improving existing UI test files   |
| E2E refactoring       | Improving existing E2E test files  |
| API creation          | Writing new API tests from scratch |
| UI creation           | Writing new UI tests from scratch  |
| E2E creation          | Writing new E2E tests from scratch |
| Bug investigation     | Resolving test failures            |
| Coverage gap analysis | Finding missing test coverage      |

## Related

- [Requirements examples approach](requirements-examples-approach.md)
- [Naming conventions](naming-conventions.md)
- [Test writing guideline](test-writing-guideline.md)
- [ESLint custom rules](eslint-custom-rules.md)
