# Requirements Management: Constraint-Example-Spec vs. a Traditional RM Tool

Two ways to keep requirements, test cases, and bugs in sync. This picks between them.

- **CES — the constraint-example-spec approach** this project uses. The executable spec *is*
  the requirement of record. A value lives in one layer and every other layer imports it:
  boundary in a constraint, named data in an example, requirement in a spec title + assertion.
  Bugs live in an issue tracker and are referenced from the spec via `req.bugs`.
  See [Constraints → Examples → Specs](constraints-examples-specs-approach.md).
- **RM — a traditional requirements-management tool** (Jira + Xray, Zephyr, DOORS, Polarion).
  Requirements, test cases, and defects are separate records linked by a traceability matrix.
  The automated test is a *further* record, mapped back to the test-case record by a sync plugin.
  One platform holds everything; humans keep the links current.

The rest of this page compares them on the dimensions where they actually diverge: where a fact
lives, how traceability is maintained, edits per change, drift, cost/risk, and reporting.

## The root difference: where a fact lives

Every downstream difference follows from one choice — **single owner vs. copies**.

- **CES**: each fact has exactly one home. A booking's minimum price is a constant in a
  constraint file; the example composes its payload from that constant; the spec title and
  assertion read the same constant. One value, three referencing layers, zero copies.
- **RM**: the same fact is restated in the requirement record, again in the test-case steps,
  again in the automated test, and the matrix records that they *should* agree. Four copies plus
  a link asserting they match.

CES trades away a shared, non-engineer-editable platform to buy this: a fact cannot disagree
with itself because it exists once.

## Traceability: structural vs. curated

This is the sharpest divide, and the reason CES exists.

- **RM — curated.** Traceability is a maintained artefact: a matrix of requirement IDs ↔
  test-case IDs ↔ defect IDs. It is only as true as the last person to update it. When a
  requirement changes but the matrix does not, coverage *looks* complete while a link is stale —
  a silent, invisible gap.
- **CES — structural.** Traceability is a side effect of how the code is wired. A boundary
  value flows constraint → example → spec by `import`; the chain is the dependency graph, not a
  separate document. A literal that appears mid-chain with no owning layer is an *orphan* — and
  the [custom ESLint rules](eslint-custom-rules.md) and the
  [CES traceability model](constraints-examples-specs-approach.md) flag
  it. You cannot ship a broken link without the build noticing.

The practical consequence: in RM, "is every requirement tested?" is answered by trusting the
matrix. In CES, it is answered by the compiler and linter — a requirement with no backing
example/assertion does not resolve.

## The core trade-off: edits per change

When something changes, how many places must a person open and save?

Each count is one distinct place a person opens and saves — create, edit, or delete a file or
record. System-generated output counts 0. The gap comes from where a fact lives: in CES each
fact has one home, so one save covers it; in RM the same fact is duplicated across separate
linked records, so each copy must be touched and re-synced.

Counts are **CES** vs **RM**:

| Change                                      | CES      | RM       |
|---------------------------------------------|----------|----------|
| Add a requirement                           | 2        | 6        |
| Change a requirement (e.g. expected result) | 1        | 4        |
| Remove a requirement                        | 2        | 5        |
| Change one shared value used by N tests     | 1        | 1 + N    |
| Log a bug                                   | 2        | 3        |
| Coverage report / audit                     | 0 (auto) | 0 (auto) |

**Average per change: CES ≈ 1, RM ≈ 3.**

The gap grows with the suite: change a limit shared by 20 tests and CES needs 1 edit (the
constraint), RM needs 21. In CES that value has one home and every test reads from it; in RM it
is copied into each test-case record.

### How each row is counted

- **Add a requirement** — CES: the spec (title + assertion) + its constraint/example data. RM:
  requirement record + test-case record + their mapping link + automated test code + code-to-test-case
  link + placement in a plan or cycle.
- **Change a requirement** — CES: edit the one spec in place (or the one constraint it reads). RM:
  requirement record + test-case steps + automated test code + re-sync so the mapping and last
  result stay consistent.
- **Remove a requirement** — CES: delete the spec + drop its now-unused constraint/example data.
  RM: deprecate the requirement record + test-case record + mapping link + automated test code +
  execution history.
- **Change one shared value** — CES: change the constraint constant once; all examples and specs
  read from it. RM: update the definition plus every test-case record it was copied into, hence
  `1 + N`.
- **Log a bug** — CES: create the issue + reference it from the spec via `req.bugs`. RM: defect
  record + link to test case + link to requirement.
- **Coverage report / audit** — both derive from existing records automatically, so neither needs
  a manual save. In CES the report is extracted from spec titles + `req` metadata
  (`npm run req:extract`); in RM it is generated by the platform.

Counts model drift risk and coordination cost, not time or effort; exact RM counts vary ±1 with
the platform and its sync plugin. See [What the numbers leave out](#what-the-numbers-leave-out).

## Drift: why the copies diverge

Drift is a copy disagreeing with the fact it was copied from. It is the failure mode the two
approaches handle most differently.

- **RM** stores the same fact in several records and relies on discipline to keep them equal.
  Every change is an opportunity for one copy to be updated and the others missed. The matrix
  still shows a link, so the drift is invisible until someone reads both records side by side.
- **CES** has nothing to drift *to*: a fact exists once and is imported, so a change is applied
  at the source and observed everywhere. The only "drift" possible is an orphan literal, which
  the linter rejects. Drift risk is structurally bounded, not managed by process.

## Cost and risk

- **Licence cost** — CES: low or free (issue tracker only); RM: paid per seat.
- **Who can author requirements** — CES: engineers, in code; RM: anyone with platform access,
  including non-engineers.
- **Requirement is executable** — CES: yes — the spec runs, so a requirement that disagrees with
  the system fails the build; RM: no — requirement prose is inert and can silently diverge from
  the code that implements it.
- **Ways the pipeline can break** — CES: 1 (a broken test); RM: 5 (API down, expired token,
  plugin/version, stale link, schema change).
- **Vendor lock-in** — CES: none (plain files in git); RM: tied to the platform and its export
  format.

RM adds a live connection to an outside service on every test run. When that connection fails,
tests still pass but results may not arrive — a failure unrelated to test quality. CES has no
such dependency: results are a local artefact of the run.

## Reporting requirements

Both can produce a requirements report; they differ in where the report's truth lives.

- **CES** extracts the report *from the tests themselves* — titles form the Given/When/Then and
  `req` metadata carries priority, story refs, and bugs. `npm run req:extract` /
  `req:extract:md` / `req:coverage` derive an always-current view because the source and the
  report are the same artefact.
- **RM** authors the report *in the platform*, from records that a human keeps aligned with the
  tests. The dashboard is richer and non-engineer-friendly, but it is a second representation
  that can lag the code.

## When each wins

**Choose CES when:**

- Engineers write both the requirements and the tests.
- No regulator demands an official external system of record.
- Requirements change often and you want drift kept structurally low.
- Traceability must be verifiable by the build, not trusted from a matrix.

**Choose RM when:**

- A regulator requires a validated system of record (FDA, SOX, ISO).
- Non-engineers must write or approve requirements.
- Manual test cases must sit next to automated ones.
- One requirement spans several teams or repositories.
- Formal sign-off with named approvers is required.

## Hybrid

Keep CES as the source of truth; auto-publish read-only extracts (`req:extract`) into the
platform for dashboards and sign-off. Engineers still edit only the code; the platform receives
a generated, never hand-edited view. This gives most of RM's visibility and audit surface at
CES's low edit cost — at the price of one more generated integration to keep running.

## What the numbers leave out

"Edits per change" counts places to save, not time or effort. It ignores how long each edit
takes, the value of one shared platform for non-engineers, the maturity of a platform's
sign-off and audit tooling, and whether a given regulator accepts a code-and-git history as a
system of record. Those depend on your organisation.
