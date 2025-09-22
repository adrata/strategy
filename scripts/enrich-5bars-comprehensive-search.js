/**
 * 🎯 COMPREHENSIVE CORESIGNAL SEARCH FOR 5BARS SERVICES
 * 
 * Exhaustive search using multiple strategies to find 5Bars Services
 * Includes alternative names, broader searches, and fallback strategies
 */

const { PrismaClient } = require('@prisma/client');
const fs = require('fs').promises;
const path = require('path');

class Comprehensive5BarsSearch {
  constructor() {
    this.prisma = new PrismaClient();
    this.companyId = '01K5D5VGQ35SXGBPK5F2WSMFM2';
    this.companyName = '5Bars Services';
    this.website = 'https://www.5bars.net/';
    this.domain = '5bars.net';
    
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
      errors: [],
      alternativeNames: [],
      potentialMatches: []
    };
  }

  /**
   * 🚀 MAIN EXECUTION
   */
  async execute() {
    console.log('🎯 COMPREHENSIVE CORESIGNAL SEARCH FOR 5BARS SERVICES');
    console.log('====================================================');
    console.log(`Company: ${this.companyName}`);
    console.log(`Website: ${this.website}`);
    console.log(`Company ID: ${this.companyId}`);
    console.log('');

    try {
      // Step 1: Get current company data from database
      await this.getCurrentCompanyData();
      
      // Step 2: Try exact company name searches
      await this.searchByExactNames();
      
      // Step 3: Try website-based searches
      await this.searchByWebsite();
      
      // Step 4: Try location-based searches
      await this.searchByLocation();
      
      // Step 5: Try industry-based searches
      await this.searchByIndustry();
      
      // Step 6: Try alternative name variations
      await this.searchByAlternativeNames();
      
      // Step 7: Try broader telecommunications searches
      await this.searchByTelecomKeywords();
      
      // Step 8: Try Frisco, Texas company searches
      await this.searchByFriscoCompanies();
      
      // Step 9: Collect data if any matches found
      if (this.results.searchResults.length > 0) {
        await this.collectCompanyData();
        await this.collectHistoricalData();
      }
      
      // Step 10: Save results to JSON file
      await this.saveResultsToFile();
      
      // Step 11: Display comprehensive summary
      this.displaySummary();
      
      return this.results;

    } catch (error) {
      console.error('❌ Comprehensive search failed:', error);
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
      console.log(`   📍 Location: ${company.address || 'Unknown'}, ${company.city || 'Unknown'}, ${company.state || 'Unknown'} ${company.postalCode || ''}`);
      console.log(`   🏭 Industry: ${company.industry || 'Unknown'}`);
      console.log(`   💰 Revenue: ${company.revenue ? `$${company.revenue.toLocaleString()}` : 'Unknown'}`);
      console.log(`   🌐 Website: ${company.website || 'Unknown'}`);
      console.log(`   📝 Description: ${company.description || 'None'}`);
      
    } catch (error) {
      console.error('   ❌ Database query failed:', error.message);
      throw error;
    }
  }

  /**
   * 🔍 STEP 2: Search by exact company names
   */
  async searchByExactNames() {
    console.log('\n🔍 STEP 2: Searching by exact company names...');
    
    const exactNames = [
      '5Bars Services',
      '5Bars',
      '5 Bars Services',
      '5 Bars',
      'Five Bars Services',
      'Five Bars',
      '5BarsServices',
      '5Bars-Services',
      '5-Bars-Services',
      '5_Bars_Services'
    ];
    
    for (const name of exactNames) {
      try {
        const searchQuery = {
          query: {
            bool: {
              should: [
                { term: { "company_name.keyword": name } },
                { match: { "company_name": name } },
                { match_phrase: { "company_name": name } }
              ],
              minimum_should_match: 1
            }
          }
        };
        
        const results = await this.callCoreSignalAPI('/cdapi/v2/company_multi_source/search/es_dsl', searchQuery, 'POST');
        
        if (results && results.hits && results.hits.hits && results.hits.hits.length > 0) {
          this.results.searchResults.push({
            method: 'exact_name',
            query: name,
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
          console.log(`   ✅ Found ${results.hits.hits.length} results for: ${name}`);
        } else {
          console.log(`   ⚠️ No results found for: ${name}`);
        }
        
      } catch (error) {
        console.error(`   ❌ Search failed for ${name}:`, error.message);
        this.results.errors.push(`Exact name search failed for ${name}: ${error.message}`);
      }
    }
  }

  /**
   * 🔍 STEP 3: Search by website
   */
  async searchByWebsite() {
    console.log('\n🔍 STEP 3: Searching by website variations...');
    
    const websiteVariations = [
      'https://www.5bars.net/',
      'https://5bars.net/',
      'http://www.5bars.net/',
      'http://5bars.net/',
      'www.5bars.net',
      '5bars.net',
      '5bars.net/',
      'www.5bars.net/'
    ];
    
    for (const website of websiteVariations) {
      try {
        const searchQuery = {
          query: {
            bool: {
              should: [
                { term: { "website.keyword": website } },
                { wildcard: { "website": `*${website}*` } },
                { match: { "website": website } }
              ],
              minimum_should_match: 1
            }
          }
        };
        
        const results = await this.callCoreSignalAPI('/cdapi/v2/company_multi_source/search/es_dsl', searchQuery, 'POST');
        
        if (results && results.hits && results.hits.hits && results.hits.hits.length > 0) {
          this.results.searchResults.push({
            method: 'website',
            query: website,
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
          console.log(`   ✅ Found ${results.hits.hits.length} results for website: ${website}`);
        } else {
          console.log(`   ⚠️ No results found for website: ${website}`);
        }
        
      } catch (error) {
        console.error(`   ❌ Website search failed for ${website}:`, error.message);
        this.results.errors.push(`Website search failed for ${website}: ${error.message}`);
      }
    }
  }

  /**
   * 🔍 STEP 4: Search by location
   */
  async searchByLocation() {
    console.log('\n🔍 STEP 4: Searching by location...');
    
    const locationTerms = [
      'Frisco',
      'Texas',
      'TX',
      '75034',
      'Dallas',
      'DFW',
      'Dallas-Fort Worth',
      'North Texas'
    ];
    
    for (const location of locationTerms) {
      try {
        const searchQuery = {
          query: {
            bool: {
              should: [
                { match: { "hq_location": location } },
                { match: { "hq_city": location } },
                { match: { "hq_state": location } },
                { match: { "hq_zipcode": location } }
              ],
              minimum_should_match: 1
            }
          }
        };
        
        const results = await this.callCoreSignalAPI('/cdapi/v2/company_multi_source/search/es_dsl', searchQuery, 'POST');
        
        if (results && results.hits && results.hits.hits && results.hits.hits.length > 0) {
          // Filter for companies that might be related to 5Bars
          const filteredResults = results.hits.hits.filter(hit => {
            const companyName = hit._source?.company_name?.toLowerCase() || '';
            return companyName.includes('bars') || 
                   companyName.includes('5') || 
                   companyName.includes('five') ||
                   companyName.includes('telecom') ||
                   companyName.includes('communications');
          });
          
          if (filteredResults.length > 0) {
            this.results.searchResults.push({
              method: 'location',
              query: location,
              results: filteredResults.map(hit => ({
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
            console.log(`   ✅ Found ${filteredResults.length} relevant results for location: ${location}`);
          } else {
            console.log(`   ⚠️ No relevant results found for location: ${location}`);
          }
        } else {
          console.log(`   ⚠️ No results found for location: ${location}`);
        }
        
      } catch (error) {
        console.error(`   ❌ Location search failed for ${location}:`, error.message);
        this.results.errors.push(`Location search failed for ${location}: ${error.message}`);
      }
    }
  }

  /**
   * 🔍 STEP 5: Search by industry
   */
  async searchByIndustry() {
    console.log('\n🔍 STEP 5: Searching by industry...');
    
    const industries = [
      'Engineering',
      'Telecommunications',
      'Communications',
      'Technology',
      'Software',
      'IT Services',
      'Network Services',
      'Wireless',
      'Broadband',
      'Internet Services'
    ];
    
    for (const industry of industries) {
      try {
        const searchQuery = {
          query: {
            bool: {
              must: [
                { match: { "industry": industry } }
              ],
              should: [
                { match: { "hq_location": "Frisco" } },
                { match: { "hq_location": "Texas" } },
                { match: { "hq_location": "TX" } },
                { match: { "company_name": "bars" } },
                { match: { "company_name": "5" } }
              ],
              minimum_should_match: 1
            }
          }
        };
        
        const results = await this.callCoreSignalAPI('/cdapi/v2/company_multi_source/search/es_dsl', searchQuery, 'POST');
        
        if (results && results.hits && results.hits.hits && results.hits.hits.length > 0) {
          // Filter for companies that might be related to 5Bars
          const filteredResults = results.hits.hits.filter(hit => {
            const companyName = hit._source?.company_name?.toLowerCase() || '';
            const location = hit._source?.hq_location?.toLowerCase() || '';
            return (companyName.includes('bars') || companyName.includes('5')) &&
                   (location.includes('frisco') || location.includes('texas') || location.includes('tx'));
          });
          
          if (filteredResults.length > 0) {
            this.results.searchResults.push({
              method: 'industry',
              query: industry,
              results: filteredResults.map(hit => ({
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
            console.log(`   ✅ Found ${filteredResults.length} relevant results for industry: ${industry}`);
          } else {
            console.log(`   ⚠️ No relevant results found for industry: ${industry}`);
          }
        } else {
          console.log(`   ⚠️ No results found for industry: ${industry}`);
        }
        
      } catch (error) {
        console.error(`   ❌ Industry search failed for ${industry}:`, error.message);
        this.results.errors.push(`Industry search failed for ${industry}: ${error.message}`);
      }
    }
  }

  /**
   * 🔍 STEP 6: Search by alternative names
   */
  async searchByAlternativeNames() {
    console.log('\n🔍 STEP 6: Searching by alternative names...');
    
    const alternativeNames = [
      'Bars Services',
      'Bars',
      'Five',
      '5',
      'Services',
      'Telecom Services',
      'Communication Services',
      'Network Services',
      'Wireless Services',
      'Broadband Services'
    ];
    
    for (const name of alternativeNames) {
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
            method: 'alternative_name',
            query: name,
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
          console.log(`   ✅ Found ${results.hits.hits.length} results for alternative name: ${name}`);
        } else {
          console.log(`   ⚠️ No results found for alternative name: ${name}`);
        }
        
      } catch (error) {
        console.error(`   ❌ Alternative name search failed for ${name}:`, error.message);
        this.results.errors.push(`Alternative name search failed for ${name}: ${error.message}`);
      }
    }
  }

  /**
   * 🔍 STEP 7: Search by telecom keywords
   */
  async searchByTelecomKeywords() {
    console.log('\n🔍 STEP 7: Searching by telecommunications keywords...');
    
    const telecomKeywords = [
      'telecommunications',
      'telecom',
      'communications',
      'wireless',
      'broadband',
      'network',
      'internet',
      'cable',
      'fiber',
      'satellite',
      'mobile',
      'cellular',
      '5g',
      '4g',
      'lte'
    ];
    
    for (const keyword of telecomKeywords) {
      try {
        const searchQuery = {
          query: {
            bool: {
              must: [
                {
                  bool: {
                    should: [
                      { match: { "company_name": keyword } },
                      { match: { "industry": keyword } },
                      { match: { "description": keyword } }
                    ],
                    minimum_should_match: 1
                  }
                }
              ],
              should: [
                { match: { "hq_location": "Frisco" } },
                { match: { "hq_location": "Texas" } },
                { match: { "hq_location": "TX" } },
                { match: { "company_name": "bars" } },
                { match: { "company_name": "5" } }
              ],
              minimum_should_match: 1
            }
          }
        };
        
        const results = await this.callCoreSignalAPI('/cdapi/v2/company_multi_source/search/es_dsl', searchQuery, 'POST');
        
        if (results && results.hits && results.hits.hits && results.hits.hits.length > 0) {
          // Filter for companies that might be related to 5Bars
          const filteredResults = results.hits.hits.filter(hit => {
            const companyName = hit._source?.company_name?.toLowerCase() || '';
            const location = hit._source?.hq_location?.toLowerCase() || '';
            return (companyName.includes('bars') || companyName.includes('5')) &&
                   (location.includes('frisco') || location.includes('texas') || location.includes('tx'));
          });
          
          if (filteredResults.length > 0) {
            this.results.searchResults.push({
              method: 'telecom_keyword',
              query: keyword,
              results: filteredResults.map(hit => ({
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
            console.log(`   ✅ Found ${filteredResults.length} relevant results for telecom keyword: ${keyword}`);
          } else {
            console.log(`   ⚠️ No relevant results found for telecom keyword: ${keyword}`);
          }
        } else {
          console.log(`   ⚠️ No results found for telecom keyword: ${keyword}`);
        }
        
      } catch (error) {
        console.error(`   ❌ Telecom keyword search failed for ${keyword}:`, error.message);
        this.results.errors.push(`Telecom keyword search failed for ${keyword}: ${error.message}`);
      }
    }
  }

  /**
   * 🔍 STEP 8: Search by Frisco companies
   */
  async searchByFriscoCompanies() {
    console.log('\n🔍 STEP 8: Searching by Frisco companies...');
    
    try {
      const searchQuery = {
        query: {
          bool: {
            must: [
              { match: { "hq_location": "Frisco" } }
            ]
          }
        },
        size: 100 // Get more results to filter through
      };
      
      const results = await this.callCoreSignalAPI('/cdapi/v2/company_multi_source/search/es_dsl', searchQuery, 'POST');
      
      if (results && results.hits && results.hits.hits && results.hits.hits.length > 0) {
        // Filter for companies that might be related to 5Bars
        const filteredResults = results.hits.hits.filter(hit => {
          const companyName = hit._source?.company_name?.toLowerCase() || '';
          const industry = hit._source?.industry?.toLowerCase() || '';
          return companyName.includes('bars') || 
                 companyName.includes('5') || 
                 companyName.includes('five') ||
                 industry.includes('telecom') ||
                 industry.includes('communications') ||
                 industry.includes('engineering');
        });
        
        if (filteredResults.length > 0) {
          this.results.searchResults.push({
            method: 'frisco_companies',
            query: 'Frisco companies',
            results: filteredResults.map(hit => ({
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
          console.log(`   ✅ Found ${filteredResults.length} relevant companies in Frisco`);
        } else {
          console.log(`   ⚠️ No relevant companies found in Frisco`);
        }
      } else {
        console.log(`   ⚠️ No companies found in Frisco`);
      }
      
    } catch (error) {
      console.error(`   ❌ Frisco companies search failed:`, error.message);
      this.results.errors.push(`Frisco companies search failed: ${error.message}`);
    }
  }

  /**
   * 📊 STEP 9: Collect detailed company data
   */
  async collectCompanyData() {
    console.log('\n📊 STEP 9: Collecting detailed company data...');
    
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
   * 📈 STEP 10: Collect historical data
   */
  async collectHistoricalData() {
    console.log('\n📈 STEP 10: Collecting historical headcount data...');
    
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
   * 💾 STEP 11: Save results to JSON file
   */
  async saveResultsToFile() {
    console.log('\n💾 STEP 11: Saving results to JSON file...');
    
    try {
      const filename = `5bars-comprehensive-search-${new Date().toISOString().replace(/[:.]/g, '-')}.json`;
      const filepath = path.join(process.cwd(), filename);
      
      // Update credits used in results
      this.results.creditsUsed = this.creditsUsed;
      
      await fs.writeFile(filepath, JSON.stringify(this.results, null, 2));
      
      console.log(`   ✅ Results saved to: ${filename}`);
      console.log(`   📁 Full path: ${filepath}`);
      
      // Also save a latest version
      const latestFilename = '5bars-comprehensive-search-latest.json';
      const latestFilepath = path.join(process.cwd(), latestFilename);
      await fs.writeFile(latestFilepath, JSON.stringify(this.results, null, 2));
      
      console.log(`   ✅ Latest version saved to: ${latestFilename}`);
      
    } catch (error) {
      console.error('   ❌ Failed to save results:', error.message);
      throw error;
    }
  }

  /**
   * 📋 Display comprehensive summary
   */
  displaySummary() {
    console.log('\n📋 COMPREHENSIVE SEARCH SUMMARY');
    console.log('================================');
    console.log(`Company: ${this.companyName}`);
    console.log(`Website: ${this.website}`);
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
    } else {
      console.log('\n⚠️ No search results found - 5Bars Services may not be in CoreSignal database');
      console.log('   This could mean:');
      console.log('   - Company is too small/private for CoreSignal coverage');
      console.log('   - Company is listed under a different name');
      console.log('   - Company data is not available in CoreSignal');
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
            'User-Agent': 'Adrata-5Bars-Comprehensive-Search/1.0'
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

// Execute the comprehensive search
async function runComprehensive5BarsSearch() {
  const search = new Comprehensive5BarsSearch();
  const results = await search.execute();
  
  console.log('\n🎉 COMPREHENSIVE 5BARS SEARCH COMPLETE!');
  console.log('Check the generated JSON files for the collected data.');
  
  return results;
}

// Export for use
module.exports = { Comprehensive5BarsSearch, runComprehensive5BarsSearch };

// Run if called directly
if (require.main === module) {
  runComprehensive5BarsSearch().catch(console.error);
}
