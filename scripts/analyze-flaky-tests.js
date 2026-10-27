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
 *   node scripts/analyze-flaky-tests.js [--output <path>] [--last <N>] [--recent <N>] [--streak <N>] [--env <env>] [--no-suppress]
 *
 * Defaults:
 *   --output       reports/flaky-tests.md
 *   --last         0 (all runs; set a number to limit to the N most recent runs)
 *   --recent       5 (size of the recent-run window that defines "latest issues")
 *   --streak       3 (consecutive trailing failures that flag a regression)
 *   --env          unset (all environments; set to e.g. qa or dev to scope the report)
 *   --main-branch  main (branch treated as the trunk when splitting metrics into
 *                  "excl. non-main" vs "incl. non-main"; also RESULTS_MAIN_BRANCH env)
 *
 * Flags:
 *   --no-suppress  Ignore flaky-suppressions.json and show all failures unsuppressed
 */

const fs = require('fs');
const path = require('path');
const { gitExecFileSync } = require('./git-exec-lib');

const WORKSPACE = process.cwd();
const RESULTS_BRANCH = 'test-results';
const LEDGER_FILENAME = 'test-run-history.jsonl';

const args = process.argv.slice(2);

function argValue(flag, fallback) {
  const idx = args.indexOf(flag);
  return idx !== -1 && idx + 1 < args.length ? args[idx + 1] : fallback;
}

// Optional environment filter: limit analysis to a single env (e.g. qa, dev).
// When empty, the report covers all environments combined.
const ENV_FILTER = argValue('--env', '').toLowerCase();
// Default output is env-scoped so an --env run never overwrites the combined
// report under the all-env filename. An explicit --output always wins.
const DEFAULT_OUTPUT = ENV_FILTER ? `reports/flaky-tests-${ENV_FILTER}.md` : 'reports/flaky-tests.md';
const OUTPUT_PATH = path.resolve(WORKSPACE, argValue('--output', DEFAULT_OUTPUT));
const LAST_N = parseInt(argValue('--last', '0'), 10);
// Recency window: how many of the most recent runs define "latest issues".
const RECENT_WINDOW = parseInt(argValue('--recent', '5'), 10);
// A trailing streak of this many consecutive failures signals a likely regression.
const STREAK_THRESHOLD = parseInt(argValue('--streak', '3'), 10);
// The trunk branch. Runs on any other branch (feature/PR branches) are "non-main"
// and every rate is reported twice: excluding them (trunk-only signal) and
// including them (gross signal across all branches).
const MAIN_BRANCH = argValue('--main-branch', process.env.RESULTS_MAIN_BRANCH || 'main');
// Suppression: known/reviewed failures are moved to a separate section.
const SUPPRESSIONS_PATH = path.resolve(__dirname, 'flaky-suppressions.json');
const NO_SUPPRESS = args.includes('--no-suppress');

/**
 * Read and parse the JSONL ledger from the orphan branch.
 * @returns {Array<object>}
 */
function readLedger() {
  try {
    gitExecFileSync(['fetch', 'origin', RESULTS_BRANCH], { cwd: WORKSPACE, stdio: 'pipe' });
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
    content = gitExecFileSync(['show', `origin/${RESULTS_BRANCH}:${LEDGER_FILENAME}`], {
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
 *
 * All test-level suppressions are returned regardless of `expiresAt`. Expiry is
 * NOT resolved here against today's clock; it is resolved per failure in
 * `ruleStillMasks()` against the failure's own most-recent occurrence, so an
 * expired-but-not-recurring known issue keeps its historical failures masked.
 * @returns {{ testSuppressions: Array, runSuppressions: Array, runCommits: Set<string> }}
 */
function loadSuppressions() {
  if (NO_SUPPRESS || !fs.existsSync(SUPPRESSIONS_PATH)) return { testSuppressions: [], runSuppressions: [], runCommits: new Set() };

  try {
    const data = JSON.parse(fs.readFileSync(SUPPRESSIONS_PATH, 'utf8'));

    const testSuppressions = data.suppressions || [];
    const runSuppressions = data.runSuppressions || [];
    const runCommits = new Set(runSuppressions.map((r) => r.commit));

    return { testSuppressions, runSuppressions, runCommits };
  } catch {
    return { testSuppressions: [], runSuppressions: [], runCommits: new Set() };
  }
}

/**
 * Check whether a failure data object matches a suppression rule.
 * Matches on file (substring), it (exact), and optional context (substring).
 */
function matchesSuppression(data, rule) {
  return data.file.includes(rule.file) && data.it === rule.it && (!rule.context || data.context.join(' > ').includes(rule.context));
}

/** Reduce an ISO timestamp to its YYYY-MM-DD date part, or 'N/A' when empty. */
function dateOnly(value) {
  return value ? String(value).slice(0, 10) : 'N/A';
}

/**
 * Decide whether an (optionally expiring) suppression still masks a failure.
 *
 * A suppression covers a KNOWN issue with a planned fix by `expiresAt`. Expiry
 * is deliberately NOT evaluated against today's clock — it is evaluated against
 * the failure's own most-recent occurrence (`data.lastFailed`). While the issue
 * only fails on/before `expiresAt` it stays masked, so the already-triaged
 * historical failures never resurface as noise. The moment it fails AGAIN after
 * `expiresAt` — the fix missed its deadline — the suppression lapses and every
 * occurrence of that test is unmasked so it becomes actionable again.
 */
function ruleStillMasks(rule, data) {
  if (!rule.expiresAt) return true;
  return dateOnly(data.lastFailed) <= rule.expiresAt;
}

/**
 * Partition failMap into active and suppressed entries in a single pass.
 * Returns empty suppressedMap immediately when no suppressions are active.
 * A matched-but-lapsed suppression (recurred after `expiresAt`) is routed to
 * activeMap so the whole test resurfaces as actionable.
 * @returns {{ activeMap: Map, suppressedMap: Map<string, {data, rule}> }}
 */
function partitionBySuppressions(failMap, suppressions) {
  if (suppressions.length === 0) return { activeMap: failMap, suppressedMap: new Map() };

  const activeMap = new Map();
  const suppressedMap = new Map();

  for (const [key, data] of failMap) {
    // Several rules may match the same test (e.g. an old lapsed rule plus a
    // fresh re-suppression). Use any rule that still masks — picking only the
    // first match would let a stale, lapsed rule shadow a newer valid one.
    const rule = suppressions.find((s) => matchesSuppression(data, s) && ruleStillMasks(s, data));
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
 * @returns {Map<string, { count: number, lastFailed: string, lastBranch: string, lastCommit: string, lastBuild: string, lastEnv: string, errors: string[], file: string, context: string[], it: string }>}
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
          lastCommit: '',
          lastBuild: '',
          lastEnv: '',
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
      entry.lastCommit = run.commit;
      entry.lastBuild = run.buildId;
      entry.lastEnv = run.env;
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
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean)
    .join(' ');
}

/**
 * Truncate a string to maxLen, appending ellipsis if truncated.
 */
function truncate(str, maxLen) {
  return str.length > maxLen ? str.slice(0, maxLen - 1) + '\u2026' : str;
}

/**
 * Does a single failure entry match any active suppression rule?
 * Mirrors matchesSuppression() but tolerates the `it`/`title` field variance
 * present in raw ledger failures (matchesSuppression assumes a normalised
 * aggregate). Used to drop suppressed failures from run-level counts.
 */
function isFailureSuppressed(failure, suppressions) {
  if (!suppressions || suppressions.length === 0) return false;
  const file = failure.file || '';
  const it = failure.it || failure.title || '';
  const context = Array.isArray(failure.context) ? failure.context : [];
  return suppressions.some((rule) => file.includes(rule.file) && it === rule.it && (!rule.context || context.join(' > ').includes(rule.context)));
}

/**
 * Count the failed spec files recorded in a run, excluding any whose test key
 * is effectively suppressed. `suppressedKeys` is the set of failure keys that
 * `partitionBySuppressions` routed to the suppressed bucket — a lapsed
 * suppression (recurred after expiry) is absent from it, so its failures count.
 */
function countActiveFailures(run, suppressedKeys) {
  if (!Array.isArray(run.failures)) return 0;
  if (!suppressedKeys || suppressedKeys.size === 0) return run.failures.length;
  return run.failures.filter((f) => !suppressedKeys.has(failureKey(f))).length;
}

/**
 * Aggregate summary statistics across all runs.
 *
 * Two distinct spec-file-level pass metrics are reported because they answer
 * different questions and diverge when runs execute different numbers of files:
 *
 *   - averagePassRate: the mean of each run's own pass rate, every run weighted
 *     equally regardless of how many files it ran. Answers "on a typical run,
 *     what share of spec files pass?" — a small run and a large run count the same.
 *
 *   - overallRunProbabilityRate: the pooled pass rate across every spec-file
 *     execution — (total files − failed files) / total files, summed over all
 *     runs. Files are weighted by execution count, so it is the probability that
 *     any single spec-file execution passes. Larger runs influence it more.
 *
 * A file counts as failed when the run recorded at least one first-failure for it.
 * Suppressed (known/reviewed) failures are excluded from the failed-file count so
 * both rates reflect only actionable failures.
 * Runs missing `specFiles` (legacy ledger rows) are excluded so they don't
 * distort either rate by contributing failures with a zero file count.
 * @returns {{ averagePassRate: string, overallRunProbabilityRate: string }}
 */
function computeSummaryStats(runs, suppressedKeys = new Set()) {
  const rated = runs.filter((r) => (r.specFiles || 0) > 0);
  const totalFiles = rated.reduce((sum, r) => sum + r.specFiles, 0);
  const failedFiles = rated.reduce((sum, r) => sum + countActiveFailures(r, suppressedKeys), 0);
  const passedFiles = totalFiles - failedFiles;

  // Pooled, execution-weighted: probability a single spec-file execution passes.
  const overallRunProbabilityRate = totalFiles > 0 ? ((passedFiles / totalFiles) * 100).toFixed(2) : '0';

  // Per-run mean: each run's own pass rate averaged with equal weight.
  const perRunRates = rated.map((r) => (r.specFiles - countActiveFailures(r, suppressedKeys)) / r.specFiles);
  const averagePassRate = perRunRates.length > 0 ? ((perRunRates.reduce((sum, rate) => sum + rate, 0) / perRunRates.length) * 100).toFixed(2) : '0';

  return { averagePassRate, overallRunProbabilityRate };
}

/**
 * Precise percentage of spec-file execution results that are flaky failures.
 *
 * Numerator: every failure occurrence, across all rated runs, whose test is
 * classified flaky (10–79% lifetime fail rate), excluding suppressed failures.
 * Denominator: total spec-file executions — the same pool the pass rates use
 * (sum of `specFiles` over rated runs).
 *
 * Counting occurrences within rated runs — rather than reusing the precomputed
 * lifetime `count` — keeps numerator and denominator on the same run set, so
 * legacy rows (no `specFiles`) and suppressed runs never skew the ratio.
 * Suppressed failures and suppressed runs are already removed upstream; the
 * per-failure suppression guard here is defensive for direct callers.
 *
 * @param {Array<object>} runs
 * @param {Set<string>} flakyKeys Failure keys classified as flaky.
 * @param {Set<string>} suppressedKeys Effectively-suppressed failure keys.
 * @returns {string} Percentage to two decimals, or '0' when no rated runs.
 */
function computeFlakyResultRate(runs, flakyKeys, suppressedKeys = new Set()) {
  const rated = runs.filter((r) => (r.specFiles || 0) > 0);
  const totalFiles = rated.reduce((sum, r) => sum + r.specFiles, 0);
  if (totalFiles === 0) return '0';

  let flakyFailures = 0;
  for (const run of rated) {
    if (!Array.isArray(run.failures)) continue;
    for (const failure of run.failures) {
      if (suppressedKeys.has(failureKey(failure))) continue;
      if (flakyKeys.has(failureKey(failure))) flakyFailures++;
    }
  }

  return ((flakyFailures / totalFiles) * 100).toFixed(2);
}

/**
 * Sort failures by lifetime count and split into flaky/consistent/rare buckets.
 * @returns {{ sorted: Array, flaky: Array, consistent: Array, rare: Array }}
 */
function classifyBuckets(failMap, totalRuns) {
  const sorted = [...failMap.entries()].toSorted((a, b) => (b[1].lastFailed || '').localeCompare(a[1].lastFailed || '') || b[1].count - a[1].count);
  const { flaky = [], consistent = [], rare = [] } = Object.groupBy(sorted, ([, v]) => classify(v.count, totalRuns));
  return { sorted, flaky, consistent, rare };
}

/**
 * Filter to failures needing action now, ordered by urgency
 * (longest current streak first, then most recent-window fails).
 */
function computeActionable(sorted, recency) {
  return sorted
    .filter(([key]) => needsAction(recency.get(key)))
    .toSorted((a, b) => {
      const ra = recency.get(a[0]);
      const rb = recency.get(b[0]);
      return rb.streak - ra.streak || rb.recentFails - ra.recentFails;
    });
}

/** First (optional) error line for a failure entry, cleaned and truncated. */
function firstError(data) {
  return data.errors.length > 0 ? truncate(clean(data.errors[0]), 120) : '';
}

function envLabel(value) {
  return value || 'N/A';
}

function commitLabel(value) {
  return value || 'N/A';
}

function buildLabel(value) {
  return value ? `build ${value}` : 'build N/A';
}

/**
 * A run's branch is "unmentioned" when nothing meaningful was recorded: an
 * empty value, the placeholder `unknown`, or a detached `HEAD` (how CI reports
 * a checkout that isn't on a named branch). Such a run is treated as the trunk —
 * absence of an explicit feature/PR branch means it ran on main.
 */
function isBranchUnmentioned(value) {
  return ['', 'unknown', 'head'].includes(
    String(value || '')
      .trim()
      .toLowerCase(),
  );
}

function branchLabel(value) {
  return isBranchUnmentioned(value) ? MAIN_BRANCH : value;
}

/**
 * Is this run recorded on the trunk (main) branch? Non-main runs come from
 * feature/PR branches and are split out of the trunk-only metrics. A run with
 * no meaningful branch recorded counts as the trunk (see isBranchUnmentioned).
 */
function isMainBranch(run) {
  return isBranchUnmentioned(run.branch) || String(run.branch) === MAIN_BRANCH;
}

function failureMetadata(data) {
  return `${dateOnly(data.lastFailed)} (${branchLabel(data.lastBranch)}, ${envLabel(data.lastEnv)}, ${commitLabel(data.lastCommit)}, ${buildLabel(data.lastBuild)})`;
}

/** Branch-breakdown line contrasting the trunk-only headline with every analysed branch; empty unless runs mix branches. */
function buildBranchBreakdownSection(branchBreakdown) {
  if (!branchBreakdown.show) return [];

  const { allStats } = branchBreakdown;
  const runs = branchBreakdown.mainRuns + branchBreakdown.nonMainRuns;
  return [
    `- **Branch breakdown (incl. non-main, ${runs} runs):** Average pass rate ${allStats.averagePassRate}%, Overall test run probability rate ${allStats.overallRunProbabilityRate}%, Flaky result rate ${allStats.flakyResultRate}% (excl. suppressed) / ${allStats.flakyResultRateAll}% (incl. suppressed)`,
  ];
}

/** One-line verdict for the Executive Summary, worst signal first. */
function statusLine(buckets, actionable) {
  if (actionable.length > 0) return 'Action required. Recent regressions need investigation.';
  if (buckets.consistent.length > 0) return 'Failing. Some tests fail in most runs.';
  if (buckets.flaky.length > 0) return 'Unstable. Some tests fail intermittently.';
  if (buckets.rare.length > 0) return 'Stable. Only rare failures were recorded.';
  return 'Stable. No failures were recorded.';
}

/** Report title and run metadata. */
function buildHeaderSection({ runs, branchBreakdown, generatedAt }) {
  const firstRun = runs[0]?.timestamp || 'N/A';
  const lastRun = runs.at(-1)?.timestamp || 'N/A';
  const headlineScope = branchBreakdown.hasMain === false ? `all branches (no \`${MAIN_BRANCH}\` runs in scope)` : `trunk-only (\`${MAIN_BRANCH}\`)`;
  return [
    '# Flaky Test Analysis Report',
    '',
    `**Generated**: ${generatedAt}  `,
    `**Period**: ${firstRun.slice(0, 10)} to ${lastRun.slice(0, 10)}  `,
    `**Runs analyzed**: ${runs.length} (${branchBreakdown.mainRuns} on \`${MAIN_BRANCH}\`, ${branchBreakdown.nonMainRuns} on non-main branches)  `,
    `**Environment**: ${ENV_FILTER || 'all environments'}  `,
    `**Headline rates**: ${headlineScope}`,
    '',
  ];
}

/**
 * Build the Executive Summary: status line and headline metrics only.
 * @param {object} input Named inputs.
 */
function buildSummarySection({ failMap, buckets, actionable, stats }) {
  return [
    '## Executive Summary',
    '',
    `**Status**: ${statusLine(buckets, actionable)}`,
    '',
    `- **Average pass rate:** ${stats.averagePassRate}%`,
    `- **Flaky result rate (excl. suppressed):** ${stats.flakyResultRate}%`,
    `- **Action required (recent regressions):** ${actionable.length}`,
    `- **Unique failing tests:** ${failMap.size}`,
    '',
    'Metric definitions: `docs/flaky-test-analysis.md`.',
    '',
  ];
}

/**
 * Build the "Run History" sub-section (last 20 runs, newest first).
 * Suppressed (known/reviewed) failures are excluded from each run's failed
 * count so the per-run pass rate matches the summary.
 */
function buildRunHistorySection(runs, suppressedKeys = new Set()) {
  const lines = ['### Run History', ''];

  const recentRuns = runs.slice(-20);
  for (let i = recentRuns.length - 1; i >= 0; i--) {
    const r = recentRuns[i];
    const num = runs.indexOf(r) + 1;
    const date = r.timestamp?.slice(0, 10) || '';
    const branch = clean(branchLabel(r.branch));
    const prefix = `- **#${num}** ${date} — \`${branch}\` @ ${r.commit || 'N/A'} (${r.env || 'N/A'}, ${buildLabel(r.buildId)}):`;
    if (r.specFiles > 0) {
      const runFailedFiles = countActiveFailures(r, suppressedKeys);
      const runPassedFiles = r.specFiles - runFailedFiles;
      const rate = ((runPassedFiles / r.specFiles) * 100).toFixed(1);
      lines.push(`${prefix} ${runPassedFiles} passed, ${runFailedFiles} failed of ${r.specFiles} spec file(s) — ${rate}% pass rate`);
    } else {
      lines.push(`${prefix} legacy run — spec-file pass rate unavailable (no specFiles recorded)`);
    }
  }
  lines.push('');

  return lines;
}

/** Build the Quality Metrics section: detailed rates, failure classes, branch breakdown and run history. */
function buildQualityMetricsSection({ runs, buckets, stats, suppressedMap, excludedRuns, branchBreakdown, suppressedKeys }) {
  const suppressed = suppressedMap.size > 0 || excludedRuns.length > 0 ? [`- **Suppressed:** ${suppressedMap.size} test(s), ${excludedRuns.length} run(s)`] : [];
  return [
    '## Quality Metrics',
    '',
    `- **Overall test run probability rate:** ${stats.overallRunProbabilityRate}%`,
    `- **Flaky result rate (incl. suppressed):** ${stats.flakyResultRateAll}%`,
    `- **Failing tests by class:** ${buckets.flaky.length} flaky (10–79%), ${buckets.consistent.length} consistently failing (≥80%), ${buckets.rare.length} rare (<10%)`,
    ...suppressed,
    ...buildBranchBreakdownSection(branchBreakdown),
    '',
    ...buildRunHistorySection(runs, suppressedKeys),
  ];
}

/** Compose the header suffix tags for an actionable entry. */
function actionableTags(rec) {
  const tags = [];
  if (rec.streak >= STREAK_THRESHOLD) tags.push(`🔴 ${rec.streak} in a row`);
  if (rec.isNew) tags.push('🆕 new regression');
  if (!rec.failingNow) tags.push('recovered on latest run');
  return tags;
}

/** One failure entry: a bullet naming the test, with its detail lines nested below. */
function failureEntryLines(data, details, tags = []) {
  const ctx = clean(data.context.join(' > '));
  const title = [ctx, clean(data.it)].filter(Boolean).join(' > ');
  const tagSuffix = tags.length > 0 ? ` — ${tags.join(', ')}` : '';
  return [`- **${clean(data.file)}** — ${title}${tagSuffix}`, ...details.map((line) => `  - ${line}`)];
}

/**
 * Build the "Action Required" sub-section (recent regressions surfaced first).
 */
function buildActionableSection(actionable, recency, totalRuns) {
  if (actionable.length === 0) return [];

  const lines = ['### Action Required — Recent Regressions', '', `Failing **now**: a streak of ≥${STREAK_THRESHOLD} consecutive failures, or a majority of the last ${RECENT_WINDOW} runs. Investigate the recent commits.`, ''];

  for (const [key, data] of actionable) {
    const rec = recency.get(key);
    const error = firstError(data);
    const rate = ((data.count / totalRuns) * 100).toFixed(1);
    lines.push(
      ...failureEntryLines(
        data,
        [`**Streak:** ${rec.streak} · **Recent window:** ${rec.recentFails}/${rec.recentTotal} · **Lifetime:** ${data.count}/${totalRuns} (${rate}%)`, `**Last failed:** ${failureMetadata(data)}`, ...(error ? [`**Error:** ${error}`] : [])],
        actionableTags(rec),
      ),
    );
  }
  lines.push('');

  return lines;
}

/**
 * Build one failure-bucket sub-section (Flaky / Consistently Failing / Rare).
 * @param {Array} entries Failure entries for this bucket.
 * @param {number} totalRuns Number of analyzed runs.
 * @param {object} opts
 * @param {string} opts.heading   Sub-section heading text.
 * @param {string} opts.intro     One-line description under the heading.
 * @param {boolean} opts.showRate Include the percentage in the failures line.
 * @param {boolean} opts.showError Include the error line.
 */
function buildBucketSection(entries, totalRuns, { heading, intro, showRate, showError }) {
  if (entries.length === 0) return [];

  const lines = [`### ${heading}`, '', intro, ''];

  for (const [, data] of entries) {
    const rate = ((data.count / totalRuns) * 100).toFixed(1);
    const error = showError ? firstError(data) : '';
    const failures = showRate ? `${data.count}/${totalRuns} (${rate}%)` : `${data.count}/${totalRuns}`;
    lines.push(...failureEntryLines(data, [`**Failures:** ${failures} · **Last failed:** ${failureMetadata(data)}`, ...(error ? [`**Error:** ${error}`] : [])]));
  }
  lines.push('');

  return lines;
}

/** Group normalised error strings shared by more than one spec. */
function groupErrorPatterns(sorted) {
  const errorGroups = new Map();
  for (const [, data] of sorted) {
    const label = `${data.file} > ${data.context.join(' > ')} > ${data.it}`;
    for (const err of data.errors) {
      const normalized = err.replace(/\d+/g, 'N').slice(0, 100);
      if (!errorGroups.has(normalized)) errorGroups.set(normalized, []);
      errorGroups.get(normalized).push(label);
    }
  }
  return [...errorGroups.entries()].filter(([, tests]) => tests.length > 1).toSorted((a, b) => b[1].length - a[1].length);
}

/**
 * Build the "Error Patterns" sub-section (recurring errors across spec files).
 */
function buildErrorPatternsSection(groupedErrors) {
  if (groupedErrors.length === 0) return [];

  const lines = ['### Error Patterns', '', 'Recurring errors across multiple spec files:', ''];
  for (const [pattern, tests] of groupedErrors.slice(0, 10)) {
    lines.push(`- **${clean(truncate(pattern, 100))}** — ${tests.length} spec(s)`);
    for (const t of tests.slice(0, 5)) lines.push(`  - ${clean(truncate(t, 120))}`);
    if (tests.length > 5) lines.push(`  - ...and ${tests.length - 5} more`);
  }
  lines.push('');

  return lines;
}

/**
 * Build the collapsed "Suppressed — Known Issues and Runs" block.
 */
function buildSuppressedSection(suppressedMap, totalRuns, excludedRuns) {
  if (suppressedMap.size === 0 && excludedRuns.length === 0) return [];

  const lines = ['<details>', '<summary>Suppressed — Known Issues and Runs</summary>', '', 'Reviewed and linked to a tracked ticket or incident. Edit `scripts/flaky-suppressions.json` to change them.', ''];

  for (const { run, rule } of excludedRuns) {
    const ticketSuffix = rule.ticket ? ` — ${clean(rule.ticket)}` : '';
    lines.push(
      `- **Run** ${dateOnly(run.timestamp)} (${branchLabel(run.branch || rule.branch)}, ${envLabel(run.env)}, ${buildLabel(run.buildId || rule.buildId)}) — \`${run.commit || rule.commit || 'N/A'}\`: ${clean(rule.reason || 'No reason recorded')}${ticketSuffix}`,
    );
  }

  const sortedSuppressed = [...suppressedMap.entries()].toSorted((a, b) => b[1].data.count - a[1].data.count);

  for (const [, { data, rule }] of sortedSuppressed) {
    const rate = ((data.count / totalRuns) * 100).toFixed(1);
    const expires = rule.expiresAt ? ` · **Expires:** ${rule.expiresAt}` : '';
    lines.push(...failureEntryLines(data, [`**Failures:** ${data.count}/${totalRuns} (${rate}%) · **Last failed:** ${failureMetadata(data)}`, `**Reason:** ${rule.reason} · **Ticket:** ${rule.ticket || 'N/A'}${expires}`]));
  }

  lines.push('', '</details>', '');
  return lines;
}

/** Build the Failed/Flaky Tests section: every bucket as a sub-section, suppressed items collapsed last. */
function buildFailedFlakySection({ failMap, buckets, actionable, recency, totalRuns, groupedErrors, suppressedMap, excludedRuns }) {
  const body = [
    // --- Latest issues: surfaced first because they need action now ---
    ...buildActionableSection(actionable, recency, totalRuns),
    ...buildBucketSection(buckets.flaky, totalRuns, {
      heading: 'Flaky Tests',
      intro: 'First failure per spec file — tests within a file depend on previous ones.',
      showRate: true,
      showError: true,
    }),
    ...buildBucketSection(buckets.consistent, totalRuns, {
      heading: 'Consistently Failing Tests',
      intro: 'First failure per spec file — fail in most runs, likely broken.',
      showRate: true,
      showError: false,
    }),
    ...buildBucketSection(buckets.rare, totalRuns, {
      heading: 'Rare Failures',
      intro: 'First failure per spec file — failed once or twice, may be environment-related.',
      showRate: false,
      showError: true,
    }),
    ...buildErrorPatternsSection(groupedErrors),
  ];
  const empty = failMap.size === 0 ? ['No active failures were recorded.', ''] : [];
  return ['## Failed/Flaky Tests', '', ...body, ...empty, ...buildSuppressedSection(suppressedMap, totalRuns, excludedRuns)];
}

const fileList = (entries) => [...new Set(entries.map(([, data]) => `\`${clean(data.file)}\``))].join(', ');

/** Build the Recommendations & Next Actions section from the failure buckets. */
function buildRecommendationsSection({ buckets, actionable, groupedErrors, suppressedMap }) {
  const actions = [
    actionable.length > 0 ? `Investigate the Action Required regressions against the commits since their last pass: ${fileList(actionable)}.` : '',
    buckets.consistent.length > 0 ? `Fix the consistently failing tests, or suppress them with a ticket: ${fileList(buckets.consistent)}.` : '',
    buckets.flaky.length > 0 ? `Stabilise the flaky tests, highest fail rate first: ${fileList(buckets.flaky.toSorted((a, b) => b[1].count - a[1].count).slice(0, 5))}.` : '',
    groupedErrors.length > 0 ? 'Fix the shared root cause behind each recurring error pattern.' : '',
    suppressedMap.size > 0 ? 'Run `npm run report:review` to review the suppressions and drop expired ones.' : '',
  ].filter(Boolean);
  const list = actions.length > 0 ? actions.map((action, index) => `${index + 1}. ${action}`) : ['No action needed. Keep collecting runs to confirm stability.'];
  return ['## Recommendations & Next Actions', '', ...list, ''];
}

/**
 * Bundle the four headline rates for a single run set: the two spec-file pass
 * rates plus the flaky result rate in its excl./incl. suppressed variants.
 * Reused to compute the same figures over the trunk-only run set and the
 * all-branches run set, so the report can contrast excl. vs incl. non-main.
 */
function computeBranchStats(runs, suppressedKeys, flakyKeys, flakyKeysAll) {
  const stats = computeSummaryStats(runs, suppressedKeys);
  stats.flakyResultRate = computeFlakyResultRate(runs, flakyKeys, suppressedKeys);
  stats.flakyResultRateAll = computeFlakyResultRate(runs, flakyKeysAll, new Set());
  return stats;
}

/**
 * Generate the markdown report.
 * @param {string} [generatedAt] ISO timestamp shown in the header — passed in so the report stays pure.
 */
function generateReport(runs, failMap, suppressedMap = new Map(), excludedRuns = [], generatedAt = 'N/A') {
  const totalRuns = runs.length;
  // The effectively-suppressed key set — lapsed suppressions are already absent.
  const suppressedKeys = new Set(suppressedMap.keys());
  const buckets = classifyBuckets(failMap, totalRuns);

  // Precise flaky-result rate: share of all spec-file executions that are flaky
  // failures, excluding suppressed items. Derived from the flaky bucket keys.
  const flakyKeys = new Set(buckets.flaky.map(([key]) => key));

  // Gross variant: the same rate without excluding suppressed test failures.
  // Reclassify over the full map (active + suppressed) so suppressed tests can
  // qualify as flaky, and count their occurrences too (empty suppressed set).
  // Suppressed whole-run incidents stay excluded — they are removed from the run
  // set upstream and are not test flakiness.
  const fullMap = new Map(failMap);
  for (const [key, { data }] of suppressedMap) fullMap.set(key, data);
  const flakyKeysAll = new Set(classifyBuckets(fullMap, totalRuns).flaky.map(([key]) => key));

  // Trunk-only (excl. non-main) is the PRIMARY target for the headline rates:
  // trunk health should not be diluted by in-development feature/PR-branch runs.
  // The all-branches (incl. non-main) figures are also computed for the Branch
  // breakdown comparison. Flaky classification stays global; only the run set the
  // rates are measured over changes. When no run is on main, the headline falls
  // back to all runs so the report is never empty.
  const allStats = computeBranchStats(runs, suppressedKeys, flakyKeys, flakyKeysAll);
  const mainRuns = runs.filter(isMainBranch);
  const hasMain = mainRuns.length > 0;
  const stats = hasMain ? computeBranchStats(mainRuns, suppressedKeys, flakyKeys, flakyKeysAll) : allStats;
  const nonMainRuns = runs.length - mainRuns.length;
  const branchBreakdown = {
    mainRuns: mainRuns.length,
    nonMainRuns,
    mainStats: stats,
    allStats,
    // Only worth contrasting when the run set actually mixes main and non-main.
    show: hasMain && nonMainRuns > 0,
    hasMain,
  };

  // Recency signals: catch tests that are failing *now* regardless of their
  // lifetime fail rate (a brand-new regression has a low overall rate).
  const recency = analyzeRecency(runs, failMap);
  const actionable = computeActionable(buckets.sorted, recency);
  const groupedErrors = groupErrorPatterns(buckets.sorted);

  const lines = [
    ...buildHeaderSection({ runs, branchBreakdown, generatedAt }),
    ...buildSummarySection({ failMap, buckets, actionable, stats }),
    ...buildQualityMetricsSection({ runs, buckets, stats, suppressedMap, excludedRuns, branchBreakdown, suppressedKeys }),
    ...buildFailedFlakySection({ failMap, buckets, actionable, recency, totalRuns, groupedErrors, suppressedMap, excludedRuns }),
    ...buildRecommendationsSection({ buckets, actionable, groupedErrors, suppressedMap }),
  ];

  return lines.join('\n');
}

function main() {
  console.log('Analyzing flaky tests...');
  console.log(`  Source: origin/${RESULTS_BRANCH}:${LEDGER_FILENAME}`);
  console.log(`  Output: ${OUTPUT_PATH}`);

  let runs = readLedger();

  if (ENV_FILTER) {
    const before = runs.length;
    const available = [...new Set(runs.map((r) => String(r.env || '').toLowerCase()).filter(Boolean))].toSorted((a, b) => a.localeCompare(b));
    runs = runs.filter((r) => String(r.env || '').toLowerCase() === ENV_FILTER);
    console.log(`  Filtering to env '${ENV_FILTER}' (${runs.length} of ${before} runs)`);
    if (runs.length === 0) {
      console.error(`No runs found for env '${ENV_FILTER}'. Available: ${available.join(', ') || 'none'}.`);
      process.exit(1);
    }
  }

  if (LAST_N > 0 && runs.length > LAST_N) {
    console.log(`  Limiting to last ${LAST_N} runs (${runs.length} total)`);
    runs = runs.slice(-LAST_N);
  }

  const { testSuppressions, runSuppressions, runCommits } = loadSuppressions();
  let excludedRuns = [];

  if (runCommits.size > 0) {
    const before = runs.length;
    excludedRuns = runs.filter((r) => runCommits.has(r.commit)).map((run) => ({ run, rule: runSuppressions.find((s) => s.commit === run.commit) || {} }));
    runs = runs.filter((r) => !runCommits.has(r.commit));
    const excluded = before - runs.length;
    if (excluded > 0) console.log(`  Excluded ${excluded} suppressed run(s)`);
  }

  const fullFailMap = aggregateFailures(runs);
  const { activeMap: failMap, suppressedMap } = partitionBySuppressions(fullFailMap, testSuppressions);
  const report = generateReport(runs, failMap, suppressedMap, excludedRuns, new Date().toISOString());

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

module.exports = {
  analyzeRecency,
  needsAction,
  aggregateFailures,
  generateReport,
  classify,
  loadSuppressions,
  matchesSuppression,
  partitionBySuppressions,
  failureKey,
  isFailureSuppressed,
  countActiveFailures,
  computeSummaryStats,
  computeFlakyResultRate,
  computeBranchStats,
  isMainBranch,
  MAIN_BRANCH,
};

if (require.main === module) main();
