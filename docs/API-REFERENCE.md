# BOVI Framework API Reference

## Quick Start

```typescript
// Initialize the complete BOVI system
import { systemInitializer } from './lib/integration/system-initialization.js';
await systemInitializer.initialize();

// Or initialize specific components
import { api } from './lib/api/facade.js';
import { pluginManager } from './lib/plugins/plugin-manager.js';
await api.initialize();
await pluginManager.initialize();
```

## 🔧 Services API

### Rulers Service
```typescript
import { getRulers, switchRuler, getActiveRuler } from './lib/services/rulers.js';

// Get available inflation rulers
const rulers = await getRulers();

// Switch to a different ruler
await switchRuler('bovi-local');

// Get current active ruler
const active = await getActiveRuler();
```

### Hamburger Basket Service
```typescript
import { 
  createHamburgerBasket, 
  calculateHamburgerInflation 
} from './lib/services/hamburger.js';

// Create a new basket
const basket = await createHamburgerBasket('Weekly Groceries', items);

// Calculate inflation for a basket
const inflation = await calculateHamburgerInflation(basketId);
```

### Money Veil Service
```typescript
import { calculateMoneyVeil } from './lib/services/money-veil.js';

// Calculate personal inflation impact
const impact = await calculateMoneyVeil(income, savings, interestRate);
// Returns: { inflationDrift, bracketCreep, realRate, netImpact }
```

## 🎨 UI Components API

### Setup Functions
```typescript
import { setupRulerSwitcher } from './lib/ui/ruler-switcher.js';
import { setupMoneyVeilCard } from './lib/ui/money-veil-card.js';
import { setupHamburgerSentinel } from './lib/ui/hamburger-sentinel.js';

// Initialize UI components
setupRulerSwitcher();
setupMoneyVeilCard(); 
setupHamburgerSentinel();
```

## 🔄 Flow System API

### Flow Runner
```typescript
import { flowRunner } from './lib/flow/runner.js';
import type { FlowSpec } from './lib/flow/types.js';

// Load and start a flow
await flowRunner.loadFlow(flowSpec);
flowRunner.startFlow('my-flow');

// Control flow execution
flowRunner.overrideAction('my-flow', 'node-id', 'apply');
flowRunner.cancelTimeout('my-flow', 'node-id');
flowRunner.stopFlow('my-flow');

// Query flow state
const state = flowRunner.getFlowState('my-flow'); // 'idle' | 'running' | 'completed' | 'error'
```

### Context Management
```typescript
import { FlowContextManager } from './lib/flow/context.js';

const contextManager = new FlowContextManager();
const context = contextManager.createContext(flowSpec);
contextManager.storeNodeOutput(context, 'node-1', result);
```

## 🌐 API Façade

### BOVI API
```typescript
import { api } from './lib/api/facade.js';

// Initialize API
await api.initialize();

// Access different API sections
const stats = await api.getSystemStats();
const rulers = await api.indices.list();
await api.rules.checkRuleCompliance();
```

## 📊 Monitoring API

### KPI Dashboard
```typescript
import { dashboard, KPIMonitoringService } from './lib/monitoring/index.js';

// Get system health
const healthScore = dashboard.getHealthScore();
const summary = dashboard.getHealthSummary();

// Start monitoring
const monitoring = new KPIMonitoringService(api);
monitoring.start();
```

## 🔗 Integration API

### Hybrid Orchestrator
```typescript
import { hybridOrchestrator } from './lib/integration/index.js';

// Initialize complete system
await hybridOrchestrator.initialize();

// Get system status
const status = hybridOrchestrator.getStatus();

// Show audit trail
hybridOrchestrator.showAuditTrail();
```

### Individual Integration Services
```typescript
import { 
  flowLoader, 
  studioManager, 
  uiBridge,
  aiButlerManager,
  notificationService 
} from './lib/integration/index.js';

// Load flows
await flowLoader.loadFlowSpecs(['groceries', 'rent']);

// Manage studios
studioManager.createStudioForFlow('groceries', flowSpec);

// Show notifications
notificationService.showNotification('Hello!', 'success');
```

## 🧩 Plugin System API

### Plugin Manager
```typescript
import { 
  pluginManager, 
  pluginRegistry,
  registerBuiltInPlugins 
} from './lib/plugins/index.js';

// Initialize plugin system
await pluginManager.initialize();

// Install a plugin
await pluginManager.install(myPlugin);

// List plugins by category
const uiPlugins = pluginManager.listByCategory('ui-component');

// Configure plugin
await pluginManager.configure('plugin-id', { enabled: true });
```

### Creating Plugins
```typescript
import type { Plugin, PluginContext } from './lib/plugins/plugin-types.js';

export class MyPlugin implements Plugin {
  manifest = {
    id: 'my-plugin',
    name: 'My Plugin', 
    version: '1.0.0',
    category: 'service',
    provides: ['my-service'],
    requires: ['notifications']
  };

  async initialize(context: PluginContext): Promise<void> {
    // Setup code
  }

  async activate(context: PluginContext): Promise<void> {
    // Activation code  
  }

  async deactivate(context: PluginContext): Promise<void> {
    // Cleanup code
  }
}
```

## 🎯 Common Patterns

### Service + UI Pattern
```typescript
// 1. Create service
export async function myServiceFunction(data) {
  // Business logic
  return result;
}

// 2. Create UI component
export function setupMyUI() {
  // UI setup that uses the service
  const button = document.getElementById('my-button');
  button?.addEventListener('click', async () => {
    const result = await myServiceFunction(inputData);
    updateUI(result);
  });
}

// 3. Integration
import { setupMyUI } from './ui/my-component.js';
setupMyUI();
```

### Plugin Development Pattern
```typescript
// 1. Implement plugin interface
export class MyFeaturePlugin implements Plugin {
  manifest = { /* manifest */ };
  
  async activate(context: PluginContext) {
    // Use context to access BOVI systems
    context.showNotification('Plugin activated!');
    
    // Access other plugins
    const apiPlugin = context.getPlugin('bovi-core-api');
  }
}

// 2. Register and activate
import { pluginManager } from './lib/plugins/index.js';
await pluginManager.install(new MyFeaturePlugin());
```

## 🚨 Error Handling

```typescript
// All async operations should be wrapped in try-catch
try {
  await systemInitializer.initialize();
} catch (error) {
  console.error('System initialization failed:', error);
  // Handle gracefully
}

// Plugin errors are emitted as events
import { on } from './lib/bus.js';
on('plugin:error', (event) => {
  console.error('Plugin error:', event.detail.plugin, event.detail.error);
});
```

## 📱 Event System

```typescript
import { emit, on } from './lib/bus.js';

// Listen for system events
on('bovi.system.initialized', (event) => {
  console.log('System ready:', event.detail.components);
});

on('flow.completed', (event) => {
  console.log('Flow completed:', event.detail.flow);
});

// Emit custom events
emit('my.custom.event', { data: 'value' });
```

## 🎛️ Configuration

### Plugin Configuration
```typescript
// Get plugin config
const config = pluginManager.getConfig('plugin-id');

// Update plugin config
await pluginManager.configure('plugin-id', {
  enabled: true,
  customSetting: 'value'
});
```

### Service Configuration
```typescript
// Most services use localStorage for persistence
localStorage.setItem('bovi.activeRuler', 'bovi-local');
localStorage.setItem('bovi.userIncome', '50000');

// Some services provide configuration methods
await api.indices.setDefault('bovi-local');
```

## 🧪 Testing Utilities

```typescript
// Mock services for testing
import { jest } from '@jest/globals';

jest.mock('./lib/services/rulers.js', () => ({
  getRulers: jest.fn().mockResolvedValue([
    { id: 'test-ruler', name: 'Test Ruler', bpDrift: 0 }
  ])
}));

// Test plugin lifecycle
import { pluginRegistry } from './lib/plugins/plugin-registry.js';

const testPlugin = new MyPlugin();
pluginRegistry.register(testPlugin);
await pluginRegistry.initialize('my-plugin', mockContext);
```