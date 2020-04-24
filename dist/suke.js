/*
 * sukejs
 * (c) 2011-2020 suke
 * https://github.com/sukejs
 * version 0.0.1
 */

(function (global, factory) {
  typeof exports === 'object' && typeof module !== 'undefined' ? module.exports = factory() :
  typeof define === 'function' && define.amd ? define(factory) :
  (global = global || self, global.suke = factory());
}(this, (function () { 'use strict';

  /**
   * https://github.com/jsdom/jsdom/issues/1537
   */
  function isInJsdom() {
    return navigator.userAgent.includes('Node.js') || navigator.userAgent.includes('jsdom');
  }
  /**
   * More domReady
   * https://github.com/ded/domready
   */

  const domReady = () => {
    return new Promise(resolve => {
      if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', resolve);
      } else {
        resolve();
      }
    });
  };

  class Component {
    constructor(el, seedData = null) {
      this.$el = el;
    }

  }

  const suke = {
    init: async () => {
      if (!isInJsdom()) {
        await domReady();
      }

      suke.findComponents(el => {
        suke.initComponent(el);
      });
      /**
       * User navigates using Turbolinks
       * turbolinks: https://www.npmjs.com/package/turbolinks
       */

      document.addEventListener('turbolinks:load', () => {
        suke.findTurboComponents(el => {
          suke.initComponent(el);
        });
      });
      suke.watchTurboComponents(el => {
        suke.initComponent(el);
      });
    },
    findComponents: callback => {
      const rootEls = document.querySelectorAll('[k-data]');
      rootEls.forEach(rootEl => {
        callback(rootEl);
      });
    },
    findTurboComponents: function (callback, el = null) {
      const rootEls = (el || document).querySelectorAll('[k-data]');
      Array.from(rootEls).filter(el => el.__x === undefined).forEach(rootEl => {
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

      const observer = new MutationObserver(mutations => {
        for (let i = 0; i < mutations.length; i++) {
          if (mutations[i].addedNodes.length > 0) {
            mutations[i].addedNodes.forEach(node => {
              if (node.nodeType !== 1) return;
              if (node.parentElement && node.parentElement.closest('[k-data]')) return;
              suke.findTurboComponents(el => {
                suke.initComponent(el);
              }, node.parentElement);
            });
          }
        }
      });
      observer.observe(targetNode, observerOptions);
    },
    initComponent: el => {
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

  return suke;

})));
