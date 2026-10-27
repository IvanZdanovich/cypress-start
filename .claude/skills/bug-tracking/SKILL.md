---
name: bug-tracking
description: Use when logging product bugs, classifying severity, updating bug lifecycle state, or wiring `req.bugs` references into specs.
---

# Intent

Produce bug records and spec links that keep known product defects visible and traceable without failing tests.
When entries conflict or none applies, choose the option that keeps the spec green and the defect recorded.

# Reasoning Principles

KEEP_ONE_BUG_SCHEMA_OWNER — Keep this skill as the one owner of the bug schema, severity, lifecycle, and spec links.
`bug-log/bug-log.json` holds the AI-logged entries. Entries written outside one schema drift into shapes no tool can check. The cost is that every bug, even a small one, follows the full schema.

ASSERT_CURRENT_BEHAVIOUR — Assert the real current behaviour so the spec passes, and keep the expected behaviour in the bug entry.
A failing assertion hides the product bug inside a red run, and the team learns to ignore red. The cost is a green spec that checks broken behaviour until the fix lands.

APPEND_BUG_ENTRIES — Append bug entries and never delete them, changing an existing entry only for status, notes, or clear corrections.
A deleted entry loses the history of what was broken and when. The cost is a log that only grows.

REFERENCE_BUGS_IN_REQ — Reference a bug through `req.bugs` rather than an inline `// TODO` comment.
`verify-req-config` and the reporter read `req.bugs` but cannot see comments, so a comment link is lost. It must be a non-empty array of `BUG-…` ids or tracker URLs, because `verify-req-config` rejects a string or an empty array. The cost is a config object on the block instead of a quick comment.

# Output Shape

LOG_DEV_BUGS_IN_BUG_LOG — Log bugs found during test development in `bug-log/bug-log.json` and cite the `BUG-…` id in `req.bugs`.
These bugs have no tracker issue yet, so the log is their only record. The cost is a weekly review to move them to the tracker.

FILE_MANUAL_BUGS_IN_TRACKER — File bugs from manual testing, UI review, code review, or product reports in the issue tracker, and cite the tracker URL in `req.bugs`.
A second copy in the AI log drifts from the tracker issue. The cost is a long URL in the spec instead of a short id.

LOG_PRODUCT_DEFECTS — Log a bug for a wrong status code, a wrong or missing error message, an unexpected response format, or a documentation mismatch.
Security or validation gaps, UI rendering defects, and broken user flows also count. Unlogged, the defect is lost once the spec is adjusted to pass. The cost is an entry even for small issues.

GIVE_ENTRY_ALL_FIELDS — Give each entry every field in the order shown below.
A fixed order keeps diffs readable and makes a missing field visible. The cost is reordering fields when an entry is edited by hand.

```
id, module, submodule, severity, status, description, expectedBehavior,
actualBehavior, endpoint, reproducible, dateReported, affectedFields, notes
```

WRITE_SUMMARY_AND_BEHAVIOURS — Write `description` as a one-line summary, and state in `expectedBehavior` and `actualBehavior` what should happen and what does happen.
A reviewer decides from these three fields whether the entry is a real bug. Vague text sends the reviewer back to rerun the spec.

FORMAT_ENTRY_VALUES — Format `dateReported` as `YYYY-MM-DD`, `reproducible` as a boolean, and `affectedFields` as an array of field names.
Other formats fail schema checks and break sorting by date.

SET_ENDPOINT_BY_BUG_KIND — Set `endpoint` to `METHOD /path` for API bugs and to `null` for UI, end-to-end, or localization bugs.
A guessed endpoint on a UI bug points the developer at the wrong service.

RECORD_TRACKER_URL_IN_NOTES — Record the tracker URL in `notes` once a tracker issue exists for an AI-logged bug.
Without it the two channels lose their link, and the bug is reviewed twice or never.

SHAPE_ID_AS_BUG_CONTEXT — Shape every id as `BUG-[CONTEXT]-[NUMBER]`, with an uppercase alphanumeric context and a three-digit number padded with zeros.
`verify-req-config` rejects slashes and extra hyphens, so a wrong id breaks the spec link. Use the module for API bugs (`BUG-BOOKING-002`), the page or component for UI bugs (`BUG-LOGIN-001`), and the workflow for end-to-end bugs (`BUG-CHECKOUT-003`).

CLASSIFY_SEVERITY_BY_IMPACT — Classify `severity` by user impact with the four levels below.
Without fixed levels, severity follows the author's feeling and triage order becomes random. The cost is arguing an edge case against the list.

```
critical  app crash, data loss, security issue, or complete feature failure
high      major feature broken, large user impact, no workaround
medium    feature works with issues, workaround available
low       cosmetic issue, minor inconvenience, or edge case
```

MOVE_STATUS_FORWARD — Move `status` only forward: `open` (logged, pending review) → `resolved` (fixed in code) → `closed` (verified and test updated).
A backward move hides whether a fix was ever verified.

PLACE_BUGS_ON_NEAREST_BLOCK — Place `req.bugs` on the affected `it`, or on the nearest shared `describe` or `context` when the bug affects every block in it.
Repeated on each `it`, the link scatters, and placed too high, it links passing blocks to the bug. The cost is choosing a scope for each bug.

DISABLE_FAIL_ON_STATUS_CODE — Disable `failOnStatusCode` on a request that expects an error response, so the spec can assert the status.
Without it Cypress fails the command before the assertion runs, and the bug looks like a test crash.

SKIP_BLOCKED_EXPECTATION — Skip an expectation that cannot pass yet with `it.skip(...)` and a `req.bugs` link, rather than a failing or deleted block.
A deleted block removes the requirement from the suite, and a failing one turns the run red on known noise. The cost is a skipped test in every report until the fix lands.

REVIEW_BUG_LOG_WEEKLY — Review `bug-log/bug-log.json` weekly, confirm each entry is a product bug, then file a tracker issue and record its URL.
Unreviewed entries include test-code defects that waste developer time. The cost is a fixed weekly task.

UPDATE_SPEC_ON_FIX — Update `status`, remove the `req.bugs` link, and assert the correct behaviour when a bug is fixed.
A stale link outlives the defect, and the test keeps checking broken behaviour.

# Validation

GIVE_ENTRY_ALL_FIELDS_CHECK — Confirm every entry holds all required fields, with `dateReported` as `YYYY-MM-DD`, `reproducible` boolean, and `endpoint` as `METHOD /path` or `null`.
SHAPE_ID_AS_BUG_CONTEXT_CHECK — Verify every id matches `BUG-[CONTEXT]-[NUMBER]` and its context matches the test type.
CLASSIFY_SEVERITY_BY_IMPACT_CHECK — Confirm every `severity` is `critical`, `high`, `medium`, or `low` and matches the level criteria.
MOVE_STATUS_FORWARD_CHECK — Confirm every `status` is `open`, `resolved`, or `closed` and has only moved forward.
REFERENCE_BUGS_IN_REQ_CHECK — Verify every spec-facing bug is linked through `req.bugs` on the nearest affected block, and every link resolves to an entry or tracker URL.
UNLINKED_BUG_CHECK — Confirm every entry with no spec link explains the reason in `notes`.
ASSERT_CURRENT_BEHAVIOUR_CHECK — Confirm each linked spec asserts actual behaviour, uses `failOnStatusCode: false` for error responses, and holds no inline bug TODO.
APPEND_BUG_ENTRIES_CHECK — Confirm no entry was deleted and every correction changed only status, notes, or a clear field error.
PRODUCT_BUG_CHECK — Confirm every entry describes a product bug, not a defect in test code.
