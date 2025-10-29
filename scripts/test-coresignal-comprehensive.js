#!/usr/bin/env node

/**
 * Comprehensive Coresignal API Test
 * 
 * This script tests various Coresignal API queries to understand
 * the correct field names and response structure.
 */

require('dotenv').config();

class CoresignalTester {
  constructor() {
    this.apiKey = process.env.CORESIGNAL_API_KEY;
    this.testResults = [];
  }

  async run() {
    try {
      console.log('🔍 Comprehensive Coresignal API Testing...\n');
      
      // Test 1: Basic match_all
      await this.testMatchAll();
      
      // Test 2: Country filters
      await this.testCountryFilters();
      
      // Test 3: Industry filters
      await this.testIndustryFilters();
      
      // Test 4: Combined filters
      await this.testCombinedFilters();
      
      // Test 5: Check response structure
      await this.testResponseStructure();
      
      this.printResults();
      
    } catch (error) {
      console.error('❌ Error:', error);
    }
  }

  async testMatchAll() {
    console.log('📋 Test 1: Match All Query');
    console.log('=' .repeat(40));
    
    const query = { query: { match_all: {} } };
    const result = await this.searchCoresignal(query, 5);
    
    this.testResults.push({
      test: 'match_all',
      success: result.success,
      count: result.count,
      error: result.error
    });
    
    if (result.success && result.companies.length > 0) {
      console.log('✅ Match all works');
      console.log(`📊 Found ${result.count} companies`);
      console.log('📋 Sample companies:');
      result.companies.slice(0, 3).forEach((company, i) => {
        console.log(`   ${i+1}. ID: ${company.id}`);
        console.log(`      Name: ${company.name || 'N/A'}`);
        console.log(`      Country: ${company.country || 'N/A'}`);
        console.log(`      Industry: ${company.industry || 'N/A'}`);
      });
    } else {
      console.log('❌ Match all failed:', result.error);
    }
    console.log('');
  }

  async testCountryFilters() {
    console.log('📋 Test 2: Country Filter Tests');
    console.log('=' .repeat(40));
    
    const countryTests = [
      { field: 'company_hq_country', value: 'United States' },
      { field: 'company_hq_country', value: 'USA' },
      { field: 'company_hq_country', value: 'US' },
      { field: 'hq_country', value: 'United States' },
      { field: 'hq_country', value: 'USA' },
      { field: 'country', value: 'United States' },
      { field: 'country', value: 'USA' }
    ];
    
    for (const test of countryTests) {
      const query = {
        query: {
          term: {
            [test.field]: test.value
          }
        }
      };
      
      const result = await this.searchCoresignal(query, 3);
      this.testResults.push({
        test: `country_${test.field}_${test.value}`,
        success: result.success,
        count: result.count,
        error: result.error
      });
      
      console.log(`   ${test.field} = "${test.value}": ${result.success ? `✅ ${result.count} results` : `❌ ${result.error}`}`);
    }
    console.log('');
  }

  async testIndustryFilters() {
    console.log('📋 Test 3: Industry Filter Tests');
    console.log('=' .repeat(40));
    
    const industryTests = [
      { field: 'company_industry', value: 'Software' },
      { field: 'company_industry', value: 'SaaS' },
      { field: 'industry', value: 'Software' },
      { field: 'industry', value: 'SaaS' }
    ];
    
    for (const test of industryTests) {
      const query = {
        query: {
          term: {
            [test.field]: test.value
          }
        }
      };
      
      const result = await this.searchCoresignal(query, 3);
      this.testResults.push({
        test: `industry_${test.field}_${test.value}`,
        success: result.success,
        count: result.count,
        error: result.error
      });
      
      console.log(`   ${test.field} = "${test.value}": ${result.success ? `✅ ${result.count} results` : `❌ ${result.error}`}`);
    }
    console.log('');
  }

  async testCombinedFilters() {
    console.log('📋 Test 4: Combined Filter Tests');
    console.log('=' .repeat(40));
    
    const combinedTests = [
      {
        name: 'USA + Software',
        query: {
          query: {
            bool: {
              must: [
                { term: { company_hq_country: 'United States' } },
                { term: { company_industry: 'Software' } }
              ]
            }
          }
        }
      },
      {
        name: 'USA + Software (alternative fields)',
        query: {
          query: {
            bool: {
              must: [
                { term: { hq_country: 'United States' } },
                { term: { industry: 'Software' } }
              ]
            }
          }
        }
      }
    ];
    
    for (const test of combinedTests) {
      const result = await this.searchCoresignal(test.query, 5);
      this.testResults.push({
        test: `combined_${test.name.replace(/\s+/g, '_')}`,
        success: result.success,
        count: result.count,
        error: result.error
      });
      
      console.log(`   ${test.name}: ${result.success ? `✅ ${result.count} results` : `❌ ${result.error}`}`);
    }
    console.log('');
  }

  async testResponseStructure() {
    console.log('📋 Test 5: Response Structure Analysis');
    console.log('=' .repeat(40));
    
    const query = { query: { match_all: {} } };
    const result = await this.searchCoresignal(query, 1);
    
    if (result.success && result.rawResponse) {
      console.log('📊 Response structure:');
      console.log(`   Type: ${Array.isArray(result.rawResponse) ? 'Array' : typeof result.rawResponse}`);
      console.log(`   Keys: ${Object.keys(result.rawResponse).join(', ')}`);
      
      if (result.rawResponse.hits) {
        console.log(`   Hits type: ${typeof result.rawResponse.hits}`);
        console.log(`   Hits keys: ${Object.keys(result.rawResponse.hits).join(', ')}`);
      }
    }
    console.log('');
  }

  async searchCoresignal(query, limit = 5) {
    try {
      const response = await fetch(
        `https://api.coresignal.com/cdapi/v2/company_multi_source/search/es_dsl?items_per_page=${limit}`,
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
          error: `${response.status} ${response.statusText}: ${errorText}`,
          companies: [],
          rawResponse: null
        };
      }

      const data = await response.json();
      
      // Handle different response formats
      let companyIds = [];
      let companies = [];
      
      if (Array.isArray(data)) {
        companyIds = data;
        companies = data.map(id => ({ id }));
      } else if (data.hits?.hits) {
        companyIds = data.hits.hits.map(hit => hit._id || hit._source?.id);
        companies = data.hits.hits.map(hit => ({
          id: hit._id || hit._source?.id,
          name: hit._source?.name || hit._source?.company_name,
          country: hit._source?.hq_country || hit._source?.company_hq_country,
          industry: hit._source?.industry || hit._source?.company_industry
        }));
      } else if (data.hits) {
        companyIds = data.hits;
        companies = data.hits.map(id => ({ id }));
      }

      return {
        success: true,
        count: companyIds.length,
        error: null,
        companies: companies,
        rawResponse: data
      };

    } catch (error) {
      return {
        success: false,
        count: 0,
        error: error.message,
        companies: [],
        rawResponse: null
      };
    }
  }

  printResults() {
    console.log('📊 Test Results Summary');
    console.log('=' .repeat(50));
    
    const successful = this.testResults.filter(r => r.success);
    const failed = this.testResults.filter(r => !r.success);
    
    console.log(`✅ Successful tests: ${successful.length}`);
    console.log(`❌ Failed tests: ${failed.length}`);
    console.log('');
    
    if (successful.length > 0) {
      console.log('✅ Working queries:');
      successful.forEach(result => {
        console.log(`   - ${result.test}: ${result.count} results`);
      });
    }
    
    if (failed.length > 0) {
      console.log('\n❌ Failed queries:');
      failed.forEach(result => {
        console.log(`   - ${result.test}: ${result.error}`);
      });
    }
  }
}

// Run the tester
const tester = new CoresignalTester();
tester.run().catch(console.error);
