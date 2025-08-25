export const state = {
    create: (initialState = {}) => {
        const _state = { ...initialState };
        const listeners = new Set();
        const manager = {
            get: (key) => {
                return key ? _state[key] : { ..._state };
            },
            set: (key, value) => {
                const oldValue = _state[key];
                _state[key] = value;
                listeners.forEach(fn => fn(key, value, oldValue));
            },
            update: (updates) => {
                Object.entries(updates).forEach(([key, value]) => {
                    const oldValue = _state[key];
                    _state[key] = value;
                    listeners.forEach(fn => fn(key, value, oldValue));
                });
            },
            subscribe: (fn) => {
                listeners.add(fn);
                return () => listeners.delete(fn);
            }
        };
        return manager;
    }
};
//# sourceMappingURL=state.js.map