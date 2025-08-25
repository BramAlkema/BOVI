export declare const $: (selector: string) => Element | null;
export declare const $$: (selector: string) => Element[];
export declare const dom: {
    show: (element: HTMLElement) => void;
    hide: (element: HTMLElement) => void;
    toggle: (element: HTMLElement) => void;
    addClass: (element: HTMLElement, className: string) => void;
    removeClass: (element: HTMLElement, className: string) => void;
    toggleClass: (element: HTMLElement, className: string) => boolean;
    setContent: (element: HTMLElement, content: string) => void;
    setText: (element: HTMLElement, text: string) => void;
    createElement: (tag: string, className?: string, content?: string) => HTMLElement;
};
//# sourceMappingURL=dom.d.ts.map