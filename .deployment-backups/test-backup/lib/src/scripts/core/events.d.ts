export declare const events: {
    on: (element: HTMLElement | Window | Document | Element, event: string, handler: (e: Event) => void) => void;
    off: (element: HTMLElement | Window | Document | Element, event: string, handler: (e: Event) => void) => void;
    once: (element: HTMLElement | Window | Document | Element, event: string, handler: (e: Event) => void) => void;
    delegate: (parent: HTMLElement | Document, selector: string, event: string, handler: (e: Event) => void) => void;
};
//# sourceMappingURL=events.d.ts.map