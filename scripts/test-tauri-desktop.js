#!/usr/bin/env node

/**
 * Tauri Desktop Application Test Script
 * 
 * This script validates that the Tauri desktop build is working correctly
 * by testing various components and features.
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

// Colors for console output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function checkPrerequisites() {
  log('\n🔍 Checking Prerequisites...', 'cyan');
  
  const checks = [
    { name: 'Node.js', command: 'node --version' },
    { name: 'npm', command: 'npm --version' },
    { name: 'Rust', command: 'cargo --version' },
    { name: 'Tauri CLI', command: 'cargo tauri --version' }
  ];
  
  const results = [];
  
  for (const check of checks) {
    try {
      const output = execSync(check.command, { encoding: 'utf8' }).trim();
      log(`✅ ${check.name}: ${output}`, 'green');
      results.push({ name: check.name, status: 'pass', output });
    } catch (error) {
      log(`❌ ${check.name}: Not found`, 'red');
      results.push({ name: check.name, status: 'fail', error: error.message });
    }
  }
  
  return results;
}

function checkFileStructure() {
  log('\n📁 Checking File Structure...', 'cyan');
  
  const requiredFiles = [
    'src-desktop/tauri.conf.json',
    'src-desktop/Cargo.toml',
    'src-desktop/src/main.rs',
    'src-desktop/src/lib.rs',
    'src-desktop/src/config.rs',
    'src-desktop/src/database/models.rs',
    'src-desktop/src/database/mod.rs',
    'src-desktop/src/database/auth.rs',
    'src-desktop/src/database/crm.rs',
    'src-desktop/src/database/speedrun.rs',
    'package.json',
    'next.config.mjs',
    'prisma/schema-streamlined.prisma'
  ];
  
  const results = [];
  
  for (const file of requiredFiles) {
    if (fs.existsSync(file)) {
      log(`✅ ${file}`, 'green');
      results.push({ file, status: 'exists' });
    } else {
      log(`❌ ${file}`, 'red');
      results.push({ file, status: 'missing' });
    }
  }
  
  return results;
}

function checkEnvironmentVariables() {
  log('\n🌍 Checking Environment Variables...', 'cyan');
  
  const envVars = [
    'DATABASE_URL',
    'DEFAULT_WORKSPACE_ID',
    'DEFAULT_USER_ID'
  ];
  
  const results = [];
  
  for (const envVar of envVars) {
    if (process.env[envVar]) {
      log(`✅ ${envVar}: Set`, 'green');
      results.push({ variable: envVar, status: 'set' });
    } else {
      log(`⚠️  ${envVar}: Not set (may be optional)`, 'yellow');
      results.push({ variable: envVar, status: 'not_set' });
    }
  }
  
  return results;
}

function checkRustSyntax() {
  log('\n🦀 Checking Rust Syntax...', 'cyan');
  
  try {
    // Try to check Rust syntax without full compilation
    execSync('cargo check --manifest-path src-desktop/Cargo.toml', { 
      encoding: 'utf8',
      stdio: 'pipe'
    });
    log('✅ Rust syntax check passed', 'green');
    return { status: 'pass' };
  } catch (error) {
    log('❌ Rust syntax check failed', 'red');
    log(`Error: ${error.message}`, 'red');
    return { status: 'fail', error: error.message };
  }
}

function checkNextJSBuild() {
  log('\n⚛️  Checking Next.js Build Configuration...', 'cyan');
  
  try {
    // Check if Next.js config is valid
    const nextConfigPath = 'next.config.mjs';
    if (fs.existsSync(nextConfigPath)) {
      const config = fs.readFileSync(nextConfigPath, 'utf8');
      
      // Check for key configurations
      const checks = [
        { name: 'Static Export Config', pattern: /output:\s*["']export["']/, found: config.includes('output: "export"') },
        { name: 'TypeScript Ignore', pattern: /ignoreBuildErrors:\s*true/, found: config.includes('ignoreBuildErrors: true') },
        { name: 'ESLint Ignore', pattern: /ignoreDuringBuilds:\s*true/, found: config.includes('ignoreDuringBuilds: true') }
      ];
      
      for (const check of checks) {
        if (check.found) {
          log(`✅ ${check.name}`, 'green');
        } else {
          log(`⚠️  ${check.name}: Not found`, 'yellow');
        }
      }
      
      return { status: 'pass' };
    } else {
      log('❌ next.config.mjs not found', 'red');
      return { status: 'fail' };
    }
  } catch (error) {
    log('❌ Next.js config check failed', 'red');
    return { status: 'fail', error: error.message };
  }
}

function checkTauriCommands() {
  log('\n🎯 Checking Tauri Commands...', 'cyan');
  
  try {
    const libRsPath = 'src-desktop/src/lib.rs';
    if (fs.existsSync(libRsPath)) {
      const content = fs.readFileSync(libRsPath, 'utf8');
      
      // Count Tauri commands
      const commandMatches = content.match(/#\[tauri::command\]/g);
      const commandCount = commandMatches ? commandMatches.length : 0;
      
      log(`✅ Found ${commandCount} Tauri commands`, 'green');
      
      // Check for key command categories
      const categories = [
        { name: 'Database Commands', pattern: /database::/ },
        { name: 'Auth Commands', pattern: /auth::/ },
        { name: 'CRM Commands', pattern: /crm::/ },
        { name: 'Speedrun Commands', pattern: /speedrun::/ }
      ];
      
      for (const category of categories) {
        if (category.pattern.test(content)) {
          log(`✅ ${category.name}`, 'green');
        } else {
          log(`⚠️  ${category.name}: Not found`, 'yellow');
        }
      }
      
      return { status: 'pass', commandCount };
    } else {
      log('❌ lib.rs not found', 'red');
      return { status: 'fail' };
    }
  } catch (error) {
    log('❌ Tauri commands check failed', 'red');
    return { status: 'fail', error: error.message };
  }
}

function generateTestReport(results) {
  log('\n📊 Test Report Summary', 'magenta');
  log('='.repeat(50), 'magenta');
  
  const totalTests = Object.keys(results).length;
  const passedTests = Object.values(results).filter(r => r.status === 'pass').length;
  const failedTests = totalTests - passedTests;
  
  log(`Total Tests: ${totalTests}`, 'bright');
  log(`Passed: ${passedTests}`, 'green');
  log(`Failed: ${failedTests}`, failedTests > 0 ? 'red' : 'green');
  
  if (failedTests === 0) {
    log('\n🎉 All tests passed! Tauri desktop build is ready.', 'green');
    log('\nNext steps:', 'cyan');
    log('1. Install Rust if not already installed', 'yellow');
    log('2. Run: npm run desktop:dev', 'yellow');
    log('3. Test the desktop application', 'yellow');
  } else {
    log('\n⚠️  Some tests failed. Please address the issues above.', 'yellow');
  }
  
  return { totalTests, passedTests, failedTests };
}

function main() {
  log('🚀 Tauri Desktop Build Validation Script', 'bright');
  log('==========================================', 'bright');
  
  const results = {};
  
  // Run all checks
  results.prerequisites = checkPrerequisites();
  results.fileStructure = checkFileStructure();
  results.environmentVariables = checkEnvironmentVariables();
  results.rustSyntax = checkRustSyntax();
  results.nextJSBuild = checkNextJSBuild();
  results.tauriCommands = checkTauriCommands();
  
  // Generate report
  const report = generateTestReport(results);
  
  // Exit with appropriate code
  process.exit(report.failedTests > 0 ? 1 : 0);
}

// Run the script
if (require.main === module) {
  main();
}

module.exports = {
  checkPrerequisites,
  checkFileStructure,
  checkEnvironmentVariables,
  checkRustSyntax,
  checkNextJSBuild,
  checkTauriCommands,
  generateTestReport
};
