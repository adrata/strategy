#!/usr/bin/env node

/**
 * 🧪 TEST CORESIGNAL COMPANY DATA
 * 
 * This script tests CoreSignal API to verify what company data we can actually get
 * for the Overview tab fields: Description, Size, Revenue, Founded Year, etc.
 */

const { PrismaClient } = require('@prisma/client');
const https = require('https');

const prisma = new PrismaClient();

// TOP Engineering Plus workspace ID
const TOP_WORKSPACE_ID = '01K5D01YCQJ9TJ7CT4DZDE79T1';

// CoreSignal API configuration
const CORESIGNAL_CONFIG = {
  apiKey: process.env.CORESIGNAL_API_KEY,
  baseUrl: 'https://api.coresignal.com/cdapi/v2'
};

class CoreSignalTester {
  constructor() {
    this.config = CORESIGNAL_CONFIG;
  }

  /**
   * Make API request to CoreSignal
   */
  async makeApiRequest(url, method = 'GET', data = null) {
    return new Promise((resolve, reject) => {
      const options = {
        method: method,
        headers: {
          'apikey': this.config.apiKey,
          'Content-Type': 'application/json'
        }
      };

      const req = https.request(url, options, (res) => {
        let responseData = '';
        
        res.on('data', (chunk) => {
          responseData += chunk;
        });
        
        res.on('end', () => {
          try {
            const parsedData = JSON.parse(responseData);
            if (res.statusCode >= 200 && res.statusCode < 300) {
              resolve(parsedData);
            } else {
              reject(new Error(`API Error ${res.statusCode}: ${parsedData.message || responseData}`));
            }
          } catch (error) {
            reject(new Error(`JSON Parse Error: ${error.message}`));
          }
        });
      });

      req.on('error', (error) => {
        reject(error);
      });

      if (data) {
        req.write(JSON.stringify(data));
      }
      
      req.end();
    });
  }

  /**
   * Search for company by name
   */
  async searchCompany(companyName, website = null) {
    const searchQuery = {
      query: {
        query_string: {
          query: companyName,
          default_field: "company_name",
          default_operator: "and"
        }
      }
    };

    const url = `${this.config.baseUrl}/company_multi_source/search/es_dsl`;
    console.log(`🔍 Searching for company: "${companyName}"`);
    if (website) console.log(`🌐 With website: "${website}"`);
    console.log(`📡 API URL: ${url}`);
    console.log(`📋 Query:`, JSON.stringify(searchQuery, null, 2));
    
    try {
      const response = await this.makeApiRequest(url, 'POST', searchQuery);
      console.log(`📊 Raw response:`, JSON.stringify(response, null, 2));
      
      // Handle different response formats
      if (Array.isArray(response)) {
        console.log(`✅ Search successful: Found ${response.length} company IDs\n`);
        return { companyIds: response };
      } else if (response.hits?.hits) {
        console.log(`✅ Search successful: Found ${response.hits.total?.value || 0} results\n`);
        return response;
      } else {
        console.log(`✅ Search successful: Found 0 results\n`);
        return { companyIds: [] };
      }
    } catch (error) {
      console.error(`❌ Search failed: ${error.message}\n`);
      return null;
    }
  }

  /**
   * Get detailed company data by ID
   */
  async getCompanyDetails(companyId) {
    const url = `${this.config.baseUrl}/company_multi_source/collect/${companyId}`;
    console.log(`📊 Getting company details for ID: ${companyId}`);
    console.log(`📡 API URL: ${url}`);
    
    try {
      const response = await this.makeApiRequest(url, 'GET');
      console.log(`✅ Company details retrieved successfully\n`);
      return response;
    } catch (error) {
      console.error(`❌ Company details failed: ${error.message}\n`);
      return null;
    }
  }

  /**
   * Extract relevant data for Overview tab
   */
  extractOverviewData(companyData) {
    if (!companyData) return null;

    const overviewData = {
      // Basic Info
      companyName: companyData.company_name || 'N/A',
      description: companyData.description || companyData.summary || 'N/A',
      website: companyData.website || companyData.domain || 'N/A',
      
      // Size & Revenue
      size: companyData.size_range || companyData.employees_count || 'N/A',
      employeeCount: companyData.employees_count || 'N/A',
      revenue: companyData.revenue_annual_range || 'N/A',
      
      // Company Details
      foundedYear: companyData.founded_year || 'N/A',
      industry: companyData.industry || 'N/A',
      naicsCodes: companyData.naics_codes || [],
      sicCodes: companyData.sic_codes || [],
      
      // Location
      headquarters: companyData.hq_country || 'N/A',
      regions: companyData.hq_region || [],
      
      // Growth Metrics
      employeeChange: companyData.employees_count_change || 'N/A',
      
      // Leadership
      executiveArrivals: companyData.key_executive_arrivals || [],
      executiveDepartures: companyData.key_executive_departures || [],
      
      // Hiring Activity
      activeJobPostings: companyData.active_job_postings_count || 'N/A',
      jobPostingsChange: companyData.active_job_postings_count_change || 'N/A',
      
      // Raw data for debugging
      rawData: companyData
    };

    return overviewData;
  }

  /**
   * Format data for display
   */
  formatDataForDisplay(data) {
    if (!data) return 'No data available';

    return {
      'Company Name': data.companyName,
      'Description': data.description.length > 200 ? data.description.substring(0, 200) + '...' : data.description,
      'Website': data.website,
      'Size': data.size,
      'Employee Count': data.employeeCount,
      'Revenue': typeof data.revenue === 'object' ? 
        `$${data.revenue.annual_revenue_range_from?.toLocaleString() || 'N/A'} - $${data.revenue.annual_revenue_range_to?.toLocaleString() || 'N/A'}` : 
        data.revenue,
      'Founded Year': data.foundedYear,
      'Industry': data.industry,
      'Headquarters': data.headquarters,
      'NAICS Codes': data.naicsCodes.join(', ') || 'N/A',
      'SIC Codes': data.sicCodes.join(', ') || 'N/A',
      'Active Job Postings': data.activeJobPostings,
      'Executive Arrivals': data.executiveArrivals.length,
      'Executive Departures': data.executiveDepartures.length
    };
  }
}

async function testCoreSignalCompanyData() {
  console.log('🧪 TESTING CORESIGNAL COMPANY DATA');
  console.log('==================================\n');
  
  try {
    await prisma.$connect();
    console.log('✅ Connected to database\n');

    // Check if CoreSignal API key is available
    if (!CORESIGNAL_CONFIG.apiKey) {
      console.error('❌ CORESIGNAL_API_KEY environment variable not set');
      console.log('Please set the CoreSignal API key in your environment variables\n');
      return;
    }

    console.log('🔑 CoreSignal API Key: ' + CORESIGNAL_CONFIG.apiKey.substring(0, 10) + '...\n');

    // Get a sample company with a website for testing - try to find a well-known company
    let testCompany = await prisma.companies.findFirst({
      where: { 
        workspaceId: TOP_WORKSPACE_ID, 
        deletedAt: null,
        website: { not: null },
        name: { 
          in: ['Microsoft', 'Google', 'Apple', 'Amazon', 'IBM', 'Oracle', 'Salesforce', 'Adobe', 'Intel', 'Cisco', 'Tesla', 'Netflix', 'Meta', 'Twitter', 'LinkedIn']
        }
      },
      select: {
        id: true,
        name: true,
        website: true,
        industry: true,
        description: true,
        size: true
      }
    });

    // If no well-known company found, get any company with website
    if (!testCompany) {
      const fallbackCompany = await prisma.companies.findFirst({
        where: { 
          workspaceId: TOP_WORKSPACE_ID, 
          deletedAt: null,
          website: { not: null },
          name: { not: "" }
        },
        select: {
          id: true,
          name: true,
          website: true,
          industry: true,
          description: true,
          size: true
        }
      });
      if (fallbackCompany) {
        testCompany = fallbackCompany;
      }
    }

    if (!testCompany) {
      console.error('❌ No test company found with website');
      return;
    }

    console.log('🏢 TEST COMPANY SELECTED:');
    console.log(`   Name: ${testCompany.name}`);
    console.log(`   Website: ${testCompany.website}`);
    console.log(`   Industry: ${testCompany.industry || 'N/A'}`);
    console.log(`   Current Description: ${testCompany.description || 'N/A'}`);
    console.log(`   Current Size: ${testCompany.size || 'N/A'}\n`);

    // Initialize CoreSignal tester
    const tester = new CoreSignalTester();

    // Step 1: Search for the company
    console.log('🔍 STEP 1: SEARCHING FOR COMPANY');
    console.log('===============================\n');
    
    const searchResults = await tester.searchCompany(testCompany.name, testCompany.website);
    
    if (!searchResults) {
      console.log('❌ Search failed\n');
      return;
    }

    let companyIds = [];
    if (searchResults.companyIds && searchResults.companyIds.length > 0) {
      companyIds = searchResults.companyIds;
      console.log(`📊 SEARCH RESULTS: Found ${companyIds.length} company IDs\n`);
      companyIds.forEach((id, index) => {
        console.log(`   ${index + 1}. Company ID: ${id}`);
      });
    } else if (searchResults.hits?.hits?.length > 0) {
      companyIds = searchResults.hits.hits.map(hit => hit._id);
      console.log(`📊 SEARCH RESULTS: Found ${companyIds.length} companies\n`);
      searchResults.hits.hits.forEach((hit, index) => {
        const company = hit._source;
        console.log(`   ${index + 1}. ${company.company_name || 'N/A'}`);
        console.log(`      ID: ${hit._id}`);
        console.log(`      Industry: ${company.industry || 'N/A'}`);
        console.log(`      Website: ${company.website || company.domain || 'N/A'}`);
        console.log(`      Size: ${company.size_range || company.employees_count || 'N/A'}`);
        console.log('');
      });
    } else {
      console.log('❌ No search results found for this company\n');
      return;
    }

    // Step 2: Get detailed data for the first result
    console.log('📊 STEP 2: GETTING DETAILED COMPANY DATA');
    console.log('=======================================\n');
    
    const companyId = companyIds[0];
    
    const companyDetails = await tester.getCompanyDetails(companyId);
    
    if (!companyDetails) {
      console.log('❌ Failed to get company details\n');
      return;
    }

    // Step 3: Extract and display overview data
    console.log('📋 STEP 3: EXTRACTING OVERVIEW TAB DATA');
    console.log('======================================\n');
    
    const overviewData = tester.extractOverviewData(companyDetails);
    const formattedData = tester.formatDataForDisplay(overviewData);

    console.log('🎯 OVERVIEW TAB DATA FROM CORESIGNAL:');
    console.log('====================================\n');
    
    Object.entries(formattedData).forEach(([field, value]) => {
      const status = value && value !== 'N/A' ? '✅' : '❌';
      console.log(`   ${status} ${field}: ${value}`);
    });

    // Step 4: Compare with current data
    console.log('\n📊 STEP 4: COMPARISON WITH CURRENT DATA');
    console.log('======================================\n');
    
    console.log('🔄 DATA COMPARISON:');
    console.log(`   Company Name: ${testCompany.name} → ${overviewData.companyName}`);
    console.log(`   Description: ${testCompany.description || 'N/A'} → ${overviewData.description !== 'N/A' ? 'Available' : 'N/A'}`);
    console.log(`   Website: ${testCompany.website} → ${overviewData.website}`);
    console.log(`   Size: ${testCompany.size || 'N/A'} → ${overviewData.size}`);
    console.log(`   Industry: ${testCompany.industry || 'N/A'} → ${overviewData.industry}`);

    // Step 5: Summary
    console.log('\n📈 STEP 5: ENRICHMENT SUMMARY');
    console.log('=============================\n');
    
    const enrichmentSummary = {
      'Company Name': overviewData.companyName !== 'N/A' ? '✅ Available' : '❌ Missing',
      'Description': overviewData.description !== 'N/A' ? '✅ Available' : '❌ Missing',
      'Website': overviewData.website !== 'N/A' ? '✅ Available' : '❌ Missing',
      'Size': overviewData.size !== 'N/A' ? '✅ Available' : '❌ Missing',
      'Employee Count': overviewData.employeeCount !== 'N/A' ? '✅ Available' : '❌ Missing',
      'Revenue': overviewData.revenue !== 'N/A' ? '✅ Available' : '❌ Missing',
      'Founded Year': overviewData.foundedYear !== 'N/A' ? '✅ Available' : '❌ Missing',
      'Industry': overviewData.industry !== 'N/A' ? '✅ Available' : '❌ Missing',
      'Headquarters': overviewData.headquarters !== 'N/A' ? '✅ Available' : '❌ Missing',
      'Active Job Postings': overviewData.activeJobPostings !== 'N/A' ? '✅ Available' : '❌ Missing'
    };

    console.log('🎯 CORESIGNAL DATA AVAILABILITY:');
    Object.entries(enrichmentSummary).forEach(([field, status]) => {
      console.log(`   ${status} ${field}`);
    });

    const availableFields = Object.values(enrichmentSummary).filter(status => status.includes('✅')).length;
    const totalFields = Object.keys(enrichmentSummary).length;
    const coveragePercentage = ((availableFields / totalFields) * 100).toFixed(1);

    console.log(`\n📊 OVERALL DATA COVERAGE: ${availableFields}/${totalFields} fields (${coveragePercentage}%)`);

    if (coveragePercentage >= 80) {
      console.log('✅ EXCELLENT: CoreSignal provides comprehensive company data');
    } else if (coveragePercentage >= 60) {
      console.log('⚠️  GOOD: CoreSignal provides most company data');
    } else {
      console.log('❌ LIMITED: CoreSignal provides limited company data');
    }

    console.log('\n🎯 RECOMMENDATION:');
    if (overviewData.description !== 'N/A' && overviewData.size !== 'N/A') {
      console.log('✅ CoreSignal can provide the missing Description and Size data for your Overview tab!');
      console.log('🚀 Proceed with implementing CoreSignal enrichment for all companies.');
    } else {
      console.log('⚠️  CoreSignal may not have complete data for all companies.');
      console.log('🔍 Consider testing with multiple companies or using additional data sources.');
    }

  } catch (error) {
    console.error('❌ Test failed:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the test
testCoreSignalCompanyData().catch(console.error);
