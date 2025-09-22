/**
 * 🎯 REFINED CORESIGNAL SEARCH FOR 5BARS SERVICES (TEXAS)
 * 
 * Focused search for the correct US-based 5Bars Services company
 * Located at: 5 Cowboys Way Suite 300, Frisco, TX 75034
 * Website: https://www.5bars.net/
 */

const { PrismaClient } = require('@prisma/client');
const fs = require('fs').promises;
const path = require('path');

class Refined5BarsSearch {
  constructor() {
    this.prisma = new PrismaClient();
    this.companyId = '01K5D5VGQ35SXGBPK5F2WSMFM2';
    this.companyName = '5Bars Services';
    this.website = 'https://www.5bars.net/';
    this.domain = '5bars.net';
    this.location = {
      address: '5 Cowboys Way Suite 300',
      city: 'Frisco',
      state: 'TX',
      zip: '75034',
      country: 'United States'
    };
    
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
      location: this.location,
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
    console.log('🎯 REFINED CORESIGNAL SEARCH FOR 5BARS SERVICES (TEXAS)');
    console.log('=====================================================');
    console.log(`Company: ${this.companyName}`);
    console.log(`Website: ${this.website}`);
    console.log(`Domain: ${this.domain}`);
    console.log(`Location: ${this.location.address}, ${this.location.city}, ${this.location.state} ${this.location.zip}`);
    console.log(`Company ID: ${this.companyId}`);
    console.log('');

    try {
      // Step 1: Get current company data from database
      await this.getCurrentCompanyData();
      
      // Step 2: Search by exact website domain
      await this.searchByExactWebsite();
      
      // Step 3: Search by domain variations
      await this.searchByDomainVariations();
      
      // Step 4: Search by location + company name
      await this.searchByLocationAndName();
      
      // Step 5: Search by Texas telecommunications companies
      await this.searchByTexasTelecom();
      
      // Step 6: Collect detailed data if found
      if (this.results.searchResults.length > 0) {
        await this.collectCompanyData();
        await this.collectHistoricalData();
      }
      
      // Step 7: Save results to JSON file
      await this.saveResultsToFile();
      
      // Step 8: Display summary
      this.displaySummary();
      
      return this.results;

    } catch (error) {
      console.error('❌ Refined search failed:', error);
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
      console.log(`   📍 Location: ${company.address}, ${company.city}, ${company.state || 'Unknown State'} ${company.postalCode}`);
      console.log(`   🏭 Industry: ${company.industry || 'Unknown'}`);
      console.log(`   💰 Revenue: ${company.revenue ? `$${company.revenue.toLocaleString()}` : 'Unknown'}`);
      
    } catch (error) {
      console.error('   ❌ Database query failed:', error.message);
      throw error;
    }
  }

  /**
   * 🔍 STEP 2: Search by exact website domain
   */
  async searchByExactWebsite() {
    console.log('\n🔍 STEP 2: Searching by exact website domain...');
    
    try {
      const searchQuery = {
        query: {
          bool: {
            must: [
              {
                term: {
                  "website.keyword": this.website
                }
              }
            ]
          }
        }
      };
      
      const results = await this.callCoreSignalAPI('/cdapi/v2/company_multi_source/search/es_dsl', searchQuery, 'POST');
      
      if (results && results.hits && results.hits.hits && results.hits.hits.length > 0) {
        this.results.searchResults.push({
          method: 'exact_website',
          query: this.website,
          results: results.hits.hits.map(hit => ({
            id: hit._id,
            score: hit._score,
            company_name: hit._source?.company_name,
            website: hit._source?.website,
            industry: hit._source?.industry,
            hq_country: hit._source?.hq_country,
            hq_location: hit._source?.hq_location
          }))
        });
        this.creditsUsed.search += 2;
        console.log(`   ✅ Found ${results.hits.hits.length} results by exact website`);
      } else {
        console.log('   ⚠️ No results found by exact website');
      }
      
    } catch (error) {
      console.error('   ❌ Exact website search failed:', error.message);
      this.results.errors.push(`Exact website search failed: ${error.message}`);
    }
  }

  /**
   * 🔍 STEP 3: Search by domain variations
   */
  async searchByDomainVariations() {
    console.log('\n🔍 STEP 3: Searching by domain variations...');
    
    const domainVariations = [
      this.domain,
      `www.${this.domain}`,
      `https://${this.domain}`,
      `https://www.${this.domain}`,
      `http://${this.domain}`,
      `http://www.${this.domain}`
    ];
    
    for (const domain of domainVariations) {
      try {
        const searchQuery = {
          query: {
            bool: {
              should: [
                { term: { "website.keyword": domain } },
                { wildcard: { "website": `*${domain}*` } },
                { match: { "website": domain } }
              ],
              minimum_should_match: 1
            }
          }
        };
        
        const results = await this.callCoreSignalAPI('/cdapi/v2/company_multi_source/search/es_dsl', searchQuery, 'POST');
        
        if (results && results.hits && results.hits.hits && results.hits.hits.length > 0) {
          this.results.searchResults.push({
            method: 'domain_variation',
            query: domain,
            results: results.hits.hits.map(hit => ({
              id: hit._id,
              score: hit._score,
              company_name: hit._source?.company_name,
              website: hit._source?.website,
              industry: hit._source?.industry,
              hq_country: hit._source?.hq_country,
              hq_location: hit._source?.hq_location
            }))
          });
          this.creditsUsed.search += 2;
          console.log(`   ✅ Found ${results.hits.hits.length} results for domain: ${domain}`);
        } else {
          console.log(`   ⚠️ No results found for domain: ${domain}`);
        }
        
      } catch (error) {
        console.error(`   ❌ Domain variation search failed for ${domain}:`, error.message);
        this.results.errors.push(`Domain variation search failed for ${domain}: ${error.message}`);
      }
    }
  }

  /**
   * 🔍 STEP 4: Search by location + company name
   */
  async searchByLocationAndName() {
    console.log('\n🔍 STEP 4: Searching by location + company name...');
    
    try {
      const searchQuery = {
        query: {
          bool: {
            must: [
              {
                bool: {
                  should: [
                    { match: { "company_name": "5bars" } },
                    { match: { "company_name": "5 bars" } },
                    { match: { "company_name": "five bars" } },
                    { match: { "company_name": "5bars services" } },
                    { match: { "company_name": "5 bars services" } },
                    { match: { "company_name": "five bars services" } }
                  ],
                  minimum_should_match: 1
                }
              }
            ],
            should: [
              { match: { "hq_location": "Frisco" } },
              { match: { "hq_location": "Texas" } },
              { match: { "hq_location": "TX" } },
              { match: { "hq_country": "United States" } },
              { match: { "hq_country": "USA" } },
              { match: { "hq_country": "US" } }
            ],
            minimum_should_match: 1
          }
        }
      };
      
      const results = await this.callCoreSignalAPI('/cdapi/v2/company_multi_source/search/es_dsl', searchQuery, 'POST');
      
      if (results && results.hits && results.hits.hits && results.hits.hits.length > 0) {
        this.results.searchResults.push({
          method: 'location_and_name',
          query: '5bars + Texas/Frisco',
          results: results.hits.hits.map(hit => ({
            id: hit._id,
            score: hit._score,
            company_name: hit._source?.company_name,
            website: hit._source?.website,
            industry: hit._source?.industry,
            hq_country: hit._source?.hq_country,
            hq_location: hit._source?.hq_location
          }))
        });
        this.creditsUsed.search += 2;
        console.log(`   ✅ Found ${results.hits.hits.length} results by location + name`);
      } else {
        console.log('   ⚠️ No results found by location + name');
      }
      
    } catch (error) {
      console.error('   ❌ Location + name search failed:', error.message);
      this.results.errors.push(`Location + name search failed: ${error.message}`);
    }
  }

  /**
   * 🔍 STEP 5: Search by Texas telecommunications companies
   */
  async searchByTexasTelecom() {
    console.log('\n🔍 STEP 5: Searching by Texas telecommunications companies...');
    
    try {
      const searchQuery = {
        query: {
          bool: {
            must: [
              {
                bool: {
                  should: [
                    { match: { "hq_location": "Frisco" } },
                    { match: { "hq_location": "Texas" } },
                    { match: { "hq_location": "TX" } }
                  ],
                  minimum_should_match: 1
                }
              },
              {
                bool: {
                  should: [
                    { match: { "industry": "Telecommunications" } },
                    { match: { "industry": "Engineering" } },
                    { match: { "industry": "Technology" } },
                    { match: { "industry": "Communications" } }
                  ],
                  minimum_should_match: 1
                }
              }
            ],
            should: [
              { match: { "company_name": "5bars" } },
              { match: { "company_name": "5 bars" } },
              { match: { "company_name": "five bars" } },
              { match: { "company_name": "bars" } }
            ],
            minimum_should_match: 1
          }
        }
      };
      
      const results = await this.callCoreSignalAPI('/cdapi/v2/company_multi_source/search/es_dsl', searchQuery, 'POST');
      
      if (results && results.hits && results.hits.hits && results.hits.hits.length > 0) {
        this.results.searchResults.push({
          method: 'texas_telecom',
          query: 'Texas + Telecommunications + bars',
          results: results.hits.hits.map(hit => ({
            id: hit._id,
            score: hit._score,
            company_name: hit._source?.company_name,
            website: hit._source?.website,
            industry: hit._source?.industry,
            hq_country: hit._source?.hq_country,
            hq_location: hit._source?.hq_location
          }))
        });
        this.creditsUsed.search += 2;
        console.log(`   ✅ Found ${results.hits.hits.length} results by Texas telecom search`);
      } else {
        console.log('   ⚠️ No results found by Texas telecom search');
      }
      
    } catch (error) {
      console.error('   ❌ Texas telecom search failed:', error.message);
      this.results.errors.push(`Texas telecom search failed: ${error.message}`);
    }
  }

  /**
   * 📊 STEP 6: Collect detailed company data
   */
  async collectCompanyData() {
    console.log('\n📊 STEP 6: Collecting detailed company data...');
    
    // Get the best match from search results
    const bestMatch = this.getBestMatch();
    
    if (!bestMatch) {
      console.log('   ⚠️ No suitable match found for data collection');
      return;
    }
    
    console.log(`   🎯 Collecting data for: ${bestMatch.company_name} (ID: ${bestMatch.id})`);
    console.log(`   📍 Location: ${bestMatch.hq_location || 'Unknown'}`);
    console.log(`   🌍 Country: ${bestMatch.hq_country || 'Unknown'}`);
    
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
        console.log(`   📍 HQ Location: ${companyData.hq_location || 'Unknown'}`);
        console.log(`   🌐 Website: ${companyData.website || 'Unknown'}`);
      }
      
    } catch (error) {
      console.error('   ❌ Company data collection failed:', error.message);
      this.results.errors.push(`Company data collection failed: ${error.message}`);
    }
  }

  /**
   * 📈 STEP 7: Collect historical data
   */
  async collectHistoricalData() {
    console.log('\n📈 STEP 7: Collecting historical headcount data...');
    
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
   * 💾 STEP 8: Save results to JSON file
   */
  async saveResultsToFile() {
    console.log('\n💾 STEP 8: Saving results to JSON file...');
    
    try {
      const filename = `5bars-refined-search-${new Date().toISOString().replace(/[:.]/g, '-')}.json`;
      const filepath = path.join(process.cwd(), filename);
      
      // Update credits used in results
      this.results.creditsUsed = this.creditsUsed;
      
      await fs.writeFile(filepath, JSON.stringify(this.results, null, 2));
      
      console.log(`   ✅ Results saved to: ${filename}`);
      console.log(`   📁 Full path: ${filepath}`);
      
      // Also save a latest version
      const latestFilename = '5bars-refined-search-latest.json';
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
    console.log('\n📋 REFINED SEARCH SUMMARY');
    console.log('=========================');
    console.log(`Company: ${this.companyName}`);
    console.log(`Website: ${this.website}`);
    console.log(`Location: ${this.location.city}, ${this.location.state}`);
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
      console.log(`   HQ Location: ${this.results.companyData.hq_location || 'Unknown'}`);
      
      // Check if this looks like the right company
      const isCorrectCompany = this.isCorrectCompany(this.results.companyData);
      console.log(`   🎯 Correct Company Match: ${isCorrectCompany ? 'YES' : 'NO'}`);
    }
    
    // Show all search results
    if (this.results.searchResults.length > 0) {
      console.log('\n🔍 All Search Results:');
      this.results.searchResults.forEach((searchResult, index) => {
        console.log(`   ${index + 1}. ${searchResult.method}: ${searchResult.results.length} results`);
        searchResult.results.forEach((result, resultIndex) => {
          console.log(`      ${resultIndex + 1}. ${result.company_name} (${result.hq_country || 'Unknown Country'}) - Score: ${result.score}`);
        });
      });
    }
  }

  /**
   * Check if the found company is the correct one
   */
  isCorrectCompany(companyData) {
    const nameMatch = companyData.company_name && 
      (companyData.company_name.toLowerCase().includes('5bars') || 
       companyData.company_name.toLowerCase().includes('5 bars') ||
       companyData.company_name.toLowerCase().includes('five bars'));
    
    const websiteMatch = companyData.website && 
      (companyData.website.includes('5bars.net') || 
       companyData.website.includes('5-bars.net'));
    
    const locationMatch = companyData.hq_country && 
      (companyData.hq_country.toLowerCase().includes('united states') ||
       companyData.hq_country.toLowerCase().includes('usa') ||
       companyData.hq_country.toLowerCase().includes('us'));
    
    const texasMatch = companyData.hq_location && 
      (companyData.hq_location.toLowerCase().includes('texas') ||
       companyData.hq_location.toLowerCase().includes('tx') ||
       companyData.hq_location.toLowerCase().includes('frisco'));
    
    return (nameMatch || websiteMatch) && locationMatch && texasMatch;
  }

  /**
   * Get the best match from search results
   */
  getBestMatch() {
    let bestMatch = null;
    let bestScore = 0;
    
    for (const searchResult of this.results.searchResults) {
      for (const result of searchResult.results) {
        // Prioritize matches that look like the correct company
        const isCorrect = this.isCorrectCompany(result);
        const adjustedScore = isCorrect ? result.score * 2 : result.score;
        
        if (adjustedScore > bestScore) {
          bestMatch = result;
          bestScore = adjustedScore;
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
            'User-Agent': 'Adrata-5Bars-Refined-Search/1.0'
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

// Execute the refined search
async function runRefined5BarsSearch() {
  const search = new Refined5BarsSearch();
  const results = await search.execute();
  
  console.log('\n🎉 REFINED 5BARS SEARCH COMPLETE!');
  console.log('Check the generated JSON files for the collected data.');
  
  return results;
}

// Export for use
module.exports = { Refined5BarsSearch, runRefined5BarsSearch };

// Run if called directly
if (require.main === module) {
  runRefined5BarsSearch().catch(console.error);
}
