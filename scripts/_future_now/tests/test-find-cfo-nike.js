#!/usr/bin/env node

/**
 * Test: Find CFO at Nike
 * 
 * Tests find_role.js functionality by finding a CFO-level person at Nike
 * using the Multi-source Employee API with nested experience queries.
 */

require('dotenv').config({path: '../.env'});

class TestFindCFONike {
  constructor() {
    this.apiKey = process.env.CORESIGNAL_API_KEY;
    this.claudeApiKey = process.env.ANTHROPIC_API_KEY;
    this.testResults = {
      success: false,
      creditsUsed: 0,
      executionTime: 0,
      data: null,
      errors: []
    };
  }

  async run() {
    const startTime = Date.now();
    console.log('👔 Testing: Find CFO at Nike');
    console.log('=' .repeat(50));
    
    try {
      // Step 1: First find Nike's LinkedIn URL
      console.log('🔍 Step 1: Finding Nike company LinkedIn URL...');
      const companySearchQuery = {
        "query": {
          "term": {
            "website.exact": "nike.com"
          }
        }
      };

      const companySearchResponse = await fetch('https://api.coresignal.com/cdapi/v2/company_multi_source/search/es_dsl?items_per_page=1', {
        method: 'POST',
        headers: {
          'apikey': this.apiKey,
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify(companySearchQuery)
      });

      if (!companySearchResponse.ok) {
        throw new Error(`Company search failed: ${companySearchResponse.status} ${companySearchResponse.statusText}`);
      }

      const companySearchData = await companySearchResponse.json();
      this.testResults.creditsUsed++;
      console.log('✅ Company search completed');

      // Get company ID
      let companyId;
      if (Array.isArray(companySearchData)) {
        companyId = companySearchData[0];
      } else if (companySearchData.hits?.hits) {
        companyId = companySearchData.hits.hits[0]._id || companySearchData.hits.hits[0]._source?.id;
      } else if (companySearchData.hits) {
        companyId = companySearchData.hits[0];
      }

      if (!companyId) {
        throw new Error('No company ID found in search results');
      }

      // Collect company profile to get LinkedIn URL
      const companyCollectResponse = await fetch(`https://api.coresignal.com/cdapi/v2/company_multi_source/collect/${companyId}`, {
        method: 'GET',
        headers: {
          'apikey': this.apiKey,
          'Accept': 'application/json'
        }
      });

      if (!companyCollectResponse.ok) {
        throw new Error(`Company collect failed: ${companyCollectResponse.status} ${companyCollectResponse.statusText}`);
      }

      const companyData = await companyCollectResponse.json();
      this.testResults.creditsUsed++;
      
      const companyLinkedInUrl = companyData.company_linkedin_url;
      if (!companyLinkedInUrl) {
        throw new Error('Nike company LinkedIn URL not found');
      }

      console.log(`✅ Found Nike LinkedIn URL: ${companyLinkedInUrl}`);

      // Step 2: Search for CFO-level roles at Nike
      console.log('🔍 Step 2: Searching for CFO-level roles at Nike...');
      
      // Try multiple CFO role variations
      const cfoVariations = [
        'CFO',
        'Chief Financial Officer',
        'VP Finance',
        'Finance Director',
        'Head of Finance'
      ];

      let foundPerson = null;
      let searchCredits = 0;

      for (const role of cfoVariations) {
        console.log(`  🔍 Trying role: ${role}`);
        
        const personSearchQuery = {
          "query": {
            "bool": {
              "must": [
                {
                  "nested": {
                    "path": "experience",
                    "query": {
                      "bool": {
                        "must": [
                          {
                            "match": {
                              "experience.company_linkedin_url": companyLinkedInUrl
                            }
                          },
                          {
                            "term": {
                              "experience.active_experience": 1
                            }
                          },
                          {
                            "match": {
                              "experience.position_title": role
                            }
                          }
                        ]
                      }
                    }
                  }
                }
              ]
            }
          }
        };

        const personSearchResponse = await fetch('https://api.coresignal.com/cdapi/v2/person_multi_source/search/es_dsl?items_per_page=1', {
          method: 'POST',
          headers: {
            'apikey': this.apiKey,
            'Content-Type': 'application/json',
            'Accept': 'application/json'
          },
          body: JSON.stringify(personSearchQuery)
        });

        if (!personSearchResponse.ok) {
          console.log(`    ❌ Search failed for ${role}: ${personSearchResponse.status}`);
          continue;
        }

        const personSearchData = await personSearchResponse.json();
        searchCredits++;

        // Handle different response formats
        let personId;
        if (Array.isArray(personSearchData)) {
          personId = personSearchData[0];
        } else if (personSearchData.hits?.hits) {
          personId = personSearchData.hits.hits[0]._id || personSearchData.hits.hits[0]._source?.id;
        } else if (personSearchData.hits) {
          personId = personSearchData.hits[0];
        }

        if (personId) {
          console.log(`    ✅ Found person with role: ${role}`);
          
          // Collect full person profile
          const personCollectResponse = await fetch(`https://api.coresignal.com/cdapi/v2/person_multi_source/collect/${personId}`, {
            method: 'GET',
            headers: {
              'apikey': this.apiKey,
              'Accept': 'application/json'
            }
          });

          if (personCollectResponse.ok) {
            foundPerson = await personCollectResponse.json();
            this.testResults.creditsUsed += searchCredits + 1; // search + collect
            break;
          }
        }
      }

      if (!foundPerson) {
        throw new Error('No CFO-level person found at Nike');
      }

      // Step 3: Validate person data
      console.log('🔍 Step 3: Validating CFO person data...');
      
      const validations = {
        hasName: !!foundPerson.full_name,
        hasTitle: !!foundPerson.active_experience_title,
        hasLinkedIn: !!foundPerson.linkedin_url,
        hasEmail: !!(foundPerson.primary_professional_email || foundPerson.professional_emails_collection?.length > 0),
        isActiveAtNike: foundPerson.experience?.some(exp => exp.active_experience === 1 && exp.company_linkedin_url === companyLinkedInUrl),
        isFinanceRole: foundPerson.active_experience_title?.toLowerCase().includes('finance') || 
                      foundPerson.active_experience_title?.toLowerCase().includes('cfo') ||
                      foundPerson.active_experience_title?.toLowerCase().includes('chief')
      };

      console.log('📊 Validation Results:');
      Object.entries(validations).forEach(([key, value]) => {
        console.log(`  ${value ? '✅' : '❌'} ${key}: ${value}`);
      });

      const allValid = Object.values(validations).every(v => v);
      
      if (!allValid) {
        throw new Error('Person data validation failed');
      }

      // Step 4: Display key information
      console.log('\n👔 Nike CFO Profile:');
      console.log(`  Name: ${foundPerson.full_name}`);
      console.log(`  Title: ${foundPerson.active_experience_title}`);
      console.log(`  LinkedIn: ${foundPerson.linkedin_url}`);
      console.log(`  Email: ${foundPerson.primary_professional_email || 'Not available'}`);
      console.log(`  Department: ${foundPerson.active_experience_department}`);
      console.log(`  Management Level: ${foundPerson.active_experience_management_level}`);
      console.log(`  Connections: ${foundPerson.connections_count?.toLocaleString() || 'N/A'}`);
      console.log(`  Followers: ${foundPerson.followers_count?.toLocaleString() || 'N/A'}`);

      this.testResults.success = true;
      this.testResults.data = {
        name: foundPerson.full_name,
        title: foundPerson.active_experience_title,
        linkedinUrl: foundPerson.linkedin_url,
        email: foundPerson.primary_professional_email,
        department: foundPerson.active_experience_department,
        managementLevel: foundPerson.active_experience_management_level,
        connections: foundPerson.connections_count,
        followers: foundPerson.followers_count
      };

      console.log('\n✅ Test PASSED: Successfully found and validated CFO at Nike');
      
    } catch (error) {
      console.error('\n❌ Test FAILED:', error.message);
      this.testResults.errors.push(error.message);
    } finally {
      this.testResults.executionTime = Date.now() - startTime;
      console.log(`\n📊 Test Summary:`);
      console.log(`  Success: ${this.testResults.success ? '✅' : '❌'}`);
      console.log(`  Credits Used: ${this.testResults.creditsUsed}`);
      console.log(`  Execution Time: ${this.testResults.executionTime}ms`);
      if (this.testResults.errors.length > 0) {
        console.log(`  Errors: ${this.testResults.errors.join(', ')}`);
      }
    }

    return this.testResults;
  }
}

// Run test if called directly
if (require.main === module) {
  const test = new TestFindCFONike();
  test.run()
    .then(results => {
      process.exit(results.success ? 0 : 1);
    })
    .catch(error => {
      console.error('Test execution failed:', error);
      process.exit(1);
    });
}

module.exports = TestFindCFONike;
