#!/usr/bin/env node

/**
 * 🩺 TERMINAL HEALTH CHECK
 * 
 * Quick diagnostic to check terminal health and common issues
 */

const { execSync } = require('child_process');
const fs = require('fs');
const os = require('os');

console.log('🩺 TERMINAL HEALTH CHECK');
console.log('========================');

function checkTerminalHealth() {
  const healthReport = {
    overall: 'HEALTHY',
    issues: [],
    warnings: [],
    recommendations: []
  };

  try {
    // 1. Check Node.js
    console.log('\n🔍 Checking Node.js...');
    try {
      const nodeVersion = execSync('node --version', { encoding: 'utf8' }).trim();
      const nvmrcVersion = fs.readFileSync('.nvmrc', 'utf8').trim();
      
      console.log(`  Node.js version: ${nodeVersion}`);
      console.log(`  .nvmrc version: ${nvmrcVersion}`);
      
      if (!nodeVersion.includes(nvmrcVersion.replace('v', ''))) {
        healthReport.warnings.push(`Node.js version mismatch: ${nodeVersion} vs ${nvmrcVersion}`);
        healthReport.recommendations.push('Run: nvm use 18.20.4');
      } else {
        console.log('  ✅ Node.js version aligned');
      }
    } catch (error) {
      healthReport.issues.push('Cannot execute Node.js commands');
      healthReport.overall = 'UNHEALTHY';
    }

    // 2. Check npm
    console.log('\n🔍 Checking npm...');
    try {
      const npmVersion = execSync('npm --version', { encoding: 'utf8' }).trim();
      console.log(`  npm version: ${npmVersion}`);
      
      if (parseInt(npmVersion.split('.')[0]) < 8) {
        healthReport.warnings.push(`npm version too old: ${npmVersion}`);
        healthReport.recommendations.push('Update npm: npm install -g npm@latest');
      } else {
        console.log('  ✅ npm version compatible');
      }
    } catch (error) {
      healthReport.issues.push('Cannot execute npm commands');
      healthReport.overall = 'UNHEALTHY';
    }

    // 3. Check running processes
    console.log('\n🔍 Checking running processes...');
    try {
      const processes = execSync('ps aux | grep -E "(node|npm)" | grep -v grep', { encoding: 'utf8' });
      const processCount = processes.trim().split('\n').filter(line => line.trim()).length;
      
      console.log(`  Running Node.js/npm processes: ${processCount}`);
      
      if (processCount > 5) {
        healthReport.warnings.push(`Too many Node.js processes running: ${processCount}`);
        healthReport.recommendations.push('Kill excess processes: pkill -f node');
      } else {
        console.log('  ✅ Process count normal');
      }
    } catch (error) {
      console.log('  ℹ️  No Node.js processes running');
    }

    // 4. Check environment variables
    console.log('\n🔍 Checking environment variables...');
    const envVars = {
      'NODE_OPTIONS': process.env.NODE_OPTIONS,
      'NODE_ENV': process.env.NODE_ENV,
      'NVM_DIR': process.env.NVM_DIR,
      'SHELL': process.env.SHELL
    };

    Object.entries(envVars).forEach(([key, value]) => {
      if (value) {
        console.log(`  ${key}: ${value}`);
      } else {
        console.log(`  ${key}: Not set`);
      }
    });

    if (!process.env.NODE_OPTIONS) {
      healthReport.warnings.push('NODE_OPTIONS not set');
      healthReport.recommendations.push('Set NODE_OPTIONS="--max-old-space-size=2048"');
    }

    // 5. Check VS Code settings
    console.log('\n🔍 Checking VS Code settings...');
    const vscodeSettings = '.vscode/settings.json';
    
    if (fs.existsSync(vscodeSettings)) {
      console.log('  ✅ VS Code settings file exists');
      try {
        const settings = JSON.parse(fs.readFileSync(vscodeSettings, 'utf8'));
        if (settings['terminal.integrated.shell.osx']) {
          console.log(`  Terminal shell: ${settings['terminal.integrated.shell.osx']}`);
        }
      } catch (error) {
        healthReport.warnings.push('VS Code settings file is corrupted');
      }
    } else {
      healthReport.warnings.push('No VS Code settings file');
      healthReport.recommendations.push('Create VS Code terminal settings');
    }

    // 6. Check file system permissions
    console.log('\n🔍 Checking file system permissions...');
    try {
      const testFile = '.terminal-test';
      fs.writeFileSync(testFile, 'test');
      fs.unlinkSync(testFile);
      console.log('  ✅ File system permissions OK');
    } catch (error) {
      healthReport.issues.push('File system permission issues');
      healthReport.overall = 'UNHEALTHY';
    }

    // 7. Check shell configuration
    console.log('\n🔍 Checking shell configuration...');
    const shellRc = `${os.homedir()}/.zshrc`;
    
    if (fs.existsSync(shellRc)) {
      console.log('  ✅ Shell configuration file exists');
      const shellConfig = fs.readFileSync(shellRc, 'utf8');
      
      if (!shellConfig.includes('nvm')) {
        healthReport.warnings.push('nvm not configured in shell');
        healthReport.recommendations.push('Add nvm configuration to .zshrc');
      }
    } else {
      healthReport.warnings.push('No shell configuration file');
    }

    // Generate final report
    console.log('\n📊 HEALTH REPORT');
    console.log('================');
    
    console.log(`Overall Status: ${healthReport.overall}`);
    
    if (healthReport.issues.length > 0) {
      console.log(`\n❌ CRITICAL ISSUES (${healthReport.issues.length}):`);
      healthReport.issues.forEach((issue, index) => {
        console.log(`  ${index + 1}. ${issue}`);
      });
    }

    if (healthReport.warnings.length > 0) {
      console.log(`\n⚠️  WARNINGS (${healthReport.warnings.length}):`);
      healthReport.warnings.forEach((warning, index) => {
        console.log(`  ${index + 1}. ${warning}`);
      });
    }

    if (healthReport.recommendations.length > 0) {
      console.log(`\n💡 RECOMMENDATIONS (${healthReport.recommendations.length}):`);
      healthReport.recommendations.forEach((rec, index) => {
        console.log(`  ${index + 1}. ${rec}`);
      });
    }

    if (healthReport.overall === 'HEALTHY' && healthReport.warnings.length === 0) {
      console.log('\n🎉 TERMINAL IS HEALTHY!');
      console.log('All systems are functioning normally.');
    } else {
      console.log('\n🔧 RUN COMPREHENSIVE FIX:');
      console.log('node scripts/fix-terminal-comprehensive.js');
    }

  } catch (error) {
    console.error('❌ Health check failed:', error.message);
  }
}

// Run the health check
checkTerminalHealth();

