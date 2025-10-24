module.exports = {
  rules: {
    'do-not-allow-empty-blocks': require('./do-not-allow-empty-blocks.js'),
    'prevent-duplicated-titles': require('./prevent-duplicated-titles.js'),
    'verify-test-title-pattern': require('./verify-test-title-pattern.js'),
    'verify-test-title-against-structure': require('./verify-test-title-against-structure.js'),
    'verify-todos-have-links': require('./verify-todos-have-links.js'),
    'verify-test-title-without-forbidden-symbols': require('./verify-test-title-witout-forbidden-symbols.js'),
    'standardize-test-titles': require('./standardize-test-titles.js'),
  },
};
