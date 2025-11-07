module.exports = {
  meta: {
    type: 'problem',
    docs: {
      description: 'Verify all TODO/FIXME comments have a direct link to a bug tracking system ticket',
      category: 'Best Practices',
      recommended: false,
    },
    schema: [],
  },
  create(context) {
    const keywordsPattern = /\b(?:TODO|todo|ToDo|FIXME|fixme|FixMe)\b/;
    const bugTrackingLinkPattern = /https?:\/\/[\w.-]+\/browse\/[A-Z0-9]+-\d+/;

    return {
      Program() {
        const sourceCode = context.getSourceCode();
        const allComments = sourceCode.getAllComments();

        allComments.forEach((comment) => {
          if (keywordsPattern.test(comment.value) && !bugTrackingLinkPattern.test(comment.value)) {
            context.report({
              loc: comment.loc,
              message: 'Found TODO/FIXME comment without direct link to a bug tracking system ticket',
            });
          }
        });
      },
    };
  },
};
