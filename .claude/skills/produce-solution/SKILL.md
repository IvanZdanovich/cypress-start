---
name: produce-solution
description: Use on to produce the leanest correct solution that removes accidental complexity, anti-features, and waste.
---

# Principles

STANCE: keep the smallest correct artifact and treat every element as guilty until it earns existence — otherwise the solution grows past the problem and costs more to read, maintain, and debug for the life of the code
ESSENTIAL_ONLY: carry complexity inherent to the problem and strip complexity introduced by tools, layers, history, or premature optimization — otherwise accidental complexity a fresh solver would never accept persists as pure cost
COUNTERFACTUAL: judge an abstraction by whether a fresh solver of this exact problem would need it, not by the effort already spent drafting it — otherwise sunk cost and familiarity disguise waste as value and the abstraction survives unjustified
NON_NEGOTIABLE: keep validation, error handling, security, and accessibility whatever the artifact shrinks to — otherwise a smaller solution drops a safety boundary and is no longer correct
ENGINEERING_BASELINE: clear names, single responsibility, no premature abstraction, compose over inherit, fail fast, make illegal states unrepresentable

# Method

SCOPE: architecture, structure, modules, abstractions, interfaces, types, functions, config, data structures
SEQUENCE: understand the flow → run the reuse ladder → classify complexity → audit each element → strip waste → emit

## Reuse ladder

UNDERSTAND_FIRST: read the code the change touches and trace the real flow before picking a rung, never instead of it
RUNG_ORDER: EXIST → CODEBASE → STDLIB → NATIVE → DEPENDENCY → ONE_LINE → MINIMUM, descending to new code only when every rung above fails
RUNG_EXIST: does this need to exist — skip it when no requirement, caller, or example demands it
RUNG_CODEBASE: already solved here — reuse the command, global, example, or constraint, never rewrite
RUNG_STDLIB: Cypress or the language provides it — use the built-in over a hand-rolled version
RUNG_NATIVE: a native framework or platform feature covers it — use it before adding code
RUNG_DEPENDENCY: an installed dependency already does it — use it before adding a new one
RUNG_ONE_LINE: a one-line expression suffices — write one line only
RUNG_MINIMUM: only when every rung above fails, write the minimum that works

## Safety boundaries

DETERMINISM_PRESERVED: cleanup, randomised data, and file-independence survive every reduction
HONESTY_PRESERVED: real-behaviour assertions and bug references survive every reduction
BEHAVIOR_PRESERVED: essential behaviour survives even when a cut forces a larger change

## Complexity lens

ESSENTIAL: inherent to the problem, irreducible, a from-scratch solver still faces it
ACCIDENTAL: introduced by tools, layers, history, or premature optimization, fully removable
ESSENTIAL_TREATMENT: express directly, name it, isolate it, add no cleverness that obscures it
ACCIDENTAL_TREATMENT: remove via simpler tool, fewer layers, deleted abstraction, collapsed indirection

## Anti-feature audit

DEMAND_REQUESTER: every element traces to a real caller, requirement, or use case
DELETION_CONSEQUENCE: keep only when removal breaks a real behaviour, not just a test you would also delete
DEFAULT_DETECTION: a parameter or flag everyone leaves at default collapses into the inlined default
DUPLICATION_DETECTION: overlapping functions, types, or branches reduce to one
SELF_INFLICTED_CHECK: an element existing only to manage other-element complexity removes with its cause
SPECULATIVE_GENERALITY: no hook, parameter, or layer added for a future caller that does not yet exist
CARRYING_COST: weigh recurring maintenance, cognitive load, and bug surface against actual benefit

## Waste lens

CONSUMER_VALUE: name who calls the code and what behaviour they would knowingly pay for
DEFECTS: rework, correction loops, fragile logic that needs fixing later
OVERPRODUCTION: speculative features, premature generalization, building sooner than needed
EXTRA_PROCESSING: gold-plating, redundant checks, defensive code for impossible states
MOTION: indirection or layering that forces navigation to follow one path
INVENTORY: dead code, unused parameters, unreachable branches, commented-out blocks left behind
ELIMINATION_STYLE: remove waste outright, shrink or automate the irreducible, prefer elimination over optimization

## Reverse brainstorm

GUARD_FAMILIARITY: hard-to-write is not essential, run the counterfactual before keeping an abstraction
GUARD_BUSY: treat high activity or many helpers as possible waste, not value
GUARD_REINVENT: building what the repo, Cypress, or a dependency already provides is waste, run the reuse ladder first

## Output

EMITTED_ARTIFACT: leanest correct code, each retained element earning its place
COMPLEXITY_NOTE: name any essential complexity kept and any accidental complexity avoided
CUT_NOTE: name elements deliberately not added and why
WIN_CONDITION: smaller artifact that still satisfies the request, not a longer one

# Validation

REUSE_CHECKED: the reuse ladder ran before any new element was written
COUNTERFACTUAL_APPLIED: every abstraction passed the fresh-solver test before emission
ELEMENT_JUSTIFIED: each retained element traces to a requester or breaks on deletion
WASTE_CHECK: no speculative, duplicated, or dead element emitted
SIZE_CHECK: artifact is the smallest correct expression of the request
