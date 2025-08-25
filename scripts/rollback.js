#!/usr/bin/env node
/**
 * Rollback Script for BOVI Framework
 * Provides emergency rollback capability for failed deployments
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.join(__dirname, '..');

class RollbackManager {
  constructor() {
    this.backupDir = path.join(projectRoot, '.deployment-backups');
    this.distDir = path.join(projectRoot, 'dist');
  }

  async createBackup(version = null) {
    const timestamp = version || new Date().toISOString().replace(/[:.]/g, '-');
    const backupPath = path.join(this.backupDir, timestamp);
    
    console.log(`📦 Creating backup: ${timestamp}`);
    
    if (!fs.existsSync(this.backupDir)) {
      fs.mkdirSync(this.backupDir, { recursive: true });
    }
    
    if (fs.existsSync(this.distDir)) {
      fs.cpSync(this.distDir, backupPath, { recursive: true });
      
      // Create metadata
      const metadata = {
        version: timestamp,
        created: new Date().toISOString(),
        size: this.getDirectorySize(backupPath),
        files: this.listFiles(backupPath)
      };
      
      fs.writeFileSync(
        path.join(backupPath, '.backup-metadata.json'),
        JSON.stringify(metadata, null, 2)
      );
      
      console.log(`✅ Backup created: ${timestamp}`);
      
      // Clean old backups (keep only 3)
      await this.cleanOldBackups();
      
      return timestamp;
    }
    
    throw new Error('No dist directory to backup');
  }

  async listBackups() {
    if (!fs.existsSync(this.backupDir)) {
      console.log('📁 No backups found');
      return [];
    }
    
    const backups = fs.readdirSync(this.backupDir)
      .filter(name => fs.statSync(path.join(this.backupDir, name)).isDirectory())
      .map(name => {
        const metadataPath = path.join(this.backupDir, name, '.backup-metadata.json');
        let metadata = { version: name, created: 'unknown', size: 0, files: [] };
        
        if (fs.existsSync(metadataPath)) {
          try {
            metadata = JSON.parse(fs.readFileSync(metadataPath, 'utf8'));
          } catch (error) {
            console.warn(`⚠️  Failed to read metadata for backup ${name}`);
          }
        }
        
        return metadata;
      })
      .sort((a, b) => new Date(b.created) - new Date(a.created));
    
    console.log('📋 Available backups:');
    backups.forEach((backup, index) => {
      console.log(`  ${index + 1}. ${backup.version} (${backup.created}) - ${backup.files.length} files`);
    });
    
    return backups;
  }

  async rollback(version = null) {
    const backups = await this.listBackups();
    
    if (backups.length === 0) {
      throw new Error('No backups available for rollback');
    }
    
    const targetBackup = version 
      ? backups.find(b => b.version === version)
      : backups[0]; // Latest backup
    
    if (!targetBackup) {
      throw new Error(`Backup version not found: ${version}`);
    }
    
    console.log(`🔄 Rolling back to: ${targetBackup.version}`);
    
    const backupPath = path.join(this.backupDir, targetBackup.version);
    
    if (!fs.existsSync(backupPath)) {
      throw new Error(`Backup directory not found: ${backupPath}`);
    }
    
    // Create backup of current state before rollback
    if (fs.existsSync(this.distDir)) {
      await this.createBackup(`pre-rollback-${Date.now()}`);
    }
    
    // Remove current dist
    if (fs.existsSync(this.distDir)) {
      fs.rmSync(this.distDir, { recursive: true, force: true });
    }
    
    // Restore from backup
    fs.cpSync(backupPath, this.distDir, { recursive: true });
    
    // Remove metadata file from restored dist
    const metadataPath = path.join(this.distDir, '.backup-metadata.json');
    if (fs.existsSync(metadataPath)) {
      fs.unlinkSync(metadataPath);
    }
    
    console.log(`✅ Rollback completed to version: ${targetBackup.version}`);
    
    return targetBackup;
  }

  async cleanOldBackups(keepCount = 3) {
    if (!fs.existsSync(this.backupDir)) return;
    
    const backups = fs.readdirSync(this.backupDir)
      .filter(name => fs.statSync(path.join(this.backupDir, name)).isDirectory())
      .map(name => ({
        name,
        created: fs.statSync(path.join(this.backupDir, name)).mtime
      }))
      .sort((a, b) => b.created - a.created);
    
    if (backups.length > keepCount) {
      const toDelete = backups.slice(keepCount);
      
      for (const backup of toDelete) {
        const backupPath = path.join(this.backupDir, backup.name);
        fs.rmSync(backupPath, { recursive: true, force: true });
        console.log(`🗑️  Cleaned old backup: ${backup.name}`);
      }
    }
  }

  getDirectorySize(dirPath) {
    let totalSize = 0;
    
    const traverse = (currentPath) => {
      const items = fs.readdirSync(currentPath);
      
      for (const item of items) {
        const itemPath = path.join(currentPath, item);
        const stats = fs.statSync(itemPath);
        
        if (stats.isDirectory()) {
          traverse(itemPath);
        } else {
          totalSize += stats.size;
        }
      }
    };
    
    traverse(dirPath);
    return totalSize;
  }

  listFiles(dirPath) {
    const files = [];
    
    const traverse = (currentPath, relativePath = '') => {
      const items = fs.readdirSync(currentPath);
      
      for (const item of items) {
        const itemPath = path.join(currentPath, item);
        const itemRelativePath = path.join(relativePath, item);
        const stats = fs.statSync(itemPath);
        
        if (stats.isDirectory()) {
          traverse(itemPath, itemRelativePath);
        } else {
          files.push(itemRelativePath);
        }
      }
    };
    
    traverse(dirPath);
    return files;
  }
}

// CLI interface
if (import.meta.url === `file://${process.argv[1]}`) {
  const rollback = new RollbackManager();
  const command = process.argv[2];
  const version = process.argv[3];
  
  try {
    switch (command) {
      case 'backup':
        await rollback.createBackup(version);
        break;
      case 'list':
        await rollback.listBackups();
        break;
      case 'rollback':
        await rollback.rollback(version);
        break;
      default:
        console.log('📚 Usage:');
        console.log('  npm run rollback backup [version]  - Create backup');
        console.log('  npm run rollback list              - List backups');  
        console.log('  npm run rollback rollback [version] - Rollback to version');
    }
  } catch (error) {
    console.error('❌ Rollback failed:', error.message);
    process.exit(1);
  }
}

export { RollbackManager };