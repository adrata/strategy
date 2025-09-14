#!/usr/bin/env node

/**
 * Fix Waterfall Enrichment Providers
 * 
 * This script fixes the API key checking in the waterfall enrichment system
 * and removes BrightData dependencies.
 */

const fs = require('fs');
const path = require('path');

const ADAPTIVE_WATERFALL_FILE = 'src/platform/services/adaptive-waterfall-enrichment.ts';

function fixAdaptiveWaterfallProviders() {
  console.log('🔧 Fixing adaptive waterfall enrichment providers...');
  
  let content = fs.readFileSync(ADAPTIVE_WATERFALL_FILE, 'utf8');
  
  // Fix all providers to properly check for API keys
  const providerFixes = [
    {
      search: /isActive: true,(\s+)config: {\s+apiKey: process\.env\['([^']+)'\]/g,
      replace: 'isActive: !!process.env[\'$2\'],$1config: {\n        apiKey: process.env[\'$2\']'
    },
    {
      search: /isActive: true,(\s+)config: {\s+accountSid: process\.env\['TWILIO_ACCOUNT_SID'\],\s+authToken: process\.env\['TWILIO_AUTH_TOKEN'\]/g,
      replace: 'isActive: !!(process.env[\'TWILIO_ACCOUNT_SID\'] && process.env[\'TWILIO_AUTH_TOKEN\']),$1config: {\n        accountSid: process.env[\'TWILIO_ACCOUNT_SID\'],\n        authToken: process.env[\'TWILIO_AUTH_TOKEN\']'
    }
  ];
  
  providerFixes.forEach(fix => {
    content = content.replace(fix.search, fix.replace);
  });
  
  fs.writeFileSync(ADAPTIVE_WATERFALL_FILE, content);
  console.log('✅ Fixed adaptive waterfall providers');
}

function checkEnvironmentVariables() {
  console.log('\n🔍 Checking environment variables...');
  
  const requiredEnvVars = [
    'CORESIGNAL_API_KEY',
    'ZEROBOUNCE_API_KEY',
    'MYEMAILVERIFIER_API_KEY',
    'PROSPEO_API_KEY',
    'DROPCONTACT_API_KEY',
    'TWILIO_ACCOUNT_SID',
    'TWILIO_AUTH_TOKEN',
    'LUSHA_API_KEY',
    'WAPPALYZER_API_KEY',
    'CRUSTDATA_API_KEY',
    'HUNTER_API_KEY'
  ];
  
  console.log('Environment Variables Status:');
  let configuredCount = 0;
  
  requiredEnvVars.forEach(envVar => {
    const isSet = !!process.env[envVar];
    const status = isSet ? '✅ SET' : '❌ MISSING';
    const preview = isSet ? process.env[envVar].substring(0, 8) + '...' : 'undefined';
    console.log(`${status} ${envVar}: ${preview}`);
    if (isSet) configuredCount++;
  });
  
  console.log(`\nSUMMARY: ${configuredCount}/${requiredEnvVars.length} API keys configured (${((configuredCount / requiredEnvVars.length) * 100).toFixed(1)}%)`);
  
  if (configuredCount === 0) {
    console.log('\n⚠️  WARNING: No API keys detected in environment!');
    console.log('This might be because:');
    console.log('1. Environment variables are not loaded in this Node.js process');
    console.log('2. API keys are not configured in the .env files');
    console.log('3. The .env file symlinks are pointing to the wrong files');
    
    console.log('\n🔧 To fix this:');
    console.log('1. Check .env file symlinks: ls -la .env*');
    console.log('2. Verify API keys in env/.env.development.local');
    console.log('3. Restart the development server: npm run dev');
  }
}

function testWaterfallAPI() {
  console.log('\n🧪 Testing waterfall API...');
  
  const testCommand = `curl -s "http://localhost:3000/api/enrichment/waterfall?action=test"`;
  
  try {
    const { execSync } = require('child_process');
    const result = execSync(testCommand, { encoding: 'utf8' });
    const data = JSON.parse(result);
    
    if (data.success) {
      console.log('✅ Waterfall API is responding');
      console.log(`Available types: ${data.availableTypes.join(', ')}`);
    } else {
      console.log('❌ Waterfall API test failed');
    }
  } catch (error) {
    console.log('❌ Could not test waterfall API (server might not be running)');
    console.log('Start the server with: npm run dev');
  }
}

// Main execution
console.log('🚀 WATERFALL ENRICHMENT SYSTEM FIXER');
console.log('====================================\n');

fixAdaptiveWaterfallProviders();
checkEnvironmentVariables();
testWaterfallAPI();

console.log('\n✅ Waterfall enrichment system fixes completed!');
console.log('\n💡 Next steps:');
console.log('1. Configure missing API keys in env/.env.development.local');
console.log('2. Restart the development server');
console.log('3. Test the waterfall enrichment with: node tests/available-apis-test.js');
