#!/usr/bin/env node

/**
 * Test: Find Nike Company
 * 
 * Tests find_company.js functionality by searching and collecting Nike's company profile
 * from Coresignal API to validate the company enrichment workflow.
 */

require('dotenv').config({path: '../.env'});

class TestFindNikeCompany {
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
    console.log('🏢 Testing: Find Nike Company Profile');
    console.log('=' .repeat(50));
    
    try {
      // Step 1: Search for Nike using website.exact
      console.log('🔍 Step 1: Searching for Nike by website...');
      const searchQuery = {
        "query": {
          "term": {
            "website.exact": "nike.com"
          }
        }
      };

      const searchResponse = await fetch('https://api.coresignal.com/cdapi/v2/company_multi_source/search/es_dsl?items_per_page=1', {
        method: 'POST',
        headers: {
          'apikey': this.apiKey,
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify(searchQuery)
      });

      if (!searchResponse.ok) {
        throw new Error(`Search failed: ${searchResponse.status} ${searchResponse.statusText}`);
      }

      const searchData = await searchResponse.json();
      this.testResults.creditsUsed++;
      console.log('✅ Search completed');

      // Handle different response formats
      let companyId;
      if (Array.isArray(searchData)) {
        companyId = searchData[0];
      } else if (searchData.hits?.hits) {
        companyId = searchData.hits.hits[0]._id || searchData.hits.hits[0]._source?.id;
      } else if (searchData.hits) {
        companyId = searchData.hits[0];
      }

      if (!companyId) {
        throw new Error('No company ID found in search results');
      }

      console.log(`📊 Found company ID: ${companyId}`);

      // Step 2: Collect full company profile
      console.log('📋 Step 2: Collecting full company profile...');
      const collectResponse = await fetch(`https://api.coresignal.com/cdapi/v2/company_multi_source/collect/${companyId}`, {
        method: 'GET',
        headers: {
          'apikey': this.apiKey,
          'Accept': 'application/json'
        }
      });

      if (!collectResponse.ok) {
        throw new Error(`Collect failed: ${collectResponse.status} ${collectResponse.statusText}`);
      }

      const companyData = await collectResponse.json();
      this.testResults.creditsUsed++;
      console.log('✅ Collection completed');

      // Step 3: Validate key data points
      console.log('🔍 Step 3: Validating company data...');
      
      const validations = {
        hasName: !!companyData.company_name,
        nameMatches: companyData.company_name?.toLowerCase().includes('nike'),
        hasEmployeeCount: !!companyData.company_employees_count,
        hasIndustry: !!companyData.company_industry,
        hasWebsite: !!companyData.website,
        websiteMatches: companyData.website?.includes('nike.com')
      };

      console.log('📊 Validation Results:');
      Object.entries(validations).forEach(([key, value]) => {
        console.log(`  ${value ? '✅' : '❌'} ${key}: ${value}`);
      });

      const allValid = Object.values(validations).every(v => v);
      
      if (!allValid) {
        throw new Error('Company data validation failed');
      }

      // Step 4: Display key information
      console.log('\n📋 Nike Company Profile:');
      console.log(`  Name: ${companyData.company_name}`);
      console.log(`  Website: ${companyData.website}`);
      console.log(`  Industry: ${companyData.company_industry}`);
      console.log(`  Employee Count: ${companyData.company_employees_count?.toLocaleString()}`);
      console.log(`  Size Range: ${companyData.company_size_range}`);
      console.log(`  Founded: ${companyData.company_founded_year}`);
      console.log(`  Location: ${companyData.company_hq_city}, ${companyData.company_hq_state}, ${companyData.company_hq_country}`);
      console.log(`  Categories: ${companyData.company_categories_and_keywords?.join(', ')}`);

      this.testResults.success = true;
      this.testResults.data = {
        name: companyData.company_name,
        website: companyData.website,
        industry: companyData.company_industry,
        employeeCount: companyData.company_employees_count,
        sizeRange: companyData.company_size_range,
        founded: companyData.company_founded_year,
        location: `${companyData.company_hq_city}, ${companyData.company_hq_state}, ${companyData.company_hq_country}`,
        categories: companyData.company_categories_and_keywords
      };

      console.log('\n✅ Test PASSED: Successfully found and validated Nike company profile');
      
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
  const test = new TestFindNikeCompany();
  test.run()
    .then(results => {
      process.exit(results.success ? 0 : 1);
    })
    .catch(error => {
      console.error('Test execution failed:', error);
      process.exit(1);
    });
}

module.exports = TestFindNikeCompany;
