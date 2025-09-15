#!/usr/bin/env node

/**
 * 🚀 QUICK TERMINAL FIX
 * 
 * This script applies quick fixes for common terminal issues
 */

const { execSync } = require('child_process');
const fs = require('fs');

console.log('🚀 APPLYING QUICK TERMINAL FIXES');
console.log('=================================');

async function applyQuickFixes() {
  try {
    // 1. Kill any conflicting processes
    console.log('\n🛑 Step 1: Killing conflicting processes...');
    try {
      execSync('pkill -f "node"', { stdio: 'ignore' });
      execSync('pkill -f "npm"', { stdio: 'ignore' });
      execSync('pkill -f "next"', { stdio: 'ignore' });
      console.log('  ✅ Killed conflicting processes');
    } catch (error) {
      console.log('  ℹ️  No processes to kill');
    }

    // 2. Set proper Node.js version
    console.log('\n📋 Step 2: Setting Node.js version...');
    try {
      const nvmrcVersion = fs.readFileSync('.nvmrc', 'utf8').trim();
      execSync(`nvm use ${nvmrcVersion}`, { stdio: 'inherit' });
      console.log(`  ✅ Set Node.js to ${nvmrcVersion}`);
    } catch (error) {
      console.log('  ⚠️  Could not set Node.js version (nvm not available)');
    }

    // 3. Clear npm cache
    console.log('\n🗑️  Step 3: Clearing npm cache...');
    try {
      execSync('npm cache clean --force', { stdio: 'inherit' });
      console.log('  ✅ Cleared npm cache');
    } catch (error) {
      console.log('  ⚠️  Could not clear npm cache');
    }

    // 4. Set reduced memory allocation
    console.log('\n⚙️  Step 4: Setting reduced memory allocation...');
    process.env.NODE_OPTIONS = '--max-old-space-size=2048';
    console.log('  ✅ Set NODE_OPTIONS to --max-old-space-size=2048');

    // 5. Test terminal functionality
    console.log('\n🧪 Step 5: Testing terminal functionality...');
    try {
      const testResult = execSync('echo "Terminal test successful"', { 
        encoding: 'utf8',
        timeout: 5000 
      });
      console.log(`  ✅ Terminal test: ${testResult.trim()}`);
    } catch (error) {
      console.log(`  ❌ Terminal test failed: ${error.message}`);
    }

    // 6. Test Node.js and npm
    console.log('\n🔍 Step 6: Testing Node.js and npm...');
    try {
      const nodeVersion = execSync('node --version', { encoding: 'utf8' }).trim();
      const npmVersion = execSync('npm --version', { encoding: 'utf8' }).trim();
      console.log(`  ✅ Node.js: ${nodeVersion}`);
      console.log(`  ✅ npm: ${npmVersion}`);
    } catch (error) {
      console.log(`  ❌ Node.js/npm test failed: ${error.message}`);
    }

    console.log('\n✅ QUICK FIXES COMPLETED!');
    console.log('========================');
    console.log('If terminal is still not working:');
    console.log('1. Restart VS Code/Cursor completely');
    console.log('2. Try opening a new terminal window');
    console.log('3. Check VS Code/Cursor terminal settings');
    console.log('4. Run: node scripts/diagnose-terminal-issues.js');

  } catch (error) {
    console.error('❌ Quick fixes failed:', error.message);
  }
}

// Run the fixes
applyQuickFixes();
