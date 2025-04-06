module.exports = {
  meta: {
    type: 'problem',
    docs: {
      description: 'Verify all TODO/FIXME comments have a JIRA link',
      category: 'Best Practices',
      recommended: false,
    },
    schema: [],
  },
  create(context) {
    const keywordsPattern = /\b(?:TODO|todo|ToDo|FIXME|fixme|FixMe)\b/;
    const jiraLinkPattern = /https?:\/\/[\w.-]+\/browse\/[A-Z0-9]+-\d+/;

    return {
      Program() {
        const sourceCode = context.getSourceCode();
        const allComments = sourceCode.getAllComments();

        allComments.forEach((comment) => {
          if (keywordsPattern.test(comment.value) && !jiraLinkPattern.test(comment.value)) {
            context.report({
              loc: comment.loc,
              message: 'Found TODO/FIXME comment without a JIRA link.',
            });
          }
        });
      },
    };
  },
};
