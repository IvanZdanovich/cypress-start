---
name: create-skill
description: Use to create or update a compact, tag-based skill file in .claude/skills/
---

# Principles
PURPOSE: guide production of token-efficient self-contained SKILL.md
SEGMENTATION: one skill per responsibility, one section per concept, one tag per rule
SCOPE: `.claude/skills/<skill-name>/SKILL.md`
SECTIONS: frontmatter, principles, custom sections, validation
FRONTMATTER: `name` (kebab-case), `description` (one-line trigger sentence)
HEADING_LEVELS: H1 major sections
TAG_FORMAT: `UPPER_SNAKE_CASE: value`
TAG_STYLE: desired pattern as noun tag, positive framing, stable vocabulary
LIST_STYLE: comma-separated inline for compact sets
THE_OTHER_WAY_AROUND: define what the skill prevents, not just what it produces — use REVERSE_BRAINSTORM tags
REVERSE_BRAINSTORM: prevent restated content across skills, narrative prose, generic tag names and values, mix of tag responsibilities

# Validation
TAG_CHECK: UPPER_SNAKE_CASE, one rule per line, noun-led
FRAMING_CHECK: positive guidance and desired patterns throughout
TOKEN_CHECK: no filler phrases, no narrative prose, meaningful signals only
SCOPE_CHECK: frontmatter `description` matches the skill's actual trigger
PATH_CHECK: declared paths exist in the workspace
SECTION_CHECK: mandatory sections present — Principles, Validation
