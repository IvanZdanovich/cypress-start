#!/usr/bin/env node

/**
 * Requirement Schema Validator
 *
 * Validates every *.reqs.js file against the schema definitions
 * in `cypress/support/requirements/req-schemas.js`.
 *
 * Checks:
 *   - Mandatory fields present and correctly typed
 *   - At-least-one groups (e.g. statusCode variants for API)
 *   - Optional fields typed correctly when present
 *   - Unknown fields flagged as warnings
 *   - Duplicate requirement IDs within and across files
 *   - Unique ID prefixes per file
 *
 * Usage:
 *   node scripts/validate-reqs.mjs                  # validate all, errors + warnings
 *   node scripts/validate-reqs.mjs --strict          # treat warnings as errors
 *   node scripts/validate-reqs.mjs --fix-hint        # show suggested fixes
 *   node scripts/validate-reqs.mjs --schema-summary  # print schema docs and exit
 *
 * Exit codes:
 *   0  — all valid
 *   1  — validation errors found
 */

import { readdir } from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');
const REQS_DIR = path.join(ROOT, 'cypress/support/requirements');

// ─── CLI args ─────────────────────────────────────────────────────────────────

const args = new Set(process.argv.slice(2));
const isStrict = args.has('--strict');
const showFixHints = args.has('--fix-hint');
const showSchemaSummary = args.has('--schema-summary');

// ─── Colours ──────────────────────────────────────────────────────────────────

const c = {
  reset: '\x1b[0m',
  bold: '\x1b[1m',
  dim: '\x1b[2m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  cyan: '\x1b[36m',
};
const col = (text, color) => `${c[color]}${text}${c.reset}`;

// ─── Import schemas ───────────────────────────────────────────────────────────

const { REQ_SCHEMAS, validateModule } = await import(new URL(`file://${path.join(REQS_DIR, 'req-schemas.js')}`));

// ─── Schema summary mode ──────────────────────────────────────────────────────

if (showSchemaSummary) {
  console.log('\n' + col('═'.repeat(60), 'cyan'));
  console.log(col(' Requirement Schema Reference', 'bold'));
  console.log(col('═'.repeat(60), 'cyan'));

  for (const [type, schema] of Object.entries(REQ_SCHEMAS)) {
    console.log(`\n${col(`▸ ${type.toUpperCase()}`, 'bold')} — ${schema.description}`);

    console.log(`  ${col('Mandatory:', 'green')}`);
    for (const [field, spec] of Object.entries(schema.mandatory)) {
      console.log(`    ${col(field, 'cyan')} — ${spec.description}`);
    }

    if (schema.atLeastOne && Object.keys(schema.atLeastOne).length > 0) {
      console.log(`  ${col('At least one of:', 'yellow')}`);
      for (const [field, spec] of Object.entries(schema.atLeastOne)) {
        console.log(`    ${col(field, 'cyan')} — ${spec.description}`);
      }
    }

    console.log(`  ${col('Optional:', 'dim')}`);
    for (const [field, spec] of Object.entries(schema.optional)) {
      console.log(`    ${col(field, 'dim')} — ${spec.description}`);
    }
  }

  console.log('\n' + col('═'.repeat(60), 'cyan') + '\n');
  process.exit(0);
}

// ─── Main validation ──────────────────────────────────────────────────────────

console.log('\n' + col('═'.repeat(60), 'cyan'));
console.log(col(' Requirement Schema Validation', 'bold'));
console.log(col('═'.repeat(60), 'cyan'));

const SKIP_FILES = new Set(['shared-api.reqs.js', 'shared-ui.reqs.js', 'req-schemas.js']);

async function walkReqFiles(dir) {
  const entries = await readdir(dir, { withFileTypes: true });
  const results = [];
  for (const entry of entries) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      results.push(...(await walkReqFiles(full)));
    } else if (entry.name.endsWith('.reqs.js') && !SKIP_FILES.has(entry.name)) {
      results.push(full);
    }
  }
  return results;
}

const reqFilePaths = await walkReqFiles(REQS_DIR);

if (reqFilePaths.length === 0) {
  console.warn(col('  ⚠  No *.reqs.js files found.\n', 'yellow'));
  process.exit(0);
}

let totalErrors = 0;
let totalWarnings = 0;
let totalReqs = 0;
let totalValid = 0;
const globalIds = new Map(); // id → filename — cross-file duplicate detection

for (const jsPath of reqFilePaths) {
  const file = path.relative(REQS_DIR, jsPath);

  try {
    const mod = await import(new URL(`file://${jsPath}`));
    const data = mod.default;

    if (data === undefined) {
      console.log(`  ${col('–', 'dim')} ${file} ${col('(no default export — skipped)', 'dim')}`);
      continue;
    }

    const { errors, warnings, stats } = validateModule(data, file);
    totalReqs += stats.total;
    totalValid += stats.valid;

    // Cross-file duplicate ID check
    function collectIds(obj) {
      if (!obj || typeof obj !== 'object' || Array.isArray(obj)) return;
      if (typeof obj.id === 'string' && /^REQ-/.test(obj.id)) {
        if (globalIds.has(obj.id)) {
          errors.push(`${file}: ID '${obj.id}' already defined in '${globalIds.get(obj.id)}'`);
        } else {
          globalIds.set(obj.id, file);
        }
        return;
      }
      for (const val of Object.values(obj)) collectIds(val);
    }
    collectIds(data);

    totalErrors += errors.length;
    totalWarnings += warnings.length;

    if (errors.length === 0 && warnings.length === 0) {
      console.log(`  ${col('✔', 'green')} ${file} — ${stats.total} requirements, all valid`);
    } else {
      const status = errors.length > 0 ? col('✖', 'red') : col('⚠', 'yellow');
      console.log(`  ${status} ${file} — ${stats.total} requirements (${errors.length} errors, ${warnings.length} warnings)`);

      for (const err of errors) {
        console.log(`    ${col('ERROR', 'red')}: ${err}`);
      }
      for (const warn of warnings) {
        console.log(`    ${col('WARN', 'yellow')}: ${warn}`);
      }
    }
  } catch (err) {
    console.error(`  ${col('✖', 'red')} ${file}: Import failed — ${err.message}`);
    totalErrors++;
  }
}

// ─── Summary ──────────────────────────────────────────────────────────────────

console.log('\n' + col('─'.repeat(60), 'dim'));
console.log(`  Requirements : ${col(String(totalReqs), 'bold')}`);
console.log(`  Valid        : ${col(String(totalValid), 'green')}`);
console.log(`  Errors       : ${col(String(totalErrors), totalErrors > 0 ? 'red' : 'green')}`);
console.log(`  Warnings     : ${col(String(totalWarnings), totalWarnings > 0 ? 'yellow' : 'green')}`);

if (showFixHints && (totalErrors > 0 || totalWarnings > 0)) {
  console.log('\n' + col('  Fix hints:', 'bold'));
  console.log(col('  • Missing mandatory field → add the field to the requirement object', 'dim'));
  console.log(col('  • Unknown field → add to req-schemas.js optional section or remove', 'dim'));
  console.log(col('  • Invalid value → check type (string, number, array) matches schema', 'dim'));
  console.log(col('  • Duplicate ID → ensure each requirement has a unique REQ-PREFIX-NNN', 'dim'));
  console.log(col('  • Run: node scripts/validate-reqs.mjs --schema-summary  for full field reference', 'dim'));
}

console.log('\n' + col('═'.repeat(60), 'cyan') + '\n');

const exitCode = isStrict ? (totalErrors + totalWarnings > 0 ? 1 : 0) : totalErrors > 0 ? 1 : 0;
process.exit(exitCode);
