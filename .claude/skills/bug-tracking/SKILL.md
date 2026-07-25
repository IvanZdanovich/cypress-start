---
name: bug-tracking
description: Use when logging a bug, classifying severity, referencing a bug in a spec, or reconciling a deviation between expected and actual behaviour — governs the bug entry schema, ID format, status lifecycle, AI-automated vs manual channels, and `req.bugs` spec integration.
---

# Principles

SINGLE_AUTHORITY: this skill governs the bug schema, severity, lifecycle, and spec integration, and `bug-log/bug-log.json` holds the AI-logged entries — otherwise entries drift into ad-hoc shapes no tool can validate
HONESTY: a spec asserts the real current behaviour and passes; the expected behaviour lives in the bug entry, never in a failing assertion — otherwise a red test masks the deviation instead of documenting it
PRESERVATION: entries are only appended or status-updated, never deleted or rewritten — otherwise the audit trail of what was broken and when is lost
METADATA_NOT_COMMENTS: a bug reference lives in `req.bugs`, never in an inline `// TODO` — otherwise the link is invisible to `verify-req-config` and reporting

# Method

## Channels

AI_AUTOMATED: bugs discovered during test development → log to `bug-log/bug-log.json`, reference the `BUG-…` id in spec `req.bugs`
MANUAL: bugs discovered during manual, exploratory, UI-review, code-review, or stakeholder reporting → file in the issue tracker, reference the tracker URL in spec `req.bugs`

## AI-automated triggers

TRIGGER_STATUS: an incorrect HTTP status code → log
TRIGGER_ERROR_MESSAGE: a missing or improper error message → log
TRIGGER_FORMAT: an unexpected response format → log
TRIGGER_DOC_MISMATCH: behaviour inconsistent with documentation → log
TRIGGER_SECURITY: a security or validation gap → log
TRIGGER_RENDER: a UI rendering defect → log
TRIGGER_FLOW: a broken user flow → log

## Bug entry

FIELDS: `id`, `module`, `submodule`, `severity`, `status`, `description`, `expectedBehavior`, `actualBehavior`, `endpoint`, `reproducible`, `dateReported`, `affectedFields`, `notes`
DESCRIPTION: `description` is a clear one-line summary; `expectedBehavior` and `actualBehavior` state what should versus does happen
DATE: `dateReported` is `YYYY-MM-DD`; `reproducible` is a boolean; `affectedFields` is an array of field names
ENDPOINT: `endpoint` is `METHOD /path` for API bugs
TRACKER_LINK: once a manual issue is created for an AI-logged bug, its `notes` carries the tracker URL — otherwise the two channels lose their cross-reference

```json
{
  "id": "BUG-BOOKING-002",
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
  "affectedFields": ["field1"],
  "notes": "Additional context"
}
```

## Bug ID format

SHAPE: `BUG-[CONTEXT]-[NUMBER]`, uppercase context, zero-padded sequence
CONTEXT_API: `BUG-[MODULE]-[NUMBER]` — e.g. `BUG-BOOKING-002`
CONTEXT_UI: `BUG-[PAGE/COMPONENT]-[NUMBER]` — e.g. `BUG-LOGIN-001`
CONTEXT_E2E: `BUG-[WORKFLOW]-[NUMBER]` — e.g. `BUG-CHECKOUT-003`

## Severity classification

CRITICAL: app crash, data loss, security issue, or complete feature failure
HIGH: major feature broken, significant UX impact, no workaround
MEDIUM: feature works with issues, workaround available
LOW: cosmetic issue, minor inconvenience, or edge case

## Status lifecycle

FLOW: `Open` (logged, pending review) → `Resolved` (fixed in codebase) → `Closed` (verified and test updated)

## Spec integration

REQ_BUGS: reference the bug on the affected `it` via `req.bugs`, an array of `BUG-…` ids (AI channel) or tracker URLs (manual channel)
SUITE_SCOPE: when the bug affects every `it` in a suite (e.g. a shared workaround in `before`), declare `req.bugs` on the `describe` config object instead — otherwise the reference is scattered across blocks
ASSERT_ACTUAL: the assertion checks the current broken behaviour so the test passes; `expectedBehavior` stays in the bug entry — otherwise the deviation is hidden behind a failing test
FAIL_ON_STATUS_CODE: request an error response with `failOnStatusCode: false` so the status can be asserted — otherwise Cypress fails the command before the assertion runs
PLACEHOLDER: an unimplementable expectation is `it.skip(...)` with `req.bugs`, never a failing or deleted block — otherwise the requirement disappears from the suite

```js
it('Module.Op.METHOD: Then return 500 status code',  {req: { p: 'P1', bugs: ['BUG-BOOKING-002'] } }, () => {
    cy.module__create__POST(payload, { failOnStatusCode: false }).then((res) => {
      expect(res.status).to.eq(500);
    });
  },
);
```

## Review process

FLOW: review `bug-log/bug-log.json` weekly → validate each entry is a real bug, not a test-code defect → create a tracker issue → record the tracker URL in the entry `notes`

## Fix lifecycle

ON_FIX: when a bug is fixed, update `status`, remove the `req.bugs` reference, and re-assert the correct behaviour — otherwise a stale reference outlives the defect and the test keeps encoding broken behaviour

# Validation

FIELDS_CHECK: every entry carries all required fields with `dateReported` as `YYYY-MM-DD` and `reproducible` boolean
ID_CHECK: every id matches `BUG-[CONTEXT]-[NUMBER]` with the context matching test type
SEVERITY_CHECK: `severity` is one of Critical, High, Medium, Low per the classification criteria
STATUS_CHECK: `status` is one of Open, Resolved, Closed and only advances along the lifecycle
REF_CHECK: every logged bug is referenced from at least one spec via `req.bugs`; every `req.bugs` id resolves to an entry or tracker URL
ASSERT_CHECK: each referenced spec asserts actual behaviour, uses `failOnStatusCode: false` for error responses, and carries no inline bug TODO
PRESERVE_CHECK: no entry deleted or rewritten; corrections land as status or notes updates
FALSE_POSITIVE_CHECK: each entry is a product bug, not a test-code defect
