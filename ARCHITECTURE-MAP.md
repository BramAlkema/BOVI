# BOVI Architecture Map

## 🎯 Overview: The Complete System

BOVI is a **progressive complexity framework** where users enter through simple interfaces that reveal deeper functionality as needed. Think of it like an onion with layers that build on each other.

## 📁 File Structure & Entry Points

### **Entry Points**
```
/index.html           ← Homepage with M0-M4 selection (current location)
/dist/index.html      ← Built version (deployed to GitHub Pages)  
/app.html            ← Main BOVI application (M2-M4 modes)
/visual-editor.html   ← M3 visual flow editor
```

### **Core Architecture**
```
/lib/                         ← Core BOVI framework
├── ui/
│   ├── boot.ts              ← UI plugin loading system
│   └── plugins/
│       ├── m0-satnav.plugin.ts    ← M0 base layer (GPS-style)
│       ├── routes-lights.plugin.ts ← M1 layer addition
│       ├── rooms-chores.plugin.ts  ← M2 layer addition  
│       └── mission-deck.plugin.ts  ← M3 layer addition
├── m1/safeCta.js            ← M1 safe defaults system
├── m2/                      ← M2 power user tools
├── m3/                      ← M3 expert tools
└── m4/                      ← M4 developer tools

/src/scripts/app.ts           ← Main application orchestrator
/dist/                        ← Built/compiled output
```

## 🏗️ Layer Architecture (M0-M4)

### **M0: Satnav Base Layer** 
```
Plugin: m0-satnav.plugin.ts
Purpose: "Just keep me safe" - GPS metaphor
Features:
- 🚗 Auto-drive: "Keep me safe" button
- 💰 Bills tile (getBillsSafe())
- 🛒 Deals tile (getBestDeal()) 
- ⚡ Energy tile (getEnergyStatus())
- 📺 Episode player (nextEpisodes())
- Simple dashboard interface
```

### **M1: Light Control Layer** (ON TOP OF M0)
```
Plugin: routes-lights.plugin.ts  
Purpose: "I want some control" - basic preferences
Features:
- M0 satnav interface PLUS:
- Toggle switches for automated decisions
- Basic notification controls
- Safe defaults with overrides
```

### **M2: Power User Layer** (ON TOP OF M1)
```
Plugin: rooms-chores.plugin.ts
Purpose: "I want to understand the system"
Features:
- M1 controls PLUS:
- Personal inflation tracking vs official rates
- Cohort formation and joining tools
- Money-veil calculations
- PDA (Personal Data Assessment)
```

### **M3: Expert Tools Layer** (ON TOP OF M2) 
```
Plugin: mission-deck.plugin.ts
Purpose: "I want sophisticated control"  
Features:
- M2 analytics PLUS:
- Visual flow editor (drag & drop)
- Smart contract creation
- Index commons management
- Storm mode crisis response
```

### **M4: Developer Layer** (ON TOP OF M3)
```
Purpose: "Full extensibility"
Features:
- M3 expert tools PLUS:
- Full API access
- Plugin development framework
- Butler hub management
- Custom extension creation
```

## 🔄 User Journey Flow

### **Current Homepage Journey:**
```
1. User visits: https://bramalkema.github.io/BOVI/
2. Sees M0-M4 complexity cards
3. Clicks M0 → calls enterBOVI('m0') 
4. Calls launchBoviLayer('m0')
5. Calls launchSatnavApp()
6. Should load m0-satnav.plugin.ts
```

### **The Problem We Found:**
```
❌ launchSatnavApp() tries to import('./dist/lib/lib/ui/boot.js')
❌ But GitHub Pages doesn't serve that path correctly
❌ So satnav plugin never loads
❌ User just sees "Loading satnav plugin..."
```

## 🔌 Plugin System Architecture

### **Plugin Loading Flow:**
```
1. bootUI() function (in lib/ui/boot.ts)
2. Registers available plugins:
   - registerUIPlugin(SatnavPlugin)
   - registerUIPlugin(RoutesLightsPlugin)  
   - registerUIPlugin(RoomsChoresPlugin)
   - registerUIPlugin(MissionDeckPlugin)
3. mountUI(element, 'ui-satnav') mounts chosen plugin
4. Plugin creates shadow DOM and renders interface
```

### **Plugin Structure:**
```typescript
export const SatnavPlugin: UIComponentPlugin = {
  manifest: {
    id: "ui-satnav",
    name: "Satnav (M0/M1)", 
    targets: ["L0","L1","L2"],
    provides: ["appShell","home"]
  },
  async mount(ctx: UIContext): Promise<UIInstance> {
    // Create shadow DOM
    // Render UI 
    // Wire up event handlers
    // Connect to BOVI APIs
  }
}
```

## 🚀 Build & Deploy System

### **Build Process:**
```
1. npm run build 
2. scripts/build-resilient.js runs
3. TypeScript compiles: src/ → dist/
4. CSS bundles: src/styles/ → dist/styles.min.css  
5. HTML processes: index.html → dist/index.html
6. Assets copy: flows/, assets/ → dist/
```

### **GitHub Pages Deploy:**
```
1. Push to main branch
2. GitHub Actions builds & deploys
3. Site serves from: https://bramalkema.github.io/BOVI/
4. Files served directly from root (no /dist/ prefix in URLs)
```

## ❗ Current Issues & Solutions

### **Issue 1: Import Path Mismatch**
```
Problem: import('./dist/lib/lib/ui/boot.js') 
Reality: GitHub Pages serves from root, not /dist/

Solution Options:
A) Bundle boot system into homepage JS
B) Use built files from correct paths  
C) Create standalone M0 interface
```

### **Issue 2: Module System Confusion**
```
Problem: Mixing ES modules + dynamic imports + GitHub Pages
Homepage tries to import TypeScript modules at runtime

Solution: Pre-bundle the satnav plugin into homepage
```

## 🎯 The Intended User Experience

### **M0 User Journey (What Should Happen):**
```
1. User clicks "M0: Just Keep Me Safe" 
2. Homepage transforms into satnav interface
3. Shows GPS-style dashboard with:
   - Current financial position
   - Route to safety
   - One-click "Keep me safe" protection
4. User clicks protection → system activates
5. Bills, deals, energy automatically optimized
6. User can navigate back to homepage
```

### **Progressive Enhancement:**  
```
M0 User → Gets curious → Clicks M1
M1 Interface = M0 Satnav + Light Controls
M2 Interface = M1 + Analytics Tools  
M3 Interface = M2 + Visual Editor
M4 Interface = M3 + Full Developer Access
```

## 🔧 Next Steps to Fix

1. **Bundle Integration**: Include satnav plugin directly in homepage
2. **Path Resolution**: Fix import paths for GitHub Pages  
3. **Layer Testing**: Verify M1-M4 progression works
4. **User Testing**: Ensure seamless M0 experience

---

## ✅ Current Status (As of Implementation)

### **🎯 Fully Working Components:**
- ✅ **Homepage**: M0-M4 complexity level selection at https://bramalkema.github.io/BOVI/
- ✅ **M0 Satnav**: Embedded GPS-style financial dashboard with working protection
- ✅ **Build System**: TypeScript compilation, CSS bundling, GitHub Pages deployment  
- ✅ **Plugin Architecture**: Complete plugin system ready for M1-M4 layer stacking
- ✅ **User Journey**: Click M0 → Satnav loads → "Keep me safe" → Protection activated

### **🔧 Implementation Notes for Future Claude Sessions:**

**Key Architectural Decision**: 
M0 uses an **embedded interface** (not dynamic plugin loading) to avoid GitHub Pages module resolution issues. This provides instant loading and seamless user experience.

**Plugin System Structure**:
- `lib/ui/plugins/m0-satnav.plugin.ts` - Original plugin (used for M1+ layer stacking)
- `index.html` - Contains embedded M0 functionality for immediate loading
- `lib/ui/boot.ts` - Plugin loading system for advanced layers

**Layer Stacking Strategy**:
- **M0**: Embedded satnav (working)
- **M1**: M0 + routes-lights.plugin.ts (next to implement)  
- **M2**: M1 + rooms-chores.plugin.ts (cohorts, analytics)
- **M3**: M2 + mission-deck.plugin.ts (visual editor)
- **M4**: M3 + full developer API access

**Critical Files for Understanding**:
1. `/index.html` - Main entry point with embedded M0 satnav
2. `/lib/ui/plugins/m0-satnav.plugin.ts` - Plugin system version  
3. `/lib/ui/boot.ts` - Plugin loading orchestrator
4. `/docs/COMPLEXITY-LAYERS.md` - Layer design philosophy
5. `/ARCHITECTURE-MAP.md` - This comprehensive system map

### **🚀 Next Development Steps:**
1. **M1 Implementation**: Add light controls on top of embedded M0
2. **M2 Integration**: Connect cohort and analytics tools  
3. **M3 Enhancement**: Enable visual editor for workflow creation
4. **M4 API**: Expose full developer extensibility

---

This map shows BOVI is a **sophisticated layered system** where complexity is revealed progressively, not a collection of separate apps. The architecture is designed for **progressive enhancement** where each layer builds functionality on top of the previous layers, creating a seamless user experience from simple financial protection to full developer customization.