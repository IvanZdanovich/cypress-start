function getNodeTitle(node) {
  const arg = node.arguments[0];
  if (!arg) return null;
  if (arg.type === 'Literal' && typeof arg.value === 'string') return arg.value;
  if (arg.type === 'TemplateLiteral' && arg.expressions.length === 0) return arg.quasis[0].value.cooked;
  return null;
}

function getNodeQuoteChar(node) {
  const arg = node.arguments[0];
  if (arg && arg.type === 'TemplateLiteral') return '`';
  return "'";
}

// ---------------------------------------------------------------------------
// Replacement rule arrays — defined at module scope so regex objects are
// compiled exactly once per ESLint process rather than once per file linted.
// ---------------------------------------------------------------------------

const COMMON_REPLACEMENTS = [
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

const UI_REPLACEMENTS = [
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
  [/\bmove over\b/gi, 'hover'],
  [/\bgo to\b/gi, 'navigate'],
  [/\bbrowse to\b/gi, 'navigate'],
  [/\btextbox\b/gi, 'input field'],
  [/\btick box\b/gi, 'checkbox'],
  [/\boption button\b/gi, 'radio button'],
  [/\bpage tab\b/gi, 'tab'],
  [/\bpage navigation\b/gi, 'pagination'],
  [/\bpopup message\b/gi, 'toast'],
  [/\bx icon\b/gi, 'cross icon'],
  [/\bloading indicator\b/gi, 'spinner'],
  [/\brender\b/gi, 'display'],
  [/\bpresent\b/gi, 'display'],
  [/\bpress\b/gi, 'click'],
  [/\btap\b/gi, 'click'],
  [/\bfill\b/gi, 'input'],
  [/\bpick\b/gi, 'select'],
  [/\bunfold\b/gi, 'expand'],
  [/\bfold\b/gi, 'collapse'],
  [/\bmouseover\b/gi, 'hover'],
  [/\bvisit\b/gi, 'navigate'],
  [/\bsend\b/gi, 'submit'],
  [/\battach\b/gi, 'upload'],
  [/\breload\b/gi, 'refresh'],
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

const API_REPLACEMENTS = [
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

// Pre-computed combinations — selected by file type in create(); no array
// allocation or regex compilation happens at lint time.
const COMMON_ONLY_RULES = [...COMMON_REPLACEMENTS];
const UI_RULES = [...COMMON_REPLACEMENTS, ...UI_REPLACEMENTS];
const API_RULES = [...COMMON_REPLACEMENTS, ...API_REPLACEMENTS];

// ---------------------------------------------------------------------------

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
    const filename = context.filename;
    const isApiTest = filename.includes('/integration/api/');
    const isUiTest = filename.includes('/integration/ui/') || filename.includes('/e2e/ui/');

    // Select the pre-built rule set — no regex allocation at lint time.
    let replacementRules;
    if (isApiTest) {
      replacementRules = API_RULES;
    } else if (isUiTest) {
      replacementRules = UI_RULES;
    } else {
      replacementRules = COMMON_ONLY_RULES;
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
      const title = getNodeTitle(node);
      if (title === null) {
        return;
      }

      const { newTitle, hasChanges } = applyReplacements(title);

      if (hasChanges && newTitle !== title) {
        const quote = getNodeQuoteChar(node);
        context.report({
          node,
          message: `Test title "${title}" uses non-standard terminology. Use standardized terms instead.`,
          fix(fixer) {
            return fixer.replaceText(node.arguments[0], `${quote}${newTitle}${quote}`);
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
