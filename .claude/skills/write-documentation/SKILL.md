---
name: write-documentation
description: Use when creating or updating human-readable Markdown documentation files in `docs/`. Produces minimal, precise, semantic, and cognitively efficient content.
---

# Principles

PURPOSE: minimal, precise, semantic, cognitively efficient docs
SCOPE: `docs/**/*.md`
AUDIENCE: developers, reviewers, AI agents
SINGLE_SOURCE: one authoritative location per concept, link instead of restate
SCAN_OPTIMIZED: headings, lists, tables, code fences for rapid parsing

# Steps

1. Identify single topic
2. Check existing `docs/` for deduplication
3. Write H1 title with one-line purpose
4. Write H2 sections, each self-contained
5. Pattern first, then one concrete example
6. Add cross-references using relative paths
7. Review against validation checks

# File conventions

LOCATION: `docs/{topic-name}.md`
HEADING_LEVELS: H1 title, H2 sections, H3 sparingly
LIST_STYLE: bullets for sets, numbers for sequences
CODE_FENCES: language-tagged, short, realistic
INLINE_CODE: backticks for `paths`, `commands`, `fieldNames`, `CONSTANTS`
LINKS: relative paths
DECORATION: no emojis, no separators, minimal punctuation

# Content density

ONE_IDEA_PER_SENTENCE: short declarative, direct, factual
ONE_TOPIC_PER_SECTION: 2-4 sentences max per paragraph, prefer lists
WORD_CHOICE: concrete nouns and verbs, no filler
POSITIVE_FRAMING: desired pattern, not forbidden
EXAMPLE_DENSITY: one code block per rule, directly after
TRIM: each sentence unique, free of restated content

# Validation

ACCURACY_CHECK: paths, commands, patterns match codebase
BREVITY_CHECK: every sentence carries unique information
STRUCTURE_CHECK: flat hierarchy, consistent heading levels
LINK_CHECK: all cross-references resolve
FRAMING_CHECK: positive guidance throughout
