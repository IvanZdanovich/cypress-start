#!/usr/bin/env node

/**
 * Extract Requirements from Spec Files
 *
 * Parses spec files for it() blocks with { req: { p, desc, bugs, example } }
 * config objects and generates structured requirements in JSON, YAML, or Markdown.
 *
 * The spec IS the requirement — no separate .reqs.js files needed.
 *
 * Traceability chain:
 *   constraints.js (boundary values) → examples.js (named examples) → spec.js (it + req)
 *                                         ↑                                   |
 *                                         └── linked via req.example ──────────┘
 *
 * Usage:
 *   node scripts/extract-reqs-from-specs.js                          # JSON to stdout
 *   node scripts/extract-reqs-from-specs.js --format=yaml            # YAML to stdout
 *   node scripts/extract-reqs-from-specs.js --format=markdown        # Markdown to stdout
 *   node scripts/extract-reqs-from-specs.js --output=reports/reqs.json
 *   node scripts/extract-reqs-from-specs.js --format=yaml --output=reports/requirements.yaml
 *   node scripts/extract-reqs-from-specs.js --format=markdown --output=reports/requirements.md
 *   node scripts/extract-reqs-from-specs.js --priority=P1            # filter by priority
 */

const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const SPEC_DIRS = [path.join(ROOT, 'cypress/integration/api'), path.join(ROOT, 'cypress/integration/ui'), path.join(ROOT, 'cypress/e2e/ui')];

// ─── CLI args ─────────────────────────────────────────────────────────────────

function parseArgs() {
  const args = process.argv.slice(2);
  const parsed = { format: 'json', output: null, priority: null };
  for (const arg of args) {
    const [key, val] = arg.replace(/^--/, '').split('=');
    if (key === 'format') parsed.format = val;
    if (key === 'output') parsed.output = val;
    if (key === 'priority') parsed.priority = val;
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

// ─── Parsers ──────────────────────────────────────────────────────────────────

/**
 * Parse title prefix: Module.Sub.Operation.METHOD
 */
function parsePrefix(prefix) {
  const parts = prefix.split('.');
  return {
    module: parts[0] || null,
    submodule: parts[1] || null,
    operation: parts[2] || null,
    method: parts[3] || null,
  };
}

/**
 * Extract { req: { ... } } config from text near an it() call.
 * Uses regex since we want to avoid requiring an AST parser dependency.
 */
function extractReqConfig(textAfterIt) {
  const reqStart = textAfterIt.indexOf('req:');
  if (reqStart === -1) return null;

  // Find the opening { after req:
  const braceStart = textAfterIt.indexOf('{', reqStart + 4);
  if (braceStart === -1) return null;

  // Match balanced braces
  let depth = 0;
  let braceEnd = -1;
  for (let i = braceStart; i < textAfterIt.length; i++) {
    if (textAfterIt[i] === '{') depth++;
    if (textAfterIt[i] === '}') depth--;
    if (depth === 0) {
      braceEnd = i;
      break;
    }
  }
  if (braceEnd === -1) return null;

  const reqBlock = textAfterIt.slice(braceStart, braceEnd + 1);

  // Extract fields via regex
  const p = reqBlock.match(/p:\s*'(P[123])'/)?.[1] || null;
  const desc = reqBlock.match(/desc:\s*'([^']+)'/)?.[1] || reqBlock.match(/desc:\s*"([^"]+)"/)?.[1] || null;
  const example = reqBlock.match(/example:\s*'([^']+)'/)?.[1] || null;

  // Extract bugs array
  const bugsMatch = reqBlock.match(/bugs:\s*\[([^\]]+)\]/);
  const bugs = bugsMatch ? [...bugsMatch[1].matchAll(/'(BUG-[A-Z]+-\d{3})'/g)].map((m) => m[1]) : [];

  // Extract preconditions array
  const preMatch = reqBlock.match(/preconditions:\s*\[([^\]]+)\]/);
  const preconditions = preMatch ? [...preMatch[1].matchAll(/'([^']+)'/g)].map((m) => m[1]) : [];

  return { p, desc, bugs, example, preconditions };
}

/**
 * Extract all requirements from a single spec file.
 */
function extractFromFile(filePath) {
  const content = fs.readFileSync(filePath, 'utf8');
  const relative = path.relative(ROOT, filePath);
  const requirements = [];

  // Extract describe-level preconditions
  const describeMatch = content.match(/describe\s*\(\s*'([^']+)'/);
  const describePrecondition = describeMatch ? describeMatch[1].replace(/^.+: Given /, '') : '';

  // Collect context titles for When conditions
  const contextPattern = /\bcontext(?:\.skip)?\s*\(\s*'([^']+)'/g;
  const contexts = [];
  let ctxMatch;
  while ((ctxMatch = contextPattern.exec(content)) !== null) {
    const ctxTitle = ctxMatch[1];
    const colonIdx = ctxTitle.indexOf(': When ');
    if (colonIdx === -1) continue;
    contexts.push({
      index: ctxMatch.index,
      prefix: ctxTitle.slice(0, colonIdx),
      when: ctxTitle.slice(colonIdx + 7),
    });
  }

  // Match it() blocks
  const itPattern = /\bit(?:\.skip|\.only)?\s*\(\s*'([^']+)'/g;
  let match;

  while ((match = itPattern.exec(content)) !== null) {
    const title = match[1];
    const itIndex = match.index;

    // Parse title prefix and rule
    const colonIdx = title.indexOf(': Then ');
    if (colonIdx === -1) continue;

    const prefix = title.slice(0, colonIdx);
    const rule = title.slice(colonIdx + 7);
    const parsed = parsePrefix(prefix);

    // Find the closest preceding context
    const parentContext = contexts.filter((c) => c.index < itIndex).pop();
    const when = parentContext ? parentContext.when : '';

    // Extract req config from text after the title
    const afterTitle = content.slice(itIndex, itIndex + 1500);
    const req = extractReqConfig(afterTitle);

    // Check for skipped
    const isSkipped = /\bit\.skip\s*\(/.test(content.slice(Math.max(0, itIndex - 5), itIndex + 10));

    requirements.push({
      module: parsed.module,
      submodule: parsed.submodule,
      operation: parsed.operation,
      method: parsed.method,
      when,
      rule,
      priority: req?.p || 'UNSET',
      description: req?.desc || rule,
      bugs: req?.bugs || [],
      example: req?.example || null,
      preconditions: req?.preconditions || [],
      file: relative,
      title,
      precondition: describePrecondition,
      skipped: isSkipped,
    });
  }

  return requirements;
}

// ─── Formatters ───────────────────────────────────────────────────────────────

function toJson(reqs) {
  const grouped = {};
  for (const req of reqs) {
    const key = [req.module, req.submodule].filter(Boolean).join('.');
    if (!grouped[key]) grouped[key] = { precondition: req.precondition, requirements: [] };
    grouped[key].requirements.push({
      operation: req.operation,
      method: req.method,
      priority: req.priority,
      rule: req.rule,
      description: req.description !== req.rule ? req.description : undefined,
      when: req.when,
      example: req.example || undefined,
      bugs: req.bugs.length > 0 ? req.bugs : undefined,
      preconditions: req.preconditions.length > 0 ? req.preconditions : undefined,
      skipped: req.skipped || undefined,
    });
  }
  return JSON.stringify(grouped, null, 2);
}

function toYaml(reqs) {
  const grouped = {};
  for (const req of reqs) {
    const key = [req.module, req.submodule].filter(Boolean).join('.');
    if (!grouped[key]) grouped[key] = { precondition: req.precondition, requirements: [] };
    grouped[key].requirements.push(req);
  }

  let yaml = '# Requirements — auto-generated from spec files\n';
  yaml += `# Generated: ${new Date().toISOString().slice(0, 10)}\n\n`;

  for (const [group, data] of Object.entries(grouped)) {
    yaml += `${group}:\n`;
    yaml += `  precondition: "${data.precondition}"\n`;
    yaml += `  requirements:\n`;
    for (const req of data.requirements) {
      yaml += `    - operation: ${req.operation || 'N/A'}\n`;
      yaml += `      method: ${req.method || 'N/A'}\n`;
      yaml += `      priority: ${req.priority}\n`;
      yaml += `      when: "${req.when}"\n`;
      yaml += `      rule: "${req.rule}"\n`;
      if (req.description !== req.rule) {
        yaml += `      description: "${req.description}"\n`;
      }
      if (req.example) {
        yaml += `      example: "${req.example}"\n`;
      }
      if (req.bugs.length > 0) {
        yaml += `      bugs:\n`;
        for (const bug of req.bugs) {
          yaml += `        - ${bug}\n`;
        }
      }
      if (req.preconditions.length > 0) {
        yaml += `      preconditions:\n`;
        for (const pre of req.preconditions) {
          yaml += `        - "${pre}"\n`;
        }
      }
      if (req.skipped) {
        yaml += `      skipped: true\n`;
      }
    }
    yaml += '\n';
  }
  return yaml;
}

function toMarkdown(reqs) {
  const now = new Date().toISOString().slice(0, 10);
  let md = `# Requirements\n\n> Auto-generated from spec files — ${now}\n\n`;

  const total = reqs.length;
  const byP = { P1: 0, P2: 0, P3: 0, UNSET: 0 };
  const withBugs = reqs.filter((r) => r.bugs.length > 0).length;
  const withExamples = reqs.filter((r) => r.example).length;
  for (const r of reqs) byP[r.priority] = (byP[r.priority] || 0) + 1;

  md += `## Summary\n\n`;
  md += `| Metric | Count |\n|---|---|\n`;
  md += `| Total requirements | ${total} |\n`;
  md += `| P1 Critical | ${byP.P1} |\n`;
  md += `| P2 Important | ${byP.P2} |\n`;
  md += `| P3 Nice-to-have | ${byP.P3} |\n`;
  if (byP.UNSET) md += `| ⚠️ No priority set | ${byP.UNSET} |\n`;
  md += `| With known bugs | ${withBugs} |\n`;
  md += `| With linked examples | ${withExamples} |\n\n`;

  const grouped = {};
  for (const req of reqs) {
    const key = [req.module, req.submodule].filter(Boolean).join('.');
    if (!grouped[key]) grouped[key] = [];
    grouped[key].push(req);
  }

  for (const [group, items] of Object.entries(grouped)) {
    md += `## ${group}\n\n`;
    md += `| # | Method | Operation | Priority | When | Then | Example | Bugs |\n`;
    md += `|---|---|---|---|---|---|---|---|\n`;
    items.forEach((req, i) => {
      const bugs = req.bugs.length > 0 ? req.bugs.join(', ') : '';
      const skip = req.skipped ? ' ⏭️' : '';
      const example = req.example || '';
      md += `| ${i + 1} | ${req.method || '-'} | ${req.operation || '-'} | ${req.priority}${skip} | ${req.when} | ${req.rule} | ${example} | ${bugs} |\n`;
    });
    md += '\n';
  }

  return md;
}

// ─── Main ─────────────────────────────────────────────────────────────────────

function main() {
  const args = parseArgs();
  let allReqs = [];

  for (const dir of SPEC_DIRS) {
    const files = walkDir(dir, /\.spec\.js$/);
    for (const file of files) {
      allReqs.push(...extractFromFile(file));
    }
  }

  if (allReqs.length === 0) {
    console.warn('  ⚠  No requirements found in spec files.');
    process.exit(0);
  }

  if (args.priority) {
    const order = { P1: 1, P2: 2, P3: 3 };
    allReqs = allReqs.filter((r) => order[r.priority] && order[r.priority] <= order[args.priority]);
  }

  let output;
  switch (args.format) {
    case 'yaml':
      output = toYaml(allReqs);
      break;
    case 'markdown':
    case 'md':
      output = toMarkdown(allReqs);
      break;
    default:
      output = toJson(allReqs);
  }

  if (args.output) {
    const outPath = path.resolve(ROOT, args.output);
    fs.mkdirSync(path.dirname(outPath), { recursive: true });
    fs.writeFileSync(outPath, output, 'utf8');
    console.log(`  ✔ Requirements exported to ${args.output} (${allReqs.length} requirements)`);
  } else {
    console.log(output);
  }
}

main();
