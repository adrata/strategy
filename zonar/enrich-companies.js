#!/usr/bin/env node

/**
 * Zonar Companies Enrichment Script
 * 
 * This script checks if companies in the Notary Everyday workspace are enriched
 * with Coresignal data and attempts to enrich unenriched companies.
 */

require('dotenv').config();
const { PrismaClient } = require('@prisma/client');

class ZonarCompaniesEnrichment {
  constructor() {
    this.prisma = new PrismaClient();
    this.apiKey = process.env.CORESIGNAL_API_KEY;
    this.workspaceId = '01K7DNYR5VZ7JY36KGKKN76XZ1'; // Notary Everyday workspace
    this.batchSize = 10;
    this.delayBetweenBatches = 2000; // 2 seconds
    
    this.results = {
      totalCompanies: 0,
      alreadyEnriched: 0,
      successfullyEnriched: 0,
      failedEnrichment: 0,
      creditsUsed: {
        search: 0,
        collect: 0
      }
    };

    if (!this.apiKey) {
      console.error('❌ CORESIGNAL_API_KEY environment variable is required');
      process.exit(1);
    }
  }

  async run() {
    try {
      console.log('🚀 Starting Zonar Companies Enrichment for Notary Everyday workspace...\n');
      
      // Get all companies in Notary Everyday workspace
      const companies = await this.getCompanies();
      this.results.totalCompanies = companies.length;
      
      console.log(`📊 Found ${companies.length} companies in Notary Everyday workspace`);
      
      if (companies.length === 0) {
        console.log('❌ No companies found to process');
        return;
      }

      // Process companies in batches
      await this.processCompaniesInBatches(companies);
      
      // Print final results
      this.printResults();
      
    } catch (error) {
      console.error('❌ Error in companies enrichment:', error);
    } finally {
      await this.prisma.$disconnect();
    }
  }

  async getCompanies() {
    return await this.prisma.companies.findMany({
      where: {
        workspaceId: this.workspaceId,
        deletedAt: null
      },
      orderBy: {
        createdAt: 'asc'
      }
    });
  }

  async processCompaniesInBatches(companies) {
    const totalBatches = Math.ceil(companies.length / this.batchSize);
    
    for (let batchIndex = 0; batchIndex < totalBatches; batchIndex++) {
      const startIndex = batchIndex * this.batchSize;
      const endIndex = Math.min(startIndex + this.batchSize, companies.length);
      const batch = companies.slice(startIndex, endIndex);
      
      console.log(`\n📦 Processing batch ${batchIndex + 1}/${totalBatches} (${batch.length} companies)`);
      
      for (const company of batch) {
        try {
          await this.processCompany(company);
        } catch (error) {
          console.error(`   ❌ Error processing ${company.name}:`, error.message);
          this.results.failedEnrichment++;
        }
      }
      
      // Delay between batches to respect rate limits
      if (batchIndex < totalBatches - 1) {
        console.log(`   ⏳ Waiting ${this.delayBetweenBatches}ms before next batch...`);
        await this.delay(this.delayBetweenBatches);
      }
    }
  }

  async processCompany(company) {
    console.log(`   🔍 Processing: ${company.name}`);
    
    // Check if company is already enriched
    if (this.isCompanyEnriched(company)) {
      console.log(`   ✅ Already enriched: ${company.name}`);
      this.results.alreadyEnriched++;
      return;
    }
    
    // Attempt to enrich company
    await this.enrichCompany(company);
  }

  isCompanyEnriched(company) {
    // Check if company has Coresignal data in customFields
    if (company.customFields && typeof company.customFields === 'object') {
      const customFields = company.customFields;
      if (customFields.coresignalId || customFields.coresignalData || customFields.lastEnrichedAt) {
        return true;
      }
    }
    
    // Check if company has enriched data in specific fields
    if (company.descriptionEnriched && company.descriptionEnriched.length > 100) {
      return true; // Likely enriched if description is substantial
    }
    
    return false;
  }

  async enrichCompany(company) {
    try {
      // Build search query for Coresignal
      const searchQuery = this.buildSearchQuery(company);
      
      // Search for company in Coresignal
      const searchResponse = await fetch('https://api.coresignal.com/cdapi/v2/company_multi_source/search/es_dsl?items_per_page=5', {
        method: 'POST',
        headers: {
          'apikey': this.apiKey,
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify(searchQuery)
      });

      this.results.creditsUsed.search++;

      if (!searchResponse.ok) {
        throw new Error(`Coresignal search failed: ${searchResponse.status} ${searchResponse.statusText}`);
      }

      const searchData = await searchResponse.json();
      const companyIds = Array.isArray(searchData) ? searchData : [];

      if (companyIds.length === 0) {
        console.log(`   ⚠️ No Coresignal data found for ${company.name}`);
        this.results.failedEnrichment++;
        return;
      }

      // Get the first matching profile
      const coresignalCompanyId = companyIds[0];
      const collectResponse = await fetch(`https://api.coresignal.com/cdapi/v2/company_multi_source/collect/${coresignalCompanyId}`, {
        headers: { 
          'apikey': this.apiKey,
          'Accept': 'application/json'
        }
      });

      this.results.creditsUsed.collect++;

      if (!collectResponse.ok) {
        throw new Error(`Coresignal collect failed: ${collectResponse.status} ${collectResponse.statusText}`);
      }

      const profileData = await collectResponse.json();

      // Update company with Coresignal data
      await this.updateCompanyWithCoresignalData(company, coresignalCompanyId, profileData);
      
      console.log(`   ✅ Enriched: ${company.name} (Coresignal ID: ${coresignalCompanyId})`);
      this.results.successfullyEnriched++;

    } catch (error) {
      console.error(`   ❌ Failed to enrich ${company.name}:`, error.message);
      this.results.failedEnrichment++;
    }
  }

  buildSearchQuery(company) {
    const query = {
      query: {
        bool: {
          must: []
        }
      }
    };

    // Add company name matching
    query.query.bool.must.push({
      bool: {
        should: [
          { match: { 'name': company.name } },
          { match_phrase: { 'name': company.name } },
          { match: { 'company_name': company.name } },
          { match_phrase: { 'company_name': company.name } }
        ]
      }
    });

    // Add domain matching if available
    if (company.domain || company.website) {
      const domain = company.domain || this.extractDomain(company.website);
      if (domain) {
        query.query.bool.must.push({
          bool: {
            should: [
              { match: { 'domain': domain } },
              { match_phrase: { 'domain': domain } },
              { match: { 'website': domain } },
              { match_phrase: { 'website': domain } }
            ]
          }
        });
      }
    }

    // Add LinkedIn URL matching if available
    if (company.linkedinUrl) {
      query.query.bool.must.push({
        bool: {
          should: [
            { match: { 'linkedin_url': company.linkedinUrl } },
            { match_phrase: { 'linkedin_url': company.linkedinUrl } }
          ]
        }
      });
    }

    return query;
  }

  extractDomain(website) {
    if (!website) return null;
    try {
      const url = new URL(website.startsWith('http') ? website : `https://${website}`);
      return url.hostname.replace('www.', '');
    } catch (error) {
      return null;
    }
  }

  async updateCompanyWithCoresignalData(company, coresignalId, profileData) {
    const enrichedData = {
      coresignalId: coresignalId,
      coresignalData: profileData,
      lastEnrichedAt: new Date().toISOString(),
      enrichmentSource: 'coresignal'
    };

    await this.prisma.companies.update({
      where: { id: company.id },
      data: {
        customFields: {
          ...(company.customFields || {}),
          ...enrichedData
        },
        // Update enriched description if available
        descriptionEnriched: profileData.description || company.descriptionEnriched,
        // Update LinkedIn URL if more complete
        linkedinUrl: profileData.linkedin_url || company.linkedinUrl,
        // Update website if more complete
        website: profileData.website || company.website,
        // Update domain if available
        domain: profileData.domain || company.domain,
        // Update industry if available
        industry: profileData.industry || company.industry,
        // Update employee count if available
        employeeCount: profileData.employee_count || company.employeeCount,
        // Update founded year if available
        foundedYear: profileData.founded_year || company.foundedYear,
        updatedAt: new Date()
      }
    });
  }

  printResults() {
    console.log('\n📊 Zonar Companies Enrichment Results:');
    console.log('=======================================');
    console.log(`Total Companies: ${this.results.totalCompanies}`);
    console.log(`Already Enriched: ${this.results.alreadyEnriched}`);
    console.log(`Successfully Enriched: ${this.results.successfullyEnriched}`);
    console.log(`Failed Enrichment: ${this.results.failedEnrichment}`);
    console.log(`Credits Used - Search: ${this.results.creditsUsed.search}`);
    console.log(`Credits Used - Collect: ${this.results.creditsUsed.collect}`);
    console.log(`Total Credits Used: ${this.results.creditsUsed.search + this.results.creditsUsed.collect}`);
  }

  delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

// Run the script
const enrichment = new ZonarCompaniesEnrichment();
enrichment.run().catch(console.error);
