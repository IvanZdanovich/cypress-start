---
name: documentation-authoring
description: Use when writing, restructuring, or reviewing documentation — READMEs, tutorials, how-to guides, reference pages, explanations, decision records, runbooks, docstrings and code comments, or agent instruction files such as CLAUDE.md and AGENTS.md — or when choosing the checks that run on docs in CI.
---

# Intent

Produce documents that let one named reader finish one task, with every fact true for the current release and nothing the reader does not need.
When entries conflict or none applies, choose the reading that keeps the content correct and the reader's task first, over shorter text or a clean lint run.

# Reasoning Principles

FIX_CONTENT_BEFORE_STYLE — Fix wrong, missing, and stale content before wording, length, or format.
In a survey of 254 developers, all six problems rated as blockers were content problems, and no presentation problem was. Practitioners rated clarity important 88% of the time and spelling 23%. The cost is that style work waits while content is fixed.

SPLIT_PAGE_BY_DOCUMENT_TYPE — Split a page that serves two of these needs: teach me, how do I, what is, or why.
These are the four document types of the Diataxis framework: tutorial, how-to guide, reference, and explanation. A tutorial with a command table and design history between its steps serves neither the learner nor the person looking up a flag. The cost is more pages and more links.

KEEP_TASK_STEPS_TOGETHER — Keep every step of one task on one page, and split pages by task rather than by length.
Developers report fragmented docs, where one answer needs many clicks, as a failure in its own right. Moving a step to another page "for brevity" breaks the task for every reader. The cost is long pages for long tasks.

LINK_INSTEAD_OF_COPYING — Link to one source for each fact, command block, or procedure instead of copying it into a second page.
Copies drift: a check found 1,969 copied sentences and code blocks across 1,290 hand-written Kubernetes pages, and no common prose or Markdown linter reports copies. The cost is one more click. A short fact that blocks the task may be repeated when a check keeps both copies equal.

UPDATE_DOCS_IN_SAME_CHANGE — Update the docs in the same change as the behaviour they describe.
93% of people in GitHub's 2017 open-source survey had met outdated docs. A code change that leaves its comment wrong is 1.5 times more likely to be followed by a bug within a week. Docs promised for later rarely come. The cost is a larger change to review.

WRITE_COMMENTS_FOR_INTENT — Write code comments that state intent, a constraint, or a reason the code cannot show.
A comment that repeats the next line is a second copy that turns false when the code changes. Developers learning an API most often asked for the intent behind a design. The cost is thought per comment, so fewer comments get written.

KEEP_DOCSTRINGS_AS_CONTRACTS — Keep a public docstring to the contract: inputs, outputs, errors, and side effects.
Tutorials and design history inside a docstring bury the contract and are not found by readers looking for a guide. Put them in a guide or decision record and link it. The cost is two places, each with one job.

RECORD_DECISIONS_SEPARATELY — Record each significant design decision in its own record with its context, the decision, and all its consequences.
A decision kept only in chat or a pull request is argued again by the next team. Keep a replaced record and mark it superseded instead of deleting it. The cost is writing time at the moment of deciding.

WRITE_AGENT_FILES_FOR_GAPS — Write into an agent instruction file only rules an agent cannot learn from the code, README, or docs.
In a 2026 study, CLAUDE.md and AGENTS.md files did not raise task success on average and raised agent cost over 20%. Agent-generated files repeated existing docs, and repository overviews did not help. The cost is giving up the architecture tour many templates suggest.

KEEP_AGENT_FILES_SHORT — Keep each CLAUDE.md or AGENTS.md under 200 lines.
Claude Code documentation states that longer files use more context and are followed less well. Contradicting lines make the agent pick one at random. Rules for one part of the code can move to a file loaded only there. The cost is rules split across several files.

FAIL_BUILD_ON_PRECISE_CHECKS — Fail the build only on doc checks that are rarely wrong: links, placeholders, filler phrases, parse errors, and heading structure.
On 1,722 Kubernetes pages, stock Google and Microsoft Vale styles raised 299 and 255 alerts per 1,000 lines. On 32 seeded defects they caught 4 and 7, none of them content defects. The cost is style drift that the gate does not catch.

TURN_OFF_STYLE_ONLY_RULES — Turn off markdownlint rules MD013 line length, MD033 inline HTML, and MD060 table alignment before enforcing markdownlint-cli2.
With defaults, markdownlint-cli2 0.23.3 raised 232,310 alerts on the Kubernetes docs, 72% of them inline HTML. On three clean pages, 14 alerts were table alignment and line length. The cost is losing those style rules.

CHECK_LINKS_ON_BUILT_SITE — Check links on the built HTML when a static-site generator builds the docs.
On Kubernetes Markdown source, lychee 0.24.2 reported 8,232 broken links, which were nearly all site routes such as `/docs/...` that exist only after the build. On plain Markdown read as files it caught both seeded broken links with no noise. The cost is a build before the check.

TREAT_READABILITY_AS_HINT — Treat a readability score as a hint and never as a pass or fail gate.
Formulas such as Flesch-Kincaid count syllables and sentence length, were built on school texts, and are not validated for technical docs. They score whole files: on the fixture they flagged a four-sentence page as hard. The cost is losing one simple number.

IMPROVE_DOCS_PAGE_BY_PAGE — Improve existing docs one page at a time, starting with the page readers use most.
A full restructure that starts with empty folders for every type stalls before readers see any benefit. Rank pages by traffic or by support questions, and ship each fixed page. The cost is mixed quality across the docs for a while.

# Method

FLOW: FRAME → SCOPE → DRAFT → CUT → VERIFY → CHECK

FRAME — Frame the document by naming its reader, the reader's task, the prerequisites, and one document type.
Done when those four are written down. Drafting first produces a page that mixes types and serves no one, and that is costly to split later.

SCOPE — Scope the document by searching the existing docs and code comments for each fact it will state.
Done when every fact is marked as new or as already written, with a link planned for each one already written. Scoping after drafting leaves copies that drift.

DRAFT — Draft the content in the shape that `# Output Shape` describes.
Done when the reader can finish the task from the page alone, with links only for background.

CUT — Cut each sentence, example, and section the named reader does not need for the named task.
Done when every remaining sentence passes that test. In a measured test, text with half the words was 58% more usable. Verifying before cutting spends review time on text that is then deleted.

VERIFY — Verify every command, flag, path, name, and example against the current release by running it or finding it in the code.
Done when each one ran as written or was found, and each failure was fixed. About one fifth of comments written by language models held a false statement, and no linter studied found a wrong command.

CHECK — Check the changed files with the repo's own doc linters and link checks.
Done when every finding is fixed or judged a false alarm.

# Output Shape

OPEN_WITH_READER_AND_TASK — Open each tutorial, guide, and runbook with the reader, the task, and the prerequisites in its first three lines.
Readers arrive from search and decide at once whether a page is for them. Example: "Use this guide to back up a workspace before you upgrade. You need a workspace created with `tally init`." The cost is a narrower audience for the page.

LEAD_WITH_ANSWER — Lead each page and each section with the answer, the result, or the first step.
Eye-tracking shows readers read the top and the first words of each block, and skip the rest when nothing there matches. Context placed first is read instead of the answer. The cost is a less narrative style.

PUT_WARNING_BEFORE_STEP — Put each warning before the step it guards.
Readers act as they read, so a data-loss note after the last step is read after the data is gone. Developers rate incorrect or dangerous content as a blocker even when it is rare. Following this costs nothing.

NUMBER_SEQUENTIAL_STEPS — Number sequential actions by default, with one action per step.
"First open a terminal, then run, then check, and finally report" in one sentence hides steps and loses the reader's place. Following this costs nothing.

STATE_CONDITION_FIRST — State the condition before the instruction it controls.
"Restart the server if you changed the list" is acted on before the "if" is read. Write "If you changed the list, restart the server." Following this costs nothing.

NAME_HEADINGS_BY_TOPIC — Name each heading by its topic or task, never with a generic label such as Notes, Other, Details, or Miscellaneous.
Headings that name content let readers jump from heading to heading, the fastest way to scan. A generic heading hides its section from that scan. The cost is longer headings.

WRITE_SHORT_PLAIN_SENTENCES — Write sentences of 25 words or fewer in common words by default.
Many readers read English as a second language, and ambiguity was the problem developers most often wanted fixed first. Over 30 words, split the sentence. The cost is more sentences and some repeated words.

EXPLAIN_TERMS_AT_FIRST_USE — Explain each specialist term or acronym in plain words where it first appears.
"The report command is idempotent" stops a reader who does not know the word; "running it twice changes nothing" does not. No linter studied caught an unexplained word. The cost is a few words per term.

USE_ONE_TERM_PER_THING — Use one name for each thing across all pages.
Calling one thing a workspace and then a project makes readers look for two things. Developers rated inconsistent docs as a blocker, and no linter studied caught it. The cost is keeping a short term list.

MAKE_EXAMPLES_RUNNABLE — Make each code example complete enough to run as written, with its imports and setup.
Only 26.3% of about 2.16 million code examples in NPM package docs compiled without errors. Fragments that cannot run, such as one JSON field, must say they are fragments. The cost is longer examples.

EXPLAIN_EACH_EXAMPLE — Explain in one sentence what each example shows and what to change to adapt it.
Developers rated examples without an explanation as a blocker. A bare block cannot be adapted to the reader's case. The cost is two short sentences per example.

DROP_FILLER_PHRASES — Drop filler and hype such as "it is important to note", "comprehensive guide", "let's dive in", and "seamless".
On the Kubernetes docs, "it is important to note" appeared 11 times, and each sentence works without it. Agent-written openers use these phrases often, and no stock linter rule matched them. Following this costs nothing.

DROP_EASY_WORDS — Drop words that judge a task easy, such as simply, easily, and obviously, where they describe the reader's work.
They blame readers who struggle. A word-list check was mostly wrong on real docs, such as "just a subset", so judge each use by hand. The cost is a manual pass.

RESERVE_EMPHASIS_FOR_WARNINGS — Reserve bold, warning boxes, and emoji by default for what the reader must not miss.
Bold on every line and emoji in headings mark nothing, so the real warning blends in. Bold that marks a defined term is fine. The cost is a plainer page.

REMOVE_PLACEHOLDERS — Remove TODO, TBD, FIXME, and lorem ipsum text before publishing, including from hidden comment blocks.
The Kubernetes docs still held hidden TODOs such as "Uncomment this for 1.6", years after that release. A placeholder in published text tells the reader the page is not finished. Following this costs nothing.

# Validation

OPEN_WITH_READER_AND_TASK_CHECK — Confirm the first three lines of each tutorial, guide, and runbook name the reader's task and its prerequisites.
SPLIT_PAGE_BY_DOCUMENT_TYPE_CHECK — Confirm each page answers only one of: teach me, how do I, what is, or why.
VERIFY_CHECK — Confirm every command, flag, path, name, and example in the change was run or found in the code at the current release.
LINK_INSTEAD_OF_COPYING_CHECK — Confirm each fact a changed file repeats from another page is replaced by a link or is a short fact that a check keeps equal.
WRITE_SHORT_PLAIN_SENTENCES_CHECK — Confirm each long sentence in the changed files is split or is a list or table that only looks long.
PUT_WARNING_BEFORE_STEP_CHECK — Confirm no warning, caution, or data-loss note appears after the step it guards.
STATE_CONDITION_FIRST_CHECK — Confirm no step ends with an if, when, or unless clause that decides whether to do the step.
UPDATE_DOCS_IN_SAME_CHANGE_CHECK — Confirm every behaviour change in the diff has its documentation change in the same diff.
WRITE_COMMENTS_FOR_INTENT_CHECK — Confirm no new code comment restates the line below it.
WRITE_AGENT_FILES_FOR_GAPS_CHECK — Confirm each line of a changed agent instruction file states something the code, README, and docs do not.
KEEP_AGENT_FILES_SHORT_CHECK — Run `wc -l` on each changed CLAUDE.md or AGENTS.md and confirm it is under 200 lines.
FAIL_BUILD_ON_PRECISE_CHECKS_CHECK — Confirm the CI documentation gate fails on no readability score, no stock prose style, and no style-only markdownlint rule.
BUILD_CHECK — Run the repo's validate and lint commands and confirm they report no problem for the changed docs.
