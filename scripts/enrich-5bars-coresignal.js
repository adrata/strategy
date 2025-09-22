/**
 * 🎯 CORESIGNAL ENRICHMENT FOR 5BARS SERVICES
 * 
 * Searches for 5Bars Services in CoreSignal and collects comprehensive company data
 * Saves results as JSON for database updates
 */

const { PrismaClient } = require('@prisma/client');
const fs = require('fs').promises;
const path = require('path');

class CoreSignal5BarsEnrichment {
  constructor() {
    this.prisma = new PrismaClient();
    this.companyId = '01K5D5VGQ35SXGBPK5F2WSMFM2';
    this.companyName = '5Bars Services';
    this.website = 'https://www.5bars.net/';
    
    // CoreSignal API configuration
    this.config = {
      apiKey: process.env.CORESIGNAL_API_KEY,
      baseUrl: 'https://api.coresignal.com',
      maxRetries: 3,
      rateLimitDelay: 1000
    };
    
    this.creditsUsed = { search: 0, collect: 0 };
    this.results = {
      companyId: this.companyId,
      companyName: this.companyName,
      website: this.website,
      enrichmentDate: new Date().toISOString(),
      searchResults: [],
      companyData: null,
      historicalData: null,
      creditsUsed: this.creditsUsed,
      errors: []
    };
  }

  /**
   * 🚀 MAIN EXECUTION
   */
  async execute() {
    console.log('🎯 CORESIGNAL ENRICHMENT FOR 5BARS SERVICES');
    console.log('==========================================');
    console.log(`Company: ${this.companyName}`);
    console.log(`Website: ${this.website}`);
    console.log(`Company ID: ${this.companyId}`);
    console.log('');

    try {
      // Step 1: Get current company data from database
      await this.getCurrentCompanyData();
      
      // Step 2: Search for company in CoreSignal using multiple methods
      await this.searchCompanyInCoreSignal();
      
      // Step 3: Collect detailed company data if found
      if (this.results.searchResults.length > 0) {
        await this.collectCompanyData();
        await this.collectHistoricalData();
      }
      
      // Step 4: Save results to JSON file
      await this.saveResultsToFile();
      
      // Step 5: Display summary
      this.displaySummary();
      
      return this.results;

    } catch (error) {
      console.error('❌ Enrichment failed:', error);
      this.results.errors.push(error.message);
      await this.saveResultsToFile();
      throw error;
    } finally {
      await this.prisma.$disconnect();
    }
  }

  /**
   * 📊 STEP 1: Get current company data from database
   */
  async getCurrentCompanyData() {
    console.log('📊 STEP 1: Getting current company data from database...');
    
    try {
      const company = await this.prisma.companies.findUnique({
        where: { id: this.companyId },
        select: {
          id: true,
          name: true,
          website: true,
          industry: true,
          size: true,
          revenue: true,
          description: true,
          city: true,
          state: true,
          country: true,
          address: true,
          postalCode: true,
          tags: true,
          createdAt: true,
          updatedAt: true
        }
      });
      
      if (!company) {
        throw new Error('Company not found in database');
      }
      
      this.results.currentDatabaseData = company;
      console.log(`   ✅ Found company: ${company.name}`);
      console.log(`   📍 Location: ${company.city}, ${company.state || 'Unknown State'}`);
      console.log(`   🏭 Industry: ${company.industry || 'Unknown'}`);
      console.log(`   💰 Revenue: ${company.revenue ? `$${company.revenue.toLocaleString()}` : 'Unknown'}`);
      
    } catch (error) {
      console.error('   ❌ Database query failed:', error.message);
      throw error;
    }
  }

  /**
   * 🔍 STEP 2: Search for company in CoreSignal using multiple methods
   */
  async searchCompanyInCoreSignal() {
    console.log('\n🔍 STEP 2: Searching for company in CoreSignal...');
    
    // Method 1: Search by company name
    await this.searchByCompanyName();
    
    // Method 2: Search by website domain
    await this.searchByWebsite();
    
    // Method 3: Try shorthand name approach
    await this.searchByShorthand();
    
    // Method 4: Try Elasticsearch DSL search
    await this.searchByElasticsearch();
  }

  /**
   * Search by company name
   */
  async searchByCompanyName() {
    console.log('   🔍 Method 1: Searching by company name...');
    
    try {
      const searchQuery = {
        query: {
          query_string: {
            query: `"${this.companyName}"`,
            default_field: "company_name",
            default_operator: "and"
          }
        }
      };
      
      const results = await this.callCoreSignalAPI('/cdapi/v2/company_multi_source/search/es_dsl', searchQuery, 'POST');
      
      if (results && results.hits && results.hits.hits) {
        this.results.searchResults.push({
          method: 'company_name',
          query: this.companyName,
          results: results.hits.hits.map(hit => ({
            id: hit._id,
            score: hit._score,
            company_name: hit._source?.company_name,
            website: hit._source?.website,
            industry: hit._source?.industry
          }))
        });
        this.creditsUsed.search += 2;
        console.log(`   ✅ Found ${results.hits.hits.length} results by company name`);
      } else {
        console.log('   ⚠️ No results found by company name');
      }
      
    } catch (error) {
      console.error('   ❌ Company name search failed:', error.message);
      this.results.errors.push(`Company name search failed: ${error.message}`);
    }
  }

  /**
   * Search by website domain
   */
  async searchByWebsite() {
    console.log('   🔍 Method 2: Searching by website domain...');
    
    try {
      const domain = this.website.replace(/^https?:\/\//, '').replace(/^www\./, '');
      const searchQuery = {
        query: {
          query_string: {
            query: `"${domain}"`,
            default_field: "website",
            default_operator: "and"
          }
        }
      };
      
      const results = await this.callCoreSignalAPI('/cdapi/v2/company_multi_source/search/es_dsl', searchQuery, 'POST');
      
      if (results && results.hits && results.hits.hits) {
        this.results.searchResults.push({
          method: 'website',
          query: domain,
          results: results.hits.hits.map(hit => ({
            id: hit._id,
            score: hit._score,
            company_name: hit._source?.company_name,
            website: hit._source?.website,
            industry: hit._source?.industry
          }))
        });
        this.creditsUsed.search += 2;
        console.log(`   ✅ Found ${results.hits.hits.length} results by website`);
      } else {
        console.log('   ⚠️ No results found by website');
      }
      
    } catch (error) {
      console.error('   ❌ Website search failed:', error.message);
      this.results.errors.push(`Website search failed: ${error.message}`);
    }
  }

  /**
   * Search by shorthand name
   */
  async searchByShorthand() {
    console.log('   🔍 Method 3: Searching by shorthand name...');
    
    try {
      // Generate potential shorthand names
      const shorthandNames = [
        '5bars',
        '5-bars',
        'fivebars',
        'five-bars',
        '5bars-services',
        '5barsservices'
      ];
      
      for (const shorthand of shorthandNames) {
        try {
          const results = await this.callCoreSignalAPI(`/cdapi/v2/company_multi_source/collect/${shorthand}`, null, 'GET');
          
          if (results && results.company_name) {
            this.results.searchResults.push({
              method: 'shorthand',
              query: shorthand,
              results: [{
                id: shorthand,
                score: 1.0,
                company_name: results.company_name,
                website: results.website,
                industry: results.industry
              }]
            });
            this.creditsUsed.collect += 2;
            console.log(`   ✅ Found company by shorthand: ${shorthand}`);
            break;
          }
        } catch (error) {
          // Continue to next shorthand
        }
      }
      
    } catch (error) {
      console.error('   ❌ Shorthand search failed:', error.message);
      this.results.errors.push(`Shorthand search failed: ${error.message}`);
    }
  }

  /**
   * Search using Elasticsearch DSL with broader terms
   */
  async searchByElasticsearch() {
    console.log('   🔍 Method 4: Elasticsearch DSL with broader terms...');
    
    try {
      const searchQuery = {
        query: {
          bool: {
            should: [
              { match: { company_name: "5bars" } },
              { match: { company_name: "five bars" } },
              { match: { company_name: "5 bars" } },
              { match: { company_name: "5bars services" } },
              { match: { company_name: "five bars services" } },
              { match: { company_name: "5 bars services" } }
            ],
            minimum_should_match: 1
          }
        }
      };
      
      const results = await this.callCoreSignalAPI('/cdapi/v2/company_multi_source/search/es_dsl', searchQuery, 'POST');
      
      if (results && results.hits && results.hits.hits) {
        this.results.searchResults.push({
          method: 'elasticsearch_broad',
          query: 'multiple 5bars variations',
          results: results.hits.hits.map(hit => ({
            id: hit._id,
            score: hit._score,
            company_name: hit._source?.company_name,
            website: hit._source?.website,
            industry: hit._source?.industry
          }))
        });
        this.creditsUsed.search += 2;
        console.log(`   ✅ Found ${results.hits.hits.length} results with broad search`);
      } else {
        console.log('   ⚠️ No results found with broad search');
      }
      
    } catch (error) {
      console.error('   ❌ Elasticsearch broad search failed:', error.message);
      this.results.errors.push(`Elasticsearch broad search failed: ${error.message}`);
    }
  }

  /**
   * 📊 STEP 3: Collect detailed company data
   */
  async collectCompanyData() {
    console.log('\n📊 STEP 3: Collecting detailed company data...');
    
    // Get the best match from search results
    const bestMatch = this.getBestMatch();
    
    if (!bestMatch) {
      console.log('   ⚠️ No suitable match found for data collection');
      return;
    }
    
    console.log(`   🎯 Collecting data for: ${bestMatch.company_name} (ID: ${bestMatch.id})`);
    
    try {
      const companyData = await this.callCoreSignalAPI(`/cdapi/v2/company_multi_source/collect/${bestMatch.id}`, null, 'GET');
      
      if (companyData) {
        this.results.companyData = companyData;
        this.creditsUsed.collect += 2;
        console.log('   ✅ Company data collected successfully');
        console.log(`   📊 Company: ${companyData.company_name || 'Unknown'}`);
        console.log(`   🏭 Industry: ${companyData.industry || 'Unknown'}`);
        console.log(`   👥 Employees: ${companyData.employees_count || 'Unknown'}`);
        console.log(`   💰 Revenue: ${companyData.revenue_annual_range ? 
          `$${companyData.revenue_annual_range.annual_revenue_range_from || 0}M - $${companyData.revenue_annual_range.annual_revenue_range_to || 0}M` : 
          'Unknown'}`);
        console.log(`   🌍 HQ Country: ${companyData.hq_country || 'Unknown'}`);
      }
      
    } catch (error) {
      console.error('   ❌ Company data collection failed:', error.message);
      this.results.errors.push(`Company data collection failed: ${error.message}`);
    }
  }

  /**
   * 📈 STEP 4: Collect historical data
   */
  async collectHistoricalData() {
    console.log('\n📈 STEP 4: Collecting historical headcount data...');
    
    const bestMatch = this.getBestMatch();
    
    if (!bestMatch) {
      console.log('   ⚠️ No company ID available for historical data');
      return;
    }
    
    try {
      const historicalData = await this.callCoreSignalAPI(`/v2/historical_headcount/collect/${bestMatch.id}`, null, 'GET');
      
      if (historicalData && Array.isArray(historicalData)) {
        this.results.historicalData = historicalData;
        console.log(`   ✅ Historical data collected: ${historicalData.length} data points`);
        
        if (historicalData.length > 0) {
          const latest = historicalData[historicalData.length - 1];
          console.log(`   📊 Latest headcount: ${latest.employees_count || 'Unknown'} (${latest.date || 'Unknown date'})`);
        }
      } else {
        console.log('   ⚠️ No historical data available');
      }
      
    } catch (error) {
      console.error('   ❌ Historical data collection failed:', error.message);
      this.results.errors.push(`Historical data collection failed: ${error.message}`);
    }
  }

  /**
   * 💾 STEP 5: Save results to JSON file
   */
  async saveResultsToFile() {
    console.log('\n💾 STEP 5: Saving results to JSON file...');
    
    try {
      const filename = `5bars-coresignal-enrichment-${new Date().toISOString().replace(/[:.]/g, '-')}.json`;
      const filepath = path.join(process.cwd(), filename);
      
      // Update credits used in results
      this.results.creditsUsed = this.creditsUsed;
      
      await fs.writeFile(filepath, JSON.stringify(this.results, null, 2));
      
      console.log(`   ✅ Results saved to: ${filename}`);
      console.log(`   📁 Full path: ${filepath}`);
      
      // Also save a latest version
      const latestFilename = '5bars-coresignal-enrichment-latest.json';
      const latestFilepath = path.join(process.cwd(), latestFilename);
      await fs.writeFile(latestFilepath, JSON.stringify(this.results, null, 2));
      
      console.log(`   ✅ Latest version saved to: ${latestFilename}`);
      
    } catch (error) {
      console.error('   ❌ Failed to save results:', error.message);
      throw error;
    }
  }

  /**
   * 📋 Display summary
   */
  displaySummary() {
    console.log('\n📋 ENRICHMENT SUMMARY');
    console.log('====================');
    console.log(`Company: ${this.companyName}`);
    console.log(`Search Methods Used: ${this.results.searchResults.length}`);
    console.log(`Company Data Collected: ${this.results.companyData ? 'Yes' : 'No'}`);
    console.log(`Historical Data Collected: ${this.results.historicalData ? 'Yes' : 'No'}`);
    console.log(`Credits Used: ${this.creditsUsed.search} search + ${this.creditsUsed.collect} collect = ${this.creditsUsed.search + this.creditsUsed.collect} total`);
    console.log(`Errors: ${this.results.errors.length}`);
    
    if (this.results.errors.length > 0) {
      console.log('\n❌ Errors encountered:');
      this.results.errors.forEach((error, index) => {
        console.log(`   ${index + 1}. ${error}`);
      });
    }
    
    if (this.results.companyData) {
      console.log('\n🎯 Key Company Data Found:');
      console.log(`   Name: ${this.results.companyData.company_name || 'Unknown'}`);
      console.log(`   Industry: ${this.results.companyData.industry || 'Unknown'}`);
      console.log(`   Employees: ${this.results.companyData.employees_count || 'Unknown'}`);
      console.log(`   Website: ${this.results.companyData.website || 'Unknown'}`);
      console.log(`   HQ Country: ${this.results.companyData.hq_country || 'Unknown'}`);
    }
  }

  /**
   * Get the best match from search results
   */
  getBestMatch() {
    let bestMatch = null;
    let bestScore = 0;
    
    for (const searchResult of this.results.searchResults) {
      for (const result of searchResult.results) {
        if (result.score > bestScore) {
          bestMatch = result;
          bestScore = result.score;
        }
      }
    }
    
    return bestMatch;
  }

  /**
   * Make API call to CoreSignal
   */
  async callCoreSignalAPI(endpoint, params, method = 'GET') {
    const https = require('https');
    
    for (let attempt = 1; attempt <= this.config.maxRetries; attempt++) {
      try {
        let url = `${this.config.baseUrl}${endpoint}`;
        let options = {
          method: method,
          headers: {
            'apikey': this.config.apiKey,
            'Content-Type': 'application/json',
            'User-Agent': 'Adrata-5Bars-Enrichment/1.0'
          }
        };

        if (method === 'POST' && params) {
          options.body = JSON.stringify(params);
        } else if (method === 'GET' && params) {
          const queryString = new URLSearchParams(params).toString();
          url = `${url}?${queryString}`;
        }

        const response = await this.makeHttpRequest(url, options);
        
        if (response) {
          await this.delay(this.config.rateLimitDelay);
          return response;
        }

      } catch (error) {
        console.log(`   ⚠️ Attempt ${attempt} failed: ${error.message}`);
        
        if (attempt < this.config.maxRetries) {
          await this.delay(this.config.rateLimitDelay * 2);
        }
      }
    }

    throw new Error(`API call failed after ${this.config.maxRetries} attempts`);
  }

  /**
   * Make HTTP request
   */
  makeHttpRequest(url, options) {
    return new Promise((resolve, reject) => {
      const https = require('https');
      const urlObj = new URL(url);
      
      const requestOptions = {
        hostname: urlObj.hostname,
        port: urlObj.port || 443,
        path: urlObj.pathname + urlObj.search,
        method: options.method,
        headers: options.headers
      };

      const req = https.request(requestOptions, (res) => {
        let data = '';
        res.on('data', (chunk) => { data += chunk; });
        res.on('end', () => {
          if (res.statusCode >= 200 && res.statusCode < 300) {
            try {
              resolve(JSON.parse(data));
            } catch (e) {
              reject(new Error(`Invalid JSON response: ${data}`));
            }
          } else {
            reject(new Error(`HTTP ${res.statusCode}: ${data}`));
          }
        });
      });

      req.on('error', (error) => {
        reject(new Error(`Network error: ${error.message}`));
      });

      if (options.body) {
        req.write(options.body);
      }
      
      req.end();
    });
  }

  /**
   * Delay utility
   */
  delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

// Execute the enrichment
async function run5BarsEnrichment() {
  const enrichment = new CoreSignal5BarsEnrichment();
  const results = await enrichment.execute();
  
  console.log('\n🎉 5BARS CORESIGNAL ENRICHMENT COMPLETE!');
  console.log('Check the generated JSON files for the collected data.');
  
  return results;
}

// Export for use
module.exports = { CoreSignal5BarsEnrichment, run5BarsEnrichment };

// Run if called directly
if (require.main === module) {
  run5BarsEnrichment().catch(console.error);
}
