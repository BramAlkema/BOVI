export const events = {
    on: (element, event, handler) => {
        element.addEventListener(event, handler);
    },
    off: (element, event, handler) => {
        element.removeEventListener(event, handler);
    },
    once: (element, event, handler) => {
        element.addEventListener(event, handler, { once: true });
    },
    delegate: (parent, selector, event, handler) => {
        parent.addEventListener(event, (e) => {
            if (e.target.matches(selector)) {
                handler.call(e.target, e);
            }
        });
    }
};
//# sourceMappingURL=events.js.map