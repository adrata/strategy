#!/usr/bin/env node

/**
 * 🔧 TERMINAL ISSUES DIAGNOSTIC & FIX
 * 
 * This script diagnoses and fixes common terminal execution issues in VS Code/Cursor
 */

const { execSync, spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🔧 TERMINAL ISSUES DIAGNOSTIC & FIX');
console.log('===================================');

async function diagnoseTerminalIssues() {
  const issues = [];
  const fixes = [];

  try {
    // 1. Check Node.js version alignment
    console.log('\n📋 STEP 1: Checking Node.js version alignment...');
    const nvmrcVersion = fs.readFileSync('.nvmrc', 'utf8').trim();
    const currentNodeVersion = execSync('node --version', { encoding: 'utf8' }).trim();
    
    console.log(`  .nvmrc specifies: ${nvmrcVersion}`);
    console.log(`  Current Node.js: ${currentNodeVersion}`);
    
    if (!currentNodeVersion.includes(nvmrcVersion.replace('v', ''))) {
      issues.push(`Node.js version mismatch: .nvmrc wants ${nvmrcVersion}, but running ${currentNodeVersion}`);
      fixes.push(`Run: nvm use ${nvmrcVersion}`);
    } else {
      console.log('  ✅ Node.js version aligned');
    }

    // 2. Check npm version
    console.log('\n📋 STEP 2: Checking npm version...');
    const npmVersion = execSync('npm --version', { encoding: 'utf8' }).trim();
    console.log(`  npm version: ${npmVersion}`);
    
    if (parseInt(npmVersion.split('.')[0]) < 8) {
      issues.push(`npm version too old: ${npmVersion} (need >= 8.0.0)`);
      fixes.push('Run: npm install -g npm@latest');
    } else {
      console.log('  ✅ npm version compatible');
    }

    // 3. Check environment variables
    console.log('\n📋 STEP 3: Checking environment variables...');
    const envVars = [
      'NODE_ENV',
      'NODE_OPTIONS',
      'NEXT_PUBLIC_IS_DESKTOP',
      'TAURI_BUILD',
      'VERCEL'
    ];
    
    envVars.forEach(envVar => {
      const value = process.env[envVar];
      if (value) {
        console.log(`  ${envVar}: ${value}`);
        if (envVar === 'NODE_OPTIONS' && value.includes('--max-old-space-size=4096')) {
          issues.push('High memory allocation might cause terminal timeouts');
          fixes.push('Consider reducing NODE_OPTIONS memory allocation');
        }
      }
    });

    // 4. Check for conflicting scripts
    console.log('\n📋 STEP 4: Checking for conflicting scripts...');
    const scriptsDir = 'scripts';
    if (fs.existsSync(scriptsDir)) {
      const scriptFiles = fs.readdirSync(scriptsDir, { recursive: true })
        .filter(file => file.endsWith('.js'))
        .map(file => path.join(scriptsDir, file));
      
      const conflictingScripts = [
        'fix-webpack-runtime.js',
        'fix-webpack-runtime-comprehensive.js',
        'fix-chunks-comprehensive-2025.js',
        'tauri-production-fix.js'
      ];
      
      conflictingScripts.forEach(script => {
        if (scriptFiles.some(file => file.includes(script))) {
          issues.push(`Conflicting script found: ${script}`);
          fixes.push(`Consider removing: ${script} (use fix-tauri-paths.js instead)`);
        }
      });
    }

    // 5. Check package.json scripts
    console.log('\n📋 STEP 5: Checking package.json scripts...');
    const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'));
    const scripts = packageJson.scripts || {};
    
    Object.entries(scripts).forEach(([name, script]) => {
      if (script.includes('--max-old-space-size=4096')) {
        console.log(`  ⚠️  High memory script: ${name}`);
        issues.push(`High memory allocation in script: ${name}`);
      }
    });

    // 6. Check for running processes
    console.log('\n📋 STEP 6: Checking for running processes...');
    try {
      const runningProcesses = execSync('ps aux | grep -E "(node|npm|next)" | grep -v grep', { encoding: 'utf8' });
      if (runningProcesses.trim()) {
        console.log('  Running Node.js processes:');
        console.log(runningProcesses);
        issues.push('Multiple Node.js processes running (might cause conflicts)');
        fixes.push('Kill existing processes: pkill -f "node" && pkill -f "npm"');
      } else {
        console.log('  ✅ No conflicting Node.js processes');
      }
    } catch (error) {
      console.log('  ⚠️  Could not check running processes');
    }

    // 7. Check VS Code/Cursor terminal settings
    console.log('\n📋 STEP 7: Checking terminal configuration...');
    const vscodeSettings = path.join('.vscode', 'settings.json');
    if (fs.existsSync(vscodeSettings)) {
      const settings = JSON.parse(fs.readFileSync(vscodeSettings, 'utf8'));
      if (settings['terminal.integrated.shell.osx']) {
        console.log(`  Terminal shell: ${settings['terminal.integrated.shell.osx']}`);
      }
    }

    // 8. Test basic command execution
    console.log('\n📋 STEP 8: Testing basic command execution...');
    try {
      const testResult = execSync('echo "Terminal test successful"', { 
        encoding: 'utf8',
        timeout: 5000 
      });
      console.log(`  ✅ Basic command execution: ${testResult.trim()}`);
    } catch (error) {
      issues.push(`Basic command execution failed: ${error.message}`);
      fixes.push('Check terminal permissions and shell configuration');
    }

    // Generate report
    console.log('\n📊 DIAGNOSTIC REPORT');
    console.log('===================');
    
    if (issues.length === 0) {
      console.log('✅ No terminal issues detected!');
    } else {
      console.log(`❌ Found ${issues.length} issues:`);
      issues.forEach((issue, index) => {
        console.log(`  ${index + 1}. ${issue}`);
      });
      
      console.log('\n🔧 RECOMMENDED FIXES:');
      fixes.forEach((fix, index) => {
        console.log(`  ${index + 1}. ${fix}`);
      });
    }

    // Auto-fix suggestions
    if (issues.length > 0) {
      console.log('\n🚀 AUTO-FIX SUGGESTIONS:');
      console.log('========================');
      
      if (issues.some(issue => issue.includes('Node.js version mismatch'))) {
        console.log('1. Fix Node.js version:');
        console.log('   nvm use 18.20.4');
      }
      
      if (issues.some(issue => issue.includes('processes running'))) {
        console.log('2. Kill conflicting processes:');
        console.log('   pkill -f "node" && pkill -f "npm"');
      }
      
      if (issues.some(issue => issue.includes('memory allocation'))) {
        console.log('3. Reduce memory allocation:');
        console.log('   export NODE_OPTIONS="--max-old-space-size=2048"');
      }
      
      console.log('\n4. Restart VS Code/Cursor after applying fixes');
    }

  } catch (error) {
    console.error('❌ Diagnostic failed:', error.message);
  }
}

// Run the diagnostic
diagnoseTerminalIssues();
