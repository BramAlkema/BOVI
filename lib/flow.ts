/**
 * BOVI Flow Module - Legacy Entry Point
 * Re-exports the new modular flow system for backward compatibility
 */

// Re-export everything from the modular flow system
export * from './flow/index.js';

// Ensure global flow runner instance is available
export { flowRunner } from './flow/index.js';