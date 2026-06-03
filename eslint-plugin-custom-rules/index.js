module.exports = {
  rules: {
    'enforce-spec-blank-lines': require('./enforce-spec-blank-lines.js'),
    'do-not-allow-empty-blocks': require('./do-not-allow-empty-blocks.js'),
    'prevent-duplicated-titles': require('./prevent-duplicated-titles.js'),
    'prevent-examples-loops': require('./prevent-examples-loops.js'),
    'verify-test-title-pattern': require('./verify-test-title-pattern.js'),
    'verify-test-title-against-structure': require('./verify-test-title-against-structure.js'),
    'verify-todos-have-links': require('./verify-todos-have-links.js'),
    'verify-test-title-without-forbidden-symbols': require('./verify-test-title-without-forbidden-symbols.js'),
    'standardize-test-titles': require('./standardize-test-titles.js'),
    'verify-api-command-naming': require('./verify-api-command-naming.js'),
    'verify-ui-command-naming': require('./verify-ui-command-naming.js'),
    'find-unused-selectors': require('./find-unused-selectors.js'),
    'find-unused-examples': require('./find-unused-examples.js'),
    'verify-req-config': require('./verify-req-config.js'),
  },
};
