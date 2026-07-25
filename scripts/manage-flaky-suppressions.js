#!/usr/bin/env node
/**
 * Interactive Flaky Suppressions Manager
 *
 * Presents current failures from the flaky-test ledger and lets you
 * interactively suppress or unsuppress them via arrow-key navigation.
 *
 * Usage:
 *   node scripts/manage-flaky-suppressions.js
 *   node scripts/manage-flaky-suppressions.js --add          (show unsuppressed failures to suppress)
 *   node scripts/manage-flaky-suppressions.js --remove       (show current suppressions to remove)
 *   node scripts/manage-flaky-suppressions.js --add-runs     (select compromised runs to suppress)
 *   node scripts/manage-flaky-suppressions.js --remove-runs  (remove existing run suppressions)
 *   node scripts/manage-flaky-suppressions.js --review       (review all — add/remove/expire)
 *
 * In consoles that don't support cursor/clear ANSI sequences (e.g. some IDE
 * "Run" windows), falls back automatically to a plain numbered prompt.
 * Set NO_INTERACTIVE_UI=1 to force this fallback manually.
 *
 * No external dependencies — uses Node.js built-in readline and TTY APIs.
 */

const fs = require('fs');
const path = require('path');
const readline = require('readline');

const SUPPRESSIONS_PATH = path.resolve(__dirname, 'flaky-suppressions.json');
const { aggregateFailures, loadSuppressions, partitionBySuppressions, classify } = require('./analyze-flaky-tests');

// --- ANSI helpers ---
const ESC = '\x1b[';
const HIDE_CURSOR = `${ESC}?25l`;
const SHOW_CURSOR = `${ESC}?25h`;
const BOLD = `${ESC}1m`;
const DIM = `${ESC}2m`;
const RESET = `${ESC}0m`;
const RED = `${ESC}31m`;
const GREEN = `${ESC}32m`;
const YELLOW = `${ESC}33m`;
const CYAN = `${ESC}36m`;
// 2J clears the visible viewport; 3J additionally purges scrollback (xterm
// extension). Without 3J, content that has already scrolled out of view
// (e.g. a banner printed before the list, or an earlier oversized frame)
// stays in history and resurfaces as "duplicated" text above the freshly
// cleared viewport.
const CLEAR_SCREEN = `${ESC}2J${ESC}3J${ESC}H`;

// --- Data loading ---

function loadLedger() {
  const { execSync } = require('child_process');
  const WORKSPACE = process.cwd();
  const RESULTS_BRANCH = 'test-results';
  const LEDGER_FILENAME = 'test-run-history.jsonl';

  try {
    execSync(`git fetch origin ${RESULTS_BRANCH}`, { cwd: WORKSPACE, stdio: 'pipe' });
  } catch {
    console.error('Cannot fetch test-results branch. Ensure git credentials are configured.');
    process.exit(1);
  }

  let content;
  try {
    content = execSync(`git show origin/${RESULTS_BRANCH}:${LEDGER_FILENAME}`, { cwd: WORKSPACE, encoding: 'utf8' });
  } catch {
    console.error('Ledger file not found on test-results branch.');
    process.exit(1);
  }

  return content
    .split('\n')
    .filter(Boolean)
    .map((line) => {
      try {
        return JSON.parse(line);
      } catch {
        return null;
      }
    })
    .filter(Boolean);
}

function loadSuppressionsFile() {
  if (!fs.existsSync(SUPPRESSIONS_PATH)) {
    return { $schema: './flaky-suppressions.schema.json', suppressions: [], runSuppressions: [] };
  }
  const data = JSON.parse(fs.readFileSync(SUPPRESSIONS_PATH, 'utf8'));
  if (!data.runSuppressions) data.runSuppressions = [];
  return data;
}

function saveSuppressionsFile(data) {
  fs.writeFileSync(SUPPRESSIONS_PATH, JSON.stringify(data, null, 2) + '\n', 'utf8');
}

// --- Helpers ---

function truncate(str, maxLen) {
  return str.length > maxLen ? str.slice(0, maxLen - 1) + '…' : str;
}

/**
 * True only when stdin/stdout are attached to a real interactive terminal
 * that supports raw mode. IDE "Run" consoles and piped output often report
 * as non-TTY (or lack setRawMode) — in that case cursor movement/clear codes
 * are not honoured and simply get appended as-is, producing duplicated
 * frames. Fall back to a plain prompt in that case.
 *
 * Respects NO_INTERACTIVE_UI as a manual override for environments that
 * misreport their capabilities.
 */
function isInteractiveTTY() {
  if (process.env.NO_INTERACTIVE_UI === '1') return false;
  return Boolean(process.stdout.isTTY && process.stdin.isTTY && typeof process.stdin.setRawMode === 'function');
}

// --- Formatters ---

function formatFailure(data, totalRuns) {
  const rate = ((data.count / totalRuns) * 100).toFixed(1);
  const file = path.basename(data.file);
  return `${file}  ${DIM}${truncate(data.it, 60)}${RESET}  ${YELLOW}${rate}%${RESET} (${data.count}/${totalRuns})`;
}

function formatSuppression(entry) {
  const file = path.basename(entry.file);
  const expires = entry.expiresAt ? `  ${DIM}expires ${entry.expiresAt}${RESET}` : '';
  return `${file}  ${DIM}${truncate(entry.it, 50)}${RESET}  ${CYAN}${entry.ticket}${RESET}${expires}`;
}

function formatRun(run, idx, totalRuns) {
  const num = totalRuns - idx;
  const date = (run.timestamp || '').slice(0, 10);
  const branch = truncate(run.branch || 'unknown', 30);
  const commit = run.commit || 'N/A';
  const env = run.env || 'N/A';
  const passed = run.stats?.passed ?? '?';
  const failed = run.stats?.failed ?? '?';
  const total = run.stats?.total ?? '?';
  const failColour = failed > 0 ? RED : GREEN;
  return `${DIM}#${num}${RESET} ${date} ${CYAN}${branch}${RESET}@${DIM}${commit}${RESET} (${env}) ${GREEN}${passed}✓${RESET} ${failColour}${failed}✗${RESET}/${total}`;
}

function formatRunSuppression(entry) {
  return `${CYAN}${entry.commit}${RESET}  ${DIM}${entry.reason}${RESET}  ${YELLOW}${entry.ticket}${RESET}${entry.suppressedAt ? `  ${DIM}added ${entry.suppressedAt}${RESET}` : ''}`;
}

// --- Interactive UI ---

/**
 * Prompt for a single line of text input.
 */
function prompt(question, defaultValue = '') {
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
  const suffix = defaultValue ? ` ${DIM}(${defaultValue})${RESET}` : '';
  return new Promise((resolve) => {
    rl.question(`  ${question}${suffix}: `, (answer) => {
      rl.close();
      resolve(answer.trim() || defaultValue);
    });
  });
}

/**
 * Fallback selector for non-TTY consoles (e.g. IDE "Run" windows) that don't
 * honour cursor-control ANSI sequences. Prints the list once and prompts for
 * comma-separated indices instead of redrawing in place.
 */
async function selectFallback(items, renderItem, { title, hint, emptyMessage }) {
  if (items.length === 0) {
    console.log(`\n  ${DIM}${emptyMessage}${RESET}\n`);
    return [];
  }

  console.log(`\n  ${BOLD}${title}${RESET}  ${DIM}(${hint})${RESET}\n`);
  items.forEach((item, i) => {
    console.log(`  ${DIM}[${i + 1}]${RESET} ${renderItem(item, i)}`);
  });

  const answer = await prompt('Enter numbers to select (comma-separated), or blank for none', '');
  if (!answer) return [];

  return answer
    .split(',')
    .map((s) => parseInt(s.trim(), 10) - 1)
    .filter((i) => Number.isInteger(i) && i >= 0 && i < items.length);
}

/**
 * Interactive list selector using raw TTY input.
 * Fully clears the screen and redraws each frame from scratch — avoids
 * relative cursor-movement bugs from line wraps, terminal scrolling, or resizes.
 * Falls back to a plain numbered prompt when stdin/stdout aren't a real TTY,
 * since cursor-control ANSI sequences are not honoured there and simply get
 * appended as duplicated frames instead of redrawing in place.
 * Returns indices of selected items.
 */
function interactiveSelect(items, renderItem, { title, hint = 'select items that share a common reason and ticket', multi = true, emptyMessage = 'No items.' }) {
  if (!isInteractiveTTY()) {
    return selectFallback(items, renderItem, { title, hint, emptyMessage });
  }

  return new Promise((resolve) => {
    if (items.length === 0) {
      console.log(`\n  ${DIM}${emptyMessage}${RESET}\n`);
      resolve([]);
      return;
    }

    const selected = new Set();
    let cursor = 0;

    function getPageSize() {
      const rows = Number.isInteger(process.stdout.rows) ? process.stdout.rows : 24;
      return Math.max(1, Math.min(items.length, rows - 6));
    }

    function getScrollWindow(pageSize) {
      const half = Math.floor(pageSize / 2);
      let start = Math.max(0, cursor - half);
      let end = start + pageSize;
      if (end > items.length) {
        end = items.length;
        start = Math.max(0, end - pageSize);
      }
      return { start, end };
    }

    function render() {
      const pageSize = getPageSize();
      const { start, end } = getScrollWindow(pageSize);

      // Full clear + cursor-home avoids any dependency on tracking previous
      // line counts, which is fragile across wraps, scrolls, and resizes.
      process.stdout.write(CLEAR_SCREEN);

      const cols = Number.isInteger(process.stdout.columns) ? process.stdout.columns : 80;
      const maxLen = Math.max(10, cols - 2);

      const lines = [];
      lines.push(`  ${BOLD}${truncate(title, maxLen)}${RESET}`);
      lines.push(`  ${DIM}${truncate('↑↓ navigate · space toggle · enter confirm · q quit', maxLen)}${RESET}`);
      lines.push(`  ${DIM}${truncate(`${selected.size} selected of ${items.length} — ${hint}`, maxLen)}${RESET}`);
      lines.push('');

      for (let i = start; i < end; i++) {
        const isCursor = i === cursor;
        const isSelected = selected.has(i);
        const marker = isSelected ? `${GREEN}◉${RESET}` : `${DIM}○${RESET}`;
        const pointer = isCursor ? `${CYAN}▸${RESET}` : ' ';
        const content = renderItem(items[i], i);
        lines.push(`  ${pointer} ${marker} ${content}`);
      }

      if (items.length > pageSize) {
        lines.push(`  ${DIM}… ${items.length - pageSize} more (scroll)${RESET}`);
      }

      process.stdout.write(lines.join('\n') + '\n');
    }

    process.stdout.write(HIDE_CURSOR);
    process.stdin.setRawMode(true);
    process.stdin.resume();
    process.stdin.setEncoding('utf8');

    render();

    function cleanup() {
      process.stdin.setRawMode(false);
      process.stdin.pause();
      process.stdout.write(SHOW_CURSOR);
    }

    process.stdin.on('data', (key) => {
      if (key === '\x03') {
        cleanup();
        process.exit(0);
      }
      if (key === 'q') {
        cleanup();
        resolve([]);
        return;
      }
      if (key === '\r' || key === '\n') {
        cleanup();
        resolve([...selected]);
        return;
      }

      if (key === ' ') {
        if (multi) {
          if (selected.has(cursor)) {
            selected.delete(cursor);
          } else {
            selected.add(cursor);
          }
        } else {
          selected.clear();
          selected.add(cursor);
        }
      } else if (key === '\x1b[A') {
        cursor = Math.max(0, cursor - 1);
      } else if (key === '\x1b[B') {
        cursor = Math.min(items.length - 1, cursor + 1);
      } else {
        return;
      }

      render();
    });
  });
}

// --- Commands ---

async function addSuppressions(runs) {
  const totalRuns = runs.length;
  const failMap = aggregateFailures(runs);
  const { testSuppressions } = loadSuppressions();
  const { activeMap } = partitionBySuppressions(failMap, testSuppressions);

  const failures = [...activeMap.entries()].sort((a, b) => b[1].count - a[1].count).map(([key, data]) => ({ key, data }));

  console.log(`\n  ${BOLD}Add Suppressions${RESET} — select failures to suppress\n`);

  const indices = await interactiveSelect(failures, (item) => formatFailure(item.data, totalRuns), { title: 'Unsuppressed failures', hint: 'select tests that share a common reason and ticket', emptyMessage: 'No active failures to suppress.' });

  if (indices.length === 0) {
    console.log(`  ${DIM}No selections made.${RESET}`);
    return;
  }

  const ticket = await prompt('Ticket/Bug ID (e.g. BUG-UI-3, A65-1234)');
  const reason = await prompt('Reason', 'Known issue under investigation');
  const expiresIn = await prompt('Expires in days (empty = no expiry)', '');
  const today = new Date().toISOString().slice(0, 10);
  let expiresAt = null;
  if (expiresIn && !isNaN(parseInt(expiresIn, 10))) {
    const d = new Date();
    d.setDate(d.getDate() + parseInt(expiresIn, 10));
    expiresAt = d.toISOString().slice(0, 10);
  }

  const fileData = loadSuppressionsFile();

  for (const idx of indices) {
    const { data } = failures[idx];
    const entry = {
      file: data.file,
      it: data.it,
      reason,
      ticket,
      suppressedAt: today,
    };
    if (data.context.length > 0) {
      entry.context = data.context.join(' > ');
    }
    if (expiresAt) {
      entry.expiresAt = expiresAt;
    }
    fileData.suppressions.push(entry);
  }

  saveSuppressionsFile(fileData);
  console.log(`\n  ${GREEN}✓${RESET} Added ${indices.length} suppression(s) to flaky-suppressions.json\n`);
}

async function removeSuppressions() {
  const fileData = loadSuppressionsFile();

  if (fileData.suppressions.length === 0) {
    console.log(`\n  ${DIM}No suppressions to remove.${RESET}\n`);
    return;
  }

  console.log(`\n  ${BOLD}Remove Suppressions${RESET} — select entries to unsuppress\n`);

  const indices = await interactiveSelect(fileData.suppressions, (item) => formatSuppression(item), { title: 'Current suppressions', hint: 'select suppressions to remove', emptyMessage: 'No suppressions defined.' });

  if (indices.length === 0) {
    console.log(`  ${DIM}No selections made.${RESET}`);
    return;
  }

  // Remove in reverse order to preserve indices
  const sorted = [...indices].sort((a, b) => b - a);
  for (const idx of sorted) {
    fileData.suppressions.splice(idx, 1);
  }

  saveSuppressionsFile(fileData);
  console.log(`\n  ${GREEN}✓${RESET} Removed ${indices.length} suppression(s) from flaky-suppressions.json\n`);
}

async function addRunSuppressions(runs) {
  console.log(`\n  ${BOLD}Suppress Runs${RESET} — select compromised runs to exclude from all stats\n`);

  // Most recent first so the likely-bad runs appear at the top
  const displayed = [...runs].reverse();

  const indices = await interactiveSelect(displayed, (run, idx) => formatRun(run, idx, runs.length), { title: 'Recent runs (newest first)', hint: 'select compromised runs to exclude from stats', emptyMessage: 'No runs in ledger.' });

  if (indices.length === 0) {
    console.log(`  ${DIM}No selections made.${RESET}`);
    return;
  }

  const ticket = await prompt('Ticket/Incident ID (e.g. OPS-42, A65-1234)');
  const reason = await prompt('Reason', 'CI environment outage — run not representative');
  const today = new Date().toISOString().slice(0, 10);

  const fileData = loadSuppressionsFile();

  const alreadySuppressed = new Set((fileData.runSuppressions || []).map((r) => r.commit));
  let added = 0;

  for (const idx of indices) {
    const run = displayed[idx];
    if (!run.commit || run.commit === 'unknown') {
      console.log(`  ${YELLOW}⚠${RESET}  Skipped run with unknown commit SHA`);
      continue;
    }
    if (alreadySuppressed.has(run.commit)) {
      console.log(`  ${DIM}Already suppressed: ${run.commit}${RESET}`);
      continue;
    }
    fileData.runSuppressions.push({ commit: run.commit, reason, ticket, suppressedAt: today });
    alreadySuppressed.add(run.commit);
    added++;
  }

  saveSuppressionsFile(fileData);
  console.log(`\n  ${GREEN}✓${RESET} Added ${added} run suppression(s) to flaky-suppressions.json\n`);
}

async function removeRunSuppressions() {
  const fileData = loadSuppressionsFile();

  if (!fileData.runSuppressions || fileData.runSuppressions.length === 0) {
    console.log(`\n  ${DIM}No run suppressions to remove.${RESET}\n`);
    return;
  }

  console.log(`\n  ${BOLD}Remove Run Suppressions${RESET} — select entries to restore\n`);

  const indices = await interactiveSelect(fileData.runSuppressions, (entry) => formatRunSuppression(entry), { title: 'Current run suppressions', hint: 'select run suppressions to remove', emptyMessage: 'No run suppressions defined.' });

  if (indices.length === 0) {
    console.log(`  ${DIM}No selections made.${RESET}`);
    return;
  }

  const sorted = [...indices].sort((a, b) => b - a);
  for (const idx of sorted) {
    fileData.runSuppressions.splice(idx, 1);
  }

  saveSuppressionsFile(fileData);
  console.log(`\n  ${GREEN}✓${RESET} Removed ${indices.length} run suppression(s) from flaky-suppressions.json\n`);
}

async function reviewSuppressions(runs) {
  const fileData = loadSuppressionsFile();
  const today = new Date().toISOString().slice(0, 10);

  // Check for expired suppressions
  const expired = fileData.suppressions.filter((s) => s.expiresAt && s.expiresAt < today);

  if (expired.length > 0) {
    console.log(`\n  ${YELLOW}⚠${RESET}  ${expired.length} suppression(s) have expired:\n`);
    for (const s of expired) {
      console.log(`    ${RED}✕${RESET} ${path.basename(s.file)} — ${DIM}${s.it}${RESET}  ${RED}expired ${s.expiresAt}${RESET}`);
    }
    const action = await prompt('Remove expired? (y/n)', 'y');
    if (action.toLowerCase() === 'y') {
      fileData.suppressions = fileData.suppressions.filter((s) => !s.expiresAt || s.expiresAt >= today);
      saveSuppressionsFile(fileData);
      console.log(`  ${GREEN}✓${RESET} Removed ${expired.length} expired suppression(s)\n`);
    }
  }

  // Show current status summary
  const totalRuns = runs.length;
  const failMap = aggregateFailures(runs);
  const { testSuppressions, runCommits } = loadSuppressions();
  const { activeMap, suppressedMap } = partitionBySuppressions(failMap, testSuppressions);
  const flaky = [...activeMap.values()].filter((v) => classify(v.count, totalRuns) === 'flaky');

  console.log(`\n  ${BOLD}Status Summary${RESET}`);
  console.log(`  ─────────────────────────────────────`);
  console.log(`  Runs in ledger:         ${totalRuns}`);
  console.log(`  Suppressed runs:        ${runCommits.size}`);
  console.log(`  Active failures:        ${activeMap.size}`);
  console.log(`  Suppressed tests:       ${suppressedMap.size}`);
  console.log(`  Flaky (unsuppressed):   ${flaky.length}`);
  console.log('');

  const action = await prompt('Action: (a)dd test suppressions, (r)emove test suppressions, (A)dd run suppressions, (R)emove run suppressions, (q)uit', 'q');

  if (action === 'a') {
    await addSuppressions(runs);
  } else if (action === 'r') {
    await removeSuppressions();
  } else if (action === 'A') {
    await addRunSuppressions(runs);
  } else if (action === 'R') {
    await removeRunSuppressions();
  }
}

// --- Main ---

async function main() {
  const argv = process.argv;
  const mode = argv.includes('--remove-runs') ? 'remove-runs' : argv.includes('--add-runs') ? 'add-runs' : argv.includes('--remove') ? 'remove' : argv.includes('--review') ? 'review' : 'add';

  console.log(`  ${BOLD}Flaky Test Suppressions Manager${RESET}`);
  console.log(`  ${DIM}Mode: ${mode}${RESET}`);

  if (mode === 'remove') {
    await removeSuppressions();
    return;
  }

  if (mode === 'remove-runs') {
    await removeRunSuppressions();
    return;
  }

  console.log(`  ${DIM}Loading ledger from test-results branch...${RESET}`);
  const runs = loadLedger();
  console.log(`  ${DIM}${runs.length} runs loaded.${RESET}`);

  if (mode === 'add') {
    await addSuppressions(runs);
  } else if (mode === 'add-runs') {
    await addRunSuppressions(runs);
  } else {
    await reviewSuppressions(runs);
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
