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

// Pure: apply every mapping to the content and report which ones changed it
function applyMappings(content, mappings) {
  const changes = [];
  let updated = content;

  for (const [oldName, newName] of Object.entries(mappings)) {
    const next = replaceCommandInContent(updated, oldName, newName);
    if (next !== updated) {
      changes.push(`${oldName} → ${newName}`);
      updated = next;
    }
  }

  return { content: updated, changes };
}

// Function to process a single file
function processFile(filePath) {
  const relativePath = filePath.replace(path.join(__dirname, '..'), '');
  const { content, changes } = applyMappings(fs.readFileSync(filePath, 'utf8'), commandMappings);

  if (changes.length > 0) {
    fs.writeFileSync(filePath, content, 'utf8');
    console.log(`  ${relativePath}`);
    for (const change of changes) console.log(`  ${change}`);
  }
}

// Function to recursively find all .js files in a directory
function getAllFiles(dirPath) {
  return fs
    .readdirSync(dirPath, { withFileTypes: true, recursive: true })
    .filter((entry) => entry.isFile() && entry.name.endsWith('.js'))
    .map((entry) => path.join(entry.parentPath, entry.name));
}

// Main execution
const cypressDir = path.join(__dirname, '..', 'cypress');
console.log('Renaming commands to follow naming convention...\n');

// Get all relevant files
const allFiles = getAllFiles(cypressDir);
console.log(`Processing ${allFiles.length} files...\n`);

// Process each file
for (const file of allFiles) processFile(file);

console.log('\nCommand renaming complete!');
console.log('\nTransformations applied.');
