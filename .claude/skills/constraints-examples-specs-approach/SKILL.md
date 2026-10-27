---
name: constraints-examples-specs-approach
description: Use when turning a requirement into Cypress tests through the Constraints → Examples → Specs layers, adding or changing a boundary, named example, or spec so values trace end to end, or producing the HTML sign-off report from a run.
---

# Intent

Produce tests where each requirement is an executable spec whose asserted values trace unbroken from a constraint through a named example, and whose run feeds the HTML sign-off report.
When entries conflict or none applies, choose the option that keeps one owner per value and a visible trace.

# Reasoning Principles

TREAT_SPEC_AS_REQUIREMENT — Treat the `describe`, `context`, and `it` titles of a spec as the requirement of record.
No separate requirement document or mapping matrix exists, so a vague title leaves the requirement vague. The cost is title wording that must state a business outcome, not mechanics.

KEEP_ONE_OWNER_PER_VALUE — Keep each boundary value in a constraint, each named test-data instance in an example, and each requirement in a spec.
A second copy drifts, and no reader knows which one is canonical. The cost is an import in every consumer.

TRACE_EVERY_ASSERTED_VALUE — Trace every asserted value from constraint, through example field, into spec title and assertion.
A literal that appears mid-chain is an orphan that no requirement backs and no boundary governs.

IMPORT_BY_NAME — Import constraints and examples by name from their owning file, never through globals.
The import path then shows the owning module, page, or spec, as in `import { PRICE } from '../../constants/api/rb.booking.api.constraints';`.

GIVE_EACH_SPEC_OWN_EXAMPLES — Give each spec its own examples file, and never import another spec's examples.
Cross-spec imports couple unrelated files and break isolation. The cost is a spec that creates its own instance through an API command.

COMPOSE_CASES_IN_EXAMPLES — Compose every case and every request in the examples file, and let the spec reference instances without rebuilding them.
Setup and assertion data drift apart in specs that rebuild them. The cost is an example edit for every new case.

MAP_INSTANCE_TO_CONTEXT — Map each named example instance to one `context` block.
The tested case and the stated requirement then always agree. The cost is a context per case, even for small cases.

KEEP_MODULE_DATA_WITH_MODULE — Keep each module's constraints and examples with that module, and let a multi-module spec import from all of them.
Colocating another module's data gives that data two owners.

MOVE_ORPHAN_LITERALS — Move a literal found in a spec to its owning constraint or example.
ESLint does not enforce `no-magic-numbers`, so a clean lint run proves nothing about the trace.

NAME_RISKS_BEFORE_ASSERTING — Name the false-confidence risks before writing assertions: untraced literals, shadowed examples, rebuilt payloads, order dependence, and misleading titles.
Treat each match as a defect. Each can pass green while the spec no longer verifies its title.

# Method

FLOW: CONSTRAIN → COMPOSE → SPECIFY → RUN → REPORT

CONSTRAIN — Done when every boundary, format, enum, or required-field list the requirement tests exists once in `cypress/constants/{api,ui}/`.
Follow `.claude/rules/constraints.md`. Composing examples first invents boundary values the constraint never owns.

COMPOSE — Done when every case and request the spec needs is a named instance in its examples file under `cypress/integration-examples/` or `cypress/e2e-examples/`.
Follow `.claude/rules/examples.md`. Writing the spec first scatters payloads across contexts.

SPECIFY — Done when every spec title states the requirement and every assertion reads an example field or a constraint.
Follow `.claude/rules/api-specs.md`, `.claude/rules/ui-specs.md`, or `.claude/rules/e2e-specs.md` for the spec path, and `.claude/rules/commands.md` for any command the spec adds.

RUN — Done when the specs have run and their mochawesome JSON sits in `cypress/reports/separate-reports/`.
A report built without results lists every check as `Not Executed`.

REPORT — Done when `npm run report:signoff` has written `reports/signoff-report.html` and every check that did not pass is listed for manual sign-off.
↺ SPECIFY when a check maps to the wrong spec title or is missing.

# Output Shape

PRODUCE_ONE_ARTIFACT_PER_LAYER — Produce the artifacts of each layer at the paths below, in the chain direction shown.
A value placed in the wrong layer breaks the trace for every consumer.

```
constraints  cypress/constants/{api,ui}/*.{api,ui}.constraints.js     boundary values
examples     cypress/integration-examples/{api,ui}/, cypress/e2e-examples/ui/   named instances
specs        cypress/integration/{api,ui}/, cypress/e2e/ui/             live requirements

PRICE.MIN = 1                                            constraint
  → validBookings.allFieldsWithMinimalPrice.totalprice   example field
    → context/it titles + expect(...).to.eq(PRICE.MIN)   spec
```

DELIVER_SPECS_AS_REQUIREMENTS — Deliver specs whose titles and `req` metadata read as the full requirement list.
The sign-off and coverage reports are built from those titles alone, so a requirement kept elsewhere is missing from both.

DELIVER_HTML_SIGNOFF_REPORT — Deliver the sign-off report as the self-contained `reports/signoff-report.html`.
It is the only output: a reader gets a PDF on demand from its Print / Save PDF button. In CI it is the `signoff-report-<run_number>-<run_attempt>` artifact when the workflow's `generate_signoff_report` input is set.

# Validation

TRACE_CHECK — Verify every asserted value resolves constraint → example field → spec title → assertion end to end.
PLACEMENT_CHECK — Confirm no boundary literal sits in an example and no payload is rebuilt in a spec.
SINGLE_OWNER_CHECK — Verify no value is defined in more than one layer.
IMPORT_CHECK — Confirm every consumer uses a direct named import and none reads a constraint or example through a global.
CONSUMER_CHECK — Verify every exported example is used by its spec and every constraint has a consumer or a named shared-domain purpose.
RULE_CHECK — Confirm each constraint, example, and spec file passes the `# Validation` checks of its `.claude/rules/` file.
REPORT_CHECK — Run `npm run report:signoff` and confirm `reports/signoff-report.html` lists every executed spec.
