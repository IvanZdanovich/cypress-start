---
name: bug-tracking
description: Use when logging product bugs, classifying severity, updating bug lifecycle state, or wiring `req.bugs` references into specs.
---

# Reasoning Principles

SINGLE_AUTHORITY: this skill governs the bug schema, severity, lifecycle, and spec integration, and `bug-log/bug-log.json` holds the AI-logged entries — otherwise entries drift into ad-hoc shapes no tool can validate
HONESTY: a spec asserts the real current behaviour and passes; the expected behaviour lives in the bug entry, never in a failing assertion — otherwise a red test hides the product bug instead of documenting it
PRESERVATION: entries are appended and never deleted; existing entries change only for status, notes, or clear corrections — otherwise the history of what was broken and when is lost
METADATA_NOT_COMMENTS: a bug reference lives in `req.bugs`, never in an inline `// TODO` — otherwise the link is invisible to `verify-req-config` and reporting

# Output Shape

## Channels & Triggers

CHANNEL_AI: bugs discovered during test development → log to `bug-log/bug-log.json`, reference the `BUG-…` id in spec `req.bugs`
CHANNEL_MANUAL: bugs found during manual testing, UI review, code review, or product reporting → file in the issue tracker, reference the tracker URL in spec `req.bugs`
TRIGGER_STATUS: an incorrect HTTP status code → log
TRIGGER_ERROR_MESSAGE: a missing or wrong error message → log
TRIGGER_FORMAT: an unexpected response format → log
TRIGGER_DOC_MISMATCH: behaviour inconsistent with documentation → log
TRIGGER_SECURITY: a security or validation gap → log
TRIGGER_RENDER: a UI rendering defect → log
TRIGGER_FLOW: a broken user flow → log

## Entry Schema

FIELDS: `id`, `module`, `submodule`, `severity`, `status`, `description`, `expectedBehavior`, `actualBehavior`, `endpoint`, `reproducible`, `dateReported`, `affectedFields`, `notes`
DESCRIPTION: `description` is a clear one-line summary; `expectedBehavior` and `actualBehavior` state what should versus does happen
DATE: `dateReported` is `YYYY-MM-DD`; `reproducible` is a boolean; `affectedFields` is an array of field names
ENDPOINT: `endpoint` is `METHOD /path` for API bugs and `null` for UI, e2e, or localization bugs with no endpoint
TRACKER_LINK: once a manual issue is created for an AI-logged bug, its `notes` carries the tracker URL — otherwise the two channels lose their cross-reference
ENTRY_SHAPE: one bug-log object carries all FIELDS in the declared order when practical so diffs stay readable and schema drift is visible

## IDs, Severity & Status

ID_SHAPE: `BUG-[CONTEXT]-[NUMBER]`, uppercase alphanumeric context, zero-padded three-digit sequence; no slashes or extra hyphens so `verify-req-config` can validate it
ID_API: `BUG-[MODULE]-[NUMBER]` — e.g. `BUG-BOOKING-002`
ID_UI: `BUG-[PAGEORCOMPONENT]-[NUMBER]` — e.g. `BUG-LOGIN-001`
ID_E2E: `BUG-[WORKFLOW]-[NUMBER]` — e.g. `BUG-CHECKOUT-003`
SEVERITY_CRITICAL: `critical` — app crash, data loss, security issue, or complete feature failure
SEVERITY_HIGH: `high` — major feature broken, significant UX impact, no workaround
SEVERITY_MEDIUM: `medium` — feature works with issues, workaround available
SEVERITY_LOW: `low` — cosmetic issue, minor inconvenience, or edge case
STATUS_FLOW: `open` (logged, pending review) → `resolved` (fixed in codebase) → `closed` (verified and test updated)

## Spec Integration

REQ_BUGS: reference the bug on the affected `it` via `req.bugs`, an array of `BUG-…` ids (AI channel) or tracker URLs (manual channel)
SUITE_SCOPE: when the bug affects every `it` in a suite (e.g. a shared workaround in `before`), declare `req.bugs` on the nearest shared `describe`/`context` config object instead — otherwise the reference is scattered across blocks
ASSERT_ACTUAL: the assertion checks the current broken behaviour so the test passes; `expectedBehavior` stays in the bug entry — otherwise the product bug is hidden behind a failing test
FAIL_ON_STATUS_CODE: request an error response with `failOnStatusCode: false` so the status can be asserted — otherwise Cypress fails the command before the assertion runs
PLACEHOLDER: an unimplementable expectation is `it.skip(...)` with `req.bugs`, never a failing or deleted block — otherwise the requirement disappears from the suite
SPEC_REFERENCE_SHAPE: affected blocks carry `{ req: { bugs: ['BUG-CONTEXT-001'] } }` or tracker URLs at the nearest scope so reporting links the passing assertion to the tracked bug

## Lifecycle

REVIEW_FLOW: review `bug-log/bug-log.json` weekly → validate each entry is a real bug, not a test-code defect → create a tracker issue → record the tracker URL in the entry `notes`
ON_FIX: when a bug is fixed, update `status`, remove the `req.bugs` reference, and re-assert the correct behaviour — otherwise a stale reference outlives the defect and the test keeps encoding broken behaviour

# Validation

FIELDS_CHECK: every entry carries all required fields with `dateReported` as `YYYY-MM-DD`, `reproducible` boolean, and `endpoint` as `METHOD /path` or `null`
ID_CHECK: every id matches `BUG-[CONTEXT]-[NUMBER]` with the context matching test type
SEVERITY_CHECK: `severity` is one of `critical`, `high`, `medium`, `low` per the classification criteria
STATUS_CHECK: `status` is one of `open`, `resolved`, `closed` and only advances along the lifecycle
REF_CHECK: every spec-facing bug is referenced from the nearest affected block via `req.bugs`; source-only bugs explain missing spec links in `notes`; every id resolves to a bug entry or tracker URL
ASSERT_CHECK: each referenced spec asserts actual behaviour, uses `failOnStatusCode: false` for error responses, and carries no inline bug TODO
PRESERVE_CHECK: no entry is deleted; corrections land as status, notes, or clear field updates
FALSE_POSITIVE_CHECK: each entry is a product bug, not a test-code defect
