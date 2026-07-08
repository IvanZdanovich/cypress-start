const fs = require('fs');
const path = require('path');

const colourThemeCode = process.env.COLOUR_THEME || 'default';
const sourcePath = path.join(__dirname, `../cypress/colours/${colourThemeCode}-theme-colours.json`);
const destinationPath = path.join(__dirname, '../cypress/colours/colours.json');

if (!fs.existsSync(sourcePath)) {
  throw new Error(`Colour theme file for code "${colourThemeCode}" does not exist.`);
}

fs.copyFileSync(sourcePath, destinationPath);
console.log(`Colour theme file for "${colourThemeCode}" copied to "colours.json".`);
