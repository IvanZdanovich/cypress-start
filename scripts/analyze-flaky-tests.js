#!/usr/bin/env node
/**
 * Analyze Flaky Tests
 *
 * Reads the persistent JSONL ledger from the orphan `test-results` branch
 * and identifies flaky tests — those that fail intermittently across runs.
 *
 * Outputs a markdown report to reports/flaky-tests.md.
 *
 * Usage:
 *   node scripts/analyze-flaky-tests.js [--output <path>] [--last <N>]
 *
 * Defaults:
 *   --output  reports/flaky-tests.md
 *   --last    0 (all runs; set a number to limit to the N most recent runs)
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

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

/**
 * Read and parse the JSONL ledger from the orphan branch.
 * @returns {Array<object>}
 */
function readLedger() {
  try {
    execSync(`git fetch origin ${RESULTS_BRANCH}`, { cwd: WORKSPACE, stdio: 'pipe' });
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
    content = execSync(`git show origin/${RESULTS_BRANCH}:${LEDGER_FILENAME}`, {
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
 * Escape pipe characters for markdown table cells.
 */
function escapeCell(text) {
  return String(text).replace(/\|/g, '\\|').replace(/\n/g, ' ');
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
function generateReport(runs, failMap) {
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

  const lines = [];

  lines.push('# Flaky Test Analysis Report');
  lines.push('');
  lines.push(`Generated: ${new Date().toISOString()}`);
  lines.push('');
  lines.push('## Summary');
  lines.push('');
  lines.push('| Metric | Value |');
  lines.push('| --- | --- |');
  lines.push(`| Runs analyzed | ${totalRuns} |`);
  lines.push(`| Period | ${firstRun.slice(0, 10)} to ${lastRun.slice(0, 10)} |`);
  lines.push(`| Overall pass rate | ${overallPassRate}% |`);
  lines.push(`| Unique failing tests | ${failMap.size} |`);
  lines.push(`| Flaky tests (10-79% fail rate) | ${flaky.length} |`);
  lines.push(`| Consistently failing (>=80%) | ${consistent.length} |`);
  lines.push(`| Rare failures (<10%) | ${rare.length} |`);
  lines.push('');
  lines.push('> Note: only the **first failure per spec file** is tracked — specs run with');
  lines.push('> `testIsolation: false`, so later tests depend on earlier ones and their failures');
  lines.push('> are unreliable. Fail rate is measured across recorded executions (each CI run, including');
  lines.push('> repeated runs of the same commit).');
  lines.push('');

  if (flaky.length > 0) {
    lines.push('## Flaky Tests');
    lines.push('');
    lines.push('First failure per spec file — tests within a file depend on previous ones.');
    lines.push('');
    lines.push('| Spec File | Context | it | Failures | Fail Rate | Last Failed | Error |');
    lines.push('| --- | --- | --- | --- | --- | --- | --- |');
    for (const [, data] of flaky) {
      const rate = ((data.count / totalRuns) * 100).toFixed(1);
      const ctx = escapeCell(data.context.join(' > '));
      const error = data.errors.length > 0 ? truncate(escapeCell(data.errors[0]), 80) : '';
      lines.push(`| ${escapeCell(data.file)} | ${ctx} | ${escapeCell(data.it)} | ${data.count}/${totalRuns} | ${rate}% | ${data.lastFailed.slice(0, 10)} | ${error} |`);
    }
    lines.push('');
  }

  if (consistent.length > 0) {
    lines.push('## Consistently Failing Tests');
    lines.push('');
    lines.push('First failure per spec file — fail in most runs, likely broken.');
    lines.push('');
    lines.push('| Spec File | Context | it | Failures | Fail Rate | Last Failed |');
    lines.push('| --- | --- | --- | --- | --- | --- |');
    for (const [, data] of consistent) {
      const rate = ((data.count / totalRuns) * 100).toFixed(1);
      const ctx = escapeCell(data.context.join(' > '));
      lines.push(`| ${escapeCell(data.file)} | ${ctx} | ${escapeCell(data.it)} | ${data.count}/${totalRuns} | ${rate}% | ${data.lastFailed.slice(0, 10)} |`);
    }
    lines.push('');
  }

  if (rare.length > 0) {
    lines.push('## Rare Failures');
    lines.push('');
    lines.push('First failure per spec file — failed once or twice, may be environment-related.');
    lines.push('');
    lines.push('| Spec File | Context | it | Failures | Last Failed | Error |');
    lines.push('| --- | --- | --- | --- | --- | --- |');
    for (const [, data] of rare) {
      const ctx = escapeCell(data.context.join(' > '));
      const error = data.errors.length > 0 ? truncate(escapeCell(data.errors[0]), 80) : '';
      lines.push(`| ${escapeCell(data.file)} | ${ctx} | ${escapeCell(data.it)} | ${data.count}/${totalRuns} | ${data.lastFailed.slice(0, 10)} | ${error} |`);
    }
    lines.push('');
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
  lines.push('| # | Date | Branch | Commit | Env | Passed | Failed | Total | Pass Rate |');
  lines.push('| --- | --- | --- | --- | --- | --- | --- | --- | --- |');

  const recentRuns = runs.slice(-20);
  for (let i = recentRuns.length - 1; i >= 0; i--) {
    const r = recentRuns[i];
    const runVerified = (r.stats?.total || 0) - (r.stats?.pending || 0) - (r.stats?.skipped || 0);
    const rate = runVerified > 0 ? (((r.stats?.passed || 0) / runVerified) * 100).toFixed(1) : '0';
    lines.push(`| ${runs.indexOf(r) + 1} | ${r.timestamp?.slice(0, 10) || ''} | ${escapeCell(r.branch || '')} | ${r.commit || ''} | ${r.env || ''} | ${r.stats?.passed || 0} | ${r.stats?.failed || 0} | ${r.stats?.total || 0} | ${rate}% |`);
  }
  lines.push('');

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

  const failMap = aggregateFailures(runs);
  const report = generateReport(runs, failMap);

  fs.mkdirSync(path.dirname(OUTPUT_PATH), { recursive: true });
  fs.writeFileSync(OUTPUT_PATH, report);

  const flaky = [...failMap.values()].filter((v) => classify(v.count, runs.length) === 'flaky');

  console.log('');
  console.log(`  Runs analyzed:     ${runs.length}`);
  console.log(`  Unique failures:   ${failMap.size}`);
  console.log(`  Flaky tests:       ${flaky.length}`);
  console.log('');
  console.log(`Report written to ${OUTPUT_PATH}`);
}

main();
