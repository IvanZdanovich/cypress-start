#!/usr/bin/env node
/**
 * sync-colours.js
 *
 * Keeps every per-theme colour file in cypress/colours/ aligned with the flat,
 * dot-namespaced model (mirrors sync-localization.js). Files are single-level
 * maps of `"component.element[.state]": "rgb(…)"`.
 *
 * Reference theme: default-theme-colours.json (the canonical key set).
 * Generated artifact: colours.json is excluded — it is a COLOUR_THEME-dependent
 *                     copy produced by scripts/copy-colours.js and regenerated
 *                     by pretest, so it is never a source of truth.
 *
 * Actions:
 *   - Adds keys missing from a theme file as "MISSING_COLOUR" (auto-fix)
 *   - Sorts keys alphabetically (auto-fix)
 *   - Reports empty/null values as errors (requires human input)
 *   - Reports nested objects — the model is flat (regression guard)
 *   - Reports prefix collisions — no key may be a strict prefix of another
 *   - Warns on orphan keys present in a theme file but absent from reference
 *
 * Usage:
 *   node scripts/sync-colours.js           # fix + report
 *   node scripts/sync-colours.js --check   # report only, exit 1 on issues
 */

const fs = require('fs');
const path = require('path');

const COLOURS_DIR = path.join(process.cwd(), 'cypress', 'colours');
const REFERENCE_FILE = 'default-theme-colours.json';
const GENERATED_FILE = 'colours.json';
const PLACEHOLDER = 'MISSING_COLOUR';
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

function previewKeys(keys) {
  const shown = keys.slice(0, 5).join(', ');
  return keys.length > 5 ? `${shown} … (+${keys.length - 5} more)` : shown;
}

// ── Per-file processing ─────────────────────────────────────────────────────────

function checkNested(fileName, fileData) {
  const nested = Object.keys(fileData).filter((k) => fileData[k] !== null && typeof fileData[k] === 'object');
  if (nested.length === 0) return false;
  console.error(`FAIL ${fileName}: ${nested.length} nested value(s) — the model is flat. Flatten: ${previewKeys(nested)}`);
  return true;
}

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

function warnOrphanKeys(fileName, fileData, refKeys) {
  const orphanKeys = Object.keys(fileData).filter((k) => !refKeys.includes(k));
  if (orphanKeys.length > 0) {
    console.warn(`WARN ${fileName}: ${orphanKeys.length} key(s) absent from ${REFERENCE_FILE} — ${previewKeys(orphanKeys)}`);
  }
}

function checkPrefixCollisions(fileName, fileData) {
  const collisions = findPrefixCollisions(Object.keys(fileData));
  for (const collision of collisions) {
    console.error(`FAIL ${fileName}: prefix collision — ${collision}. Restructure so no key is a prefix of another.`);
  }
  return collisions.length > 0;
}

function checkEmptyValues(fileName, fileData) {
  const empties = Object.entries(fileData).filter(([, value]) => value === null || value === '' || value === undefined);
  for (const [key] of empties) {
    console.error(`FAIL ${fileName}: key '${key}' has an empty or null value — assign a proper colour value (e.g. "rgb(0, 0, 0)").`);
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
  if (!fs.existsSync(COLOURS_DIR)) {
    console.error(`FAIL Colours directory not found: ${COLOURS_DIR}`);
    process.exit(1);
  }

  const refFilePath = path.join(COLOURS_DIR, REFERENCE_FILE);
  if (!fs.existsSync(refFilePath)) {
    console.error(`FAIL Reference file not found: ${refFilePath}`);
    process.exit(1);
  }

  const refKeys = Object.keys(JSON.parse(fs.readFileSync(refFilePath, 'utf8')));
  const themeFiles = fs.readdirSync(COLOURS_DIR).filter((f) => f.endsWith('.json') && f !== GENERATED_FILE);

  let hasErrors = false;

  for (const fileName of themeFiles) {
    const filePath = path.join(COLOURS_DIR, fileName);
    if (processFile(fileName, filePath, refKeys)) hasErrors = true;
  }

  if (hasErrors) {
    console.error('\nFAIL Colour sync completed with errors. Fix the issues above.');
    process.exit(1);
  }

  console.log('\nColour sync complete.');
}

run();
