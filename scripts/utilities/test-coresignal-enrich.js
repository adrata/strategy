#!/usr/bin/env node

/**
 * 🔍 TEST CORESIGNAL ENRICH API
 * 
 * Use the enrich endpoint to find company IDs by website URL
 */

const CORESIGNAL_API_KEY = 'hzwQmb13cF21if4arzLpx0SRWyoOUyzP';

async function testEnrichAPI() {
  console.log('🔍 TESTING CORESIGNAL ENRICH API');
  console.log('================================\n');
  
  // Test with our title agencies
  const testCompanies = [
    { name: 'ClearEdge Title', website: 'cetitle.com' },
    { name: 'Magnus Title Agency', website: 'magnustitle.com' },
    { name: 'Great American Title Agency', website: 'azgat.com' }
  ];
  
  for (const company of testCompanies) {
    console.log(`📊 ${company.name} (${company.website}):`);
    
    try {
      // Use the enrich endpoint with website
      const response = await fetch(`https://api.coresignal.com/cdapi/v2/company_clean/enrich?website=${company.website}`, {
        method: 'GET',
        headers: {
          'apikey': CORESIGNAL_API_KEY,
          'accept': 'application/json'
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        
        if (data.id) {
          console.log(`  ✅ Found company ID: ${data.id}`);
          console.log(`  📊 Name: ${data.name || 'Unknown'}`);
          console.log(`  📊 Employees: ${data.employees_count || 'Unknown'}`);
          console.log(`  📊 Industry: ${data.industry || 'Unknown'}`);
          console.log(`  📊 Type: ${data.type || 'Unknown'}`);
          console.log(`  📊 Founded: ${data.founded_year || 'Unknown'}`);
          
          // Check if they have key executives data
          if (data.key_executives && data.key_executives.length > 0) {
            console.log(`  👥 Key Executives Found: ${data.key_executives.length}`);
            data.key_executives.forEach(exec => {
              console.log(`    • ${exec.member_full_name} - ${exec.member_position_title}`);
            });
          } else {
            console.log(`  ⚠️ No key executives in company data`);
          }
          
        } else {
          console.log(`  ❌ No company data returned`);
        }
      } else {
        console.log(`  ⚠️ Enrich error: ${response.status}`);
        const errorText = await response.text();
        console.log(`  Error: ${errorText.substring(0, 200)}`);
      }
      
    } catch (error) {
      console.log(`  ❌ Error: ${error.message}`);
    }
    
    console.log(''); // Empty line
    
    // Rate limiting
    await new Promise(resolve => setTimeout(resolve, 1000));
  }
  
  console.log('✅ Coresignal enrich API test complete!');
}

testEnrichAPI();
