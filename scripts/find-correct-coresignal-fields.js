#!/usr/bin/env node

/**
 * Find Correct Coresignal Search Fields
 * 
 * This script analyzes Coresignal profile data to find the correct
 * field names for search filtering.
 */

require('dotenv').config();

class CoresignalFieldFinder {
  constructor() {
    this.apiKey = process.env.CORESIGNAL_API_KEY;
  }

  async run() {
    try {
      console.log('🔍 Finding Correct Coresignal Search Fields...\n');
      
      // Step 1: Get some company profiles to analyze field structure
      const profiles = await this.getSampleProfiles();
      
      // Step 2: Analyze field structure
      this.analyzeFieldStructure(profiles);
      
      // Step 3: Test different search field variations
      await this.testSearchFields(profiles);
      
    } catch (error) {
      console.error('❌ Error:', error);
    }
  }

  async getSampleProfiles() {
    console.log('📋 Step 1: Getting Sample Company Profiles...\n');
    
    // Get 5 company IDs
    const searchResponse = await fetch(
      'https://api.coresignal.com/cdapi/v2/company_multi_source/search/es_dsl?items_per_page=5',
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
        }
      } catch (error) {
        console.log(`   ❌ Failed to collect profile for ID: ${id}`);
      }
    }

    return profiles;
  }

  analyzeFieldStructure(profiles) {
    console.log('\n📋 Step 2: Analyzing Field Structure...\n');
    
    profiles.forEach((profile, index) => {
      console.log(`📊 Company ${index + 1}:`);
      console.log(`   Name: ${profile.name || profile.company_name || 'N/A'}`);
      
      // Country fields
      console.log('   🌍 Country Fields:');
      console.log(`      hq_country: ${profile.hq_country || 'N/A'}`);
      console.log(`      company_hq_country: ${profile.company_hq_country || 'N/A'}`);
      console.log(`      country: ${profile.country || 'N/A'}`);
      console.log(`      company_hq_country_iso2: ${profile.company_hq_country_iso2 || 'N/A'}`);
      console.log(`      company_hq_country_iso3: ${profile.company_hq_country_iso3 || 'N/A'}`);
      
      // Industry fields
      console.log('   💻 Industry Fields:');
      console.log(`      industry: ${profile.industry || 'N/A'}`);
      console.log(`      company_industry: ${profile.company_industry || 'N/A'}`);
      console.log(`      sector: ${profile.sector || 'N/A'}`);
      
      // Revenue fields
      console.log('   💰 Revenue Fields:');
      console.log(`      revenue_annual: ${JSON.stringify(profile.revenue_annual) || 'N/A'}`);
      console.log(`      revenue_annual_range: ${profile.revenue_annual_range || 'N/A'}`);
      console.log(`      company_annual_revenue_source_1: ${profile.company_annual_revenue_source_1 || 'N/A'}`);
      
      // B2B fields
      console.log('   🏢 B2B Fields:');
      console.log(`      is_b2b: ${profile.is_b2b || 'N/A'}`);
      console.log(`      company_is_b2b: ${profile.company_is_b2b || 'N/A'}`);
      
      console.log('');
    });
  }

  async testSearchFields(profiles) {
    console.log('📋 Step 3: Testing Search Field Variations...\n');
    
    // Extract actual values from profiles
    const countries = [...new Set(profiles.map(p => p.hq_country || p.company_hq_country || p.country).filter(Boolean))];
    const industries = [...new Set(profiles.map(p => p.industry || p.company_industry).filter(Boolean))];
    
    console.log(`Found countries: ${countries.join(', ')}`);
    console.log(`Found industries: ${industries.join(', ')}\n`);
    
    // Test country searches
    const countryTests = [
      { field: 'company_hq_country', values: countries },
      { field: 'hq_country', values: countries },
      { field: 'country', values: countries },
      { field: 'company_hq_country.keyword', values: countries },
      { field: 'hq_country.keyword', values: countries }
    ];
    
    for (const test of countryTests) {
      for (const value of test.values.slice(0, 2)) { // Test first 2 values
        const result = await this.testSearch({
          query: {
            term: {
              [test.field]: value
            }
          }
        });
        console.log(`   ${test.field} = "${value}": ${result.success ? `✅ ${result.count} results` : `❌ ${result.error}`}`);
      }
    }
    
    console.log('');
    
    // Test industry searches
    const industryTests = [
      { field: 'company_industry', values: industries },
      { field: 'industry', values: industries },
      { field: 'company_industry.keyword', values: industries },
      { field: 'industry.keyword', values: industries }
    ];
    
    for (const test of industryTests) {
      for (const value of test.values.slice(0, 2)) { // Test first 2 values
        const result = await this.testSearch({
          query: {
            term: {
              [test.field]: value
            }
          }
        });
        console.log(`   ${test.field} = "${value}": ${result.success ? `✅ ${result.count} results` : `❌ ${result.error}`}`);
      }
    }
  }

  async testSearch(query) {
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
        return {
          success: false,
          count: 0,
          error: `${response.status}: ${errorText.substring(0, 100)}`
        };
      }

      const data = await response.json();
      const count = Array.isArray(data) ? data.length : 0;

      return {
        success: true,
        count: count,
        error: null
      };

    } catch (error) {
      return {
        success: false,
        count: 0,
        error: error.message
      };
    }
  }
}

// Run the finder
const finder = new CoresignalFieldFinder();
finder.run().catch(console.error);
