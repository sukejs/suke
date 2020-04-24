import { domReady, isInJsdom } from './utils';
import Component from './component';

const suke = {
  init: async () => {
    if (!isInJsdom()) {
      await domReady();
    }

    suke.findComponents((el) => {
      suke.initComponent(el);
    });

    /**
     * User navigates using Turbolinks
     * turbolinks: https://www.npmjs.com/package/turbolinks
     */
    document.addEventListener('turbolinks:load', () => {
      suke.findTurboComponents((el) => {
        suke.initComponent(el);
      });
    });

    suke.watchTurboComponents((el) => {
      suke.initComponent(el);
    });
  },

  findComponents: (callback) => {
    const rootEls = document.querySelectorAll('[k-data]');

    rootEls.forEach((rootEl) => {
      callback(rootEl);
    });
  },

  findTurboComponents: function (callback, el = null) {
    const rootEls = (el || document).querySelectorAll('[k-data]');

    Array.from(rootEls)
      .filter((el) => el.__x === undefined)
      .forEach((rootEl) => {
        callback(rootEl);
      });
  },

  watchTurboComponents: function (callback) {
    const targetNode = document.querySelector('body');

    const observerOptions = {
      childList: true,
      attributes: true,
      subtree: true
    };

    /**
     * MutationObserver Api
     * https://developer.mozilla.org/zh-CN/docs/Web/API/MutationObserver
     */
    const observer = new MutationObserver((mutations) => {
      for (let i = 0; i < mutations.length; i++) {
        if (mutations[i].addedNodes.length > 0) {
          mutations[i].addedNodes.forEach((node) => {
            if (node.nodeType !== 1) return;

            if (node.parentElement && node.parentElement.closest('[k-data]')) return;

            this.findTurboComponents((el) => {
              this.initComponent(el);
            }, node.parentElement);
          });
        }
      }
    });

    observer.observe(targetNode, observerOptions);
  },

  initComponent: (el) => {
    if (!el.__k) {
      el.__k = new Component(el);
    }
  },
  clone: (component, newEl) => {
    if (!newEl.__k) {
      newEl.__k = new Component(newEl, component.getUnTurboData());
    }
  }
};

if (!isInJsdom()) {
  window.suke = suke;
  window.suke.init();
}

export default suke;
