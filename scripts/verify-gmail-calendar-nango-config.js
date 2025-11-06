#!/usr/bin/env node

/**
 * Verify Gmail and Google Calendar Nango Integration Configuration
 * 
 * This script helps verify that Gmail and Google Calendar integrations
 * are properly configured in Nango and environment variables.
 * 
 * Usage: node scripts/verify-gmail-calendar-nango-config.js
 */

const { Nango } = require('@nangohq/node');
require('dotenv').config({ path: '.env.local' });

// Color output helpers
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function logSection(title) {
  console.log('\n' + '='.repeat(60));
  log(title, 'cyan');
  console.log('='.repeat(60));
}

function logSuccess(message) {
  log(`✓ ${message}`, 'green');
}

function logError(message) {
  log(`✗ ${message}`, 'red');
}

function logWarning(message) {
  log(`⚠ ${message}`, 'yellow');
}

function logInfo(message) {
  log(`ℹ ${message}`, 'blue');
}

async function verifyEnvironmentVariables() {
  logSection('Environment Variables Verification');
  
  const requiredVars = {
    'NANGO_SECRET_KEY': process.env.NANGO_SECRET_KEY || process.env.NANGO_SECRET_KEY_DEV,
    'NANGO_GMAIL_INTEGRATION_ID': process.env.NANGO_GMAIL_INTEGRATION_ID,
    'NANGO_GOOGLE_CALENDAR_INTEGRATION_ID': process.env.NANGO_GOOGLE_CALENDAR_INTEGRATION_ID,
    'NANGO_HOST': process.env.NANGO_HOST || 'https://api.nango.dev',
  };
  
  const optionalVars = {
    'NANGO_OUTLOOK_INTEGRATION_ID': process.env.NANGO_OUTLOOK_INTEGRATION_ID,
  };
  
  let allPresent = true;
  
  // Check required variables
  for (const [key, value] of Object.entries(requiredVars)) {
    if (value) {
      if (key === 'NANGO_SECRET_KEY') {
        const prefix = value.substring(0, 12);
        logSuccess(`${key} is set (${prefix}...)`);
      } else {
        logSuccess(`${key} is set: ${value}`);
      }
    } else {
      logError(`${key} is NOT set`);
      allPresent = false;
    }
  }
  
  // Check optional variables
  for (const [key, value] of Object.entries(optionalVars)) {
    if (value) {
      logInfo(`${key} is set: ${value}`);
    } else {
      logWarning(`${key} is not set (optional, defaults to 'outlook')`);
    }
  }
  
  return { allPresent, requiredVars };
}

async function verifyNangoConnection(secretKey, host) {
  logSection('Nango Connection Verification');
  
  try {
    const nango = new Nango({
      secretKey,
      host
    });
    
    logInfo(`Connecting to Nango at: ${host}`);
    
    // Try to list providers to verify connection
    const providers = await nango.listProviders();
    
    logSuccess('Successfully connected to Nango API');
    logInfo(`Found ${providers.providers?.length || 0} integrations`);
    
    return { success: true, nango, providers };
  } catch (error) {
    logError(`Failed to connect to Nango: ${error.message}`);
    if (error.response) {
      logError(`Response status: ${error.response.status}`);
      logError(`Response data: ${JSON.stringify(error.response.data)}`);
    }
    return { success: false, error };
  }
}

async function verifyIntegrations(nango, providers, envVars) {
  logSection('Integration Verification');
  
  // IMPORTANT: Outlook is working in production - verify it first, then check Gmail/Calendar
  const integrationIds = {
    'outlook': envVars.NANGO_OUTLOOK_INTEGRATION_ID || 'outlook', // Outlook has default fallback
    'gmail': envVars.NANGO_GMAIL_INTEGRATION_ID || 'gmail',
    'google-calendar': envVars.NANGO_GOOGLE_CALENDAR_INTEGRATION_ID || 'google-calendar',
  };
  
  const availableIntegrations = providers.providers?.map(p => {
    return p.unique_key || p.provider || p.providerConfigKey || p.id || JSON.stringify(p);
  }) || [];
  
  logInfo(`Available integrations in Nango: ${availableIntegrations.length}`);
  if (availableIntegrations.length > 0) {
    logInfo(`Integration IDs: ${availableIntegrations.join(', ')}`);
  }
  
  const results = {};
  
  // Check each integration (Outlook first since it's working in production)
  const checkOrder = ['outlook', 'gmail', 'google-calendar']; // Outlook first for priority
  for (const name of checkOrder) {
    const integrationId = integrationIds[name];
    console.log(`\nChecking ${name} integration...`);
    logInfo(`Expected Integration ID: ${integrationId}`);
    
    // Special handling for Outlook - it's working, so warn if not found
    if (name === 'outlook') {
      logInfo('⚠️ Outlook is working in production - verifying it still exists...');
    }
    
    const exists = availableIntegrations.some(id => 
      id === integrationId || id?.toLowerCase() === integrationId.toLowerCase()
    );
    
    if (exists) {
      logSuccess(`${name} integration found: ${integrationId}`);
      
      // Try to get connection details
      try {
        const connections = await nango.listConnections(integrationId);
        logInfo(`Found ${connections.length} connections for ${name}`);
        if (connections.length > 0) {
          logInfo(`Connection IDs: ${connections.map(c => c.connection_id || c.id).join(', ')}`);
        }
      } catch (error) {
        logWarning(`Could not list connections for ${name}: ${error.message}`);
      }
      
      results[name] = { exists: true, integrationId };
    } else {
      if (name === 'outlook') {
        logError(`⚠️ CRITICAL: Outlook integration NOT found: ${integrationId}`);
        logError(`Outlook is working in production - this is a problem!`);
        logWarning(`Available integrations: ${availableIntegrations.join(', ')}`);
        logWarning(`Check Nango dashboard immediately - Outlook may be broken!`);
      } else {
        logError(`${name} integration NOT found: ${integrationId}`);
        logWarning(`Available integrations: ${availableIntegrations.join(', ')}`);
        logWarning(`Check Nango dashboard to verify Integration ID`);
      }
      results[name] = { exists: false, integrationId };
    }
  }
  
  return results;
}

async function verifyProviderMapping() {
  logSection('Provider Mapping Verification');
  
  const mappings = {
    'outlook': process.env.NANGO_OUTLOOK_INTEGRATION_ID || 'outlook',
    'gmail': process.env.NANGO_GMAIL_INTEGRATION_ID || 'gmail',
    'google-calendar': process.env.NANGO_GOOGLE_CALENDAR_INTEGRATION_ID || 'google-calendar',
  };
  
  logInfo('Current provider mappings:');
  for (const [provider, integrationId] of Object.entries(mappings)) {
    const envVar = `NANGO_${provider.toUpperCase().replace('-', '_')}_INTEGRATION_ID`;
    if (process.env[envVar]) {
      logSuccess(`${provider} → ${integrationId} (from ${envVar})`);
    } else {
      logWarning(`${provider} → ${integrationId} (default, ${envVar} not set)`);
    }
  }
  
  return mappings;
}

async function generateRecommendations(envVars, nangoResults, integrationResults) {
  logSection('Recommendations');
  
  const recommendations = [];
  
  // Check environment variables
  if (!envVars.NANGO_SECRET_KEY) {
    recommendations.push({
      priority: 'HIGH',
      issue: 'NANGO_SECRET_KEY is not set',
      fix: 'Set NANGO_SECRET_KEY in Vercel environment variables to match prod environment in Nango dashboard'
    });
  }
  
  if (!envVars.NANGO_GMAIL_INTEGRATION_ID) {
    recommendations.push({
      priority: 'MEDIUM',
      issue: 'NANGO_GMAIL_INTEGRATION_ID is not set',
      fix: 'Set NANGO_GMAIL_INTEGRATION_ID in Vercel to match Integration ID in Nango dashboard (likely "google-mail")'
    });
  }
  
  if (!envVars.NANGO_GOOGLE_CALENDAR_INTEGRATION_ID) {
    recommendations.push({
      priority: 'MEDIUM',
      issue: 'NANGO_GOOGLE_CALENDAR_INTEGRATION_ID is not set',
      fix: 'Set NANGO_GOOGLE_CALENDAR_INTEGRATION_ID in Vercel to match Integration ID in Nango dashboard (likely "google-calendar")'
    });
  }
  
  // Check integration existence
  if (integrationResults.gmail && !integrationResults.gmail.exists) {
    recommendations.push({
      priority: 'HIGH',
      issue: `Gmail integration "${integrationResults.gmail.integrationId}" not found in Nango`,
      fix: '1. Go to Nango dashboard → Integrations\n2. Verify Gmail integration exists\n3. Check Integration ID matches NANGO_GMAIL_INTEGRATION_ID\n4. Ensure integration is saved (not in draft state)'
    });
  }
  
  if (integrationResults['google-calendar'] && !integrationResults['google-calendar'].exists) {
    recommendations.push({
      priority: 'HIGH',
      issue: `Google Calendar integration "${integrationResults['google-calendar'].integrationId}" not found in Nango`,
      fix: '1. Go to Nango dashboard → Integrations\n2. Verify Google Calendar integration exists\n3. Check Integration ID matches NANGO_GOOGLE_CALENDAR_INTEGRATION_ID\n4. Ensure integration is saved (not in draft state)'
    });
  }
  
  // Check OAuth consent screen issue
  recommendations.push({
    priority: 'HIGH',
    issue: 'OAuth consent screen shows "Nango Developers Only - Not For Production"',
    fix: '1. Go to Google Cloud Console → OAuth consent screen\n2. Update "App name" to production name\n3. In Nango dashboard, verify Gmail/Calendar integrations use production OAuth Client ID (not test app)\n4. See docs/fix-gmail-google-calendar-oauth-consent-screen.md for detailed steps'
  });
  
  // Print recommendations
  if (recommendations.length === 0) {
    logSuccess('No issues found! Configuration looks good.');
  } else {
    recommendations.forEach((rec, index) => {
      console.log(`\n${index + 1}. [${rec.priority}] ${rec.issue}`);
      console.log(`   Fix: ${rec.fix}`);
    });
  }
  
  return recommendations;
}

async function main() {
  console.log('\n');
  log('Gmail and Google Calendar Nango Configuration Verification', 'cyan');
  log('='.repeat(60), 'cyan');
  
  // Step 1: Verify environment variables
  const { allPresent, requiredVars } = await verifyEnvironmentVariables();
  
  if (!allPresent) {
    logError('\nMissing required environment variables. Please set them in Vercel.');
    process.exit(1);
  }
  
  // Step 2: Verify Nango connection
  const secretKey = requiredVars.NANGO_SECRET_KEY;
  const host = requiredVars.NANGO_HOST;
  const nangoResult = await verifyNangoConnection(secretKey, host);
  
  if (!nangoResult.success) {
    logError('\nFailed to connect to Nango. Check NANGO_SECRET_KEY and NANGO_HOST.');
    process.exit(1);
  }
  
  // Step 3: Verify integrations
  const integrationResults = await verifyIntegrations(
    nangoResult.nango,
    nangoResult.providers,
    requiredVars
  );
  
  // Step 4: Verify provider mapping
  await verifyProviderMapping();
  
  // Step 5: Generate recommendations
  const recommendations = await generateRecommendations(
    requiredVars,
    nangoResult,
    integrationResults
  );
  
  // Summary
  logSection('Summary');
  
  const gmailOk = integrationResults.gmail?.exists;
  const calendarOk = integrationResults['google-calendar']?.exists;
  const outlookOk = integrationResults.outlook?.exists;
  
  if (gmailOk) {
    logSuccess('Gmail integration: Found');
  } else {
    logError('Gmail integration: NOT FOUND');
  }
  
  if (calendarOk) {
    logSuccess('Google Calendar integration: Found');
  } else {
    logError('Google Calendar integration: NOT FOUND');
  }
  
  if (outlookOk) {
    logSuccess('Outlook integration: Found (reference)');
  } else {
    logWarning('Outlook integration: NOT FOUND (may not be configured)');
  }
  
  console.log('\n');
  logInfo('For detailed fix instructions, see:');
  logInfo('  docs/fix-gmail-google-calendar-oauth-consent-screen.md');
  console.log('\n');
}

// Run the script
main().catch(error => {
  logError(`\nFatal error: ${error.message}`);
  console.error(error);
  process.exit(1);
});

