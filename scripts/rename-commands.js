const fs = require('fs');
const path = require('path');

// Mapping of old API command names to new API command names
const commandMappings = {
  actualCommandName: 'expectedCommandName',
};

// Function to escape special regex characters
function escapeRegExp(string) {
  return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

// Function to replace command name in file content
function replaceCommandInContent(content, oldName, newName) {
  const escapedOldName = escapeRegExp(oldName);

  // Replace in Cypress.Commands.add('oldName', ...)
  let updatedContent = content.replace(new RegExp(`Cypress\\.Commands\\.add\\('${escapedOldName}'`, 'g'), `Cypress.Commands.add('${newName}'`);

  // Replace in cy.oldName(...) calls
  updatedContent = updatedContent.replace(new RegExp(`cy\\.${escapedOldName}\\(`, 'g'), `cy.${newName}(`);

  // Replace in error messages and comments that reference the old name
  updatedContent = updatedContent.replace(new RegExp(`'${escapedOldName}:`, 'g'), `'${newName}:`);
  updatedContent = updatedContent.replace(new RegExp(`"${escapedOldName}:`, 'g'), `"${newName}:`);

  return updatedContent;
}

// Function to process a single file
function processFile(filePath) {
  const relativePath = filePath.replace(path.join(__dirname, '..'), '');
  let content = fs.readFileSync(filePath, 'utf8');
  let modified = false;
  const changes = [];

  Object.entries(commandMappings).forEach(([oldName, newName]) => {
    const oldContent = content;
    content = replaceCommandInContent(content, oldName, newName);
    if (content !== oldContent) {
      modified = true;
      changes.push(`${oldName} → ${newName}`);
    }
  });

  if (modified) {
    fs.writeFileSync(filePath, content, 'utf8');
    console.log(`  ${relativePath}`);
    changes.forEach((change) => console.log(`  ${change}`));
  }
}

// Function to recursively find all files in a directory
function getAllFiles(dirPath, arrayOfFiles = []) {
  const files = fs.readdirSync(dirPath);

  files.forEach((file) => {
    const fullPath = path.join(dirPath, file);
    if (fs.statSync(fullPath).isDirectory()) {
      arrayOfFiles = getAllFiles(fullPath, arrayOfFiles);
    } else if (file.endsWith('.js') || file.endsWith('.spec.js')) {
      arrayOfFiles.push(fullPath);
    }
  });

  return arrayOfFiles;
}

// Main execution
const cypressDir = path.join(__dirname, '..', 'cypress');
console.log('Renaming commands to follow naming convention...\n');

// Get all relevant files
const allFiles = getAllFiles(cypressDir);
console.log(`Processing ${allFiles.length} files...\n`);

// Process each file
allFiles.forEach(processFile);

console.log('\nCommand renaming complete!');
console.log('\nTransformations applied.');
