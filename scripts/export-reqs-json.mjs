#!/usr/bin/env node

/**
 * Requirement JSON Exporter
 *
 * Reads every *.reqs.js file in cypress/integration/,
 * dynamically imports the default export, and writes a companion
 * *.reqs.json alongside it.
 *
 * The JSON files are the Python (and any non-JS language) bridge.
 * They are committed so downstream consumers need no build step.
 *
 * Usage:
 *   node scripts/export-reqs-json.mjs
 *   node scripts/export-reqs-json.mjs --dry-run   # print JSON, don't write
 *
 * Python consumption:
 *   import json, pathlib
 *   rb = json.loads(pathlib.Path('cypress/integration/rb.booking.reqs.json').read_text())
 *   rb['create']['success']['statusCode']  # 200
 *   rb['create']['success']['id']          # 'REQ-RB-010'
 */

import { readdir, writeFile } from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');
const REQS_DIR = path.join(ROOT, 'cypress/integration');

const isDryRun = process.argv.includes('--dry-run');
const skipValidation = process.argv.includes('--skip-validation');

// ─── helpers ──────────────────────────────────────────────────────────────────

const green = (s) => `\x1b[32m${s}\x1b[0m`;
const red = (s) => `\x1b[31m${s}\x1b[0m`;
const yellow = (s) => `\x1b[33m${s}\x1b[0m`;
const dim = (s) => `\x1b[2m${s}\x1b[0m`;

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

// ─── import schema validator ──────────────────────────────────────────────────

let validateModule = null;
if (!skipValidation) {
  try {
    const schemas = await import(new URL(`file://${path.join(REQS_DIR, 'req-schemas.js')}`));
    validateModule = schemas.validateModule;
  } catch {
    console.warn(yellow('  ⚠  req-schemas.js not found — skipping schema validation.\n'));
  }
}

// ─── main ─────────────────────────────────────────────────────────────────────

const reqFilePaths = await walkReqFiles(REQS_DIR);

if (reqFilePaths.length === 0) {
  console.warn(dim('  No *.reqs.js files found — nothing to export.'));
  process.exit(0);
}

let errors = 0;
let validationWarnings = 0;

for (const jsPath of reqFilePaths) {
  const file = path.relative(REQS_DIR, jsPath);
  const jsonPath = jsPath.replace('.reqs.js', '.reqs.json');
  const jsonRelative = path.relative(ROOT, jsonPath);

  try {
    // Dynamic import handles ES module `export default` natively.
    const mod = await import(new URL(`file://${jsPath}`));
    const data = mod.default;

    // Shared constant files use only named exports — skip them silently.
    if (data === undefined) {
      console.log(`  ${dim('–')} ${file} ${dim('(no default export — shared constants, skipped)')}`);
      continue;
    }

    if (!data || typeof data !== 'object') {
      throw new Error(`Default export is not an object`);
    }

    // ── Schema validation ───────────────────────────────────────────────
    if (validateModule) {
      const result = validateModule(data, file);
      if (result.errors.length > 0) {
        console.error(`  ${red('✖')} ${file}: ${result.errors.length} schema error(s)`);
        for (const err of result.errors) {
          console.error(`    ${red('ERROR')}: ${err}`);
        }
        errors += result.errors.length;
      }
      if (result.warnings.length > 0) {
        validationWarnings += result.warnings.length;
        for (const warn of result.warnings) {
          console.warn(`    ${yellow('WARN')}: ${warn}`);
        }
      }
    }

    const json = JSON.stringify(data, null, 2);

    if (isDryRun) {
      console.log(`\n${dim('─── ' + file + ' ───')}\n${json}`);
    } else {
      await writeFile(jsonPath, json + '\n', 'utf8');
      console.log(`  ${green('✔')} ${jsonRelative}`);
    }
  } catch (err) {
    console.error(`  ${red('✖')} ${file}: ${err.message}`);
    errors++;
  }
}

if (validationWarnings > 0) {
  console.warn(yellow(`\n  ⚠  ${validationWarnings} schema warning(s) — run 'node scripts/validate-reqs.mjs --fix-hint' for details.`));
}

if (!isDryRun && errors === 0) {
  console.log(dim(`\n  Tip: commit *.reqs.json files so Python consumers need no build step.\n`));
}

if (errors > 0) {
  process.exit(1);
}
