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
//# sourceMappingURL=animations.js.map