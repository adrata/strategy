#!/usr/bin/env node

/**
 * 🔧 FIXED CORESIGNAL API TEST
 * 
 * Tests the v2 CoreSignal API with exact working patterns
 */

const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));

// Load and clean environment variables
require('dotenv').config({ path: '.env.local' });

const CORESIGNAL_API_KEY = process.env.CORESIGNAL_API_KEY?.replace(/\\n/g, '').trim();

async function testFixedCoreSignal() {
  console.log('🔧 FIXED CORESIGNAL API TEST');
  console.log('=' .repeat(60));
  console.log('Testing v2 API with exact working patterns');
  console.log('');
  
  console.log(`🔑 CoreSignal API Key: ${CORESIGNAL_API_KEY ? `✅ Available (${CORESIGNAL_API_KEY.length} chars)` : '❌ Missing'}`);
  console.log('');

  const testExecutive = {
    name: "Kenneth Cornick",
    company: "First American Financial Corporation",
    website: "firstam.com"
  };

  try {
    console.log(`👤 Testing: ${testExecutive.name} at ${testExecutive.company}`);
    console.log('');
    
    // Use EXACT working v2 pattern from ExecutiveContactIntelligence.js
    const searchQuery = {
      query: {
        bool: {
          must: [
            {
              nested: {
                path: "experience",
                query: {
                  bool: {
                    must: [
                      {
                        bool: {
                          should: [
                            { match: { "experience.company_name": testExecutive.company } },
                            { match: { "experience.company_name": testExecutive.website } }
                          ]
                        }
                      },
                      {
                        range: {
                          "experience.date_to": {
                            gte: "2020-01-01"
                          }
                        }
                      }
                    ]
                  }
                }
              }
            },
            {
              match: {
                full_name: testExecutive.name
              }
            }
          ]
        }
      },
      size: 5
    };
    
    console.log('🔍 STEP 1: CoreSignal Employee Search');
    console.log(`   Endpoint: https://api.coresignal.com/cdapi/v2/employee_multi_source/search/es_dsl`);
    console.log(`   Query: ${JSON.stringify(searchQuery, null, 2).substring(0, 200)}...`);
    
    const searchResponse = await fetch('https://api.coresignal.com/cdapi/v2/employee_multi_source/search/es_dsl', {
      method: 'POST',
      headers: {
        'apikey': CORESIGNAL_API_KEY,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(searchQuery),
      timeout: 15000
    });

    console.log(`   📊 Search Status: ${searchResponse.status}`);
    
    if (searchResponse.ok) {
      const searchData = await searchResponse.json();
      console.log(`   ✅ Search Success! Found: ${searchData.hits?.length || 0} results`);
      
      if (searchData.hits && searchData.hits.length > 0) {
        const employeeId = searchData.hits[0]._id;
        const employeeSource = searchData.hits[0]._source;
        
        console.log(`   🔍 Employee ID: ${employeeId}`);
        console.log(`   👤 Employee: ${employeeSource.full_name || 'Unknown'}`);
        console.log(`   🏢 Company: ${employeeSource.current_company_name || 'Unknown'}`);
        
        console.log('');
        console.log('🔍 STEP 2: CoreSignal Employee Profile Collection');
        
        const collectResponse = await fetch(`https://api.coresignal.com/cdapi/v2/employee_multi_source/collect/${employeeId}`, {
          headers: {
            'apikey': CORESIGNAL_API_KEY
          }
        });

        console.log(`   📊 Collection Status: ${collectResponse.status}`);
        
        if (collectResponse.ok) {
          const profile = await collectResponse.json();
          
          console.log(`   ✅ Profile Success!`);
          console.log(`   👤 Full Name: ${profile.full_name || 'Not provided'}`);
          console.log(`   💼 Title: ${profile.member_position_title || profile.current_position_title || 'Not provided'}`);
          console.log(`   🏢 Company: ${profile.current_company_name || 'Not provided'}`);
          console.log(`   📧 Primary Email: ${profile.primary_professional_email || 'Not found'}`);
          console.log(`   📊 Email Status: ${profile.primary_professional_email_status || 'N/A'}`);
          console.log(`   💼 LinkedIn: ${profile.member_linkedin_url || profile.linkedin_url || 'Not found'}`);
          
          if (profile.primary_professional_email) {
            console.log('');
            console.log('🎯 CONTACT DISCOVERY SUCCESS!');
            console.log(`   📧 Email Found: ${profile.primary_professional_email}`);
            console.log(`   📊 Status: ${profile.primary_professional_email_status}`);
            console.log(`   🔗 LinkedIn: ${profile.member_linkedin_url || 'Not found'}`);
          } else {
            console.log('');
            console.log('⚠️ No email found, but profile exists');
          }
          
        } else {
          const errorText = await collectResponse.text();
          console.log(`   ❌ Collection Error: ${errorText}`);
        }
      } else {
        console.log('   ⚠️ No employees found in search results');
      }
      
    } else {
      const errorText = await searchResponse.text();
      console.log(`   ❌ Search Error: ${errorText}`);
    }
    
  } catch (error) {
    console.log(`   ❌ Exception: ${error.message}`);
  }
}

// Run the test
if (require.main === module) {
  testFixedCoreSignal().catch(console.error);
}

module.exports = { testFixedCoreSignal };
