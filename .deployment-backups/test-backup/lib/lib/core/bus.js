export class EventBus {
    constructor() {
        this.et = new EventTarget();
    }
    emit(type, detail) {
        this.et.dispatchEvent(new CustomEvent(type, { detail }));
    }
    on(type, cb) {
        const h = (e) => cb(e.detail);
        this.et.addEventListener(type, h);
        return () => this.et.removeEventListener(type, h);
    }
}
export const Bus = new EventBus();
//# sourceMappingURL=bus.js.map