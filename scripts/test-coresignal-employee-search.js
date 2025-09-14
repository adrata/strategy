#!/usr/bin/env node

/**
 * 🎯 CORESIGNAL EMPLOYEE SEARCH TEST
 * 
 * Tests CoreSignal employee search (the working approach from old system)
 */

const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));

// Load environment variables
require('dotenv').config({ path: '.env.local' });

const CORESIGNAL_API_KEY = process.env.CORESIGNAL_API_KEY?.replace(/\\n/g, '').trim();

async function testCoreSignalEmployeeSearch() {
  console.log('🎯 CORESIGNAL EMPLOYEE SEARCH TEST');
  console.log('=' .repeat(60));
  console.log('Using the proven working employee search approach');
  console.log('');

  const testCompanies = [
    'Stewart Title',
    'Stewart Information Services',
    'First American',
    'Microsoft'
  ];

  for (const company of testCompanies) {
    console.log(`🔍 Testing employee search for: ${company}`);
    console.log('─'.repeat(40));
    
    try {
      // Use exact working pattern from coresignal-smoke-test.js
      const esQuery = {
        query: {
          bool: {
            must: [
              {
                nested: {
                  path: 'experience',
                  query: {
                    bool: {
                      should: [
                        { match: { 'experience.company_name': company } },
                        { match_phrase: { 'experience.company_name': company } },
                      ],
                    },
                  },
                },
              },
            ],
          },
        },
      };

      console.log(`   Query: Searching for employees at "${company}"`);

      // Use exact URL pattern with items_per_page parameter
      const searchUrl = `https://api.coresignal.com/cdapi/v2/employee_multi_source/search/es_dsl?items_per_page=10`;
      
      const response = await fetch(searchUrl, {
        method: 'POST',
        headers: {
          'apikey': CORESIGNAL_API_KEY?.trim(),
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify(esQuery)
      });

      console.log(`   📊 Status: ${response.status}`);
      
      if (response.ok) {
        const ids = await response.json();
        
        if (Array.isArray(ids) && ids.length > 0) {
          console.log(`   ✅ Found ${ids.length} employee IDs`);
          
          // Test collecting first profile
          const firstId = ids[0];
          console.log(`   🔍 Collecting profile for ID: ${firstId}`);
          
          const collectResponse = await fetch(`https://api.coresignal.com/cdapi/v2/employee_multi_source/collect/${firstId}`, {
            headers: { 
              'apikey': CORESIGNAL_API_KEY?.trim(),
              'Accept': 'application/json'
            }
          });
          
          if (collectResponse.ok) {
            const profile = await collectResponse.json();
            
            console.log(`   🎉 SUCCESS! Employee profile collected:`);
            console.log(`      Name: ${profile.full_name || 'Not provided'}`);
            console.log(`      Title: ${profile.member_position_title || profile.current_position_title || 'Not provided'}`);
            console.log(`      Company: ${profile.current_company_name || 'Not provided'}`);
            console.log(`      Email: ${profile.primary_professional_email || 'Not found'}`);
            console.log(`      LinkedIn: ${profile.member_linkedin_url || profile.linkedin_url || 'Not found'}`);
            
            // Check if this is an executive
            const title = profile.member_position_title || profile.current_position_title || '';
            const isExecutive = title.toLowerCase().includes('chief') || 
                              title.toLowerCase().includes('president') || 
                              title.toLowerCase().includes('cfo') ||
                              title.toLowerCase().includes('ceo') ||
                              title.toLowerCase().includes('coo');
            
            if (isExecutive) {
              console.log(`      🌟 EXECUTIVE FOUND!`);
            }
            
            // This proves the approach works - break here
            console.log('');
            console.log('🎯 WORKING APPROACH CONFIRMED!');
            console.log(`   Company: "${company}"`);
            console.log(`   Employee search: ✅ Working`);
            console.log(`   Profile collection: ✅ Working`);
            console.log(`   Contact data: Email=${!!profile.primary_professional_email}, LinkedIn=${!!(profile.member_linkedin_url || profile.linkedin_url)}`);
            break;
            
          } else {
            console.log(`   ❌ Profile collection failed: ${collectResponse.status}`);
          }
          
        } else {
          console.log(`   ⚠️ No employee IDs returned (not an array or empty)`);
          console.log(`   Response type: ${typeof ids}`);
          console.log(`   Response: ${JSON.stringify(ids).substring(0, 200)}`);
        }
        
      } else {
        const errorText = await response.text();
        console.log(`   ❌ Search failed: ${response.status} - ${errorText}`);
      }
      
    } catch (error) {
      console.log(`   ❌ Error: ${error.message}`);
    }
    
    console.log('');
    await new Promise(resolve => setTimeout(resolve, 2000)); // 2 second delay
  }
}

// Run the test
if (require.main === module) {
  testCoreSignalEmployeeSearch().catch(console.error);
}

module.exports = { testCoreSignalEmployeeSearch };
