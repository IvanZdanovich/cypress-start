---
name: agent-authoring
description: Use when creating, updating, or narrowing `.claude/agents/*.md` subagent files — choosing the one role, the tools, and the model, and writing a body that works with no view of the calling conversation
---

# Intent

Produce agents that receive the right work, hold only the tools that work needs, and return a result the caller can act on.
When entries conflict or none applies, choose the narrower role and the shorter tool list.

# Reasoning Principles

WRITE_AGENT_FOR_SEPARATE_CONTEXT — Write an agent only for work that gains from a context of its own.
Three gains count: reading far more than the caller needs to keep, running beside other work, and working under fewer tools. Without one of them, the agent only adds a handover in which detail is lost. The cost of an agent is a fresh start on every call, paid in time and in tokens.

PREFER_SKILL_FOR_SHARED_CONTEXT — Prefer a skill to an agent when the work depends on the conversation so far.
A skill loads into the session that already holds the user's words and the files read. An agent starts without them, so the caller must restate everything, and what it forgets to restate is lost. The cost is that the skill's work fills the caller's context, so heavy reading still favors an agent.

PREFER_BUILT_IN_AGENT — Prefer a built-in agent when one already covers the role.
The runtime ships agents for code search, for planning, and for general tasks. A custom copy of one must be kept current by hand, and it competes with the original for the same work. The cost is no control over its tools or its return shape.

GIVE_AGENT_ONE_ROLE — Give an agent one role that fits in a sentence without "and".
An agent that both reviews and fixes cannot be held to read-only tools. Its description also matches too much work, so the caller sends it tasks it does badly. The cost is more agents to maintain, and a caller that must chain two of them.

GRANT_FEWEST_TOOLS — Grant only the tools the role's actions need, listed by name in `tools`.
An agent with no `tools` line inherits every tool the caller has, including every connected server. A review agent written that way can edit the files it was asked to judge. The cost is an agent that stops when a task needs one tool more, and a list to update as the role grows.

TREAT_BASH_AS_WRITE_ACCESS — Treat `Bash` as write access when deciding whether an agent is read-only.
A shell can write, delete, and push. An agent with `Read, Grep, Glob, Bash` and a body saying it changes nothing is read-only in name alone. The cost is that a read-only agent without `Bash` cannot run tests or read git history.

WITHHOLD_AGENT_TOOL — Withhold the `Agent` tool unless the role is to hand work to other agents.
An agent holding it can start agents of its own, three layers deep by default. Each layer multiplies the cost, and no layer sees what the others were told. The cost is that the agent cannot split a large task and must return it whole.

SPLIT_OUTSIDE_READS_FROM_WRITES — Split an agent that reads web pages, tickets, or other outside text from every tool that writes or sends.
Outside text can carry instructions written by a stranger. An agent holding both kinds of tool can be told by a web page to change the repo or post its contents. The cost is two agents and a handover where one agent would be simpler.

LEAVE_PERMISSION_MODE_UNSET — Leave `permissionMode` unset unless the role cannot work under the caller's mode.
The agent then asks for approval exactly as the caller would. A shared agent set to `bypassPermissions` removes every approval prompt in each repo that installs it. The cost is approval prompts that interrupt a long run.

ENFORCE_LIMITS_IN_FRONTMATTER — Enforce a limit through `tools`, `disallowedTools`, or a hook rather than a sentence in the body.
The runtime applies the frontmatter on every call. A sentence such as "you must not edit" holds only while the model notices it, and that is never every time. The cost is coarse control: `tools` removes a whole tool, and a finer limit needs a hook script.

VERIFY_NAMES_AGAINST_RUNTIME — Verify every frontmatter key, tool name, and model name against the runtime docs or a working agent in the repo.
The runtime ignores an unknown key without an error, and a tool name that does not exist grants nothing. Source articles invent names such as `Read_File`, and the agent then runs without the tool it was built around. The cost is one docs lookup per unfamiliar name.

SET_MODEL_BY_ALIAS — Set `model` only when the role is plainly lighter or heavier than the caller's work, using an alias.
The aliases are `haiku`, `sonnet`, `opus`, and `inherit`. A dated model ID stops resolving when that model is retired, and the agent fails in every repo that installed it. The cost is that an alias moves to a newer model without notice, and behavior can shift with it.

CAP_TURNS_FOR_BOUNDED_WORK — Cap the run with `maxTurns` when the role has a known size.
A turn is one model reply with its tool calls. An agent stuck on a failing command repeats it until the budget is gone, and the cap returns the partial result instead. The cost is that a cap set too low cuts off honest work, so leave open-ended roles uncapped.

SCOPE_HOOKS_WITH_MATCHER — Scope every hook in the frontmatter with a `matcher` naming its tools and a `timeout` in seconds.
A hook is a command the runtime runs around a tool call. Without a matcher it runs on every call, and without a timeout one hanging script freezes the agent. The cost is that a narrow matcher misses a tool added to the agent later.

WRITE_HOOK_PATHS_FROM_ROOT — Write each hook command path from `$CLAUDE_PROJECT_DIR`.
A relative path resolves against the directory the agent is in at that moment. It breaks after one `cd`, and it breaks in every worktree.

ISOLATE_PARALLEL_WRITERS — Isolate an agent that edits files and may run beside another one with `isolation: worktree`.
A worktree is a separate checkout of the same repo. Two writers in one checkout overwrite each other's edits, and neither one reports it. The cost is disk space, setup time, and a merge the caller must do afterwards.

PRELOAD_SKILLS_AGENT_NEEDS — Preload a skill the role always needs by naming it in the `skills` key.
An agent does not receive the skills the caller already loaded. Left to find the skill by itself, it sometimes works without it and returns output in the wrong shape. The cost is the skill's full text in the agent's context on every run, so preload only what the role always uses.

LEAVE_PROJECT_RULES_OUT — Leave conventions that CLAUDE.md already states out of the body.
An agent loads CLAUDE.md at start, like the main session does. A second copy in the body drifts from the first, and the agent follows whichever it read last. The cost is that the agent is only as good as the CLAUDE.md of the repo that installs it.

WRITE_ONLY_WHAT_ROLE_MISSES — Write in the body only what a capable model would get wrong in this role.
The reader already knows how to review, test, and search. A "you are an expert" opening and general good practice change no decision, and they bury the entries that do. The cost is that a weaker model gets less help, so test the body on the model the agent names.

STATE_EDGE_OF_ROLE — State in the body what lies outside the role and what to do on meeting it.
An agent sent to fix one module finds a bug in the next one. Told nothing, it fixes that too, and the caller receives changes nobody asked for. The cost is a real problem left unfixed until the caller acts on the report.

TELL_AGENT_TO_RETURN_BLOCKERS — Tell the agent to return a missing input or a blocker as its result.
An agent cannot ask the user a question. Told nothing, it guesses the missing input and returns a confident answer built on the guess. The cost is a wasted run whenever the caller forgot one input.

REQUIRE_CHECKS_BEFORE_RETURN — Require an agent that edits files to run the repo's tests and lint on its change before returning.
The caller cannot see the work, so it reads a clean return as working code. Give such an agent `Bash`, since without it the check cannot run. The cost is run time on every call.

SEND_HEAVY_OUTPUT_TO_FILE — Send long output such as logs or build output to a file, returning its path and a short summary.
The final message lands whole in the caller's context. A return carrying a full log removes the saving the separate context was created for. The cost is a file somebody must clean up, and a tool that can write it.

REQUIRE_EVIDENCE_IN_RETURN — Require the agent to name what it ran, what it read, and what it could not check.
The caller sees only the final message and none of the work behind it. An agent allowed to answer "done" gives the caller a claim it cannot test. The cost is a longer final message in the caller's context.

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

FLOW: SCREEN → SCOPE → GRANT → WRITE → TEST → VALIDATE

SCREEN — Screen the work against `WRITE_AGENT_FOR_SEPARATE_CONTEXT` and `PREFER_SKILL_FOR_SHARED_CONTEXT` before writing anything.
Done when the work is kept for an agent or sent to a skill, a rule, or a hook. The work stops if nothing is kept. Skipped, a checklist becomes an agent and every use pays for a handover.

SCOPE — Scope the agent to one role, the input it needs from the caller, and the result it returns.
Done when each of the three is one written sentence. Tools chosen before the role is fixed are chosen for a job that then changes.

GRANT — Grant tools by listing every action the role performs and naming the one tool each action needs.
Done when every tool in `tools` maps to a listed action and no action lacks a tool. Tools picked from memory of similar agents carry over rights this role never uses.

WRITE — Write the body for a reader that knows the repo's CLAUDE.md and nothing about the calling conversation.
Done when the body states the goal, the judgments the role must make, and the return shape. Written before the grant, the body describes actions the agent has no tool for.

TEST — Test the agent on one real task, sending only what a caller reading the description would send.
Done when it finishes without asking for missing context and returns the stated shape. Untested, the agent works only when its own author writes the task message.

VALIDATE — Validate the agent by running every check in `# Validation`, fixing each failure, and running them again until all pass.
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

WRITE_TO_AGENTS_PATH — Write the agent to `.claude/agents/<name>.md` as one file, with the opening `---` on line 1.
The runtime skips a file whose frontmatter does not parse or does not start on the first line, and it reports nothing.

GIVE_NAME_DESCRIPTION_AND_TOOLS — Give the frontmatter `name`, `description`, and `tools`, and add another key only when it changes how the agent runs.
The runtime requires only the first two, and `GRANT_FEWEST_TOOLS` makes the third required here. A decorative key looks like working configuration.

WRITE_USE_WHEN_DESCRIPTION — Write the `description` as one line starting "Use when", naming the situation that should start the agent and what it returns.
The caller decides to hand work over from this line alone, and it writes the task message from it. A description that names only a topic receives work the role does not cover. The cost is a longer line that every session loads.

NAME_INPUT_IN_DESCRIPTION — Name in the `description` any input the agent cannot find by itself, such as a branch, a path, or a ticket number.
The caller never reads the body. Input named only there is not sent, and the agent guesses it or stops. The cost is more words in a line that every session loads.

STATE_RETURN_IN_OUTPUT_SHAPE — State the form of the final message in the agent's own `# Output Shape`, with the decision or result on the first line.
The final message lands whole in the caller's context and is all that survives the run. With no stated form the agent returns its working notes, and the caller must dig the answer out. The cost is a fixed form that fits an unusual result badly.

NAME_EXCLUDED_WORK — Name in the `description` the nearby work that belongs to the caller or to another agent.
"Not for fixing the findings" keeps a review agent from receiving repair work. Two agents with overlapping descriptions receive each other's tasks in an order nobody chose. The cost is a description to revisit whenever a nearby agent is added.

CAP_RETURN_LENGTH — Cap the final message at a stated number of lines or findings.
"At most 10 findings, worst first" can be checked. Without a number the return grows with the work, and the largest tasks flood the caller. The cost is findings left out, so have the agent say how many it dropped.

FIX_ROUTING_IN_DESCRIPTION — Fix an agent that receives the wrong work by changing its `description` before its body.
The body is read only after the work has arrived. An agent rewritten there still receives the same wrong tasks and now refuses them.

NAME_AGENT_SUBJECT_THEN_ROLE — Name the file `<subject>-<role>` in kebab-case, one to three segments, ending in the work performed.
`unit-review` and `spec-triage` say what goes in and what happens to it. A name ending in `agent`, or a bare role such as `reviewer`, clashes once a second agent reviews something else.

KEEP_NAME_EQUAL_TO_FILENAME — Keep the frontmatter `name` and the filename one identical string.
The runtime routes by `name` and ignores the filename. Two spellings mean the file a reader opens is not the agent that runs.

KEEP_PUBLISHED_NAME_FIXED — Keep a published name fixed and unused by any other agent, skill, or rule.
Callers, hooks, and docs cite the name, so a rename breaks every pointer to it. Two agents sharing one name load in an order nobody chose. The cost is living with a name that no longer fits well.

# Validation

SCREEN_CHECK — Confirm the work gains from a separate context in one of the three ways `WRITE_AGENT_FOR_SEPARATE_CONTEXT` names.
GIVE_AGENT_ONE_ROLE_CHECK — Confirm the role is one sentence with no "and" joining two jobs.
GRANT_FEWEST_TOOLS_CHECK — Verify the frontmatter carries a `tools` line and every tool on it maps to an action the body asks for.
TREAT_BASH_AS_WRITE_ACCESS_CHECK — Confirm an agent described as read-only either lacks `Bash` or has a hook that blocks writing commands.
ENFORCE_LIMITS_IN_FRONTMATTER_CHECK — Confirm every "must not" in the body is also enforced by `tools`, `disallowedTools`, or a hook.
VERIFY_NAMES_AGAINST_RUNTIME_CHECK — Verify every frontmatter key, tool name, and model name appears in the runtime docs or in a working agent.
SET_MODEL_BY_ALIAS_CHECK — Confirm `model` is absent or holds an alias, with no dated model ID.
PREFER_BUILT_IN_AGENT_CHECK — Confirm no built-in agent already covers the role.
WITHHOLD_AGENT_TOOL_CHECK — Confirm `tools` lists `Agent` only where the role is to hand work to other agents.
SPLIT_OUTSIDE_READS_CHECK — Confirm no agent holds both a tool that reads outside text and a tool that writes or sends.
LEAVE_PERMISSION_MODE_UNSET_CHECK — Confirm `permissionMode` is absent, or the body names the reason the caller's mode does not work.
SCOPE_HOOKS_WITH_MATCHER_CHECK — Verify every hook carries a `matcher`, a `timeout`, and a command path starting at `$CLAUDE_PROJECT_DIR`.
ISOLATE_PARALLEL_WRITERS_CHECK — Confirm an agent holding `Edit` or `Write` that may run in parallel sets `isolation: worktree`.
LEAVE_PROJECT_RULES_OUT_CHECK — Confirm no body entry restates a convention found in CLAUDE.md or in a rule under `../../rules`.
FRONTMATTER_CHECK — Verify the frontmatter opens on line 1, parses as YAML, and holds `name`, `description`, and `tools`.
DESCRIPTION_CHECK — Confirm the `description` starts "Use when", names the starting situation, the return, and every input the caller must send.
RETURN_CHECK — Confirm the agent's `# Output Shape` fixes the first line of the final message and requires the evidence `REQUIRE_EVIDENCE_IN_RETURN` names.
STATE_EDGE_OF_ROLE_CHECK — Confirm the body names what lies outside the role and tells the agent to return blockers and missing input.
REQUIRE_CHECKS_BEFORE_RETURN_CHECK — Confirm an agent holding `Edit` or `Write` also holds `Bash` and is told to run the repo's checks.
CAP_RETURN_LENGTH_CHECK — Verify the agent's `# Output Shape` states a number that limits the final message.
NAME_EXCLUDED_WORK_CHECK — Confirm the `description` overlaps no other agent's description under `.claude/agents/`.
NAME_CHECK — Verify the filename and the frontmatter `name` are one identical string passing `NAME_AGENT_SUBJECT_THEN_ROLE`.
NAME_UNIQUE_CHECK — Confirm the name matches no other agent, skill, or rule under `.claude/`.
TEST_CHECK — Run the agent on one real task with a description-only task message, and confirm it returns the stated shape without asking for context.
PATH_CHECK — Verify every path and skill name the agent mentions exists in the repo that installs it.
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
