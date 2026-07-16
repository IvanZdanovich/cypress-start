/**
 * flat-map-cli.js
 *
 * Shared dispatcher for the flat dot-namespaced map CLIs. Domain entry points
 * keep only command wording, prompts, and wrapper aliases; add/remove/sync/
 * activate/types behaviour stays aligned here.
 */

function parseAddArgs(argv, overridePattern) {
  const positional = [];
  const overrides = {};
  for (const arg of argv) {
    const match = arg.match(overridePattern);
    if (match) overrides[match[1]] = match[2];
    else positional.push(arg);
  }
  return { key: positional[0], value: positional[1], overrides };
}

function parseFlags(argv) {
  const args = [];
  const flags = { dryRun: false, json: false, prefix: undefined };

  for (const arg of argv) {
    if (arg === '--dry-run') flags.dryRun = true;
    else if (arg === '--json') flags.json = true;
    else if (arg.startsWith('--prefix=')) flags.prefix = arg.slice('--prefix='.length);
    else args.push(arg);
  }

  return { args, flags };
}

function writeJson(result) {
  console.log(JSON.stringify(result, null, 2));
}

function validateOverrides(config, overrides, files) {
  const { lib } = config;
  const knownCodes = new Set(files.map(config.codeOf));
  const errors = [];

  for (const [code, value] of Object.entries(overrides)) {
    if (!knownCodes.has(code)) {
      errors.push(`--${code}= does not match any managed ${config.fileNoun} file.`);
      continue;
    }
    if (code === lib.REFERENCE_CODE) {
      errors.push(`--${code}= targets the reference ${config.fileNoun}; pass that value as the positional value instead.`);
      continue;
    }
    errors.push(...lib.validateValue(value).map((error) => `--${code}= ${error}`));
  }

  return errors;
}

function promptAdd(config, refKeys, files) {
  const { lib } = config;

  return lib.withPrompt(async (rl) => {
    let key;
    for (;;) {
      key = await lib.ask(rl, config.keyPrompt);
      const keyErrors = lib.validateKey(key, refKeys);
      if (keyErrors.length === 0) break;
      keyErrors.forEach((error) => console.error(`  - ${error}`));
    }

    let value;
    for (;;) {
      value = await lib.ask(rl, config.valuePrompt);
      const valueErrors = lib.validateValue(value);
      if (valueErrors.length === 0) break;
      valueErrors.forEach((error) => console.error(`  - ${error}`));
    }

    const overrides = {};
    for (const code of files.map(config.codeOf)) {
      if (code === lib.REFERENCE_CODE) continue;
      for (;;) {
        const answer = await lib.ask(rl, `${code} value (blank = ${lib.PLACEHOLDER}): `);
        if (answer === '') break;

        const valueErrors = lib.validateValue(answer);
        if (valueErrors.length === 0) {
          overrides[code] = answer;
          break;
        }
        valueErrors.forEach((error) => console.error(`  - ${error}`));
      }
    }

    return { key, value, overrides };
  });
}

async function cmdAdd(config, argv) {
  const { lib } = config;
  const refKeys = lib.referenceKeys();
  const files = config.files();
  const { args, flags } = parseFlags(argv);

  let { key, value, overrides } = parseAddArgs(args, config.overridePattern);

  if (!key || value === undefined) {
    if (!process.stdin.isTTY) {
      console.error(config.addUsage);
      console.error('Run in an interactive terminal with no arguments to be prompted for each value.');
      process.exit(1);
    }
    ({ key, value, overrides } = await promptAdd(config, refKeys, files));
  } else {
    const errors = [...lib.validateKey(key, refKeys), ...lib.validateValue(value), ...validateOverrides(config, overrides, files)];
    if (errors.length) {
      console.error(`FAIL Cannot add '${key}':`);
      errors.forEach((error) => console.error(`  - ${error}`));
      process.exit(1);
    }
  }

  const result = lib.addKey(key, value, overrides, files, { dryRun: flags.dryRun, silent: flags.json });
  if (flags.json) writeJson(result);
}

function promptRemove(config, refKeys) {
  const { lib } = config;

  return lib.withPrompt(async (rl) => {
    let key;
    for (;;) {
      key = await lib.ask(rl, 'Key to remove: ');
      if (refKeys.includes(key)) break;
      console.error(`  - '${key}' is not present in the reference file. Nothing to remove.`);
    }

    const confirm = await lib.ask(rl, `Delete '${key}' from all ${config.fileNoun} files? (y/N): `);
    return confirm.toLowerCase() === 'y' ? [key] : [];
  });
}

async function cmdRemove(config, argv) {
  const { lib } = config;
  const refKeys = lib.referenceKeys();
  const files = config.files();
  const { args, flags } = parseFlags(argv);

  let keys = args.filter((arg) => !arg.startsWith('-'));

  if (keys.length === 0) {
    if (!process.stdin.isTTY) {
      console.error(config.removeUsage);
      console.error('Run in an interactive terminal with no arguments to be prompted for a key.');
      process.exit(1);
    }
    keys = await promptRemove(config, refKeys);
    if (keys.length === 0) {
      console.log('Aborted — no key removed.');
      return;
    }
  } else {
    const missing = keys.filter((key) => !refKeys.includes(key));
    if (missing.length) {
      console.error(`FAIL Cannot remove — key(s) absent from the reference file: ${missing.join(', ')}.`);
      process.exit(1);
    }
  }

  const result = lib.removeKeys(keys, files, { dryRun: flags.dryRun, silent: flags.json });
  if (flags.json) writeJson(result);
}

function validateRename(config, oldKey, newKey, refKeys) {
  const { lib } = config;
  const errors = [];

  if (!refKeys.includes(oldKey)) errors.push(`'${oldKey}' is not present in the reference file. Nothing to rename.`);
  if (oldKey === newKey) errors.push('The new key must be different from the old key.');
  errors.push(
    ...lib.validateKey(
      newKey,
      refKeys.filter((key) => key !== oldKey),
    ),
  );

  return errors;
}

function promptRename(config, refKeys) {
  const { lib } = config;

  return lib.withPrompt(async (rl) => {
    let oldKey;
    for (;;) {
      oldKey = await lib.ask(rl, 'Key to rename: ');
      if (refKeys.includes(oldKey)) break;
      console.error(`  - '${oldKey}' is not present in the reference file. Nothing to rename.`);
    }

    let newKey;
    for (;;) {
      newKey = await lib.ask(rl, 'New key: ');
      const keyErrors = validateRename(config, oldKey, newKey, refKeys);
      if (keyErrors.length === 0) break;
      keyErrors.forEach((error) => console.error(`  - ${error}`));
    }

    const confirm = await lib.ask(rl, `Rename '${oldKey}' to '${newKey}' in all ${config.fileNoun} files? (y/N): `);
    return confirm.toLowerCase() === 'y' ? { oldKey, newKey } : {};
  });
}

async function cmdRename(config, argv) {
  const { lib } = config;
  const refKeys = lib.referenceKeys();
  const files = config.files();
  const { args, flags } = parseFlags(argv);
  let [oldKey, newKey] = args.filter((arg) => !arg.startsWith('-'));

  if (!oldKey || !newKey) {
    if (!process.stdin.isTTY) {
      console.error(config.renameUsage);
      console.error('Run in an interactive terminal with no arguments to be prompted for each value.');
      process.exit(1);
    }
    ({ oldKey, newKey } = await promptRename(config, refKeys));
    if (!oldKey || !newKey) {
      console.log('Aborted — no key renamed.');
      return;
    }
  } else {
    const errors = validateRename(config, oldKey, newKey, refKeys);
    if (errors.length) {
      console.error(`FAIL Cannot rename '${oldKey}' to '${newKey}':`);
      errors.forEach((error) => console.error(`  - ${error}`));
      process.exit(1);
    }
  }

  const result = lib.renameKey(oldKey, newKey, files, { dryRun: flags.dryRun, silent: flags.json });
  if (flags.json) writeJson(result);
}

function cmdList(config, argv) {
  const { flags } = parseFlags(argv);
  const result = config.lib.listKeys({ prefix: flags.prefix });

  if (flags.json) {
    writeJson(result);
    return;
  }

  result.keys.forEach((key) => console.log(key));
  console.log(`\n${result.count} key(s).`);
}

async function runFlatMapCli(config) {
  const [command, ...argv] = process.argv.slice(2);

  if (!command || command === 'help' || command === '--help' || command === '-h') {
    console.log(config.help);
    process.exit(command ? 0 : 1);
  }

  config.requireDir();

  if (command === 'add') {
    await cmdAdd(config, argv);
    return;
  }

  if (command === 'remove') {
    await cmdRemove(config, argv);
    return;
  }

  if (command === 'rename') {
    await cmdRename(config, argv);
    return;
  }

  if (command === 'list') {
    cmdList(config, argv);
    return;
  }

  if (command === 'sync') {
    const { flags } = parseFlags(argv);
    const result = config.lib.sync({ checkOnly: argv.includes('--check'), dryRun: flags.dryRun, silent: flags.json });
    if (flags.json) writeJson(result);
    process.exitCode = result.hasErrors ? 1 : 0;
    return;
  }

  if (command === 'validate') {
    const { flags } = parseFlags(argv);
    const result = config.lib.sync({ checkOnly: true, dryRun: flags.dryRun, silent: flags.json });
    if (flags.json) writeJson(result);
    process.exitCode = result.hasErrors ? 1 : 0;
    return;
  }

  if (command === 'activate') {
    config.lib.activate();
    return;
  }

  if (command === 'types') {
    config.lib.generateTypes();
    return;
  }

  console.error(`Unknown command '${command}'.\n`);
  console.log(config.help);
  process.exit(1);
}

module.exports = { runFlatMapCli };
