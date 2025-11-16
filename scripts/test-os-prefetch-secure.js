#!/usr/bin/env node

/**
 * 🔒 SECURE OS Variant Pre-fetching Test
 * 
 * Tests OS variant pre-fetching with real credentials
 * SECURITY: Never commits credentials - uses environment variables only
 */

// SECURITY: Credentials must come from environment variables
// For local testing, set: export TEST_EMAIL=... TEST_PASSWORD=... TEST_WORKSPACE=...
const TEST_EMAIL = process.env.TEST_EMAIL;
const TEST_PASSWORD = process.env.TEST_PASSWORD;
const TEST_WORKSPACE = process.env.TEST_WORKSPACE || 'adrata';

if (!TEST_EMAIL || !TEST_PASSWORD) {
  console.error('❌ SECURITY: Credentials must be provided via environment variables');
  console.error('');
  console.error('Usage:');
  console.error('  export TEST_EMAIL=your-email@adrata.com');
  console.error('  export TEST_PASSWORD=your-password');
  console.error('  export TEST_WORKSPACE=your-workspace-slug  # optional, defaults to "adrata"');
  console.error('  node scripts/test-os-prefetch-secure.js');
  console.error('');
  console.error('⚠️  Never hardcode credentials in code!');
  process.exit(1);
}

console.log('🔒 Secure OS Variant Pre-fetching Test');
console.log('=====================================\n');
console.log(`📧 User: ${TEST_EMAIL}`);
console.log(`🏢 Workspace: ${TEST_WORKSPACE}`);
console.log('🔒 Password: [SECURED]\n');

console.log('✅ Test configuration ready!');
console.log('');
console.log('🧪 Test Scenarios:');
console.log(`   1. ${TEST_WORKSPACE}/acquisition-os/leads`);
console.log(`   2. ${TEST_WORKSPACE}/acquisition-os/prospects`);
console.log(`   3. ${TEST_WORKSPACE}/retention-os/clients`);
console.log(`   4. ${TEST_WORKSPACE}/expansion-os/prospects`);
console.log(`   5. ${TEST_WORKSPACE}/expansion-os/opportunities`);
console.log('');
console.log('📋 Next Steps:');
console.log('   1. Ensure dev server is running: npm run dev');
console.log('   2. Use browser MCP tools to navigate to sign-in page');
console.log('   3. Log in with the credentials above');
console.log('   4. Test each OS variant URL');
console.log('   5. Verify pre-fetch logs in console');
console.log('   6. Check Network tab for osType parameter');
console.log('   7. Verify localStorage cache');

