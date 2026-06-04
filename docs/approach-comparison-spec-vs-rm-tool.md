# Approach Comparison — Spec-IS-Requirement vs Requirements Management Tool + Mapping Matrix

## 1. What is being compared and why numbers are imperfect

**Approach A — Spec-IS-Requirement**: the `describe/context/it` title is the requirement;
`{ req: {...} }` carries metadata. Three layers: `constraints.js → examples.js → spec.js`.
Reports are generated from the specs. An external bug and task tracker (GitHub Issues, Linear,
Jira, or equivalent) is required to record defects; bug identifiers are referenced in spec files
via `req.bugs`.

**Approach B — Requirements Management Tool + Mapping Matrix**: requirements, test cases, bugs,
and tasks all live in a single consolidated platform (for example, Jira with Xray or Zephyr
Scale). Separate test case entities are linked to automation scripts through explicit mapping
records. The platform serves as requirements management tool, test management tool, bug tracker,
and task tracker simultaneously.

**Proxy metric used here:** *authored artifact mutations per maintenance event* — the number of
discrete files or records a person must open and save to complete a change. This is **not** a
standard industry metric. It is a proxy chosen because it is enumerable and unambiguous. It does
not measure person-hours, cognitive load, or risk. See §8 for what it leaves out.

## 2. Artifact model

### Shared node vocabulary

| Node                           | Meaning                                                                                                                                                                                                                     |
|--------------------------------|-----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| `Constraint`                   | Boundary value — `FIRSTNAME.MAX_LENGTH = 50`                                                                                                                                                                                |
| `Requirement`                  | The Given/When/Then statement                                                                                                                                                                                               |
| `Example`                      | Named test-data key — `firstname__OverMaxLength`                                                                                                                                                                            |
| `Test Case`                    | Record in a requirements management platform (Approach B only)                                                                                                                                                              |
| `Automation Script`            | The executable `it()` block                                                                                                                                                                                                 |
| `Mapping Link 1`               | Traceability record linking a Requirement to a Test Case in the platform (Approach B only) — stored as an issue link (e.g. Xray "Tests" link in Jira)                                                                       |
| `Mapping Link 2`               | Traceability record linking a Test Case to an Automation Script (Approach B only) — stored as a spec annotation (e.g. `@XrayTest(key="PROJ-123")`) or an entry in a repo config file (e.g. `xray.config.js`, `.testrailrc`) |
| `Bug Record`                   | Defect entry in an external bug and task tracker                                                                                                                                                                            |
| Per-requirement authored nodes | **3**                                                                                                                                                                                                                       | **6–7** (Requirement record, Test Case, Mapping Link 1, Mapping Link 2, Automation Script, Test Data, + Bug Record) |

### Approach A — nodes per requirement

```
Constraint ──► Example ──► it()
    └────────────────────► it()   (title interpolates the constraint value)
                            │
                            ├─ req.bugs ──► External Bug and Task Tracker
                            └─ generated ──► Report
```

**Per-requirement authored nodes: 3** (Constraint, Example, `it`-block). `Requirement`,
`Test Case`, and `Automation Script` collapse into the single `it()`.

**Required external tool:** 1 — an external bug and task tracker. `req.bugs` in specs holds the corresponding
identifiers.

**Shared infrastructure (not counted per requirement):**

| Artifact                                                                         | Maintenance trigger                                                   |
|----------------------------------------------------------------------------------|-----------------------------------------------------------------------|
| 11 custom ESLint rule files                                                      | Updated when `req` schema changes or new fields are added             |
| 3 app-structure JSON files (`modules.json`, `components.json`, `workflows.json`) | Updated on module or page rename — ESLint cannot auto-rename them     |
| `scripts/` (12 files including parallel runner and coverage scripts)             | Updated as the suite grows or continuous integration pipeline changes |
| `selectors.js` (global)                                                          | Updated on any user interface rename                                  |

**Known drift surfaces in Approach A:**

| Surface                             | Risk                                                                                  |
|-------------------------------------|---------------------------------------------------------------------------------------|
| `req.refs` URLs                     | Requirement management tool tickets close or migrate; no gate validates link liveness |
| `req.bugs` identifiers              | Bug tracker records may be closed or re-numbered; no automated check in the pipeline  |
| `modules.json` vs spec title prefix | Becomes stale after a rename; ESLint adds entries but does not rename them            |

### Approach B — nodes per requirement

```
Constraint (in requirement text) ──► Requirement record ──[Mapping Link 1]──► Test Case ──[Mapping Link 2]──► Automation Script ──► Test Data
        │                                                                                           ▲                    ▲
        └── duplicated ──────────────────────────────────────────────────────────────────► Constraint (in code)          │
                                                                                                                         │
                                                          Mapping Link 2 stored in repo config file (xray.config.js) ────┘

Requirement record ◄── Continuous Integration Result (pushed by reporter plugin)
Requirement record ─── Bug Record (linked within same platform)
```

**Per-requirement authored nodes: 6–7** (Requirement record, Test Case, Mapping Link 1, Mapping Link 2, Automation
Script, Test Data, and Bug Record when applicable). The constraint value lives in **two** places (requirement text and
code), with a third potential copy in test data fixtures.

**The two Mapping Links in practice:**

| Mapping Link                                   | What it is                                                                                 | Where it lives                                | Breaks when                                  |
|------------------------------------------------|--------------------------------------------------------------------------------------------|-----------------------------------------------|----------------------------------------------|
| Mapping Link 1 — Requirement → Test Case       | Jira "Tests" issue link (Xray), or Zephyr test coverage link                               | Inside the platform (Jira UI)                 | Test Case is archived or renamed             |
| Mapping Link 2 — Test Case → Automation Script | Spec annotation (`@XrayTest(key="PROJ-123")`) or entry in `xray.config.js` / `.testrailrc` | Repo config file committed to version control | Spec file is renamed or `it()` title changes |

**Required external tool:** 1 consolidated platform (Jira + Xray, or Zephyr Scale, or Polarion)
that covers requirements management, test management, bug tracking, and task tracking in a single
system. No separate tool is needed for each concern.

**Approach B** — the Cypress reporter plugin pushes results to the platform
automatically on every continuous integration run. No manual export or reconciliation is needed.

## 3. Maintenance lifecycle — mutations per event

`N` = number of tests sharing a constraint (example: N = 5).

| # | Event                                                                 | Approach A mutations                           | Approach A tooling                     | Approach B  mutations                                                                                                 | Approach B tooling                                               | Δ (B − A)             |
|---|-----------------------------------------------------------------------|------------------------------------------------|----------------------------------------|-----------------------------------------------------------------------------------------------------------------------|------------------------------------------------------------------|-----------------------|
| 1 | **New requirement** (new boundary case)                               | 2 (`examples.js` + `spec.js`)                  | version control                        | 6 (Requirement record, Test Case, Mapping Link 1, Mapping Link 2, Automation Script, Test Data)                       | consolidated platform + version control + continuous integration | **+4**                |
| 2 | **Requirement changed** (e.g. Then 400 → 422)                         | 1 (`spec.js` title + assertion)                | version control                        | 4 (Requirement text, Test Case steps, Automation Script, Mapping Link 1 re-verify)                                    | consolidated platform + version control                          | **+3**                |
| 3 | **Requirement removed**                                               | 2 (delete `it`-block + example key)            | version control                        | 5 (archive Requirement record, archive Test Case, drop Mapping Link 1, drop Mapping Link 2, delete Automation Script) | consolidated platform + version control                          | **+3**                |
| 4 | **Constraint value changed** (MAX_LENGTH 50 → 100, shared by N tests) | 1 (`constraints.js`)                           | version control                        | 1 + N (constraint file + N requirement record texts)                                                                  | consolidated platform + version control                          | **+N** (N=5 → **+5**) |
| 5 | **Bug discovered**                                                    | 2 (bug record in tracker + `req.bugs` in spec) | version control + external bug tracker | 3 (Bug record + link to Requirement + link to Test Case — all within one platform)                                    | consolidated platform                                            | **+1**                |
| 8 | **Coverage or gap report**                                            | 0 (`npm run req:coverage`)                     | command line                           | 0 (reporter plugin, auto-push)                                                                                        | continuous integration plugin                                    | **0**                 |
| 9 | **Audit or export**                                                   | 0 (`npm run req:extract:json`)                 | command line                           | 0 (reporter plugin, auto-push)                                                                                        | continuous integration plugin                                    | **0**                 |

**Arithmetic check (N = 5):**

|            | Sum of mutations (7 events) | Average per event |
|------------|-----------------------------|-------------------|
| Approach A | 2+1+2+1+2+0+0 = **8**       | **1.1**           |
| Approach B | 6+4+5+6+3+0+0 = **24**      | **3.4**           |

> **N-independent events only** (exclude event 4):
> Approach A = **1.0 avg** · Approach B = **3.0 avg**
>
> The advantage shrinks when N is small (fewer than 5) but never crosses over. The ratio grows
> linearly with N because only Approach B requires updating N requirement record texts when a
> shared constraint value changes.

## 4. Aggregate metrics

| Metric                            | Approach A                                    | Approach B                                                                    |
|-----------------------------------|-----------------------------------------------|-------------------------------------------------------------------------------|
| Per-requirement authored nodes    | **3**                                         | **5–6**                                                                       |
| Constraint single source of truth | **1** (`constraints.js`)                      | **2–3** (requirement text + code + fixture)                                   |
| External tools required           | **1** (external bug and task tracker)         | **1** (single consolidated platform for requirements, tests, bugs, and tasks) |
| Drift surfaces (per requirement)  | **2–3 (repo-local + external tracker links)** | **3+ (cross-system between code and platform)**                               |
| Coverage report cost              | 1 command line call, deterministic            | 1 automated push per continuous integration run                               |
| Refactor blast radius             | O(1) commit, ESLint-enforced                  | O(N) requirement records in platform + code                                   |
| Average mutations per event (N=5) | **≈ 1.1**                                     | **≈ 3.4**                                                                     |
| Initial tooling build cost        | Already built (11 ESLint rules, 12 scripts)   | Configuration + plugin install                                                |

> **Key observation on external tools:** both approaches now require exactly 1 external tool.
> The difference is what that tool does: Approach A uses it only for bug and task tracking
> (a narrow scope). Approach B uses its single consolidated platform for requirements management,
> test case management, bug tracking, task tracking, and continuous integration result reporting
> — a broader scope that brings both more capability and more configuration to maintain.

## 5. Where Approach B genuinely wins

1. **Single platform for all concerns** — Jira with Xray, or Zephyr Scale, can serve as task
   tracker, bug tracker, requirements management tool, and test management tool simultaneously.
   Product managers, business analysts, developers, and quality assurance engineers all work in
   one place with no system boundaries between concerns.
2. **Regulated domains** (FDA 21 CFR Part 11, SOX, DO-178C, ISO 26262) — an external system of
   record with e-signatures, immutable history, and role-based approval workflows is a compliance
   requirement. A version control log is rarely accepted by auditors without a validated system
   of record.
3. **Non-technical requirement authors** — product managers, business analysts, and clinical
   reviewers who cannot open pull requests. In Approach A every requirement change requires a
   developer commit.
4. **Multi-team or cross-repo programs** — one requirement spanning multiple services and
   repositories has no natural home in Approach A. A consolidated platform provides a single
   place to query status across all teams.
5. **Concurrent multi-role editing** — in Approach A, `spec.js` is simultaneously the
   requirement, test case, and automation script. When a business analyst and a developer
   edit it at the same time they get a merge conflict. In Approach B these touch separate
   records in the same platform and do not conflict.
6. **Formal sign-off workflows** — "approved by / verified by" with named users and timestamps
   surfaced to non-engineering stakeholders.
7. **Mixed manual and automated coverage** — manual test cases tracked alongside automation
   in one matrix.
8. **Customer-facing traceability deliverables** — contractual traceability matrices,
   certification packages, and request-for-proposal responses.

## 6. Hybrid option

Keep Approach A as the source of truth; push generated reports into the requirements management
platform read-only via a continuous integration pipeline.

```
spec.js  (single editable surface)
   │
   ├── npm run req:extract:json ──► continuous integration job
   │                                    └──► requirements platform (read-only mirror)
   │
   ├── req.refs: ['https://jira.example.com/browse/PROJ-123']  ← only manual link, points OUT
   ├── req.bugs: ['BUG-AUTH-042']  ← references external bug tracker identifier
   │
   └── npm run req:coverage:check ──► continuous integration gate (P1 ≥ 90 %)
```

| Property                                     | Hybrid value                                                                                      |
|----------------------------------------------|---------------------------------------------------------------------------------------------------|
| Editable surface                             | 1 (spec only)                                                                                     |
| Stakeholder visibility                       | Full platform dashboard                                                                           |
| Drift risk                                   | 2 surfaces (`req.refs` URLs and `req.bugs` identifiers going stale)                               |
| Extra mutations per event vs pure Approach A | +0–1 (continuous integration export step only; engineers never author in the platform)            |
| External tools required                      | 1 required (bug and task tracker) + 1 optional (requirements platform for stakeholder visibility) |

Recovers approximately 70–80% of Approach B's organisational visibility. Recommended when
engineers own authoring but product managers or stakeholders need dashboards.

## 7. Decision checklist

**Pick Approach A when:**

- [ ] Requirements are written by the same engineers who write the tests.
- [ ] No external regulator requires a validated system of record.
- [ ] Every requirement will be automated (no significant manual test coverage expected).
- [ ] High refactoring frequency; keeping drift low matters more than external visibility.

**Pick Approach B when:**

- [ ] A regulator mandates an external system of record (FDA, SOX, ISO).
- [ ] Non-engineers must author or approve requirements.
- [ ] The team benefits from managing requirements, bugs, tasks, and test cases in one platform.
- [ ] Significant manual test coverage must live next to automation.
- [ ] Cross-repo or cross-team requirement aggregation is a daily reality.
- [ ] Multiple roles (product manager, developer, quality assurance) edit artefacts simultaneously.
- [ ] Formal sign-off workflows with named approvers are required.

**Pick the Hybrid when:**

- [ ] Engineers own authoring but stakeholders need a dashboard.
- [ ] You want the option to graduate to full Approach B later without rewriting tests.
- [ ] Continuous integration infrastructure can reliably host the export job.

## 8. Assumptions & limitations

**What the mutation-count metric does NOT capture:**

- **Person-hours** — creating a bug record in a tracker may take 30 seconds or 30 minutes
  depending on required fields and approval chains. Mutation count and effort are not the same.
- **Platform consolidation value** — Approach B's single consolidated platform eliminates
  context-switching between systems for non-engineering roles. This benefit is not captured
  by the mutation-count metric.
- **Regulatory acceptance** — no claim is made here that a version control log and continuous
  integration reports satisfy any specific regulatory framework. That determination is
  organisation- and domain-specific.

**Modelling conventions:**

- Approach B is modelled as Integrated only (Xray / Zephyr Scale / TestRail with Cypress plugin).
- `N` = number of tests sharing a constraint; N=5 is used throughout. Real values can be
  obtained via `npm run req:extract:json` grouped by constraint identifier.
- Per-requirement node counts exclude shared infrastructure for both approaches (see §2).
- Runtime performance, flakiness, and test execution time are out of scope.

## 9. Focused comparison — Approach A vs Approach B

### 9.1 Cost — separated from complexity

#### Recurring costs

| Cost item                     | Approach A                                            | Approach B                                                                                                                  |
|-------------------------------|-------------------------------------------------------|-----------------------------------------------------------------------------------------------------------------------------|
| Software-as-a-Service license | Bug and task tracker only — **low cost or free tier** | **$X per user per month** for the consolidated platform (Jira, TestRail, Xray, etc.)                                        |
| Plugin version upkeep         | None                                                  | Reporter plugin must remain compatible with Cypress and Node.js versions; upgrades can break the pipeline                   |
| Platform administration       | Minimal (bug tracker only)                            | Role and permission administration; schema migrations; plan and suite restructuring when tests are refactored               |
| Vendor dependency             | Minimal                                               | API deprecation, pricing changes, and service level agreement downtime can all block continuous integration result delivery |

#### Infrastructure integration — what "plugin install" means for Approach B

When Approach B's reporter calls the platform API on every continuous integration
run, the following components are in the dependency chain:

```
Cypress test run
  └── reporter plugin
        ├── reads: xray.config.js / .testrailrc
        │         (repo-committed config; must stay in sync with platform project structure)
        ├── authenticates: API key
        │         (continuous integration secret; expires and must be rotated)
        ├── calls: platform external API
        │         (network dependency; subject to rate limits and downtime)
        └── maps: spec file path → platform test case identifier
                  (must be maintained manually or via a fixture file)
```

Each component is a **new failure surface independent of test quality**:

| Failure mode                                                     | Effect on pipeline                             | Are test results affected?                       |
|------------------------------------------------------------------|------------------------------------------------|--------------------------------------------------|
| Platform API timeout or downtime                                 | Pipeline step fails or hangs                   | No — tests passed but results were not delivered |
| Expired API token                                                | Pipeline step fails                            | No                                               |
| Reporter plugin incompatible with new Node.js or Cypress version | Pipeline step fails or produces corrupt output | No                                               |
| Test case identifier mapping stale (test was renamed)            | Results posted to wrong record silently        | No — but traceability breaks silently            |
| Platform schema changed                                          | Results rejected by the platform API           | No                                               |

Approach A's continuous integration export (`npm run req:extract:json`) is a
**read-only, offline operation** — it reads spec files and writes a JSON artifact. It makes no
external API calls, requires no authentication tokens, and cannot be broken by platform changes.
Its only failure mode is a broken spec file, which is always also a test failure.

**Summary:** Approach A has one failure-mode class and no ongoing infrastructure
obligations beyond a bug tracker. Approach B adds a live external API dependency
to every continuous integration run with five independent failure modes that can block result
delivery without any test-quality issue.

### 9.2 Complexity — separated from cost

| Complexity dimension                        | Approach A                                                                                                                | Approach B                                                                                                                          |
|---------------------------------------------|---------------------------------------------------------------------------------------------------------------------------|-------------------------------------------------------------------------------------------------------------------------------------|
| **Nature**                                  | Front-loaded, one-time per engineer                                                                                       | Distributed, multi-role, multi-tool, ongoing                                                                                        |
| **Learning curve**                          | Understanding the 3-layer model + 11 ESLint rules + naming conventions + bug tracker workflow                             | Platform user interface + mapping link model + continuous integration plugin configuration + separate account per role              |
| **Documentation before first contribution** | Approximately 5 files (AGENTS.md, requirements-examples-approach, naming-conventions, eslint-custom-rules, this document) | Platform docs + plugin docs + internal process docs + continuous integration integration guide                                      |
| **Who can author requirements**             | Engineers only (version control commit required)                                                                          | Any role with platform access                                                                                                       |
| **Error feedback loop**                     | Immediate — ESLint blocks the commit with an exact rule violation                                                         | Deferred — broken mapping links and stale records surface at report time; integration failures are silent on test quality           |
| **Independent failure modes**               | **1** (broken spec file — always also a test failure)                                                                     | **5** (API timeout, expired token, plugin incompatibility, stale identifier mapping, schema change — all unrelated to test results) |
| **On-call scope when pipeline breaks**      | Codebase only                                                                                                             | Codebase + reporter plugin + platform API + secrets management + platform project configuration                                     |
| **Ongoing maintenance complexity**          | Low — enforced by tooling; no manual synchronisation between systems                                                      | Medium to high — mapping links, plugin versions, token rotation, and platform schema all require periodic review                    |
| **Tool coupling**                           | Repo-local; version control system-agnostic                                                                               | Coupled to platform vendor; migration requires re-mapping all test case records                                                     |

**Key distinction:** Approach A's complexity is a **one-time learning investment** per
engineer, after which ESLint guides every action mechanically. Approach B's
complexity is **distributed, ongoing, and architectural** — each integration point can fail
independently and requires a different person or process to resolve. However, Approach B's
single consolidated platform eliminates role-based context-switching that Approach A cannot
address.

### 9.3 Constraint propagation — the compounding advantage

The single largest measurable gap is event 4: a constraint value change.

| Scenario                                               | Approach A                                                                 | Approach B                                                                                                                   |
|--------------------------------------------------------|----------------------------------------------------------------------------|------------------------------------------------------------------------------------------------------------------------------|
| Change `MAX_LENGTH` from 50 to 100 in `constraints.js` | **1 mutation** — all N spec titles interpolate the new value automatically | **1 + N mutations** — update the constraint file AND rewrite the literal value in N requirement record texts in the platform |
| Verify nothing is out of sync                          | `npm run lint` (zero manual steps)                                         | Re-read N requirement records in the platform; no automated completeness gate                                                |
| Risk of partial update                                 | None — single source, enforced by linter                                   | High — N separate records; some may be missed silently                                                                       |

With N=5: Approach A costs 1 mutation; Approach B costs 6. With N=20, Approach A is still 1;
Approach B is 21. This gap compounds across every shared constraint in the codebase.

### 9.4 Summary

|                                        | Approach A                                  | Approach B                                                                           |
|----------------------------------------|---------------------------------------------|--------------------------------------------------------------------------------------|
| Average mutations per event (N=5)      | **1.1**                                     | **3.4**                                                                              |
| External tools required                | **1** (bug and task tracker — narrow scope) | **1** (consolidated platform — broad scope, covers requirements, tests, bugs, tasks) |
| Software-as-a-Service license cost     | Low or free (bug tracker only)              | Recurring per seat (full platform)                                                   |
| Tool coupling                          | None (repo-local)                           | Vendor-locked to platform                                                            |
| Constraint drift risk                  | Zero (single source of truth)               | Proportional to N (grows with test suite)                                            |
| Independent failure modes in pipeline  | **1** (always also a test failure)          | **5** (all independent of test quality)                                              |
| On-call scope when pipeline breaks     | Codebase only                               | Codebase + plugin + platform API + secrets + platform configuration                  |
| Who can author requirements            | Engineers                                   | Any role                                                                             |
| Concurrent multi-role editing conflict | Merge conflict risk on `spec.js`            | No conflict (separate platform records)                                              |
| Complexity type                        | One-time learning curve                     | Ongoing, multi-layer, multi-role process                                             |
| Best fit                               | Engineering-owned, high-refactor teams      | Multi-role organisations, regulated domains, mixed manual and automated coverage     |