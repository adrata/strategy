#!/usr/bin/env node

/**
 * 🎯 EXACT WORKING CORESIGNAL TEST
 * 
 * Uses the EXACT working pattern from ExecutiveContactIntelligence.js line 919
 */

const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));

// Load and clean environment variables
require('dotenv').config({ path: '.env.local' });

const CORESIGNAL_API_KEY = process.env.CORESIGNAL_API_KEY?.replace(/\\n/g, '').trim();

async function testExactWorkingCoreSignal() {
  console.log('🎯 EXACT WORKING CORESIGNAL TEST');
  console.log('=' .repeat(60));
  console.log('Using EXACT pattern from ExecutiveContactIntelligence.js line 919');
  console.log('');
  
  const testExecutive = {
    name: "Kenneth Cornick",
    company: "First American Financial Corporation"
  };

  try {
    console.log(`👤 Testing: ${testExecutive.name} at ${testExecutive.company}`);
    console.log('');
    
    // EXACT working query from line 926-970
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
                      { term: { "experience.active_experience": 1 } },
                      { 
                        bool: {
                          should: [
                            { match: { "experience.company_name": testExecutive.company } },
                            { match: { "experience.company_name": testExecutive.company.replace(/,?\s*(Inc|LLC|Corp|Ltd|Corporation|Company)\.?$/i, '') } }
                          ]
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
      }
      // NOTE: NO size parameter in body - this was the issue!
    };
    
    console.log('🔍 CoreSignal Employee Search (EXACT working pattern):');
    console.log(`   API Key: ${CORESIGNAL_API_KEY.substring(0, 8)}...${CORESIGNAL_API_KEY.slice(-4)}`);
    
    const searchResponse = await fetch('https://api.coresignal.com/cdapi/v2/employee_multi_source/search/es_dsl', {
      method: 'POST',
      headers: {
        'apikey': CORESIGNAL_API_KEY?.trim(),
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(searchQuery),
      timeout: 15000
    });

    console.log(`   📊 Search Status: ${searchResponse.status}`);
    
    if (searchResponse.ok) {
      const searchData = await searchResponse.json();
      console.log(`   ✅ SUCCESS! Found: ${searchData.hits?.length || 0} results`);
      
      if (searchData.hits && searchData.hits.length > 0) {
        const hit = searchData.hits[0];
        const employeeId = hit._id;
        const source = hit._source;
        
        console.log(`   🔍 Employee ID: ${employeeId}`);
        console.log(`   👤 Name: ${source.full_name}`);
        console.log(`   🏢 Company: ${source.current_company_name}`);
        console.log(`   💼 Title: ${source.member_position_title || 'Not provided'}`);
        
        console.log('');
        console.log('🔍 STEP 2: Collecting detailed profile...');
        
        const collectResponse = await fetch(`https://api.coresignal.com/cdapi/v2/employee_multi_source/collect/${employeeId}`, {
          headers: {
            'apikey': CORESIGNAL_API_KEY?.trim()
          }
        });

        console.log(`   📊 Collection Status: ${collectResponse.status}`);
        
        if (collectResponse.ok) {
          const profile = await collectResponse.json();
          
          console.log(`   ✅ PROFILE COLLECTED!`);
          console.log(`   👤 Full Name: ${profile.full_name}`);
          console.log(`   💼 Position: ${profile.member_position_title || profile.current_position_title}`);
          console.log(`   🏢 Company: ${profile.current_company_name}`);
          console.log(`   📧 Primary Email: ${profile.primary_professional_email || 'Not found'}`);
          console.log(`   📊 Email Status: ${profile.primary_professional_email_status || 'N/A'}`);
          console.log(`   💼 LinkedIn: ${profile.member_linkedin_url || profile.linkedin_url || 'Not found'}`);
          
          if (profile.primary_professional_email) {
            console.log('');
            console.log('🎉 CORESIGNAL API WORKING PERFECTLY!');
            console.log(`   📧 Email: ${profile.primary_professional_email}`);
            console.log(`   📊 Status: ${profile.primary_professional_email_status}`);
            console.log(`   🔗 LinkedIn: ${profile.member_linkedin_url || 'Not available'}`);
            console.log('');
            console.log('✅ READY TO INTEGRATE INTO MAIN SYSTEM');
          }
          
        } else {
          const errorText = await collectResponse.text();
          console.log(`   ❌ Collection failed: ${errorText}`);
        }
      } else {
        console.log('   ⚠️ No search results found');
      }
      
    } else {
      const errorText = await searchResponse.text();
      console.log(`   ❌ Search failed: ${errorText}`);
    }
    
  } catch (error) {
    console.log(`   ❌ Exception: ${error.message}`);
  }
}

// Run the test
if (require.main === module) {
  testExactWorkingCoreSignal().catch(console.error);
}

module.exports = { testExactWorkingCoreSignal };
