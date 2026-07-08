---
name: create-skill
description: Use when creating or updating a skill file in `.claude/skills/`. Produces compact, tag-based instruction files that follow the project ruleset.
---

# Principles

PURPOSE: a skill is a self-contained, reusable SKILL.md that shifts the model's output toward a desired pattern — otherwise it is prose absorbed once, not an instruction the model can reapply
LIFETIME_COST: optimize tokens across every future load plus the downstream cost of misapplying a rule, not the file's raw length — otherwise a rule that misfires downstream costs more than the tokens it saved
SIGNAL: a rule earns its load cost only by changing what the model produces — otherwise it restates the model's default, shifting nothing at pure cost
REASONING: a divergent rule's why lets the model extend it to unnamed cases — otherwise the bare rule reverts to the model's default at the first case it does not name
INVERSION: put each rule's failure mode in its why, not in a negative directive — otherwise a positive-only rule hides the cost it guards against and the reader cannot separate the pattern from its rationale
SEGMENTATION: one skill per responsibility, one section per concept, one tag per rule — otherwise a rule mixing concerns cannot be reused or removed without collateral damage

# Method

SCOPE_PATH: write to `.claude/skills/<skill-name>/SKILL.md`
FRONTMATTER: `name` (kebab-case), `description` (one-line trigger sentence)
SECTIONS: frontmatter, principles, method, validation
TAG_FORMAT: `UPPER_SNAKE_CASE: value`, one rule per line, noun-led
TAG_STYLE: name the desired pattern as a noun tag, positive framing, stable vocabulary
KEEP_TEST: delete each candidate rule and keep it only if the model's output would change
WHY_CLAUSE: write each divergent rule as a positive directive, then `— otherwise <the failure that omitting it causes>`; leave arbitrary conventions bare
FRAMING: express limits as orderings and comparisons, not arithmetic thresholds the model self-counts; prefer domain-loaded words over coined abstractions
FLOW_STYLE: express a sequence as an arrow chain or named phase tags, never a numbered list — the model tracks named stages and transitions, not ordinals
DEDUP: fold any rule that restates another rule or a section heading
REVERSE_BRAINSTORM: add tags that block known failures — trivial signals, content restated across skills, narrative prose, markdown tables, numbered steps, generic names and values, mixed tag responsibilities
CODE_EXAMPLE: fenced snippet only where it resolves ambiguity a tag cannot, never as decoration

# Validation

TAG_CHECK: UPPER_SNAKE_CASE, one rule per line, noun-led
SIGNAL_CHECK: every rule passes KEEP_TEST; each divergent rule carries its why, each convention stays bare
FRAMING_CHECK: positive directives throughout, each divergent rule's why introduced by `— otherwise` and naming the failure it prevents
TOKEN_CHECK: no filler phrases, no narrative prose, no markdown tables, no numbered lists, no decorative code fences
SCOPE_CHECK: frontmatter `description` matches the skill's actual trigger
PATH_CHECK: declared paths exist in the workspace
SECTION_CHECK: mandatory sections present — Principles, Method, Validation
