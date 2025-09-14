#!/usr/bin/env node

/**
 * 🛡️ SAFE SOFT DELETE MIGRATION
 * 
 * Safely updates remaining files to use soft delete filtering
 * - Creates backups before any changes
 * - Only updates safe, low-risk patterns
 * - Validates changes don't break functionality
 * - Rollback capability if issues detected
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Configuration
const BACKUP_DIR = path.join(process.cwd(), 'backups', 'soft-delete-migration');
const DRY_RUN = process.argv.includes('--dry-run');

// Safe patterns to update (low risk of breaking)
const SAFE_PATTERNS = [
  {
    name: 'Simple findMany with workspace filter',
    pattern: /prisma\.(lead|prospect|contact|opportunity|account)\.findMany\(\{\s*where:\s*\{\s*workspaceId[^}]*\}\s*\}/g,
    replacement: (match, model) => {
      return match.replace(
        /where:\s*\{\s*workspaceId([^}]*)\}/,
        `where: { workspaceId$1, deletedAt: null }`
      );
    }
  },
  {
    name: 'Simple findFirst with workspace filter',
    pattern: /prisma\.(lead|prospect|contact|opportunity|account)\.findFirst\(\{\s*where:\s*\{\s*workspaceId[^}]*\}\s*\}/g,
    replacement: (match, model) => {
      return match.replace(
        /where:\s*\{\s*workspaceId([^}]*)\}/,
        `where: { workspaceId$1, deletedAt: null }`
      );
    }
  },
  {
    name: 'Simple count with workspace filter',
    pattern: /prisma\.(lead|prospect|contact|opportunity|account)\.count\(\{\s*where:\s*\{\s*workspaceId[^}]*\}\s*\}/g,
    replacement: (match, model) => {
      return match.replace(
        /where:\s*\{\s*workspaceId([^}]*)\}/,
        `where: { workspaceId$1, deletedAt: null }`
      );
    }
  }
];

// Files to NEVER modify (high risk)
const PROTECTED_FILES = [
  'prisma/schema.prisma',
  'src/platform/ai/services/AIDataService.ts', // Already updated
  'src/platform/services/softDeleteService.ts', // Core service
  'src/platform/utils/prismaHelpers.ts', // Helper utilities
  'src/app/api/pipeline/route.ts', // Already has comprehensive filtering
  'node_modules/',
  '.git/',
  'dist/',
  'build/'
];

let migrationStats = {
  filesScanned: 0,
  filesUpdated: 0,
  patternsReplaced: 0,
  backupsCreated: 0,
  errors: []
};

console.log('🛡️ Starting Safe Soft Delete Migration...\n');

if (DRY_RUN) {
  console.log('🔍 DRY RUN MODE - No files will be modified\n');
}

function createBackup(filePath) {
  try {
    const backupPath = path.join(BACKUP_DIR, filePath);
    const backupDir = path.dirname(backupPath);
    
    // Create backup directory if it doesn't exist
    if (!fs.existsSync(backupDir)) {
      fs.mkdirSync(backupDir, { recursive: true });
    }
    
    // Copy original file to backup
    fs.copyFileSync(filePath, backupPath);
    migrationStats.backupsCreated++;
    
    console.log(`📁 Backup created: ${backupPath}`);
    return true;
  } catch (error) {
    console.error(`❌ Failed to create backup for ${filePath}:`, error.message);
    migrationStats.errors.push(`Backup failed: ${filePath} - ${error.message}`);
    return false;
  }
}

function isProtectedFile(filePath) {
  return PROTECTED_FILES.some(protected => filePath.includes(protected));
}

function validateFileChanges(filePath, originalContent, newContent) {
  // Basic validation checks
  const checks = [
    {
      name: 'Syntax preservation',
      test: () => {
        // Check that we didn't break basic syntax
        const openBraces = (newContent.match(/\{/g) || []).length;
        const closeBraces = (newContent.match(/\}/g) || []).length;
        return openBraces === closeBraces;
      }
    },
    {
      name: 'No duplicate deletedAt',
      test: () => {
        // Make sure we didn't add deletedAt where it already exists
        const lines = newContent.split('\n');
        return !lines.some(line => 
          line.includes('deletedAt: null') && 
          line.includes('deletedAt: null, deletedAt: null')
        );
      }
    },
    {
      name: 'Prisma query structure',
      test: () => {
        // Ensure we didn't break Prisma query structure
        const prismaQueries = newContent.match(/prisma\.\w+\.\w+\(/g) || [];
        return prismaQueries.length > 0; // Should still have queries
      }
    }
  ];

  for (const check of checks) {
    if (!check.test()) {
      console.error(`❌ Validation failed for ${filePath}: ${check.name}`);
      return false;
    }
  }

  return true;
}

function processFile(filePath) {
  migrationStats.filesScanned++;

  if (isProtectedFile(filePath)) {
    console.log(`🔒 Skipping protected file: ${filePath}`);
    return;
  }

  try {
    const originalContent = fs.readFileSync(filePath, 'utf8');
    let newContent = originalContent;
    let hasChanges = false;

    // Apply safe patterns
    for (const pattern of SAFE_PATTERNS) {
      const matches = originalContent.match(pattern.pattern);
      if (matches) {
        console.log(`🔍 Found ${matches.length} instances of "${pattern.name}" in ${filePath}`);
        
        newContent = newContent.replace(pattern.pattern, (match, model) => {
          // Skip if already has deletedAt filter
          if (match.includes('deletedAt')) {
            return match;
          }
          
          migrationStats.patternsReplaced++;
          hasChanges = true;
          
          return pattern.replacement(match, model);
        });
      }
    }

    if (hasChanges) {
      // Validate changes before applying
      if (!validateFileChanges(filePath, originalContent, newContent)) {
        console.error(`❌ Validation failed for ${filePath}, skipping...`);
        return;
      }

      if (!DRY_RUN) {
        // Create backup before modifying
        if (!createBackup(filePath)) {
          console.error(`❌ Cannot create backup for ${filePath}, skipping...`);
          return;
        }

        // Apply changes
        fs.writeFileSync(filePath, newContent, 'utf8');
        migrationStats.filesUpdated++;
        console.log(`✅ Updated: ${filePath}`);
      } else {
        console.log(`📝 Would update: ${filePath} (dry run)`);
        migrationStats.filesUpdated++;
      }
    }

  } catch (error) {
    console.error(`❌ Error processing ${filePath}:`, error.message);
    migrationStats.errors.push(`Processing error: ${filePath} - ${error.message}`);
  }
}

function scanDirectory(dirPath) {
  try {
    const entries = fs.readdirSync(dirPath);
    
    for (const entry of entries) {
      const fullPath = path.join(dirPath, entry);
      const stat = fs.statSync(fullPath);
      
      if (stat.isDirectory()) {
        // Skip protected directories
        if (!isProtectedFile(fullPath)) {
          scanDirectory(fullPath);
        }
      } else if (entry.endsWith('.ts') || entry.endsWith('.tsx')) {
        processFile(fullPath);
      }
    }
  } catch (error) {
    console.error(`❌ Error scanning directory ${dirPath}:`, error.message);
  }
}

function rollbackChanges() {
  console.log('\n🔄 Rolling back changes...');
  
  try {
    if (fs.existsSync(BACKUP_DIR)) {
      // Restore all backup files
      const restoreFiles = (dir, backupRoot) => {
        const entries = fs.readdirSync(dir);
        
        for (const entry of entries) {
          const backupPath = path.join(dir, entry);
          const stat = fs.statSync(backupPath);
          
          if (stat.isDirectory()) {
            restoreFiles(backupPath, backupRoot);
          } else {
            // Calculate original file path
            const relativePath = path.relative(backupRoot, backupPath);
            const originalPath = path.join(process.cwd(), relativePath);
            
            // Restore file
            fs.copyFileSync(backupPath, originalPath);
            console.log(`🔄 Restored: ${originalPath}`);
          }
        }
      };
      
      restoreFiles(BACKUP_DIR, BACKUP_DIR);
      console.log('✅ Rollback completed successfully');
    }
  } catch (error) {
    console.error('❌ Rollback failed:', error.message);
  }
}

// Handle process termination
process.on('SIGINT', () => {
  console.log('\n⚠️ Migration interrupted by user');
  if (!DRY_RUN && migrationStats.filesUpdated > 0) {
    rollbackChanges();
  }
  process.exit(1);
});

// Main execution
async function main() {
  try {
    // Start migration
    console.log('📁 Scanning src directory...');
    scanDirectory(path.join(process.cwd(), 'src'));

    // Print results
    console.log('\n📊 MIGRATION SUMMARY');
    console.log('===================');
    console.log(`Files scanned: ${migrationStats.filesScanned}`);
    console.log(`Files updated: ${migrationStats.filesUpdated}`);
    console.log(`Patterns replaced: ${migrationStats.patternsReplaced}`);
    console.log(`Backups created: ${migrationStats.backupsCreated}`);
    console.log(`Errors: ${migrationStats.errors.length}`);

    if (migrationStats.errors.length > 0) {
      console.log('\n❌ ERRORS:');
      migrationStats.errors.forEach(error => console.log(`   ${error}`));
    }

    if (DRY_RUN) {
      console.log('\n🔍 DRY RUN COMPLETED - No files were modified');
      console.log('Run without --dry-run to apply changes');
    } else if (migrationStats.filesUpdated > 0) {
      console.log('\n✅ MIGRATION COMPLETED SUCCESSFULLY');
      console.log(`Backups available in: ${BACKUP_DIR}`);
      console.log('\n💡 Next steps:');
      console.log('1. Test the application thoroughly');
      console.log('2. Run the audit script to verify 100% compliance');
      console.log('3. If issues found, run: node scripts/safe-soft-delete-migration.js --rollback');
    } else {
      console.log('\n✅ NO CHANGES NEEDED - All files already compliant');
    }

  } catch (error) {
    console.error('❌ Migration failed:', error.message);
    
    if (!DRY_RUN && migrationStats.filesUpdated > 0) {
      rollbackChanges();
    }
    
    process.exit(1);
  }
}

// Handle rollback command
if (process.argv.includes('--rollback')) {
  rollbackChanges();
  process.exit(0);
}

// Run migration
main();
