export * from './integration/index.js';
export { hybridOrchestrator, flowLoader, studioManager, uiBridge, aiButlerManager, auditTrail, notificationService } from './integration/index.js';
export const initBoviSystem = async () => {
    const { hybridOrchestrator } = await import('./integration/index.js');
    return hybridOrchestrator.initialize();
};
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initBoviSystem);
}
else {
    initBoviSystem();
}
export const flowRunner = (await import('./flow/index.js')).flowRunner;
export const flowSpecs = {};
export const studios = {};
export const aiButlerEnabled = true;
//# sourceMappingURL=integration.js.map