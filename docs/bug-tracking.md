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

- Incorrect HTTP status codes
- Missing/improper error messages
- Unexpected response formats
- Inconsistent behavior vs documentation
- Security/validation issues
- UI rendering problems
- Broken user flows

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

- Adds bug reference comment: `// Bug Reference: BUG-MODULE-001 - Description`
- Updates assertions to validate **actual** behavior
- Ensures tests pass with current behavior
- Documents expected behavior in comments

### Review & Migration Process

1. **Review** `${WORKSPACE_ROOT}/bug-log/bug-log.json` regularly (weekly or after major test development)
2. **Validate** logged issues are legitimate bugs (not test code issues)
3. **Create** issues in tracking system using this template:

```markdown
**Bug ID**: BUG-RESTFUL-001  
**Module**: RestfulBooker | **Severity**: Medium

**Description**  
Authentication endpoint returns 200 for invalid credentials instead of 401

**Expected**: Return 401 Unauthorized  
**Actual**: Returns 200 OK with reason: 'Bad credentials'

**Endpoint**: POST /auth  
**Test Reference**: `cypress/integration/api/restful-booker.auth.api.spec.js`  
**Reproducible**: Yes | **Date**: 2025-11-06
```

4. **Update** `${WORKSPACE_ROOT}/bug-log/bug-log.json` with issue tracker URL in `notes` field

### Bug Status Lifecycle

| Status       | Description                  |
|--------------|------------------------------|
| **Open**     | Logged by AI, pending review |
| **Resolved** | Fixed in codebase            |
| **Closed**   | Verified and test updated    |

---

## Manual Bug Reporting

### When to Report Manually

- Bugs found during manual/exploratory testing
- Issues discovered while reviewing the UI
- Problems identified during code review
- Stakeholder or end-user reports

### Reporting Process

1. **Create issue** in tracking system with:
    - Clear title and description
    - Steps to reproduce
    - Expected vs actual behavior
    - Screenshots/videos (if applicable)
    - Environment details
    - Severity classification

2. **Link to tests** (if applicable):
    ```javascript
      it.skip('CartPage.STANDARD: Then Checkout button is displayed and enabled', () => {
        // TODO: https://github.com/org/repo/issues/123
        cy.get(cartPage.checkout)
          .should('have.text', l10n.cartPage.checkout)
          .and('be.visible')
          .and('be.enabled');
      });
   ```

3. **Monitor and update** issue status when resolved

### Severity Classification

| Severity     | Criteria                                                          |
|--------------|-------------------------------------------------------------------|
| **Critical** | App crashes, data loss, security issues, complete feature failure |
| **High**     | Major feature broken, significant UX impact, no workaround        |
| **Medium**   | Feature works with issues, workaround available                   |
| **Low**      | Cosmetic issues, minor inconveniences, edge cases                 |

---

## Comparison

| Aspect               | AI-Automated            | Manual                |
|----------------------|-------------------------|-----------------------|
| **Discovery**        | During test development | During manual testing |
| **Initial Location** | `bug-log.json`          | Issue tracker         |
| **Documentation**    | Automatic, structured   | Manual, flexible      |
| **Test Adaptation**  | Automatic               | Manual `.skip()`      |
| **Best For**         | API/backend issues      | UI/UX problems        |

---

## Combined Workflow

```

AI discovers bugs => bug-log.json => Team reviews => Issue tracker
↑
Manual testing discovers bugs ──────────────────────────┘

```

**All bugs** eventually tracked in the central issue tracking system.

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
