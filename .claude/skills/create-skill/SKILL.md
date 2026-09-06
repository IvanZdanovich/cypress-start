---
name: create-skill
description: Use when creating, updating, or improving `.claude/skills/*/SKILL.md` files by turning behaviour-changing guidance into compact, self-contained, tag-based rules
---

# Reasoning Principles

PURPOSE: a self-contained `SKILL.md` shapes future work, judgments, boundaries, or checks — otherwise the file becomes one-time notes instead of reusable guidance
SIGNAL: each rule names one clear, testable trait of the model output — otherwise it is filler
NON_OBVIOUS_WORKFLOW: keep a skill only for a tricky workflow, judgment, or output shape that a capable agent would not guess from the task alone — otherwise routine work loads extra context without improving the answer
ROUTINE_REJECTION: put branch habits, commit habits, file-change etiquette, broad documentation swaps, and standalone script usage in docs, hooks, linters, or the README instead of skills — otherwise everyday actions trigger skills on every small change
TRIGGER_SINGULARITY: one skill fires for one task family, not for a constant background concern such as every commit, every edit, or every doc touch — otherwise unrelated work inherits rules it does not need
INCLUSION_GATE: keep a point only when it changes a future decision, boundary, preference, or check — otherwise a true-but-idle fact becomes noise
SELF_CONTAINMENT: trigger, output shape, rules, and checks all live inside the skill — otherwise correct use depends on memory from elsewhere
REASONING: non-default rules end with `— otherwise <specific output failure>` so edge cases keep the intent — otherwise rules fall back to model defaults
SEGMENTATION: one skill per responsibility, one section per idea, one tag per rule — otherwise mixed concerns cannot be reused, checked, or removed safely
POSITIVE_BOUNDARIES: state limits as wanted choices, priorities, formats, or judging criteria — otherwise a blocked idea stays active with no target to aim at
COMPARATIVE_PREFERENCE: write preferences as `<wanted> over <tempting alternative>` so the rejected default is named and beaten — otherwise a plain order competes silently with an unnamed habit
MEASURABLE_THRESHOLD: replace vague amounts with a test the output clearly passes or fails — otherwise the signal cannot be checked and drifts to taste
FAILURE_DETAIL: each `— otherwise` clause names the exact output defect, not a generic break — otherwise the why-clause stops telling edge cases apart

# Output Shape

SCOPE_PATH: `.claude/skills/<skill-name>/SKILL.md`
FRONTMATTER: `name` (kebab-case) and `description` are required; add optional runtime keys only when they change how the skill runs — otherwise useful routing metadata is dropped or prose rules hide in YAML
DESCRIPTION: one-line trigger naming the narrow situations that start the skill, verb-led by design and free from the noun-led tag rules — otherwise a noun-only or result-shaping line fails to route and repeats the body
DESCRIPTION_EXCLUSIVITY: the trigger uses specific artifacts, paths, or outcomes and avoids broad phrases such as `when committing` unless tied to a tricky workflow — otherwise the skill fires for plain tasks and clutters context
SECTION_SET: keep the required `# Reasoning Principles`, `# Output Shape`, and `# Validation` sections after the frontmatter; add optional `##` subheadings inside a section to group related tags — otherwise a long tag list stays hard to scan
TAG_FORMAT: `UPPER_SNAKE_CASE: active rule value`, one rule per line, a steady noun tag name with a verb-bearing value — otherwise tags become plain labels with no shaping force
TAG_CONTENT: each value states the wanted output trait, boundary, decision test, or check using active verbs such as names, includes, prefers, requires, validates, or produces, not a noun-only fragment — otherwise the rule stays idle instead of enforceable
CREATION_GATE: create a skill only when guidance changes decisions in a repeatable workflow with non-obvious failures; use `docs/` for orientation or static reference — otherwise skills replace docs and eat context on ordinary tasks
WHY_CLAUSE: write non-default rules as positive directives followed by `— otherwise <the failure that dropping it causes>`; leave plain conventions bare
BOUNDARY_FRAMING: state limits as choices, orderings, comparisons, priorities, or formats, and prefer domain terms — otherwise a blocking phrase leaves the target undefined and defaults fill the gap
FLOW_NOTATION: write sequences as arrow chains or named phase tags — otherwise numbered steps imply strict procedure instead of reusable state changes
PLAIN_WORDING: write every rule value in plain English and prefer common words (turns over converts, idle over inert, pile up over proliferate); keep domain terms — otherwise dense wording hides the rule and slows correct use
SOURCE_COMPRESSION: turn articles, drafts, and long prompts into compact tags that keep the behavior-changing intent — otherwise source prose drowns the skill value
CONFLICT_POLICY: prefer better future use over loyalty to the source wording — otherwise contradictions survive as rules
DEDUP_POLICY: fold overlapping rules into the single strongest reusable signal — otherwise repeated directives pile up and produce conflicting choices
ANTI_PATTERN_FILTER: prefer small scope over broad scope, key-value signals over prose, explicit traits over implied behavior, and positive framing over blocking — otherwise skills gather weak content that weakens output control
EXAMPLE_POLICY: keep fenced snippets only for ambiguity a tag cannot settle — otherwise nice-looking examples waste tokens and distract from rules

# Validation

TAG_CHECK: tag names are UPPER_SNAKE_CASE nouns; tag values hold an active, checkable predicate, not a noun-only fragment
SIGNAL_CHECK: every rule passes SIGNAL; each non-default rule carries a WHY_CLAUSE; each convention stays bare
NON_OBVIOUS_CHECK: the skill covers a specialized workflow or judgment a capable agent would not guess from the request and repo context alone; obvious routine guidance moves to docs or tooling
TRIGGER_SCOPE_CHECK: the frontmatter `description` starts the skill only for its task family, not for generic commits, edits, doc changes, or normal repo hygiene
DELETION_CHECK: each rule answers which specific future defect appears if it is removed; rules without a specific defect are dropped or merged
SELF_CONTAINMENT_CHECK: trigger, scope, output pattern, rules, and checks work without reading the source material
PLAIN_WORDING_CHECK: each rule value reads as plain English with no rare or academic word that a common synonym could replace; only necessary domain terms remain
FRAMING_CHECK: rules state wanted output traits, boundaries, priorities, formats, or judging criteria
COMPARATIVE_CHECK: each preference names the losing option with `over`, and that option is a real default, not a strawman
THRESHOLD_CHECK: each amount resolves to an observable pass/fail test, not taste
DENSITY_CHECK: each tag fits on one line with no prose between tags; each section holds only tag-value pairs and optional `##` subheadings — otherwise structure overhead outweighs signal
ANTI_PATTERN_CHECK: scope is bounded; framing is direct criteria; prose is dense with signal; flow is state-based; each rule is unique and output-shaped
FRONTMATTER_CHECK: the frontmatter has `name` and `description`; optional keys are platform metadata and do not repeat body rules
SCOPE_CHECK: the frontmatter `description` matches the real trigger
PATH_CHECK: declared paths exist in the workspace
SECTION_CHECK: required sections are present — Reasoning Principles, Output Shape, Validation; optional `##` subheadings inside them are allowed and not flagged
