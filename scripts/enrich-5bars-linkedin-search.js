/**
 * 🎯 CORESIGNAL SEARCH USING LINKEDIN COMPANY NAME
 * 
 * Searches CoreSignal using the LinkedIn company name "5 Bars Services LLC"
 */

const { PrismaClient } = require('@prisma/client');
const fs = require('fs').promises;
const path = require('path');

class LinkedIn5BarsSearch {
  constructor() {
    this.prisma = new PrismaClient();
    this.companyId = '01K5D5VGQ35SXGBPK5F2WSMFM2';
    this.linkedinCompanyName = '5 Bars Services LLC';
    this.linkedinUrl = 'https://www.linkedin.com/company/5-bars-services-llc/';
    
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
      linkedinCompanyName: this.linkedinCompanyName,
      linkedinUrl: this.linkedinUrl,
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
    console.log('🎯 CORESIGNAL SEARCH USING LINKEDIN COMPANY NAME');
    console.log('===============================================');
    console.log(`LinkedIn Company Name: ${this.linkedinCompanyName}`);
    console.log(`LinkedIn URL: ${this.linkedinUrl}`);
    console.log(`Company ID: ${this.companyId}`);
    console.log('');

    try {
      // Step 1: Get current company data from database
      await this.getCurrentCompanyData();
      
      // Step 2: Search by LinkedIn company name variations
      await this.searchByLinkedInName();
      
      // Step 3: Search by LinkedIn URL
      await this.searchByLinkedInUrl();
      
      // Step 4: Search by LLC variations
      await this.searchByLLCVariations();
      
      // Step 5: Collect data if found
      if (this.results.searchResults.length > 0) {
        await this.collectCompanyData();
        await this.collectHistoricalData();
      }
      
      // Step 6: Save results to JSON file
      await this.saveResultsToFile();
      
      // Step 7: Display summary
      this.displaySummary();
      
      return this.results;

    } catch (error) {
      console.error('❌ LinkedIn search failed:', error);
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
          customFields: true,
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
      console.log(`   📍 Location: ${company.address || 'Unknown'}, ${company.city || 'Unknown'}, ${company.state || 'Unknown'} ${company.postalCode || ''}`);
      console.log(`   🏭 Industry: ${company.industry || 'Unknown'}`);
      console.log(`   💰 Revenue: ${company.revenue ? `$${company.revenue.toLocaleString()}` : 'Unknown'}`);
      console.log(`   🌐 Website: ${company.website || 'Unknown'}`);
      console.log(`   📝 Description: ${company.description || 'None'}`);
      console.log(`   🔗 LinkedIn: ${company.customFields?.linkedinUrl || 'None'}`);
      
    } catch (error) {
      console.error('   ❌ Database query failed:', error.message);
      throw error;
    }
  }

  /**
   * 🔍 STEP 2: Search by LinkedIn company name variations
   */
  async searchByLinkedInName() {
    console.log('\n🔍 STEP 2: Searching by LinkedIn company name variations...');
    
    const nameVariations = [
      '5 Bars Services LLC',
      '5 Bars Services',
      '5 Bars',
      'Five Bars Services LLC',
      'Five Bars Services',
      'Five Bars',
      '5Bars Services LLC',
      '5Bars Services',
      '5Bars',
      '5-Bars-Services-LLC',
      '5_Bars_Services_LLC',
      '5BarsServicesLLC',
      '5BarsServices'
    ];
    
    for (const name of nameVariations) {
      try {
        const searchQuery = {
          query: {
            bool: {
              should: [
                { term: { "company_name.keyword": name } },
                { match: { "company_name": name } },
                { match_phrase: { "company_name": name } },
                { wildcard: { "company_name": `*${name}*` } }
              ],
              minimum_should_match: 1
            }
          }
        };
        
        const results = await this.callCoreSignalAPI('/cdapi/v2/company_multi_source/search/es_dsl', searchQuery, 'POST');
        
        if (results && results.hits && results.hits.hits && results.hits.hits.length > 0) {
          this.results.searchResults.push({
            method: 'linkedin_name',
            query: name,
            results: results.hits.hits.map(hit => ({
              id: hit._id,
              score: hit._score,
              company_name: hit._source?.company_name,
              website: hit._source?.website,
              industry: hit._source?.industry,
              hq_country: hit._source?.hq_country,
              hq_location: hit._source?.hq_location,
              linkedin_url: hit._source?.linkedin_url
            }))
          });
          this.creditsUsed.search += 2;
          console.log(`   ✅ Found ${results.hits.hits.length} results for: ${name}`);
        } else {
          console.log(`   ⚠️ No results found for: ${name}`);
        }
        
      } catch (error) {
        console.error(`   ❌ Search failed for ${name}:`, error.message);
        this.results.errors.push(`LinkedIn name search failed for ${name}: ${error.message}`);
      }
    }
  }

  /**
   * 🔍 STEP 3: Search by LinkedIn URL
   */
  async searchByLinkedInUrl() {
    console.log('\n🔍 STEP 3: Searching by LinkedIn URL...');
    
    try {
      const searchQuery = {
        query: {
          bool: {
            should: [
              { term: { "linkedin_url.keyword": this.linkedinUrl } },
              { match: { "linkedin_url": this.linkedinUrl } },
              { wildcard: { "linkedin_url": `*${this.linkedinUrl}*` } },
              { match: { "linkedin_url": "5-bars-services-llc" } }
            ],
            minimum_should_match: 1
          }
        }
      };
      
      const results = await this.callCoreSignalAPI('/cdapi/v2/company_multi_source/search/es_dsl', searchQuery, 'POST');
      
      if (results && results.hits && results.hits.hits && results.hits.hits.length > 0) {
        this.results.searchResults.push({
          method: 'linkedin_url',
          query: this.linkedinUrl,
          results: results.hits.hits.map(hit => ({
            id: hit._id,
            score: hit._score,
            company_name: hit._source?.company_name,
            website: hit._source?.website,
            industry: hit._source?.industry,
            hq_country: hit._source?.hq_country,
            hq_location: hit._source?.hq_location,
            linkedin_url: hit._source?.linkedin_url
          }))
        });
        this.creditsUsed.search += 2;
        console.log(`   ✅ Found ${results.hits.hits.length} results for LinkedIn URL`);
      } else {
        console.log(`   ⚠️ No results found for LinkedIn URL`);
      }
      
    } catch (error) {
      console.error(`   ❌ LinkedIn URL search failed:`, error.message);
      this.results.errors.push(`LinkedIn URL search failed: ${error.message}`);
    }
  }

  /**
   * 🔍 STEP 4: Search by LLC variations
   */
  async searchByLLCVariations() {
    console.log('\n🔍 STEP 4: Searching by LLC variations...');
    
    const llcVariations = [
      '5 Bars LLC',
      '5Bars LLC',
      'Five Bars LLC',
      '5 Bars Services',
      '5Bars Services',
      'Five Bars Services',
      'Bars Services LLC',
      'Bars LLC'
    ];
    
    for (const name of llcVariations) {
      try {
        const searchQuery = {
          query: {
            bool: {
              must: [
                { match: { "company_name": name } }
              ],
              should: [
                { match: { "hq_location": "Frisco" } },
                { match: { "hq_location": "Texas" } },
                { match: { "hq_location": "TX" } },
                { match: { "hq_country": "United States" } },
                { match: { "hq_country": "USA" } },
                { match: { "hq_country": "US" } },
                { match: { "industry": "Engineering" } },
                { match: { "industry": "Telecommunications" } }
              ],
              minimum_should_match: 1
            }
          }
        };
        
        const results = await this.callCoreSignalAPI('/cdapi/v2/company_multi_source/search/es_dsl', searchQuery, 'POST');
        
        if (results && results.hits && results.hits.hits && results.hits.hits.length > 0) {
          this.results.searchResults.push({
            method: 'llc_variation',
            query: name,
            results: results.hits.hits.map(hit => ({
              id: hit._id,
              score: hit._score,
              company_name: hit._source?.company_name,
              website: hit._source?.website,
              industry: hit._source?.industry,
              hq_country: hit._source?.hq_country,
              hq_location: hit._source?.hq_location,
              linkedin_url: hit._source?.linkedin_url
            }))
          });
          this.creditsUsed.search += 2;
          console.log(`   ✅ Found ${results.hits.hits.length} results for LLC variation: ${name}`);
        } else {
          console.log(`   ⚠️ No results found for LLC variation: ${name}`);
        }
        
      } catch (error) {
        console.error(`   ❌ LLC variation search failed for ${name}:`, error.message);
        this.results.errors.push(`LLC variation search failed for ${name}: ${error.message}`);
      }
    }
  }

  /**
   * 📊 STEP 5: Collect detailed company data
   */
  async collectCompanyData() {
    console.log('\n📊 STEP 5: Collecting detailed company data...');
    
    // Get the best match from search results
    const bestMatch = this.getBestMatch();
    
    if (!bestMatch) {
      console.log('   ⚠️ No suitable match found for data collection');
      return;
    }
    
    console.log(`   🎯 Collecting data for: ${bestMatch.company_name} (ID: ${bestMatch.id})`);
    console.log(`   📍 Location: ${bestMatch.hq_location || 'Unknown'}`);
    console.log(`   🌍 Country: ${bestMatch.hq_country || 'Unknown'}`);
    console.log(`   🔗 LinkedIn: ${bestMatch.linkedin_url || 'Unknown'}`);
    
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
        console.log(`   🔗 LinkedIn: ${companyData.linkedin_url || 'Unknown'}`);
      }
      
    } catch (error) {
      console.error('   ❌ Company data collection failed:', error.message);
      this.results.errors.push(`Company data collection failed: ${error.message}`);
    }
  }

  /**
   * 📈 STEP 6: Collect historical data
   */
  async collectHistoricalData() {
    console.log('\n📈 STEP 6: Collecting historical headcount data...');
    
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
   * 💾 STEP 7: Save results to JSON file
   */
  async saveResultsToFile() {
    console.log('\n💾 STEP 7: Saving results to JSON file...');
    
    try {
      const filename = `5bars-linkedin-search-${new Date().toISOString().replace(/[:.]/g, '-')}.json`;
      const filepath = path.join(process.cwd(), filename);
      
      // Update credits used in results
      this.results.creditsUsed = this.creditsUsed;
      
      await fs.writeFile(filepath, JSON.stringify(this.results, null, 2));
      
      console.log(`   ✅ Results saved to: ${filename}`);
      console.log(`   📁 Full path: ${filepath}`);
      
      // Also save a latest version
      const latestFilename = '5bars-linkedin-search-latest.json';
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
    console.log('\n📋 LINKEDIN SEARCH SUMMARY');
    console.log('==========================');
    console.log(`LinkedIn Company Name: ${this.linkedinCompanyName}`);
    console.log(`LinkedIn URL: ${this.linkedinUrl}`);
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
      console.log(`   LinkedIn: ${this.results.companyData.linkedin_url || 'Unknown'}`);
      
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
    } else {
      console.log('\n⚠️ No search results found - 5 Bars Services LLC may not be in CoreSignal database');
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
    
    const linkedinMatch = companyData.linkedin_url && 
      companyData.linkedin_url.includes('5-bars-services-llc');
    
    const locationMatch = companyData.hq_country && 
      (companyData.hq_country.toLowerCase().includes('united states') ||
       companyData.hq_country.toLowerCase().includes('usa') ||
       companyData.hq_country.toLowerCase().includes('us'));
    
    const texasMatch = companyData.hq_location && 
      (companyData.hq_location.toLowerCase().includes('texas') ||
       companyData.hq_location.toLowerCase().includes('tx') ||
       companyData.hq_location.toLowerCase().includes('frisco'));
    
    return (nameMatch || websiteMatch || linkedinMatch) && locationMatch && texasMatch;
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
            'User-Agent': 'Adrata-5Bars-LinkedIn-Search/1.0'
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

// Execute the LinkedIn search
async function runLinkedIn5BarsSearch() {
  const search = new LinkedIn5BarsSearch();
  const results = await search.execute();
  
  console.log('\n🎉 LINKEDIN 5BARS SEARCH COMPLETE!');
  console.log('Check the generated JSON files for the collected data.');
  
  return results;
}

// Export for use
module.exports = { LinkedIn5BarsSearch, runLinkedIn5BarsSearch };

// Run if called directly
if (require.main === module) {
  runLinkedIn5BarsSearch().catch(console.error);
}
