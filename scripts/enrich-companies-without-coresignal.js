const { PrismaClient } = require('@prisma/client');
const fetch = require('node-fetch');
const { ulid } = require('ulid');
require('dotenv').config();

const prisma = new PrismaClient();
const CORESIGNAL_API_KEY = process.env.CORESIGNAL_API_KEY;
const CORESIGNAL_BASE_URL = 'https://api.coresignal.com/cdapi/v2';

class CompanyEnrichmentWithoutCoreSignal {
  constructor() {
    this.results = {
      enriched: [],
      failed: [],
      stats: {
        totalCredits: 0,
        searchesUsed: 0,
        collectsUsed: 0
      }
    };
  }

  async enrichAllCompaniesWithoutCoreSignal() {
    console.log('🔍 ENRICHING COMPANIES WITHOUT CORESIGNAL IDs');
    console.log('==============================================');
    console.log('Using website and company name search to find CoreSignal IDs');
    console.log('');

    try {
      const workspace = await prisma.workspaces.findFirst({
        where: { name: 'TOP Engineering Plus' }
      });

      // Get companies without CoreSignal IDs
      const companies = await prisma.companies.findMany({
        where: {
          workspaceId: workspace.id,
          deletedAt: null,
          OR: [
            { customFields: { path: ['coresignalData', 'id'], equals: null } },
            { customFields: { path: ['coresignalData'], equals: null } }
          ]
        },
        select: {
          id: true,
          name: true,
          website: true,
          customFields: true
        },
        orderBy: { name: 'asc' }
      });

      console.log(`Found ${companies.length} companies without CoreSignal IDs`);
      console.log('');

      for (let i = 0; i < companies.length; i++) {
        const company = companies[i];
        console.log(`\n🏢 PROCESSING COMPANY ${i + 1}/${companies.length}: ${company.name}`);
        console.log(`   Website: ${company.website || 'None'}`);
        console.log('─'.repeat(60));

        try {
          let coresignalData = null;

          // Method 1: Try website-based search first
          if (company.website) {
            console.log('   🔍 Method 1: Searching by website...');
            coresignalData = await this.searchByWebsite(company.website);
          }

          // Method 2: Try company name search if website search failed
          if (!coresignalData) {
            console.log('   🔍 Method 2: Searching by company name...');
            coresignalData = await this.searchByCompanyName(company.name);
          }

          if (coresignalData) {
            console.log(`   ✅ Found CoreSignal match: ID ${coresignalData.id}`);
            console.log(`   Company: ${coresignalData.company_name}`);
            console.log(`   Employees: ${coresignalData.employees_count}`);
            console.log(`   Industry: ${coresignalData.industry}`);

            // Update company with CoreSignal data
            await prisma.companies.update({
              where: { id: company.id },
              data: {
                customFields: {
                  ...company.customFields,
                  coresignalData: coresignalData,
                  enrichmentDate: new Date().toISOString(),
                  enrichmentMethod: 'Website/Name Search'
                },
                updatedAt: new Date()
              }
            });

            this.results.enriched.push({
              company: company.name,
              coresignalId: coresignalData.id,
              employees: coresignalData.employees_count,
              method: coresignalData.enrichmentMethod || 'Unknown'
            });

            console.log(`   💾 Updated company record with CoreSignal data`);
          } else {
            console.log(`   ❌ No CoreSignal match found for ${company.name}`);
            this.results.failed.push({
              company: company.name,
              website: company.website,
              reason: 'No CoreSignal match found'
            });
          }

        } catch (error) {
          console.log(`   ❌ Error processing ${company.name}: ${error.message}`);
          this.results.failed.push({
            company: company.name,
            website: company.website,
            reason: error.message
          });
        }
      }

      this.generateSummary();

    } catch (error) {
      console.error('❌ Enrichment failed:', error.message);
    } finally {
      await prisma.$disconnect();
    }
  }

  async searchByWebsite(website) {
    try {
      const normalizedWebsite = this.normalizeWebsite(website);
      console.log(`     Normalized website: ${normalizedWebsite}`);

      const searchQuery = {
        query: {
          bool: {
            should: [
              { match: { 'company_website': normalizedWebsite } },
              { match_phrase: { 'company_website': normalizedWebsite } },
              { match: { 'company_website': this.extractDomain(normalizedWebsite) } },
              { match_phrase: { 'company_website': this.extractDomain(normalizedWebsite) } },
              { match: { 'company_website': normalizedWebsite.replace(/^https?:\/\//, '') } },
              { match_phrase: { 'company_website': normalizedWebsite.replace(/^https?:\/\//, '') } }
            ],
            minimum_should_match: 1
          }
        }
      };

      const response = await this.callCoreSignalAPI('/company_multi_source/search/es_dsl', searchQuery, 'POST');
      this.results.stats.searchesUsed += 1;
      this.results.stats.totalCredits += 1;

      if (Array.isArray(response) && response.length > 0) {
        console.log(`     Found ${response.length} website matches`);
        
        // Get detailed company data for the first match
        const companyId = response[0];
        const companyData = await this.getCompanyData(companyId);
        
        if (companyData) {
          companyData.enrichmentMethod = 'Website Search';
          return companyData;
        }
      }

      return null;
    } catch (error) {
      console.log(`     Website search failed: ${error.message}`);
      return null;
    }
  }

  async searchByCompanyName(companyName) {
    try {
      console.log(`     Searching for: ${companyName}`);

      const searchQuery = {
        query: {
          bool: {
            should: [
              { match: { 'company_name': companyName } },
              { match_phrase: { 'company_name': companyName } },
              { wildcard: { 'company_name': `*${companyName}*` } }
            ],
            minimum_should_match: 1
          }
        }
      };

      const response = await this.callCoreSignalAPI('/company_multi_source/search/es_dsl', searchQuery, 'POST');
      this.results.stats.searchesUsed += 1;
      this.results.stats.totalCredits += 1;

      if (Array.isArray(response) && response.length > 0) {
        console.log(`     Found ${response.length} name matches`);
        
        // Get detailed company data for the first match
        const companyId = response[0];
        const companyData = await this.getCompanyData(companyId);
        
        if (companyData) {
          companyData.enrichmentMethod = 'Company Name Search';
          return companyData;
        }
      }

      return null;
    } catch (error) {
      console.log(`     Name search failed: ${error.message}`);
      return null;
    }
  }

  async getCompanyData(companyId) {
    try {
      const response = await this.callCoreSignalAPI(`/company_multi_source/collect/${companyId}`, null, 'GET');
      this.results.stats.collectsUsed += 1;
      this.results.stats.totalCredits += 1;
      return response;
    } catch (error) {
      console.log(`     Failed to collect company data: ${error.message}`);
      return null;
    }
  }

  normalizeWebsite(website) {
    if (!website) return '';
    
    // Remove protocol and www
    let normalized = website.replace(/^https?:\/\//, '').replace(/^www\./, '');
    
    // Remove trailing slash
    normalized = normalized.replace(/\/$/, '');
    
    return normalized;
  }

  extractDomain(website) {
    const parts = website.split('.');
    if (parts.length >= 2) {
      return parts.slice(-2).join('.');
    }
    return website;
  }

  async callCoreSignalAPI(endpoint, data, method = 'POST') {
    const url = `${CORESIGNAL_BASE_URL}${endpoint}`;
    const options = {
      method,
      headers: {
        'Content-Type': 'application/json',
        'apikey': CORESIGNAL_API_KEY
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

  generateSummary() {
    console.log('\n📊 ENRICHMENT SUMMARY');
    console.log('=====================');
    console.log(`✅ Successfully Enriched: ${this.results.enriched.length}`);
    console.log(`❌ Failed to Enrich: ${this.results.failed.length}`);
    console.log(`🔢 Total Credits Used: ${this.results.stats.totalCredits}`);
    console.log(`🔍 Searches Used: ${this.results.stats.searchesUsed}`);
    console.log(`📊 Collects Used: ${this.results.stats.collectsUsed}`);
    console.log('');

    if (this.results.enriched.length > 0) {
      console.log('✅ SUCCESSFULLY ENRICHED COMPANIES:');
      this.results.enriched.forEach((result, index) => {
        console.log(`   ${index + 1}. ${result.company} (ID: ${result.coresignalId}, ${result.employees} employees)`);
      });
      console.log('');
    }

    if (this.results.failed.length > 0) {
      console.log('❌ FAILED TO ENRICH:');
      this.results.failed.forEach((result, index) => {
        console.log(`   ${index + 1}. ${result.company} (${result.website || 'No website'}) - ${result.reason}`);
      });
      console.log('');
    }

    console.log('🎯 NEXT STEPS:');
    console.log('1. Run buyer group discovery on newly enriched companies');
    console.log('2. Use: node optimized-buyer-group-discovery.js --all-companies');
    console.log('3. This will target companies with CoreSignal IDs for buyer group discovery');
  }
}

async function main() {
  const enrichment = new CompanyEnrichmentWithoutCoreSignal();
  await enrichment.enrichAllCompaniesWithoutCoreSignal();
}

main().catch(console.error);
