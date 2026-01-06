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
   
3. Chunking Phase (based on CHUNK_STRATEGY)
   
   A. Unified Strategy (default):
      └─ Combine all discovered tests (mixed domains)
      └─ Split into N chunks using round-robin distribution
   
   B. Domain-Separated Strategy:
      └─ Split each domain independently into chunks
      └─ Keeps domain tests isolated
   
4. Parallel Execution Phase (Buffered Output)
   ├─ Stream 1 → test chunk
   ├─ Stream 2 → test chunk
   ├─ Stream 3 → test chunk
   └─ (up to PARALLEL_STREAMS concurrent)
   
5. Sequential Output Display
   └─ Show each stream's complete output in order
   
6. Execution Summary
   └─ Duration, pass/fail stats
```

## Usage

### Local Execution

**Default (3 parallel streams, all tests, unified chunking):**

```bash
npm run test:parallel
```

**Custom stream count:**

```bash
PARALLEL_STREAMS=6 npm run test:parallel
```

**Domain-separated chunking:**

```bash
CHUNK_STRATEGY=domain npm run test:parallel
```

**Custom spec pattern:**

```bash
SPEC_PATTERN="cypress/integration/api/**/*.spec.js" npm run test:parallel
```

**Combined options:**

```bash
PARALLEL_STREAMS=4 CHUNK_STRATEGY=domain npm run test:parallel
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

**Domain-separated chunking:**

```bash
docker run -e CHUNK_STRATEGY=domain cypress-tests
```

**With custom spec pattern:**

```bash
docker run -e SPEC_PATTERN="cypress/integration/api/**/*.spec.js" cypress-tests
```

**With specific browser:**

```bash
docker run -e BROWSER=electron -e PARALLEL_STREAMS=4 cypress-tests
```

**Combined options:**

```bash
docker run -e PARALLEL_STREAMS=4 -e CHUNK_STRATEGY=domain -e BROWSER=electron cypress-tests
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
| `CHUNK_STRATEGY`   | Chunking strategy (unified or domain)  | `unified`       | `domain`                           |
| `SPEC_PATTERN`     | Custom glob pattern for test discovery | _(all domains)_ | `cypress/integration/**/*.spec.js` |
| `BROWSER`          | Browser to use for test execution      | `electron`      | `chrome`, `firefox`, `edge`        |
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

### 3. Chunking Strategies

The runner supports two chunking strategies controlled by `CHUNK_STRATEGY`:

#### A. Unified Strategy (default: `CHUNK_STRATEGY=unified`)

- **Combines all discovered tests** from all domains into a single pool
- Splits using **round-robin distribution** for balanced load
- Number of chunks = `min(PARALLEL_STREAMS, total number of test files)`
- Chunks are named: `stream-{N}` (e.g., `stream-1`, `stream-2`)
- Each chunk contains a mix of tests from different domains

**When to use:**
- Fastest overall execution time
- Maximum parallelization
- Simple reporting structure
- Tests are fully independent

**Example output:**
```
Unified Chunking Strategy (no domain separation):
  Total files: 24
  Chunks created: 3
  Files per chunk: 8, 8, 8

Stream 1: [api-test-1.js, ui-test-3.js, e2e-test-2.js, ...]
Stream 2: [api-test-2.js, ui-test-4.js, e2e-test-3.js, ...]
Stream 3: [api-test-3.js, ui-test-5.js, e2e-test-4.js, ...]
```

#### B. Domain-Separated Strategy (`CHUNK_STRATEGY=domain`)

- **Splits each domain independently** into chunks
- Keeps domain tests isolated (no mixing)
- Each domain creates its own set of chunks
- Chunks are named: `{domainKey}-{N}` (e.g., `integrationApi-1`, `e2eUi-2`)
- Total tasks can exceed PARALLEL_STREAMS (limited by concurrency control)

**When to use:**
- Domain isolation is required
- Different domains have different characteristics
- Better organization in reporting
- Debugging specific domain issues

**Example output:**
```
Domain-Separated Chunking Strategy:
  Integration API Tests:
    Total files: 10
    Chunks: 3
    Files per chunk: 4, 3, 3
  Integration UI Tests:
    Total files: 8
    Chunks: 3
    Files per chunk: 3, 3, 2
  E2E UI Tests:
    Total files: 6
    Chunks: 2
    Files per chunk: 3, 3
  Total tasks: 8

Stream names: integrationApi-1, integrationApi-2, integrationApi-3,
              integrationUi-1, integrationUi-2, integrationUi-3,
              e2eUi-1, e2eUi-2
```

**Note:** With domain-separated strategy, total tasks can exceed PARALLEL_STREAMS, but only PARALLEL_STREAMS will run concurrently. Remaining tasks will queue and execute as streams become available.

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

