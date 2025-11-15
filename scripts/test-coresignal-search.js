#!/usr/bin/env node

/**
 * Test CoreSignal Search for specific emails
 * Shows the exact query and response for debugging
 */

require('dotenv').config();

const CORESIGNAL_API_KEY = process.env.CORESIGNAL_API_KEY?.trim().replace(/\\n/g, '');

const testEmails = [
  'aadkins@bartlettec.coop',
  'aanderson@cityoftacoma.org',
  'aroot@rootbrothers.com'
];

async function testSearch(email) {
  console.log(`\n🔍 Testing: ${email}`);
  console.log('='.repeat(70));
  
  const searchQuery = {
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
        ]
      }
    }
  };

  console.log('\n📤 Search Query:');
  console.log(JSON.stringify(searchQuery, null, 2));

  try {
    const response = await fetch('https://api.coresignal.com/cdapi/v2/employee_multi_source/search/es_dsl?items_per_page=5', {
      method: 'POST',
      headers: {
        'apikey': CORESIGNAL_API_KEY,
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: JSON.stringify(searchQuery)
    });

    console.log(`\n📥 Response Status: ${response.status} ${response.statusText}`);

    if (!response.ok) {
      const errorText = await response.text();
      console.log(`\n❌ Error Response:`);
      console.log(errorText);
      return;
    }

    const data = await response.json();
    
    console.log(`\n📊 Response Data:`);
    console.log(JSON.stringify(data, null, 2));

    if (Array.isArray(data) && data.length > 0) {
      console.log(`\n✅ Found ${data.length} result(s)`);
      if (typeof data[0] === 'number') {
        console.log(`   Employee ID: ${data[0]}`);
      } else {
        console.log(`   Employee ID: ${data[0].id || data[0]}`);
        console.log(`   Full Name: ${data[0].full_name || 'N/A'}`);
        console.log(`   Primary Email: ${data[0].primary_professional_email || 'N/A'}`);
      }
    } else if (data.hits?.hits?.length > 0) {
      console.log(`\n✅ Found ${data.hits.hits.length} result(s) in hits format`);
      const firstHit = data.hits.hits[0];
      console.log(`   Employee ID: ${firstHit._source?.id || firstHit.id || firstHit._id}`);
      console.log(`   Full Name: ${firstHit._source?.full_name || 'N/A'}`);
    } else {
      console.log(`\n⚠️  No results found`);
    }

  } catch (error) {
    console.error(`\n❌ Error: ${error.message}`);
  }
}

async function main() {
  console.log('🧪 TESTING CORESIGNAL SEARCH');
  console.log('='.repeat(70));
  console.log(`🔑 API Key: ${CORESIGNAL_API_KEY ? 'Configured' : 'Missing'}`);
  
  if (!CORESIGNAL_API_KEY) {
    console.error('❌ CORESIGNAL_API_KEY not found');
    process.exit(1);
  }

  for (const email of testEmails) {
    await testSearch(email);
    // Small delay between requests
    await new Promise(resolve => setTimeout(resolve, 1000));
  }

  console.log('\n' + '='.repeat(70));
  console.log('✅ Testing complete');
}

if (require.main === module) {
  main().catch(console.error);
}
