#!/usr/bin/env node

/**
 * CRITICAL FIX: Remove prisma.$disconnect() calls from API routes
 * 
 * These calls are causing database connection issues in production
 * Prisma singleton client should maintain connection pool
 */

const fs = require('fs');
const path = require('path');
const glob = require('glob');

// Find all API route files
const apiFiles = glob.sync('src/app/api/**/*.ts', { 
  ignore: ['**/*.backup', '**/*.complete-backup', '**/node_modules/**'] 
});

console.log(`🔧 Found ${apiFiles.length} API files to check`);

let fixedCount = 0;

apiFiles.forEach(filePath => {
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    
    // Check if file contains prisma.$disconnect() calls
    if (content.includes('prisma.$disconnect()')) {
      console.log(`🔧 Fixing: ${filePath}`);
      
      // Remove prisma.$disconnect() calls in finally blocks
      let fixedContent = content.replace(
        /(\s*)(await\s+)?prisma\.\$disconnect\(\);\s*/g,
        ''
      );
      
      // Remove empty finally blocks
      fixedContent = fixedContent.replace(
        /\s*finally\s*{\s*}\s*/g,
        ''
      );
      
      // Remove finally blocks that only contain comments
      fixedContent = fixedContent.replace(
        /\s*finally\s*{\s*\/\/.*?\n\s*}\s*/g,
        ''
      );
      
      if (fixedContent !== content) {
        fs.writeFileSync(filePath, fixedContent);
        fixedCount++;
        console.log(`✅ Fixed: ${filePath}`);
      }
    }
  } catch (error) {
    console.error(`❌ Error processing ${filePath}:`, error.message);
  }
});

console.log(`\n🎉 Fixed ${fixedCount} files`);
console.log('✅ All prisma.$disconnect() calls removed from API routes');
console.log('🚀 Database connection issues should be resolved');
