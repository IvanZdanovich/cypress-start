# Parallel Test Execution Guide

## Overview

The parallel test runner automatically:

- Discovers test files based on naming patterns
- Groups tests by domain (E2E UI, Integration UI, Integration API)
- Splits each domain's tests into chunks
- Executes chunks in parallel with configurable concurrency
- Reports execution summary and failure statistics

## Test Discovery Patterns

The runner discovers tests based on these patterns:

| Domain                | Pattern                                    |
|-----------------------|--------------------------------------------|
| E2E UI Tests          | `cypress/e2e/**/*.ui.spec.js`              |
| Integration UI Tests  | `cypress/integration/ui/**/*.ui.spec.js`   |
| Integration API Tests | `cypress/integration/api/**/*.api.spec.js` |

These patterns align with the project's [naming conventions](./naming-conventions.md).

## Usage

### Local Execution

Run tests in parallel locally using npm scripts:

```bash
# Default (2 parallel streams)
npm run test:parallel

# Custom stream count
PARALLEL_STREAMS=6 npm run test:parallel
```

### Docker Execution

#### Build and Run with Default Settings

```bash
docker build -t cypress-tests .
docker run cypress-tests
```

This will use 3 parallel streams by default.

#### Build with Custom Parallel Streams

```bash
# Build with 4 parallel streams
docker build --build-arg PARALLEL_STREAMS=4 -t cypress-tests .
docker run cypress-tests
```

#### Override Streams at Runtime

```bash
# Build with default settings
docker build -t cypress-tests .

# Run with different stream count
docker run -e PARALLEL_STREAMS=6 cypress-tests
```

#### Combined with Other Build Args

```bash
docker build \
  --build-arg LANGUAGE=en \
  --build-arg TARGET_ENV=staging \
  --build-arg COLOUR_THEME=dark \
  --build-arg PARALLEL_STREAMS=4 \
  -t cypress-tests .

docker run cypress-tests
```

### Sequential Execution (Fallback)

To run tests sequentially (original behavior):

```bash
# Local
npm run test

# Docker - override CMD
docker run cypress-tests npm run test
```

## How It Works

### 1. Test Discovery

The runner scans the project for test files matching the predefined patterns.

### 2. Chunk Creation

Tests are split into chunks using round-robin distribution:

**Round-Robin Distribution Example:**

- 5 files with 2 streams:
    - Chunk 1: file1, file3, file5
    - Chunk 2: file2, file4

### 3. Parallel Execution

Chunks execute in parallel with concurrency control:
Maximum concurrent processes = `PARALLEL_STREAMS`

### 4. Execution Summary

After all chunks complete, a summary is displayed.

## Configuration

### Environment Variables

| Variable           | Description                          | Default         | Example |
|--------------------|--------------------------------------|-----------------|---------|
| `PARALLEL_STREAMS` | Number of parallel execution streams | `3`             | `4`     |
| `WORKSPACE_ROOT`   | Project root directory               | `process.cwd()` | `/e2e`  |

### Recommended Stream Counts

Choose stream count based on:

- Available CPU cores
- Memory availability
- Test complexity and duration
- Container resource limits

**Guidelines:**

- **2 streams**: Safe for most environments
- **4 streams**: Good for containers with 4+ CPU cores
- **8 streams**: For high-performance CI/CD environments
- **Higher**: Only if you have many test files and resources

**Warning:** Too many streams can:

- Overwhelm system resources
- Cause test flakiness
- Actually slow down execution due to resource contention

## Exit Codes

The runner returns appropriate exit codes:

| Exit Code | Meaning                        |
|-----------|--------------------------------|
| `0`       | All tests passed               |
| `1`       | One or more test chunks failed |

This allows CI/CD pipelines to detect failures correctly.

## Advantages

✅ **Simple**: No external orchestration tools required  
✅ **Fast**: Runs tests in parallel within single container  
✅ **Flexible**: Configurable stream count for different environments  
✅ **Organized**: Respects domain boundaries (E2E, Integration UI/API)  
✅ **Reliable**: Built-in error handling and reporting  
✅ **CI/CD Ready**: Proper exit codes for pipeline integration

## Limitations

⚠️ **Single Container**: All tests run in one container (not distributed across multiple containers)  
⚠️ **Resource Bound**: Limited by single container's CPU/memory

## Troubleshooting

### Tests Failing in Parallel but Not Sequential

**Cause**: Tests may have dependencies on shared state or resources.

**Solution**:

- Review test independence
- Check for hardcoded data that causes conflicts
- Ensure proper test isolation
- Use unique test data per execution

### Container Running Out of Memory

**Cause**: Too many parallel streams for available memory.

**Solution**:

- Reduce `PARALLEL_STREAMS`
- Increase container memory limits
- Optimize test memory usage

### Slower Than Expected

**Cause**: Resource contention from too many streams.

**Solution**:

- Try different stream counts (4, 2, 1)
- Monitor container CPU/memory during execution
- Profile individual test performance

### Cannot Find Test Files

**Cause**: Test files don't match expected naming patterns.

**Solution**:

- Review [naming conventions](./naming-conventions.md)
- Check file locations match patterns
- Verify files end with correct suffix (`.ui.spec.js`, `.api.spec.js`)

