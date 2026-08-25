---
name: create-skill
description: Use when creating, updating, or sharpening `.claude/skills/*/SKILL.md` files by converting behavior-changing guidance into compact, self-contained, tag-based rules
context: fork
---

# Reasoning Principles

PURPOSE: self-contained `SKILL.md` that shifts future artifacts, judgments, boundaries, or validation — otherwise the file becomes one-time prose instead of reusable behavior control
SIGNAL: certain clear measurable characteristic of model output — otherwise it is context bloat
INCLUSION_GATE: aspects retained only when they change a future artifact decision, boundary, preference, or validation target — otherwise true-but-inert context becomes skill noise
SELF_CONTAINMENT: trigger, artifact shape, constraints, and validation available inside the skill — otherwise correct use depends on outside memory
REASONING: divergent rules carry `— otherwise <failure>` so edge cases inherit the intent — otherwise rules collapse back to model defaults
SEGMENTATION: one skill per responsibility, one section per concept, one tag per rule — otherwise mixed concerns cannot be reused, validated, or removed safely
POSITIVE_BOUNDARIES: limits expressed as desired choices, priorities, formats, or evaluation criteria — otherwise blocked concepts remain active without defining the target
COMPARATIVE_PREFERENCE: preferences expressed as `<desired> over <tempting alternative>` so the rejected default is named and beaten — otherwise a bare directive competes silently against an unnamed habit
MEASURABLE_THRESHOLD: vague quantifiers replaced by an observable test the output passes or fails — otherwise the signal cannot be checked and drifts to taste
FAILURE_SPECIFICITY: `— otherwise` clauses name the specific downstream artifact defect over a generic breakage — otherwise the why-clause stops discriminating edge cases

# Output Shape

SCOPE_PATH: `.claude/skills/<skill-name>/SKILL.md`
FRONTMATTER: `name` (kebab-case); `description` a one-line trigger naming the user situations that activate the skill, verb-led by design and exempt from the noun-led tag rules that shape output — otherwise a noun-only or result-shaping description fails to route and duplicates the body
SECTION_SET: frontmatter, `# Reasoning Principles`, `# Output Shape`, `# Validation`
TAG_FORMAT: `UPPER_SNAKE_CASE: value`, one rule per line, noun-led stable tag
TAG_CONTENT: desired artifact property, boundary, decision criterion, or validation target — otherwise action verbs imply work without controlling the result
WHY_CLAUSE: divergent rules expressed as positive directives followed by `— otherwise <the failure that omitting it causes>`; arbitrary conventions left bare
BOUNDARY_FRAMING: limits expressed as choices, orderings, comparisons, priorities, or formats; domain terms preferred — otherwise prohibitive framing leaves the desired target undefined and active defaults fill the gap
FLOW_NOTATION: sequences expressed as arrow chains or named phase tags — otherwise ordinal workflows imply procedural execution rather than reusable state transitions
SOURCE_COMPRESSION: articles, drafts, and long prompts converted into compact tags preserving behavior-changing intent — otherwise source prose overwhelms skill value
CONFLICT_POLICY: future application quality preferred over source wording loyalty — otherwise contradictions survive as rules
DEDUP_POLICY: overlapping rules folded into the strongest reusable signal — otherwise redundant directives proliferate and produce contradictory output choices
ANTI_PATTERN_FILTER: small scope over broad; key-value signals over prose paragraphs; explicit artifact properties over implicit behavior; positive framing over prohibitive framing; minimal structure over hierarchy — otherwise skills accumulate non-signal content that dilutes output control
EXAMPLE_POLICY: fenced snippets reserved for ambiguity a tag cannot resolve — otherwise decorative examples waste tokens and distract from rules

# Validation

TAG_CHECK: UPPER_SNAKE_CASE, one rule per line, noun-led
SIGNAL_CHECK: every rule passes SIGNAL; each divergent rule carries WHY_CLAUSE; each convention stays bare
DELETION_CHECK: each rule answers what specific future artifact defect appears if the rule is removed; rules without a specific defect are omitted or merged
SELF_CONTAINMENT_CHECK: trigger, scope, output pattern, constraints, and validation are usable without reading the source material
FRAMING_CHECK: rules express desired artifact properties, boundaries, priorities, formats, or evaluation criteria
COMPARATIVE_CHECK: each preference names the losing alternative with `over`; the rejected option is the plausible default, not a strawman
THRESHOLD_CHECK: each quantifier resolves to an observable pass/fail test rather than taste
DENSITY_CHECK: each tag fits on one line with no prose paragraphs between tags; each section contains only tag-value pairs — otherwise structure overhead consumes more tokens than signal
ANTI_PATTERN_CHECK: scope is bounded; perspective is direct criteria; prose is signal-dense; flow is state-based; each rule is unique and output-shaped
SCOPE_CHECK: frontmatter `description` matches the skill's actual trigger
PATH_CHECK: declared paths exist in the workspace
SECTION_CHECK: mandatory sections present — Reasoning Principles, Output Shape, Validation
