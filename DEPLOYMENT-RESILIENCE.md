# BOVI Deployment Resilience System

This system ensures that the BOVI Framework can survive major structural changes without breaking deployments.

## 🏗️ Architecture

### Core Components

1. **Resilient Build System** (`scripts/build-resilient.js`)
   - Auto-discovers assets even when file structure changes
   - Validates critical files exist before proceeding
   - Graceful handling of missing non-critical assets
   - Intelligent HTML processing that adapts to changes

2. **Deployment Validation** (`scripts/validate-deployment.js`)
   - Pre-deployment health checks
   - Content validation (ensures KPI dashboard, navigation, etc.)
   - Asset integrity verification
   - Catches issues before they go live

3. **Rollback System** (`scripts/rollback.js`)
   - Automatic backup creation before deployments
   - Quick rollback to previous working versions
   - Emergency recovery for failed deployments
   - Maintains 3 most recent backups

4. **Configuration Management** (`deploy-config.json`)
   - Centralized deployment configuration
   - Separation of critical vs flexible files
   - Easy adjustment of build parameters

## 🚀 Usage

### Normal Deployment
```bash
npm run build      # Resilient build with validation
npm run validate   # Pre-deployment validation
```

### Emergency Procedures
```bash
# Create manual backup
npm run rollback backup

# List available backups
npm run rollback list

# Emergency rollback
npm run rollback rollback [version]
```

### Legacy Fallback
```bash
npm run build:legacy  # Original build system as fallback
```

## 🛡️ Resilience Features

### 1. **Auto-Discovery**
- Automatically finds CSS files even if new ones are added
- Discovers assets in standard locations
- Graceful handling when expected files are missing

### 2. **Structural Change Handling**
- Build system adapts to moved or renamed files
- HTML processing doesn't break with structure changes
- Warning system for non-critical missing assets

### 3. **Validation Gates**
- Content validation ensures critical features are present
- Asset integrity checks prevent broken deployments
- Size validation catches incomplete builds

### 4. **Emergency Recovery**
- Automatic pre-deployment backups
- Quick rollback capability
- Maintains deployment history

## 🔧 Configuration

### Adding New Assets
1. Place CSS files in `src/styles/` - they'll be auto-discovered
2. Update `deploy-config.json` if you need specific processing
3. Add to validation checks if critical for functionality

### Marking Files as Critical
Edit `deploy-config.json`:
```json
{
  "structure": {
    "critical": [
      "index.html",
      "package.json", 
      "src/scripts/app.ts",
      "lib/monitoring/kpi-dashboard.ts",
      "your-new-critical-file.ts"
    ]
  }
}
```

### Custom Validation Rules
Add checks to `scripts/validate-deployment.js`:
```javascript
// In validateHTML() method
if (!html.includes('your-critical-content')) {
  this.errors.push('Missing your critical content');
}
```

## 🚨 Troubleshooting

### Build Fails
1. Check if all critical files exist: `npm run validate`
2. Review warnings for missing non-critical files
3. Use legacy build as fallback: `npm run build:legacy`

### Deployment Breaks
1. Check GitHub Actions logs for validation failures
2. Emergency rollback: `npm run rollback rollback`
3. Fix issues locally and redeploy

### After Major Restructuring
1. Update `deploy-config.json` if needed
2. Test build locally: `npm run build && npm run validate`
3. Commit and let CI/CD handle deployment

## 🎯 Benefits

✅ **Survives restructuring** - Auto-discovery prevents build breaks  
✅ **Early error detection** - Validation catches issues before deployment  
✅ **Quick recovery** - Rollback system minimizes downtime  
✅ **Maintainable** - Centralized configuration makes changes easy  
✅ **Backwards compatible** - Legacy build system available as fallback  

## 📋 Monitoring

The system provides detailed logging:
- Build progress and discovered assets
- Validation results with specific warnings/errors  
- Backup creation and cleanup operations
- Rollback execution status

This ensures you always know what's happening and can debug issues quickly.

---

**Next time we do a major overhaul, the system will adapt automatically! 🎉**