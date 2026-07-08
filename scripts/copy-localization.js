const fs = require('fs');
const path = require('path');

const languageCode = process.env.LANGUAGE || 'en';
const sourcePath = path.join(__dirname, `../cypress/localization/${languageCode}-localization.json`);
const destinationPath = path.join(__dirname, '../cypress/localization/l10n.json');

if (!fs.existsSync(sourcePath)) {
  throw new Error(`Localization file for language code "${languageCode}" does not exist.`);
}

fs.copyFileSync(sourcePath, destinationPath);
console.log(`Localization file for "${languageCode}" copied to "l10n.json".`);
