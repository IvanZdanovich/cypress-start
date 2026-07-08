#!/usr/bin/env node
/**
 * sync-localization.js
 *
 * Keeps every per-language localization file in cypress/localization/ aligned
 * with the flat, dot-namespaced model (see docs/localization-testing.md). Files are
 * single-level maps of `"feature.area.element[.role]": "Translated text"`.
 *
 * Reference language: en-localization.json (the canonical key set).
 * Generated artifact:  l10n.json is excluded — it is a LANGUAGE-dependent copy
 *                      produced by scripts/copy-localization.js and regenerated
 *                      by pretest, so it is never a source of truth.
 *
 * Actions:
 *   - Adds keys missing from a language file as "MISSING_TRANSLATION" (auto-fix)
 *   - Sorts keys alphabetically (auto-fix)
 *   - Reports empty/null values as errors (requires human input)
 *   - Reports nested objects — the model is flat (regression guard)
 *   - Reports prefix collisions — no key may be a strict prefix of another, or
 *     ngx-translate/transloco resolves it as a nested branch (regression guard)
 *   - Warns on orphan keys present in a language file but absent from reference
 *
 * Usage:
 *   node scripts/sync-localization.js           # fix + report
 *   node scripts/sync-localization.js --check   # report only, exit 1 on issues
 */

const fs = require('fs');
const path = require('path');

const L10N_DIR = path.join(process.cwd(), 'cypress', 'localization');
const REFERENCE_FILE = 'en-localization.json';
const GENERATED_FILE = 'l10n.json';
const PLACEHOLDER = 'MISSING_TRANSLATION';
const CHECK_ONLY = process.argv.includes('--check');

// ── Helpers ───────────────────────────────────────────────────────────────────

function sortFlat(map) {
  return Object.keys(map)
    .sort((a, b) => a.localeCompare(b))
    .reduce((sorted, key) => {
      sorted[key] = map[key];
      return sorted;
    }, {});
}

function isSorted(map) {
  const keys = Object.keys(map);
  return keys.every((key, i) => i === 0 || keys[i - 1].localeCompare(key) <= 0);
}

// Keys present in `map` that, dot-segmented, are a strict prefix of another key.
// e.g. `action.title` alongside `action.title.label` collides under nesting.
function findPrefixCollisions(keys) {
  const keySet = new Set(keys);
  const collisions = [];
  for (const key of keys) {
    const segments = key.split('.');
    for (let i = 1; i < segments.length; i++) {
      const prefix = segments.slice(0, i).join('.');
      if (keySet.has(prefix)) collisions.push(`'${prefix}' is a prefix of '${key}'`);
    }
  }
  return collisions;
}

// Renders up to 5 items with a "… (+N more)" suffix for readable diagnostics.
function previewKeys(keys) {
  const shown = keys.slice(0, 5).join(', ');
  return keys.length > 5 ? `${shown} … (+${keys.length - 5} more)` : shown;
}

// ── Per-file processing ─────────────────────────────────────────────────────────

// Flatness guard: every value must be a string, never a nested object.
function checkNested(fileName, fileData) {
  const nested = Object.keys(fileData).filter((k) => fileData[k] !== null && typeof fileData[k] === 'object');
  if (nested.length === 0) return false;
  console.error(`FAIL ${fileName}: ${nested.length} nested value(s) — the model is flat. Flatten: ${previewKeys(nested)}`);
  return true;
}

// Adds keys missing against the reference; mutates fileData when auto-fixing.
function syncMissingKeys(fileName, fileData, refKeys) {
  const missingKeys = refKeys.filter((k) => !(k in fileData));
  if (missingKeys.length === 0) return { changed: false, hasErrors: false };

  if (CHECK_ONLY) {
    console.warn(`WARN ${fileName}: missing ${missingKeys.length} key(s) — ${previewKeys(missingKeys)}`);
    return { changed: false, hasErrors: true };
  }

  for (const key of missingKeys) fileData[key] = PLACEHOLDER;
  console.log(`Fixed ${fileName}: added ${missingKeys.length} missing key(s) as "${PLACEHOLDER}".`);
  return { changed: true, hasErrors: false };
}

// Orphan keys present here but absent from the reference (warn only).
function warnOrphanKeys(fileName, fileData, refKeys) {
  const orphanKeys = Object.keys(fileData).filter((k) => !refKeys.includes(k));
  if (orphanKeys.length > 0) {
    console.warn(`WARN ${fileName}: ${orphanKeys.length} key(s) absent from ${REFERENCE_FILE} — ${previewKeys(orphanKeys)}`);
  }
}

// Prefix-collision guard: no key may be a strict dot-prefix of another.
function checkPrefixCollisions(fileName, fileData) {
  const collisions = findPrefixCollisions(Object.keys(fileData));
  for (const collision of collisions) {
    console.error(`FAIL ${fileName}: prefix collision — ${collision}. Restructure so no key is a prefix of another.`);
  }
  return collisions.length > 0;
}

// Reports empty/null values that require human-supplied translations.
function checkEmptyValues(fileName, fileData) {
  const empties = Object.entries(fileData).filter(([, value]) => value === null || value === '' || value === undefined);
  for (const [key] of empties) {
    console.error(`FAIL ${fileName}: key '${key}' has an empty or null value — assign a proper translation string.`);
  }
  return empties.length > 0;
}

function processFile(fileName, filePath, refKeys) {
  let fileData = JSON.parse(fs.readFileSync(filePath, 'utf8'));
  const isReference = fileName === REFERENCE_FILE;
  let fileChanged = false;
  let fileHasErrors = false;

  fileHasErrors = checkNested(fileName, fileData) || fileHasErrors;

  if (!isReference) {
    const { changed, hasErrors } = syncMissingKeys(fileName, fileData, refKeys);
    fileChanged = fileChanged || changed;
    fileHasErrors = fileHasErrors || hasErrors;
    warnOrphanKeys(fileName, fileData, refKeys);
  }

  // ── Sort keys alphabetically ─────────────────────────────────────────────
  if (!isSorted(fileData)) {
    if (CHECK_ONLY) {
      console.warn(`WARN ${fileName}: keys are not sorted alphabetically.`);
      fileHasErrors = true;
    } else {
      fileData = sortFlat(fileData);
      fileChanged = true;
    }
  } else if (fileChanged) {
    fileData = sortFlat(fileData);
  }

  if (fileChanged && !CHECK_ONLY) {
    fs.writeFileSync(filePath, JSON.stringify(fileData, null, 2) + '\n', 'utf8');
    console.log(`Fixed ${fileName}: sorted keys alphabetically.`);
  }

  fileHasErrors = checkPrefixCollisions(fileName, fileData) || fileHasErrors;
  fileHasErrors = checkEmptyValues(fileName, fileData) || fileHasErrors;

  if (!fileChanged && !fileHasErrors) console.log(`OK   ${fileName}`);
  return fileHasErrors;
}

// ── Main ──────────────────────────────────────────────────────────────────────

function run() {
  if (!fs.existsSync(L10N_DIR)) {
    console.error(`FAIL Localization directory not found: ${L10N_DIR}`);
    process.exit(1);
  }

  const refFilePath = path.join(L10N_DIR, REFERENCE_FILE);
  if (!fs.existsSync(refFilePath)) {
    console.error(`FAIL Reference file not found: ${refFilePath}`);
    process.exit(1);
  }

  const refKeys = Object.keys(JSON.parse(fs.readFileSync(refFilePath, 'utf8')));
  const langFiles = fs.readdirSync(L10N_DIR).filter((f) => f.endsWith('.json') && f !== GENERATED_FILE);

  let hasErrors = false;

  for (const fileName of langFiles) {
    const filePath = path.join(L10N_DIR, fileName);
    if (processFile(fileName, filePath, refKeys)) hasErrors = true;
  }

  if (hasErrors) {
    console.error('\nFAIL Localization sync completed with errors. Fix the issues above.');
    process.exit(1);
  }

  console.log('\nLocalization sync complete.');
}

run();
