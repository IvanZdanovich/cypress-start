---
name: create-skill
description: Use when creating, updating, or improving `.claude/skills/*/SKILL.md` files by turning behavior-changing guidance into compact, self-contained, tag-based rules
---

# Reasoning Principles

PURPOSE: a skill shapes repeatable future work, judgments, or checks; one-time notes, orientation, and static reference go to `docs/` — otherwise the skill loads context without guiding output
NON_OBVIOUS_SCOPE: a skill covers a tricky workflow, judgment, or output shape a capable agent would not guess from the task and repo — otherwise routine work loads rules it does not need
ROUTINE_ROUTING: branch habits, commit habits, file etiquette, and script usage go to docs, hooks, linters, or the README — otherwise everyday actions trigger skills on every small change
NARROW_TRIGGER: one skill serves one task family named by specific artifacts, paths, or outcomes, not a constant concern such as every commit or edit — otherwise it fires on unrelated work
SIGNAL: each rule changes a future decision, boundary, preference, or check and names one testable output trait — otherwise a true but idle fact becomes noise
SINGLE_RESPONSIBILITY: one skill per responsibility, one tag per rule, each rule stated once — otherwise mixed or repeated rules cannot be checked or removed safely and conflict
SELF_CONTAINMENT: trigger, method, output shape, and checks all live inside the skill — otherwise correct use depends on memory from elsewhere
POSITIVE_FRAMING: limits read as wanted choices, orderings, or formats; preferences read as `<wanted> over <tempting default>` — otherwise the blocked habit stays active with no target
MEASURABLE_THRESHOLD: amounts resolve to a test the output clearly passes or fails — otherwise the rule drifts to taste

# Method

FLOW: GATE → COMPRESS → RESOLVE → MERGE → PLACE → VALIDATE
GATE: Test the guidance against PURPOSE, NON_OBVIOUS_SCOPE, and NARROW_TRIGGER; write a skill only if it passes and send the rest to `docs/` or tooling — otherwise skills replace docs
COMPRESS: Cut articles, drafts, and long prompts down to compact tags; keep only what changes behavior — otherwise source prose drowns the rules
RESOLVE: Settle each source conflict by picking the reading that serves future use over loyalty to the source wording — otherwise contradictions survive as rules
MERGE: Fold overlapping or similar rules into the strongest one; delete any rule whose removal causes no named defect — otherwise repeated directives pile up
PLACE: Put each tag in its section: why → Reasoning Principles, action → Method, result trait → Output Shape, pass/fail test → Validation — otherwise steps hide among traits
VALIDATE: Run every `# Validation` check; fix each failure and re-run until all pass

# Output Shape

SCOPE_PATH: `.claude/skills/<skill-name>/SKILL.md`
FRONTMATTER: requires `name` (kebab-case) and `description`; adds runtime keys only when they change how the skill runs — otherwise routing metadata is lost or body rules hide in YAML
DESCRIPTION: one line starting `Use when` that names the narrow situations starting the skill; tag rules do not apply to it — otherwise a vague line misroutes or repeats the body
SECTION_SET: four root sections in order `# Reasoning Principles` → `# Method` → `# Output Shape` → `# Validation`, with no `##` subheadings — otherwise rules land in unpredictable places
TAG_FORMAT: one `UPPER_SNAKE_CASE: value` rule per line with no prose between tags — otherwise structure overhead outweighs signal
TAG_KIND: noun tags in Reasoning Principles and Output Shape, verb tags in Method, `_CHECK` tags in Validation — otherwise a rule's section cannot be told from its tag
TAG_VALUE: noun tag values state a trait, boundary, or decision test with active verbs such as names, requires, or prefers — otherwise a noun-only fragment stays idle
METHOD_FORMAT: opens with `FLOW:` chaining 3–7 phases; each phase gets one verb tag; `VALIDATE` is last — otherwise steps read as a rigid numbered procedure
COMMAND_VALUE: Method and Validation values open with a command verb such as Test, Run, Confirm, or Verify; each check ends in a pass/fail condition — otherwise steps and checks read as descriptions
WHY_CLAUSE: non-default rules end with `— otherwise <exact output defect>`; plain conventions and checks stay bare — otherwise edge cases fall back to model defaults
PLAIN_WORDING: values use common words (turns over converts, pile up over proliferate), keep needed domain terms, and fit 200 characters per line — otherwise dense wording hides the rule
EXAMPLE_POLICY: fenced snippets appear only for ambiguity a tag cannot settle — otherwise examples waste tokens and distract from rules

# Validation

SCOPE_CHECK: Confirm the skill passes PURPOSE, NON_OBVIOUS_SCOPE, and ROUTINE_ROUTING
FRONTMATTER_CHECK: Verify `name` and `description` exist, optional keys hold only runtime metadata, and `description` matches the real trigger and passes NARROW_TRIGGER
SECTION_CHECK: Confirm the four root sections appear in SECTION_SET order with no `##` subheadings
TAG_CHECK: Verify every line inside a section is one tag matching TAG_FORMAT and TAG_KIND, noun tag values pass TAG_VALUE, and Method and Validation values pass COMMAND_VALUE
METHOD_CHECK: Confirm `FLOW:` comes first, chain phases and phase tags match one to one, and `VALIDATE` runs `# Validation` without restating it
SIGNAL_CHECK: Confirm each rule passes SIGNAL, names a defect its removal would cause, and says something no other rule says
WHY_CLAUSE_CHECK: Verify each non-default rule ends with a WHY_CLAUSE naming a specific output defect, not a generic break
FRAMING_CHECK: Confirm rules pass POSITIVE_FRAMING, each `over` names a real default rather than a made-up rival, and amounts pass MEASURABLE_THRESHOLD
WORDING_CHECK: Confirm every value passes PLAIN_WORDING
SELF_CONTAINMENT_CHECK: Confirm the skill works without reading its source material
PATH_CHECK: Verify each declared path exists in the workspace
