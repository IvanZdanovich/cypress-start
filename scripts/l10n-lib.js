/**
 * l10n-lib.js
 *
 * Localization binding of the shared flat dot-namespaced map core
 * (scripts/flat-map-lib.js). Declares the localization file locations, key
 * grammar, and message wording, then re-exports the shared behaviour under the
 * localization-specific names consumed by scripts/l10n.js.
 *
 * Aligned with the localization-testing skill (grammar, scopes).
 */

const path = require('path');
const { createFlatMapLib } = require('./flat-map-lib');

const ROOT = path.join(__dirname, '..');

// Declared feature scopes — kept in sync with the localization-testing skill.
const FEATURE_SCOPES = ['auditList', 'auditCreate', 'auditView', 'auditPerform', 'auditRound', 'auditType', 'action', 'actionPriority', 'questionCategory', 'questionPriority', 'template', 'editTemplate', 'translationSettings', 'common'];

const lib = createFlatMapLib({
  dir: path.join(ROOT, 'cypress', 'localization'),
  typesFile: path.join(ROOT, 'cypress', 'support', 'l10n.d.ts'),
  referenceFile: 'en-localization.json',
  referenceCode: 'en',
  generatedFile: 'l10n.json',
  placeholder: 'MISSING_TRANSLATION',
  fileSuffix: '-localization.json',
  scopes: FEATURE_SCOPES,
  scopeLabel: 'feature scope',
  depthHint: 'feature.area',
  minDepth: 2, // at least feature.area
  maxDepth: 5, // ceiling for table headers / option groups
  requiredValueMessage: 'An english value is required.',
  emptyValueMessage: 'The value must not be empty — assign a real translation string.',
  emptySyncHint: 'assign a proper translation string.',
  envVar: 'LANGUAGE',
  activateSelectLabel: 'Localization file for language code',
  activateCopyLabel: 'Localization file',
  dirLabel: 'Localization',
  fileNoun: 'locale',
  syncLabel: 'Localization',
  cliScript: 'l10n.js',
  keysLabel: 'localization keys',
  regenerateHint: 'npm run l10n:gen-types',
  typeName: 'L10nKey',
  globalName: 'l10n',
  mapDescription: 'Flat localization map: every dot-namespaced key resolves to the active-language string.',
  typesBaseName: 'l10n.d.ts',
});

module.exports = {
  REFERENCE_CODE: lib.REFERENCE_CODE,
  PLACEHOLDER: lib.PLACEHOLDER,
  FEATURE_SCOPES: lib.SCOPES,
  langCodeOf: lib.codeOf,
  localeFiles: lib.files,
  requireLocalizationDir: lib.requireDir,
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
