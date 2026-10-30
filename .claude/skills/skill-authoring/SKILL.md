---
name: skill-authoring
description: Use when creating, updating, or improving `.claude/skills/*/SKILL.md` files by turning behavior-changing guidance into compact, self-contained, tag-based rules
---

# Intent

Produce skills that change agent behavior on repeated work at the lowest context cost.
When entries conflict or none applies, choose the reading that keeps fewer, sharper entries.

# Reasoning Principles

WRITE_SKILL_FOR_REPEATED_WORK — Write a skill only for work that will happen again.
A skill shapes a repeatable judgment, workflow, or check. A one-time note, a repo overview, or a table of fixed facts belongs in `../../../docs`. There it costs nothing until someone asks for it. The cost is that the work is done once or twice without help before the skill exists.

WRITE_ONLY_WHAT_AGENTS_MISS — Write a skill only for what a capable agent would get wrong on its own.
The reader already knows its craft and can read the repo. Guidance it would have reached unaided makes routine work load rules it does not need. The cost is that a weaker model gets less help, so test the cut on the weakest model the team uses.

PREFER_RULE_WHEN_GLOB_FITS — Prefer a path-scoped rule to a skill whenever a glob can name the target files.
A skill loads for a whole task family; a rule loads only when the agent opens a matching file. Keep file-kind detail in a skill and every unrelated session pays context for it. The cost is that a rule loads only on a file read, so guidance needed before any file is opened stays in the skill.

GIVE_MAIN_TASK_DETAILED_RULES — Give the repo's main task detailed path-scoped rules rather than one broad skill.
In a test-automation repo, writing specs is the main task. Cover it with one general skill and the work the repo exists for gets the vaguest guidance in it. The cost is several rule files to keep in agreement instead of one skill.

SEND_HABITS_TO_HOOKS — Send branch habits, commit habits, file etiquette, and script usage to docs, hooks, linters, or the README.
These fire on every small change. As a skill they start on unrelated work. As a hook or a linter they fail the build, so nobody depends on the model noticing. The cost is a script to write and maintain, and a hook cannot judge an unusual case the way prose can.

TRIGGER_ON_ONE_TASK_FAMILY — Trigger one skill on one task family, named by its artifacts, paths, or outcomes.
A trigger written around a constant concern — every commit, every edit — fires on work the skill cannot help. Name what the work produces instead. The cost is that a narrow trigger misses some nearby work the skill could have helped.

MAKE_PHASE_ONLY_IF_ORDERED — Make a step a Method phase only when doing it out of order causes a defect.
Steps whose order does not matter belong in `# Validation` as checks. Written as phases, they look like a procedure and hide the steps whose order does matter. The cost is that a newcomer gets no suggested order for the order-free steps.

KEEP_DECISION_CHANGING_ENTRIES — Keep an entry only when it changes a future decision and names one testable trait of the output.
A boundary, a preference, a check, or a tie-break earns its place. A statement that is true but idle reads as noise and dilutes the entries around it. The cost is lost background, which a reader who wants the full picture must find in `../../../docs`.

SCORE_DOUBTFUL_ENTRIES — Score a doubtful entry on four counts, then keep four, rewrite three, and drop two or fewer.
One count each: it goes against a likely default, names the defect its removal causes, says something new, and a phase or check uses it. Without the score, weak entries stay because their author likes them. The cost is a few minutes per entry, so score only the doubtful ones.

WRITE_STANDALONE_ENTRIES — Write each entry so it can be read, checked, or dropped without the others.
A set that only works read front to back cannot have a single entry retired, and nobody dares cut anything. The cost is some repeated words, since an entry cannot say "as above".

WRITE_FROM_REAL_FAILURE — Write an entry from a failure that actually happened.
A preference with no failure behind it gives the reader nothing to test. It also gives nothing to weigh when it conflicts with another entry. The cost is that a failure nobody has met yet goes unguarded until it happens once.

KEEP_EVERYTHING_INSIDE_SKILL — Keep the trigger, the method, the output shape, and the checks all inside the skill.
The skill is read alone, long after its source material is gone. Anything left outside it turns correct use into a memory test. The cost is a longer file, so long tables still go to `references/` inside the skill directory.

WRITE_AMOUNTS_AS_TESTS — Write every amount as a test the output plainly passes or fails.
"At most 60 entries" can be checked; "concise" drifts to whatever taste the reader brought with them. The cost is that a fixed number is sometimes wrong for an unusual case, which `# Intent` then settles.

KEEP_SKILL_INDEPENDENT — Keep a skill usable with no other skill or rule installed, repeating shared guidance rather than pointing to it.
A skill is installed alone into other repos. A pointer to a unit that is absent there leads nowhere, and the agent works without the detail. The cost is the same guidance kept in several units, which must then be edited together.

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

FLOW: SCREEN → [SPLIT] → COMPRESS → RESOLVE → MERGE → PLACE → VALIDATE

SCREEN — Screen the guidance against `WRITE_SKILL_FOR_REPEATED_WORK`, `WRITE_ONLY_WHAT_AGENTS_MISS`, and `TRIGGER_ON_ONE_TASK_FAMILY` before writing.
Done when each piece of guidance is kept for the skill or sent to `../../../docs`, a hook, or a linter, and the work stops if nothing is kept. Skipped, skills turn into documentation that loads itself.

SPLIT — Split a staged workflow into one rule per stage, giving each stage rule only that stage’s detail.
Done when the skill holds only what no glob can name: the approach, the order, the vision. Split after the prose is written, and the workflow ships as one heavy skill.

COMPRESS — Compress the source article, draft, or prompt into entries in plain English, keeping only what changes behavior.
Done when every entry is plain English and changes a decision. Filler, background, and expert terms left in hide the rules and slow every reader who works in a second language.

RESOLVE — Resolve each conflict in the source by picking the reading that serves future use.
Done when no two entries contradict. Loyalty to the original wording leaves both sides of a contradiction standing as rules.

MERGE — Merge overlapping entries into the strongest one and delete any entry whose removal causes no named defect.
Done when no two entries say the same thing. Repeated directives pile up, and each copy drifts the first time one of them is edited.

PLACE — Place each entry in the section that owns it.
Done when the goal sits in `# Intent`, open decisions in Reasoning Principles, ordered steps in phases, traits in Output Shape, and pass-or-fail tests in Validation. Misplaced, a step hides among traits.

VALIDATE — Validate the skill by running every check in `# Validation`, fixing each failure, and running them again until all pass.
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

WRITE_TO_SKILLS_PATH — Write the skill to `.claude/skills/<skill-name>/SKILL.md`, with long reference material beside it under `references/`.
The runtime finds a skill only at that path. Reference material kept anywhere else is lost when the skill is copied to another repo.

GIVE_NAME_AND_DESCRIPTION — Give the frontmatter `name` and `description`, and add another key only when it changes how the skill runs.
A decorative key looks like working configuration, and a body rule hidden in YAML never reaches the reader.

WRITE_USE_WHEN_DESCRIPTION — Write the `description` as one line of at most 50 words, starting "Use when" and naming the narrow situations that should start the skill.
The runtime routes on this line alone and loads it in every session. Entry rules do not apply to it, and a rule placed in it costs context everywhere. The cost is that 50 words cannot list every trigger, so name the most common ones.

NAME_DIRECTORY_WIDEST_FIRST — Name the directory `<qualifier>...-<subject>-<action>` in kebab-case, two to four segments, qualifiers widest first.
Runtime or language, then framework, then tool: `react-form-validation`, `js-memory-leak-debugging`, `chrome-devtools-cli`. Order them any other way and two skills over one tool sit apart in every listing. The cost is a name that reads less naturally than the spoken one.

ADD_QUALIFIER_ONLY_IF_NEEDED — Add a qualifier only when the guidance would be wrong for a nearby stack, and keep it as narrow as the guidance.
`chrome-devtools-cli` beats `browser-debugging` when every command is Chrome-only, or the skill loads for stacks it cannot run on. A `js-` that changes nothing only adds noise. The cost is a new skill later, when a second stack arrives and the bare name no longer fits.

NAME_ARTIFACT_THEN_ACTION — Name the artifact the skill acts on and end with the work it performs.
`form-validation`, `memory-leak`, `lcp`, then `debugging`, `review`, `migration`, `cli`. A role word such as helper or manager says only that the skill exists. A bare noun clashes once one skill finds problems and another fixes them. The cost is a longer name.

DRAW_WORDS_FROM_INSTALLED_SKILLS — Draw every qualifier and action word from the skills already installed, and repeat each qualifier inside the `description`.
`js` and `es`, or `debugging` and `troubleshooting`, split one axis into two names. The runtime matches on the description, so a `react-` skill whose description omits React fires on Angular work. The cost is keeping an older, weaker word because the installed skills already use it.

KEEP_PUBLISHED_NAME_FIXED — Keep a published name fixed and unused by any other skill or rule, adding a new skill when the axis changes.
Other skills, rules, and docs cite the name, so a rename breaks every pointer to it. A name shared with a rule makes each pointer ambiguous. The cost is living with a name that no longer fits well.

# Validation

SCOPE_CHECK — Confirm the guidance passes `WRITE_SKILL_FOR_REPEATED_WORK`, `WRITE_ONLY_WHAT_AGENTS_MISS`, and `SEND_HABITS_TO_HOOKS`.
ROUTING_CHECK — Confirm no skill entry could be scoped by a path glob, and each stage moved to a rule holds only its own detail.
MAKE_PHASE_ONLY_IF_ORDERED_CHECK — Confirm each phase names the defect its order prevents, with order-free steps moved to `# Validation`.
FRONTMATTER_CHECK — Verify the frontmatter holds `name` and `description`, that any other key is runtime metadata, and that `description` names a narrow trigger.
NAME_CHECK — Verify the directory name and the frontmatter `name` are one identical string passing `NAME_DIRECTORY_WIDEST_FIRST`.
NAME_UNIQUE_CHECK — Confirm the name matches no other skill or rule under `../..`.
KEEP_DECISION_CHANGING_ENTRIES_CHECK — Confirm every entry passes `KEEP_DECISION_CHANGING_ENTRIES`, names the defect its removal would cause, and says something no other entry says.
SCORE_DOUBTFUL_ENTRIES_CHECK — Confirm every entry scores three or four on `SCORE_DOUBTFUL_ENTRIES`, and that no phase or check cites an entry that was dropped.
PRINCIPLE_ADMISSION_CHECK — Confirm each Reasoning Principle settles a case the Method leaves open rather than restating a phase.
WRITE_AMOUNTS_AS_TESTS_CHECK — Verify every amount in the skill passes `WRITE_AMOUNTS_AS_TESTS`.
KEEP_SKILL_INDEPENDENT_CHECK — Confirm the skill names no other skill or rule that it needs in order to work.
KEEP_EVERYTHING_INSIDE_SKILL_CHECK — Confirm the skill can be used correctly without reading the material it came from.
PATH_CHECK — Verify every path the skill names exists in the repo that installs it, not only in the repo it was written in.
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
