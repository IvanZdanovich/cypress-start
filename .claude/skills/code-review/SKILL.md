---
name: code-review
description: Use when reviewing pull requests or conducting code reviews to identify contradictions, hidden complexity, missed edge cases, and improvement opportunities.
---

# Principles

PURPOSE: identify quality issues and improvement paths using reverse brainstorming
SCOPE: pull requests across spec, examples, constraints, and command files
CORE_TECHNIQUE: mentally sabotage the change, then check if any sabotage is present

# Sabotage lens

QUESTION: "How would I make this PR guarantee future maintenance pain?"
STRATEGIES: hardcode changing values, name generically, skip cleanup, duplicate logic between layers, create over-specific commands, hide state dependencies, mix concerns in one `it`

# Applied checks

SEGMENTATION: each `it` tests exactly one outcome
EXTRACTION: boundaries in constraints not hardcoded
LOCAL_QUALITY: instance names describe unique intent
ASYMMETRY: boundary testing covers both sides (min/max, valid/invalid)
MERGING: related assertions grouped for same element
UNIVERSALITY: new commands reusable beyond introducing spec
NESTING: hierarchy reflects Given > When > Then
PRELIMINARY_ACTION: `before` hooks cover all preconditions, cleanup both directions
CUSHIONING: error responses use `failOnStatusCode: false`
EQUIPOTENTIALITY: spec runs independently without prior execution
INVERSION: negative cases tested alongside positive
COPYING: single source of truth per concept
CONTINUITY: instances reused across contexts, token obtained once

# Red flags

MONOLITHIC_IT: multiple unrelated outcomes → split per outcome
MAGIC_NUMBERS: no constraint reference → extract to constraints
GENERIC_NAMES: `item1`, `test1`, `data` → semantic intent names
IMPLICIT_STATE: hidden dependencies between contexts → make explicit
OVER_SPLIT: same element properties → merge related assertions
SPECIFIC_COMMANDS: unlikely reuse → inline or generalize
ONE_WAY_CLEANUP: only `after` → add `before` too
FILE_DEPENDENCY: needs other spec's data → create own instances
HAPPY_PATH_ONLY: no error scenarios → add boundary and error cases
DUPLICATED_LOGIC: between examples and specs → single source in examples

# Review checklist

STRUCTURE, TITLES, DATA, CLEANUP, COMMANDS, ASSERTIONS, BUGS, CONSTRAINTS, CONSISTENCY, ESLINT, SABOTAGE

# Validation

SABOTAGE_CHECK: reverse brainstorm lens applied
CHECKLIST_CHECK: all items addressed
FLAG_CHECK: no flagged patterns present
