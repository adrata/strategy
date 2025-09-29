const { PrismaClient } = require('@prisma/client');
require('dotenv').config();
const fetch = require('node-fetch');

const CORESIGNAL_API_KEY = process.env.CORESIGNAL_API_KEY;
const CORESIGNAL_BASE_URL = 'https://api.coresignal.com/cdapi/v2';

class WebsiteBasedCompanySearch {
  constructor() {
    this.prisma = new PrismaClient();
  }

  /**
   * Search for company by website in CoreSignal
   */
  async searchCompanyByWebsite(website) {
    console.log(`🔍 Searching CoreSignal for website: ${website}`);
    
    // Normalize website for search
    const normalizedWebsite = this.normalizeWebsite(website);
    console.log(`   Normalized: ${normalizedWebsite}`);
    
    const searchQuery = {
      query: {
        bool: {
          should: [
            // Exact website match
            { match: { 'company_website': normalizedWebsite } },
            { match_phrase: { 'company_website': normalizedWebsite } },
            
            // Domain-only match (e.g., "nike.com" matches "https://www.nike.com")
            { match: { 'company_website': this.extractDomain(normalizedWebsite) } },
            { match_phrase: { 'company_website': this.extractDomain(normalizedWebsite) } },
            
            // Without protocol (e.g., "www.nike.com")
            { match: { 'company_website': normalizedWebsite.replace(/^https?:\/\//, '') } },
            { match_phrase: { 'company_website': normalizedWebsite.replace(/^https?:\/\//, '') } }
          ],
          minimum_should_match: 1
        }
      }
    };

    try {
      const response = await this.callCoreSignalAPI('/company_multi_source/search/es_dsl', searchQuery, 'POST');
      
      if (Array.isArray(response) && response.length > 0) {
        console.log(`   ✅ Found ${response.length} company matches`);
        return response; // Returns array of company IDs
      } else {
        console.log(`   ❌ No companies found for website: ${website}`);
        return [];
      }
    } catch (error) {
      console.log(`   ❌ Search error: ${error.message}`);
      return [];
    }
  }

  /**
   * Get detailed company data from CoreSignal
   */
  async getCompanyData(companyId) {
    console.log(`📊 Collecting company data for ID: ${companyId}`);
    
    try {
      const response = await this.callCoreSignalAPI(`/company_multi_source/collect/${companyId}`, null, 'GET');
      
      if (response && response.company_id) {
        console.log(`   ✅ Company data collected: ${response.company_name}`);
        return response;
      } else {
        console.log(`   ❌ Failed to collect company data`);
        return null;
      }
    } catch (error) {
      console.log(`   ❌ Collection error: ${error.message}`);
      return null;
    }
  }

  /**
   * Find company in our database and get its website
   */
  async findCompanyInDatabase(companyName) {
    console.log(`🔍 Looking up company in our database: ${companyName}`);
    
    const company = await this.prisma.companies.findFirst({
      where: {
        name: {
          contains: companyName,
          mode: 'insensitive'
        }
      },
      select: {
        id: true,
        name: true,
        website: true,
        domain: true
      }
    });
    
    if (!company) {
      console.log(`   ❌ Company not found in our database`);
      return null;
    }
    
    if (!company.website) {
      console.log(`   ❌ Company has no website: ${company.name}`);
      return null;
    }
    
    console.log(`   ✅ Found company: ${company.name}`);
    console.log(`   Website: ${company.website}`);
    
    return company;
  }

  /**
   * Complete workflow: Database lookup → Website search → Company data
   */
  async findCompanyByWebsite(companyName) {
    console.log(`\n🎯 WEBSITE-BASED COMPANY SEARCH`);
    console.log(`Company: ${companyName}`);
    console.log('='.repeat(50));
    
    // Step 1: Find company in our database
    const dbCompany = await this.findCompanyInDatabase(companyName);
    if (!dbCompany) {
      return { success: false, reason: 'Company not found in our database' };
    }
    
    // Step 2: Search CoreSignal by website
    const companyIds = await this.searchCompanyByWebsite(dbCompany.website);
    if (companyIds.length === 0) {
      return { success: false, reason: 'Company not found in CoreSignal by website' };
    }
    
    // Step 3: Get detailed company data (use first match)
    const companyId = companyIds[0];
    const coresignalData = await this.getCompanyData(companyId);
    if (!coresignalData) {
      return { success: false, reason: 'Failed to collect company data from CoreSignal' };
    }
    
    console.log(`\n✅ SUCCESS! Found company in CoreSignal:`);
    console.log(`   CoreSignal ID: ${coresignalData.company_id}`);
    console.log(`   Name: ${coresignalData.company_name}`);
    console.log(`   Website: ${coresignalData.company_website}`);
    console.log(`   Industry: ${coresignalData.company_industry}`);
    console.log(`   Employees: ${coresignalData.employees_count || 'Unknown'}`);
    
    return {
      success: true,
      companyId: coresignalData.company_id,
      companyName: coresignalData.company_name,
      website: coresignalData.company_website,
      industry: coresignalData.company_industry,
      employeesCount: coresignalData.employees_count,
      coresignalData: coresignalData,
      creditsUsed: 4 // 2 for search + 2 for collect
    };
  }

  /**
   * Normalize website URL for better matching
   */
  normalizeWebsite(website) {
    if (!website) return '';
    
    // Remove trailing slashes
    let normalized = website.replace(/\/+$/, '');
    
    // Add protocol if missing
    if (!normalized.startsWith('http://') && !normalized.startsWith('https://')) {
      normalized = 'https://' + normalized;
    }
    
    // Convert to lowercase
    normalized = normalized.toLowerCase();
    
    return normalized;
  }

  /**
   * Extract domain from website URL
   */
  extractDomain(website) {
    try {
      const url = new URL(website);
      return url.hostname.replace(/^www\./, ''); // Remove www. prefix
    } catch (error) {
      // If URL parsing fails, try simple string extraction
      const match = website.match(/(?:https?:\/\/)?(?:www\.)?([^\/]+)/);
      return match ? match[1] : website;
    }
  }

  /**
   * Make CoreSignal API call
   */
  async callCoreSignalAPI(endpoint, data, method = 'POST') {
    const url = `${CORESIGNAL_BASE_URL}${endpoint}`;
    const options = {
      method,
      headers: {
        'apikey': CORESIGNAL_API_KEY,
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      }
    };
    
    if (data && method !== 'GET') {
      options.body = JSON.stringify(data);
    }
    
    const response = await fetch(url, options);
    
    if (!response.ok) {
      throw new Error(`CoreSignal API error: ${response.status} ${response.statusText}`);
    }
    
    return await response.json();
  }

  /**
   * Test the website-based search
   */
  async testWebsiteSearch() {
    console.log('🧪 TESTING WEBSITE-BASED COMPANY SEARCH');
    console.log('========================================');
    
    const testCompanies = [
      'Nike',
      'Apple',
      'Microsoft',
      'Google',
      'Amazon'
    ];
    
    for (const companyName of testCompanies) {
      try {
        const result = await this.findCompanyByWebsite(companyName);
        console.log(`\n📊 Result for ${companyName}:`);
        console.log(`   Success: ${result.success}`);
        if (result.success) {
          console.log(`   Company ID: ${result.companyId}`);
          console.log(`   Credits Used: ${result.creditsUsed}`);
        } else {
          console.log(`   Reason: ${result.reason}`);
        }
      } catch (error) {
        console.log(`   Error: ${error.message}`);
      }
      
      // Small delay between requests
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
  }
}

// Test the website-based search
async function main() {
  const searcher = new WebsiteBasedCompanySearch();
  
  try {
    await searcher.testWebsiteSearch();
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await searcher.prisma.$disconnect();
  }
}

main();
