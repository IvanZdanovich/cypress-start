---
name: create-skill
description: Use when creating or updating a skill file in `.claude/skills/`. Produces compact, tag-based instruction files that follow the project ruleset.
---

# Create skill

PURPOSE: produce SKILL.md that guides code generation with minimal tokens
SCOPE: `.claude/skills/<skill-name>/SKILL.md`

# File conventions

LOCATION: `.claude/skills/<kebab-case-name>/SKILL.md`
FRONTMATTER: `name` (kebab-case), `description` (one-line trigger sentence)
HEADING_LEVELS: H1 skill title, H2 major sections
TAG_FORMAT: `UPPER_SNAKE_CASE: value`
TAG_COUNT: one rule per line
LIST_STYLE: comma-separated inline for compact sets
CODE_STYLE: fenced blocks for structural examples only

# Guardrails

TAG_STYLE: noun tags, positive framing, stable vocabulary
FRAMING: desired pattern as tag value, not forbidden pattern
SCOPE_SPECIFICITY: one skill per responsibility, no overlapping scopes
EXAMPLE_DENSITY: one code block max, only when structure is non-obvious
REFERENCE_LINKS: point to instruction files, not inline prose copies

# Review checks

TAG_CHECK: UPPER_SNAKE_CASE, one rule per line, noun-led
FRAMING_CHECK: positive guidance and desired patterns throughout
TOKEN_CHECK: no filler phrases, no narrative prose
SCOPE_CHECK: frontmatter `description` matches the skill's actual trigger
PATH_CHECK: declared paths exist in the workspace
