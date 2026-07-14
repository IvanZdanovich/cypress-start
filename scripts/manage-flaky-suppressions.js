#!/usr/bin/env node
/**
 * Interactive Flaky Suppressions Manager
 *
 * Presents current failures from the flaky-test ledger and lets you
 * interactively suppress or unsuppress them via arrow-key navigation.
 *
 * Usage:
 *   node scripts/manage-flaky-suppressions.js
 *   node scripts/manage-flaky-suppressions.js --add     (show unsuppressed failures to suppress)
 *   node scripts/manage-flaky-suppressions.js --remove  (show current suppressions to remove)
 *   node scripts/manage-flaky-suppressions.js --review  (review all — add/remove/expire)
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
    return { $schema: './flaky-suppressions.schema.json', suppressions: [] };
  }
  return JSON.parse(fs.readFileSync(SUPPRESSIONS_PATH, 'utf8'));
}

function saveSuppressionsFile(data) {
  fs.writeFileSync(SUPPRESSIONS_PATH, JSON.stringify(data, null, 2) + '\n', 'utf8');
}

// --- Interactive UI ---

function truncate(str, maxLen) {
  return str.length > maxLen ? str.slice(0, maxLen - 1) + '…' : str;
}

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

/**
 * Interactive list selector using raw TTY input.
 * Uses move-up + clear-below for reliable in-place rendering.
 * Returns indices of selected items.
 */
function interactiveSelect(items, renderItem, { title, multi = true, emptyMessage = 'No items.' }) {
  return new Promise((resolve) => {
    if (items.length === 0) {
      console.log(`\n  ${DIM}${emptyMessage}${RESET}\n`);
      resolve([]);
      return;
    }

    const CLEAR_BELOW = `${ESC}J`;

    const selected = new Set();
    let cursor = 0;
    let linesWritten = 0;
    const pageSize = Math.min(items.length, process.stdout.rows - 6);

    function getScrollWindow() {
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
      const { start, end } = getScrollWindow();

      // Move up to overwrite previous output, then clear below
      if (linesWritten > 0) {
        process.stdout.write(`${ESC}${linesWritten}A${CLEAR_BELOW}`);
      }

      const lines = [];
      lines.push(`  ${BOLD}${title}${RESET}  ${DIM}(↑↓ navigate, space toggle, enter confirm, q quit)${RESET}`);
      lines.push(`  ${DIM}${selected.size} selected of ${items.length} — select tests that share a common reason and ticket${RESET}`);
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
      linesWritten = lines.length;
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

// --- Commands ---

async function addSuppressions(runs) {
  const totalRuns = runs.length;
  const failMap = aggregateFailures(runs);
  const suppressions = loadSuppressions();
  const { activeMap } = partitionBySuppressions(failMap, suppressions);

  const failures = [...activeMap.entries()].sort((a, b) => b[1].count - a[1].count).map(([key, data]) => ({ key, data }));

  console.log(`\n  ${BOLD}Add Suppressions${RESET} — select failures to suppress\n`);

  const indices = await interactiveSelect(failures, (item) => formatFailure(item.data, totalRuns), { title: 'Unsuppressed failures', emptyMessage: 'No active failures to suppress.' });

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

  const indices = await interactiveSelect(fileData.suppressions, (item) => formatSuppression(item), { title: 'Current suppressions', emptyMessage: 'No suppressions defined.' });

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
  const suppressions = loadSuppressions();
  const { activeMap, suppressedMap } = partitionBySuppressions(failMap, suppressions);
  const flaky = [...activeMap.values()].filter((v) => classify(v.count, totalRuns) === 'flaky');

  console.log(`\n  ${BOLD}Status Summary${RESET}`);
  console.log(`  ─────────────────────────────────────`);
  console.log(`  Active failures:    ${activeMap.size}`);
  console.log(`  Suppressed:         ${suppressedMap.size}`);
  console.log(`  Flaky (unsuppressed): ${flaky.length}`);
  console.log(`  Total suppressions: ${fileData.suppressions.length}`);
  console.log('');

  const action = await prompt('Action: (a)dd suppressions, (r)emove suppressions, (q)uit', 'q');

  if (action === 'a') {
    await addSuppressions(runs);
  } else if (action === 'r') {
    await removeSuppressions();
  }
}

// --- Main ---

async function main() {
  const mode = process.argv.includes('--remove') ? 'remove' : process.argv.includes('--review') ? 'review' : 'add';

  console.log(`  ${BOLD}Flaky Test Suppressions Manager${RESET}`);
  console.log(`  ${DIM}Mode: ${mode}${RESET}`);

  if (mode === 'remove') {
    await removeSuppressions();
    return;
  }

  console.log(`  ${DIM}Loading ledger from test-results branch...${RESET}`);
  const runs = loadLedger();
  console.log(`  ${DIM}${runs.length} runs loaded.${RESET}`);

  if (mode === 'add') {
    await addSuppressions(runs);
  } else {
    await reviewSuppressions(runs);
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
