#!/usr/bin/env node
/**
 * Analyze Flaky Tests
 *
 * Reads the persistent JSONL ledger from the orphan `test-results` branch
 * and identifies flaky tests — those that fail intermittently across runs.
 *
 * Runs two complementary analyses:
 *   1. Wide-window flakiness — lifetime fail rate across all recorded runs
 *      (e.g. up to 100), classifying tests as flaky / consistent / rare.
 *   2. Latest issues — recency-weighted regressions: tests failing right now
 *      (a streak of consecutive failures, or a majority of the recent window),
 *      surfaced first because they usually mean something just changed.
 *
 * Outputs a markdown report to reports/flaky-tests.md.
 *
 * Usage:
 *   node scripts/analyze-flaky-tests.js [--output <path>] [--last <N>] [--recent <N>] [--streak <N>] [--no-suppress]
 *
 * Defaults:
 *   --output  reports/flaky-tests.md
 *   --last    0 (all runs; set a number to limit to the N most recent runs)
 *   --recent  5 (size of the recent-run window that defines "latest issues")
 *   --streak  3 (consecutive trailing failures that flag a regression)
 *
 * Flags:
 *   --no-suppress  Ignore flaky-suppressions.json and show all failures unsuppressed
 */

const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');

const WORKSPACE = process.cwd();
const RESULTS_BRANCH = 'test-results';
const LEDGER_FILENAME = 'test-run-history.jsonl';

const args = process.argv.slice(2);

function argValue(flag, fallback) {
  const idx = args.indexOf(flag);
  return idx !== -1 && idx + 1 < args.length ? args[idx + 1] : fallback;
}

const OUTPUT_PATH = path.resolve(WORKSPACE, argValue('--output', 'reports/flaky-tests.md'));
const LAST_N = parseInt(argValue('--last', '0'), 10);
// Recency window: how many of the most recent runs define "latest issues".
const RECENT_WINDOW = parseInt(argValue('--recent', '5'), 10);
// A trailing streak of this many consecutive failures signals a likely regression.
const STREAK_THRESHOLD = parseInt(argValue('--streak', '3'), 10);
// Suppression: known/reviewed failures are moved to a separate section.
const SUPPRESSIONS_PATH = path.resolve(__dirname, 'flaky-suppressions.json');
const NO_SUPPRESS = args.includes('--no-suppress');

/**
 * Read and parse the JSONL ledger from the orphan branch.
 * @returns {Array<object>}
 */
function readLedger() {
  try {
    execFileSync('git', ['fetch', 'origin', RESULTS_BRANCH], { cwd: WORKSPACE, stdio: 'pipe' });
  } catch (err) {
    // Distinguish an authentication/transport failure from a genuinely missing
    // branch: the catch-all previously reported every fetch failure as "branch
    // not found", which masks the common case of unconfigured git credentials.
    const stderr = `${err.stderr || ''}${err.stdout || ''}`;
    const isAuthFailure = /could not read Username|Authentication failed|Device not configured|terminal prompts disabled|Permission denied|fatal: could not read Password/i.test(stderr);

    if (isAuthFailure) {
      console.error(`Could not authenticate to the remote to fetch '${RESULTS_BRANCH}'.`);
      console.error('Configure git credentials for origin (SSH remote, a PAT, or `gh auth login`) and retry.');
    } else {
      console.error(`Branch '${RESULTS_BRANCH}' not found on remote.`);
      console.error('The ledger is populated by CI runs. No data collected yet.');
    }
    process.exit(1);
  }

  let content;
  try {
    content = execFileSync('git', ['show', `origin/${RESULTS_BRANCH}:${LEDGER_FILENAME}`], {
      cwd: WORKSPACE,
      encoding: 'utf8',
    });
  } catch {
    console.error(`Ledger file not found on '${RESULTS_BRANCH}' branch.`);
    process.exit(1);
  }

  const lines = content.split('\n').filter(Boolean);
  const entries = [];

  for (const line of lines) {
    try {
      entries.push(JSON.parse(line));
    } catch {
      // skip malformed lines
    }
  }

  if (entries.length === 0) {
    console.error('Ledger is empty. Wait for CI runs to populate it.');
    process.exit(1);
  }

  return entries;
}

/**
 * Build a stable key from a failure entry for aggregation.
 * Uses file + context path + it title to uniquely identify the first-failure location.
 */
function failureKey(failure) {
  const ctx = Array.isArray(failure.context) ? failure.context.join(' > ') : '';
  return `${failure.file || ''}::${ctx}::${failure.it || failure.title || ''}`;
}

/**
 * Load suppression rules from flaky-suppressions.json.
 * Returns an array of active (non-expired) suppression entries.
 */
function loadSuppressions() {
  if (NO_SUPPRESS || !fs.existsSync(SUPPRESSIONS_PATH)) return { testSuppressions: [], runCommits: new Set() };

  try {
    const data = JSON.parse(fs.readFileSync(SUPPRESSIONS_PATH, 'utf8'));
    const today = new Date().toISOString().slice(0, 10);

    const testSuppressions = (data.suppressions || []).filter((s) => !s.expiresAt || s.expiresAt >= today);
    const runCommits = new Set((data.runSuppressions || []).map((r) => r.commit));

    return { testSuppressions, runCommits };
  } catch {
    return { testSuppressions: [], runCommits: new Set() };
  }
}

/**
 * Check whether a failure data object matches a suppression rule.
 * Matches on file (substring), it (exact), and optional context (substring).
 */
function matchesSuppression(data, rule) {
  return data.file.includes(rule.file) && data.it === rule.it && (!rule.context || data.context.join(' > ').includes(rule.context));
}

/**
 * Partition failMap into active and suppressed entries in a single pass.
 * Returns empty suppressedMap immediately when no suppressions are active.
 * @returns {{ activeMap: Map, suppressedMap: Map<string, {data, rule}> }}
 */
function partitionBySuppressions(failMap, suppressions) {
  if (suppressions.length === 0) return { activeMap: failMap, suppressedMap: new Map() };

  const activeMap = new Map();
  const suppressedMap = new Map();

  for (const [key, data] of failMap) {
    const rule = suppressions.find((s) => matchesSuppression(data, s));
    if (rule) {
      suppressedMap.set(key, { data, rule });
    } else {
      activeMap.set(key, data);
    }
  }

  return { activeMap, suppressedMap };
}

/**
 * Aggregate failure data across runs.
 * Each failure represents the first failure in a spec file.
 * @param {Array<object>} runs
 * @returns {Map<string, { count: number, lastFailed: string, lastBranch: string, errors: string[], file: string, context: string[], it: string }>}
 */
function aggregateFailures(runs) {
  const failMap = new Map();

  for (const run of runs) {
    if (!run.failures) continue;
    for (const failure of run.failures) {
      const key = failureKey(failure);
      if (!failMap.has(key)) {
        failMap.set(key, {
          count: 0,
          lastFailed: '',
          lastBranch: '',
          errors: [],
          file: failure.file || '',
          context: Array.isArray(failure.context) ? failure.context : [],
          it: failure.it || failure.title || '',
        });
      }
      const entry = failMap.get(key);
      entry.count++;
      entry.lastFailed = run.timestamp;
      entry.lastBranch = run.branch;
      if (failure.error && !entry.errors.includes(failure.error)) {
        entry.errors.push(failure.error);
      }
    }
  }

  return failMap;
}

/**
 * Classify a failure entry as flaky vs consistently failing.
 * Flaky = failed in some runs but not all.
 * @param {number} failCount
 * @param {number} totalRuns
 * @returns {'flaky'|'consistent'|'rare'}
 */
function classify(failCount, totalRuns) {
  const rate = failCount / totalRuns;
  if (rate >= 0.8) return 'consistent';
  if (rate >= 0.1) return 'flaky';
  return 'rare';
}

/**
 * Build a per-test failure timeline aligned to run order, and derive
 * recency signals used to flag "latest issues" (regressions).
 *
 * For each failing test we produce a boolean array (one entry per run,
 * oldest → newest): true = failed in that run. A run that does not list the
 * test among its `failures` is treated as a pass for that test. From the
 * timeline we compute:
 *   - streak:        trailing run of consecutive failures ending at the latest run
 *   - recentFails:   failures within the last RECENT_WINDOW runs
 *   - recentTotal:   how many of the last RECENT_WINDOW runs exist (window may
 *                    be shorter than RECENT_WINDOW early on)
 *   - failingNow:    the most recent run failed
 *   - isNew:         all recorded failures fall inside the recent window
 *                    (i.e. the test was clean before it started failing)
 *
 * @returns {Map<string, { streak: number, recentFails: number, recentTotal: number, failingNow: boolean, isNew: boolean }>}
 */
function analyzeRecency(runs, failMap) {
  const totalRuns = runs.length;
  // Which failure keys appear in each run (in run order).
  const perRunKeys = runs.map((run) => {
    const set = new Set();
    if (Array.isArray(run.failures)) {
      for (const failure of run.failures) set.add(failureKey(failure));
    }
    return set;
  });

  const recency = new Map();

  for (const key of failMap.keys()) {
    const timeline = perRunKeys.map((set) => set.has(key));

    // Trailing consecutive failures ending at the most recent run.
    let streak = 0;
    for (let i = timeline.length - 1; i >= 0 && timeline[i]; i--) streak++;

    const windowStart = Math.max(0, totalRuns - RECENT_WINDOW);
    const window = timeline.slice(windowStart);
    const recentFails = window.filter(Boolean).length;
    const olderFails = timeline.slice(0, windowStart).filter(Boolean).length;

    recency.set(key, {
      streak,
      recentFails,
      recentTotal: window.length,
      failingNow: timeline[timeline.length - 1] === true,
      isNew: olderFails === 0 && recentFails > 0,
    });
  }

  return recency;
}

/**
 * Does a test warrant action now based on its recent behavior?
 * Either a sustained failing streak, or a majority of the recent window failing.
 */
function needsAction(rec) {
  const majorityRecent = rec.recentTotal > 0 && rec.recentFails / rec.recentTotal >= 0.6;
  return rec.streak >= STREAK_THRESHOLD || (rec.recentFails >= 3 && majorityRecent);
}

/**
 * Collapse newlines so a value stays on a single markdown line.
 */
function clean(text) {
  return String(text)
    .replace(/\s*\n\s*/g, ' ')
    .trim();
}

/**
 * Truncate a string to maxLen, appending ellipsis if truncated.
 */
function truncate(str, maxLen) {
  return str.length > maxLen ? str.slice(0, maxLen - 1) + '\u2026' : str;
}

/**
 * Generate the markdown report.
 */
function generateReport(runs, failMap, suppressedMap = new Map()) {
  const totalRuns = runs.length;
  const firstRun = runs[0]?.timestamp || 'N/A';
  const lastRun = runs[totalRuns - 1]?.timestamp || 'N/A';

  const totalTests = runs.reduce((sum, r) => sum + (r.stats?.total || 0), 0);
  const totalPassed = runs.reduce((sum, r) => sum + (r.stats?.passed || 0), 0);
  const totalPending = runs.reduce((s, r) => s + (r.stats?.pending || 0), 0);
  const totalSkipped = runs.reduce((s, r) => s + (r.stats?.skipped || 0), 0);
  // Verified = tests that actually executed: exclude both pending and skipped.
  const verified = totalTests - totalPending - totalSkipped;
  const overallPassRate = verified > 0 ? ((totalPassed / verified) * 100).toFixed(2) : '0';

  const sorted = [...failMap.entries()].sort((a, b) => b[1].count - a[1].count);

  const flaky = sorted.filter(([, v]) => classify(v.count, totalRuns) === 'flaky');
  const consistent = sorted.filter(([, v]) => classify(v.count, totalRuns) === 'consistent');
  const rare = sorted.filter(([, v]) => classify(v.count, totalRuns) === 'rare');

  // Recency signals: catch tests that are failing *now* regardless of their
  // lifetime fail rate (a brand-new regression has a low overall rate).
  const recency = analyzeRecency(runs, failMap);
  const actionable = sorted
    .filter(([key]) => needsAction(recency.get(key)))
    // Most urgent first: longest current streak, then most recent-window fails.
    .sort((a, b) => {
      const ra = recency.get(a[0]);
      const rb = recency.get(b[0]);
      return rb.streak - ra.streak || rb.recentFails - ra.recentFails;
    });

  const lines = [];

  lines.push('# Flaky Test Analysis Report');
  lines.push('');
  lines.push(`Generated: ${new Date().toISOString()}`);
  lines.push('');
  lines.push('## Summary');
  lines.push('');
  lines.push(`- **Runs analyzed:** ${totalRuns}`);
  lines.push(`- **Period:** ${firstRun.slice(0, 10)} to ${lastRun.slice(0, 10)}`);
  lines.push(`- **Overall pass rate:** ${overallPassRate}%`);
  lines.push(`- **Unique failing tests:** ${failMap.size}`);
  lines.push(`- **Flaky tests (10-79% fail rate):** ${flaky.length}`);
  lines.push(`- **Consistently failing (>=80%):** ${consistent.length}`);
  lines.push(`- **Rare failures (<10%):** ${rare.length}`);
  lines.push(`- **⚠️ Action required (recent regressions):** ${actionable.length}`);
  if (suppressedMap.size > 0) {
    lines.push(`- **🔇 Suppressed (known issues):** ${suppressedMap.size}`);
  }
  lines.push('');
  lines.push('> Note: only the **first failure per spec file** is tracked — specs run with');
  lines.push('> `testIsolation: false`, so later tests depend on earlier ones and their failures');
  lines.push('> are unreliable. Fail rate is measured across recorded executions (each CI run, including');
  lines.push('> repeated runs of the same commit).');
  lines.push('');

  // --- Latest issues: surfaced first because they need action now ---
  if (actionable.length > 0) {
    lines.push('## ⚠️ Action Required — Recent Regressions');
    lines.push('');
    lines.push(`Tests failing **now**: a streak of ≥${STREAK_THRESHOLD} consecutive failures, or`);
    lines.push(`a majority of the last ${RECENT_WINDOW} runs failing. These likely reflect a real change`);
    lines.push('rather than lifetime flakiness — investigate the recent commits.');
    lines.push('');
    for (const [key, data] of actionable) {
      const rec = recency.get(key);
      const ctx = clean(data.context.join(' > '));
      const error = data.errors.length > 0 ? truncate(clean(data.errors[0]), 120) : '';
      const rate = ((data.count / totalRuns) * 100).toFixed(1);
      const tags = [];
      if (rec.streak >= STREAK_THRESHOLD) tags.push(`🔴 ${rec.streak} in a row`);
      if (rec.isNew) tags.push('🆕 new regression');
      if (!rec.failingNow) tags.push('recovered on latest run');
      lines.push(`### ${clean(data.file)}${tags.length ? ` — ${tags.join(', ')}` : ''}`);
      lines.push('');
      if (ctx) lines.push(`- **Context:** ${ctx}`);
      lines.push(`- **it:** ${clean(data.it)}`);
      lines.push(`- **Current streak:** ${rec.streak} consecutive failure(s)`);
      lines.push(`- **Recent window:** ${rec.recentFails}/${rec.recentTotal} of last ${RECENT_WINDOW} runs failed`);
      lines.push(`- **Lifetime:** ${data.count}/${totalRuns} runs (${rate}%)`);
      lines.push(`- **Last failed:** ${data.lastFailed.slice(0, 10)}`);
      if (error) lines.push(`- **Error:** ${error}`);
      lines.push('');
    }
  }

  if (flaky.length > 0) {
    lines.push('## Flaky Tests');
    lines.push('');
    lines.push('First failure per spec file — tests within a file depend on previous ones.');
    lines.push('');
    for (const [, data] of flaky) {
      const rate = ((data.count / totalRuns) * 100).toFixed(1);
      const ctx = clean(data.context.join(' > '));
      const error = data.errors.length > 0 ? truncate(clean(data.errors[0]), 120) : '';
      lines.push(`### ${clean(data.file)}`);
      lines.push('');
      if (ctx) lines.push(`- **Context:** ${ctx}`);
      lines.push(`- **it:** ${clean(data.it)}`);
      lines.push(`- **Failures:** ${data.count}/${totalRuns} (${rate}%)`);
      lines.push(`- **Last failed:** ${data.lastFailed.slice(0, 10)}`);
      if (error) lines.push(`- **Error:** ${error}`);
      lines.push('');
    }
  }

  if (consistent.length > 0) {
    lines.push('## Consistently Failing Tests');
    lines.push('');
    lines.push('First failure per spec file — fail in most runs, likely broken.');
    lines.push('');
    for (const [, data] of consistent) {
      const rate = ((data.count / totalRuns) * 100).toFixed(1);
      const ctx = clean(data.context.join(' > '));
      lines.push(`### ${clean(data.file)}`);
      lines.push('');
      if (ctx) lines.push(`- **Context:** ${ctx}`);
      lines.push(`- **it:** ${clean(data.it)}`);
      lines.push(`- **Failures:** ${data.count}/${totalRuns} (${rate}%)`);
      lines.push(`- **Last failed:** ${data.lastFailed.slice(0, 10)}`);
      lines.push('');
    }
  }

  if (rare.length > 0) {
    lines.push('## Rare Failures');
    lines.push('');
    lines.push('First failure per spec file — failed once or twice, may be environment-related.');
    lines.push('');
    for (const [, data] of rare) {
      const ctx = clean(data.context.join(' > '));
      const error = data.errors.length > 0 ? truncate(clean(data.errors[0]), 120) : '';
      lines.push(`### ${clean(data.file)}`);
      lines.push('');
      if (ctx) lines.push(`- **Context:** ${ctx}`);
      lines.push(`- **it:** ${clean(data.it)}`);
      lines.push(`- **Failures:** ${data.count}/${totalRuns}`);
      lines.push(`- **Last failed:** ${data.lastFailed.slice(0, 10)}`);
      if (error) lines.push(`- **Error:** ${error}`);
      lines.push('');
    }
  }

  if (failMap.size > 0) {
    lines.push('## Error Patterns');
    lines.push('');

    const errorGroups = new Map();
    for (const [, data] of sorted) {
      const label = `${data.file} > ${data.context.join(' > ')} > ${data.it}`;
      for (const err of data.errors) {
        const normalized = err.replace(/\d+/g, 'N').slice(0, 100);
        if (!errorGroups.has(normalized)) {
          errorGroups.set(normalized, []);
        }
        errorGroups.get(normalized).push(label);
      }
    }

    const groupedErrors = [...errorGroups.entries()].filter(([, tests]) => tests.length > 1).sort((a, b) => b[1].length - a[1].length);

    if (groupedErrors.length > 0) {
      lines.push('Recurring error patterns across multiple spec files:');
      lines.push('');
      for (const [pattern, tests] of groupedErrors.slice(0, 10)) {
        lines.push(`### ${truncate(pattern, 100)}`);
        lines.push('');
        lines.push(`Affects ${tests.length} spec(s):`);
        for (const t of tests.slice(0, 5)) {
          lines.push(`- ${truncate(t, 120)}`);
        }
        if (tests.length > 5) lines.push(`- ...and ${tests.length - 5} more`);
        lines.push('');
      }
    } else {
      lines.push('No recurring error patterns detected across multiple tests.');
      lines.push('');
    }
  }

  lines.push('## Run History');
  lines.push('');

  const recentRuns = runs.slice(-20);
  for (let i = recentRuns.length - 1; i >= 0; i--) {
    const r = recentRuns[i];
    const runVerified = (r.stats?.total || 0) - (r.stats?.pending || 0) - (r.stats?.skipped || 0);
    const rate = runVerified > 0 ? (((r.stats?.passed || 0) / runVerified) * 100).toFixed(1) : '0';
    const num = runs.indexOf(r) + 1;
    const date = r.timestamp?.slice(0, 10) || '';
    const branch = clean(r.branch || '');
    lines.push(`- **#${num}** ${date} — \`${branch}\` @ ${r.commit || 'N/A'} (${r.env || 'N/A'}): ${r.stats?.passed || 0} passed, ${r.stats?.failed || 0} failed of ${r.stats?.total || 0} total — ${rate}% pass rate`);
  }
  lines.push('');

  // --- Suppressed known issues (collapsed at the bottom) ---
  if (suppressedMap.size > 0) {
    lines.push('## 🔇 Suppressed — Known Issues');
    lines.push('');
    lines.push('These failures are suppressed from actionable sections because they have been');
    lines.push('reviewed and linked to a tracked ticket. Edit `scripts/flaky-suppressions.json`');
    lines.push('to add, remove, or expire suppressions.');
    lines.push('');

    const sortedSuppressed = [...suppressedMap.entries()].sort((a, b) => b[1].data.count - a[1].data.count);

    for (const [, { data, rule }] of sortedSuppressed) {
      const rate = ((data.count / totalRuns) * 100).toFixed(1);
      const ctx = clean(data.context.join(' > '));
      lines.push(`### ${clean(data.file)}`);
      lines.push('');
      if (ctx) lines.push(`- **Context:** ${ctx}`);
      lines.push(`- **it:** ${clean(data.it)}`);
      lines.push(`- **Failures:** ${data.count}/${totalRuns} (${rate}%)`);
      lines.push(`- **Last failed:** ${data.lastFailed.slice(0, 10)}`);
      lines.push(`- **Reason:** ${rule.reason}`);
      lines.push(`- **Ticket:** ${rule.ticket}`);
      if (rule.expiresAt) lines.push(`- **Expires:** ${rule.expiresAt}`);
      lines.push('');
    }
  }

  return lines.join('\n');
}

function main() {
  console.log('Analyzing flaky tests...');
  console.log(`  Source: origin/${RESULTS_BRANCH}:${LEDGER_FILENAME}`);
  console.log(`  Output: ${OUTPUT_PATH}`);

  let runs = readLedger();

  if (LAST_N > 0 && runs.length > LAST_N) {
    console.log(`  Limiting to last ${LAST_N} runs (${runs.length} total)`);
    runs = runs.slice(-LAST_N);
  }

  const fullFailMap = aggregateFailures(runs);
  const { testSuppressions } = loadSuppressions();
  const { activeMap: failMap, suppressedMap } = partitionBySuppressions(fullFailMap, testSuppressions);
  const report = generateReport(runs, failMap, suppressedMap);

  fs.mkdirSync(path.dirname(OUTPUT_PATH), { recursive: true });
  fs.writeFileSync(OUTPUT_PATH, report);

  const flaky = [...failMap.values()].filter((v) => classify(v.count, runs.length) === 'flaky');
  const recency = analyzeRecency(runs, failMap);
  const actionable = [...failMap.keys()].filter((k) => needsAction(recency.get(k)));

  console.log('');
  console.log(`  Runs analyzed:     ${runs.length}`);
  console.log(`  Unique failures:   ${failMap.size}`);
  console.log(`  Flaky tests:       ${flaky.length}`);
  console.log(`  Action required:   ${actionable.length}`);
  if (suppressedMap.size > 0) {
    console.log(`  Suppressed:        ${suppressedMap.size}`);
  }
  console.log('');
  console.log(`Report written to ${OUTPUT_PATH}`);
}

module.exports = { analyzeRecency, needsAction, aggregateFailures, generateReport, classify, loadSuppressions, matchesSuppression, partitionBySuppressions };

if (require.main === module) main();
