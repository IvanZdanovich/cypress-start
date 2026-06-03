---
name: write-documentation
description: Use when creating or updating human-readable Markdown documentation files in `docs/`. Produces minimal, precise, semantic, and cognitively efficient content.
---

# Write documentation

PURPOSE: generate human-readable docs that are minimal, precise, semantic, and cognitively efficient
SCOPE: `docs/**/*.md`
AUDIENCE: developers, reviewers, AI agents
DESIGN_GOAL: minimal tokens, maximal meaning, optimized for scanning

# Principles

MINIMAL: fewest tokens that preserve full meaning
NO_REDUNDANCY: single source of truth, link instead of restate
FLAT_STRUCTURE: no prose nesting, no deep heading hierarchies
PATTERN_BASED: recognizable shapes, predictable sections, stable anchors
READABLE_AS_CODE: inline code for paths, fields, commands, constants
SCAN_OPTIMIZED: headings, lists, tables, code fences for rapid parsing
MEMORY_FRIENDLY: chunkable sections, self-contained topics, predictable layout

# Steps

STEP_1: identify the single topic the doc covers
STEP_2: check existing `docs/` files, avoid duplicating content
STEP_3: write H1 title with optional one-line purpose
STEP_4: write H2 sections, each self-contained, flat hierarchy
STEP_5: use short declarative sentences, no filler, no storytelling
STEP_6: use tables for structured mappings (names to meanings, patterns to examples)
STEP_7: use fenced code blocks for patterns and examples
STEP_8: show pattern first, then one concrete example
STEP_9: add cross-reference links to related docs using relative paths
STEP_10: review against checks below

# File conventions

LOCATION: `docs/{topic-name}.md`
FILE_NAMES: kebab-case, topic-scoped
HEADING_LEVELS: H1 file title, H2 major sections, H3 sparingly
LIST_STYLE: bullets for sets, numbers for sequences
TABLE_STYLE: for structured comparisons, bold column headers
CODE_FENCES: language-tagged, short, realistic
INLINE_CODE: backticks for `paths`, `commands`, `fieldNames`, `CONSTANTS`
LINKS: relative paths, e.g. `[Naming conventions](naming-conventions.md)`
DECORATION: no emojis in headings, no decorative separators, minimal punctuation

# Content density

SENTENCE_RULE: one idea per sentence
SECTION_RULE: one topic per section
PARAGRAPH_RULE: 2-4 sentences max per paragraph, prefer lists over paragraphs
WORD_CHOICE: concrete nouns and verbs, no filler phrases
POSITIVE_FRAMING: describe desired pattern, not forbidden pattern
EXAMPLE_DENSITY: one code block per rule, directly after the rule it illustrates

# Semantic template

```markdown
# Topic name

Brief purpose statement (one sentence).

## Section name

Short declarative explanation.

| Column A | Column B |
|----------|----------|
| `value`  | meaning  |

\`\`\`javascript
// pattern
const example = 'concrete';
\`\`\`

## Related

- [Related doc](related-doc.md)
- [Instruction file](../.github/instructions/relevant.instructions.md)
```

# Traceability

DOC_TO_INSTRUCTION: docs explain rationale, instruction files encode rules for code generation
DOC_TO_SKILL: docs provide context, skills provide step-by-step procedures
DOC_TO_CODEBASE: all referenced paths, commands, and patterns match actual workspace
SINGLE_OWNER: each concept documented in exactly one file, others link to it
CROSS_REFERENCES: use relative links to existing docs instead of restating content

# Guards

HEADING_DEPTH: H3 maximum, no deeper nesting
NAME_SPECIFICITY: file names and headings carry specific topic intent
DOC_LINKAGE: every doc linked from at least one other doc or README

# Review checks

ACCURACY_CHECK: paths, commands, patterns match current codebase
BREVITY_CHECK: every sentence carries unique information, no padding
STRUCTURE_CHECK: flat hierarchy, consistent heading levels, predictable sections
LINK_CHECK: all cross-references resolve to existing files
EXAMPLE_CHECK: code blocks syntactically correct and contextually relevant
DENSITY_CHECK: no sentence restates information available elsewhere in the file
SCAN_CHECK: reader can find any fact by heading and position without reading prose
