---
name: anti-feature-audit
description: Use to identify harmful, risky, redundant, or dangerous elements in a system
---

# Principles

PURPOSE: surface elements that add cost without earning existence and produce a deletion-ordered kill-list
SCOPE: features, flags, options, parameters, endpoints, layers, config keys, branches, dependencies, paragraphs
STANCE: every element guilty until it proves it must stay
GRANULARITY: name each element individually, never gesture at aggregate complexity

# Audit tests

DEMAND_REQUESTER: element traces to a real named user, caller, or requirement
DELETION_CONSEQUENCE: removal breaks something beyond a test you would also delete
DEFAULT_DETECTION: option left at default by everyone collapses into the inlined default
DUPLICATION_DETECTION: overlapping elements reduce to one
SELF_INFLICTED_CHECK: element existing only to manage other-element complexity removes with its cause
CARRYING_COST: recurring maintenance, cognitive load, and bug surface weighed against actual benefit

# Output

KILL_LIST: ordered by confidence as CUT_NOW, CUT_UNLESS_DEFENDED, KEEP
CUT_NOW_FORM: one-line reason plus concrete removal consequence
CUT_UNLESS_DEFENDED_FORM: name the evidence that would justify retention
KEEP_FORM: state the earning reason so the element is not re-audited
WIN_CONDITION: smaller artifact, not longer report

# Reverse brainstorm

GUARD_INVESTIGATE: distinguish misunderstood from wasteful before flagging
GUARD_SUNK_COST: ignore effort already spent as a retention reason
GUARD_LOAD_BEARING: confirm DELETION_CONSEQUENCE honestly before recommending a cut

# Validation

TEST_COVERAGE: every listed element passes through all audit tests
BIAS_CHECK: recommendations trend toward fewer things existing
CONSEQUENCE_CHECK: each CUT_NOW states what removal breaks