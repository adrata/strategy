#!/usr/bin/env node

/**
 * 🎯 TEST CFO/CRO DETECTION
 * 
 * Verify that we're actually finding the real CFO and CRO at companies,
 * not just any active employees.
 */

require('dotenv').config();

const CORESIGNAL_API_KEY = process.env.CORESIGNAL_API_KEY;

if (!CORESIGNAL_API_KEY) {
  console.log('❌ CORESIGNAL_API_KEY not found in environment');
  process.exit(1);
}

async function searchForCFOCRO(companyName) {
  console.log(`\n🏢 Searching for CFO/CRO at: ${companyName}`);
  console.log('='.repeat(50));

  const esQuery = {
    query: {
      bool: {
        must: [
          {
            nested: {
              path: 'experience',
              query: {
                bool: {
                  must: [
                    { term: { 'experience.active_experience': 1 } }, // ACTIVE only
                    {
                      bool: {
                        should: [
                          { match: { 'experience.company_name': companyName } },
                          { match_phrase: { 'experience.company_name': companyName } },
                        ],
                      },
                    },
                  ],
                },
              },
            },
          },
        ],
      },
    },
  };

  try {
    const response = await fetch('https://api.coresignal.com/cdapi/v2/employee_multi_source/search/es_dsl?items_per_page=20', {
      method: 'POST',
      headers: {
        'apikey': CORESIGNAL_API_KEY,
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: JSON.stringify(esQuery)
    });

    if (!response.ok) {
      console.log(`   ❌ Search failed: ${response.status}`);
      return;
    }

    const result = await response.json();
    let employeeIds = [];
    
    if (Array.isArray(result)) {
      employeeIds = result;
    } else if (result.hits?.hits) {
      employeeIds = result.hits.hits.map(hit => hit._source.id);
    }

    console.log(`   📊 Found ${employeeIds.length} active employees`);

    if (employeeIds.length === 0) {
      console.log(`   ⚠️ No employees found for ${companyName}`);
      return;
    }

    // Enhanced executive detection
    const executiveTitles = {
      cfo: /\b(cfo|chief financial officer|vp.?finance|finance.*director|head of finance|finance.*manager)\b/i,
      cro: /\b(cro|chief revenue officer|vp.?revenue|revenue.*director|head of revenue|revenue.*manager)\b/i,
      ceo: /\b(ceo|chief executive officer)\b/i,
      president: /\b(president)\b/i,
      cto: /\b(cto|chief technology officer|chief technical officer)\b/i,
      coo: /\b(coo|chief operating officer)\b/i,
    };

    const foundExecutives = {
      cfo: [],
      cro: [],
      ceo: [],
      president: [],
      cto: [],
      coo: [],
      other: []
    };

    // Check first 10 employees for executives
    for (let i = 0; i < Math.min(10, employeeIds.length); i++) {
      const employeeId = employeeIds[i];
      
      try {
        const collectResponse = await fetch(`https://api.coresignal.com/cdapi/v2/employee_multi_source/collect/${employeeId}`, {
          headers: {
            'apikey': CORESIGNAL_API_KEY,
            'Accept': 'application/json'
          }
        });
        
        if (collectResponse.ok) {
          const profile = await collectResponse.json();
          
          const name = profile.full_name || 'Unknown';
          const title = profile.active_experience_title || profile.member_position_title || 'Unknown';
          const email = profile.primary_professional_email || 'Not found';
          const linkedin = profile.linkedin_url || profile.member_linkedin_url || 'Not found';
          
          // Classify the executive
          const titleLower = title.toLowerCase();
          let roleType = 'other';
          
          if (executiveTitles.cfo.test(titleLower)) {
            roleType = 'cfo';
          } else if (executiveTitles.cro.test(titleLower)) {
            roleType = 'cro';
          } else if (executiveTitles.ceo.test(titleLower)) {
            roleType = 'ceo';
          } else if (executiveTitles.president.test(titleLower)) {
            roleType = 'president';
          } else if (executiveTitles.cto.test(titleLower)) {
            roleType = 'cto';
          } else if (executiveTitles.coo.test(titleLower)) {
            roleType = 'coo';
          }
          
          const executive = {
            name,
            title,
            email,
            linkedin,
            roleType
          };
          
          foundExecutives[roleType].push(executive);
          
          // Log all executives found
          if (roleType !== 'other') {
            console.log(`   👔 ${roleType.toUpperCase()}: ${name} - ${title}`);
            console.log(`      📧 ${email}`);
            console.log(`      🔗 ${linkedin}`);
          }
        }
        
        // Small delay between requests
        await new Promise(resolve => setTimeout(resolve, 100));
        
      } catch (error) {
        console.log(`   ❌ Error collecting profile ${employeeId}: ${error.message}`);
      }
    }

    // Summary
    console.log(`\n   📊 EXECUTIVE SUMMARY for ${companyName}:`);
    Object.entries(foundExecutives).forEach(([role, executives]) => {
      if (executives.length > 0) {
        console.log(`   ${role.toUpperCase()}: ${executives.length} found`);
        executives.forEach(exec => {
          console.log(`     - ${exec.name} (${exec.title})`);
        });
      }
    });

    return foundExecutives;

  } catch (error) {
    console.log(`   ❌ Search error: ${error.message}`);
  }
}

async function testKnownCompanies() {
  console.log('🎯 TESTING CFO/CRO DETECTION AT KNOWN COMPANIES');
  console.log('===============================================');
  console.log('Testing with companies where we can verify the results...\n');

  const testCompanies = [
    'Microsoft',
    'Apple',
    'Google',
    'Amazon',
    'Tesla'
  ];

  const results = {};

  for (const company of testCompanies) {
    results[company] = await searchForCFOCRO(company);
    
    // Delay between companies to be respectful to the API
    await new Promise(resolve => setTimeout(resolve, 1000));
  }

  // Final summary
  console.log('\n🎉 FINAL SUMMARY');
  console.log('================');
  
  Object.entries(results).forEach(([company, executives]) => {
    if (executives) {
      const cfoCount = executives.cfo.length;
      const croCount = executives.cro.length;
      const ceoCount = executives.ceo.length;
      
      console.log(`\n${company}:`);
      console.log(`  CFO: ${cfoCount} found`);
      console.log(`  CRO: ${croCount} found`);
      console.log(`  CEO: ${ceoCount} found`);
      
      if (cfoCount > 0) {
        console.log(`  CFO Details:`);
        executives.cfo.forEach(cfo => {
          console.log(`    - ${cfo.name}: ${cfo.title}`);
        });
      }
      
      if (croCount > 0) {
        console.log(`  CRO Details:`);
        executives.cro.forEach(cro => {
          console.log(`    - ${cro.name}: ${cro.title}`);
        });
      }
    }
  });

  console.log('\n✅ CFO/CRO DETECTION TEST COMPLETED');
  console.log('If we found actual CFOs and CROs, the detection is working correctly!');
}

// Run the test
testKnownCompanies().catch(console.error);

