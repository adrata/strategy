#!/usr/bin/env node

/**
 * 🎯 CORESIGNAL TEST FOR MICHELLE LEE
 * 
 * Testing CoreSignal API to find Michelle Lee
 * Since Lusha API is not working, let's try CoreSignal
 */

const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));

// Load and clean environment variables
require('dotenv').config({ path: '.env.local' });

// Clean API keys (remove newlines and trim)
const CORESIGNAL_API_KEY = process.env.CORESIGNAL_API_KEY?.replace(/\\n/g, '').trim();

async function testMichelleLeeCoreSignal() {
  console.log('🎯 CORESIGNAL TEST FOR MICHELLE LEE');
  console.log('==================================\n');
  
  if (!CORESIGNAL_API_KEY) {
    console.log('❌ CORESIGNAL_API_KEY not found in environment variables');
    return;
  }
  
  console.log('✅ CoreSignal API key found');
  console.log(`   Key length: ${CORESIGNAL_API_KEY.length} characters\n`);
  
  const testCases = [
    {
      name: 'LinkedIn URL Search',
      query: {
        query: {
          bool: {
            must: [
              {
                match: {
                  "member_linkedin_url": "https://www.linkedin.com/in/michelleleexue/"
                }
              }
            ]
          }
        },
        size: 5
      }
    },
    {
      name: 'Name + Company Search',
      query: {
        query: {
          bool: {
            must: [
              {
                match: {
                  "member_full_name": "Michelle Lee"
                }
              },
              {
                match: {
                  "current_company_name": "Southern California Edison"
                }
              }
            ]
          }
        },
        size: 5
      }
    },
    {
      name: 'Name + Company Domain Search',
      query: {
        query: {
          bool: {
            must: [
              {
                match: {
                  "member_full_name": "Michelle Lee"
                }
              },
              {
                match: {
                  "current_company_domain": "sce.com"
                }
              }
            ]
          }
        },
        size: 5
      }
    },
    {
      name: 'Company Domain Only',
      query: {
        query: {
          bool: {
            must: [
              {
                match: {
                  "current_company_domain": "sce.com"
                }
              }
            ]
          }
        },
        size: 10
      }
    }
  ];
  
  for (const testCase of testCases) {
    console.log(`🔍 TEST: ${testCase.name}`);
    console.log('-'.repeat(50));
    
    const success = await testCoreSignalAPI(testCase.query, testCase.name);
    
    if (success) {
      console.log('\n   🎉 SUCCESS: Found Michelle Lee!');
      break; // Stop testing once we find her
    }
    
    console.log('\n');
    
    // Wait between requests to respect rate limits
    await new Promise(resolve => setTimeout(resolve, 2000));
  }
}

async function testCoreSignalAPI(searchQuery, testName) {
  try {
    console.log(`   🌐 API Call: POST https://api.coresignal.com/cdapi/v2/employee_multi_source/search/es_dsl`);
    console.log(`   📋 Search Query:`, JSON.stringify(searchQuery, null, 2));
    
    const response = await fetch('https://api.coresignal.com/cdapi/v2/employee_multi_source/search/es_dsl', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${CORESIGNAL_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(searchQuery),
      timeout: 15000
    });
    
    console.log(`   📊 Response Status: ${response.status}`);
    
    if (response.ok) {
      const data = await response.json();
      console.log(`   📋 Found: ${data.hits?.length || 0} results`);
      
      if (data.hits && data.hits.length > 0) {
        // Look for Michelle Lee specifically
        const michelleLee = data.hits.find(hit => {
          const person = hit._source;
          return person.member_full_name?.toLowerCase().includes('michelle') && 
                 person.member_full_name?.toLowerCase().includes('lee');
        });
        
        if (michelleLee) {
          const person = michelleLee._source;
          console.log('\n   ✅ FOUND MICHELLE LEE!');
          console.log('   =====================');
          console.log(`   👤 Name: ${person.member_full_name || 'Not provided'}`);
          console.log(`   💼 Title: ${person.member_position_title || 'Not provided'}`);
          console.log(`   🏢 Company: ${person.current_company_name || 'Not provided'}`);
          console.log(`   📧 Email: ${person.member_professional_email || 'Not found'}`);
          console.log(`   💼 LinkedIn: ${person.member_linkedin_url || 'Not found'}`);
          
          // Show email status if available
          if (person.member_professional_email_status) {
            console.log(`   📊 Email Status: ${person.member_professional_email_status}`);
          }
          
          // Show additional details
          if (person.member_location) {
            console.log(`   📍 Location: ${person.member_location}`);
          }
          
          if (person.member_experience_years) {
            console.log(`   💼 Experience: ${person.member_experience_years} years`);
          }
          
          console.log(`\n   ✅ SUCCESS with ${testName}!`);
          return true;
        } else {
          console.log(`\n   ⚠️ Michelle Lee not found with ${testName}`);
          console.log(`   📋 Found ${data.hits.length} other people:`);
          data.hits.slice(0, 5).forEach((hit, index) => {
            const person = hit._source;
            console.log(`     ${index + 1}. ${person.member_full_name} - ${person.member_position_title || 'Unknown title'}`);
          });
        }
      } else {
        console.log(`\n   ⚠️ No results found with ${testName}`);
      }
      
    } else {
      const errorText = await response.text();
      console.log(`   ❌ API Error: ${response.status}`);
      console.log(`   Error: ${errorText}`);
    }
    
  } catch (error) {
    console.log(`   ❌ Exception: ${error.message}`);
  }
  
  return false;
}

// Run the CoreSignal test
testMichelleLeeCoreSignal().catch(console.error);
