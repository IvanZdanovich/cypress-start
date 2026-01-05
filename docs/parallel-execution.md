# Parallel Test Execution Guide

## Overview

The parallel test runner executes Cypress tests in parallel streams within a single container for faster test execution.

**Key Features:**

- Pre-setup tests run first sequentially (global setup)
- Main tests execute in parallel with buffered output
- Output displayed sequentially after completion (no interleaving)
- Stream-specific folders prevent artifact overwrites
- Configurable parallel streams (default: 3)

## Execution Flow

```
1. Pre-Setup Phase (Sequential)
   └─ Run: cypress/support/00-global-before.hook.spec.js
   
2. Discovery Phase
   └─ Find all test files matching pattern(s)
   └─ Filter out pre-setup files (already executed)
   
3. Unified Chunking Phase
   └─ Combine all discovered tests (mixed domains)
   └─ Split into N chunks using round-robin distribution
   
4. Parallel Execution Phase (Buffered Output)
   ├─ Stream 1 → mixed domain tests
   ├─ Stream 2 → mixed domain tests
   ├─ Stream 3 → mixed domain tests
   └─ (up to PARALLEL_STREAMS concurrent)
   
5. Sequential Output Display
   └─ Show each stream's complete output in order
   
6. Execution Summary
   └─ Duration, pass/fail stats, artifact locations
```

## Usage

### Local Execution

**Default (3 parallel streams, all tests):**

```bash
npm run test:parallel
```

**Custom stream count:**

```bash
PARALLEL_STREAMS=6 npm run test:parallel
```

**Custom spec pattern:**

```bash
SPEC_PATTERN="cypress/integration/api/**/*.spec.js" npm run test:parallel
```

### Docker Execution

**Build and run with defaults:**

```bash
docker build -t cypress-tests .
docker run cypress-tests
```

**Override parallel streams:**

```bash
docker run -e PARALLEL_STREAMS=6 cypress-tests
```

**With custom spec pattern:**

```bash
docker run -e SPEC_PATTERN="cypress/integration/api/**/*.spec.js" cypress-tests
```

**With specific browser:**

```bash
docker run -e BROWSER=electron -e PARALLEL_STREAMS=4 cypress-tests
```

### Sequential Execution (Fallback)

```bash
npm run test
docker run cypress-tests npm run test
```

## Test Discovery

### Default Patterns (when SPEC_PATTERN not set)

| Domain                | Pattern                                    |
|-----------------------|--------------------------------------------|
| Integration API Tests | `cypress/integration/api/**/*.api.spec.js` |
| Integration UI Tests  | `cypress/integration/ui/**/*.ui.spec.js`   |
| E2E UI Tests          | `cypress/e2e/**/*.ui.spec.js`              |

### Custom Pattern (when SPEC_PATTERN is set)

Discovers all files matching the provided glob pattern. Files are classified by domain for reporting, then combined into unified chunks.

**Note:** Pre-setup tests (`00-global-before.hook.spec.js`) are automatically detected and run first, regardless of SPEC_PATTERN.

## Configuration

### Environment Variables

| Variable           | Description                            | Default         | Example                            |
|--------------------|----------------------------------------|-----------------|------------------------------------|
| `PARALLEL_STREAMS` | Number of parallel execution streams   | `3`             | `6`                                |
| `SPEC_PATTERN`     | Custom glob pattern for test discovery | _(all domains)_ | `cypress/integration/**/*.spec.js` |
| `BROWSER`          | Browser to use for test execution      | `chrome`        | `electron`, `firefox`, `edge`      |
| `WORKSPACE_ROOT`   | Project root directory                 | `process.cwd()` | `/tests`                           |
| `CI`               | CI environment flag (enables Xvfb)     | `false`         | `true`                             |

### Recommended Stream Counts

| Streams | Use Case                         | CPU Cores | Memory  |
|---------|----------------------------------|-----------|---------|
| 2-3     | Local development, basic CI      | 2-4       | 4-8 GB  |
| 4-6     | Standard CI/CD pipelines         | 4-8       | 8-16 GB |
| 8+      | High-performance CI environments | 8+        | 16+ GB  |

**Warning:** Too many streams can cause:

- Resource contention and slower execution
- Test flakiness due to resource starvation
- Memory issues

## Artifacts Organization

Tests running in parallel save artifacts to stream-specific folders to prevent overwrites:

```
cypress/reports/
├── screenshots/
│   ├── stream-1/                      ← Stream 1 screenshots
│   ├── stream-2/                      ← Stream 2 screenshots
│   └── stream-3/                      ← Stream 3 screenshots
└── separate-reports/
    ├── stream-1/                      ← Stream 1 reports
    ├── stream-2/                      ← Stream 2 reports
    └── stream-3/                      ← Stream 3 reports
```

**Pre-setup tests** use the folder name `pre-setup`:

- `cypress/reports/screenshots/pre-setup/`
- `cypress/reports/separate-reports/pre-setup/`

## Output Structure

### During Execution

```
[stream-1] Starting execution with 15 file(s) on display :99
[stream-2] Starting execution with 12 file(s) on display :100
[stream-3] Starting execution with 8 file(s) on display :101
[stream-1] ✔ Completed in 45.2s
[stream-3] ✔ Completed in 38.7s
[stream-2] ✔ Completed in 52.1s
```

### After Completion

```
────────────────────────────────────────────────────────────
Stream: stream-1 | Duration: 45.2s | Status: PASSED
Files: 15
  - cypress/integration/api/auth/login.api.spec.js
  - cypress/integration/ui/forms/form-validation.ui.spec.js
  - cypress/e2e/checkout/payment.ui.spec.js
  - ...
Screenshots: cypress/reports/screenshots/stream-1/
Reports: cypress/reports/separate-reports/stream-1/
────────────────────────────────────────────────────────────
[Complete buffered output from Stream 1]

────────────────────────────────────────────────────────────
Stream: stream-2 | Duration: 52.1s | Status: PASSED
...
```

### Execution Summary

```
================================================================================
Execution Summary
================================================================================
Total Duration: 52.5s
Total Tasks: 3
Failed Tasks: 1
Success Rate: 66.7%

Artifacts:
  Screenshots: /path/to/project/cypress/reports/screenshots/ (organized by stream)
  Reports: /path/to/project/cypress/reports/separate-reports/ (organized by stream)
================================================================================
```

## How It Works

### 1. Pre-Setup Tests (Sequential)

- Pattern: `cypress/support/00-global-before.hook.spec.js`
- Runs first, before parallel execution
- If fails, aborts entire execution
- Uses folder name `pre-setup` for artifacts
- Real-time output display

### 2. Test Discovery

- Scans for tests matching SPEC_PATTERN or default domain patterns
- Filters out pre-setup tests (already executed)
- Classifies files by domain (for reporting purposes)

### 3. Unified Chunking

- **Combines all discovered tests** from all domains into a single pool
- Splits using **round-robin distribution** for balanced load
- Number of chunks ≤ PARALLEL_STREAMS (fewer if not enough test files)
- Chunks are named: `stream-{N}` (e.g., `stream-1`, `stream-2`)
- Each chunk contains a mix of tests from different domains

### 4. Parallel Execution

- Executes up to PARALLEL_STREAMS chunks concurrently
- Buffers output from each stream (prevents interleaving)
- Each stream uses unique Xvfb display number (:99, :100, :101, etc.)
- Stream-specific artifact folders prevent overwrites

### 5. Sequential Output Display

- After all streams complete, displays buffered output
- Each stream's output shown completely and separately
- Clear separators between streams

## Exit Codes

| Exit Code | Meaning                           |
|-----------|-----------------------------------|
| `0`       | All tests passed                  |
| `1`       | Pre-setup tests failed            |
| `1`       | One or more parallel tasks failed |

## Troubleshooting

### Pre-Setup Tests Not Found

**Symptom:**

```
Can't run because no spec files were found.
We searched for specs matching this glob pattern:
  > cypress/support/00-global-before.hook.spec.js
```

**Cause:** Custom SPEC_PATTERN is being applied to pre-setup tests.

**Solution:** The runner automatically handles this by unsetting SPEC_PATTERN for pre-setup tests. Ensure you're using
the latest version of `parallel-cypress-runner.js`.

### Screenshots/Reports Being Overwritten

**Cause:** Using an older version without stream-specific artifact folders.

**Solution:** Update to latest `parallel-cypress-runner.js` which creates unique folders per stream.

### Tests Failing in Parallel but Not Sequential

**Cause:** Test dependencies on shared state or timing issues.

**Solution:**

- Ensure test independence
- Use unique test data (random names/IDs)
- Check for race conditions with shared resources
- Review data cleanup strategies

### Slower Than Sequential

**Cause:** Resource contention or overhead from too many streams.

**Solution:**

- Reduce PARALLEL_STREAMS (try 2, then 3, then 4)
- Check system resource usage during execution
- Ensure sufficient CPU/memory available

### Output Not Displaying

**Cause:** Stream buffering issue.

**Solution:** Check that `stdio: 'pipe'` is properly configured for buffered streams in the runner script.

## Best Practices

✅ **Run pre-setup tests first** - Ensures proper environment setup  
✅ **Use appropriate stream count** - Match available resources  
✅ **Keep tests independent** - No shared state or dependencies  
✅ **Use unique test data** - Random names/IDs prevent conflicts  
✅ **Monitor resource usage** - Optimize stream count based on metrics  
✅ **Check stream-specific artifacts** - Each stream has its own folders

