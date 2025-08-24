/**
 * BOVI Core Utilities
 * Common helper functions and DOM utilities
 */

export const $ = (selector) => document.querySelector(selector);
export const $$ = (selector) => Array.from(document.querySelectorAll(selector));

/**
 * Formatting utilities
 */
export const fmt = {
  currency: (n) => `€${n.toFixed(2)}`,
  lts: (n) => `€LTS ${n.toFixed(2)}`,
  percentage: (n) => `${n.toFixed(1)}%`,
  number: (n) => n.toLocaleString()
};

/**
 * DOM manipulation utilities
 */
export const dom = {
  show: (element) => element.hidden = false,
  hide: (element) => element.hidden = true,
  toggle: (element) => element.hidden = !element.hidden,
  
  addClass: (element, className) => element.classList.add(className),
  removeClass: (element, className) => element.classList.remove(className),
  toggleClass: (element, className) => element.classList.toggle(className),
  
  setContent: (element, content) => element.innerHTML = content,
  setText: (element, text) => element.textContent = text,
  
  createElement: (tag, className = "", content = "") => {
    const element = document.createElement(tag);
    if (className) element.className = className;
    if (content) element.innerHTML = content;
    return element;
  }
};

/**
 * Event handling utilities
 */
export const events = {
  on: (element, event, handler) => element.addEventListener(event, handler),
  off: (element, event, handler) => element.removeEventListener(event, handler),
  once: (element, event, handler) => element.addEventListener(event, handler, { once: true }),
  
  delegate: (parent, selector, event, handler) => {
    parent.addEventListener(event, (e) => {
      if (e.target.matches(selector)) {
        handler.call(e.target, e);
      }
    });
  }
};

/**
 * Animation utilities
 */
export const animate = {
  fadeIn: (element, duration = 300) => {
    element.style.opacity = "0";
    element.style.transition = `opacity ${duration}ms ease`;
    element.hidden = false;
    
    requestAnimationFrame(() => {
      element.style.opacity = "1";
    });
  },
  
  fadeOut: (element, duration = 300) => {
    element.style.opacity = "1";
    element.style.transition = `opacity ${duration}ms ease`;
    
    requestAnimationFrame(() => {
      element.style.opacity = "0";
      setTimeout(() => {
        element.hidden = true;
      }, duration);
    });
  },
  
  slideIn: (element, direction = "down", duration = 300) => {
    const transforms = {
      down: "translateY(-10px)",
      up: "translateY(10px)",
      left: "translateX(10px)",
      right: "translateX(-10px)"
    };
    
    element.style.transform = transforms[direction];
    element.style.opacity = "0";
    element.style.transition = `transform ${duration}ms ease, opacity ${duration}ms ease`;
    element.hidden = false;
    
    requestAnimationFrame(() => {
      element.style.transform = "translate(0)";
      element.style.opacity = "1";
    });
  }
};

/**
 * State management utilities
 */
export const state = {
  create: (initialState = {}) => {
    const _state = { ...initialState };
    const listeners = new Set();
    
    return {
      get: (key) => key ? _state[key] : { ..._state },
      set: (key, value) => {
        const oldValue = _state[key];
        _state[key] = value;
        listeners.forEach(fn => fn(key, value, oldValue));
      },
      update: (updates) => {
        Object.entries(updates).forEach(([key, value]) => {
          this.set(key, value);
        });
      },
      subscribe: (fn) => {
        listeners.add(fn);
        return () => listeners.delete(fn);
      }
    };
  }
};

/**
 * Debounce utility for performance
 */
export const debounce = (func, wait) => {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
};

/**
 * Throttle utility for performance
 */
export const throttle = (func, limit) => {
  let inThrottle;
  return function() {
    const args = arguments;
    const context = this;
    if (!inThrottle) {
      func.apply(context, args);
      inThrottle = true;
      setTimeout(() => inThrottle = false, limit);
    }
  };
};