#!/usr/bin/env node

/**
 * Debug CoreSignal search for a specific email
 * Usage: node scripts/debug-coresignal-search.js <email>
 */

require('dotenv').config();
const fetch = require('node-fetch');

const CORESIGNAL_API_KEY = process.env.CORESIGNAL_API_KEY?.trim();

async function debugEmailSearch(email) {
  console.log(`\n🔍 DEBUGGING CORESIGNAL SEARCH FOR: ${email}`);
  console.log('='.repeat(70));
  
  if (!CORESIGNAL_API_KEY) {
    console.error('❌ CORESIGNAL_API_KEY not found');
    process.exit(1);
  }

  // Test 1: Exact term query on .exact field
  console.log(`\n📋 TEST 1: Exact term query (primary_professional_email.exact)`);
  const query1 = {
    query: {
      bool: {
        must: [
          {
            term: {
              "primary_professional_email.exact": email
            }
          }
        ]
      }
    }
  };
  
  await testQuery(query1, 'exact term');

  // Test 2: Match query
  console.log(`\n📋 TEST 2: Match query (primary_professional_email)`);
  const query2 = {
    query: {
      bool: {
        must: [
          {
            match: {
              "primary_professional_email": email
            }
          }
        ]
      }
    }
  };
  
  await testQuery(query2, 'match');

  // Test 3: Should with both .exact and collection
  console.log(`\n📋 TEST 3: Should query (.exact + collection)`);
  const query3 = {
    query: {
      bool: {
        should: [
          {
            term: {
              "primary_professional_email.exact": email
            }
          },
          {
            nested: {
              path: "professional_emails_collection",
              query: {
                term: {
                  "professional_emails_collection.professional_email.exact": email
                }
              }
            }
          }
        ],
        minimum_should_match: 1
      }
    }
  };
  
  await testQuery(query3, 'should (.exact + collection)');

  // Test 4: Match with collection
  console.log(`\n📋 TEST 4: Should query (match + collection match)`);
  const query4 = {
    query: {
      bool: {
        should: [
          {
            match: {
              "primary_professional_email": email
            }
          },
          {
            nested: {
              path: "professional_emails_collection",
              query: {
                match: {
                  "professional_emails_collection.professional_email": email
                }
              }
            }
          }
        ],
        minimum_should_match: 1
      }
    }
  };
  
  await testQuery(query4, 'should (match + collection)');
}

async function testQuery(query, testName) {
  try {
    console.log(`   Query: ${JSON.stringify(query, null, 2)}`);
    
    const response = await fetch('https://api.coresignal.com/cdapi/v2/employee_multi_source/search/es_dsl?items_per_page=1', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': CORESIGNAL_API_KEY,
        'Accept': 'application/json'
      },
      body: JSON.stringify(query)
    });

    console.log(`   Status: ${response.status}`);
    
    if (response.ok) {
      const data = await response.json();
      if (Array.isArray(data) && data.length > 0) {
        const employeeId = typeof data[0] === 'number' ? data[0] : data[0].id;
        console.log(`   ✅ SUCCESS! Found employee ID: ${employeeId}`);
        
        // Collect profile to see what we got
        const collectResponse = await fetch(`https://api.coresignal.com/cdapi/v2/employee_multi_source/collect/${employeeId}`, {
          headers: {
            'apikey': CORESIGNAL_API_KEY,
            'Accept': 'application/json'
          }
        });
        
        if (collectResponse.ok) {
          const profile = await collectResponse.json();
          console.log(`   📊 Profile:`);
          console.log(`      Name: ${profile.full_name || 'N/A'}`);
          console.log(`      Primary Email: ${profile.primary_professional_email || 'N/A'}`);
          if (profile.professional_emails_collection && profile.professional_emails_collection.length > 0) {
            const emails = profile.professional_emails_collection.map(e => 
              e.professional_email || e.email || e
            ).join(', ');
            console.log(`      Email Collection: ${emails}`);
          }
          if (profile.linkedin_url) {
            console.log(`      LinkedIn: ${profile.linkedin_url}`);
          }
          if (profile.experience && profile.experience.length > 0) {
            const activeExp = profile.experience.find(e => e.active_experience === 1);
            if (activeExp) {
              console.log(`      Current Company: ${activeExp.company_name || 'N/A'}`);
            }
          }
        }
        return employeeId;
      } else {
        console.log(`   ❌ No results (empty array)`);
      }
    } else {
      const errorText = await response.text();
      console.log(`   ⚠️  Error: ${errorText.substring(0, 300)}`);
    }
  } catch (error) {
    console.log(`   ❌ Exception: ${error.message}`);
  }
  
  return null;
}

async function main() {
  const email = process.argv[2];
  
  if (!email) {
    console.log('Usage: node scripts/debug-coresignal-search.js <email>');
    console.log('\nExample emails to test:');
    console.log('  - aaron.wunderlich@srpnet.com (known to work)');
    console.log('  - aadkins@bartlettec.coop (not finding with .exact)');
    console.log('  - aanderson@cityoftacoma.org (not finding with .exact)');
    process.exit(1);
  }
  
  await debugEmailSearch(email);
}

main().catch(console.error);
