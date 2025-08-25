export const $ = (selector) => document.querySelector(selector);
export const $$ = (selector) => Array.from(document.querySelectorAll(selector));
export const dom = {
    show: (element) => { element.hidden = false; },
    hide: (element) => { element.hidden = true; },
    toggle: (element) => { element.hidden = !element.hidden; },
    addClass: (element, className) => element.classList.add(className),
    removeClass: (element, className) => element.classList.remove(className),
    toggleClass: (element, className) => element.classList.toggle(className),
    setContent: (element, content) => { element.innerHTML = content; },
    setText: (element, text) => { element.textContent = text; },
    createElement: (tag, className = "", content = "") => {
        const element = document.createElement(tag);
        if (className)
            element.className = className;
        if (content)
            element.innerHTML = content;
        return element;
    }
};
//# sourceMappingURL=dom.js.map