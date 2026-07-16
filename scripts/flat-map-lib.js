/**
 * flat-map-lib.js
 *
 * Shared core for the flat dot-namespaced map CLIs (localization + colour theme).
 * `createFlatMapLib(config)` returns the full behaviour set — file locations,
 * read/sort/write format, key grammar validation, active-map activation, type
 * generation, add/remove mutations, and the sync/check pass — so the two domain
 * libraries (scripts/l10n-lib.js, scripts/colours-lib.js) stay thin config +
 * alias wrappers and this file is the single source of truth for the behaviour.
 *
 * Aligned with the localization-testing and colour-theme-testing skills.
 */

const fs = require('fs');
const path = require('path');
const readline = require('readline');

const SEGMENT = /^[a-z][a-zA-Z0-9]*$/; // lowerCamelCase

/**
 * @param {object} config
 * @param {string} config.dir                 Absolute path to the map directory.
 * @param {string} config.typesFile           Absolute path to the emitted .d.ts.
 * @param {string} config.referenceFile       Reference file name (source of truth for keys).
 * @param {string} config.referenceCode        Reference code (e.g. 'en', 'default').
 * @param {string} config.generatedFile        Active map file name (e.g. 'l10n.json').
 * @param {string} config.placeholder          Placeholder value for missing entries.
 * @param {string} config.fileSuffix           Locale/theme file suffix (e.g. '-localization.json').
 * @param {string[]} config.scopes             Declared top-level scopes.
 * @param {string} config.scopeLabel           Human label for a scope ('feature scope' / 'component scope').
 * @param {string} config.depthHint            Minimum-depth hint ('feature.area' / 'component.state').
 * @param {number} config.minDepth             Minimum segment count.
 * @param {number} config.maxDepth             Maximum segment count.
 * @param {string} config.requiredValueMessage Error when the value is undefined.
 * @param {string} config.emptyValueMessage    Error when the value is blank.
 * @param {(value: string) => string[]} [config.extraValueErrors] Extra value validation.
 * @param {string} config.emptySyncHint        Tail of the sync empty-value error message.
 * @param {string} config.envVar               Env var selecting the active file ('LANGUAGE' / 'COLOUR_THEME').
 * @param {string} config.activateSelectLabel  Activation noun ('Localization file for language code' / 'Colour theme file for code').
 * @param {string} config.activateCopyLabel    Copy noun ('Localization file' / 'Colour theme file').
 * @param {string} config.dirLabel             Directory label for guards ('Localization' / 'Colours').
 * @param {string} config.fileNoun             File noun for counts ('locale' / 'theme').
 * @param {string} config.syncLabel            Sync label ('Localization' / 'Colour').
 * @param {string} config.cliScript            CLI script file name (e.g. 'l10n.js').
 * @param {string} config.keysLabel            Keys label for the types header ('localization keys' / 'colour keys').
 * @param {string} config.regenerateHint       Command to regenerate types.
 * @param {string} config.typeName             Emitted type name ('L10nKey' / 'ColourKey').
 * @param {string} config.globalName           Emitted global name ('l10n' / 'colours').
 * @param {string} config.mapDescription       JSDoc line for the emitted global.
 * @param {string} config.typesBaseName        .d.ts base name for logs ('l10n.d.ts' / 'colours.d.ts').
 */
function createFlatMapLib(config) {
  const {
    dir,
    typesFile,
    referenceFile,
    referenceCode,
    generatedFile,
    placeholder,
    fileSuffix,
    scopes,
    scopeLabel,
    depthHint,
    minDepth,
    maxDepth,
    requiredValueMessage,
    emptyValueMessage,
    extraValueErrors = () => [],
    emptySyncHint,
    envVar,
    activateSelectLabel,
    activateCopyLabel,
    dirLabel,
    fileNoun,
    syncLabel,
    cliScript,
    keysLabel,
    regenerateHint,
    typeName,
    globalName,
    mapDescription,
    typesBaseName,
  } = config;

  // ── Flat-map IO ─────────────────────────────────────────────────────────────────

  function sortFlat(map) {
    return Object.fromEntries(Object.entries(map).sort(([a], [b]) => a.localeCompare(b)));
  }

  function codeOf(fileName) {
    return fileName.replace(fileSuffix, '');
  }

  function files() {
    return fs.readdirSync(dir).filter((file) => file.endsWith(fileSuffix));
  }

  // Guards used by every command; exits with a clear message on failure.
  function requireDir() {
    if (!fs.existsSync(dir)) {
      console.error(`FAIL ${dirLabel} directory not found: ${dir}`);
      process.exit(1);
    }
    const refPath = path.join(dir, referenceFile);
    if (!fs.existsSync(refPath)) {
      console.error(`FAIL Reference file not found: ${refPath}`);
      process.exit(1);
    }
  }

  function read(fileName) {
    const filePath = path.join(dir, fileName);
    try {
      return JSON.parse(fs.readFileSync(filePath, 'utf8'));
    } catch (error) {
      throw new Error(`Cannot read ${filePath}: ${error.message}`);
    }
  }

  function referenceKeys() {
    return Object.keys(read(referenceFile));
  }

  function write(fileName, data) {
    const filePath = path.join(dir, fileName);
    try {
      fs.writeFileSync(filePath, JSON.stringify(sortFlat(data), null, 2) + '\n', 'utf8');
    } catch (error) {
      throw new Error(`Cannot write ${filePath}: ${error.message}`);
    }
  }

  function emit(options, method, message) {
    if (!options.silent) console[method](message);
  }

  // ── Activate + generate types ────────────────────────────────────────────────────

  // Copies the env-selected file to the active generated map.
  function activate(code = process.env[envVar] || referenceCode, options = {}) {
    const source = path.join(dir, `${code}${fileSuffix}`);
    if (!fs.existsSync(source)) throw new Error(`${activateSelectLabel} "${code}" does not exist.`);
    fs.copyFileSync(source, path.join(dir, generatedFile));
    emit(options, 'log', `${activateCopyLabel} for "${code}" copied to "${generatedFile}".`);
  }

  // Emits the .d.ts typing the global as Record<Key,string> from the active map,
  // so a typo'd or removed key is a dev-time type error.
  function generateTypes(options = {}) {
    const flat = read(generatedFile);
    const keys = Object.keys(flat).sort((a, b) => a.localeCompare(b));
    const union = keys.map((k) => `  | '${k}'`).join('\n');
    const out = `// AUTO-GENERATED by scripts/${cliScript} — do not edit by hand.
// Regenerate after changing ${keysLabel}: ${regenerateHint}

type ${typeName} =
${union};

/** ${mapDescription} */
declare const ${globalName}: Record<${typeName}, string>;
`;
    try {
      fs.writeFileSync(typesFile, out);
    } catch (error) {
      throw new Error(`Cannot write ${typesFile}: ${error.message}`);
    }
    emit(options, 'log', `Wrote cypress/support/${typesBaseName}: ${keys.length} keys.`);
  }

  // Refresh the active map from the selected env, then regenerate the type union
  // so key changes are typed immediately — never left stale.
  function regenerateActiveMapAndTypes(options = {}) {
    activate(process.env[envVar] || referenceCode, options);
    generateTypes(options);
  }

  // ── Key grammar validation (mirrors skill GRAMMAR / SCOPE / DEPTH / NO_PREFIX) ────

  function validateKeyShape(key) {
    const errors = [];
    if (typeof key !== 'string' || key.trim() === '') return ['A key is required.'];

    const segments = key.split('.');
    if (segments.length < minDepth) errors.push(`'${key}': need at least ${depthHint} (${minDepth} segments).`);
    if (segments.length > maxDepth) errors.push(`'${key}': depth ${segments.length} exceeds the ${maxDepth}-segment ceiling.`);

    if (!scopes.includes(segments[0])) {
      errors.push(`'${segments[0]}' is not a declared ${scopeLabel}. Allowed: ${scopes.join(', ')}.`);
    }

    for (const seg of segments) {
      if (!SEGMENT.test(seg)) errors.push(`Segment '${seg}' is not lowerCamelCase.`);
    }

    return errors;
  }

  function validateKey(key, existingKeys) {
    const errors = validateKeyShape(key);
    if (errors.length > 0) return errors;

    if (existingKeys.includes(key)) errors.push(`'${key}' already exists — reuse it or pick a distinct key.`);

    // NO_PREFIX_CHECK: no key may be a strict dot-prefix of another.
    for (const existing of existingKeys) {
      if (existing.startsWith(key + '.')) errors.push(`'${key}' would be a prefix of existing '${existing}'.`);
      if (key.startsWith(existing + '.')) errors.push(`existing '${existing}' is a prefix of new '${key}'.`);
    }

    return errors;
  }

  function validateValue(value) {
    if (value === undefined) return [requiredValueMessage];
    if (typeof value !== 'string') return ['The value must be a string.'];
    if (value.trim() === '') return [emptyValueMessage];
    return extraValueErrors(value.trim());
  }

  function listKeys({ prefix } = {}) {
    const keys = referenceKeys()
      .filter((key) => !prefix || key.startsWith(prefix))
      .sort((a, b) => a.localeCompare(b));

    return { command: 'list', referenceFile, prefix: prefix || null, count: keys.length, keys };
  }

  function valueForCode(code, value, overrides) {
    if (code === referenceCode) return value;
    if (overrides[code] !== undefined) return overrides[code];
    return placeholder;
  }

  // ── Mutations ────────────────────────────────────────────────────────────────────

  function addKey(key, value, overrides, fileNames, options = {}) {
    const { dryRun = false } = options;
    const result = { command: 'add', dryRun, key, files: [], regenerated: false };
    const knownCodes = new Set(fileNames.map(codeOf));
    for (const code of Object.keys(overrides)) {
      if (!knownCodes.has(code)) emit(options, 'warn', `WARN override --${code}= has no ${code}${fileSuffix} and was ignored.`);
    }

    for (const fileName of fileNames) {
      const data = read(fileName);
      data[key] = valueForCode(codeOf(fileName), value, overrides);
      if (!dryRun) write(fileName, data);
      result.files.push({ fileName, value: data[key], changed: true });
      emit(options, 'log', `${dryRun ? 'DRY-RUN would add' : 'Added'} '${key}' = "${data[key]}" to ${fileName}`);
    }

    if (!dryRun) {
      regenerateActiveMapAndTypes(options);
      result.regenerated = true;
    }
    emit(options, 'log', `\nDone. Key '${key}' ${dryRun ? 'validated for add' : 'added'} in ${fileNames.length} ${fileNoun} file(s); active map and types ${dryRun ? 'not regenerated' : 'regenerated'}.`);
    return result;
  }

  function removeKeys(keys, fileNames, options = {}) {
    const { dryRun = false } = options;
    const result = { command: 'remove', dryRun, keys, files: [], regenerated: false };

    for (const fileName of fileNames) {
      const data = read(fileName);
      const removed = keys.filter((key) => key in data);
      for (const key of removed) delete data[key];

      if (removed.length > 0) {
        if (!dryRun) write(fileName, data);
        emit(options, 'log', `${dryRun ? 'DRY-RUN would remove' : 'Removed'} ${removed.length} key(s) from ${fileName}: ${removed.join(', ')}`);
      } else {
        emit(options, 'log', `No matching keys in ${fileName} (nothing to remove).`);
      }
      result.files.push({ fileName, removed, changed: removed.length > 0 });
    }

    if (!dryRun) {
      regenerateActiveMapAndTypes(options);
      result.regenerated = true;
    }
    emit(options, 'log', `\nDone. ${dryRun ? 'Validated removal of' : 'Removed'} ${keys.length} key(s) across ${fileNames.length} ${fileNoun} file(s); active map and types ${dryRun ? 'not regenerated' : 'regenerated'}.`);
    return result;
  }

  function renameKey(oldKey, newKey, fileNames, options = {}) {
    const { dryRun = false } = options;
    const maps = fileNames.map((fileName) => ({ fileName, data: read(fileName) }));
    const conflicts = maps.filter(({ data }) => oldKey in data && newKey in data).map(({ fileName }) => fileName);
    if (conflicts.length > 0) throw new Error(`Cannot rename '${oldKey}' to '${newKey}' because the new key already exists in: ${conflicts.join(', ')}.`);

    const result = { command: 'rename', dryRun, oldKey, newKey, files: [], regenerated: false };
    for (const { fileName, data } of maps) {
      const changed = oldKey in data;
      if (changed) {
        data[newKey] = data[oldKey];
        delete data[oldKey];
        if (!dryRun) write(fileName, data);
        emit(options, 'log', `${dryRun ? 'DRY-RUN would rename' : 'Renamed'} '${oldKey}' to '${newKey}' in ${fileName}`);
      } else {
        emit(options, 'log', `No '${oldKey}' key in ${fileName} (nothing to rename).`);
      }
      result.files.push({ fileName, changed });
    }

    if (!dryRun) {
      regenerateActiveMapAndTypes(options);
      result.regenerated = true;
    }
    emit(options, 'log', `\nDone. Key '${oldKey}' ${dryRun ? 'validated for rename' : 'renamed'} to '${newKey}' across ${fileNames.length} ${fileNoun} file(s); active map and types ${dryRun ? 'not regenerated' : 'regenerated'}.`);
    return result;
  }

  // ── Sync / check ──────────────────────────────────────────────────────────────────

  function isSorted(map) {
    const keys = Object.keys(map);
    return keys.every((key, i) => i === 0 || keys[i - 1].localeCompare(key) <= 0);
  }

  // Keys that, dot-segmented, are a strict prefix of another key.
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

  function syncProcessFile(fileName, refKeys, options) {
    const { checkOnly, dryRun } = options;
    let data = read(fileName);
    const isReference = fileName === referenceFile;
    let changed = false;
    let hasErrors = false;
    const result = { fileName, changed: false, hasErrors: false, errors: [], warnings: [], fixes: [] };

    const fail = (message) => {
      result.errors.push(message);
      emit(options, 'error', message);
      hasErrors = true;
    };

    const warn = (message) => {
      result.warnings.push(message);
      emit(options, 'warn', message);
    };

    const fix = (message) => {
      result.fixes.push(message);
      emit(options, 'log', message);
    };

    const nested = Object.keys(data).filter((k) => data[k] !== null && typeof data[k] === 'object');
    if (nested.length > 0) {
      fail(`FAIL ${fileName}: ${nested.length} nested value(s) — the model is flat. Flatten: ${previewKeys(nested)}`);
    }

    for (const [key, value] of Object.entries(data)) {
      const keyErrors = validateKeyShape(key);
      for (const error of keyErrors) {
        fail(`FAIL ${fileName}: invalid key '${key}' — ${error}`);
      }

      if (value !== placeholder) {
        const valueErrors = validateValue(value);
        for (const error of valueErrors) {
          fail(`FAIL ${fileName}: key '${key}' has invalid value — ${error}`);
        }
      }
    }

    if (!isReference) {
      const missing = refKeys.filter((k) => !(k in data));
      if (missing.length > 0) {
        if (checkOnly || dryRun) {
          warn(`${dryRun ? 'DRY-RUN' : 'WARN'} ${fileName}: missing ${missing.length} key(s) — ${previewKeys(missing)}`);
          hasErrors = true;
        } else {
          for (const key of missing) data[key] = placeholder;
          changed = true;
          fix(`Fixed ${fileName}: added ${missing.length} missing key(s) as "${placeholder}".`);
        }
      }

      const orphans = Object.keys(data).filter((k) => !refKeys.includes(k));
      if (orphans.length > 0) warn(`WARN ${fileName}: ${orphans.length} key(s) absent from ${referenceFile} — ${previewKeys(orphans)}`);
    }

    if (!isSorted(data)) {
      if (checkOnly || dryRun) {
        warn(`${dryRun ? 'DRY-RUN' : 'WARN'} ${fileName}: keys are not sorted alphabetically.`);
        hasErrors = true;
      } else {
        data = sortFlat(data);
        changed = true;
      }
    } else if (changed) {
      data = sortFlat(data);
    }

    if (changed && !checkOnly && !dryRun) {
      write(fileName, data);
      fix(`Fixed ${fileName}: sorted keys alphabetically.`);
    }

    const collisions = findPrefixCollisions(Object.keys(data));
    for (const collision of collisions) {
      fail(`FAIL ${fileName}: prefix collision — ${collision}. Restructure so no key is a prefix of another.`);
    }

    const empties = Object.entries(data).filter(([, value]) => value === null || value === '' || value === undefined);
    for (const [key] of empties) {
      fail(`FAIL ${fileName}: key '${key}' has an empty or null value — ${emptySyncHint}`);
    }

    if (!changed && !hasErrors) emit(options, 'log', `OK   ${fileName}`);
    result.changed = changed;
    result.hasErrors = hasErrors;
    return result;
  }

  function sync({ checkOnly = false, dryRun = false, silent = false } = {}) {
    const refKeys = referenceKeys();
    const result = { command: checkOnly ? 'validate' : 'sync', checkOnly, dryRun, hasErrors: false, files: [] };
    const options = { checkOnly, dryRun, silent };

    for (const fileName of files()) {
      const fileResult = syncProcessFile(fileName, refKeys, options);
      result.files.push(fileResult);
      if (fileResult.hasErrors) result.hasErrors = true;
    }

    if (result.hasErrors) {
      emit(options, 'error', `\nFAIL ${syncLabel} ${checkOnly ? 'validation' : 'sync'} completed with errors. Fix the issues above.`);
    } else {
      emit(options, 'log', `\n${syncLabel} ${checkOnly ? 'validation' : 'sync'} complete.`);
    }
    return result;
  }

  // ── Interactive prompting ────────────────────────────────────────────────────────

  function ask(rl, question) {
    return new Promise((resolve) => rl.question(question, (answer) => resolve(answer.trim())));
  }

  function withPrompt(fn) {
    const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
    return Promise.resolve(fn(rl)).finally(() => rl.close());
  }

  return {
    REFERENCE_CODE: referenceCode,
    PLACEHOLDER: placeholder,
    SCOPES: scopes,
    codeOf,
    files,
    requireDir,
    referenceKeys,
    activate,
    generateTypes,
    regenerateActiveMapAndTypes,
    validateKey,
    validateValue,
    listKeys,
    addKey,
    removeKeys,
    renameKey,
    sync,
    ask,
    withPrompt,
  };
}

module.exports = { createFlatMapLib };
