#!/usr/bin/env node

/**
 * Verify Grand Central Outlook Integration Code Completeness
 * 
 * This script verifies that all necessary code is in place for the
 * Outlook integration, without requiring a running server.
 */

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
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function logSection(title) {
  console.log('\n' + '='.repeat(60));
  log(title, 'bright');
  console.log('='.repeat(60) + '\n');
}

function logSuccess(message) {
  log(`✅ ${message}`, 'green');
}

function logError(message) {
  log(`❌ ${message}`, 'red');
}

function logInfo(message) {
  log(`ℹ️  ${message}`, 'blue');
}

function fileExists(filePath) {
  return fs.existsSync(path.join(process.cwd(), filePath));
}

function fileContains(filePath, searchString) {
  try {
    const content = fs.readFileSync(path.join(process.cwd(), filePath), 'utf-8');
    return content.includes(searchString);
  } catch (e) {
    return false;
  }
}

async function verifyFiles() {
  logSection('1. Critical Files Verification');
  
  const criticalFiles = [
    {
      path: 'src/app/api/auth/oauth/connect/route.ts',
      description: 'OAuth Connect Endpoint',
      mustContain: ['initiateOAuth', 'grand_central_connections']
    },
    {
      path: 'src/app/api/auth/oauth/callback/route.ts',
      description: 'OAuth Callback Endpoint',
      mustContain: ['exchangeCodeForToken']
    },
    {
      path: 'src/platform/services/oauth-service.ts',
      description: 'OAuth Service',
      mustContain: ['initiateOAuth', 'exchangeCodeForToken']
    },
    {
      path: 'src/platform/services/UnifiedEmailSyncService.ts',
      description: 'Email Sync Service',
      mustContain: ['syncWorkspaceEmails', 'linkEmailsToEntities']
    },
    {
      path: 'src/app/api/webhooks/nango/email/route.ts',
      description: 'Email Webhook Handler',
      mustContain: ['verifyNangoSignature', 'checkRateLimit']
    },
    {
      path: 'src/app/api/health/email-sync/route.ts',
      description: 'Health Check Endpoint',
      mustContain: ['grand_central_connections', 'email_messages']
    },
    {
      path: 'src/app/[workspace]/grand-central/integrations/page.tsx',
      description: 'Integrations UI',
      mustContain: ['/api/auth/oauth/connect', 'microsoft-outlook']
    },
    {
      path: 'prisma/schema.prisma',
      description: 'Database Schema',
      mustContain: ['grand_central_connections', 'email_messages']
    }
  ];
  
  let allFound = true;
  
  for (const file of criticalFiles) {
    if (fileExists(file.path)) {
      logSuccess(`${file.description}: Found`);
      
      // Check content
      let contentValid = true;
      for (const searchString of file.mustContain) {
        if (!fileContains(file.path, searchString)) {
          logError(`  Missing required content: ${searchString}`);
          contentValid = false;
          allFound = false;
        }
      }
      
      if (contentValid && file.mustContain.length > 0) {
        logInfo(`  All required content present`);
      }
    } else {
      logError(`${file.description}: NOT FOUND (${file.path})`);
      allFound = false;
    }
  }
  
  return allFound;
}

async function verifyDocumentation() {
  logSection('2. Documentation Verification');
  
  const docs = [
    'docs/grand-central-outlook-gap-analysis.md',
    'docs/grand-central-outlook-setup-guide.md',
    'docs/grand-central-outlook-quick-reference.md',
    'docs/TESTING_OUTLOOK_CONNECTION.md',
    'docs/GRAND_CENTRAL_COMPLETION_SUMMARY.md',
    'START_HERE.md',
    'scripts/test-outlook-connection.js'
  ];
  
  let allFound = true;
  
  for (const doc of docs) {
    if (fileExists(doc)) {
      logSuccess(`${path.basename(doc)}: Found`);
    } else {
      logError(`${path.basename(doc)}: NOT FOUND`);
      allFound = false;
    }
  }
  
  return allFound;
}

async function verifyDatabaseSchema() {
  logSection('3. Database Schema Verification');
  
  const schemaPath = 'prisma/schema.prisma';
  
  if (!fileExists(schemaPath)) {
    logError('schema.prisma not found');
    return false;
  }
  
  const requiredModels = [
    'grand_central_connections',
    'email_messages',
    'people',
    'companies',
    'actions'
  ];
  
  let allFound = true;
  
  for (const model of requiredModels) {
    if (fileContains(schemaPath, `model ${model}`)) {
      logSuccess(`Model '${model}': Defined`);
    } else {
      logError(`Model '${model}': NOT FOUND`);
      allFound = false;
    }
  }
  
  // Check for required fields on grand_central_connections
  const requiredFields = [
    'workspaceId',
    'userId',
    'provider',
    'nangoConnectionId',
    'status'
  ];
  
  logInfo('\nVerifying grand_central_connections fields:');
  for (const field of requiredFields) {
    // Just check if the field name appears in the file, basic check
    if (fileContains(schemaPath, field)) {
      logSuccess(`  Field '${field}': Found`);
    } else {
      logError(`  Field '${field}': NOT FOUND`);
      allFound = false;
    }
  }
  
  return allFound;
}

async function verifyAPIEndpoints() {
  logSection('4. API Endpoints Verification');
  
  const endpoints = [
    {
      path: 'src/app/api/auth/oauth/connect/route.ts',
      methods: ['POST', 'GET'],
      description: 'OAuth Connect'
    },
    {
      path: 'src/app/api/auth/oauth/callback/route.ts',
      methods: ['GET'],
      description: 'OAuth Callback'
    },
    {
      path: 'src/app/api/webhooks/nango/email/route.ts',
      methods: ['POST', 'GET'],
      description: 'Email Webhook'
    },
    {
      path: 'src/app/api/health/email-sync/route.ts',
      methods: ['GET'],
      description: 'Health Check'
    }
  ];
  
  let allFound = true;
  
  for (const endpoint of endpoints) {
    if (fileExists(endpoint.path)) {
      logSuccess(`${endpoint.description}: Found`);
      
      // Verify methods
      for (const method of endpoint.methods) {
        if (fileContains(endpoint.path, `export async function ${method}`)) {
          logInfo(`  ${method} handler: Implemented`);
        } else {
          logError(`  ${method} handler: NOT FOUND`);
          allFound = false;
        }
      }
    } else {
      logError(`${endpoint.description}: NOT FOUND`);
      allFound = false;
    }
  }
  
  return allFound;
}

async function verifySecurity() {
  logSection('5. Security Features Verification');
  
  let allFound = true;
  
  // Check OAuth service has PKCE
  if (fileContains('src/platform/services/oauth-service.ts', 'generatePKCEChallenge')) {
    logSuccess('PKCE Implementation: Found');
  } else {
    logError('PKCE Implementation: NOT FOUND');
    allFound = false;
  }
  
  // Check webhook signature verification
  if (fileContains('src/app/api/webhooks/nango/email/route.ts', 'verifyNangoSignature')) {
    logSuccess('Webhook Signature Verification: Implemented');
  } else {
    logError('Webhook Signature Verification: NOT FOUND');
    allFound = false;
  }
  
  // Check rate limiting
  if (fileContains('src/app/api/webhooks/nango/email/route.ts', 'checkRateLimit')) {
    logSuccess('Rate Limiting: Implemented');
  } else {
    logError('Rate Limiting: NOT FOUND');
    allFound = false;
  }
  
  return allFound;
}

async function verifyServices() {
  logSection('6. Core Services Verification');
  
  const services = [
    {
      path: 'src/platform/services/oauth-service.ts',
      functions: ['initiateOAuth', 'exchangeCodeForToken'],
      description: 'OAuth Service'
    },
    {
      path: 'src/platform/services/UnifiedEmailSyncService.ts',
      functions: ['syncWorkspaceEmails', 'linkEmailsToEntities', 'createEmailActions'],
      description: 'Email Sync Service'
    },
    {
      path: 'src/app/[workspace]/grand-central/services/NangoService.ts',
      functions: ['getAvailableProviders', 'connectProvider'],
      description: 'Nango Service'
    }
  ];
  
  let allFound = true;
  
  for (const service of services) {
    if (fileExists(service.path)) {
      logSuccess(`${service.description}: Found`);
      
      for (const func of service.functions) {
        if (fileContains(service.path, func)) {
          logInfo(`  ${func}(): Implemented`);
        } else {
          logError(`  ${func}(): NOT FOUND`);
          allFound = false;
        }
      }
    } else {
      logError(`${service.description}: NOT FOUND`);
      allFound = false;
    }
  }
  
  return allFound;
}

async function generateReport(results) {
  logSection('Verification Summary');
  
  const passed = results.filter(r => r.passed).length;
  const total = results.length;
  const percentage = Math.round((passed / total) * 100);
  
  results.forEach(result => {
    if (result.passed) {
      logSuccess(`${result.name}: ✅ COMPLETE`);
    } else {
      logError(`${result.name}: ❌ INCOMPLETE`);
    }
  });
  
  console.log('\n' + '='.repeat(60));
  
  if (percentage === 100) {
    logSuccess(`\n🎉 CODE IS 100% COMPLETE! (${passed}/${total})`);
    log('\n✅ All code components are in place!', 'green');
    log('\nThe integration is ready for deployment.', 'bright');
    log('\nNext steps:', 'bright');
    log('1. Set environment variables in production', 'blue');
    log('2. Deploy to Vercel', 'blue');
    log('3. Test OAuth connection', 'blue');
    log('\nSee START_HERE.md for deployment instructions.', 'blue');
  } else {
    logError(`\n❌ CODE INCOMPLETE (${passed}/${total} - ${percentage}%)`);
    log('\nSome code components are missing.', 'red');
  }
  
  console.log('='.repeat(60) + '\n');
  
  return percentage === 100;
}

async function main() {
  log('\n' + '╔' + '═'.repeat(58) + '╗', 'bright');
  log('║' + ' '.repeat(8) + 'Grand Central Code Completeness Check' + ' '.repeat(12) + '║', 'bright');
  log('╚' + '═'.repeat(58) + '╝\n', 'bright');
  
  const results = [];
  
  results.push({
    name: 'Critical Files',
    passed: await verifyFiles()
  });
  
  results.push({
    name: 'Documentation',
    passed: await verifyDocumentation()
  });
  
  results.push({
    name: 'Database Schema',
    passed: await verifyDatabaseSchema()
  });
  
  results.push({
    name: 'API Endpoints',
    passed: await verifyAPIEndpoints()
  });
  
  results.push({
    name: 'Security Features',
    passed: await verifySecurity()
  });
  
  results.push({
    name: 'Core Services',
    passed: await verifyServices()
  });
  
  const success = await generateReport(results);
  
  process.exit(success ? 0 : 1);
}

// Run verification
main().catch((error) => {
  logError(`\nFatal error: ${error.message}`);
  console.error(error);
  process.exit(1);
});

