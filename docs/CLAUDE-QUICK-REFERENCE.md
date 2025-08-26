# Claude Quick Reference for BOVI

## 🎯 What is BOVI?

BOVI is a **progressive complexity financial protection system** that uses a GPS/satnav metaphor to help users navigate financial decisions. It has 5 layers (M0-M4) that stack on top of each other, revealing more sophistication as users need it.

## 🚀 Current Working System

**Live Site**: https://bramalkema.github.io/BOVI/

**Working User Journey**:
1. User visits homepage → sees M0-M4 complexity cards
2. User clicks "M0: Just Keep Me Safe" → embedded satnav loads
3. User sees GPS-style dashboard with "🚗 Auto-drive: Keep me safe" button
4. User clicks protection → system activates, optimizes bills/deals/energy
5. User can navigate back to homepage

## 📁 Key Files to Understand

### **Entry Points**:
- `/index.html` - Homepage with embedded M0 satnav functionality
- `/visual-editor.html` - M3 visual flow editor  
- `/app.html` - Main BOVI application (not currently used)

### **Architecture Documentation**:
- `/ARCHITECTURE-MAP.md` - Complete system architecture and implementation details
- `/docs/COMPLEXITY-LAYERS.md` - M0-M4 layer design philosophy
- `/docs/CURRENT-STATUS-AND-NEW-BACKLOG.md` - Project status and roadmap

### **Plugin System**:
- `/lib/ui/boot.ts` - Plugin loading orchestrator
- `/lib/ui/plugins/m0-satnav.plugin.ts` - Original M0 plugin (for layer stacking)
- `/lib/ui/plugins/routes-lights.plugin.ts` - M1 layer
- `/lib/ui/plugins/rooms-chores.plugin.ts` - M2 layer  
- `/lib/ui/plugins/mission-deck.plugin.ts` - M3 layer

## 🔧 Key Architectural Decisions

### **M0 Implementation Strategy**:
**Problem**: GitHub Pages can't load ES6 modules dynamically  
**Solution**: Embedded M0 satnav directly in homepage HTML for instant loading  
**Trade-off**: Duplicates plugin functionality but ensures seamless UX

### **Layer Stacking Design**:
- **M0**: Embedded satnav (✅ working)
- **M1**: M0 + light controls (next to implement) 
- **M2**: M1 + analytics/cohorts
- **M3**: M2 + visual editor
- **M4**: M3 + developer API

## ⚡ Quick Development Commands

```bash
npm run build          # Build the project
git add -A && git commit -m "message" && git push  # Deploy
curl https://bramalkema.github.io/BOVI/ | grep "satnav"  # Test deployment
```

## 🎯 Next Implementation Priority

**M1 Layer**: Add light controls on top of the embedded M0 satnav interface. This should:
1. Keep the existing M0 functionality
2. Add toggle switches for automated decisions
3. Allow users to override safe defaults
4. Maintain the satnav metaphor

## 🧭 Navigation for Claude

When user asks about:
- **"How does BOVI work?"** → Read `/ARCHITECTURE-MAP.md` 
- **"What needs to be built next?"** → Read `/docs/CURRENT-STATUS-AND-NEW-BACKLOG.md`
- **"Why are there layers?"** → Read `/docs/COMPLEXITY-LAYERS.md`
- **"How do I test the system?"** → Visit https://bramalkema.github.io/BOVI/ and try M0
- **"What's the plugin system?"** → Read `/lib/ui/plugins/` and `/lib/ui/boot.ts`

## 💡 Remember

BOVI is **not just a money app** - it's an educational framework teaching that "money isn't a single invention but a bundle of four fairness logics" (Balanced, Obligated, Value, Immediate). The complexity layers ensure it works for everyone from casual users to financial system designers.