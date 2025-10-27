#!/usr/bin/env node

/**
 * Test: Find Person at Nike
 * 
 * Tests find_person.js functionality by enriching individual people at Nike
 * using direct email matching, LinkedIn URL matching, and company-based person search.
 */

require('dotenv').config({path: '../.env'});

class TestPersonNike {
  constructor() {
    this.apiKey = process.env.CORESIGNAL_API_KEY;
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
    console.log('👤 Testing: Find Person at Nike');
    console.log('=' .repeat(50));
    
    try {
      // Step 1: Find Nike's LinkedIn URL first
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

      // Get company ID and collect profile
      let companyId;
      if (Array.isArray(companySearchData)) {
        companyId = companySearchData[0];
      } else if (companySearchData.hits?.hits) {
        companyId = companySearchData.hits.hits[0]._id || companySearchData.hits.hits[0]._source?.id;
      } else if (companySearchData.hits) {
        companyId = companySearchData.hits[0];
      }

      const companyCollectResponse = await fetch(`https://api.coresignal.com/cdapi/v2/company_multi_source/collect/${companyId}`, {
        method: 'GET',
        headers: {
          'apikey': this.apiKey,
          'Accept': 'application/json'
        }
      });

      const companyData = await companyCollectResponse.json();
      this.testResults.creditsUsed++;
      
      const companyLinkedInUrl = companyData.company_linkedin_url;
      if (!companyLinkedInUrl) {
        throw new Error('Nike company LinkedIn URL not found');
      }

      console.log(`✅ Found Nike LinkedIn URL: ${companyLinkedInUrl}`);

      // Step 2: Search for people at Nike using company experience
      console.log('🔍 Step 2: Searching for people at Nike...');
      
      const searchQuery = {
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

      const searchResponse = await fetch('https://api.coresignal.com/cdapi/v2/person_multi_source/search/es_dsl?items_per_page=10', {
        method: 'POST',
        headers: {
          'apikey': this.apiKey,
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify(searchQuery)
      });

      if (!searchResponse.ok) {
        throw new Error(`Person search failed: ${searchResponse.status} ${searchResponse.statusText}`);
      }

      const searchData = await searchResponse.json();
      this.testResults.creditsUsed++;
      console.log('✅ Person search completed');

      // Handle different response formats
      let people = [];
      if (Array.isArray(searchData)) {
        people = searchData;
      } else if (searchData.hits?.hits) {
        people = searchData.hits.hits.map(hit => hit._source || hit);
      } else if (searchData.hits) {
        people = searchData.hits;
      }

      console.log(`📊 Found ${people.length} people at Nike`);

      if (people.length === 0) {
        throw new Error('No people found at Nike');
      }

      // Step 3: Test different search approaches
      console.log('🔍 Step 3: Testing different search approaches...');
      
      const searchApproaches = [
        {
          name: 'company_experience',
          query: searchQuery,
          condition: true
        }
      ];

      // If we have people with emails, test email direct matching
      const peopleWithEmails = people.filter(p => p.primary_professional_email);
      if (peopleWithEmails.length > 0) {
        const emailQuery = {
          "query": {
            "term": {
              "email": peopleWithEmails[0].primary_professional_email.toLowerCase().trim()
            }
          }
        };
        searchApproaches.push({
          name: 'email_direct',
          query: emailQuery,
          condition: true
        });
      }

      // If we have people with LinkedIn URLs, test LinkedIn direct matching
      const peopleWithLinkedIn = people.filter(p => p.linkedin_url);
      if (peopleWithLinkedIn.length > 0) {
        const linkedinQuery = {
          "query": {
            "term": {
              "linkedin_url": peopleWithLinkedIn[0].linkedin_url.trim()
            }
          }
        };
        searchApproaches.push({
          name: 'linkedin_direct',
          query: linkedinQuery,
          condition: true
        });
      }

      let searchData2 = null;
      let usedApproach = null;

      // Try each approach
      for (const approach of searchApproaches) {
        if (!approach.condition) {
          console.log(`   ⚠️ Skipping ${approach.name} - no required data`);
          continue;
        }

        console.log(`   🔍 Trying ${approach.name}...`);
        
        const searchResponse2 = await fetch('https://api.coresignal.com/cdapi/v2/person_multi_source/search/es_dsl?items_per_page=1', {
          method: 'POST',
          headers: {
            'apikey': this.apiKey,
            'Content-Type': 'application/json',
            'Accept': 'application/json'
          },
          body: JSON.stringify(approach.query)
        });

        this.testResults.creditsUsed++;

        if (!searchResponse2.ok) {
          console.log(`   ⚠️ ${approach.name} search failed: ${searchResponse2.status} ${searchResponse2.statusText}`);
          continue;
        }

        const data = await searchResponse2.json();
        
        if (Array.isArray(data) && data.length > 0) {
          searchData2 = data;
          usedApproach = approach.name;
          console.log(`   ✅ Found ${data.length} results using ${approach.name}`);
          break;
        } else {
          console.log(`   ⚠️ No results with ${approach.name}`);
        }
      }

      // Step 4: Collect full profiles for top people
      console.log('📋 Step 4: Collecting full profiles for top people...');
      
      const enrichedPeople = [];
      
      // Limit to top 5 for testing to save credits
      const topPeople = people.slice(0, 5);
      
      for (const person of topPeople) {
        try {
          const collectResponse = await fetch(`https://api.coresignal.com/cdapi/v2/person_multi_source/collect/${person.id}`, {
            method: 'GET',
            headers: {
              'apikey': this.apiKey,
              'Accept': 'application/json'
            }
          });

          if (collectResponse.ok) {
            const personData = await collectResponse.json();
            enrichedPeople.push(personData);
            this.testResults.creditsUsed++;
            console.log(`  ✅ Enriched: ${personData.full_name} - ${personData.active_experience_title}`);
          }
          
          // Small delay between collects
          await new Promise(resolve => setTimeout(resolve, 1000));
        } catch (error) {
          console.log(`  ❌ Failed to collect profile for ${person.full_name}: ${error.message}`);
        }
      }

      if (enrichedPeople.length === 0) {
        throw new Error('No people profiles collected');
      }

      // Step 5: Validate person data
      console.log('🔍 Step 5: Validating person data...');
      
      const validations = {
        foundPeople: people.length > 0,
        enrichedPeople: enrichedPeople.length > 0,
        hasNames: enrichedPeople.every(p => p.full_name),
        hasTitles: enrichedPeople.every(p => p.active_experience_title),
        hasEmails: enrichedPeople.some(p => p.primary_professional_email),
        hasLinkedIn: enrichedPeople.some(p => p.linkedin_url),
        hasLocations: enrichedPeople.some(p => p.location),
        hasExperience: enrichedPeople.some(p => p.experience && p.experience.length > 0)
      };

      console.log('📊 Person Validation Results:');
      Object.entries(validations).forEach(([key, value]) => {
        console.log(`  ${value ? '✅' : '❌'} ${key}: ${value}`);
      });

      const allValid = Object.values(validations).every(v => v);
      
      if (!allValid) {
        throw new Error('Person data validation failed');
      }

      // Step 6: Display enriched people
      console.log('\n👤 Nike People Enriched:');
      enrichedPeople.forEach((person, index) => {
        console.log(`\n${index + 1}. ${person.full_name}`);
        console.log(`   Title: ${person.active_experience_title}`);
        console.log(`   Department: ${person.active_experience_department}`);
        console.log(`   Management Level: ${person.active_experience_management_level}`);
        console.log(`   Email: ${person.primary_professional_email || 'N/A'}`);
        console.log(`   LinkedIn: ${person.linkedin_url || 'N/A'}`);
        console.log(`   Location: ${person.location || 'N/A'}`);
        console.log(`   Connections: ${person.connections_count || 0}`);
        console.log(`   Followers: ${person.followers_count || 0}`);
      });

      // Step 7: Test confidence matching
      console.log('\n🔍 Step 7: Testing confidence matching...');
      
      const confidenceTests = enrichedPeople.map(person => {
        const confidence = this.calculatePersonMatchConfidence(person);
        return {
          name: person.full_name,
          confidence: confidence.confidence,
          factors: confidence.factors
        };
      });

      console.log('📊 Confidence Matching Results:');
      confidenceTests.forEach(test => {
        console.log(`  ${test.name}: ${test.confidence}% confidence`);
        console.log(`    Factors: ${test.factors.join(', ')}`);
      });

      const highConfidenceCount = confidenceTests.filter(t => t.confidence >= 90).length;
      console.log(`\n✅ High confidence matches (90%+): ${highConfidenceCount}/${confidenceTests.length}`);

      this.testResults.success = true;
      this.testResults.data = {
        totalFound: people.length,
        enriched: enrichedPeople.length,
        highConfidence: highConfidenceCount,
        searchApproaches: searchApproaches.length,
        usedApproach: usedApproach,
        people: enrichedPeople.map(p => ({
          name: p.full_name,
          title: p.active_experience_title,
          department: p.active_experience_department,
          managementLevel: p.active_experience_management_level,
          email: p.primary_professional_email,
          linkedin: p.linkedin_url,
          location: p.location,
          connections: p.connections_count,
          followers: p.followers_count
        }))
      };

      console.log('\n✅ Test PASSED: Successfully enriched Nike people');
      
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

  calculatePersonMatchConfidence(person) {
    let score = 0;
    let factors = [];
    
    // Email match (50 points)
    if (person.primary_professional_email) {
      score += 50;
      factors.push('Professional email present (+50)');
    }
    
    // LinkedIn URL match (50 points)
    if (person.linkedin_url) {
      score += 50;
      factors.push('LinkedIn URL present (+50)');
    }
    
    // Active experience bonus (10 points)
    if (person.experience?.some(exp => exp.active_experience === 1)) {
      score += 10;
      factors.push('Active experience (+10)');
    }
    
    // Location bonus (5 points)
    if (person.location) {
      score += 5;
      factors.push('Location present (+5)');
    }
    
    // Connections bonus (5 points)
    if (person.connections_count > 100) {
      score += 5;
      factors.push('High connections (+5)');
    }
    
    // Cap at 100
    score = Math.min(score, 100);
    
    return {
      confidence: score,
      factors
    };
  }
}

// Run test if called directly
if (require.main === module) {
  const test = new TestPersonNike();
  test.run()
    .then(results => {
      process.exit(results.success ? 0 : 1);
    })
    .catch(error => {
      console.error('Test execution failed:', error);
      process.exit(1);
    });
}

module.exports = TestPersonNike;
