---
name: validate-solution
description: Use to validate a code solution or decision before accepting it — architectural fit and tactical soundness (correctness, efficiency, performance, error stability), for both design-level and local choices.
---

# Principles

ALTITUDE: judge the architectural choice and the tactical execution together — otherwise a correct implementation of the wrong design passes, or a sound design ships with fragile code
CORRECTNESS_FIRST: confirm the solution satisfies the actual requirement and its constraints before judging quality — otherwise an elegant answer to the wrong problem is scored as a near-miss instead of the defect it is
STANCE: assume the hot path, the large input, the failing dependency, and the next maintainer until proven otherwise — otherwise a solution that works on the small happy path passes and fails where it matters
INVERSION: name what would guarantee a hidden weakness or a wrong-fit design, then check whether the solution already does it — otherwise forward reading skips the costs the author never considered
FOCUS: judge fit, correctness, efficiency, and failure stability, never cosmetic style or naming — otherwise cosmetic notes dilute the signal that blocks a bad decision
EVIDENCE: cite a location and a triggering condition for every verdict — otherwise the finding cannot be acted on or trusted

# Method

## Architectural fit

REQUIREMENT_MET: the solution satisfies the requirement in front of it, not an adjacent or assumed one
SIMPLEST_FIT: no layer, abstraction, or indirection a fresh solver of this exact problem would not add — accidental complexity is a failed decision
REUSE_RESPECTED: existing commands, globals, examples, constraints, and dependencies are used rather than reinvented
BOUNDARY_SOUND: responsibilities, coupling, and interfaces sit at the right seams — one reason to change per unit, no logic leaking across layers
ALTERNATIVE_WEIGHED: the chosen approach beats the obvious alternative on a named axis — cost, risk, or clarity — not by default or momentum
REVERSIBILITY: scrutinize in proportion to blast radius — a costly-to-undo architectural commitment earns deeper review than an easily reverted tactical tweak

## Efficiency

ALGORITHMIC_COST: time and space complexity fits input size, no needless quadratic or worse
REDUNDANT_WORK: no value recomputed, re-fetched, or re-parsed when it can be reused
DATA_STRUCTURE_FIT: structure matches access pattern — lookup, ordering, membership, range
WORK_AVOIDANCE: short-circuit, lazy-evaluate, and skip work that cannot affect the result
ALLOCATION_RESTRAINT: no avoidable allocation, copy, or intermediate collection on the hot path

## Performance

IO_BATCHING: calls to network, disk, or database are batched, not issued one per item
NO_N_PLUS_ONE: no query or request fired inside a loop over results
BLOCKING_AWARENESS: blocking or synchronous work kept off latency-critical and async paths
CONCURRENCY_USE: independent work runs in parallel where it shortens wall-clock time
CACHING_BOUNDARY: expensive repeatable results cached with a correct invalidation rule
RESOURCE_BOUND: memory, connections, and handles stay bounded under large or sustained load

## Error stability

FAILURE_HANDLED: every fallible call handles or propagates its error, none silently swallowed
RESOURCE_CLEANUP: files, connections, locks, and handles released on every path including failure
INPUT_VALIDATION: external input checked before use, no trust in shape, range, or nullability
BOUNDARY_SAFETY: empty, null, max, and overflow inputs handled without crash or corruption
IDEMPOTENCY: retried or duplicated operations do not double-apply effects
CONCURRENCY_SAFETY: shared state guarded against races, deadlocks, and partial updates
DEGRADATION: a failing dependency degrades gracefully rather than cascading

## Reverse brainstorm

GUARD_WRONG_PROBLEM: a technically excellent solution to a misread requirement — re-read the requirement before judging quality
GUARD_OVERBUILT: a layer or hook added for a future caller that does not yet exist — validate against today's demand
GUARD_SMALL_INPUT: passing on a tiny input hides quadratic cost — test the large input
GUARD_HAPPY_PATH: working when everything succeeds hides missing failure handling — force the dependency to fail
GUARD_PREMATURE: optimize the measured hot path, not a cold path that adds complexity for no gain
GUARD_HIDDEN_IO: a simple-looking call may hide a network, disk, or lock cost — trace what it touches

## Verdict

FINDING: fit | correctness | efficiency | performance | error stability weakness → cite the location → name the requirement, input size, load, or failure that triggers it → pair with the exact correction and expected gain
PASS_ITEM: each dimension passes or fails explicitly, no silent omission
WIN_CONDITION: accept only a solution that fits the problem, is correct, and stays efficient and failure-stable at scale

# Validation

ALTITUDES_APPLIED: architectural fit and tactical soundness both judged
CORRECTNESS_CONFIRMED: solution verified against the requirement before quality was scored
IMPACT_NAMED: each finding names the triggering requirement, input, load, or failure
EVIDENCE_PRESENT: each verdict cites a location
FIX_ACTIONABLE: each fix states the concrete change and expected gain