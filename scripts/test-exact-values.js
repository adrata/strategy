#!/usr/bin/env node

/**
 * Test Exact Values from Profile Data
 * 
 * This script tests search filters using the exact values found in profile data.
 */

require('dotenv').config();

class ExactValueTester {
  constructor() {
    this.apiKey = process.env.CORESIGNAL_API_KEY;
  }

  async run() {
    try {
      console.log('🔍 Testing Exact Values from Profile Data...\n');
      
      // Get some profiles to see exact values
      const profiles = await this.getSampleProfiles();
      
      // Test with exact values from profiles
      for (const profile of profiles) {
        const country = profile.hq_country;
        const industry = profile.industry;
        
        if (country) {
          console.log(`📋 Testing country: "${country}"`);
          await this.testQuery(`Country: "${country}"`, {
            query: {
              term: {
                hq_country: country
              }
            }
          });
        }
        
        if (industry) {
          console.log(`📋 Testing industry: "${industry}"`);
          await this.testQuery(`Industry: "${industry}"`, {
            query: {
              term: {
                industry: industry
              }
            }
          });
        }
      }
      
    } catch (error) {
      console.error('❌ Error:', error);
    }
  }

  async getSampleProfiles() {
    console.log('📋 Getting Sample Profiles...\n');
    
    // Get 3 company IDs
    const searchResponse = await fetch(
      'https://api.coresignal.com/cdapi/v2/company_multi_source/search/es_dsl?items_per_page=3',
      {
        method: 'POST',
        headers: {
          'apikey': this.apiKey,
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify({ query: { match_all: {} } })
      }
    );

    const companyIds = await searchResponse.json();
    console.log(`✅ Found ${companyIds.length} company IDs`);

    // Collect profiles
    const profiles = [];
    for (const id of companyIds) {
      try {
        const profileResponse = await fetch(
          `https://api.coresignal.com/cdapi/v2/company_multi_source/collect/${id}`,
          {
            method: 'GET',
            headers: {
              'apikey': this.apiKey,
              'Accept': 'application/json'
            }
          }
        );
        
        if (profileResponse.ok) {
          const profile = await profileResponse.json();
          profiles.push(profile);
          console.log(`   ✅ Collected profile for ID: ${id}`);
          console.log(`      Country: "${profile.hq_country || 'N/A'}"`);
          console.log(`      Industry: "${profile.industry || 'N/A'}"`);
        }
      } catch (error) {
        console.log(`   ❌ Failed to collect profile for ID: ${id}`);
      }
    }

    return profiles;
  }

  async testQuery(testName, query) {
    try {
      const response = await fetch(
        'https://api.coresignal.com/cdapi/v2/company_multi_source/search/es_dsl?items_per_page=5',
        {
          method: 'POST',
          headers: {
            'apikey': this.apiKey,
            'Content-Type': 'application/json',
            'Accept': 'application/json'
          },
          body: JSON.stringify(query)
        }
      );

      if (!response.ok) {
        const errorText = await response.text();
        console.log(`   ❌ Error: ${response.status} ${response.statusText}`);
        return;
      }

      const data = await response.json();
      const count = Array.isArray(data) ? data.length : 0;
      
      console.log(`   ${count > 0 ? '✅' : '❌'} Results: ${count} companies`);
      
    } catch (error) {
      console.log(`   ❌ Exception: ${error.message}`);
    }
    
    console.log('');
  }
}

// Run the tester
const tester = new ExactValueTester();
tester.run().catch(console.error);
