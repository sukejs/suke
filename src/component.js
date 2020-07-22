import { saferEval, debounce, walk, getKAttrs } from './utils';
import ObservableMembrane from 'observable-membrane';
import { registerListener } from './directives/on';
import { registerModelListener } from './directives/model';

export default class Component {
  constructor(el, seedData = null) {
    this.$el = el;

    const elAttr = this.$el.getAttribute('k-data');
    const initAttr = this.$el.getAttribute('k-init');

    const stringElAttr = elAttr === '' ? '{}' : elAttr;
    this.unobservedData = seedData ? seedData : saferEval(stringElAttr, {});

    let { membrane, data } = this.wrapDataInObservable(this.unobservedData);
    this.$data = data;
    this.membrane = membrane;

    this.unobservedData.$el = this.$el;
    this.unobservedData.$refs = this.getRefsProxy();

    this.nextTickStack = [];
    this.unobservedData.$nextTick = (callback) => {
      this.nextTickStack.push(callback);
    };

    this.watchers = {};
    this.unobservedData.$watch = (property, callback) => {
      if (!this.watchers[property]) this.watchers[property] = [];

      this.watchers[property].push(callback);
    };

    this.showDirectiveStack = [];
    this.showDirectiveLastElement = null;

    let initReturnedCallback = null;

    if (initAttr && !seedData) {
      this.pauseReactivity = true;
      initReturnedCallback = this.evaluateReturnExpression(this.$el, initAttr);
      this.pauseReactivity = false;
    }

    this.initializeElements(this.$el);
    this.listenForNewElementsToInitialize();

    if (typeof initReturnedCallback === 'function') {
      initReturnedCallback.call(this.$data);
    }
  }

  wrapDataInObservable(data) {
    let self = this;

    let membrane = new ObservableMembrane({
      valueMutated(target, key) {
        if (self.watchers[key]) {
          self.watchers[key].forEach((callback) => callback(target[key]));
        } else {
          Object.keys(self.watchers)
            .filter((i) => i.includes('.'))
            .forEach((fullDotNotationKey) => {
              let dotNotationParts = fullDotNotationKey.split('.');
              if (key !== dotNotationParts[dotNotationParts.length - 1]) return;
              dotNotationParts.reduce((comparisonData, part) => {
                if (Object.is(target, comparisonData)) {
                  self.watchers[fullDotNotationKey].forEach((callback) => callback(target[key]));
                }
                return comparisonData[part];
              }, self.getUnobservedData());
            });
        }
        if (self.pauseReactivity) return;

        debounce(
          () => {
            self.updateElements(self.$el);
            while (self.nextTickStack.length > 0) {
              self.nextTickStack.shift()();
            }
          },
          0,
          self
        )();
      }
    });

    return {
      data: membrane.getProxy(data),
      membrane
    };
  }

  getRefsProxy() {
    let self = this;
    let refObj = {};

    return new Proxy(refObj, {
      get(object, property) {
        let ref;
        self.walkAndSkipNestedComponents(self.$el, (el) => {
          if (el.hasAttribute('k-ref') && el.getAttribute('k-ref') === property) {
            ref = el;
          }
        });

        return ref;
      }
    });
  }

  walkAndSkipNestedComponents(el, callback, initializeComponentCallback = () => {}) {
    walk(el, (el) => {
      if (el.hasAttribute('k-data')) {
        if (!el.isSameNode(this.$el)) {
          if (!el.__k) initializeComponentCallback(el);
          return false;
        }
      }
      return callback(el);
    });
  }

  evaluateReturnExpression(el, expression, extraVars = () => {}) {
    return saferEval(expression, this.$data, {
      ...extraVars(),
      $dispatch: this.getDispatchFunction(el)
    });
  }

  initializeElement(el, extraVars) {
    if (el.hasAttribute('class') && getKAttrs(el).length > 0) {
      el.__k_original_classes = el.getAttribute('class').split(' ');
    }

    this.registerListeners(el, extraVars);
    this.resolveBoundAttributes(el, true, extraVars);
  }
  initializeElements(rootEl, extraVars = () => {}) {
    this.walkAndSkipNestedComponents(
      rootEl,
      (el) => {
        if (el.__k_for_key !== undefined) return false;

        this.initializeElement(el, extraVars);
      },
      (el) => {
        el.__k = new Component(el);
      }
    );

    this.executeAndClearRemainingShowDirectiveStack();

    while (this.nextTickStack.length > 0) {
      this.nextTickStack.shift()();
    }
  }

  resolveBoundAttributes(el, initialUpdate = false, extraVars) {
    let attrs = getKAttrs(el);

    console.log(attrs);

    // attrs.forEach(({ type, value, modifiers, expression }) => {
    //   switch (type) {
    //     case 'model':
    //       handleAttributeBindingDirective(this, el, 'value', expression, extraVars);
    //       break;

    //     case 'bind':
    //       // The :key binding on an x-for is special, ignore it.
    //       if (el.tagName.toLowerCase() === 'template' && value === 'key') return;

    //       handleAttributeBindingDirective(this, el, value, expression, extraVars);
    //       break;

    //     case 'text':
    //       var output = this.evaluateReturnExpression(el, expression, extraVars);

    //       // If nested model key is undefined, set the default value to empty string.
    //       if (output === undefined && expression.match(/\./).length) {
    //         output = '';
    //       }

    //       el.innerText = output;
    //       break;

    //     case 'html':
    //       el.innerHTML = this.evaluateReturnExpression(el, expression, extraVars);
    //       break;

    //     case 'show':
    //       var output = this.evaluateReturnExpression(el, expression, extraVars);

    //       handleShowDirective(this, el, output, modifiers, initialUpdate);
    //       break;

    //     case 'if':
    //       // If this element also has x-for on it, don't process x-if.
    //       // We will let the "x-for" directive handle the "if"ing.
    //       if (attrs.filter((i) => i.type === 'for').length > 0) return;

    //       var output = this.evaluateReturnExpression(el, expression, extraVars);

    //       handleIfDirective(el, output, initialUpdate);
    //       break;

    //     case 'for':
    //       handleForDirective(this, el, expression, initialUpdate);
    //       break;

    //     case 'cloak':
    //       el.removeAttribute('x-cloak');
    //       break;

    //     default:
    //       break;
    //   }
    // });
  }

  registerListeners(el, extraVars) {
    getKAttrs(el).forEach(({ type, value, modifiers, expression }) => {
      switch (type) {
        case 'on':
          registerListener(this, el, value, modifiers, expression, extraVars);
          break;

        case 'model':
          registerModelListener(this, el, modifiers, expression, extraVars);
          break;
        default:
          break;
      }
    });
  }

  executeAndClearRemainingShowDirectiveStack() {
    // The goal here is to start all the x-show transitions
    // and build a nested promise chain so that elements
    // only hide when the children are finished hiding.
    this.showDirectiveStack
      .reverse()
      .map((thing) => {
        return new Promise((resolve) => {
          thing((finish) => {
            resolve(finish);
          });
        });
      })
      .reduce(
        (nestedPromise, promise) => {
          return nestedPromise.then(() => {
            return promise.then((finish) => finish());
          });
        },
        Promise.resolve(() => {})
      );

    // We've processed the handler stack. let's clear it.
    this.showDirectiveStack = [];
    this.showDirectiveLastElement = undefined;
  }

  listenForNewElementsToInitialize() {
    const targetNode = this.$el;

    const observerOptions = {
      childList: true,
      attributes: true,
      subtree: true
    };

    const observer = new MutationObserver((mutations) => {
      for (let i = 0; i < mutations.length; i++) {
        // Filter out mutations triggered from child components.
        const closestParentComponent = mutations[i].target.closest('[k-data]');
        if (!(closestParentComponent && closestParentComponent.isSameNode(this.$el))) return;

        if (mutations[i].type === 'attributes' && mutations[i].attributeName === 'k-data') {
          const rawData = saferEval(mutations[i].target.getAttribute('k-data'), {});

          Object.keys(rawData).forEach((key) => {
            if (this.$data[key] !== rawData[key]) {
              this.$data[key] = rawData[key];
            }
          });
        }

        if (mutations[i].addedNodes.length > 0) {
          mutations[i].addedNodes.forEach((node) => {
            if (node.nodeType !== 1 || node.__k_inserted_me) return;

            if (node.matches('[k-data]')) {
              node.__k = new Component(node);
              return;
            }

            this.initializeElements(node);
          });
        }
      }
    });

    observer.observe(targetNode, observerOptions);
  }
}
