---
name: rule-authoring
description: Use when creating, updating, or pruning `.claude/rules/**/*.md` files that load always-on or path-scoped conventions into agent sessions
---

# Intent

Produce rules that load only with the file kind they govern and say only what that file needs.
When entries conflict or none applies, choose the narrower scope and the shorter rule.

# Reasoning Principles

WRITE_RULE_FOR_FILE_KIND — Write a rule for a short convention that holds every time the agent touches one kind of file.
A workflow belongs in a skill and a repo overview belongs in `../../../docs`. Put a workflow in a rule and it loads in full on every matching file read, even when the work does not need it. The cost is that guidance spanning several file kinds must be split or moved to a skill.

WRITE_RULE_WHERE_GLOB_FITS — Write a rule only where a path or extension glob can name its targets and the guidance is specific to that file kind.
Generic approach, judgment, and vision have no glob and fit no file. Left in a rule, they load everywhere and say nothing about the file in hand. The cost is that sound general advice gets no rule and must live in a skill or CLAUDE.md.

TURN_STAGES_INTO_RULES — Turn each stage of a workflow skill into one rule, scoped to the paths that stage writes and holding only that stage's detail.
The stage rule arrives exactly when the agent opens a file of that stage. Restate the whole workflow in each and every matching file reloads all of it. The cost is that no single rule shows the whole workflow, so the skill keeps the order.

GIVE_MAIN_TASK_DETAILED_RULES — Give the repo's main task detailed rules rather than one broad skill.
In a test-automation repo, spec files deserve their own rules. Cover them with a general skill and the work the repo exists for gets the vaguest guidance in it. The cost is several rule files to keep in agreement instead of one skill.

SEND_LINTABLE_TO_LINTER — Send any pattern a linter can check to the repo's lint rules.
A lint rule fails the build. A prose rule holds only while the model notices it, which is most of the time and never all of it. The cost is a lint rule to write, and the agent learns of the pattern only when the build fails.

PREFER_PATH_SCOPED_RULES — Prefer a path-scoped rule to an unscoped one, and keep unscoped files for repo-wide conventions.
An unscoped rule loads in every session. Fill it with file-kind detail and every session pays context for rules it will not use. The cost is that a scoped rule is absent until a matching file is read.

EXPECT_LOAD_ON_FILE_READ — Expect a path-scoped rule to load when the agent reads a matching file, and nowhere else.
Creating a file, running a command, and making a commit match nothing. Guidance needed at those moments belongs in a skill or a hook, or it never loads at all.

KEEP_ONE_TOPIC_PER_FILE — Keep one topic per file and name the file for that topic.
Unrelated conventions sharing a file load together and cannot later be scoped apart without splitting the file and its history. The cost is more files, each with its own frontmatter.

WRITE_STANDALONE_ENTRIES — Write each entry so it can be read, checked, or dropped without the others.
A file that only works read top to bottom cannot have a single convention retired, and nobody dares cut anything. The cost is some repeated words, since an entry cannot say "as above".

KEEP_ONE_OWNER_PER_CONVENTION — Keep each convention in one place across rules, CLAUDE.md, and docs.
Copies drift, and the agent follows whichever it read last. Replace every copy with a one-line pointer at the owner. A skill may repeat a convention, since it must work where the rule is not installed. The cost is one more file to open when a reader follows the pointer.

KEEP_RULES_IN_AGREEMENT — Keep project rules in agreement with `~/.claude/rules/` and CLAUDE.md.
None of the three wins a conflict, so a disagreement between them is resolved unpredictably from one session to the next. The cost is that a project cannot quietly override a user rule and must change one of the two.

GIVE_METHOD_ONLY_IF_ORDERED — Give a rule a `# Method` only when its file kind has an order whose violation causes a defect.
Deleting before writing is such an order. Where no such order exists, the phase list has a single step and teaches the reader nothing.

GIVE_INTENT_IF_GOAL_UNCLEAR — Give a rule a `# Intent` only when its glob and file name leave its goal unclear.
An Intent costs context on every matching read. Where the glob already shows what the rule serves, the section only repeats it. The cost is that a rule without Intent has no stated way to lean in a conflict.

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

# Method

FLOW: ROUTE → SCOPE → WRITE → MERGE → VALIDATE

ROUTE — Route each piece of guidance to its owner before writing it.
Done when each piece is marked rule, lint rule, skill, or `../../../docs`. A file-kind convention becomes a rule, a checkable pattern a lint rule, a workflow a skill, and a repo overview a doc; skipped, rules turn into skills in disguise.

SCOPE — Scope the rule with the narrowest `paths` globs that cover every target, then list the files each glob matches.
Done when the listing shows every target and no unrelated file. An unchecked glob either fires on half the repo or matches nothing and the rule never loads.

WRITE — Write each convention as an instruction to follow, in plain English.
Done when every entry reads as an instruction. A descriptive note reads as background, and background gets skimmed rather than obeyed.

MERGE — Merge any overlap with other rules and CLAUDE.md into one owner, leaving a one-line pointer behind.
Done when each convention has one owner and every former copy is a pointer. Two copies of a convention are two conventions the moment either is edited.

VALIDATE — Validate the rule by running every check in `# Validation`, fixing each failure, and running them again until all pass.
Done when one full run passes every check.

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

WRITE_TO_RULES_PATH — Write the rule to `.claude/rules/<topic>.md`.
The runtime loads rules only from that tree, so a rule kept anywhere else never loads.

GIVE_FRONTMATTER_ONLY_PATHS — Give the frontmatter nothing but `paths`, with `paths:` alone on its line and each glob quoted on a line of its own.
A value on the `paths:` line turns the block into one plain scalar and the rule silently stops matching. An unscoped rule carries no frontmatter at all, since an ignored key looks like working configuration.

WRITE_GLOBS_WITH_ESCAPES — Write globs with `**` for any depth and `{a,b}` for alternatives, escaping a literal `[` as `\[`.
An unescaped bracket is a character class, so a filename containing one matches the wrong files.

NAME_FILE_WIDEST_FIRST — Name the file `<qualifier>...-<concern>.md` in kebab-case, one to three segments, qualifiers widest first.
Runtime or language, then framework, then tool: `unit-specs.md`, `js-unit-specs.md`, `playwright-e2e-specs.md`. Order them any other way and two files over one framework share no visible axis. The cost is a name that reads less naturally than the spoken one.

TAKE_CONCERN_FROM_GLOB — Take the concern segment from the distinguishing part of the `paths` glob.
`reqs/**/*.e2e.spec.js` gives `e2e-specs.md`. Name it anything else and no reader can tell which file owns a path. The cost is a new file whenever the glob changes its distinguishing part.

KEEP_UMBRELLA_NAME_AS_STEM — Keep the umbrella file's bare name as the stem of each specialization, adding the qualifier in front.
`specs.md`, `unit-specs.md`, `e2e-specs.md` show their layer at a glance. Rename the stem and the family stops sorting together.

ADD_QUALIFIER_ONLY_IF_NEEDED — Add a qualifier only when the rules would be wrong for a nearby stack under the same folder tree.
The umbrella file stays bare. A `js-` on a file that fits any stack adds only noise and invites an `es-` copy. The cost is a new file later, when a second stack arrives under the same tree.

KEEP_PUBLISHED_NAME_FIXED — Keep a published filename fixed and unused by any other rule or skill, adding a new file when the axis changes.
Other rules, skills, and docs cite the name, so a rename breaks every pointer to it. A name shared with a skill makes each pointer ambiguous. The cost is living with a name that no longer fits well.

NAME_SKILL_IN_ONE_LINE — Name a skill in one line where a rule touches a skill-owned workflow.
"Load the bug-tracking skill before linking a bug in `req.bugs`" is the whole entry. Spell the workflow out and the rule now owns a second copy of it. The cost is that the rule says nothing useful where that skill is not installed.

# Validation

ROUTE_CHECK — Confirm each entry is a file-kind or repo-wide convention, and not a workflow, a repo overview, or a pattern a linter could check.
WRITE_RULE_WHERE_GLOB_FITS_CHECK — Confirm each convention names its targets by path or extension and is specific to that file kind.
SCOPE_CHECK — Verify each `paths` glob matches at least one existing file and no unrelated file, and that each unscoped file holds only repo-wide conventions.
EXPECT_LOAD_ON_FILE_READ_CHECK — Confirm every convention is needed only after the agent reads a matching file, with creation-time and command-time guidance moved to a skill or a hook.
GIVE_FRONTMATTER_ONLY_PATHS_CHECK — Confirm the frontmatter holds only `paths` or is absent, with `paths:` alone on its line and every glob quoted.
GIVE_METHOD_ONLY_IF_ORDERED_CHECK — Confirm a `# Method` appears only where the order can be got wrong, and that its phases carry the steps.
GIVE_INTENT_IF_GOAL_UNCLEAR_CHECK — Confirm a rule carries `# Intent` only where its glob and file name leave its goal unclear.
NAME_CHECK — Verify the filename passes `NAME_FILE_WIDEST_FIRST` and its concern matches the `paths` glob.
NAME_UNIQUE_CHECK — Confirm the name matches no other rule or skill under `../..`.
KEEP_ONE_OWNER_PER_CONVENTION_CHECK — Confirm no entry restates another rule or CLAUDE.md, and that each overlap is a one-line pointer.
KEEP_RULES_IN_AGREEMENT_CHECK — Confirm no entry conflicts with `~/.claude/rules/`, CLAUDE.md, or any skill.
PATH_CHECK — Verify every path and skill name the rule mentions exists in the repo that installs it.
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
BUILD_CHECK — Run `npm run validate` in a repo that defines it, and confirm it reports no problem.
