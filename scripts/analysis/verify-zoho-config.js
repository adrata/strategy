/**
 * 🔍 VERIFY ZOHO CONFIGURATION
 * 
 * This script checks if all required Zoho environment variables are properly configured
 * and tests the OAuth flow setup.
 */

const requiredZohoVars = [
  'ZOHO_CLIENT_ID',
  'ZOHO_CLIENT_SECRET'
];

const optionalZohoVars = [
  'ZOHO_ACCESS_TOKEN',
  'ZOHO_REFRESH_TOKEN', 
  'ZOHO_ORG_ID'
];

async function verifyZohoConfig() {
  console.log('🔍 [ZOHO CONFIG] Verifying Zoho configuration...\n');

  // Check required environment variables
  console.log('📋 Required Environment Variables:');
  let missingRequired = [];
  
  for (const varName of requiredZohoVars) {
    const value = process.env[varName];
    if (value) {
      console.log(`✅ ${varName}: ${value.substring(0, 8)}...`);
    } else {
      console.log(`❌ ${varName}: MISSING`);
      missingRequired.push(varName);
    }
  }

  // Check optional environment variables
  console.log('\n📋 Optional Environment Variables:');
  for (const varName of optionalZohoVars) {
    const value = process.env[varName];
    if (value) {
      console.log(`✅ ${varName}: ${value.substring(0, 8)}...`);
    } else {
      console.log(`⚠️  ${varName}: Not set (optional)`);
    }
  }

  // Test OAuth URL generation
  console.log('\n🔗 Testing OAuth URL Generation:');
  
  if (process.env.ZOHO_CLIENT_ID) {
    const authUrl = new URL('https://accounts.zoho.com/oauth/v2/auth');
    authUrl.searchParams.set('scope', 'ZohoCRM.modules.ALL,ZohoCRM.settings.ALL');
    authUrl.searchParams.set('client_id', process.env.ZOHO_CLIENT_ID);
    authUrl.searchParams.set('response_type', 'code');
    authUrl.searchParams.set('access_type', 'offline');
    authUrl.searchParams.set('redirect_uri', 'https://action.adrata.com/api/auth/zoho');
    authUrl.searchParams.set('state', 'test-state');

    console.log('✅ OAuth URL:', authUrl.toString());
    console.log('\n🎯 Redirect URI configured:', 'https://action.adrata.com/api/auth/zoho');
  } else {
    console.log('❌ Cannot generate OAuth URL - ZOHO_CLIENT_ID missing');
  }

  // Summary
  console.log('\n📊 Configuration Summary:');
  if (missingRequired.length === 0) {
    console.log('✅ All required Zoho environment variables are configured!');
    console.log('\n🔧 Next Steps:');
    console.log('1. Ensure the redirect URI is configured in Zoho API Console');
    console.log('2. Test the OAuth flow by visiting: https://action.adrata.com/api/auth/zoho');
  } else {
    console.log(`❌ Missing required variables: ${missingRequired.join(', ')}`);
    console.log('\n🔧 Action Required:');
    console.log('1. Add missing environment variables to Vercel');
    console.log('2. Configure redirect URI in Zoho API Console');
    console.log('3. Redeploy the application');
  }
}

if (require.main === module) {
  verifyZohoConfig().catch(console.error);
}

module.exports = { verifyZohoConfig };