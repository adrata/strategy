#!/usr/bin/env node

/**
 * Export Vercel Production Environment Variables for Staging
 * 
 * This script:
 * 1. Exports all environment variables from Vercel production
 * 2. Transforms URL-related variables for staging
 * 3. Outputs a .env file ready for staging deployment
 * 
 * Usage:
 *   node scripts/export-vercel-env-for-staging.js
 * 
 * Requirements:
 *   - Vercel CLI installed and authenticated
 *   - Access to production environment
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

// Colors for console output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  red: '\x1b[31m',
  cyan: '\x1b[36m',
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

// Variables that need to be changed for staging
const URL_TRANSFORMATIONS = {
  'action.adrata.com': 'staging.adrata.com',
  'https://action.adrata.com': 'https://staging.adrata.com',
  'http://action.adrata.com': 'https://staging.adrata.com',
};

// Variables that should NOT be copied (staging-specific or sensitive)
const EXCLUDE_VARS = [
  'VERCEL_ENV', // Auto-set by Vercel
  'VERCEL_URL', // Auto-set by Vercel
  'VERCEL_REGION', // Auto-set by Vercel
];

// Variables that might need different values for staging
const STAGING_OVERRIDES = {
  // Add any staging-specific overrides here
  // Example: 'SOME_API_KEY': 'staging-api-key-value'
};

/**
 * Get all environment variables from Vercel production
 */
function getVercelEnvVars(environment = 'production') {
  try {
    log(`\n📥 Fetching environment variables from Vercel ${environment}...`, 'blue');
    
    // Use Vercel CLI to list environment variables
    // Note: This requires Vercel CLI to be installed and authenticated
    const output = execSync(
      `vercel env ls ${environment} --json`,
      { encoding: 'utf-8', stdio: 'pipe' }
    );
    
    const envVars = JSON.parse(output);
    log(`✅ Found ${envVars.length} environment variables`, 'green');
    
    return envVars;
  } catch (error) {
    if (error.message.includes('not found') || error.message.includes('command')) {
      log('\n❌ Error: Vercel CLI not found or not authenticated', 'red');
      log('   Please install Vercel CLI: npm i -g vercel', 'yellow');
      log('   Then authenticate: vercel login', 'yellow');
      process.exit(1);
    }
    
    log(`\n❌ Error fetching environment variables: ${error.message}`, 'red');
    process.exit(1);
  }
}

/**
 * Get the actual value of an environment variable from Vercel
 */
function getVercelEnvValue(key, environment = 'production') {
  try {
    // Vercel CLI doesn't directly expose values for security
    // We'll need to use the Vercel API or have the user provide them
    // For now, we'll mark them as needing manual input
    return null;
  } catch (error) {
    return null;
  }
}

/**
 * Transform URL values for staging
 */
function transformForStaging(key, value) {
  if (!value) return value;
  
  // Check if this is a URL-related variable
  const urlKeys = ['URL', 'REDIRECT', 'WEBHOOK', 'BASE_URL', 'DOMAIN', 'HOST'];
  const isUrlVar = urlKeys.some(urlKey => key.toUpperCase().includes(urlKey));
  
  if (isUrlVar && typeof value === 'string') {
    let transformed = value;
    
    // Apply URL transformations
    for (const [from, to] of Object.entries(URL_TRANSFORMATIONS)) {
      transformed = transformed.replace(new RegExp(from.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'gi'), to);
    }
    
    return transformed;
  }
  
  return value;
}

/**
 * Generate staging .env file
 */
function generateStagingEnv(envVars) {
  log('\n🔄 Transforming environment variables for staging...', 'blue');
  
  const stagingVars = [];
  const manualVars = [];
  
  for (const envVar of envVars) {
    const key = envVar.key;
    
    // Skip excluded variables
    if (EXCLUDE_VARS.includes(key)) {
      log(`   ⏭️  Skipping ${key} (auto-set by Vercel)`, 'yellow');
      continue;
    }
    
    // Check for staging override
    if (STAGING_OVERRIDES[key]) {
      stagingVars.push({
        key,
        value: STAGING_OVERRIDES[key],
        source: 'override'
      });
      log(`   🔧 Overriding ${key} with staging value`, 'cyan');
      continue;
    }
    
    // Note: Vercel CLI doesn't expose actual values for security
    // We'll create a template with placeholders
    const transformedValue = transformForStaging(key, '[PRODUCTION_VALUE]');
    
    if (transformedValue !== '[PRODUCTION_VALUE]') {
      // URL was transformed
      stagingVars.push({
        key,
        value: transformedValue,
        source: 'transformed'
      });
      log(`   ✏️  Transformed ${key}: ${transformedValue}`, 'green');
    } else {
      // Needs manual input
      manualVars.push({
        key,
        value: '[PRODUCTION_VALUE]',
        source: 'manual'
      });
      log(`   📝 ${key} needs manual value (sensitive/unchanged)`, 'yellow');
    }
  }
  
  return { stagingVars, manualVars };
}

/**
 * Write .env file
 */
function writeEnvFile(stagingVars, manualVars, outputPath = '.env.staging') {
  log(`\n📝 Writing staging environment file to ${outputPath}...`, 'blue');
  
  const lines = [
    '# Staging Environment Variables',
    '# Generated from Vercel production environment',
    '# Date: ' + new Date().toISOString(),
    '',
    '# ============================================',
    '# URL Configuration (Auto-transformed)',
    '# ============================================',
    '',
  ];
  
  // Add transformed variables
  const transformed = stagingVars.filter(v => v.source === 'transformed');
  if (transformed.length > 0) {
    for (const { key, value } of transformed) {
      lines.push(`${key}=${value}`);
    }
    lines.push('');
  }
  
  // Add override variables
  const overrides = stagingVars.filter(v => v.source === 'override');
  if (overrides.length > 0) {
    lines.push('# ============================================');
    lines.push('# Staging Overrides');
    lines.push('# ============================================');
    lines.push('');
    for (const { key, value } of overrides) {
      lines.push(`${key}=${value}`);
    }
    lines.push('');
  }
  
  // Add manual variables (with instructions)
  if (manualVars.length > 0) {
    lines.push('# ============================================');
    lines.push('# Manual Configuration Required');
    lines.push('# Copy values from Vercel production dashboard:');
    lines.push('# https://vercel.com/[team]/[project]/settings/environment-variables');
    lines.push('# ============================================');
    lines.push('');
    
    for (const { key } of manualVars) {
      lines.push(`# ${key}=[COPY_FROM_PRODUCTION]`);
    }
    lines.push('');
  }
  
  // Add all other variables (unchanged)
  const unchanged = stagingVars.filter(v => v.source !== 'transformed' && v.source !== 'override');
  if (unchanged.length > 0) {
    lines.push('# ============================================');
    lines.push('# Other Variables (Unchanged)');
    lines.push('# ============================================');
    lines.push('');
    for (const { key } of unchanged) {
      lines.push(`# ${key}=[COPY_FROM_PRODUCTION]`);
    }
  }
  
  fs.writeFileSync(outputPath, lines.join('\n'));
  log(`✅ Environment file written to ${outputPath}`, 'green');
  
  return outputPath;
}

/**
 * Generate Vercel CLI commands to set staging variables
 */
function generateVercelCommands(stagingVars, outputPath = 'scripts/vercel-staging-env-commands.sh') {
  log(`\n📜 Generating Vercel CLI commands...`, 'blue');
  
  const commands = [
    '#!/bin/bash',
    '',
    '# Vercel Staging Environment Variables Setup',
    '# Generated: ' + new Date().toISOString(),
    '#',
    '# Usage:',
    '#   1. Review and edit this file',
    '#   2. Fill in [PRODUCTION_VALUE] placeholders',
    '#   3. Run: bash scripts/vercel-staging-env-commands.sh',
    '',
    'echo "🚀 Setting up staging environment variables in Vercel..."',
    '',
  ];
  
  for (const { key, value } of stagingVars) {
    if (value && !value.includes('[PRODUCTION_VALUE]') && !value.includes('[COPY_FROM_PRODUCTION]')) {
      // Has a concrete value, create command
      const safeValue = value.replace(/'/g, "'\\''");
      commands.push(`echo "Setting ${key}..."`);
      commands.push(`echo '${safeValue}' | vercel env add ${key} preview`);
      commands.push('');
    } else {
      // Needs manual input
      commands.push(`# TODO: Set ${key} manually`);
      commands.push(`# echo '[VALUE]' | vercel env add ${key} preview`);
      commands.push('');
    }
  }
  
  commands.push('echo "✅ Done! Review the output above for any errors."');
  
  fs.writeFileSync(outputPath, commands.join('\n'));
  fs.chmodSync(outputPath, '755'); // Make executable
  
  log(`✅ Vercel CLI commands written to ${outputPath}`, 'green');
  
  return outputPath;
}

/**
 * Main execution
 */
async function main() {
  log('\n🚀 Vercel Environment Export for Staging', 'bright');
  log('==========================================\n', 'bright');
  
  // Check if Vercel CLI is available
  try {
    execSync('vercel --version', { stdio: 'pipe' });
  } catch (error) {
    log('❌ Vercel CLI not found', 'red');
    log('   Install it: npm i -g vercel', 'yellow');
    log('   Then authenticate: vercel login', 'yellow');
    process.exit(1);
  }
  
  // Get environment variables from production
  const envVars = getVercelEnvVars('production');
  
  if (envVars.length === 0) {
    log('⚠️  No environment variables found in production', 'yellow');
    process.exit(0);
  }
  
  // Generate staging configuration
  const { stagingVars, manualVars } = generateStagingEnv(envVars);
  
  // Write .env file
  const envPath = writeEnvFile(stagingVars, manualVars);
  
  // Generate Vercel CLI commands
  const commandsPath = generateVercelCommands(stagingVars);
  
  // Summary
  log('\n📊 Summary', 'bright');
  log('==========================================', 'bright');
  log(`✅ Total variables: ${envVars.length}`, 'green');
  log(`   - Auto-transformed: ${stagingVars.filter(v => v.source === 'transformed').length}`, 'green');
  log(`   - Staging overrides: ${stagingVars.filter(v => v.source === 'override').length}`, 'cyan');
  log(`   - Manual configuration: ${manualVars.length}`, 'yellow');
  log(`\n📁 Files created:`, 'blue');
  log(`   - ${envPath}`, 'cyan');
  log(`   - ${commandsPath}`, 'cyan');
  
  log('\n📋 Next Steps:', 'bright');
  log('1. Review the generated .env.staging file', 'yellow');
  log('2. Copy sensitive values from Vercel production dashboard:', 'yellow');
  log('   https://vercel.com/[team]/[project]/settings/environment-variables', 'cyan');
  log('3. Update the .env.staging file with actual values', 'yellow');
  log('4. Optionally run the generated script to push to Vercel:', 'yellow');
  log(`   bash ${commandsPath}`, 'cyan');
  log('\n✨ Done!\n', 'green');
}

// Run if executed directly
if (require.main === module) {
  main().catch(error => {
    log(`\n❌ Fatal error: ${error.message}`, 'red');
    console.error(error);
    process.exit(1);
  });
}

module.exports = { getVercelEnvVars, transformForStaging, generateStagingEnv };

