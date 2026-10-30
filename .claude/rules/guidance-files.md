---
paths:
  - '.claude/skills/**/SKILL.md'
  - '.claude/rules/**/*.md'
  - '.claude/agents/**/*.md'
---

# Reasoning Principles

NAME_ENTRY_BY_ITS_ACTION — Name every entry with an UPPER_SNAKE tag that states the action the entry requires.
The tag is the fixed name a check, a phase, or another file cites, and a list of tags reads as the rule set. A topic tag like SIGNAL sends every reader to the body. Give a tag one meaning in every file that uses it. The cost is a longer tag, and a rename breaks every file that cites it.

FOLLOW_TITLE_WITH_REASON — Follow each title with one to four plain sentences giving the reason, the failure the entry prevents, and what following it costs.
The title decides, the body defends. The cost shows where the entry stops paying, and an entry shown without one is followed past that point. Leave the cost out only where following costs nothing, and drop an entry that cannot name its failure. The price is a longer body on every load.

OPEN_TITLE_WITH_ACTION — Open the title with the action to take and put any "over", "rather than", or "never" clause after it.
"Prefer a rule to a skill" reads as an instruction. "Never put file-kind detail in a skill" leads with the wrong move, and the first move named is the one that gets copied. The cost is that a plain ban must be rewritten as the action that replaces it.

KEEP_ONE_INSTRUCTION — Keep one instruction per entry.
A title that needs "and" to stay true is two entries. Merged instructions cannot be cited, checked, or retired one at a time. The cost is more entries counted against the budget.

WRITE_SIMPLE_ENGLISH — Write in simple English that a reader with English as a second language understands on the first read.
Use common words, sentences of at most 25 words, and no idioms, slang, or wordplay. Teams read these files in many first languages, and a phrase like "comes round again" is misread, so the rule is followed wrongly. The cost is longer text, since one exact word often becomes several common ones.

REPLACE_SPECIALIST_TERMS — Replace a specialist term with plain words, and keep it only where tools or docs use it.
Words any developer knows, like test, commit, or function, need nothing. A word only experts of one field know, like "idempotent" or "LCP", stops other readers. Explain it in plain words where it first appears: "LCP (the time until the main content shows)". The explanation costs a few words, paid once at first use.

# Output Shape

KEEP_SECTION_ORDER — Keep the sections in this order: `# Intent`, `# Reasoning Principles`, an optional `# Method`, `# Output Shape`, `# Validation`.
Intent states the goal, Principles settle what the rest leaves open, Method fixes an order, Output Shape describes the artifact, Validation tests it. A rule may leave out Intent. Without the split, steps hide among traits. The cost is that a small unit carries headings for only a few entries.

STATE_RESULT_IN_INTENT — State in `# Intent` the result the unit produces, then the way to lean when entries conflict or none applies.
Write one to three plain sentences, at most 60 words, with no tag. Without a stated goal, a gap is filled by the nearest entry read literally, and a conflict is settled by chance. The cost is those words on every load, which is why a rule with a clear glob may leave it out.

OPEN_ENTRY_WITH_TAG — Open each entry with its tag, an em dash, and one imperative sentence that stands on its own.
Build the tag from the title's first verb plus one to four words, at most 32 characters, with no articles. A reader who stops at that line still knows what to do. A tag that drifts from its title sends the reader to the wrong entry. The cost is a title that must carry the whole instruction without help from the body.

LEAVE_PROSE_UNMARKED — Leave the prose unmarked: no bold, no italics, no bullets, no tables.
The tag at the head of the line is the one signal the reader needs. Markup decorating every entry marks nothing, and it is the noise that made the packed tag line hard to read. The cost is that real structure, such as a table of values, must move to a fenced example or a reference file.

WRITE_SHORT_BODY_BELOW — Write the body on the lines under the tag, at most 80 words, and leave a blank line before the next entry.
Blank lines are the only separator a reader gets once the markup is gone. Run two multiline entries together and the second one's title reads as the first one's reasoning. The cost is that long reasoning does not fit and must move to a reference file beside the unit.

OPEN_METHOD_WITH_FLOW — Open `# Method` with a `FLOW:` line naming three to seven single-verb phases, then give one entry per phase, tagged with the phase name.
Write `→` for the next phase, `[X]` for an optional one, `A | B` for alternatives, and `↺ X` for a return. Open each phase body with "Done when" and its result. Without exits and returns, the agent cannot tell when to move on. The cost is a fixed form, so work with no real order gets no Method at all.

WRITE_CHECKS_AS_ONE_LINE — Write each check as one line tagged `<NAME>_CHECK`, opening with Confirm, Verify, or Run and ending in a condition that passes or fails.
Use the tested entry's tag as the name when a check tests one entry, so a rename carries the check with it. A check written as a trait is never run. The cost is that a judgment with no pass or fail condition cannot be a check and stays a principle.

HOLD_ENTRY_BUDGET — Hold a rule to 35 entries and a skill or an agent to 60, counting everything outside `# Validation`.
Both files load whole on every match. Past that count the file crowds out the task it was loaded to help. The cost is that true guidance past the count must be dropped, split into another unit, or moved to a reference file.

ADD_EXAMPLE_ONLY_IF_AMBIGUOUS — Add a fenced example only where the sentences leave a real ambiguity.
An example repeating what the body already said spends tokens on agreement. The cost is fewer examples for a reader who learns from them.

# Validation

TITLE_CHECK — Confirm every title is one imperative sentence readable without its body.
OPEN_TITLE_WITH_ACTION_CHECK — Confirm no title opens with Never, Avoid, Do not, Don't, or No.
BODY_CHECK — Confirm each body runs one to four sentences, stays at or under 80 words, and names the failure the entry prevents.
FOLLOW_TITLE_WITH_REASON_CHECK — Confirm each body outside `# Method` names what following the entry costs or when it yields, unless following it costs nothing.
NAME_ENTRY_BY_ITS_ACTION_CHECK — Verify every tag is UPPER_SNAKE, unique in the file, and states the action its entry requires.
OPEN_ENTRY_WITH_TAG_CHECK — Verify every tag outside `# Validation` starts with its title's first verb and holds at most 32 characters.
REFERENCE_CHECK — Verify every tag cited in a body sits in backticks and names an entry in this file, not one moved to another unit.
OPEN_METHOD_WITH_FLOW_CHECK — Verify every phase in `FLOW:` has one entry, every phase entry appears in `FLOW:`, and every phase body opens with "Done when".
KEEP_SECTION_ORDER_CHECK — Confirm the sections appear in `KEEP_SECTION_ORDER` order, with `# Intent` in every skill and agent, and carry no `##` subheadings.
STATE_RESULT_IN_INTENT_CHECK — Confirm `# Intent` holds one to three untagged sentences, at most 60 words, naming the result and the way to lean in a conflict.
LEAVE_PROSE_UNMARKED_CHECK — Confirm the file carries no bold, italic, bullet, or table markup outside a fenced example.
SPACING_CHECK — Confirm a blank line follows every entry that carries a body.
HOLD_ENTRY_BUDGET_CHECK — Confirm the file holds at most 35 entries as a rule, or 60 as a skill or an agent, outside `# Validation`.
WRITE_SIMPLE_ENGLISH_CHECK — Confirm every sentence holds at most 25 words and carries no idiom, slang, or wordplay.
REPLACE_SPECIALIST_TERMS_CHECK — Confirm every term beyond common developer words is replaced by plain words or explained in plain words where it first appears.
BUILD_CHECK — Run `npm run validate` in a repo that defines it, and confirm it reports no problem for this file.
