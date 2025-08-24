/**
 * BOVI Performance Utilities
 * Debouncing, throttling, and optimization helpers
 */

/**
 * Debounce utility for performance
 */
export const debounce = <T extends (...args: any[]) => any>(func: T, wait: number): T => {
  let timeout: NodeJS.Timeout;
  return function executedFunction(this: any, ...args: Parameters<T>) {
    const later = () => {
      clearTimeout(timeout);
      func.apply(this, args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  } as T;
};

/**
 * Throttle utility for performance
 */
export const throttle = <T extends (...args: any[]) => any>(func: T, limit: number): T => {
  let inThrottle: boolean;
  return function(this: any, ...args: Parameters<T>) {
    if (!inThrottle) {
      func.apply(this, args);
      inThrottle = true;
      setTimeout(() => inThrottle = false, limit);
    }
  } as T;
};