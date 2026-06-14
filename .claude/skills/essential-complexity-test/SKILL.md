---
name: essential-complexity-test
description: Use to evaluate conceptual clarity, architecture, or necessity of abstractions
---

# Principles

PURPOSE: attribute every difficulty to essential or accidental complexity and remove the accidental
ESSENTIAL_COMPLEXITY: inherent in the problem, irreducible, unremovable without changing the problem
ACCIDENTAL_COMPLEXITY: introduced by tools, abstractions, history, or choices, fully eliminable
COUNTERFACTUAL: a from-scratch solver of this exact problem still faces essential, never accidental

# Test

DIFFICULTY_NAMING: state each source of difficulty concretely
COUNTERFACTUAL_RUN: ask whether a fresh solver of this exact problem still hits it
ORIGIN_TRACE: for accidental, point to the tool, abstraction, legacy decision, or premature optimization that introduced it
CLASSIFICATION: essential, accidental, or mixed split into its parts
TRIANGULATION: difficulty avoided by multiple distinct approaches is accidental

# Treatment

ESSENTIAL_TREATMENT: express directly, name it, isolate it, add no cleverness that obscures it
ACCIDENTAL_TREATMENT: remove via simpler tool, fewer layers, deleted abstraction, collapsed indirection
RECOVERY_ESTIMATE: report share of felt difficulty that is self-inflicted and recoverable

# Output

COMPLEXITY_SPLIT: two columns essential versus accidental with mixed items decomposed
ESSENTIAL_ENTRY: most direct expression, not a removal
ACCIDENTAL_ENTRY: origin plus the specific simplification that removes it

# Reverse brainstorm

GUARD_FAMILIARITY: hard-to-understand is not essential, run the counterfactual before concluding
GUARD_RECLASSIFY: reject relabeling accidental as essential to justify keeping it
GUARD_BEHAVIOR: preserve essential behavior when a removal forces a larger change

# Validation

COUNTERFACTUAL_APPLIED: every difficulty passed through COUNTERFACTUAL_RUN
ORIGIN_PRESENT: each accidental item names its source
DIRECTNESS_CHECK: each essential item has a direct-expression treatment, not a removal