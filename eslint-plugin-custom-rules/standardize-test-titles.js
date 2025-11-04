module.exports = {
  meta: {
    type: 'suggestion',
    docs: {
      description: 'Standardize terminology in test titles',
      category: 'Best Practices',
      recommended: true,
    },
    fixable: 'code',
    schema: [],
  },
  create(context) {
    const filename = context.getFilename();
    const isApiTest = filename.includes('/integration/api/');
    const isUiTest = filename.includes('/integration/ui/') || filename.includes('/e2e/ui/');

    // Common replacements for all tests
    const commonReplacements = [
      // Common inconsistencies - apply first to clean up formatting
      [/"/g, ''],
      [/'/g, ''],
      [/`/g, ''],
      [/"/g, ''],
      [/"/g, ''],
      [/'/g, ''],
      [/'/g, ''],
      [/;/g, ''],
      [/!/g, ''],
      [/\?/g, ''],
      [/\(/g, ''],
      [/\)/g, ''],
      [/\{/g, ''],
      [/\\}/g, ''],
      [/\[/g, ''],
      [/\\]/g, ''],
      [/%/g, ' percent'],
      [/&/g, ' and '],
      [/ > /g, ' more than '],
      [/ < /g, ' less than '],
      [/ >= /g, ' greater than or equal to '],
      [/ <= /g, ' less than or equal to '],
      [/: Should /g, ': Then '],
      [/\//g, ' or '],
      [/\\/g, ''],
      [/\|/g, ''],
      [/ = /g, ' equals '],
      [/\+/g, ' plus '],
      [/\*/g, ' times '],
      [/#/g, ''],
      [/@/g, ''],
      [/\^/g, ''],
      [/~/g, ''],
      [/_/g, ''],
    ];

    // UI-specific replacements
    const uiReplacements = [
      // Multi-word assertion terms (check before single words)
      [/\bis shown\b/gi, 'is displayed'],
      [/\bis visible\b/gi, 'is displayed'],
      [/\bappears\b/gi, 'is displayed'],
      [/\bis active\b/gi, 'is enabled'],
      [/\bis clickable\b/gi, 'is enabled'],
      [/\bis inactive\b/gi, 'is disabled'],
      [/\bis not clickable\b/gi, 'is disabled'],
      [/\bis checked\b/gi, 'is selected'],
      [/\bis chosen\b/gi, 'is selected'],
      [/\bis same as\b/gi, 'matches'],
      [/\bis present\b/gi, 'exists'],
      [/\bis available\b/gi, 'exists'],
      [/\bis not present\b/gi, 'does not exist'],
      [/\bis unavailable\b/gi, 'does not exist'],
      [/\bcontains attribute\b/gi, 'has attribute'],
      [/\bcontains class\b/gi, 'has class'],
      [/\bcontains value\b/gi, 'has value'],
      [/\bcontains text\b/gi, 'has text'],
      [/\bis ordered\b/gi, 'is sorted'],
      [/\bhas focus\b/gi, 'is focused'],

      // Multi-word UI interaction terms
      [/\bmove over\b/gi, 'hover'],
      [/\bgo to\b/gi, 'navigate'],
      [/\bbrowse to\b/gi, 'navigate'],

      // Multi-word UI element terms
      [/\btextbox\b/gi, 'input field'],
      [/\btick box\b/gi, 'checkbox'],
      [/\boption button\b/gi, 'radio button'],
      [/\bpage tab\b/gi, 'tab'],
      [/\bpage navigation\b/gi, 'pagination'],
      [/\bpopup message\b/gi, 'toast'],
      [/\bx icon\b/gi, 'cross icon'],
      [/\bloading indicator\b/gi, 'spinner'],

      // Single-word UI interaction terms
      [/\brender\b/gi, 'display'],
      [/\bpresent\b/gi, 'display'],
      [/\bpress\b/gi, 'click'],
      [/\btap\b/gi, 'click'],
      [/\bfill\b/gi, 'input'],
      [/\bchoose\b/gi, 'select'],
      [/\bpick\b/gi, 'select'],
      [/\bopen\b/gi, 'expand'],
      [/\bunfold\b/gi, 'expand'],
      [/\bfold\b/gi, 'collapse'],
      [/\bmouseover\b/gi, 'hover'],
      [/\bvisit\b/gi, 'navigate'],
      [/\bsend\b/gi, 'submit'],
      [/\battach\b/gi, 'upload'],
      [/\breload\b/gi, 'refresh'],

      // Single-word UI element terms
      [/\bbtn\b/gi, 'button'],
      [/\bcontrol\b/gi, 'button'],
      [/\bcombobox\b/gi, 'dropdown'],
      [/\bcheck\b/gi, 'checkbox'],
      [/\bswitch\b/gi, 'toggle'],
      [/\bimage\b/gi, 'icon'],
      [/\bsymbol\b/gi, 'icon'],
      [/\bhint\b/gi, 'tooltip'],
      [/\bpopup\b/gi, 'tooltip'],
      [/\bdialog\b/gi, 'modal'],
      [/\bloader\b/gi, 'spinner'],
      [/\barea\b/gi, 'panel'],
      [/\balert\b/gi, 'notification'],
    ];

    // API-specific replacements
    const apiReplacements = [
      // Multi-word API terms
      [/\brespond with\b/gi, 'return'],
      [/\bgive back\b/gi, 'return'],
      [/\bresponse code\b/gi, 'status code'],
      [/\bHTTP code\b/gi, 'status code'],
      [/\bHTTP header\b/gi, 'header'],
      [/\bquery param\b/gi, 'query parameter'],
      [/\bquery string\b/gi, 'query parameter'],
      [/\bpath param\b/gi, 'path parameter'],
      [/\bURL param\b/gi, 'path parameter'],
      [/\bbe successful\b/gi, 'succeed'],
      [/\bbe unsuccessful\b/gi, 'fail'],
    ];

    // Build the replacement rules based on test type
    let replacementRules = [...commonReplacements];
    if (isUiTest) {
      replacementRules = [...replacementRules, ...uiReplacements];
    }
    if (isApiTest) {
      replacementRules = [...replacementRules, ...apiReplacements];
    }

    function applyReplacements(title) {
      let newTitle = title;
      let hasChanges = false;

      for (const [pattern, replacement] of replacementRules) {
        const updated = newTitle.replace(pattern, replacement);
        if (updated !== newTitle) {
          newTitle = updated;
          hasChanges = true;
        }
      }

      // Clean up multiple spaces and trim
      if (hasChanges) {
        newTitle = newTitle.replace(/\s+/g, ' ').trim();
      }

      return { newTitle, hasChanges };
    }

    function checkAndFixTestTitle(node) {
      if (typeof node.arguments[0].value !== 'string') {
        return;
      }

      const title = node.arguments[0].value;
      const { newTitle, hasChanges } = applyReplacements(title);

      if (hasChanges && newTitle !== title) {
        context.report({
          node,
          message: `Test title "${title}" uses non-standard terminology. Use standardized terms instead.`,
          fix(fixer) {
            return fixer.replaceText(node.arguments[0], `'${newTitle}'`);
          },
        });
      }
    }

    return {
      'CallExpression[callee.name="describe"]'(node) {
        checkAndFixTestTitle(node);
      },
      'CallExpression[callee.object.name="describe"][callee.property.name="skip"]'(node) {
        checkAndFixTestTitle(node);
      },
      'CallExpression[callee.name="context"]'(node) {
        checkAndFixTestTitle(node);
      },
      'CallExpression[callee.object.name="context"][callee.property.name="skip"]'(node) {
        checkAndFixTestTitle(node);
      },
      'CallExpression[callee.name="it"]'(node) {
        checkAndFixTestTitle(node);
      },
      'CallExpression[callee.object.name="it"][callee.property.name="skip"]'(node) {
        checkAndFixTestTitle(node);
      },
    };
  },
};
