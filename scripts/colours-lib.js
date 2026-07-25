/**
 * colours-lib.js
 *
 * Colour-theme binding of the shared flat dot-namespaced map core
 * (scripts/flat-map-lib.js). Declares the theme file locations, key grammar,
 * colour-value validation, and message wording, then re-exports the shared
 * behaviour under the colour-specific names consumed by scripts/colours.js.
 *
 * Aligned with the colour-theme-testing skill (grammar).
 */

const path = require('path');
const { createFlatMapLib } = require('./flat-map-lib');

const ROOT = path.join(__dirname, '..');

// Accepted CSS colour value forms: rgb(), rgba(), or #hex (3 or 6 digits).
// Composed from simple named fragments so no single pattern is hard to read.
const RGB_TRIPLET = String.raw`\s*\d{1,3}\s*,\s*\d{1,3}\s*,\s*\d{1,3}\s*`;
const ALPHA = String.raw`\s*(?:0|1|0?\.\d+)\s*`;
const HEX = String.raw`#(?:[0-9a-fA-F]{3}|[0-9a-fA-F]{6})`;
const COLOUR_VALUE = new RegExp(`^(?:rgb\\(${RGB_TRIPLET}\\)|rgba\\(${RGB_TRIPLET},${ALPHA}\\)|${HEX})$`);

const lib = createFlatMapLib({
  dir: path.join(ROOT, 'cypress', 'colours'),
  typesFile: path.join(ROOT, 'cypress', 'support', 'colours.d.ts'),
  referenceFile: 'default-theme-colours.json',
  referenceCode: 'default',
  generatedFile: 'colours.json',
  placeholder: 'MISSING_COLOUR',
  fileSuffix: '-theme-colours.json',
  depthHint: 'component.state',
  minDepth: 2, // at least component.state
  maxDepth: 4, // ceiling
  requiredValueMessage: 'A colour value is required.',
  emptyValueMessage: 'The value must not be empty — assign a colour (e.g. "rgb(0, 0, 0)").',
  extraValueErrors: (value) => (COLOUR_VALUE.test(value) ? [] : [`'${value}' is not a valid colour — use rgb(…), rgba(…), or #hex.`]),
  emptySyncHint: 'assign a proper colour value (e.g. "rgb(0, 0, 0)").',
  envVar: 'COLOUR_THEME',
  activateSelectLabel: 'Colour theme file for code',
  activateCopyLabel: 'Colour theme file',
  dirLabel: 'Colours',
  fileNoun: 'theme',
  syncLabel: 'Colour',
  cliScript: 'colours.js',
  keysLabel: 'colour keys',
  regenerateHint: 'npm run colours:gen-types',
  typeName: 'ColourKey',
  globalName: 'colours',
  mapDescription: 'Flat colour-theme map: every dot-namespaced key resolves to the active-theme colour value.',
  typesBaseName: 'colours.d.ts',
  codeRoot: path.join(ROOT, 'cypress'),
});

module.exports = {
  REFERENCE_CODE: lib.REFERENCE_CODE,
  PLACEHOLDER: lib.PLACEHOLDER,
  themeCodeOf: lib.codeOf,
  themeFiles: lib.files,
  requireColoursDir: lib.requireDir,
  referenceKeys: lib.referenceKeys,
  activate: lib.activate,
  generateTypes: lib.generateTypes,
  regenerateActiveMapAndTypes: lib.regenerateActiveMapAndTypes,
  validateKey: lib.validateKey,
  validateValue: lib.validateValue,
  listKeys: lib.listKeys,
  addKey: lib.addKey,
  removeKeys: lib.removeKeys,
  renameKey: lib.renameKey,
  sync: lib.sync,
  ask: lib.ask,
  withPrompt: lib.withPrompt,
};
