# AI Agent Guide for Cypress Test Framework

## Project Architecture

**Core Philosophy:** No abstractions (no Page Object Models or BDD frameworks). Tests are self-descriptive using Gherkin-style syntax with strict naming conventions enforced by custom ESLint rules.

**Three Test Types:**
- **Integration API** (`cypress/integration/api/*.api.spec.js`) - Module/submodule API endpoints
- **Integration UI** (`cypress/integration/ui/*.ui.spec.js`) - Page/component behaviors
- **E2E UI** (`cypress/e2e/ui/*.ui.spec.js`) - Complete user workflows

**Test Structure Pattern** (strict):
```javascript
describe('Module.Submodule: Given preconditions', { testIsolation: false }, () => {
  context('Module.Submodule.Operation.METHOD: When condition', () => {
    it('Module.Submodule.Operation.METHOD: Then expected result', () => {
      // Single assertion per it block
    });
  });
});
```

**Global Resources** (loaded in `cypress/support/e2e.js`):
- `global.l10n` - Localization strings from `cypress/localization/l10n.json`
- `global.colours` - Theme colors from `cypress/colours/default-theme-colours.json`
- `global.urls` - API/UI URLs from `cypress/support/urls/urls.js`
- `global.utils` - Random data generators from `cypress/support/utils/utils.js`
- `global.errors` - Expected error messages from `cypress/constants/ui/error-messages.json`
- `global.userRoles` - User role definitions from `cypress/constants/ui/user-roles.js`
- Page selectors (e.g., `global.loginPage`, `global.inventoryPage`) from `cypress/support/selectors/selectors.js`

## Critical Workflows

**Environment Configuration** (handled in `cypress.config.js`):
```bash
# Set environment variables before running tests
LANGUAGE=en COLOUR_THEME=default TARGET_ENV=dev BROWSER=electron npm run test
```

**Parallel Execution** (custom implementation in `scripts/parallel-cypress-runner.js`):
```bash
PARALLEL_STREAMS=6 npm run test:parallel  # Splits tests by naming patterns, not Cypress Cloud
```

**Pre-test Setup** (automated in `package.json` pretest script):
- Copies localization files: `node scripts/copy-localization.js`
- Copies color theme files: `node scripts/copy-colours-theme.js`

**Custom ESLint Rules** (enforced pre-commit via `scripts/setup-git-hooks.js`):
- 11 custom rules in `eslint-plugin-custom-rules/` validate test structure, naming, and patterns
- Run: `npm run lint` (auto-fixes formatting, errors on violations)

## Project-Specific Patterns

### Test Data Management
**Location:** Test data files mirror test files in `cypress/integration-examples/{api,ui}/`

**Key Rules:**
1. Use `utils` functions for ALL dynamic data (names, dates, numbers) - never hardcode
2. Assign IDs immediately after creation: `testData.validBookings.standard.bookingId = response.body.bookingid`
3. Reuse instances within file lifecycle: create → update → delete (NEVER cross-reference IDs between instances)
4. Name instances by PURPOSE not values: `missingFirstname`, `maximalPrice`, `sameDayCheckout`

**Cleanup Pattern** (mandatory for test independence):
```javascript
const cleanUp = () => {
  cy.module__bulkDelete__DELETE(authToken, testData); // Delete by name patterns, not IDs
};
before(() => { cleanUp(); }); // Run before AND after
after(() => { cleanUp(); });
```

### Custom Commands
**Naming Convention** (enforced by ESLint):
- API: `cy.moduleName__operation__METHOD()` (e.g., `cy.restfullBooker__createBooking__POST()`)
- UI: `cy.componentName__action()` (e.g., `cy.loginPage__logIn()`)

**When to Create:**
- For multi-step interactions reused across files (e.g., login flow, form submission)
- NOT for simple Cypress calls like `.click()` or `.type()` - use directly in tests

**Location:** `cypress/commands/{api,ui}/` grouped by module/page

### Selectors Organization
Store in `cypress/support/selectors/selectors.js` grouped by page/component:
```javascript
const loginPage = {
  username: '[data-test=username]',
  password: '[data-test=password]',
  login: '[data-test="login-button"]',
};
```
Use global variables in tests: `cy.get(loginPage.username).type('user')`

### Bug Logging
When API/UI behavior doesn't match spec, log in `bug-log/bug-log.json`:
```json
{
  "id": "BUG-AUTH-042",
  "severity": "High|Medium|Low",
  "status": "Open",
  "expectedBehavior": "Should return 401",
  "actualBehavior": "Returns 200 with {reason: 'Bad credentials'}"
}
```
Then adapt test to validate ACTUAL behavior with comment referencing bug ID.

## Integration Points

**Test Filtering:** File-based via naming patterns, NOT tags. Example from `parallel-cypress-runner.js`:
- Integration API: `cypress/integration/api/**/*.api.spec.js`
- Integration UI: `cypress/integration/ui/**/*.ui.spec.js`
- E2E UI: `cypress/e2e/**/*.ui.spec.js`

**Coverage Analysis:** Run `npm run coverage:report` to analyze gaps between defined requirements (describe/context/it blocks) and implemented tests (non-empty blocks). Thresholds in `scripts/thresholds.json`.

**Sensitive Data:** Store in `cypress/sensitive-data/dev-users.json` (git-ignored). Load via `cy.common__getUserDataByRole(userRoles.STANDARD)`.

## Key Constraints

**Prohibited:**
- ❌ Loops over test data (`forEach`, `for...of`) - use randomization instead (enforced by `prevent-examples-loops` rule)
- ❌ Duplicate test titles - enforced by `prevent-duplicated-titles` rule
- ❌ Empty `context`/`it` blocks without `.skip()` - enforced by `do-not-allow-empty-blocks` rule
- ❌ Generic test names like "Should return 401" - must include specific details
- ❌ TODO comments without links - enforced by `verify-todos-have-links` rule

**Required:**
- ✅ ALL dynamic values via `utils` (dates, strings, numbers, booleans)
- ✅ Cleanup in both `before` AND `after` hooks
- ✅ Single assertion per `it` block (exception: related checks within parent element)
- ✅ Localization via `l10n`, colors via `colours`, never hardcoded strings/hex values

## Quick Reference

**File Locations:**
- Copilot instructions: `.github/copilot-instructions.md`
- Test-type specific instructions: `.github/instructions/{e2e-ui,integration-ui,integration-api}-tests.instructions.md`
- Naming conventions: `docs/naming-conventions.md`
- ESLint rules docs: `docs/eslint-custom-rules.md`

**Key Scripts:**
- `npm run test` - Run all tests headless
- `npm run test:parallel` - Parallel execution (default 3 streams)
- `npm run lint` - Lint with auto-fix
- `npm run coverage:report` - Generate structure coverage gap analysis
- `npm run req:coverage` - Report requirement ID coverage from `*.reqs.js` files
- `npm run req:coverage:check` - Fail if P1 requirement coverage drops below 90%
- `npx cypress open` - Interactive test runner

**Structure Validation Files:**
- `eslint-plugin-custom-rules/app-structure/modules.json` - Valid API module names
- `eslint-plugin-custom-rules/app-structure/components.json` - Valid UI component names
- `eslint-plugin-custom-rules/app-structure/workflows.json` - Valid E2E workflow names

**Requirement Files** (`cypress/constants/`):
- `constants/api/*.constraints.js` — module boundary values and domain constants
- `constants/ui/user-roles.js` — user role constants (exposed as `global.userRoles`)
- `constants/ui/error-messages.json` — error message strings (exposed as `global.errors`)

