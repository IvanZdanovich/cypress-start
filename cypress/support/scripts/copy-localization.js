const fs = require('fs');
const path = require('path');

// Get language parameter from environment variable
const languageCode = process.env.LANGUAGE || 'en';

if (!languageCode) {
  throw new Error('Language argument is missing');
}

console.log(`Language code: ${languageCode}`);

// Add your localization copying logic here
const sourcePath = path.join(__dirname, `../../support/localization/${languageCode}-localization.json`);
const destinationPath = path.join(__dirname, '../../support/localization/l10n.json');

console.log(`Source path: ${sourcePath}`);

if (!fs.existsSync(sourcePath)) {
  throw new Error(`Localization file for language code "${languageCode}" does not exist.`);
}

fs.copyFileSync(sourcePath, destinationPath);
console.log(`Localization file for "${languageCode}" copied to "l10n.json".`);
