---
name: create-skill
description: Use when creating or updating a skill file in `.claude/skills/`. Produces compact, tag-based instruction files that follow the project ruleset.
---

# Principles

PURPOSE: a skill is a self-contained, reusable SKILL.md that shifts the model's output toward a desired pattern — otherwise it is prose absorbed once, not an instruction the model can reapply
LIFETIME_COST: token optimization across every future load plus the downstream cost of misapplying a rule, not the file's raw length — otherwise a rule that misfires downstream costs more than the tokens it saved
REASONING: a divergent rule's why lets the model extend it to unnamed cases — otherwise the bare rule reverts to the model's default at the first case it does not name
INVERSION: each rule's failure mode in its why, not in a negative directive — otherwise a positive-only rule hides the cost it guards against and the reader cannot separate the pattern from its rationale
SEGMENTATION: one skill per responsibility, one section per concept, one tag per rule — otherwise a rule mixing concerns cannot be reused or removed without collateral damage

# Method

SCOPE_PATH: target path `.claude/skills/<skill-name>/SKILL.md`
FRONTMATTER: `name` (kebab-case), `description` (one-line trigger sentence)
SECTIONS: Principles, Method, Validation
TAG_FORMAT: `UPPER_SNAKE_CASE: value`, one rule per line, noun-led
TAG_STYLE: desired-pattern noun tag, positive framing, stable vocabulary
KEEP_TEST: candidate-rule deletion — keep only rules whose removal would change model output
WHY_CLAUSE: divergent-rule format: positive directive then `— otherwise <the failure that omitting it causes>`; convention-only rules stay bare
FRAMING: limits as orderings and comparisons, not arithmetic thresholds the model self-counts; domain-loaded words over coined abstractions
ZOOM_VOCABULARY: C4 zoom level to anchor the abstraction level Context --> Container --> Component --> Code
FLOW_STYLE: workflow, process, or ordered operation in Mermaid diagram syntax, not a numbered list or prose arrow chain
DEDUP: folding of any rule that restates another rule or a section heading
REVERSE_BRAINSTORM: failure-blocking tags — trivial signals, content restated across skills, narrative prose, markdown tables, numbered steps, generic names and values, mixed tag responsibilities
CODE_EXAMPLE: fenced snippet only where it resolves ambiguity a tag cannot, never as decoration

# Validation

TAG_CHECK: UPPER_SNAKE_CASE, one rule per line, noun-led
SIGNAL_CHECK: every rule passes KEEP_TEST; each divergent rule carries its why, each convention stays bare
FRAMING_CHECK: positive directives throughout, each divergent rule's why introduced by `— otherwise` and naming the failure it prevents
TOKEN_CHECK: no filler phrases, no narrative prose, no markdown tables, no numbered lists, no decorative code fences
ZOOM_CHECK: scope description names its C4 zoom level Context --> Container --> Component --> Code
FLOW_CHECK: every workflow, process, or ordered operation described using Mermaid diagram syntax — no numbered lists, no inline arrow chains
SCOPE_CHECK: frontmatter `description` matches the skill's actual trigger
PATH_CHECK: declared paths exist in the workspace
SECTION_CHECK: mandatory sections present — Principles, Method, Validation
