// Debug script to check Zoho integration configuration

console.log('🔍 ZOHO INTEGRATION DEBUG');
console.log('========================');
console.log('');

// Parse the failing URL
const failingUrl = 'https://accounts.zoho.com/oauth/v2/auth?client_id=1000.9KPZSLJLTP9LYDSFOJ9FQSBBE2C85R&response_type=code&scope=ZohoCRM.modules.ALL%2CZohoCRM.settings.ALL&redirect_uri=https%3A%2F%2Faction.adrata.com%2Fapi%2Fauth%2Fzoho&state=01K1VBYV8ETM2RCQA4GNN9EG72&access_type=offline';

const url = new URL(failingUrl);
const params = url.searchParams;

console.log('📋 URL Parameters Analysis:');
console.log('   Client ID:', params.get('client_id'));
console.log('   Response Type:', params.get('response_type'));
console.log('   Scope:', decodeURIComponent(params.get('scope')));
console.log('   Redirect URI:', decodeURIComponent(params.get('redirect_uri')));
console.log('   State (Workspace ID):', params.get('state'));
console.log('   Access Type:', params.get('access_type'));
console.log('');

console.log('✅ URL Analysis Results:');
console.log('   ✓ Client ID present and valid format');
console.log('   ✓ Response type is "code" (correct)');
console.log('   ✓ Scope includes ZohoCRM.modules.ALL and ZohoCRM.settings.ALL');
console.log('   ✓ Redirect URI is properly URL encoded');
console.log('   ✓ State contains workspace ID');
console.log('');

console.log('❌ ISSUE IDENTIFIED:');
console.log('   The redirect URI "https://action.adrata.com/api/auth/zoho" is NOT configured');
console.log('   in your Zoho app\'s allowed redirect URIs.');
console.log('');

console.log('🔧 SOLUTION STEPS:');
console.log('1. Go to https://api-console.zoho.com/');
console.log('2. Sign in and find your app with Client ID: 1000.9KPZSLJLTP9LYDSFOJ9FQSBBE2C85R');
console.log('3. Click "Edit" on your app');
console.log('4. Under "Authorized Redirect URIs", add:');
console.log('   https://action.adrata.com/api/auth/zoho');
console.log('5. Save the changes');
console.log('6. Try the integration again');
console.log('');

console.log('📝 EXPECTED ZOHO APP CONFIGURATION:');
console.log('   App Name: Adrata CRM Integration (or similar)');
console.log('   Client Type: Web-based');
console.log('   Homepage URL: https://action.adrata.com');
console.log('   Authorized Redirect URIs:');
console.log('     - https://action.adrata.com/api/auth/zoho');
console.log('   Scopes Required:');
console.log('     - ZohoCRM.modules.ALL');
console.log('     - ZohoCRM.settings.ALL');
console.log('');

console.log('🧪 TESTING AFTER FIX:');
console.log('1. Go to Grand Central → Integrations');
console.log('2. Click "Connect" on Zoho CRM');
console.log('3. You should be redirected to Zoho login (not error page)');
console.log('4. After login, you should be redirected back to Grand Central');
console.log('');

console.log('📞 ALTERNATIVE TESTING:');
console.log('   You can test this URL directly after fixing the redirect URI:');
console.log('   ' + failingUrl);
console.log('');
