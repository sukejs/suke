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
