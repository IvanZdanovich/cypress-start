#!/usr/bin/env node
/**
 * l10n.js — unified CLI for the localization module.
 *
 * One entry point for every localization operation, backed by scripts/l10n-lib.js.
 * Replaces the former per-task scripts (copy-localization, gen-l10n-types,
 * sync-localization, add-l10n-key, remove-l10n-key) with subcommands.
 *
 * Usage:
 *   node scripts/l10n.js <command> [args]
 *
 * Commands:
 *   add [<key> <english-value> [--<lang>="value" ...]] [--dry-run] [--json]
 *   remove [<key> ...] [--dry-run] [--json]
 *   rename [<old-key> <new-key>] [--dry-run] [--json]
 *   list [--prefix=<prefix>] [--json]
 *   validate [--json]
 *   sync [--check] [--dry-run] [--json]
 *   activate                                             Copy the LANGUAGE-selected locale file to the active l10n.json.
 *   types                                                Regenerate cypress/support/l10n.d.ts from the active map.
 *   help                                                 Show this help.
 *
 * Examples:
 *   node scripts/l10n.js add common.button.save "Save"
 *   node scripts/l10n.js rename auditList.title auditList.page.title --dry-run
 *   node scripts/l10n.js list --prefix=common.button. --json
 *   node scripts/l10n.js remove common.button.exportPdf
 *   node scripts/l10n.js validate
 */

const lib = require('./l10n-lib');
const { runFlatMapCli } = require('./flat-map-cli');

const HELP = `l10n — localization module CLI

Usage: node scripts/l10n.js <command> [args]

Commands:
  add [<key> <english-value> [--<lang>="value" ...]] [--dry-run] [--json]
                                                        Add a key to every locale file (interactive if no args).
  remove [<key> ...] [--dry-run] [--json]               Remove key(s) from every locale file (interactive if no args).
  rename [<old-key> <new-key>] [--dry-run] [--json]     Rename a key in every locale file (interactive if no args).
  list [--prefix=<prefix>] [--json]                     List reference localization keys.
  validate [--json]                                     Check locale files without writing.
  sync [--check] [--dry-run] [--json]                   Align locale files (add missing, sort); --check reports only.
  activate                                             Copy the LANGUAGE-selected locale file to the active l10n.json.
  types                                                Regenerate cypress/support/l10n.d.ts from the active map.
  help                                                 Show this help.`;

runFlatMapCli({
  lib,
  help: HELP,
  requireDir: lib.requireLocalizationDir,
  files: lib.localeFiles,
  codeOf: lib.langCodeOf,
  overridePattern: /^--([a-z]{2,5})=(.*)$/,
  keyPrompt: 'Key (feature.area.element[.role]): ',
  valuePrompt: 'English value: ',
  fileNoun: 'locale',
  addUsage: 'Usage: node scripts/l10n.js add <key> <english-value> [--<lang>="value" ...] [--dry-run] [--json]',
  removeUsage: 'Usage: node scripts/l10n.js remove <key> [<key> ...] [--dry-run] [--json]',
  renameUsage: 'Usage: node scripts/l10n.js rename <old-key> <new-key> [--dry-run] [--json]',
}).catch((error) => {
  console.error(`FAIL ${error.message}`);
  process.exit(1);
});
