# BOVI Framework 🏛️

**Balanced • Obligated • Value • Immediate** — A modular educational framework for understanding the four fairness modes of money

[![Build Status](https://github.com/BramAlkema/BOVI/actions/workflows/deploy.yml/badge.svg)](https://github.com/BramAlkema/BOVI/actions/workflows/deploy.yml)
[![Live Demo](https://img.shields.io/badge/demo-live-brightgreen)](https://bramalkema.github.io/BOVI/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue)](https://www.typescriptlang.org/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

## 🎯 What is BOVI?

BOVI explains that money isn't a single invention—it's a **bundle of four fairness modes** that humans use to structure exchange. Each mode maps to Alan Fiske's relational models and solves different trade problems:

### The Four Modes

| Mode             | Symbol | Relational Model  | Core Principle                 | Examples                            |
| ---------------- | ------ | ----------------- | ------------------------------ | ----------------------------------- |
| **🔵 Balanced**  | `B`    | Equality Matching | Fairness as symmetry           | Ledgers, tallies, turn-taking       |
| **🔴 Obligated** | `O`    | Authority Ranking | Fairness as compliance         | Taxes, rent, hierarchical duties    |
| **🟢 Value**     | `V`    | Market Pricing    | Fairness as proportionality    | Price discovery, transferable units |
| **🟡 Immediate** | `I`    | Communal Sharing  | Fairness as direct equivalence | Tit-for-tat, visceral fairness      |

## 🚀 Live Demo

**Try it now**: https://bramalkema.github.io/BOVI/

- Interactive KPI dashboard with real-time system health monitoring
- Explore each fairness mode with hands-on demos
- Real-world scenarios (grocery inflation, rent negotiation, energy cohorts)
- Complete framework bundle visualization

## 🏗️ Architecture

### Modular Design

The BOVI Framework is built as **37 focused modules** with clear separation of concerns:

```
lib/
├── core/           # Constants, bus, receipts, rulers
├── monitoring/     # KPI dashboard, performance tracking
├── services/       # Business logic (rulers, contracts, storm-mode)
├── ui/            # Interactive components and dashboards
├── integration/   # System orchestration and initialization
└── plugins/       # Extensible plugin system
```

### Key Features

- **🎯 Real-time KPI Monitoring** - 16 metrics with red/amber/green thresholds
- **⚡ Performance Tracking** - Sub-200ms response times for core operations
- **🔧 Storm Mode** - Automated crisis response with preset changes
- **📋 Smart Contracts** - Index-linked agreements with automatic adjustments
- **👥 Cohort Engine** - Group formation with mathematical fairness guarantees
- **📊 Export System** - Complete data portability in JSON format

## 🛠️ Development

### Quick Start

```bash
# Clone and setup
git clone https://github.com/BramAlkema/BOVI.git
cd BOVI
npm install

# Start development
npm run dev              # Local server at http://localhost:8080
npm run dev:watch        # TypeScript compilation with watch
```

### Build Commands

```bash
npm run build           # Resilient production build
npm run validate        # Pre-deployment validation
npm run typecheck       # TypeScript compilation check
npm run lint            # Code quality checks
npm run test            # Run test suite
npm run rollback list   # Show deployment backups
```

### Resilient Deployment System

The project features a **deployment-resilient architecture** that survives major restructuring:

- **Auto-discovery build** - Adapts to file structure changes
- **Pre-deployment validation** - Catches issues before going live
- **Emergency rollback** - Quick recovery from failed deployments
- **Centralized configuration** - Easy maintenance and updates

## 📊 System Health

The KPI dashboard monitors:

### Performance Metrics

- **Ruler Switch Time**: <200ms (green), 200-1000ms (amber), >1000ms (red)
- **Money-veil Calculation**: <500ms target
- **API Response Time**: <500ms average
- **System Uptime**: >99% target

### User Engagement

- **Ruler Adoption Rate**: >60% try non-default rulers
- **Contract Completion Rate**: >90% signed
- **Cohort Satisfaction**: >95% no-one-worse-off guarantee

### System Quality

- **Failed Payment Rate**: <0.5%
- **Rule Compliance**: >90% using latest rules
- **Appeal Resolution**: <3 days average

## 🎓 Educational Applications

### Interactive Learning

- **Mode Deep-dives** - Hands-on exploration of each fairness mode
- **Real-world Scenarios** - Navigate grocery inflation, rent negotiation, energy switching
- **Bundle Understanding** - See how all four modes work together

### Target Audiences

- **📚 Students** - Economics, psychology, anthropology courses
- **💼 Professionals** - FinTech, policy makers, financial advisors
- **🌍 General Public** - Understanding money's moral dimensions
- **👩‍💻 Developers** - Example of modular educational architecture

## 🔧 Technical Highlights

### TypeScript-First

```typescript
// Centralized constants with type safety
import { BoviMode, BoviEvents } from "./lib/core/constants.js";

// KPI tracking with automatic status determination
const metric = createKPIMetric("ruler_switch_time", 150, "stable");

// Event bus with compile-time safety
Bus.emit(BoviEvents.RULER_CHANGED, { ruler: "LTS", performance: 145 });
```

### Modular Plugin System

```typescript
// Extensible architecture
import { PluginManager } from "./lib/plugins/plugin-manager.js";
import { KPIDashboard } from "./lib/monitoring/kpi-dashboard.js";

const dashboard = new KPIDashboard();
PluginManager.register("monitoring", dashboard);
```

### Performance Optimization

- **Lazy Loading** - Components load on demand
- **Bundle Splitting** - Separate app.min.js and lib bundles
- **CSS Optimization** - Minified styles with auto-discovery
- **Asset Caching** - Efficient browser caching strategy

## 🚀 Deployment

### GitHub Actions Pipeline

1. **TypeScript Compilation** - Full type checking
2. **Code Quality** - ESLint validation
3. **Resilient Build** - Auto-discovery and validation
4. **Pre-deployment Checks** - Content and asset validation
5. **GitHub Pages Deploy** - Automatic publication
6. **Backup Creation** - Rollback capability

### Production Features

- **Zero-downtime deploys** - Validated before going live
- **Automatic rollback** - Emergency recovery in seconds
- **Performance monitoring** - Real-time KPI tracking
- **Progressive enhancement** - Works without JavaScript for core content

## 📈 Project Status

### ✅ Completed Features

- [x] Modular architecture with 37 focused modules
- [x] Real-time KPI dashboard with 16 metrics
- [x] Performance monitoring and trend analysis
- [x] Resilient deployment system with rollback
- [x] Complete TypeScript migration and type safety
- [x] Interactive UI for all four fairness modes
- [x] Automated CI/CD with validation gates

### 🚧 In Progress

- [ ] PDF receipt generation for smart contracts
- [ ] Expanded test coverage (>80% target)
- [ ] Performance benchmarking suite
- [ ] Multi-language support

### 📋 Backlog Compliance

**90% implementation completeness** against [developer backlog requirements](docs/developer-backlog.md)

- **Phase 1** (Personal BOVI): ✅ 100% Complete
- **Phase 2** (Social BOVI): ⚠️ 85% Complete
- **Phase 3** (Advanced BOVI): ✅ 100% Complete

## 🤝 Contributing

We welcome contributions to the BOVI Framework:

### Areas for Contribution

1. **Educational Content** - New scenarios, historical examples
2. **Technical Enhancements** - Performance optimization, new features
3. **Accessibility** - Multi-language support, improved a11y
4. **Documentation** - User guides, developer documentation

### Development Guidelines

- Follow TypeScript best practices with strict typing
- Maintain modular architecture principles
- Include KPI metrics for new features
- Add comprehensive tests for new functionality
- Update documentation for API changes

## 📚 Documentation

- **[Deployment Resilience](DEPLOYMENT-RESILIENCE.md)** - System architecture for surviving overhauls
- **[Implementation Gap Analysis](docs/implementation-gap-analysis.md)** - Current vs backlog requirements
- **[Developer Backlog](docs/developer-backlog.md)** - Complete feature requirements
- **[API Documentation](lib/api-types.ts)** - TypeScript definitions and interfaces

## 🎖️ Recognition

The BOVI Framework demonstrates:

- **🏗️ Modular Architecture** - Clean separation with 37 focused modules
- **📊 Production Monitoring** - Comprehensive KPI dashboard
- **🛡️ Deployment Resilience** - Survives structural changes
- **⚡ Performance Excellence** - Sub-200ms response times
- **🎯 Educational Innovation** - Interactive fairness mode exploration

## 📄 License

MIT License - Open source educational project.

## 🔗 Links

- **🚀 Live Demo**: https://bramalkema.github.io/BOVI/
- **📊 Build Status**: [GitHub Actions](https://github.com/BramAlkema/BOVI/actions)
- **📖 Full Documentation**: [Wiki](https://github.com/BramAlkema/BOVI/wiki)
- **🐛 Report Issues**: [GitHub Issues](https://github.com/BramAlkema/BOVI/issues)

---

**"Money isn't a single invention—it's a bundle of fairness modes. The BOVI Framework helps us understand this with interactive precision and modular scalability."** 🎯
