/**
 * 🔗 GENERATE ZOHO OAUTH URL
 * 
 * This script generates the proper Zoho OAuth URL with workspace context
 */

async function generateZohoOAuthURL() {
  console.log('🔗 [ZOHO OAUTH] Generating OAuth URL with workspace context...\n');

  const workspaceId = '01K1VBYV8ETM2RCQA4GNN9EG72'; // Dano's workspace
  
  try {
    // Call the API to get the proper OAuth URL
    const response = await fetch('https://action.adrata.com/api/auth/zoho', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        workspaceId: workspaceId,
        action: 'get_auth_url'
      })
    });

    if (response.ok) {
      const data = await response.json();
      console.log('✅ OAuth URL generated successfully:');
      console.log(`🔗 ${data.authUrl}`);
      console.log('\n📋 Instructions:');
      console.log('1. Copy the URL above');
      console.log('2. Paste it in your browser');
      console.log('3. Complete the Zoho authorization');
      console.log('4. You should be redirected back to Adrata Grand Central');
    } else {
      const errorData = await response.json();
      console.log('❌ Failed to generate OAuth URL');
      console.log(`📍 Status: ${response.status}`);
      console.log(`📍 Error: ${errorData.error || 'Unknown error'}`);
    }
  } catch (error) {
    console.error('❌ [ZOHO OAUTH] Error:', error.message);
  }
}

if (require.main === module) {
  generateZohoOAuthURL().catch(console.error);
}

module.exports = { generateZohoOAuthURL };
