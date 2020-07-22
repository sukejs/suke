/**
 * https://github.com/jsdom/jsdom/issues/1537
 */
export function isInJsdom() {
  return navigator.userAgent.includes('Node.js') || navigator.userAgent.includes('jsdom');
}

/**
 * More domReady
 * https://github.com/ded/domready
 */
export const domReady = () => {
  return new Promise((resolve) => {
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', resolve);
    } else {
      resolve();
    }
  });
};

export function saferEval(expression, dataContext, additionalHelperVariables = {}) {
  // eslint-disable-next-line no-new-func
  return new Function(
    ['$data', ...Object.keys(additionalHelperVariables)],
    `var result; with($data) { result = ${expression} }; return result`
  )(dataContext, ...Object.values(additionalHelperVariables));
}

export function debounce(func, wait, context) {
  return function () {
    let args = arguments;
    let later = function () {
      context.debounceTimeout = null;
      func.apply(context, args);
    };
    clearTimeout(context.debounceTimeout);
    context.debounceTimeout = setTimeout(later, wait);
  };
}

export function walk(el, callback) {
  if (callback(el) === false) return;

  let node = el.firstElementChild;

  while (node) {
    walk(node, callback);

    node = node.nextElementSibling;
  }
}

const kAttrRE = /^k-(on|bind|data|text|html|model|if|for|show|cloak|transition|ref)\b/;

export function isKAttr(attr) {
  const name = replaceAtAndColonWithStandardSyntak(attr.name);
  return kAttrRE.test(name);
}

export function getKAttrs(el, type) {
  return Array.from(el.attributes)
    .filter(isKAttr)
    .map((attr) => {
      const name = replaceAtAndColonWithStandardSyntak(attr.name);

      const typeMatch = name.match(kAttrRE);
      const valueMatch = name.match(/:([a-zA-Z\-:]+)/);
      const modifiers = name.match(/\.[^.\]]+(?=[^\]]*$)/g) || [];

      return {
        type: typeMatch ? typeMatch[1] : null,
        value: valueMatch ? valueMatch[1] : null,
        modifiers: modifiers.map((i) => i.replace('.', '')),
        expression: attr.value
      };
    })
    .filter((i) => {
      // If no type is passed in for filtering, bypass filter
      if (!type) return true;

      return i.type === type;
    });
}

export function replaceAtAndColonWithStandardSyntak(name) {
  if (name.startsWith('@')) {
    return name.replace('@', 'x-on:');
  } else if (name.startsWith(':')) {
    return name.replace(':', 'x-bind:');
  }

  return name;
}

export function kebabCase(subject) {
  return subject
    .replace(/([a-z])([A-Z])/g, '$1-$2')
    .replace(/[_\s]/, '-')
    .toLowerCase();
}
