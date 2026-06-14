---
name: debugging
description: Use when debugging failures, analyzing issues, investigating unexpected behavior, or conducting root cause analysis across test, infrastructure, and application layers.
---

# Principles

PURPOSE: systematically resolve failures using reverse brainstorming
SCOPE: test failures, infrastructure issues, data anomalies, flaky tests
CORE_TECHNIQUE: "What must we do to guarantee this system fails in exactly this way?"
SEGMENTATION: isolate symptoms — what broke, why, what changed
FEEDBACK: validate hypotheses incrementally

# Reverse brainstorming

TECHNIQUE: list 5-8 sabotage strategies producing the observed symptom
REALITY_CHECK: for each strategy, ask "are we already doing this?"
INSIGHT: matching strategies reveal root causes invisible to direct analysis

# Applied principles

SEGMENTATION: isolate failing `it` block, run alone
EXTRACTION: extract failing request into standalone script
LOCAL_QUALITY: check if env-specific, data-dependent, or timing-related
ASYMMETRY: compare passing vs failing runs — find the diff
INVERSION: verify why it ever passed, not just why it fails
PRELIMINARY_ACTION: verify preconditions met before investigating assertions
DYNAMICS: `.should()` for retryable, `.then()` for non-retryable
MEDIATOR: `cy.intercept()` to observe network without modifying
CUSHIONING: `failOnStatusCode: false`, cleanup even for failing tests
CONTINUITY: once root cause found, check all similar patterns

# Investigation flow

1. OBSERVE: exact error, screenshot, response body
2. SABOTAGE_BRAINSTORM: "how would I guarantee this failure?"
3. REALITY_CHECK: which strategies are we doing?
4. SEGMENT: exact failing line and assertion
5. EXTRACT: isolate from test context
6. VERIFY_PRECONDITIONS: confirm setup completed
7. COMPARE: against known-working similar tests
8. CHECK_BUG_LOG: verify if known issue
9. CATEGORIZE: timing | data | environment | app change | test logic | infrastructure
10. FIX_AT_SOURCE: commands | examples | constraints | spec | bug-log | config
11. VERIFY: run in isolation, then full suite
12. PROPAGATE: check same pattern elsewhere

# Flaky test diagnosis

TIMING: passes/fails inconsistently → check retryability, add `.should()`
DATA: depends on external state → ensure cleanup, use unique names
ORDER: depends on test order → verify file independence, check shared state
ENV: fails in CI only → check env config, network latency, resource limits

# Decision: bug vs test defect

BUG: app contradicts requirement → log in `bug-log.json`, add `req.bugs`, assert current behavior
TEST_DEFECT: test assumes wrong behavior → fix test logic
INFRASTRUCTURE: same test passes in different env → document, add guard

# Validation

FLOW_CHECK: structured investigation, not ad-hoc guessing
SABOTAGE_CHECK: reverse brainstorm before deep-diving
CATEGORY_CHECK: issue classified before fixing
ROOT_CAUSE_CHECK: root cause identified, not symptom patched
