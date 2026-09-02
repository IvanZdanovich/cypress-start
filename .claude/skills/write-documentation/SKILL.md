---
name: write-documentation
description: Use when creating, updating, or pruning human-readable Markdown in `docs/` while keeping source automation rules in skills.
---

# Reasoning Principles

SKILL_PRIMACY: repeatable automation rules — conventions, schemas, procedures — live in a skill as the source of truth — otherwise a doc copy competes with the skill and the two drift into conflicting instructions
DOC_ROLE: a doc carries only what no skill should own — concept orientation, decision reasons, and standalone tool or script usage — otherwise procedural rules land where an agent never loads them and humans read rules that rot
POINTER_OVER_COPY: where a doc touches a skill-owned rule, state it in one line and link the skill, never restate it — otherwise the duplicate drifts and the reader trusts the wrong copy
SCAN_OPTIMIZED: shape content so a reader locates an answer without reading linearly — otherwise the doc forces a top-to-bottom read over what the reader already knows
DENSITY: every sentence carries unique information — otherwise filler dilutes the fact the reader came for

# Output Shape

## Skill vs Doc Split

CANONICAL_TO_SKILL: a rule an agent must follow to produce correct output — naming, structure, schema, workflow — belongs in a skill, not a doc
ORIENTATION_TO_DOC: a concept map, the why behind a decision, or standalone tool/script usage with no skill-owned workflow belongs in a doc
SOURCE_OF_TRUTH_SECTION: a doc that overlaps a skill ends with a `## Source of truth` section linking the owning skill(s) and stating the page is orientation only
SKILL_LINK_SHAPE: source-of-truth pointers use relative links to `.claude/skills/<skill-name>/SKILL.md` so readers can jump from orientation to the source rules
REMOVAL: delete a doc that only restates a skill or another doc, and redirect its inbound links to the source — otherwise stale duplicates accumulate and readers land on the wrong copy

## Structure & Style

LOCATION: `docs/{topic-name}.md`
HEADING_LEVELS: H1 title, H2 sections, H3 sparingly — deep nesting hides structure from a scanning reader
HIERARCHY: flat heading tree, consistent levels across the file
LIST_STYLE: bullets for unordered sets, numbers only for genuine sequences — numbering an unordered set implies a precedence that misleads
NO_TABLES: render key→value pairs, reference rows, and comparisons as bullets or definition lists, never Markdown tables — otherwise column spacing clutters diffs and narrow terminals force horizontal scroll
CODE_FENCES: language-tagged, short, realistic — one block per point, placed right after it
INLINE_CODE: backticks for `paths`, `commands`, `fieldNames`, `CONSTANTS`
LINKS: relative paths so references survive repository moves
DECORATION: no emojis, no separators, minimal punctuation
ONE_IDEA_PER_SENTENCE: short, declarative, factual
ONE_TOPIC_PER_SECTION: a few sentences per paragraph, prefer lists over prose
WORD_CHOICE: concrete nouns and verbs, no filler
POSITIVE_FRAMING: state the desired pattern, not the forbidden one

# Validation

SKILL_PRIMACY_CHECK: no doc restates a rule a skill owns; each overlap carries a `## Source of truth` pointer instead
REMOVAL_CHECK: no doc duplicates another doc or a skill
ACCURACY_CHECK: paths, commands, patterns match the codebase
BREVITY_CHECK: every sentence carries unique information
STRUCTURE_CHECK: flat hierarchy, consistent heading levels
TABLE_CHECK: no Markdown tables — every former table renders as bullets or a definition list
LINK_CHECK: all cross-references resolve
FRAMING_CHECK: positive guidance throughout
