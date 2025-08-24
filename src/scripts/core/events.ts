/**
 * BOVI Event Utilities
 * Event handling and delegation helpers
 */

/**
 * Event handling utilities
 */
export const events = {
  on: (
    element: HTMLElement | Window | Document | Element, 
    event: string, 
    handler: (e: Event) => void
  ): void => {
    (element as any).addEventListener(event, handler);
  },
  
  off: (
    element: HTMLElement | Window | Document | Element, 
    event: string, 
    handler: (e: Event) => void
  ): void => {
    (element as any).removeEventListener(event, handler);
  },
  
  once: (
    element: HTMLElement | Window | Document | Element, 
    event: string, 
    handler: (e: Event) => void
  ): void => {
    (element as any).addEventListener(event, handler, { once: true });
  },
  
  delegate: (
    parent: HTMLElement | Document, 
    selector: string, 
    event: string, 
    handler: (e: Event) => void
  ): void => {
    parent.addEventListener(event, (e: Event) => {
      if ((e.target as Element).matches(selector)) {
        handler.call(e.target, e);
      }
    });
  }
};