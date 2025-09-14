#!/usr/bin/env node

/**
 * Security Check Script for Adrata
 * Runs comprehensive security audits and checks
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🔒 Starting Adrata Security Check...\n');

// 1. NPM Audit
console.log('📦 Running npm audit...');
try {
  const auditResult = execSync('npm audit --json', { encoding: 'utf8' });
  const audit = JSON.parse(auditResult);
  
  if (audit.metadata.vulnerabilities.total === 0) {
    console.log('✅ No vulnerabilities found in npm packages');
  } else {
    console.log(`⚠️  Found ${audit.metadata.vulnerabilities.total} vulnerabilities:`);
    console.log(`   - High: ${audit.metadata.vulnerabilities.high}`);
    console.log(`   - Moderate: ${audit.metadata.vulnerabilities.moderate}`);
    console.log(`   - Low: ${audit.metadata.vulnerabilities.low}`);
    
    if (audit.metadata.vulnerabilities.high > 0 || audit.metadata.vulnerabilities.critical > 0) {
      console.log('❌ Critical/High vulnerabilities found! Run: npm audit fix');
      process.exit(1);
    }
  }
} catch (error) {
  console.log('⚠️  npm audit found issues - check manually');
}

// 2. Check for sensitive files
console.log('\n🔍 Checking for sensitive files...');
const sensitivePatterns = [
  '.env',
  '*.key',
  '*.pem',
  '*secret*',
  '*password*',
  'credentials.json'
];

const sensitiveFiles = [];
function checkDirectory(dir) {
  const files = fs.readdirSync(dir);
  files.forEach(file => {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);
    
    if (stat.isDirectory() && !file.startsWith('.') && file !== 'node_modules') {
      checkDirectory(filePath);
    } else {
      sensitivePatterns.forEach(pattern => {
        if (file.match(pattern.replace('*', '.*'))) {
          sensitiveFiles.push(filePath);
        }
      });
    }
  });
}

try {
  checkDirectory('.');
  if (sensitiveFiles.length === 0) {
    console.log('✅ No sensitive files found in repository');
  } else {
    console.log('⚠️  Sensitive files detected:');
    sensitiveFiles.forEach(file => console.log(`   - ${file}`));
  }
} catch (error) {
  console.log('⚠️  Could not check for sensitive files');
}

// 3. Check package.json for security best practices
console.log('\n📋 Checking package.json security...');
const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'));

// Check for overrides (good for security)
if (packageJson.overrides) {
  console.log('✅ Package overrides configured for security');
} else {
  console.log('ℹ️  Consider adding package overrides for vulnerable dependencies');
}

// Check for engines specification
if (packageJson.engines) {
  console.log('✅ Node.js version constraints specified');
} else {
  console.log('⚠️  No Node.js version constraints - consider adding engines field');
}

console.log('\n🔒 Security check completed!');
console.log('\n📊 Security Summary:');
console.log('- NPM vulnerabilities: Checked');
console.log('- Sensitive files: Scanned');
console.log('- Package configuration: Reviewed');
console.log('\n💡 Run this script regularly: node scripts/security-check.js');
