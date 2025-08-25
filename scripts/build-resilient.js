#!/usr/bin/env node
/**
 * Resilient Build Script for BOVI Framework
 * Handles structural changes and validates deployments
 */

import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.join(__dirname, '..');

// Load deployment configuration
const deployConfig = JSON.parse(fs.readFileSync(path.join(projectRoot, 'deploy-config.json'), 'utf8'));

class ResilientBuild {
  constructor() {
    this.config = deployConfig;
    this.distDir = path.join(projectRoot, this.config.build.output.dir);
    this.errors = [];
    this.warnings = [];
  }

  async build() {
    console.log('🚀 Starting resilient BOVI build...');
    
    try {
      await this.validateStructure();
      await this.cleanBuild();
      await this.discoverAssets();
      await this.buildTypeScript();
      await this.buildCSS();
      await this.processHTML();
      await this.copyAssets();
      await this.validateBuild();
      
      if (this.errors.length > 0) {
        throw new Error(`Build failed with ${this.errors.length} errors`);
      }
      
      console.log('✅ Resilient build completed successfully');
      if (this.warnings.length > 0) {
        console.log(`⚠️  ${this.warnings.length} warnings (non-blocking)`);
      }
      
    } catch (error) {
      console.error('❌ Build failed:', error.message);
      this.errors.forEach(err => console.error('  -', err));
      process.exit(1);
    }
  }

  async validateStructure() {
    console.log('📋 Validating project structure...');
    
    for (const criticalFile of this.config.structure.critical) {
      const filePath = path.join(projectRoot, criticalFile);
      if (!fs.existsSync(filePath)) {
        this.errors.push(`Critical file missing: ${criticalFile}`);
      }
    }
  }

  async cleanBuild() {
    console.log('🧹 Cleaning build directory...');
    
    if (fs.existsSync(this.distDir)) {
      fs.rmSync(this.distDir, { recursive: true, force: true });
    }
    fs.mkdirSync(this.distDir, { recursive: true });
    fs.mkdirSync(path.join(this.distDir, 'lib'), { recursive: true });
  }

  async discoverAssets() {
    console.log('🔍 Discovering CSS assets...');
    
    // Auto-discover CSS files to handle structural changes
    const stylesDir = path.join(projectRoot, 'src/styles');
    if (fs.existsSync(stylesDir)) {
      const cssFiles = fs.readdirSync(stylesDir)
        .filter(file => file.endsWith('.css'))
        .map(file => `src/styles/${file}`);
      
      // Update config with discovered CSS files
      this.config.build.entryPoints.css = cssFiles;
      console.log(`  Found ${cssFiles.length} CSS files:`, cssFiles.map(f => path.basename(f)).join(', '));
    }
  }

  async buildTypeScript() {
    console.log('📝 Building TypeScript...');
    
    try {
      // Type check first
      execSync('npx tsc --noEmit', { cwd: projectRoot, stdio: 'inherit' });
      
      // Compile
      execSync('npx tsc', { cwd: projectRoot, stdio: 'inherit' });
      
      // Bundle main app
      execSync('npx rollup -c', { cwd: projectRoot, stdio: 'inherit' });
      
    } catch (error) {
      this.errors.push(`TypeScript build failed: ${error.message}`);
    }
  }

  async buildCSS() {
    console.log('🎨 Building CSS...');
    
    try {
      const cssFiles = this.config.build.entryPoints.css;
      const outputCSS = path.join(this.distDir, 'styles.css');
      const outputMinCSS = path.join(this.distDir, this.config.build.output.cssBundle);
      
      // Concatenate CSS files
      let combinedCSS = '';
      for (const cssFile of cssFiles) {
        const filePath = path.join(projectRoot, cssFile);
        if (fs.existsSync(filePath)) {
          combinedCSS += fs.readFileSync(filePath, 'utf8') + '\n';
        } else {
          this.warnings.push(`CSS file not found: ${cssFile}`);
        }
      }
      
      fs.writeFileSync(outputCSS, combinedCSS);
      
      // Minify CSS
      if (this.config.build.processing.minifyCss) {
        execSync(`npx csso ${outputCSS} --output ${outputMinCSS}`, { cwd: projectRoot });
        fs.unlinkSync(outputCSS); // Remove unminified version
      }
      
    } catch (error) {
      this.errors.push(`CSS build failed: ${error.message}`);
    }
  }

  async processHTML() {
    console.log('📄 Processing HTML...');
    
    try {
      const htmlInput = path.join(projectRoot, this.config.build.entryPoints.html);
      const htmlOutput = path.join(this.distDir, 'index.html');
      
      let htmlContent = fs.readFileSync(htmlInput, 'utf8');
      
      // Remove any existing external CSS references 
      htmlContent = htmlContent.replace(
        /<link rel="stylesheet"[^>]*src\/styles\/[^>]*>/g, 
        ''
      );
      
      // Add CSS bundle reference before closing </head>
      htmlContent = htmlContent.replace(
        '</head>',
        `  <link rel="stylesheet" href="${this.config.build.output.cssBundle}">\n</head>`
      );
      
      // Add JS bundle reference before closing </body>  
      htmlContent = htmlContent.replace(
        '</body>',
        `  <script src="${this.config.build.output.jsBundle}"></script>\n</body>`
      );
      
      // Replace any existing TS references
      htmlContent = htmlContent.replace(
        /src="src\/scripts\/app\.ts"/g,
        `src="${this.config.build.output.jsBundle}"`
      );
      
      fs.writeFileSync(htmlOutput, htmlContent);
      
    } catch (error) {
      this.errors.push(`HTML processing failed: ${error.message}`);
    }
  }

  async copyAssets() {
    console.log('📁 Copying assets...');
    
    try {
      // Copy flows
      const flowsDir = path.join(projectRoot, 'flows');
      if (fs.existsSync(flowsDir)) {
        const distFlows = path.join(this.distDir, 'flows');
        fs.mkdirSync(distFlows, { recursive: true });
        fs.cpSync(flowsDir, distFlows, { recursive: true });
      }
      
      // Copy assets
      const assetsDir = path.join(projectRoot, 'assets');
      if (fs.existsSync(assetsDir)) {
        const distAssets = path.join(this.distDir, 'assets');
        fs.mkdirSync(distAssets, { recursive: true });
        fs.cpSync(assetsDir, distAssets, { recursive: true });
      }
      
    } catch (error) {
      this.errors.push(`Asset copying failed: ${error.message}`);
    }
  }

  async validateBuild() {
    console.log('✅ Validating build output...');
    
    // Check required files exist
    for (const requiredFile of this.config.deployment.validation.required) {
      const filePath = path.join(this.distDir, requiredFile);
      if (!fs.existsSync(filePath)) {
        this.errors.push(`Required build output missing: ${requiredFile}`);
      }
    }
    
    // Validate HTML structure
    const indexPath = path.join(this.distDir, 'index.html');
    if (fs.existsSync(indexPath)) {
      const htmlContent = fs.readFileSync(indexPath, 'utf8');
      
      if (!htmlContent.includes('BOVI Framework')) {
        this.errors.push('HTML missing BOVI Framework title');
      }
      
      if (!htmlContent.includes(this.config.build.output.cssBundle)) {
        this.errors.push('HTML missing CSS bundle reference');
      }
      
      if (!htmlContent.includes(this.config.build.output.jsBundle)) {
        this.errors.push('HTML missing JS bundle reference');
      }
    }
  }
}

// Run build if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  const build = new ResilientBuild();
  await build.build();
}

export { ResilientBuild };