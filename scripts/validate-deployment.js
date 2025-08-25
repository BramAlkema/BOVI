#!/usr/bin/env node
/**
 * Deployment Validation Script
 * Tests the built site before deployment to catch issues early
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.join(__dirname, '..');

class DeploymentValidator {
  constructor() {
    this.distDir = path.join(projectRoot, 'dist');
    this.errors = [];
    this.warnings = [];
  }

  async validate() {
    console.log('🔍 Validating deployment readiness...');
    
    try {
      this.validateFiles();
      this.validateHTML();
      this.validateCSS();
      this.validateJS();
      this.validateAssets();
      
      if (this.errors.length > 0) {
        console.error(`❌ Deployment validation failed with ${this.errors.length} errors:`);
        this.errors.forEach(err => console.error('  -', err));
        return false;
      }
      
      console.log('✅ Deployment validation passed');
      if (this.warnings.length > 0) {
        console.log(`⚠️  ${this.warnings.length} warnings:`);
        this.warnings.forEach(warn => console.warn('  -', warn));
      }
      
      return true;
      
    } catch (error) {
      console.error('❌ Validation failed:', error.message);
      return false;
    }
  }

  validateFiles() {
    const requiredFiles = ['index.html', 'styles.min.css', 'app.min.js'];
    
    for (const file of requiredFiles) {
      const filePath = path.join(this.distDir, file);
      if (!fs.existsSync(filePath)) {
        this.errors.push(`Missing required file: ${file}`);
      } else {
        const stats = fs.statSync(filePath);
        if (stats.size === 0) {
          this.errors.push(`Empty file: ${file}`);
        }
      }
    }
  }

  validateHTML() {
    const indexPath = path.join(this.distDir, 'index.html');
    if (!fs.existsSync(indexPath)) return;
    
    const html = fs.readFileSync(indexPath, 'utf8');
    
    // Check critical content
    const criticalContent = [
      'BOVI Framework',
      'Balanced • Obligated • Value • Immediate',
      'setupKPIDashboardUI',
      'styles.min.css',
      'app.min.js'
    ];
    
    for (const content of criticalContent) {
      if (!html.includes(content)) {
        this.errors.push(`HTML missing critical content: "${content}"`);
      }
    }
    
    // Check for proper structure
    if (!html.includes('<nav>')) {
      this.errors.push('HTML missing navigation structure');
    }
    
    if (!html.includes('data-tab="overview"')) {
      this.errors.push('HTML missing tab navigation');
    }
    
    // Check for old content that shouldn't be there
    const deprecatedContent = [
      'Groceries — Scan basket',
      'Rent — Negotiate increase',
      'Energy — Cohort switching'
    ];
    
    for (const deprecated of deprecatedContent) {
      if (html.includes(deprecated)) {
        this.warnings.push(`HTML contains deprecated content: "${deprecated}"`);
      }
    }
  }

  validateCSS() {
    const cssPath = path.join(this.distDir, 'styles.min.css');
    if (!fs.existsSync(cssPath)) return;
    
    const css = fs.readFileSync(cssPath, 'utf8');
    
    // Check for critical styles
    const criticalStyles = [
      '.kpi-dashboard-panel',
      '.mode-badge',
      '.panel',
      '.tab'
    ];
    
    for (const style of criticalStyles) {
      if (!css.includes(style)) {
        this.warnings.push(`CSS missing critical style: "${style}"`);
      }
    }
    
    // Check file size (should be substantial)
    const stats = fs.statSync(cssPath);
    if (stats.size < 5000) { // Less than 5KB is probably incomplete
      this.warnings.push(`CSS bundle seems small (${stats.size} bytes) - might be incomplete`);
    }
  }

  validateJS() {
    const jsPath = path.join(this.distDir, 'app.min.js');
    if (!fs.existsSync(jsPath)) return;
    
    const js = fs.readFileSync(jsPath, 'utf8');
    
    // Check for critical functions
    const criticalFunctions = [
      'BoviApp',
      'initNavigation',
      'setupKPIDashboardUI'
    ];
    
    for (const func of criticalFunctions) {
      if (!js.includes(func)) {
        this.warnings.push(`JS bundle missing critical function: "${func}"`);
      }
    }
    
    // Check file size
    const stats = fs.statSync(jsPath);
    if (stats.size < 10000) { // Less than 10KB is probably incomplete
      this.warnings.push(`JS bundle seems small (${stats.size} bytes) - might be incomplete`);
    }
  }

  validateAssets() {
    // Check if flows directory exists
    const flowsDir = path.join(this.distDir, 'flows');
    if (fs.existsSync(flowsDir)) {
      const flows = fs.readdirSync(flowsDir).filter(f => f.endsWith('.json'));
      if (flows.length === 0) {
        this.warnings.push('No flow files found in dist/flows');
      }
    } else {
      this.warnings.push('No flows directory in dist');
    }
    
    // Check lib directory structure
    const libDir = path.join(this.distDir, 'lib');
    if (fs.existsSync(libDir)) {
      const hasIntegration = fs.existsSync(path.join(libDir, 'integration'));
      const hasMonitoring = fs.existsSync(path.join(libDir, 'monitoring'));
      
      if (!hasIntegration) {
        this.warnings.push('Missing lib/integration directory');
      }
      if (!hasMonitoring) {
        this.warnings.push('Missing lib/monitoring directory');
      }
    } else {
      this.errors.push('Missing lib directory in dist');
    }
  }
}

// Run validation if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  const validator = new DeploymentValidator();
  const isValid = await validator.validate();
  process.exit(isValid ? 0 : 1);
}

export { DeploymentValidator };