#!/usr/bin/env node

/**
 * Add 78 B2B Software Companies to Adrata Workspace
 * 
 * This script searches Coresignal API for 78 USA B2B Software companies
 * with $15M-$100M annual revenue, enriches them with full Coresignal data,
 * and adds them to the Adrata workspace assigned to Dan Mirolli.
 * 
 * Features:
 * - Coresignal API search with Search Filters endpoint
 * - Country filtering (United States)
 * - Industry filtering (Software/B2B SaaS)
 * - Revenue range filtering ($15M-$100M) during profile collection
 * - Full profile enrichment
 * - Progress tracking and resumability
 * - Duplicate detection (skip if company already exists)
 */

require('dotenv').config();
const { PrismaClient } = require('@prisma/client');
const fs = require('fs').promises;
const path = require('path');

class CompanyFinder {
  constructor() {
    this.prisma = new PrismaClient();
    this.apiKey = process.env.CORESIGNAL_API_KEY;
    this.workspaceId = '01K7464TNANHQXPCZT1FYX205V'; // Adrata workspace
    this.danUserId = '01K7B327HWN9G6KGWA97S1TK43'; // Dan Mirolli
    this.targetCount = 78;
    this.batchSize = 5; // Smaller batches for better control
    this.delayBetweenRequests = 1000; // 1 second between requests
    this.delayBetweenBatches = 3000; // 3 seconds between batches
    this.progressFile = 'scripts/add-78-companies-progress.json';
    
    this.results = {
      totalFound: 0,
      successfullyAdded: 0,
      skippedDuplicates: 0,
      failed: 0,
      notUSA: 0,
      notSoftware: 0,
      noRevenue: 0,
      revenueOutOfRange: 0,
      creditsUsed: {
        search: 0,
        collect: 0
      },
      errors: [],
      processedCompanies: [],
      startTime: new Date().toISOString()
    };

    if (!this.apiKey) {
      console.error('❌ CORESIGNAL_API_KEY environment variable is required');
      process.exit(1);
    }
  }

  async run() {
    try {
      console.log('🚀 Starting Company Finder for Adrata Workspace...\n');
      console.log(`📋 Target: ${this.targetCount} USA B2B Software companies ($15M-$100M revenue)\n`);
      
      // Load previous progress
      const processedCompanyIds = await this.loadProgress();
      console.log(`📋 Loaded progress: ${processedCompanyIds.length} companies previously processed\n`);
      
      // Verify workspace and user exist
      await this.verifySetup();
      
      // Search for companies matching criteria
      const companies = await this.searchCompanies();
      this.results.totalFound = companies.length;
      
      console.log(`\n📊 Found ${companies.length} companies matching criteria\n`);
      
      if (companies.length === 0) {
        console.log('❌ No companies found matching the criteria');
        return;
      }

      // Process companies in batches
      const companiesToProcess = companies.filter(c => 
        !processedCompanyIds.includes(c.id)
      );
      
      console.log(`🔄 Processing ${companiesToProcess.length} new companies (${processedCompanyIds.length} already processed)\n`);
      
      await this.processCompaniesInBatches(companiesToProcess.slice(0, this.targetCount));
      
      // Save final progress
      await this.saveProgress();
      
      // Print final results
      this.printResults();
      
    } catch (error) {
      console.error('❌ Error in company finder:', error);
      await this.saveProgress();
    } finally {
      await this.prisma.$disconnect();
    }
  }

  async verifySetup() {
    const workspace = await this.prisma.workspaces.findUnique({
      where: { id: this.workspaceId }
    });
    
    if (!workspace) {
      throw new Error(`Workspace not found: ${this.workspaceId}`);
    }
    
    const dan = await this.prisma.users.findUnique({
      where: { id: this.danUserId }
    });
    
    if (!dan) {
      throw new Error(`User not found: ${this.danUserId}`);
    }
    
    console.log(`✅ Verified workspace: ${workspace.name}`);
    console.log(`✅ Verified user: ${dan.name}\n`);
  }

  async searchCompanies() {
    console.log('🔍 Searching Coresignal API for matching companies...\n');
    
      // Use Search Filters endpoint - simpler API that supports country and industry filtering
      // Note: Revenue filtering will be done during profile collection since Search Filters
      // doesn't support revenue ranges directly
      const searchFilters = {
        industry: [
          'Software Development',
          'Computer Software',
          'IT Services and IT Consulting',
          'Technology, Information and Internet',
          'Computer Networking',
          'Data Processing',
          'Cloud Computing',
          'Cybersecurity'
        ],
        hq_country: ['United States']
      };

    try {
      // Try Search Filters endpoint with POST first
      let searchResponse = await fetch(
        'https://api.coresignal.com/cdapi/v2/company_multi_source/search/filter?items_per_page=200',
        {
          method: 'POST',
          headers: {
            'apikey': this.apiKey,
            'Content-Type': 'application/json',
            'Accept': 'application/json'
          },
          body: JSON.stringify(searchFilters)
        }
      );

      // If POST fails with 404, Search Filters endpoint might not exist for v2
      // Fall back to Elasticsearch DSL but use match queries which might work better
      if (!searchResponse.ok && searchResponse.status === 404) {
        console.log('   ⚠️  Search Filters endpoint not found, falling back to Elasticsearch DSL with match queries...');
        
        // Use Elasticsearch DSL with a more targeted approach
        // Focus on companies that are likely to have revenue data
        const esQuery = {
          query: {
            bool: {
              must: [
                {
                  match: {
                    hq_country: {
                      query: 'United States',
                      operator: 'and'
                    }
                  }
                },
                {
                  bool: {
                    should: searchFilters.industry.map(industry => ({
                      match: {
                        industry: {
                          query: industry,
                          operator: 'and'
                        }
                      }
                    })),
                    minimum_should_match: 1
                  }
                },
                // Add a filter to prefer companies with revenue data
                {
                  bool: {
                    should: [
                      { exists: { field: 'revenue_annual.source_1_annual_revenue.annual_revenue' } },
                      { exists: { field: 'revenue_annual.source_5_annual_revenue.annual_revenue' } },
                      { exists: { field: 'employee_count' } }
                    ],
                    minimum_should_match: 1
                  }
                }
              ]
            }
          }
        };
        
        searchResponse = await fetch(
          'https://api.coresignal.com/cdapi/v2/company_multi_source/search/es_dsl?items_per_page=100',
          {
            method: 'POST',
            headers: {
              'apikey': this.apiKey,
              'Content-Type': 'application/json',
              'Accept': 'application/json'
            },
            body: JSON.stringify(esQuery)
          }
        );
      }

      this.results.creditsUsed.search++;

      if (!searchResponse.ok) {
        const errorText = await searchResponse.text();
        throw new Error(`Coresignal search failed: ${searchResponse.status} ${searchResponse.statusText} - ${errorText}`);
      }

      const data = await searchResponse.json();
      
      // Coresignal Search Filters API returns an array of company IDs
      if (!Array.isArray(data)) {
        // Check if it's a different response structure
        if (data.data && Array.isArray(data.data)) {
          console.log(`✅ Found ${data.data.length} company IDs from Coresignal search`);
          return data.data.map(id => ({ id }));
        }
        throw new Error(`Unexpected response format from Coresignal: ${JSON.stringify(data).substring(0, 200)}`);
      }

      console.log(`✅ Found ${data.length} company IDs from Coresignal search`);
      
      return data.map(id => ({ id }));

    } catch (error) {
      console.error('❌ Error searching Coresignal:', error);
      throw error;
    }
  }

  async processCompaniesInBatches(companies) {
    const totalBatches = Math.ceil(companies.length / this.batchSize);
    let processedCount = 0;
    
    for (let batchIndex = 0; batchIndex < totalBatches; batchIndex++) {
      const startIndex = batchIndex * this.batchSize;
      const endIndex = Math.min(startIndex + this.batchSize, companies.length);
      const batch = companies.slice(startIndex, endIndex);
      
      console.log(`\n📦 Processing batch ${batchIndex + 1}/${totalBatches} (${batch.length} companies)`);
      console.log(`📊 Overall Progress: ${processedCount}/${companies.length} companies processed`);
      
      for (const company of batch) {
        try {
          // Stop if we've reached target count
          if (this.results.successfullyAdded >= this.targetCount) {
            console.log(`\n✅ Reached target count of ${this.targetCount} companies!`);
            return;
          }

          const result = await this.processCompany(company.id);
          processedCount++;
          
          // Track processed company
          this.results.processedCompanies.push({
            coresignalId: company.id,
            result: result,
            processedAt: new Date().toISOString()
          });
          
          // Save progress every 5 companies
          if (processedCount % 5 === 0) {
            await this.saveProgress();
          }
          
          // Delay between individual requests
          if (batchIndex < totalBatches - 1 || company !== batch[batch.length - 1]) {
            await this.delay(this.delayBetweenRequests);
          }
        } catch (error) {
          console.error(`   ❌ Error processing company ${company.id}:`, error.message);
          this.results.failed++;
          this.results.errors.push({
            coresignalId: company.id,
            error: error.message
          });
          processedCount++;
          
          // Track failed company
          this.results.processedCompanies.push({
            coresignalId: company.id,
            result: { status: 'error', error: error.message },
            processedAt: new Date().toISOString()
          });
        }
      }
      
      // Delay between batches
      if (batchIndex < totalBatches - 1) {
        console.log(`   ⏳ Waiting ${this.delayBetweenBatches}ms before next batch...`);
        await this.delay(this.delayBetweenBatches);
      }
    }
  }

  async processCompany(coresignalId) {
    console.log(`   🔍 Processing company ID: ${coresignalId}`);
    
    // Check if company already exists in workspace
    const existingCompany = await this.checkDuplicate(coresignalId);
    if (existingCompany) {
      console.log(`   ⚠️  Company already exists: ${existingCompany.name} (skipping)`);
      this.results.skippedDuplicates++;
      return { status: 'duplicate', companyId: existingCompany.id, name: existingCompany.name };
    }
    
    // Collect full profile from Coresignal
    const profileData = await this.collectCompanyProfile(coresignalId);
    
    if (!profileData) {
      console.log(`   ⚠️  No profile data found for ${coresignalId}`);
      this.results.failed++;
      return { status: 'no_data', coresignalId };
    }
    
    // Validate country (should already be filtered by Search Filters, but verify)
    const country = profileData.hq_country || profileData.country || profileData.company_hq_country || '';
    if (!country.toLowerCase().includes('united states') && !country.toLowerCase().includes('usa') && !country.toLowerCase().includes('us')) {
      console.log(`   ⚠️  Not USA company: ${country} (skipping)`);
      this.results.notUSA++;
      return { status: 'not_usa', country };
    }
    
    // Validate industry - expand the list to include more B2B tech companies
    const industry = profileData.industry || profileData.company_industry || '';
    const softwareIndustries = [
      'software', 'saas', 'technology', 'information technology', 'internet', 
      'computer software', 'it services', 'it consulting', 'software development',
      'computer networking', 'data processing', 'cloud computing', 'cybersecurity',
      'artificial intelligence', 'machine learning', 'fintech', 'edtech', 'healthtech',
      'martech', 'adtech', 'e-commerce', 'mobile applications', 'web development'
    ];
    if (!softwareIndustries.some(ind => industry.toLowerCase().includes(ind.toLowerCase()))) {
      console.log(`   ⚠️  Not software industry: ${industry} (skipping)`);
      this.results.notSoftware++;
      return { status: 'not_software', industry };
    }
    
    // Filter by revenue range ($15M-$100M - M2 to M7)
    let revenueData = this.extractRevenue(profileData);
    let isEstimatedRevenue = false;
    
    if (!revenueData) {
      // If no revenue data, try to estimate from employee count as a proxy
      const employeeCount = profileData.employee_count || profileData.company_employees_count || 0;
      if (employeeCount > 0) {
        // Rough estimate: $100K revenue per employee for software companies
        revenueData = employeeCount * 100000;
        isEstimatedRevenue = true;
        
        if (revenueData >= 15000000 && revenueData <= 100000000) {
          console.log(`   📊 Using employee-based revenue estimate: $${(revenueData / 1000000).toFixed(2)}M (${employeeCount} employees)`);
        } else {
          console.log(`   ⚠️  No revenue data and estimated revenue out of range: $${(revenueData / 1000000).toFixed(2)}M (skipping)`);
          this.results.noRevenue++;
          return { status: 'no_revenue' };
        }
      } else {
        console.log(`   ⚠️  No revenue or employee data available (skipping)`);
        this.results.noRevenue++;
        return { status: 'no_revenue' };
      }
    } else if (revenueData < 15000000 || revenueData > 100000000) {
      console.log(`   ⚠️  Revenue out of range: $${(revenueData / 1000000).toFixed(2)}M (skipping)`);
      this.results.revenueOutOfRange++;
      return { status: 'revenue_out_of_range', revenue: revenueData };
    }
    
    console.log(`   📊 Company: ${profileData.name || 'Unknown'}`);
    console.log(`   🌍 Country: ${country}`);
    console.log(`   💻 Industry: ${industry}`);
    console.log(`   💰 Revenue: $${(revenueData / 1000000).toFixed(2)}M${isEstimatedRevenue ? ' (estimated)' : ''}`);
    console.log(`   ✅ Matches all criteria`);
    
    // Create company record
    const company = await this.createCompanyRecord(profileData, coresignalId, revenueData);
    
    console.log(`   ✅ Successfully added: ${company.name}`);
    this.results.successfullyAdded++;
    
    return { 
      status: 'success', 
      companyId: company.id, 
      name: company.name,
      coresignalId: coresignalId
    };
  }

  async checkDuplicate(coresignalId) {
    // Check if company already exists by Coresignal ID in customFields using raw SQL
    // Convert coresignalId to string to match text field
    const existing = await this.prisma.$queryRaw`
      SELECT id, name, "customFields"
      FROM companies
      WHERE "workspaceId" = ${this.workspaceId}
      AND "deletedAt" IS NULL
      AND "customFields" IS NOT NULL
      AND ("customFields"->>'coresignalId')::text = ${coresignalId.toString()}
      LIMIT 1
    `;
    
    return existing && existing.length > 0 ? existing[0] : null;
  }

  async collectCompanyProfile(coresignalId) {
    try {
      const collectResponse = await fetch(
        `https://api.coresignal.com/cdapi/v2/company_multi_source/collect/${coresignalId}`,
        {
          method: 'GET',
          headers: {
            'apikey': this.apiKey,
            'Accept': 'application/json'
          }
        }
      );

      this.results.creditsUsed.collect++;

      if (!collectResponse.ok) {
        const errorText = await collectResponse.text();
        throw new Error(`Coresignal collect failed: ${collectResponse.status} ${collectResponse.statusText} - ${errorText}`);
      }

      const profileData = await collectResponse.json();
      return profileData;
      
    } catch (error) {
      console.error(`   ❌ Error collecting profile for ${coresignalId}:`, error.message);
      throw error;
    }
  }

  async createCompanyRecord(profileData, coresignalId, revenueData = null) {
    // Extract domain from website
    const website = profileData.website || profileData.domain;
    const domain = this.extractDomain(website);
    
    // Map Coresignal fields to Prisma model
    const companyData = {
      workspaceId: this.workspaceId,
      mainSellerId: this.danUserId,
      name: profileData.name || profileData.company_name || 'Unknown Company',
      legalName: profileData.legal_name || profileData.name,
      description: profileData.description || profileData.company_description || null,
      descriptionEnriched: profileData.description || profileData.company_description || null,
      website: website || null,
      domain: domain || null,
      email: profileData.email || null,
      phone: profileData.phone || null,
      address: profileData.address || profileData.company_hq_street || null,
      city: profileData.city || profileData.company_hq_city || profileData.hq_city || null,
      state: profileData.state || profileData.company_hq_state || profileData.hq_state || null,
      country: profileData.country || profileData.company_hq_country || profileData.hq_country || 'United States',
      postalCode: profileData.postal_code || profileData.company_hq_zipcode || profileData.hq_zipcode || null,
      hqCity: profileData.company_hq_city || profileData.hq_city || null,
      hqState: profileData.company_hq_state || profileData.hq_state || null,
      hqCountryIso2: profileData.company_hq_country_iso2 || profileData.hq_country_iso2 || null,
      hqCountryIso3: profileData.company_hq_country_iso3 || profileData.hq_country_iso3 || null,
      hqStreet: profileData.company_hq_street || profileData.hq_street || null,
      hqZipcode: profileData.company_hq_zipcode || profileData.hq_zipcode || null,
      hqFullAddress: profileData.company_hq_full_address || profileData.hq_full_address || null,
      industry: profileData.industry || profileData.company_industry || 'Software',
      sector: profileData.sector || 'Technology',
      size: profileData.size_range || profileData.company_size_range || null,
      revenue: revenueData || this.extractRevenue(profileData),
      employeeCount: profileData.employee_count || profileData.company_employees_count || null,
      foundedYear: profileData.founded_year || profileData.company_founded_year ? 
        parseInt(profileData.founded_year || profileData.company_founded_year) : null,
      linkedinUrl: profileData.linkedin_url || profileData.company_linkedin_url || null,
      twitterUrl: profileData.twitter_url || null,
      facebookUrl: profileData.facebook_url || null,
      githubUrl: profileData.github_url || null,
      status: 'ACTIVE',
      priority: 'MEDIUM',
      customFields: {
        coresignalId: coresignalId,
        coresignalData: profileData,
        lastEnrichedAt: new Date().toISOString(),
        enrichmentSource: 'coresignal',
        enrichmentVersion: '2.0'
      },
      createdAt: new Date(),
      updatedAt: new Date()
    };

    // Create company record
    const company = await this.prisma.companies.create({
      data: companyData
    });

    return company;
  }

  extractRevenue(profileData) {
    // Extract revenue from Coresignal's nested structure
    if (!profileData.revenue_annual) return null;
    
    const revenueAnnual = profileData.revenue_annual;
    
    // Try source_1 first (usually most reliable)
    if (revenueAnnual.source_1_annual_revenue && 
        revenueAnnual.source_1_annual_revenue.annual_revenue_currency === 'USD') {
      return revenueAnnual.source_1_annual_revenue.annual_revenue;
    }
    
    // Try source_5 as fallback
    if (revenueAnnual.source_5_annual_revenue && 
        revenueAnnual.source_5_annual_revenue.annual_revenue_currency === 'USD') {
      return revenueAnnual.source_5_annual_revenue.annual_revenue;
    }
    
    // If no USD revenue found, return null
    return null;
  }

  extractDomain(website) {
    if (!website) return null;
    try {
      const url = new URL(website.startsWith('http') ? website : `https://${website}`);
      return url.hostname.replace('www.', '').toLowerCase();
    } catch (error) {
      // If URL parsing fails, try to extract domain manually
      const match = website.match(/(?:https?:\/\/)?(?:www\.)?([^\/]+)/i);
      return match ? match[1].toLowerCase() : null;
    }
  }

  delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  async saveProgress() {
    try {
      const progressData = {
        ...this.results,
        lastSaved: new Date().toISOString()
      };
      await fs.writeFile(this.progressFile, JSON.stringify(progressData, null, 2));
    } catch (error) {
      console.error('❌ Error saving progress:', error);
    }
  }

  async loadProgress() {
    try {
      const data = await fs.readFile(this.progressFile, 'utf8');
      const progressData = JSON.parse(data);
      this.results = { ...this.results, ...progressData };
      return progressData.processedCompanies
        .filter(p => p.result?.status === 'success')
        .map(p => p.coresignalId) || [];
    } catch (error) {
      console.log('ℹ️  No previous progress found, starting fresh');
      return [];
    }
  }

  printResults() {
    console.log('\n📊 Company Finder Results:');
    console.log('='.repeat(60));
    console.log(`Total Found: ${this.results.totalFound}`);
    console.log(`Successfully Added: ${this.results.successfullyAdded}`);
    console.log(`Skipped (Duplicates): ${this.results.skippedDuplicates}`);
    console.log(`🇺🇸 Not USA: ${this.results.notUSA}`);
    console.log(`💻 Not Software: ${this.results.notSoftware}`);
    console.log(`💰 No Revenue: ${this.results.noRevenue}`);
    console.log(`📊 Revenue Out of Range: ${this.results.revenueOutOfRange}`);
    console.log(`❌ Other Failed: ${this.results.failed}`);
    console.log(`Credits Used - Search: ${this.results.creditsUsed.search}`);
    console.log(`Credits Used - Collect: ${this.results.creditsUsed.collect}`);
    console.log(`Total Credits Used: ${this.results.creditsUsed.search + this.results.creditsUsed.collect}`);
    
    if (this.results.errors.length > 0) {
      console.log(`\n❌ Errors (${this.results.errors.length}):`);
      this.results.errors.slice(0, 10).forEach(error => {
        console.log(`   - ${error.coresignalId}: ${error.error}`);
      });
      if (this.results.errors.length > 10) {
        console.log(`   ... and ${this.results.errors.length - 10} more errors`);
      }
    }
    
    if (this.results.successfullyAdded > 0) {
      console.log(`\n✅ Successfully added ${this.results.successfullyAdded} companies to Adrata workspace`);
      console.log(`   All assigned to Dan Mirolli (ID: ${this.danUserId})`);
    }
  }
}

// Run the finder
const finder = new CompanyFinder();
finder.run().catch(console.error);

