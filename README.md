# BOVI Framework Educational App

**Balanced • Obligated • Value • Immediate** — Understanding the Four Fairness Modes of Money

## What is BOVI?

BOVI explains money as a bundle of four fairness modes, each solving different trade problems:

- **🔵 Balanced** (Equality Matching) — Keeping score, ledgers, fairness across time
- **🔴 Obligated** (Authority Ranking) — Enforced payments, taxes, hierarchy compliance
- **🟢 Value** (Market Pricing) — Transferable medium, proportional exchange
- **🟡 Immediate** (Communal Sharing) — Direct swaps, tit-for-tat, visceral fairness

## 🚀 **Hybrid Architecture**

This app combines educational interface with sophisticated flow management:

### **Satnav UI** (User-Friendly)

- Familiar interface for exploring BOVI concepts
- Interactive demos and real-world scenarios
- AI Butler with transparent timeout defaults

### **Flow DSL Engine** (TypeScript)

- JSON-based flow specifications for each scenario
- XState-powered execution with timeout handling
- Type-safe event bus for audit compliance
- Live SVG visualization studios

### **Single Source of Truth**

```json
{
  "id": "groceries",
  "nodes": [{ "type": "V.PDA", "timeout_s": 10, "episode": "ep-shrink" }],
  "meta": { "bovi_modes": ["V", "I", "B"], "primary_mode": "I" }
}
```

## Quick Start

### Development Setup

```bash
# Clone and install
git clone https://github.com/BramAlkema/BOVI.git
cd BOVI
npm install

# Start development server
npm run dev

# TypeScript development with watch mode
npm run dev:watch
```

### Production Build (Automated)

- **Push to `main`** → GitHub Actions automatically builds and deploys
- **TypeScript compiled** → JavaScript for fast loading
- **Assets optimized** → CSS minified, flows copied
- **Deployed to GitHub Pages** → Same domain, zero downtime

## Development Commands

```bash
npm run dev          # Start local server
npm run build        # Full production build
npm run typecheck    # Check TypeScript without compiling
npm run lint         # ESLint with TypeScript support
npm run format       # Prettier formatting
npm run dev:watch    # TypeScript compilation with watch mode
```

## Architecture Deep Dive

### **Flow DSL System**

- **3 Production Flows**: groceries.json, rent.json, energy.json
- **BOVI Type System**: B._ (Balanced), O._ (Obligated), V._ (Value), I._ (Immediate)
- **XState Integration**: Sophisticated state management with timeout handling
- **Event-Driven**: All user actions emit structured BOVI events

### **Live Studios**

- **SVG Visualization**: Real-time flow execution with node highlighting
- **BOVI Color Coding**: Each fairness mode has distinct visual identity
- **Interactive Nodes**: Click for flow details and audit information
- **Cross-Tab Sync**: BroadcastChannel mirrors events to other windows

### **Type Safety**

```typescript
// Full event typing
emit("I.default.applied", {
  flow: "groceries",
  node: "suggest_swap",
  euros_saved: 2.1,
});

// Audit compliance
const logs = AuditLog.getLogs({
  flow: "groceries",
  since: Date.now() - 86400000,
});
```

## GitHub Actions Integration

The project uses GitHub Actions for seamless TypeScript deployment:

1. **Code Push** → Triggers build pipeline
2. **TypeScript Compilation** → `tsc` generates JavaScript
3. **Bundle Optimization** → Rollup + Terser minification
4. **Asset Processing** → CSS concatenation, flow copying
5. **GitHub Pages Deploy** → Automatic publication

**No manual builds required!** Just push TypeScript and get optimized JavaScript deployment.

## Educational Features

### 🎓 Interactive Learning Modules

- Individual deep-dives into each BOVI mode
- Historical examples with interactive demonstrations
- Real-world scenario analysis with multi-mode breakdowns

### 🎭 Scenario-Based Learning

- Groceries: Shrinkflation detection (Immediate mode)
- Rent: Fair negotiation (Balanced mode)
- Energy: Cohort switching (Obligated mode)

### 📊 Live Analytics

- Flow execution tracking
- AI Butler decision audit trail
- KPI aggregation across scenarios

### 🎨 Production-Quality UX

- Professional dark theme with BOVI color system
- Responsive design for mobile and desktop
- Smooth animations and micro-interactions
- Accessibility compliant (WCAG 2.1)

## Target Audiences

- **Students** — Economics, psychology, anthropology courses
- **Professionals** — FinTech, policy makers, financial advisors
- **General Public** — Anyone wanting to understand money's moral dimensions
- **Developers** — Example of hybrid educational architecture

## Theoretical Foundation

BOVI maps Alan Fiske's Relational Models Theory to monetary exchange:

| Fiske Model       | BOVI Mode | Fairness Logic          | Technology Implementation           |
| ----------------- | --------- | ----------------------- | ----------------------------------- |
| Equality Matching | Balanced  | Symmetry, turn-taking   | B.\* node types, ledger tracking    |
| Authority Ranking | Obligated | Hierarchical compliance | O.\* nodes, timeout enforcement     |
| Market Pricing    | Value     | Proportional exchange   | V.\* PDA, price discovery           |
| Communal Sharing  | Immediate | Direct equivalence      | I.\* detection, fairness violations |

## Contributing

This is an open educational project exploring monetary fairness:

1. **Content** — Additional scenarios, historical examples
2. **Technology** — New flow types, studio enhancements
3. **Theory** — Extensions to BOVI framework
4. **Accessibility** — Multi-language, improved a11y

### TypeScript Development

- Strong typing throughout the flow system
- Event bus with compile-time safety
- Proper separation of concerns
- Extensive JSDoc documentation

## Live Demo

**🚀 Production**: https://bramalkema.github.io/BOVI/
**📊 Analytics**: GitHub Actions build logs
**🔍 Source**: Full TypeScript + JavaScript hybrid codebase

## License

Open source educational project. See docs/ for detailed attribution and sources.

## Learn More

- 📚 [Detailed Theory](docs/theory.md) — Academic foundation and references
- 🎭 [Extended Examples](docs/examples.md) — More real-world BOVI applications
- 📖 [Project Backstory](docs/backstory.md) — Why BOVI matters now
- ⚙️ [Implementation](docs/implementation.md) — Technical architecture details

---

**"Money isn't a single invention—it's a bundle of fairness modes. TypeScript helps us build that understanding with precision and scalability."**
