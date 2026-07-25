---
name: write-documentation
description: Use when creating, updating, or pruning human-readable Markdown docs in `docs/` — keeps skills the source of truth for canonical rules and docs a thin orientation layer that points to them.
---

# Principles

SKILL_PRIMACY: canonical repeatable rules — conventions, schemas, procedures — live in a skill, the single source of truth for humans and AI alike — otherwise a doc copy competes with the skill and the two drift into conflicting instructions
DOC_ROLE: a doc carries only what no skill should own — concept orientation, decision rationale, and tool or script usage — otherwise procedural rules land where an agent never loads them and humans read rules that rot
POINTER_OVER_COPY: where a doc touches a skill-owned rule, state it in one line and link the skill, never restate it — otherwise the duplicate drifts and the reader trusts the wrong copy
SCAN_OPTIMIZED: shape content so a reader locates an answer without reading linearly — otherwise the doc forces a top-to-bottom read over what the reader already knows
DENSITY: every sentence carries unique information — otherwise filler dilutes the fact the reader came for

# Method

## Skill or doc

CANONICAL_TO_SKILL: a rule an agent must follow to produce correct output — naming, structure, schema, workflow — belongs in a skill, not a doc
ORIENTATION_TO_DOC: a concept map, the why behind a decision, or how to run a tool or script with no skill owner belongs in a doc
SOURCE_OF_TRUTH_SECTION: a doc that overlaps a skill ends with a `## Source of truth` section linking the owning skill(s) and stating the page is orientation only
REMOVAL: delete a doc that only restates a skill or another doc, and redirect its inbound links to the source — otherwise stale duplicates accumulate and readers land on the wrong copy

## Location and structure

LOCATION: `docs/{topic-name}.md`
HEADING_LEVELS: H1 title, H2 sections, H3 sparingly — deep nesting hides structure from a scanning reader
HIERARCHY: flat heading tree, consistent levels across the file

## Format and style

LIST_STYLE: bullets for unordered sets, numbers only for genuine sequences — numbering an unordered set implies a precedence that misleads
NO_TABLES: render key→value pairs, reference rows, and comparisons as bullets or a definition list (`**term** — text`, sub-bullets for extra attributes), never a Markdown table — table source rots through column realignment, floods diffs with noise on any edit, and forces horizontal scroll in narrow terminals, while a scanning reader locates a leading bold term faster than a value buried mid-row
CODE_FENCES: language-tagged, short, realistic — one block per point, placed right after it
INLINE_CODE: backticks for `paths`, `commands`, `fieldNames`, `CONSTANTS`
LINKS: relative paths so references survive repository moves
DECORATION: no emojis, no separators, minimal punctuation

## Content density

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
