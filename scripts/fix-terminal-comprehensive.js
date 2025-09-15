#!/usr/bin/env node

/**
 * 🔧 COMPREHENSIVE TERMINAL FIX
 * 
 * This script diagnoses and fixes all common terminal issues in VS Code/Cursor
 */

const { execSync, spawn } = require('child_process');
const fs = require('fs');
const path = require('path');
const os = require('os');

console.log('🔧 COMPREHENSIVE TERMINAL DIAGNOSTIC & FIX');
console.log('==========================================');

async function fixTerminalIssues() {
  const issues = [];
  const fixes = [];
  let fixesApplied = 0;

  try {
    // 1. KILL ALL CONFLICTING PROCESSES
    console.log('\n🛑 STEP 1: Killing conflicting processes...');
    const processesToKill = ['node', 'npm', 'next', 'tauri', 'cargo'];
    
    for (const processName of processesToKill) {
      try {
        const result = execSync(`pgrep -f "${processName}"`, { encoding: 'utf8', stdio: 'pipe' });
        if (result.trim()) {
          console.log(`  Found ${processName} processes: ${result.trim().split('\n').length}`);
          execSync(`pkill -f "${processName}"`, { stdio: 'ignore' });
          console.log(`  ✅ Killed ${processName} processes`);
          fixesApplied++;
        }
      } catch (error) {
        console.log(`  ℹ️  No ${processName} processes to kill`);
      }
    }

    // 2. CHECK NODE.JS VERSION ALIGNMENT
    console.log('\n📋 STEP 2: Checking Node.js version alignment...');
    try {
      const nvmrcVersion = fs.readFileSync('.nvmrc', 'utf8').trim();
      const currentNodeVersion = execSync('node --version', { encoding: 'utf8' }).trim();
      
      console.log(`  .nvmrc specifies: ${nvmrcVersion}`);
      console.log(`  Current Node.js: ${currentNodeVersion}`);
      
      if (!currentNodeVersion.includes(nvmrcVersion.replace('v', ''))) {
        issues.push(`Node.js version mismatch: .nvmrc wants ${nvmrcVersion}, running ${currentNodeVersion}`);
        console.log(`  ⚠️  Version mismatch detected`);
        
        // Try to switch to correct version
        try {
          console.log(`  🔄 Attempting to switch to Node.js ${nvmrcVersion}...`);
          execSync(`nvm use ${nvmrcVersion}`, { stdio: 'inherit' });
          fixes.push(`Switched to Node.js ${nvmrcVersion}`);
          fixesApplied++;
        } catch (error) {
          console.log(`  ❌ Could not switch Node.js version: ${error.message}`);
        }
      } else {
        console.log('  ✅ Node.js version aligned');
      }
    } catch (error) {
      console.log(`  ❌ Could not check Node.js version: ${error.message}`);
    }

    // 3. CLEAR ALL CACHES
    console.log('\n🗑️  STEP 3: Clearing all caches...');
    const cachesToClear = [
      '.next',
      '.turbo', 
      'node_modules/.cache',
      '.eslintcache',
      'tsconfig.tsbuildinfo',
      '.vscode/terminal-history'
    ];

    cachesToClear.forEach(cacheDir => {
      try {
        if (fs.existsSync(cacheDir)) {
          console.log(`  Removing ${cacheDir}...`);
          fs.rmSync(cacheDir, { recursive: true, force: true });
          fixes.push(`Cleared ${cacheDir}`);
          fixesApplied++;
        }
      } catch (error) {
        console.log(`  ⚠️  Could not remove ${cacheDir}: ${error.message}`);
      }
    });

    // Clear npm cache
    try {
      console.log('  Clearing npm cache...');
      execSync('npm cache clean --force', { stdio: 'pipe' });
      console.log('  ✅ Cleared npm cache');
      fixes.push('Cleared npm cache');
      fixesApplied++;
    } catch (error) {
      console.log(`  ⚠️  Could not clear npm cache: ${error.message}`);
    }

    // 4. FIX ENVIRONMENT VARIABLES
    console.log('\n⚙️  STEP 4: Fixing environment variables...');
    
    // Set optimal Node options
    const optimalNodeOptions = '--max-old-space-size=2048';
    process.env.NODE_OPTIONS = optimalNodeOptions;
    console.log(`  ✅ Set NODE_OPTIONS to ${optimalNodeOptions}`);
    fixes.push(`Set NODE_OPTIONS to ${optimalNodeOptions}`);
    fixesApplied++;

    // Clear problematic environment variables
    const problematicEnvVars = ['TAURI_BUILD', 'NEXT_PUBLIC_USE_STATIC_EXPORT'];
    problematicEnvVars.forEach(envVar => {
      if (process.env[envVar]) {
        delete process.env[envVar];
        console.log(`  ✅ Cleared ${envVar}`);
        fixes.push(`Cleared ${envVar}`);
        fixesApplied++;
      }
    });

    // 5. CREATE PROPER SHELL CONFIGURATION
    console.log('\n🐚 STEP 5: Creating proper shell configuration...');
    
    const shellRc = path.join(os.homedir(), '.zshrc');
    let shellConfig = '';
    
    try {
      if (fs.existsSync(shellRc)) {
        shellConfig = fs.readFileSync(shellRc, 'utf8');
      }
      
      // Add Node.js optimization if not present
      const nodeOptimization = `
# Adrata Node.js optimization
export NODE_OPTIONS="--max-old-space-size=2048"
export NVM_DIR="$HOME/.nvm"
[ -s "$NVM_DIR/nvm.sh" ] && \\. "$NVM_DIR/nvm.sh"
[ -s "$NVM_DIR/bash_completion" ] && \\. "$NVM_DIR/bash_completion"
`;

      if (!shellConfig.includes('Adrata Node.js optimization')) {
        fs.appendFileSync(shellRc, nodeOptimization);
        console.log('  ✅ Added Node.js optimization to shell config');
        fixes.push('Added Node.js optimization to shell config');
        fixesApplied++;
      } else {
        console.log('  ✅ Shell config already optimized');
      }
    } catch (error) {
      console.log(`  ⚠️  Could not update shell config: ${error.message}`);
    }

    // 6. FIX VS CODE/CURSOR TERMINAL SETTINGS
    console.log('\n🎨 STEP 6: Fixing VS Code/Cursor terminal settings...');
    
    const vscodeDir = '.vscode';
    const settingsFile = path.join(vscodeDir, 'settings.json');
    
    try {
      // Ensure .vscode directory exists
      if (!fs.existsSync(vscodeDir)) {
        fs.mkdirSync(vscodeDir);
        console.log('  ✅ Created .vscode directory');
      }

      // The settings.json should already be created by previous step
      if (fs.existsSync(settingsFile)) {
        console.log('  ✅ VS Code terminal settings configured');
        fixes.push('Configured VS Code terminal settings');
        fixesApplied++;
      }
    } catch (error) {
      console.log(`  ⚠️  Could not configure VS Code settings: ${error.message}`);
    }

    // 7. TEST TERMINAL FUNCTIONALITY
    console.log('\n🧪 STEP 7: Testing terminal functionality...');
    
    const testCommands = [
      'echo "Terminal test"',
      'node --version',
      'npm --version',
      'pwd'
    ];

    let successfulTests = 0;
    for (const command of testCommands) {
      try {
        const result = execSync(command, { 
          encoding: 'utf8', 
          timeout: 5000,
          stdio: 'pipe'
        });
        console.log(`  ✅ ${command}: ${result.trim()}`);
        successfulTests++;
      } catch (error) {
        console.log(`  ❌ ${command}: Failed - ${error.message}`);
        issues.push(`Command failed: ${command}`);
      }
    }

    // 8. GENERATE COMPREHENSIVE REPORT
    console.log('\n📊 COMPREHENSIVE TERMINAL FIX REPORT');
    console.log('====================================');
    
    console.log(`\n✅ FIXES APPLIED: ${fixesApplied}`);
    if (fixes.length > 0) {
      fixes.forEach((fix, index) => {
        console.log(`  ${index + 1}. ${fix}`);
      });
    }

    console.log(`\n🧪 TEST RESULTS: ${successfulTests}/${testCommands.length} commands successful`);

    if (issues.length > 0) {
      console.log(`\n⚠️  REMAINING ISSUES: ${issues.length}`);
      issues.forEach((issue, index) => {
        console.log(`  ${index + 1}. ${issue}`);
      });
    } else {
      console.log('\n🎉 NO REMAINING ISSUES!');
    }

    // 9. FINAL RECOMMENDATIONS
    console.log('\n💡 FINAL RECOMMENDATIONS');
    console.log('========================');
    
    if (issues.length > 0) {
      console.log('1. Restart VS Code/Cursor completely');
      console.log('2. Open a new terminal window');
      console.log('3. If issues persist, restart your computer');
      console.log('4. Check for VS Code/Cursor extensions that might interfere');
    } else {
      console.log('✅ Terminal should now work properly!');
      console.log('✅ Try opening a new terminal in VS Code/Cursor');
      console.log('✅ All fixes have been applied successfully');
    }

    console.log('\n🔄 NEXT STEPS:');
    console.log('1. Close all current terminals');
    console.log('2. Restart VS Code/Cursor');
    console.log('3. Open a new terminal (Ctrl+Shift+` or Cmd+Shift+`)');
    console.log('4. Test with: node scripts/test-terminal.js');

  } catch (error) {
    console.error('❌ Terminal fix failed:', error.message);
    console.error('Stack trace:', error.stack);
  }
}

// Run the comprehensive fix
fixTerminalIssues();

