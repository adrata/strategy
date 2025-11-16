#!/usr/bin/env node

/**
 * 🔒 SECURE OS Variant Pre-fetching Test
 * 
 * Tests OS variant pre-fetching with real credentials
 * Uses environment variables for security - never hardcodes credentials
 */

const readline = require('readline');

// Get credentials from environment or prompt securely
async function getCredentials() {
  const email = process.env.TEST_EMAIL;
  const password = process.env.TEST_PASSWORD;
  const workspace = process.env.TEST_WORKSPACE;

  if (email && password && workspace) {
    console.log('✅ Using credentials from environment variables');
    return { email, password, workspace };
  }

  // If not in env, prompt securely (for local testing only)
  if (process.env.CI) {
    throw new Error('TEST_EMAIL, TEST_PASSWORD, and TEST_WORKSPACE must be set in CI');
  }

  console.log('⚠️  Credentials not found in environment variables');
  console.log('📝 For security, set these environment variables:');
  console.log('   export TEST_EMAIL=your-email@adrata.com');
  console.log('   export TEST_PASSWORD=your-password');
  console.log('   export TEST_WORKSPACE=your-workspace-slug');
  console.log('');
  console.log('🔒 Or run: npm run test:os-prefetch -- --email=... --password=... --workspace=...');
  
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });

  return new Promise((resolve) => {
    rl.question('Enter email: ', (email) => {
      rl.question('Enter password: ', (password) => {
        rl.question('Enter workspace slug: ', (workspace) => {
          rl.close();
          resolve({ email, password, workspace });
        });
      });
    });
  });
}

async function testOSVariantPrefetch() {
  console.log('🚀 Starting OS Variant Pre-fetching Test');
  console.log('==========================================\n');

  try {
    const { email, password, workspace } = await getCredentials();
    
    console.log(`📧 Testing with user: ${email}`);
    console.log(`🏢 Workspace: ${workspace}`);
    console.log('🔒 Password: [HIDDEN]\n');

    // Test URLs for each OS variant
    const testUrls = [
      `/${workspace}/acquisition-os/leads`,
      `/${workspace}/acquisition-os/prospects`,
      `/${workspace}/retention-os/clients`,
      `/${workspace}/expansion-os/prospects`,
      `/${workspace}/expansion-os/opportunities`,
    ];

    console.log('🧪 Test Scenarios:');
    testUrls.forEach((url, i) => {
      console.log(`   ${i + 1}. ${url}`);
    });
    console.log('');

    console.log('✅ Test script ready!');
    console.log('📋 Next steps:');
    console.log('   1. Start dev server: npm run dev');
    console.log('   2. Open browser to: http://localhost:3000/sign-in');
    console.log('   3. Log in with the credentials above');
    console.log('   4. Use browser MCP tools to test each OS variant URL');
    console.log('   5. Check browser console for pre-fetch logs');
    console.log('   6. Check Network tab for API calls with osType parameter');
    console.log('   7. Check localStorage for cached data');
    console.log('');
    console.log('🔍 What to verify:');
    console.log('   - Pre-fetch requests include X-Background-Prefetch header');
    console.log('   - API calls include osType parameter (acquisition/retention/expansion)');
    console.log('   - localStorage contains cached counts and section data');
    console.log('   - Console shows "[AUTH PREFETCH]" logs');
    console.log('   - Data loads instantly when navigating to pre-fetched sections');

  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

// Run test
testOSVariantPrefetch();

