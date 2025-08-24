# BOVI Framework Modularization Guide

## Overview

The BOVI Framework has been completely restructured from monolithic files into a modular architecture. This guide covers the migration process, new structure, and usage patterns.

## 🏗️ New Architecture

### Before (Monolithic)
```
lib/
├── flow.ts (600+ lines - everything)
├── shipping-apis.ts (600+ lines - everything)  
├── api-integration.ts (mixed concerns)
└── integration.ts (450+ lines - everything)
```

### After (Modular)
```
lib/
├── services/           # Business logic layer
├── ui/                # UI components layer  
├── flow/              # Flow execution system
├── api/               # API façade
├── monitoring/        # KPI monitoring
├── integration/       # System integration
└── plugins/           # Plugin system
```

## 📦 Module Structure

### 1. Services Layer (`lib/services/`)
Handles all business logic and data operations.

```typescript
import { getRulers, switchRuler } from './lib/services/rulers.js';
import { createHamburgerBasket } from './lib/services/hamburger.js';
import { calculateMoneyVeil } from './lib/services/money-veil.js';
```

**Modules:**
- `rulers.js` - Inflation measurement rulers
- `index-commons.js` - IndexedDB storage
- `hamburger.js` - Fixed basket tracking
- `money-veil.js` - Personal inflation impact
- `weekly-digest.js` - Personal metrics summary
- `smart-contracts.js` - Off-chain contracts
- `cohort-auctions.js` - Reverse auctions
- `storm-mode.js` - Crisis management

### 2. UI Layer (`lib/ui/`)
Modular UI components with clean interfaces.

```typescript
import { setupRulerSwitcher } from './lib/ui/ruler-switcher.js';
import { setupMoneyVeilCard } from './lib/ui/money-veil-card.js';
```

**Components:**
- `ruler-switcher.js` - Inflation ruler switching UI
- `money-veil-card.js` - Personal inflation impact visualization
- `hamburger-sentinel.js` - Basket creation and tracking
- `smart-contracts.js` - Contract creation interface
- `cohort-engine.js` - Cohort auction management
- `storm-mode.js` - Crisis management interface

### 3. Flow System (`lib/flow/`)
Modular flow execution with separated concerns.

```typescript
import { FlowRunner, flowRunner } from './lib/flow/runner.js';
import type { FlowSpec, FlowContext } from './lib/flow/types.js';
```

**Modules:**
- `types.js` - Type definitions
- `context.js` - Context management
- `runner.js` - Main orchestrator
- `node-executors.js` - Node execution logic
- `timer-integration.js` - Timer service integration

### 4. API Layer (`lib/api/`)
Clean API façade separated from monitoring.

```typescript
import { api, systemHealthCheck } from './lib/api/facade.js';
```

### 5. Monitoring (`lib/monitoring/`)
KPI monitoring and dashboard functionality.

```typescript
import { dashboard, KPIMonitoringService } from './lib/monitoring/index.js';
```

### 6. Integration (`lib/integration/`)
System integration with separated concerns.

```typescript
import { hybridOrchestrator, flowLoader } from './lib/integration/index.js';
```

### 7. Plugin System (`lib/plugins/`)
Comprehensive plugin architecture.

```typescript
import { pluginManager, registerBuiltInPlugins } from './lib/plugins/index.js';
```

## 🔄 Migration Guide

### Old Import Patterns
```typescript
// ❌ Old monolithic imports
import * as ShippingAPI from './shipping-apis.js';
import { FlowRunner } from './flow.js';

// Usage
ShippingAPI.getRulers();
```

### New Modular Imports
```typescript
// ✅ New focused imports
import { getRulers } from './services/rulers.js';
import { FlowRunner } from './flow/runner.js';

// Usage
getRulers();
```

### Initialization Changes

**Before:**
```typescript
import { initBoviSystem } from './integration.js';
import { initializeShippingFeatures } from './shipping-integration.js';

await initBoviSystem();
await initializeShippingFeatures();
```

**After:**
```typescript
import { systemInitializer } from './integration/system-initialization.js';

await systemInitializer.initialize();
// Everything is coordinated automatically
```

## 🧩 Plugin System Usage

### Creating a Plugin
```typescript
import type { Plugin, PluginContext } from './plugins/plugin-types.js';

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
}
```

### Registering Plugins
```typescript
import { pluginManager } from './plugins/index.js';

await pluginManager.install(new MyPlugin());
```

## 🎯 Benefits of New Architecture

### 1. **Modularity**
- Each module has a single responsibility
- Clear separation of concerns
- Easy to understand and modify

### 2. **Maintainability**  
- Smaller, focused files (~100-200 lines each)
- Independent testing of modules
- Easier debugging and development

### 3. **Reusability**
- Services can be used across different contexts
- UI components are self-contained
- Plugin system enables extensions

### 4. **Scalability**
- Easy to add new features as plugins
- Modular loading improves performance
- Clear dependency management

### 5. **Testing**
- Each module can be tested in isolation
- Mock dependencies easily
- Better test coverage

## 🔧 Development Workflow

### Adding New Features
1. **Service First**: Create business logic in `services/`
2. **UI Component**: Build interface in `ui/`
3. **Integration**: Connect via `integration/`
4. **Plugin**: Optionally wrap as plugin for distribution

### Example: Adding a New Feature
```typescript
// 1. Create service
// lib/services/my-feature.js
export async function processMyFeature(data) {
  // Business logic
}

// 2. Create UI component  
// lib/ui/my-feature.js
export function setupMyFeatureUI() {
  // UI setup
}

// 3. Create plugin wrapper
// lib/plugins/my-feature-plugin.js
export class MyFeaturePlugin implements Plugin {
  // Plugin implementation
}
```

## ⚠️ Breaking Changes

### Import Path Changes
All import paths need to be updated to use the new modular structure:

```diff
- import * as ShippingAPI from './shipping-apis.js';
+ import { getRulers } from './services/rulers.js';

- import { FlowRunner } from './flow.js';
+ import { FlowRunner } from './flow/runner.js';
```

### API Changes
Some APIs have been restructured:

```diff
- ShippingAPI.getRulers()
+ getRulers()

- api.startKPIMonitoring()
+ kpiMonitoring.start()
```

## 🧪 Testing Strategy

### Unit Testing
Each module can be tested independently:

```typescript
import { getRulers } from '../services/rulers.js';

describe('Rulers Service', () => {
  test('should return available rulers', async () => {
    const rulers = await getRulers();
    expect(rulers).toBeDefined();
  });
});
```

### Integration Testing  
Test module interactions:

```typescript
import { flowRunner } from '../flow/runner.js';
import { getRulers } from '../services/rulers.js';

describe('Flow Integration', () => {
  test('should use ruler service in flows', async () => {
    // Test integration between modules
  });
});
```

### Plugin Testing
Test plugin lifecycle:

```typescript
import { pluginManager } from '../plugins/plugin-manager.js';
import { MyPlugin } from './my-plugin.js';

describe('Plugin System', () => {
  test('should register and activate plugin', async () => {
    const plugin = new MyPlugin();
    await pluginManager.install(plugin);
    // Test plugin functionality
  });
});
```

## 📋 Migration Checklist

- [ ] Update import statements to new paths
- [ ] Replace `ShippingAPI.*` calls with direct imports  
- [ ] Update initialization code to use `systemInitializer`
- [ ] Test all functionality still works
- [ ] Update any custom extensions to use plugin system
- [ ] Update documentation and comments
- [ ] Run full test suite

## 🚀 Performance Improvements

The modular architecture provides several performance benefits:

1. **Smaller Bundle Sizes**: Tree-shaking eliminates unused modules
2. **Lazy Loading**: Modules can be loaded on demand
3. **Better Caching**: Smaller modules cache more effectively
4. **Reduced Memory Usage**: Only load what you need

## 🎉 Conclusion

The modularized BOVI Framework is:
- **More maintainable** with focused, single-responsibility modules
- **More testable** with isolated components  
- **More extensible** with the plugin system
- **More performant** with optimized loading
- **More scalable** with clear architecture patterns

The investment in modularization pays dividends in development velocity, code quality, and system reliability.