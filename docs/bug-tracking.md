# Bug Tracking

## Overview

This project uses a **dual-approach bug tracking system**:

1. **AI-Automated Logging** => Bugs discovered during test development are logged to
   `${WORKSPACE_ROOT}/bug-log/bug-log.json`
2. **Manual Reporting** => Bugs found during manual testing are reported directly to the issue tracking system

---

## AI-Automated Bug Logging

### How It Works

The AI assistant automatically identifies and documents bugs in `${WORKSPACE_ROOT}/bug-log/bug-log.json` during test
development, creating a staging area for review before migration to the issue tracker.

### What Triggers AI Logging

**Core Principle**: Log bugs when the application exhibits mistakes, inconsistencies, or harmful practices - **even if
tests pass**. The analysis focuses on identifying whether the observed behavior poses a risk or harm to the application
under test, not merely on test outcomes.

**Trigger Categories**:

**Harmful Practices** (Application Design/Implementation):

- Security vulnerabilities (weak validation, exposed sensitive data, insecure defaults)
- Data integrity risks (missing constraints, inconsistent state management)
- Poor error handling (silent failures, misleading error messages)
- Resource management issues (memory leaks, unclosed connections, excessive resource consumption)
- Accessibility violations (missing ARIA labels, keyboard navigation issues)
- Performance anti-patterns (N+1 queries, inefficient algorithms, blocking operations)

**Inconsistencies** (Behavior vs Expectations):

- Deviation from API specification/documentation
- Inconsistent behavior across similar operations
- Breaking REST/HTTP conventions without justification
- Contradictory responses for equivalent requests
- Mismatched data formats between related endpoints

**Implementation Mistakes** (Incorrect Functionality):

- Incorrect HTTP status codes (200 for failures, 500 for validation errors)
- Missing/improper validation on required fields
- Unexpected response formats or data types
- Broken functionality (404s, runtime errors, null reference exceptions)
- State corruption (data loss, incomplete updates, orphaned records)
- UI rendering defects (broken layouts, missing elements, incorrect displays)

**Note**: Tests may pass while validating current (incorrect) behavior. Bug logging captures the discrepancy between
**what the application does** vs **what it should do**.

### Bug Entry Structure

```json
{
  "id": "BUG-[MODULE]-XXX",
  "module": "ModuleName",
  "submodule": "SubmoduleName",
  "severity": "High|Medium|Low",
  "status": "Open|Resolved|Closed",
  "description": "Clear description",
  "expectedBehavior": "What should happen",
  "actualBehavior": "What actually happens",
  "endpoint": "METHOD /path",
  "reproducible": true,
  "dateReported": "YYYY-MM-DD",
  "affectedFields": [
    "field1"
  ],
  "notes": "Additional context"
}
```

### Test Adaptation

When AI logs a bug, it automatically:

- Adds bug reference to req object: `{req: { bugs :['BUG-[MODULE]-XXX']}}`
- Updates assertions to validate **actual** behavior
- Ensures tests pass with current behavior
- Documents expected behavior in comments

### Review & Migration Process

1. **Review** `${WORKSPACE_ROOT}/bug-log/bug-log.json` regularly (weekly or after major test development)
2. **Validate** logged issues are legitimate bugs (not test code issues)
3. **Create** issues in tracking system using this template:
4. **Update** `${WORKSPACE_ROOT}/bug-log/bug-log.json` with issue tracker URL in `notes` field

### Bug Status Lifecycle

| Status       | Description                  |
|--------------|------------------------------|
| **Open**     | Logged by AI, pending review |
| **Resolved** | Fixed in codebase            |
| **Closed**   | Verified and test updated    |

---

### Severity Classification

| Severity     | Criteria                                                          |
|--------------|-------------------------------------------------------------------|
| **Critical** | App crashes, data loss, security issues, complete feature failure |
| **High**     | Major feature broken, significant UX impact, no workaround        |
| **Medium**   | Feature works with issues, workaround available                   |
| **Low**      | Cosmetic issues, minor inconveniences, edge cases                 |

---

## Best Practices

**Review Regularly** - Check `bug-log.json` weekly  
**Validate First** - Confirm bugs aren't test code issues  
**Maintain References** - Keep bug comments in test files  
**Update Tests** - Remove workarounds when bugs are fixed  
**Preserve History** - Never delete original bug entries

---

**Note**: `${WORKSPACE_ROOT}/bug-log/bug-log.json` is a **staging area**, not a replacement for your issue tracking
system. All bugs should ultimately be tracked in the central system.
