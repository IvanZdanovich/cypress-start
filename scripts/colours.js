#!/usr/bin/env node
/**
 * colours.js — unified CLI for the colour-theme module.
 *
 * One entry point for every colour operation, backed by scripts/colours-lib.js.
 * Replaces the former per-task scripts (copy-colours, gen-colours-types,
 * sync-colours) with subcommands. Mirrors scripts/l10n.js.
 *
 * Usage:
 *   node scripts/colours.js <command> [args]
 *
 * Commands:
 *   add [<key> <value> [--<theme>="value" ...]] [--dry-run] [--json]
 *   remove [<key> ...] [--dry-run] [--json]
 *   rename [<old-key> <new-key>] [--dry-run] [--json]
 *   list [--prefix=<prefix>] [--json]
 *   validate [--json]
 *   sync [--check] [--dry-run] [--json]
 *   activate                                      Copy the COLOUR_THEME-selected theme file to the active colours.json.
 *   types                                         Regenerate cypress/support/colours.d.ts from the reference theme file.
 *   help                                          Show this help.
 *
 * Examples:
 *   node scripts/colours.js add button.marked "rgb(20, 163, 139)"
 *   node scripts/colours.js rename button.marked button.primary.marked --dry-run
 *   node scripts/colours.js list --prefix=button. --json
 *   node scripts/colours.js remove toaster.error
 *   node scripts/colours.js validate
 */

const lib = require('./colours-lib');
const { runFlatMapCli } = require('./flat-map-cli');

const HELP = `colours — colour-theme module CLI

Usage: node scripts/colours.js <command> [args]

Commands:
  add [<key> <value> [--<theme>="value" ...]] [--dry-run] [--json]
                                                     Add a key to every theme file (interactive if no args).
  remove [<key> ...] [--dry-run] [--json]            Remove key(s) from every theme file (interactive if no args).
  rename [<old-key> <new-key>] [--dry-run] [--json]  Rename a key in every theme file and rewrite colours['key'] usages (interactive if no args).
  list [--prefix=<prefix>] [--json]                  List reference colour keys.
  validate [--json]                                  Check theme files without writing.
  sync [--check] [--dry-run] [--json]                Align theme files (add missing, sort); --check reports only.
  activate                                      Copy the COLOUR_THEME-selected theme file to the active colours.json.
  types                                         Regenerate cypress/support/colours.d.ts from the reference theme file.
  help                                          Show this help.`;

runFlatMapCli({
  lib,
  help: HELP,
  requireDir: lib.requireColoursDir,
  files: lib.themeFiles,
  codeOf: lib.themeCodeOf,
  overridePattern: /^--([a-zA-Z][a-zA-Z0-9]*)=(.*)$/,
  keyPrompt: 'Key (component.state): ',
  valuePrompt: 'Colour value (rgb(…) / rgba(…) / #hex): ',
  fileNoun: 'theme',
  addUsage: 'Usage: node scripts/colours.js add <key> <value> [--<theme>="value" ...] [--dry-run] [--json]',
  removeUsage: 'Usage: node scripts/colours.js remove <key> [<key> ...] [--dry-run] [--json]',
  renameUsage: 'Usage: node scripts/colours.js rename <old-key> <new-key> [--dry-run] [--json]',
}).catch((error) => {
  console.error(`FAIL ${error.message}`);
  process.exit(1);
});
