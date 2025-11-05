#!/usr/bin/env node

/**
 * Fix Prisma File Lock Issues on Windows
 * 
 * This script aggressively cleans up Prisma client files that may be locked
 * by running processes, then attempts to regenerate.
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const prismaClientPath = path.join(__dirname, '..', 'node_modules', '.prisma', 'client');

console.log('🔧 Fixing Prisma File Lock Issues...\n');

// Step 1: Try to delete the entire .prisma/client directory
if (fs.existsSync(prismaClientPath)) {
  console.log('📁 Found Prisma client directory');
  console.log('   Attempting to remove locked files...\n');
  
  try {
    // Try to remove files individually first
    const files = fs.readdirSync(prismaClientPath);
    let removed = 0;
    let failed = 0;
    
    for (const file of files) {
      const filePath = path.join(prismaClientPath, file);
      try {
        if (fs.statSync(filePath).isFile()) {
          fs.unlinkSync(filePath);
          removed++;
        } else {
          // Try to remove directory
          fs.rmSync(filePath, { recursive: true, force: true });
          removed++;
        }
      } catch (error) {
        failed++;
        if (file.includes('query-engine')) {
          console.log(`   ⚠️  Could not remove: ${file} (likely locked by running process)`);
        }
      }
    }
    
    console.log(`   ✅ Removed ${removed} files/directories`);
    if (failed > 0) {
      console.log(`   ⚠️  ${failed} files could not be removed (locked)\n`);
    } else {
      console.log('');
    }
    
    // Try to remove the directory itself
    try {
      fs.rmSync(prismaClientPath, { recursive: true, force: true });
      console.log('   ✅ Removed .prisma/client directory\n');
    } catch (error) {
      console.log('   ⚠️  Could not remove .prisma/client directory (may contain locked files)\n');
    }
  } catch (error) {
    console.log('   ⚠️  Error cleaning up:', error.message, '\n');
  }
} else {
  console.log('✅ No existing Prisma client directory found\n');
}

// Step 2: Check for running Node processes
console.log('🔍 Checking for running Node processes...');
try {
  if (process.platform === 'win32') {
    const result = execSync('tasklist /FI "IMAGENAME eq node.exe" /FO CSV', { 
      encoding: 'utf8', 
      stdio: 'pipe' 
    });
    const nodeProcesses = result.split('\n').filter(line => line.includes('node.exe')).length;
    
    if (nodeProcesses > 1) {
      console.log(`   ⚠️  Found ${nodeProcesses} Node.js processes running`);
      console.log('   These may be locking the Prisma query engine file\n');
      console.log('   💡 SOLUTION: Stop your dev server first!');
      console.log('      1. Find the terminal running "npm run dev"');
      console.log('      2. Press Ctrl+C to stop it');
      console.log('      3. Then run: npm run db:generate');
      console.log('      4. Restart dev server: npm run dev\n');
    } else {
      console.log('   ✅ No other Node.js processes found\n');
    }
  }
} catch (error) {
  // Ignore errors
}

// Step 3: Attempt generation
console.log('🚀 Attempting to generate Prisma client...\n');

try {
  execSync('npx prisma generate --schema=prisma/schema-streamlined.prisma', {
    stdio: 'inherit',
    cwd: path.join(__dirname, '..')
  });
  console.log('\n✅ Prisma client generated successfully!\n');
} catch (error) {
  console.error('\n❌ Generation still failed - file is locked\n');
  console.error('💡 MANUAL FIX REQUIRED:\n');
  console.error('   1. Stop ALL Node.js processes:');
  console.error('      - Close terminal running "npm run dev"');
  console.error('      - Close VS Code/Cursor if it has Node processes');
  console.error('      - Check Task Manager for any node.exe processes\n');
  console.error('   2. Delete the locked directory manually:');
  console.error('      - Navigate to: node_modules\\.prisma\\client');
  console.error('      - Delete the entire "client" folder');
  console.error('      - If Windows says it\'s in use, restart your computer\n');
  console.error('   3. Then run: npm run db:generate\n');
  console.error('   4. Alternative: Restart your computer and try again\n');
  process.exit(1);
}

