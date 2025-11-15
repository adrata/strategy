#!/usr/bin/env node

/**
 * Test CoreSignal email search with different query patterns
 * to find what actually works
 */

require('dotenv').config();
const fetch = require('node-fetch');

const CORESIGNAL_API_KEY = process.env.CORESIGNAL_API_KEY?.trim();

async function testEmailSearch(email) {
  console.log(`\n🔍 Testing email search for: ${email}`);
  console.log('='.repeat(60));

  const patterns = [
    {
      name: 'Pattern 1: primary_professional_email.exact (term)',
      query: {
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
      }
    },
    {
      name: 'Pattern 2: primary_professional_email (match)',
      query: {
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
      }
    },
    {
      name: 'Pattern 3: primary_professional_email.keyword (term)',
      query: {
        query: {
          bool: {
            must: [
              {
                term: {
                  "primary_professional_email.keyword": email
                }
              }
            ]
          }
        }
      }
    },
    {
      name: 'Pattern 4: should with .exact (proven pattern)',
      query: {
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
      }
    },
    {
      name: 'Pattern 5: match_phrase on email',
      query: {
        query: {
          bool: {
            must: [
              {
                match_phrase: {
                  "primary_professional_email": email
                }
              }
            ]
          }
        }
      }
    }
  ];

  for (const pattern of patterns) {
    try {
      console.log(`\n  Testing: ${pattern.name}`);
      
      const response = await fetch('https://api.coresignal.com/cdapi/v2/employee_multi_source/search/es_dsl?items_per_page=1', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'apikey': CORESIGNAL_API_KEY,
          'Accept': 'application/json'
        },
        body: JSON.stringify(pattern.query)
      });

      if (response.ok) {
        const data = await response.json();
        if (Array.isArray(data) && data.length > 0) {
          console.log(`    ✅ SUCCESS! Found ${data.length} result(s): ${JSON.stringify(data)}`);
          return data[0];
        } else {
          console.log(`    ❌ No results (empty array)`);
        }
      } else {
        const errorText = await response.text();
        console.log(`    ⚠️  Error ${response.status}: ${errorText.substring(0, 200)}`);
      }
    } catch (error) {
      console.log(`    ❌ Exception: ${error.message}`);
    }
    
    // Small delay between requests
    await new Promise(resolve => setTimeout(resolve, 500));
  }

  return null;
}

async function main() {
  if (!CORESIGNAL_API_KEY) {
    console.error('❌ CORESIGNAL_API_KEY not found');
    process.exit(1);
  }

  // Test with multiple emails
  const testEmails = [
    'aaron.wunderlich@srpnet.com', // Known to work
    'aadkins@bartlettec.coop', // Not finding
    'aanderson@cityoftacoma.org' // Not finding
  ];
  
  console.log('🧪 CORESIGNAL EMAIL SEARCH PATTERN TEST');
  console.log('='.repeat(60));
  console.log(`Testing different query patterns to find what works\n`);
  
  for (const testEmail of testEmails) {
    const result = await testEmailSearch(testEmail);
    
    if (result) {
      console.log(`\n✅ Email "${testEmail}" FOUND in CoreSignal! ID: ${result}`);
    } else {
      console.log(`\n❌ Email "${testEmail}" NOT found in CoreSignal (tried all patterns)`);
    }
    
    console.log('\n' + '='.repeat(60));
  }
}

main().catch(console.error);

