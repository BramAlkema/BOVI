/**
 * BOVI DOM Utilities
 * DOM manipulation and query helpers
 */

export const $ = (selector: string): Element | null => document.querySelector(selector);
export const $$ = (selector: string): Element[] => Array.from(document.querySelectorAll(selector));

/**
 * DOM manipulation utilities
 */
export const dom = {
  show: (element: HTMLElement): void => { element.hidden = false; },
  hide: (element: HTMLElement): void => { element.hidden = true; },
  toggle: (element: HTMLElement): void => { element.hidden = !element.hidden; },
  
  addClass: (element: HTMLElement, className: string): void => element.classList.add(className),
  removeClass: (element: HTMLElement, className: string): void => element.classList.remove(className),
  toggleClass: (element: HTMLElement, className: string): boolean => element.classList.toggle(className),
  
  setContent: (element: HTMLElement, content: string): void => { element.innerHTML = content; },
  setText: (element: HTMLElement, text: string): void => { element.textContent = text; },
  
  createElement: (tag: string, className = "", content = ""): HTMLElement => {
    const element = document.createElement(tag);
    if (className) element.className = className;
    if (content) element.innerHTML = content;
    return element;
  }
};