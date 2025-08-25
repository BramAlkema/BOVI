declare class BoviApp {
    private navigation;
    private initialized;
    init(): Promise<void>;
    private loadDemos;
    private setupEventListeners;
    private onNavigate;
    private initializeModeTab;
    private initializeScenariosTab;
    private initializeBundleTab;
    private handleInitialRoute;
    private handleKeyboardShortcuts;
}
declare const initApp: () => Promise<void>;
export { BoviApp, initApp };
//# sourceMappingURL=app.d.ts.map