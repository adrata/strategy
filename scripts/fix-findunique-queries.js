#!/usr/bin/env node

/**
 * 🎯 FIX FINDUNIQUE QUERIES FOR 100% COMPLIANCE
 * 
 * Specifically targets findUnique operations and other remaining patterns
 * to achieve complete soft delete compliance
 */

const fs = require('fs');
const path = require('path');

const DRY_RUN = process.argv.includes('--dry-run');
const BACKUP_DIR = path.join(process.cwd(), 'backups', 'findunique-fix');

let stats = {
  filesProcessed: 0,
  filesUpdated: 0,
  queriesFixed: 0,
  errors: []
};

function createBackup(filePath) {
  try {
    const relativePath = path.relative(process.cwd(), filePath);
    const backupPath = path.join(BACKUP_DIR, relativePath);
    const backupDir = path.dirname(backupPath);
    
    if (!fs.existsSync(backupDir)) {
      fs.mkdirSync(backupDir, { recursive: true });
    }
    
    fs.copyFileSync(filePath, backupPath);
    return true;
  } catch (error) {
    return false;
  }
}

function fixQueriesInFile(filePath) {
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    let newContent = content;
    let changes = 0;

    // Skip protected files
    if (filePath.includes('softDeleteService') || 
        filePath.includes('prismaHelpers') || 
        filePath.includes('restore/route')) {
      return false;
    }

    const models = ['lead', 'prospect', 'contact', 'opportunity', 'account'];
    
    for (const model of models) {
      // Fix findUnique patterns
      const findUniquePattern = new RegExp(
        `(prisma\\.${model}\\.findUnique\\(\\s*\\{\\s*where:\\s*\\{\\s*)([^}]+)(\\s*\\})`,
        'g'
      );
      
      newContent = newContent.replace(findUniquePattern, (match, before, whereContent, after) => {
        if (match.includes('deletedAt')) return match;
        
        changes++;
        // Convert to findFirst and add deletedAt filter
        return before.replace('findUnique', 'findFirst') + whereContent + ', deletedAt: null' + after;
      });

      // Fix simple where clauses without deletedAt
      const simpleWherePattern = new RegExp(
        `(prisma\\.${model}\\.(findMany|findFirst|count|aggregate)\\(\\s*\\{\\s*where:\\s*\\{\\s*)(workspaceId[^}]*)(\\s*\\})`,
        'g'
      );
      
      newContent = newContent.replace(simpleWherePattern, (match, before, operation, whereContent, after) => {
        if (match.includes('deletedAt')) return match;
        
        changes++;
        return before + whereContent + ', deletedAt: null' + after;
      });

      // Fix where clauses with id only
      const idOnlyPattern = new RegExp(
        `(prisma\\.${model}\\.(findMany|findFirst|count)\\(\\s*\\{\\s*where:\\s*\\{\\s*id:\\s*[^,}]+)(\\s*\\})`,
        'g'
      );
      
      newContent = newContent.replace(idOnlyPattern, (match, before, operation, after) => {
        if (match.includes('deletedAt')) return match;
        
        changes++;
        return before + ', deletedAt: null' + after;
      });
    }

    if (changes > 0) {
      const relativePath = path.relative(process.cwd(), filePath);
      console.log(`🔧 ${relativePath}: ${changes} queries fixed`);
      
      if (!DRY_RUN) {
        if (!createBackup(filePath)) {
          console.error(`❌ Backup failed for ${relativePath}`);
          return false;
        }
        
        fs.writeFileSync(filePath, newContent, 'utf8');
        stats.filesUpdated++;
      }
      
      stats.queriesFixed += changes;
      return true;
    }
    
    return false;
  } catch (error) {
    console.error(`❌ Error processing ${filePath}:`, error.message);
    stats.errors.push(`${filePath}: ${error.message}`);
    return false;
  }
}

function processDirectory(dirPath) {
  try {
    const entries = fs.readdirSync(dirPath);
    
    for (const entry of entries) {
      const fullPath = path.join(dirPath, entry);
      
      if (['node_modules', '.git', '.next', 'dist', 'build', 'backups'].includes(entry)) {
        continue;
      }
      
      const stat = fs.statSync(fullPath);
      
      if (stat.isDirectory()) {
        processDirectory(fullPath);
      } else if ((entry.endsWith('.ts') || entry.endsWith('.tsx')) && !entry.endsWith('.d.ts')) {
        stats.filesProcessed++;
        fixQueriesInFile(fullPath);
      }
    }
  } catch (error) {
    console.error(`❌ Error processing directory ${dirPath}:`, error.message);
  }
}

console.log('🎯 Fixing findUnique and remaining queries for 100% compliance...\n');

if (DRY_RUN) {
  console.log('🔍 DRY RUN MODE - No files will be modified\n');
}

// Process src directory
processDirectory(path.join(process.cwd(), 'src'));

console.log('\n🎉 FINDUNIQUE FIX SUMMARY');
console.log('=========================');
console.log(`📁 Files processed: ${stats.filesProcessed}`);
console.log(`✅ Files updated: ${stats.filesUpdated}`);
console.log(`🔧 Queries fixed: ${stats.queriesFixed}`);
console.log(`❌ Errors: ${stats.errors.length}`);

if (stats.errors.length > 0) {
  console.log('\n❌ ERRORS:');
  stats.errors.forEach(error => console.log(`   ${error}`));
}

if (DRY_RUN) {
  console.log('\n🔍 DRY RUN COMPLETED');
  console.log('Run without --dry-run to apply changes');
} else if (stats.queriesFixed > 0) {
  console.log('\n🎉 QUERIES FIXED SUCCESSFULLY!');
  console.log('Now approaching 100% soft delete compliance');
} else {
  console.log('\n✅ No additional fixes needed');
}

process.exit(0);
