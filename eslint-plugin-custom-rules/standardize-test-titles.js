module.exports = {
  meta: {
    type: 'suggestion',
    docs: {
      description: 'Standardize terminology in test titles',
      category: 'Best Practices',
      recommended: true,
    },
    fixable: 'code',
    schema: [], // no options
  },
  create(context) {
    const uiInteractionTerms = {
      ' show': ' display',
      ' render': ' display',
      ' present': ' display',
      ' press': ' click',
      ' tap': ' click',
      ' enter': ' input',
      ' type': ' input',
      ' fill': ' input',
      ' choose': ' select',
      ' pick': ' select',
      ' open': ' expand',
      ' unfold': ' expand',
      ' close': ' collapse',
      ' fold': ' collapse',
      ' mouseover': ' hover',
      ' move over': ' hover',
      ' go to': ' navigate',
      ' browse to': ' navigate',
      ' visit': ' navigate',
      ' send': ' submit',
      ' attach': ' upload',
      ' reload': ' refresh',
    };

    const uiElementTerms = {
      ' btn': ' button',
      ' control': ' button',
      ' textbox': ' input field',
      ' select': ' dropdown',
      ' combobox': ' dropdown',
      ' check': ' checkbox',
      ' tick box': ' checkbox',
      ' option button': ' radio button',
      ' switch': ' toggle',
      ' image': ' icon',
      ' symbol': ' icon',
      ' hint': ' tooltip',
      ' popup': ' tooltip',
      ' dialog': ' modal',
      ' loader': ' spinner',
      ' loading indicator': ' spinner',
      ' page tab': ' tab',
      ' section': ' panel',
      ' area': ' panel',
      ' side panel': ' sidebar',
      ' side menu': ' sidebar',
      ' top bar': ' header',
      ' title bar': ' header',
      ' bottom bar': ' footer',
      ' page navigation': ' pagination',
      ' alert': ' notification',
      ' message': ' notification',
      ' popup message': ' toast',
      ' x icon': ' cross icon',
    };

    const assertionTerms = {
      ' is shown': ' is displayed',
      ' is visible': ' is displayed',
      ' appears': ' is displayed',
      ' is active': ' is enabled',
      ' is clickable': ' is enabled',
      ' is inactive': ' is disabled',
      ' is not clickable': ' is disabled',
      ' is checked': ' is selected',
      ' is chosen': ' is selected',
      ' is same as': ' matches',
      ' is present': ' exists',
      ' is available': ' exists',
      ' is not present': ' does not exist',
      ' is unavailable': ' does not exist',
      ' contains attribute': ' has attribute',
      ' contains class': ' has class',
      ' contains value': ' has value',
      ' contains text': ' has text',
      ' has length': ' has count',
      ' has size': ' has count',
      ' is ordered': ' is sorted',
      ' has focus': ' is focused',
    };

    const apiTerms = {
      ' respond with': ' return',
      ' give back': ' return',
      ' response code': ' status code',
      ' HTTP code': ' status code',
      ' payload': ' body',
      ' content': ' body',
      ' HTTP header': ' header',
      ' param': ' parameter',
      ' arg': ' parameter',
      ' query param': ' query parameter',
      ' query string': ' query parameter',
      ' path param': ' path parameter',
      ' URL param': ' path parameter',
      ' call': ' request',
      ' result': ' response',
      ' output': ' response',
      ' authorize': ' authenticate',
      ' login': ' authenticate',
      ' verify': ' validate',
      ' check': ' validate',
      ' add': ' create',
      ' insert': ' create',
      ' fetch': ' retrieve',
      ' modify': ' update',
      ' remove': ' delete',
      ' pass': ' succeed',
      ' be successful': ' succeed',
      ' error': ' fail',
      ' be unsuccessful': ' fail',
    };

    const commonInconsitencies = {
      '"': '',
      "'": '',
      '`': '',
      '“': '',
      '”': '',
      '‘': '',
      '’': '',
      ';': '',
      '!': '',
      '?': '',
      '(': '',
      ')': '',
      '{': '',
      '}': '',
      '[': '',
      ']': '',
      '%': ' percent',
      '&': ' and ',
      ' > ': ' more than ',
      ' < ': ' less than ',
      ' >= ': ' greater than or equal to ',
      ' <= ': ' less than or equal to ',
      ' = ': ' equals ',
      ': Should ': ': Then ',
      '/': ' or ',
      '\\': '',
      '|': '',
      '=': ' equals ',
      '+': ' plus ',
      '*': ' times ',
      '#': '',
      '@': '',
      '^': '',
      '~': '',
      _: '',
    };

    function replaceCommonInconsistencies(title, commonInconsitencies) {
      let newTitle = title;
      let hasChanges = false;
      for (const [oldTerm, newTerm] of Object.entries(commonInconsitencies)) {
        if (newTitle.includes(oldTerm)) {
          newTitle = newTitle.split(oldTerm).join(newTerm);
          hasChanges = true;
        }
      }
      return { newTitle, hasChanges };
    }

    function findMultiWordMatch(tokens, i, multiWordTerms) {
      for (const [oldTerm, newTerm] of Object.entries(multiWordTerms)) {
        if (!oldTerm.includes(' ')) continue;
        const termTokens = oldTerm.split(/(\s+|\b)/);
        let matchFound = true;
        for (let j = 0; j < termTokens.length; j++) {
          if (i + j >= tokens.length || tokens[i + j] !== termTokens[j]) {
            matchFound = false;
            break;
          }
        }
        if (matchFound) {
          return { newTerm, skip: termTokens.length - 1 };
        }
      }
      return null;
    }

    function findSingleWordMatch(token, uiElementTerms, uiInteractionTerms, singleWordTerms) {
      if (uiElementTerms[token]) return uiElementTerms[token];
      if (uiInteractionTerms[token]) return uiInteractionTerms[token];
      for (const [oldTerm, newTerm] of Object.entries(singleWordTerms)) {
        if (!oldTerm.includes(' ') && token === oldTerm) {
          return newTerm;
        }
      }
      return null;
    }

    function checkAndFixTestTitle(node) {
      if (typeof node.arguments[0].value !== 'string') {
        return;
      }

      const title = node.arguments[0].value;
      let hasChanges = false;

      // 1. Replace common inconsistencies
      const { newTitle, hasChanges: inconsistenciesChanged } = replaceCommonInconsistencies(title, commonInconsitencies);
      hasChanges = inconsistenciesChanged;

      // 2. Tokenize and process
      const tokens = newTitle.split(/(\s+|\b)/);
      const processedTokens = [];
      const multiWordTerms = { ...assertionTerms, ...apiTerms, ...commonInconsitencies };
      const singleWordTerms = { ...assertionTerms, ...apiTerms, ...commonInconsitencies };

      let i = 0;
      while (i < tokens.length) {
        const token = tokens[i];

        if (/^\s+$/.test(token) || /^[^\w\s]$/.test(token) || /^[A-Z]/.test(token)) {
          processedTokens.push(token);
          i++;
          continue;
        }

        // Multi-word match
        const multiWordResult = findMultiWordMatch(tokens, i, multiWordTerms);
        if (multiWordResult) {
          processedTokens.push(multiWordResult.newTerm);
          i += multiWordResult.skip + 1;
          hasChanges = true;
          continue;
        }

        // Single-word match
        const singleWordResult = findSingleWordMatch(token, uiElementTerms, uiInteractionTerms, singleWordTerms);
        if (singleWordResult) {
          processedTokens.push(singleWordResult);
          hasChanges = true;
        } else {
          processedTokens.push(token);
        }
        i++;
      }

      const finalTitle = processedTokens.join('');

      if (hasChanges && finalTitle !== title) {
        context.report({
          node,
          message: `Test title "${title}" uses non-standard terminology. Use standardized terms instead.`,
          fix(fixer) {
            return fixer.replaceText(node.arguments[0], `'${finalTitle}'`);
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
