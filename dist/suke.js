/*
 * sukejs
 * (c) 2011-2020 suke
 * https://github.com/sukejs
 * version 0.0.1
 */

(function (global, factory) {
  typeof exports === 'object' && typeof module !== 'undefined'
    ? (module.exports = factory())
    : typeof define === 'function' && define.amd
    ? define(factory)
    : ((global = global || self), (global.suke = factory()));
})(this, function () {
  'use strict';

  const domReady = () => {
    return new Promise((resolve) => {
      if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', resolve);
      } else {
        resolve();
      }
    });
  };

  // https://github.com/jsdom/jsdom/issues/1537
  function isTesting() {
    return navigator.userAgent.includes('Node.js') || navigator.userAgent.includes('jsdom');
  }

  class Component {
    constructor(el, seedDataForCloning = null) {
      this.$el = el;
      console.log(el);
    }
  }

  const suke = {
    start: async () => {
      if (!isTesting()) {
        await domReady();
      }

      suke.discoverComponents((el) => {
        suke.initializeComponent(el);
      }); // turbolinks: https://www.npmjs.com/package/turbolinks

      document.addEventListener('turbolinks:load', () => {
        suke.discoverUninitializedComponents((el) => {
          suke.initializeComponent(el);
        });
      });
      suke.listenForNewUninitializedComponentsAtRunTime((el) => {
        suke.initializeComponent(el);
      });
    },
    discoverComponents: (callback) => {
      const rootEls = document.querySelectorAll('[x-data]');
      rootEls.forEach((rootEl) => {
        callback(rootEl);
      });
    },
    discoverUninitializedComponents: function (callback, el = null) {
      const rootEls = (el || document).querySelectorAll('[x-data]');
      Array.from(rootEls)
        .filter((el) => el.__x === undefined)
        .forEach((rootEl) => {
          callback(rootEl);
        });
    },
    listenForNewUninitializedComponentsAtRunTime: function (callback) {
      const targetNode = document.querySelector('body');
      const observerOptions = {
        childList: true,
        attributes: true,
        subtree: true
      }; // https://developer.mozilla.org/zh-CN/docs/Web/API/MutationObserver

      const observer = new MutationObserver((mutations) => {
        for (let i = 0; i < mutations.length; i++) {
          if (mutations[i].addedNodes.length > 0) {
            mutations[i].addedNodes.forEach((node) => {
              if (node.nodeType !== 1) return;
              if (node.parentElement && node.parentElement.closest('[x-data]')) return;
              this.discoverUninitializedComponents((el) => {
                this.initializeComponent(el);
              }, node.parentElement);
            });
          }
        }
      });
      observer.observe(targetNode, observerOptions);
    },
    initializeComponent: function (el) {
      if (!el.__x) {
        el.__x = new Component(el);
      }
    },
    clone: function (component, newEl) {
      if (!newEl.__x) {
        newEl.__x = new Component(newEl, component.getUnobservedData());
      }
    }
  };

  if (!isTesting()) {
    window.suke = suke;
    window.suke.start();
  }

  return suke;
});
