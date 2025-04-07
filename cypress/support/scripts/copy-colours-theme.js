const fs = require('fs');
const path = require('path');

const colourThemeCode = process.env.COLOUR_THEME || 'default';
const sourcePath = path.join(__dirname, `../../support/colours/${colourThemeCode}-theme-colours.json`);
const destinationPath = path.join(__dirname, '../../support/colours/current-theme-colours.json');

if (!fs.existsSync(sourcePath)) {
  throw new Error(` file for colour code "${colourThemeCode}" does not exist.`);
}

fs.copyFileSync(sourcePath, destinationPath);
console.log(`Colour Theme file for "${colourThemeCode}" copied to "current-theme-colours.json".`);
