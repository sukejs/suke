/* eslint-disable max-params */
/* eslint-disable indent */
import { kebabCase } from '../utils';

export function registerListener(component, el, event, modifiers, expression, extraVars = {}) {
  if (modifiers.includes('away')) {
    const handler = (e) => {
      if (el.contains(e.target)) return;
      if (el.offsetWidth < 1 && el.offsetHeight < 1) return;
      runListenerHandler(component, expression, e, extraVars);

      if (modifiers.includes('once')) {
        document.removeEventListener(event, handler);
      }
    };

    document.addEventListener(event, handler);
  } else {
    const listenerTarget = modifiers.includes('window')
      ? window
      : modifiers.includes('document')
      ? document
      : el;

    const handler = (e) => {
      if (listenerTarget === window || listenerTarget === document) {
        if (!document.body.contains(el)) {
          listenerTarget.removeEventListener(event, handler);
          return;
        }
      }

      if (isKeyEvent(event)) {
        if (isListeningForASpecificKeyThatHasntBeenPressed(e, modifiers)) {
          return;
        }
      }

      if (modifiers.includes('prevent')) e.preventDefault();
      if (modifiers.includes('stop')) e.stopPropagation();

      const returnValue = runListenerHandler(component, expression, e, extraVars);

      if (returnValue === false) {
        e.preventDefault();
      } else {
        if (modifiers.includes('once')) {
          listenerTarget.removeEventListener(event, handler);
        }
      }
    };

    listenerTarget.addEventListener(event, handler);
  }
}

function runListenerHandler(component, expression, e, extraVars) {
  return component.evaluateCommandExpression(e.target, expression, () => {
    return { ...extraVars(), $event: e };
  });
}

function isKeyEvent(event) {
  return ['keydown', 'keyup'].includes(event);
}

function isListeningForASpecificKeyThatHasntBeenPressed(e, modifiers) {
  let keyModifiers = modifiers.filter((i) => {
    return !['window', 'document', 'prevent', 'stop'].includes(i);
  });

  if (keyModifiers.length === 0) return false;

  if (keyModifiers.length === 1 && keyModifiers[0] === keyToModifier(e.key)) return false;

  const systemKeyModifiers = ['ctrl', 'shift', 'alt', 'meta', 'cmd', 'super'];
  const selectedSystemKeyModifiers = systemKeyModifiers.filter((modifier) =>
    keyModifiers.includes(modifier)
  );

  keyModifiers = keyModifiers.filter((i) => !selectedSystemKeyModifiers.includes(i));

  if (selectedSystemKeyModifiers.length > 0) {
    const activelyPressedKeyModifiers = selectedSystemKeyModifiers.filter((modifier) => {
      // eslint-disable-next-line no-param-reassign
      if (modifier === 'cmd' || modifier === 'super') modifier = 'meta';

      return e[`${modifier}Key`];
    });

    if (activelyPressedKeyModifiers.length === selectedSystemKeyModifiers.length) {
      if (keyModifiers[0] === keyToModifier(e.key)) return false;
    }
  }

  return true;
}

function keyToModifier(key) {
  switch (key) {
    case '/':
      return 'slash';
    case ' ':
    case 'Spacebar':
      return 'space';
    default:
      return kebabCase(key);
  }
}
