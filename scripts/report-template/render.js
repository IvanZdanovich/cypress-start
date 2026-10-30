/**
 * Renders the sign-off report model into a self-contained, branded HTML page.
 *
 * The page inlines `tokens.css`, `report.css`, `interactive.js` and `logo.png`, so the HTML
 * artifact opens offline without loading anything else; its Print / Save PDF button gives a PDF on demand.
 * In a browser the manual results, notes and sign-off fields are editable and kept in localStorage;
 * the filters are plain CSS, so they also work where scripts are blocked.
 */
const fs = require('fs');
const path = require('path');

const STATUS_LABELS = { passed: 'Passed', failed: 'Failed', skipped: 'Skipped', notExecuted: 'Not Executed' };
// Toolbar filters: id → [label, selector matched by the checks to keep visible].
const FILTERS = {
  'auto-failed': ['Failed (automated)', '[data-status="failed"]'],
  'auto-skipped': ['Skipped (automated)', '[data-status="skipped"]'],
  'auto-not-executed': ['Not Executed (automated)', '[data-status="notExecuted"]'],
  'manual-pending': ['Pending manual check', '.needs-manual:not([data-manual])'],
  'manual-failed': ['Failed manually', '[data-manual="fail"]'],
};

function escapeHtml(value) {
  return String(value ?? '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}

/** Formats an ISO timestamp (or Date) as `YYYY-MM-DD HH:mm:ss UTC`; unparsable values pass through. */
function formatTimestamp(value) {
  if (!value) return '';
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return String(value);
  return `${date.toISOString().slice(0, 19).replace('T', ' ')} UTC`;
}

function badge(text, className) {
  return `<span class="badge ${className}">${escapeHtml(text)}</span>`;
}

function statusBadge(status) {
  return badge(STATUS_LABELS[status] || status, `status-${status}`);
}

function priorityBadge(priority) {
  return badge(priority, `priority-${priority}`);
}

function needsManual(status) {
  return status !== 'passed';
}

function reqSummary(req) {
  if (!req) return '';
  const parts = [];
  if (req.refs?.length) parts.push(`refs: ${req.refs.join(', ')}`);
  if (req.bugs?.length) parts.push(`bugs: ${req.bugs.join(', ')}`);
  if (req.preconditions?.length) parts.push(`preconditions: ${req.preconditions.join('; ')}`);
  if (req.note) parts.push(`note: ${req.note}`);
  return parts.length ? ` <span class="req">[${escapeHtml(parts.join(' | '))}]</span>` : '';
}

function renderHeader(model) {
  const logo = fs.readFileSync(path.join(__dirname, 'logo.png')).toString('base64');
  return `<header class="brand-header">
  <div>
    <h1>${escapeHtml(model.title)}</h1>
    <div class="muted">${escapeHtml(model.app.name)} — ${escapeHtml(model.app.description)}</div>
  </div>
  <img src="data:image/png;base64,${logo}" alt="${escapeHtml(model.app.name)}">
</header>`;
}

function renderSummary(model) {
  const rows = model.meta.map((item) => `<dt>${escapeHtml(item.label)}</dt><dd>${escapeHtml(item.value)}</dd>`).join('');
  return `<section><h2>Summary</h2><dl class="meta">${rows}</dl></section>`;
}

function renderProgress(total, label) {
  return `<div class="progress" data-progress><div class="progress-text">${escapeHtml(label)}: <strong data-done>0</strong> / <span data-total>${total}</span><span class="progress-failed" data-failed-wrap hidden> · <strong data-failed>0</strong> failed manually</span></div><div class="progress-bar"><span class="fill-pass" data-fill></span><span class="fill-fail" data-fill-fail></span></div></div>`;
}

function renderCoverage(coverage) {
  const cards = [
    ['Specs', coverage.specs],
    ['Checks', coverage.checks],
    ['Passed', coverage.passed],
    ['Failed', coverage.failed],
    ['Skipped', coverage.skipped],
    ['Not Executed', coverage.notExecuted],
    ['Automation coverage', `${coverage.automationPct}%`],
    ['Manual validation', `${coverage.manualPct}%`],
  ];
  const total = coverage.checks || 1;
  const segment = (count, status) => `<span class="status-${status}" style="width:${((count / total) * 100).toFixed(2)}%"></span>`;
  return `<section id="coverage"><h2>Coverage Overview</h2>
<div class="cards">${cards.map(([label, value]) => `<div class="card"><span class="value">${escapeHtml(value)}</span><span class="label">${label}</span></div>`).join('')}</div>
<div class="bar">${segment(coverage.passed, 'passed')}${segment(coverage.failed, 'failed')}${segment(coverage.skipped, 'skipped')}${segment(coverage.notExecuted, 'notExecuted')}</div>
<p class="muted">Automation coverage = passed checks / all checks. Manual validation = failed, skipped and not executed (a hook failed or no result was recorded) checks that need a manual pass before sign-off.</p>
${renderProgress(coverage.checks - coverage.passed, 'Manual checks completed (all specs)')}
</section>`;
}

/** Shows URL identifiers by their last path segment (e.g. a Jira key) and links them to the full URL. */
function renderIdentifier(value, className) {
  const text = String(value);
  if (!/^https?:\/\//.test(text)) return `<span class="${className}">${escapeHtml(text)}</span>`;
  const label = text.split('/').filter(Boolean).pop() || text;
  return `<a class="${className}" href="${escapeHtml(text)}" title="${escapeHtml(text)}">${escapeHtml(label)}</a>`;
}

function renderIdentifiers(refs, bugs) {
  return [...refs.map((ref) => renderIdentifier(ref, 'ref')), ...bugs.map((bug) => renderIdentifier(bug, 'ref bug'))].join(' ');
}

function renderSpecList(specs) {
  const rows = specs
    .map(
      (spec, index) => `<tr>
  <td class="num">${index + 1}</td>
  <td><a href="#spec-${index}">${escapeHtml(spec.file)}</a></td>
  <td>${statusBadge(spec.status)}</td>
  <td>${priorityBadge(spec.priority)}</td>
  <td class="num">${spec.counts.checks}</td>
  <td class="num">${spec.counts.passed}</td>
  <td class="num">${spec.counts.failed}</td>
  <td class="num">${spec.counts.skipped}</td>
  <td class="num">${spec.counts.notExecuted}</td>
  <td class="refs">${renderIdentifiers(spec.refs || [], spec.bugs || [])}</td>
</tr>`,
    )
    .join('');
  return `<section><h2>Prioritised Spec List</h2>
<p class="muted">Ordered by failed specs first, then by checks needing manual validation (descending), then by requirement priority (P1 &gt; P2 &gt; P3). Bug identifiers are shown in red.</p>
<table><thead><tr><th class="num">#</th><th>Spec</th><th>Status</th><th>Priority</th><th class="num">Checks</th><th class="num">Passed</th><th class="num">Failed</th><th class="num">Skipped</th><th class="num">Not Executed</th><th>Refs / Bugs</th></tr></thead>
<tbody>${rows}</tbody></table></section>`;
}

function renderFailure(failure) {
  const screenshots = failure.screenshots.map((shot) => `<figure><img class="shot" src="${shot.dataUri}" alt="${escapeHtml(shot.name)}"><figcaption class="muted">${escapeHtml(shot.name)}</figcaption></figure>`).join('');
  return `<article class="failure">
  <h3>${escapeHtml(failure.title)}</h3>
  <div class="path">${escapeHtml(failure.file)} › ${escapeHtml(failure.path.join(' › '))}</div>
  <dl class="meta">
    <dt>Environment</dt><dd>${escapeHtml(failure.environment)}</dd>
    <dt>Requirement refs / bugs</dt><dd>${renderIdentifiers(failure.refs, failure.bugs || []) || '—'}</dd>
    <dt>Timestamp</dt><dd>${escapeHtml(formatTimestamp(failure.timestamp) || '—')}</dd>
    <dt>Duration</dt><dd>${escapeHtml(failure.duration)}</dd>
  </dl>
  <pre class="error">${escapeHtml(failure.message || 'No error message recorded')}</pre>
  ${failure.stack ? `<pre>${escapeHtml(failure.stack)}</pre>` : ''}
  ${screenshots || '<p class="muted">No screenshot captured.</p>'}
</article>`;
}

function renderFailures(failures) {
  const body = failures.length ? failures.map(renderFailure).join('') : '<p>No failed tests in this run.</p>';
  return `<section><h2>Failed Tests Detail</h2>${body}</section>`;
}

function renderCheck(check, key) {
  const manual = needsManual(check.status)
    ? `<input type="checkbox" class="manual" data-key="${key}" data-title="${escapeHtml(check.title)}" title="Manual result: click to cycle not checked, passed, failed" aria-label="Manual result for ${escapeHtml(check.title)}: not checked">`
    : '<span class="manual-placeholder"></span>';
  const reason = check.reason ? ` data-reason="Not executed: ${escapeHtml(check.reason)}" tabindex="0"` : '';
  return `<li class="check${needsManual(check.status) ? ' needs-manual' : ''}" data-status="${check.status}"><span class="mark mark-${check.status}"${reason}>${STATUS_LABELS[check.status]}</span>${manual}<span class="check-title">${escapeHtml(check.title)}${reqSummary(check.req)}</span></li>`;
}

/** Nests checks under their describe/context titles, so each title is shown once. */
/** `req` of the describe/context at `depth`, unless it is the spec-level `req` already shown in the spec header. */
function headingReq(check, depth, specReq) {
  const req = check.suiteReqs?.[depth];
  return req && req !== specReq ? reqSummary(req) : '';
}

function renderTree(items, depth, specReq) {
  const html = [];
  let index = 0;
  while (index < items.length) {
    const { check, key } = items[index];
    if (check.path.length <= depth) {
      html.push(renderCheck(check, key));
      index += 1;
    } else {
      const title = check.path[depth];
      let end = index + 1;
      while (end < items.length && items[end].check.path.length > depth && items[end].check.path[depth] === title) end += 1;
      html.push(`<li class="group${depth ? '' : ' group-root'}"><div class="context">${escapeHtml(title)}${headingReq(check, depth, specReq)}</div><ul class="checks">${renderTree(items.slice(index, end), depth + 1, specReq)}</ul></li>`);
      index = end;
    }
  }
  return html.join('');
}

function renderChecks(checks, specIndex, specReq) {
  return renderTree(
    checks.map((check, checkIndex) => ({ check, key: `${specIndex}-${checkIndex}` })),
    0,
    specReq,
  );
}

function renderSpec(spec, index) {
  const manualCount = spec.counts.checks - spec.counts.passed;
  return `<details class="spec" id="spec-${index}" data-status="${spec.status}" data-manual="${manualCount}" open>
  <summary><h3>${escapeHtml(spec.file)} ${statusBadge(spec.status)} ${priorityBadge(spec.priority)}</h3></summary>
  <div class="path">${spec.counts.passed} passed · ${spec.counts.failed} failed · ${spec.counts.skipped} skipped · ${spec.counts.notExecuted} not executed${reqSummary(spec.req)}</div>
  ${manualCount ? renderProgress(manualCount, 'Manual checks completed') : ''}
  <ul class="checks">${renderChecks(spec.checks, index, spec.req)}</ul>
  <label class="field notes"><span>Notes</span><textarea data-key="${index}-notes" rows="3"></textarea></label>
  <div class="signoff">
    <label class="field"><span>Tested by</span><input type="text" data-key="${index}-tester"></label>
    <label class="field"><span>Date</span><input type="date" data-key="${index}-date"></label>
    <label class="field"><span>Signature</span><input type="text" data-key="${index}-signature"></label>
  </div>
</details>`;
}

function renderToolbar() {
  const filters = [['all', 'All checks'], ...Object.entries(FILTERS).map(([id, [label]]) => [id, label])];
  const radios = filters.map(([id, label]) => `<label><input type="radio" name="filter" id="filter-${id}"${id === 'all' ? ' checked' : ''}> ${label}</label>`).join('\n  ');
  return `<div class="toolbar screen-only">
  <span class="muted">Show:</span>
  ${radios}
  <label><input type="checkbox" id="hide-passed"> Hide manually passed</label>
  <span class="spacer"></span>
  <button type="button" data-action="expand">Expand all</button>
  <button type="button" data-action="collapse">Collapse all</button>
  <button type="button" data-action="print">Print / Save PDF</button>
  <button type="button" data-action="reset">Clear entries</button>
</div>
<p class="filter-empty muted">No checks match this filter.</p>`;
}

/** Hides the context groups and specs left without a check matching `match`, and shows the empty-filter note. */
function hideEmptyCss(scope, match) {
  return `${scope} li.group:not(:has(li.check${match})), ${scope} details.spec:not(:has(li.check${match})) { display: none; }
${scope}:not(:has(li.check${match})) .filter-empty { display: block; }`;
}

/** CSS-only filtering: the checked toolbar radio and "Hide manually passed" hide the checks, context groups and specs that do not match. */
function filterCss() {
  const filters = [['all', ''], ...Object.entries(FILTERS).map(([id, [, match]]) => [id, match])];
  return filters
    .flatMap(([id, match]) => {
      const on = `body:has(#filter-${id}:checked)`;
      const rules = match ? [`${on} li.check:not(${match}) { display: none; }`, hideEmptyCss(on, match)] : [];
      return [...rules, hideEmptyCss(`${on}:has(#hide-passed:checked)`, `${match}:not([data-manual='pass'])`)];
    })
    .join('\n');
}

function renderSpecs(specs) {
  const marks = Object.entries(STATUS_LABELS)
    .map(([status, label]) => `<span class="mark mark-${status}">${label}</span>`)
    .join(' ');
  return `<section><h2>Specification Details</h2>
<p class="muted legend">${marks} automated result. Hover a <span class="mark mark-notExecuted">Not Executed</span> label to see why it did not run (a hook failed or no result was recorded).</p>
<p class="muted legend">Manual result box for failed, skipped and not executed checks: click to cycle not checked → <span class="manual-demo"></span> passed → <span class="manual-demo fail"></span> failed (tick or cross it on paper). In the HTML report, entries are saved in this browser until cleared.</p>
${renderToolbar()}
${specs.map(renderSpec).join('')}</section>`;
}

function renderReport(model) {
  const css = ['tokens.css', 'report.css'].map((file) => fs.readFileSync(path.join(__dirname, file), 'utf8')).join('\n');
  const script = fs.readFileSync(path.join(__dirname, 'interactive.js'), 'utf8');
  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<title>${escapeHtml(model.title)}</title>
<style>${css}
${filterCss()}</style>
</head>
<body data-report-id="${escapeHtml(model.reportId)}">
<main>
${renderHeader(model)}
${renderSummary(model)}
${renderCoverage(model.coverage)}
${renderSpecList(model.specs)}
${renderFailures(model.failures)}
${renderSpecs(model.specs)}
</main>
<script>${script}</script>
</body>
</html>
`;
}

module.exports = { renderReport, escapeHtml, formatTimestamp };
