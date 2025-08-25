class IndexCommonsStore {
    constructor() {
        this.dbName = "bovi-index-commons";
        this.version = 1;
        this.db = null;
    }
    async init() {
        return new Promise((resolve, reject) => {
            const request = indexedDB.open(this.dbName, this.version);
            request.onerror = () => reject(request.error);
            request.onsuccess = () => {
                this.db = request.result;
                resolve();
            };
            request.onupgradeneeded = event => {
                const db = event.target.result;
                if (!db.objectStoreNames.contains("entries")) {
                    const store = db.createObjectStore("entries", { keyPath: "id" });
                    store.createIndex("timestamp", "timestamp");
                    store.createIndex("quality", "quality");
                }
            };
        });
    }
    async store(entry) {
        if (!this.db)
            await this.init();
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction(["entries"], "readwrite");
            const store = transaction.objectStore("entries");
            const request = store.put({
                ...entry,
                id: entry.id || `entry_${Date.now()}_${Math.random().toString(36).slice(2)}`,
            });
            request.onsuccess = () => resolve();
            request.onerror = () => reject(request.error);
        });
    }
    async getAll() {
        if (!this.db)
            await this.init();
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction(["entries"], "readonly");
            const store = transaction.objectStore("entries");
            const request = store.getAll();
            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error);
        });
    }
    async exportJSON() {
        const entries = await this.getAll();
        return JSON.stringify({
            version: "1.0.0",
            exported: new Date().toISOString(),
            entries,
        }, null, 2);
    }
}
export const indexCommons = new IndexCommonsStore();
//# sourceMappingURL=index-commons.js.map