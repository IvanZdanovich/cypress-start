#!/usr/bin/env node

/**
 * Requirement Coverage Scanner
 *
 * Scans JS requirement files (*.reqs.js) for all defined requirement IDs,
 * then scans spec files for [REQ-*] patterns in test titles and reports coverage.
 *
 * This replaces the previous approach of parsing Markdown files for requirement headings.
 * Requirement JS files are the single source of truth — no build step, always in sync.
 *
 * Usage:
 *   node scripts/scan-req-coverage.js
 *   node scripts/scan-req-coverage.js --format=markdown --output=reports/req-coverage.md
 *   node scripts/scan-req-coverage.js --priority=P1            # only check P1 requirements
 *   node scripts/scan-req-coverage.js --threshold=80           # fail if coverage below 80%
 *
 * Options:
 *   --format=<cli|markdown|both>   Output format (default: both)
 *   --output=<path>                Save markdown report to file
 *   --priority=<P1|P2|P3>         Filter by minimum priority (default: all)
 *   --threshold=<number>           Exit code 1 if coverage below percentage
 */

const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const REQS_GLOB = path.join(ROOT, 'cypress/support/requirements');
const SPEC_DIRS = [path.join(ROOT, 'cypress/integration-requirements'), path.join(ROOT, 'cypress/e2e-requirements')];

// ─── ANSI colours ─────────────────────────────────────────────────────────────

const c = {
  reset: '\x1b[0m',
  bold: '\x1b[1m',
  dim: '\x1b[2m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  cyan: '\x1b[36m',
  magenta: '\x1b[35m',
};
const col = (text, color) => `${c[color]}${text}${c.reset}`;

// ─── CLI args ─────────────────────────────────────────────────────────────────

function parseArgs() {
  const args = process.argv.slice(2);
  const parsed = { format: 'both', output: null, priority: null, threshold: null };
  for (const arg of args) {
    const [key, val] = arg.replace(/^--/, '').split('=');
    if (key === 'format') parsed.format = val;
    if (key === 'output') parsed.output = val;
    if (key === 'priority') parsed.priority = val;
    if (key === 'threshold') parsed.threshold = parseInt(val, 10);
  }
  return parsed;
}

// ─── File helpers ─────────────────────────────────────────────────────────────

function walkDir(dir, pattern) {
  if (!fs.existsSync(dir)) return [];
  const results = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      results.push(...walkDir(full, pattern));
    } else if (pattern.test(entry.name)) {
      results.push(full);
    }
  }
  return results;
}

// ─── Step 1: Collect all defined requirements ────────────────────────────────

/**
 * Primary: recursively walk a parsed JSON sidecar and collect all requirement
 * objects — identified by having an `id` matching /^REQ-[A-Z]+-\d+$/.
 * This handles template literals (already evaluated), bug fields, preconditions, etc.
 */
function extractRequirementsFromJson(jsonPath, jsRelative) {
  const data = JSON.parse(fs.readFileSync(jsonPath, 'utf8'));
  const reqs = [];

  function walk(obj) {
    if (!obj || typeof obj !== 'object' || Array.isArray(obj)) return;
    if (typeof obj.id === 'string' && /^REQ-[A-Z]+-\d+$/.test(obj.id)) {
      // Reconstruct a display endpoint from split method+path (new) or legacy endpoint string.
      const endpoint =
        obj.method && obj.path
          ? `${obj.method} ${obj.path}`
          : obj.endpoint || null;

      // Normalise bugs: accept array (new), string (old), or absent.
      const bugs = Array.isArray(obj.bugs)
        ? obj.bugs
        : obj.bugs
          ? [obj.bugs]
          : obj.bug
            ? [obj.bug]
            : [];

      reqs.push({
        id: obj.id,
        rule: obj.rule || '',
        priority: obj.priority || 'P3',
        endpoint,
        bugs,
        preconditions: Array.isArray(obj.preconditions) ? obj.preconditions : [],
        file: jsRelative,
      });
    } else {
      for (const val of Object.values(obj)) {
        walk(val);
      }
    }
  }

  walk(data);
  return reqs;
}

/**
 * Fallback: extract requirements from the raw JS source via regex.
 * Works for simple static string values. Template literals in `rule:` will
 * show the raw template text. Run `npm run req:export` to generate JSON sidecars
 * and get fully accurate rule text in reports.
 */
function extractRequirementsFromJs(filePath) {
  const content = fs.readFileSync(filePath, 'utf8');
  const reqs = [];

  // Match id: 'REQ-*' anchors and read the surrounding block for metadata.
  const idPattern = /id:\s*'(REQ-[A-Z]+-\d+)'/g;
  let idMatch;

  while ((idMatch = idPattern.exec(content)) !== null) {
    const id = idMatch[1];
    const after = content.slice(idMatch.index, idMatch.index + 600);

    // rule: 'text', rule: "text", or rule: `template` (raw, with ${...})
    const ruleRaw = after.match(/rule:\s*'([^']+)'/)?.[1] || after.match(/rule:\s*"([^"]+)"/)?.[1] || after.match(/rule:\s*`([^`]+)`/)?.[1] || '';
    const rule = ruleRaw.replace(/\$\{[^}]+\}/g, '…');

    const priority = after.match(/priority:\s*'(P[123])'/)?.[1] || 'P3';

    // New format: separate method + path fields.
    const method = after.match(/method:\s*HTTP_METHODS\.(\w+)/)?.[1] || after.match(/method:\s*'(GET|POST|PUT|PATCH|DELETE)'/)?.[1] || null;
    const pathVal = after.match(/path:\s*'([^']+)'/)?.[1] || null;
    // Legacy fallback: single endpoint field.
    const legacyEndpoint = after.match(/endpoint:\s*'([^']+)'/)?.[1] || null;
    const endpoint = method && pathVal ? `${method} ${pathVal}` : legacyEndpoint;

    // bugs can be an array literal or a string; also check legacy @bug JSDoc.
    const bugsArrayMatch = after.match(/bugs:\s*\[([^\]]+)\]/);
    const bugsStringMatch = after.match(/bugs:\s*'(BUG-[A-Z]+-\d+)'/);
    const windowBefore = content.slice(Math.max(0, idMatch.index - 400), idMatch.index);
    const bugInJsdoc = windowBefore.match(/@bug\s+(BUG-[A-Z]+-\d+)/)?.[1];
    let bugs = [];
    if (bugsArrayMatch) {
      bugs = [...bugsArrayMatch[1].matchAll(/'(BUG-[A-Z]+-\d+)'/g)].map((m) => m[1]);
    } else if (bugsStringMatch) {
      bugs = [bugsStringMatch[1]];
    } else if (bugInJsdoc) {
      bugs = [bugInJsdoc];
    }

    reqs.push({ id, rule, priority, endpoint, bugs, preconditions: [], file: path.relative(ROOT, filePath) });
  }

  return reqs;
}

function collectAllRequirements(reqsDir, priorityFilter) {
  const files = walkDir(reqsDir, /\.reqs\.js$/);
  const allReqs = [];
  let usingFallback = false;

  for (const file of files) {
    const jsonSidecar = file.replace('.reqs.js', '.reqs.json');
    if (fs.existsSync(jsonSidecar)) {
      allReqs.push(...extractRequirementsFromJson(jsonSidecar, path.relative(ROOT, file)));
    } else {
      usingFallback = true;
      allReqs.push(...extractRequirementsFromJs(file));
    }
  }

  if (usingFallback) {
    console.warn(col('  ⚠  JSON sidecar(s) missing — run `npm run req:export` for accurate rule text.\n', 'yellow'));
  }

  if (priorityFilter) {
    const order = { P1: 1, P2: 2, P3: 3 };
    return allReqs.filter((r) => order[r.priority] <= order[priorityFilter]);
  }

  return allReqs;
}

// ─── Step 2: Collect covered requirement IDs from spec files ──────────────────

/**
 * Scans spec files for patterns like [REQ-RB-010] inside it() titles.
 * Handles both template literals and plain strings.
 */
function extractCoveredIds(specDirs) {
  const covered = new Map(); // id → [{ file, title }]

  for (const dir of specDirs) {
    const files = walkDir(dir, /\.spec\.js$/);
    for (const file of files) {
      const content = fs.readFileSync(file, 'utf8');
      const relative = path.relative(ROOT, file);

      // Match it() blocks and extract [REQ-*] from their titles
      const itPattern = /\bit(?:\.skip|\.only)?\s*\(\s*[`'"](.*?)[`'"]/gs;
      let m;
      while ((m = itPattern.exec(content)) !== null) {
        const title = m[1];
        const reqIds = [...title.matchAll(/[[(]?(REQ-[A-Z]+-\d+)[)\]]?/g)].map((r) => r[1]);
        for (const id of reqIds) {
          if (!covered.has(id)) covered.set(id, []);
          covered.get(id).push({ file: relative, title });
        }
      }
    }
  }

  return covered;
}

// ─── Step 3: Build coverage report ───────────────────────────────────────────

function buildReport(allReqs, coveredMap) {
  const covered = [];
  const missing = [];

  for (const req of allReqs) {
    if (coveredMap.has(req.id)) {
      covered.push({ ...req, tests: coveredMap.get(req.id) });
    } else {
      missing.push(req);
    }
  }

  const percentage = allReqs.length === 0 ? 100 : Math.round((covered.length / allReqs.length) * 100);

  return { allReqs, covered, missing, percentage };
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function buildBar(pct) {
  const filled = Math.round(pct / 5);
  return '[' + '█'.repeat(filled) + '░'.repeat(20 - filled) + ']';
}

function groupBy(arr, fn) {
  return arr.reduce((acc, item) => {
    const key = fn(item);
    if (!acc[key]) acc[key] = [];
    acc[key].push(item);
    return acc;
  }, {});
}

// ─── Step 4: CLI output ───────────────────────────────────────────────────────

function printCli(report, priorityFilter) {
  const { allReqs, covered, missing, percentage } = report;
  const label = priorityFilter ? ` (${priorityFilter} only)` : '';

  console.log('\n' + col('═'.repeat(60), 'cyan'));
  console.log(col(' Requirement Coverage Report' + label, 'bold'));
  console.log(col('═'.repeat(60), 'cyan'));
  console.log(`  Total defined : ${col(String(allReqs.length), 'bold')}`);
  console.log(`  Covered       : ${col(String(covered.length), 'green')}`);
  console.log(`  Missing       : ${col(String(missing.length), missing.length > 0 ? 'red' : 'green')}`);

  const bar = buildBar(percentage);
  const pctColor = percentage >= 80 ? 'green' : percentage >= 50 ? 'yellow' : 'red';
  console.log(`  Coverage      : ${col(bar, pctColor)} ${col(percentage + '%', pctColor)}`);

  if (missing.length > 0) {
    console.log('\n' + col('  Missing Requirements', 'bold'));
    console.log(col('  ─'.repeat(30), 'dim'));
    const byPriority = groupBy(missing, (r) => r.priority);
    for (const [prio, reqs] of Object.entries(byPriority).sort()) {
      const color = prio === 'P1' ? 'red' : prio === 'P2' ? 'yellow' : 'dim';
      console.log(`\n  ${col(prio, color)} (${reqs.length})`);
      for (const req of reqs) {
        const bugNote = req.bugs && req.bugs.length ? col(` [${req.bugs.join(', ')}]`, 'magenta') : '';
        console.log(`    ${col(req.id, 'cyan')}${bugNote}  ${col(req.endpoint || '', 'dim')}`);
        console.log(`      ${col(req.rule, 'dim')}`);
      }
    }
  }

  console.log('\n' + col('═'.repeat(60), 'cyan') + '\n');
}

// ─── Step 5: Markdown output ──────────────────────────────────────────────────

function buildMarkdown(report, priorityFilter) {
  const { allReqs, covered, missing, percentage } = report;
  const label = priorityFilter ? ` (${priorityFilter}+ only)` : '';
  const now = new Date().toISOString().slice(0, 10);

  let md = `# Requirement Coverage Report${label}\n\n`;
  md += `> Generated: ${now}\n\n`;
  md += `| Metric | Value |\n|---|---|\n`;
  md += `| Total requirements | ${allReqs.length} |\n`;
  md += `| Covered | ${covered.length} |\n`;
  md += `| Missing | ${missing.length} |\n`;
  md += `| Coverage | **${percentage}%** |\n\n`;

  if (missing.length > 0) {
    md += `## Missing Coverage\n\n`;
    md += `| ID | Priority | Endpoint | Rule | Bugs |\n|---|---|---|---|---|\n`;
    for (const req of missing.sort((a, b) => a.id.localeCompare(b.id))) {
      const bug = req.bugs && req.bugs.length ? req.bugs.map((b) => `[${b}]`).join(' ') : '';
      md += `| \`${req.id}\` | ${req.priority} | \`${req.endpoint || ''}\` | ${req.rule} | ${bug} |\n`;
    }
    md += '\n';
  }

  if (covered.length > 0) {
    md += `## Covered Requirements\n\n`;
    md += `| ID | Priority | Endpoint | Tests |\n|---|---|---|---|\n`;
    for (const req of covered.sort((a, b) => a.id.localeCompare(b.id))) {
      const tests = req.tests.map((t) => `\`${path.basename(t.file)}\``).join(', ');
      md += `| \`${req.id}\` | ${req.priority} | \`${req.endpoint || ''}\` | ${tests} |\n`;
    }
    md += '\n';
  }

  return md;
}

// ─── Main ─────────────────────────────────────────────────────────────────────

function main() {
  const args = parseArgs();

  const allReqs = collectAllRequirements(REQS_GLOB, args.priority);
  if (allReqs.length === 0) {
    console.warn(col('\n  ⚠  No *.reqs.js files found in cypress/support/requirements/\n' + '     Create module requirement files following the JS-first pattern.\n', 'yellow'));
    process.exit(0);
  }

  const coveredMap = extractCoveredIds(SPEC_DIRS);
  const report = buildReport(allReqs, coveredMap);

  if (args.format === 'cli' || args.format === 'both') {
    printCli(report, args.priority);
  }

  if (args.format === 'markdown' || args.format === 'both') {
    const md = buildMarkdown(report, args.priority);
    if (args.output) {
      const outPath = path.resolve(ROOT, args.output);
      fs.mkdirSync(path.dirname(outPath), { recursive: true });
      fs.writeFileSync(outPath, md, 'utf8');
      console.log(col(`  ✔ Markdown report saved to ${args.output}`, 'green'));
    } else {
      console.log(md);
    }
  }

  if (args.threshold !== null && report.percentage < args.threshold) {
    console.error(col(`\n  ✖ Coverage ${report.percentage}% is below threshold ${args.threshold}%\n`, 'red'));
    process.exit(1);
  }
}

main();
