# Sign-off report

Script: `scripts/generate-signoff-report.js` (template: `scripts/report-template/`)

Turns executable requirements and the latest Cypress results into a branded manual-testing checklist. The output is
`reports/signoff-report.html` (self-contained: CSS, logo and screenshots are inlined). The report is HTML only. A PDF is produced on demand from the browser with the report's **Print / Save PDF** button.
The report is optional; in CI it is only built when the `generate_signoff_report` input is enabled.

## How it works

1. **Static parse** — every `cypress/**/*.spec.js` is parsed with espree (same AST approach as
   [coverage gap analysis](coverage-gap-analysis.md)). Each `describe` / `context` / `it` contributes its title path,
   its `.skip` state (inherited by children; an `it` without a body counts as skipped) and its `{ req: { ... } }`
   config object (inline, or a `const` object passed by name).
2. **Runtime results** — mochawesome JSON from `cypress/reports/separate-reports/` (override with `--reports-dir`). When re-runs
   leave several reports for the same spec files, only the newest one (by `stats.start`) is used.
3. **Join** — static checks and runtime tests are matched on spec file + describe/context titles + it title. A runtime
   `passed` / `failed` / `pending` state wins; a check that never ran (no runtime result, or a failed hook stopped it)
   is shown as `Not Executed`, with the reason (hook failed / no result recorded) on hover. Template-literal titles (`${...}`) match the runtime
   title they evaluate to; a runtime test that matches no static check, or more than one, is listed on its own.
   A check's `refs`, `bugs` and `preconditions` are combined with those of its enclosing blocks; other `req` fields of
   an inner block override the outer ones. A describe/context's own `req` is shown on its heading.
4. **Scope** — when reports exist, only the executed spec files are included; with no reports every spec is listed as
   a blank checklist.
5. **Metadata** — branch, commit and build come from the CI variables used by `collect-test-results.js` (Azure DevOps,
   GitHub Actions, ...). `TARGET_ENV` and `BROWSER` fill the environment and platform.

## Report sections

- **Summary** — application, repository, branch, commit SHA, build, environment, platform, execution date/time. All times are shown as
  `YYYY-MM-DD HH:mm:ss UTC`.
- **Coverage Overview** — specs, checks, passed / failed / skipped / not executed, automation coverage (passed ÷ all
  checks) and manual validation (everything not passed ÷ all checks).
- **Prioritised Spec List** — failed specs first, then by checks needing manual validation (descending), then by
  priority `P1 > P2 > P3`. A spec's priority is the highest `req.p` on any of its blocks; omitted `p` is `P2`. The
  Refs / Bugs column lists the spec's `req.refs` and `req.bugs` (bugs in red); URLs show their last segment (the Jira
  key) and link to the full URL.
- **Failed Tests Detail** — file, title path, error message, stack trace, screenshot(s), environment / browser,
  `req.refs` / `req.bugs` (merged from enclosing blocks) and timestamp. Screenshots are matched from `cypress/reports/screenshots`
  (override with `--screenshots-dir`) by spec folder and the Cypress `<suite> -- <test> (failed).png` name (the `NN.` capture-order prefix is ignored).
- **Specification Details** — per spec, a console-like check list with a pill per check with its automated result
  (`Passed`, `Failed`, `Skipped`, `Not Executed`; hover `Not Executed` for why). Each describe/context title appears once as an indented heading over its checks. Every
  failed, skipped or not executed check has a manual result box (blank = not checked, green tick = passed, red cross = failed), followed by a notes field and a sign-off block (tested by, date,
  signature).

## Interactive HTML

The HTML report is a working checklist. Its **Print / Save PDF** button prints it or saves it as a PDF.

- Clicking a manual result box cycles not checked → passed → failed; a failed row is highlighted red. Notes and
  sign-off fields are editable. Entries are saved in the browser's `localStorage` for that
  report file until **Clear entries** is used.
- Progress counters show manual checks completed (passed + failed) per spec and across all specs, and how many
  failed manually; a spec turns green when all its manual checks passed and red when any failed.
- **Show** filters checks (and hides specs / contexts with no match): all, failed / skipped / not executed automated result,
  pending manual check, failed manually. **Hide manually passed** hides ticked checks. The toolbar also expands or collapses
  specs, and prints. **Print / Save PDF** keeps the filled-in values, so a completed checklist can be archived as PDF.

## Usage

```bash
# After a local run (reads cypress/reports/separate-reports, writes reports/signoff-report.html)
npm run report:signoff

# Point at a downloaded cypress-results-<run_number> artifact and add run context
TARGET_ENV=qa BROWSER=chrome npm run report:signoff -- \
  --reports-dir ./cypress-results/reports/separate-reports \
  --screenshots-dir ./cypress-results/reports/screenshots \
  --output-dir ./reports
```

## CI integration

`.github/workflows/weekly-cypress-tests.yml` builds the report when it is started manually with the
`generate_signoff_report` input (default `false`; scheduled runs skip it). After the tests and the "Register flaky
tests" step, the `cypress-tests` job, even when tests fail:

1. sets up Node.js and runs `npm ci` (with `CYPRESS_INSTALL_BINARY=0`; only the spec parser is needed);
2. runs `npm run report:signoff` against `cypress/reports/separate-reports` and `cypress/reports/screenshots`, the
   folders the Docker run mounts back to the runner, with `TARGET_ENV` and `BROWSER` taken from the workflow inputs;
3. uploads `reports/signoff-report.html` as the `signoff-report-<run_number>-<run_attempt>` artifact.

Set the optional repository variables `APP_NAME` and `APP_DESCRIPTION` to name the application in the report header;
without them the report uses generic names.

For another CI system, run the same command after the Cypress step with an "always run" condition, point
`--reports-dir` / `--screenshots-dir` at the folders that hold the run's mochawesome JSON and screenshots, and publish
`reports/signoff-report.html`. Branch, commit and build are read from the CI variables listed under
[How it works](#how-it-works).

## Branding

`scripts/report-template/` holds the look of the report: `logo.png`, `tokens.css` (colour tokens and typography),
`report.css` (layout, print rules) and `render.js` (HTML sections), `interactive.js` (browser behaviour of the HTML report). Change tokens there rather than in the script.

## Troubleshooting

- **All checks are `Not Executed`** — no mochawesome JSON found. Check `--reports-dir`; the script warns when the folder is
  missing.
- **Failure has no screenshot** — Cypress truncates long screenshot names and only captures on failure; the report
  shows "No screenshot captured." when nothing matches.

## Related

- [Flaky test analysis](flaky-test-analysis.md) — CI result collection and the metadata helpers reused here
- [Coverage gap analysis](coverage-gap-analysis.md) — structural coverage analysis
