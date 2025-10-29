#!/usr/bin/env node

/**
 * Enrich Dan's Adrata Companies with Coresignal
 * 
 * This script enriches Dan's companies in the Adrata workspace
 * using the Coresignal API with multiple search approaches.
 * 
 * Features:
 * - Multiple search strategies (website.exact, website, website.domain_only)
 * - Confidence-based matching (90%+ required)
 * - Real-time progress tracking
 * - Comprehensive data updates
 */

require('dotenv').config();
const { PrismaClient } = require('@prisma/client');

class DanAdrataCompanyEnrichment {
  constructor() {
    this.prisma = new PrismaClient();
    this.apiKey = process.env.CORESIGNAL_API_KEY;
    this.workspaceId = '01K7464TNANHQXPCZT1FYX205V'; // Adrata workspace
    this.danUserId = '01K7B327HWN9G6KGWA97S1TK43'; // Dan Mirolli
    this.batchSize = 5; // Process 5 companies at a time
    this.delayBetweenBatches = 2000; // 2 seconds delay
    this.delayBetweenRequests = 1000; // 1 second between individual requests
    
    this.results = {
      totalCompanies: 0,
      withWebsites: 0,
      withoutWebsites: 0,
      alreadyEnriched: 0,
      successfullyEnriched: 0,
      failedEnrichment: 0,
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
      console.log('🚀 Starting Dan Adrata Companies Enrichment...\n');
      console.log(`👤 Dan's User ID: ${this.danUserId}`);
      console.log(`🏢 Adrata Workspace ID: ${this.workspaceId}\n`);
      console.log('ℹ️  Using multiple search approaches: website.exact → website → website.domain_only\n');
      
      // Get Dan's companies in Adrata workspace
      const companies = await this.getDanCompanies();
      this.results.totalCompanies = companies.length;
      
      console.log(`📊 Found ${companies.length} companies for Dan in Adrata workspace`);
      
      if (companies.length === 0) {
        console.log('❌ No companies found to process');
        return;
      }

      // Categorize companies
      const withWebsites = companies.filter(c => c.website && c.website.trim() !== '');
      const withoutWebsites = companies.filter(c => !c.website || c.website.trim() === '');
      const alreadyEnriched = companies.filter(c => this.isCompanyEnriched(c));
      
      // Filter out already enriched companies
      const needsEnrichment = withWebsites.filter(c => !this.isCompanyEnriched(c));

      this.results.withWebsites = withWebsites.length;
      this.results.withoutWebsites = withoutWebsites.length;
      this.results.alreadyEnriched = alreadyEnriched.length;

      console.log(`🌐 Companies with websites: ${withWebsites.length}`);
      console.log(`❌ Companies without websites: ${withoutWebsites.length}`);
      console.log(`✅ Already enriched: ${alreadyEnriched.length}`);
      console.log(`🔄 Need enrichment: ${needsEnrichment.length}\n`);

      if (needsEnrichment.length === 0) {
        console.log('✅ All companies with websites are already enriched!');
        return;
      }

      // Process companies in batches
      await this.processCompaniesInBatches(needsEnrichment);
      
      // Print final results
      this.printResults();
      
    } catch (error) {
      console.error('❌ Error in companies enrichment:', error);
    } finally {
      await this.prisma.$disconnect();
    }
  }

  async getDanCompanies() {
    return await this.prisma.companies.findMany({
      where: {
        workspaceId: this.workspaceId,
        mainSellerId: this.danUserId,
        deletedAt: null
      },
      orderBy: {
        createdAt: 'asc'
      }
    });
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
          const result = await this.processCompany(company);
          processedCount++;
          
          // Track processed company
          this.results.processedCompanies.push({
            id: company.id,
            name: company.name,
            website: company.website,
            result: result,
            processedAt: new Date().toISOString()
          });
          
          // Log progress every 5 companies
          if (processedCount % 5 === 0) {
            console.log(`\n📈 Progress Update:`);
            console.log(`   ✅ Successfully Enriched: ${this.results.successfullyEnriched}`);
            console.log(`   ❌ Failed: ${this.results.failedEnrichment}`);
            console.log(`   🔄 Processed: ${processedCount}/${companies.length}`);
            console.log(`   💳 Credits Used: ${this.results.creditsUsed.search + this.results.creditsUsed.collect}`);
          }
          
          // Delay between individual requests
          if (batchIndex < totalBatches - 1 || company !== batch[batch.length - 1]) {
            await this.delay(this.delayBetweenRequests);
          }
        } catch (error) {
          console.error(`   ❌ Error processing ${company.name}:`, error.message);
          this.results.failedEnrichment++;
          this.results.errors.push({
            company: company.name,
            error: error.message
          });
          processedCount++;
          
          // Track failed company
          this.results.processedCompanies.push({
            id: company.id,
            name: company.name,
            website: company.website,
            result: { status: 'error', error: error.message },
            processedAt: new Date().toISOString()
          });
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
    console.log(`   🌐 Website: ${company.website}`);
    
    // Check if company is already enriched
    if (this.isCompanyEnriched(company)) {
      console.log(`   ✅ Already enriched: ${company.name}`);
      this.results.alreadyEnriched++;
      return { status: 'already_enriched', company: company.name };
    }
    
    // Attempt to enrich company
    const result = await this.enrichCompany(company);
    return result;
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
      const domain = this.extractDomain(company.website);
      if (!domain) {
        console.log(`   ⚠️ Invalid website format: ${company.website}`);
        this.results.failedEnrichment++;
        return;
      }

      console.log(`   🔍 Searching for domain: ${domain}`);
      
      // Try multiple search approaches in order of preference
      const searchApproaches = [
        {
          name: 'website.exact',
          query: {
            "query": {
              "term": {
                "website.exact": domain
              }
            }
          }
        },
        {
          name: 'website',
          query: {
            "query": {
              "term": {
                "website": domain
              }
            }
          }
        },
        {
          name: 'website.domain_only',
          query: {
            "query": {
              "term": {
                "website.domain_only": domain
              }
            }
          }
        },
        {
          name: 'company_name',
          query: {
            "query": {
              "match": {
                "name": company.name
              }
            }
          }
        }
      ];

      let searchData = null;
      let usedApproach = null;

      // Try each approach until we find results
      for (const approach of searchApproaches) {
        console.log(`   🔍 Trying ${approach.name} field...`);
        
        const searchResponse = await fetch('https://api.coresignal.com/cdapi/v2/company_multi_source/search/es_dsl?items_per_page=1', {
          method: 'POST',
          headers: {
            'apikey': this.apiKey,
            'Content-Type': 'application/json',
            'Accept': 'application/json'
          },
          body: JSON.stringify(approach.query)
        });

        this.results.creditsUsed.search++;

        if (!searchResponse.ok) {
          console.log(`   ⚠️ ${approach.name} search failed: ${searchResponse.status} ${searchResponse.statusText}`);
          continue;
        }

        const data = await searchResponse.json();
        
        if (Array.isArray(data) && data.length > 0) {
          searchData = data;
          usedApproach = approach.name;
          console.log(`   ✅ Found ${data.length} results using ${approach.name} field`);
          break;
        } else {
          console.log(`   ⚠️ No results with ${approach.name} field`);
        }
      }

      if (!searchData || searchData.length === 0) {
        console.log(`   ⚠️ No Coresignal data found for ${company.name} with any search approach`);
        this.results.failedEnrichment++;
        return;
      }

      const coresignalCompanyId = searchData[0];
      console.log(`   ✅ Found Coresignal ID: ${coresignalCompanyId} (using ${usedApproach})`);

      // Collect full profile
      const collectResponse = await fetch(`https://api.coresignal.com/cdapi/v2/company_multi_source/collect/${coresignalCompanyId}`, {
        method: 'GET',
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
      
      // Verify this is the right company
      const matchResult = this.calculateCompanyMatchConfidence(company, profileData);
      
      console.log(`   🔍 Match confidence: ${matchResult.confidence}%`);
      
      if (matchResult.confidence >= 50) {
        await this.updateCompanyWithCoresignalData(company, coresignalCompanyId, profileData, matchResult);
        console.log(`   ✅ Successfully enriched: ${company.name} (${matchResult.confidence}% confidence)`);
        this.results.successfullyEnriched++;
        return { status: 'success', company: company.name, coresignalId: coresignalCompanyId, confidence: matchResult.confidence };
      } else {
        console.log(`   ⚠️ Low confidence match (${matchResult.confidence}%): ${company.name}`);
        this.results.failedEnrichment++;
        return { status: 'low_confidence', company: company.name, confidence: matchResult.confidence };
      }

    } catch (error) {
      console.log(`   ❌ Failed to enrich ${company.name}: ${error.message}`);
      this.results.failedEnrichment++;
      this.results.errors.push({
        company: company.name,
        error: error.message
      });
      return { status: 'error', company: company.name, error: error.message };
    }
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

  async updateCompanyWithCoresignalData(company, coresignalId, profileData, matchResult) {
    const enrichedData = {
      coresignalId: coresignalId,
      coresignalData: profileData,
      lastEnrichedAt: new Date().toISOString(),
      enrichmentSource: 'coresignal',
      matchConfidence: matchResult.confidence,
      matchFactors: matchResult.factors,
      matchReasoning: matchResult.reasoning
    };

    // Calculate data quality score
    const qualityScore = this.calculateDataQualityScore(company, profileData);

    // Extract revenue from nested structure
    const revenue = this.extractRevenue(profileData);

    await this.prisma.companies.update({
      where: { id: company.id },
      data: {
        customFields: {
          ...(company.customFields || {}),
          ...enrichedData
        },
        
        // Basic Information
        name: profileData.name || profileData.company_name || company.name,
        description: profileData.description || company.description,
        descriptionEnriched: profileData.description || company.descriptionEnriched,
        
        // Contact Information
        website: profileData.website || company.website,
        domain: profileData.domain || company.domain,
        email: profileData.email || company.email,
        phone: profileData.company_phone_numbers?.[0] || profileData.phone || company.phone,
        
        // Social Media
        linkedinUrl: profileData.linkedin_url || company.linkedinUrl,
        twitterUrl: profileData.twitter_url?.[0] || company.twitterUrl,
        facebookUrl: profileData.facebook_url?.[0] || company.facebookUrl,
        // Skip githubUrl for now due to array handling issues
        
        // Location Information
        address: profileData.company_hq_street || profileData.hq_street || company.address,
        city: profileData.hq_city || profileData.company_hq_city || company.city,
        state: profileData.hq_state || profileData.company_hq_state || company.state,
        country: profileData.hq_country || profileData.company_hq_country || company.country,
        postalCode: profileData.company_hq_zipcode || profileData.hq_zipcode || company.postalCode,
        // Skip hq fields that don't exist in Prisma schema
        
        // Business Information
        industry: profileData.industry || company.industry,
        sector: profileData.sector || company.sector,
        size: profileData.size_range || company.size,
        revenue: revenue || company.revenue,
        employeeCount: profileData.employees_count || profileData.employee_count || company.employeeCount,
        foundedYear: profileData.founded_year ? parseInt(profileData.founded_year) : company.foundedYear,
        
        // Company Status
        isPublic: profileData.is_public || company.isPublic,
        // Skip stockSymbol for now due to array handling issues
        
        // Additional Data - Skip arrays for now to focus on core data
        // naicsCodes: profileData.naics_codes || company.naicsCodes,
        // sicCodes: profileData.sic_codes || company.sicCodes,
        // activeJobPostings: profileData.active_job_postings_count || company.activeJobPostings,
        // linkedinFollowers: profileData.followers_count_linkedin || company.linkedinFollowers,
        // twitterFollowers: profileData.followers_count_twitter || company.twitterFollowers,
        
        // Quality Metrics
        dataQualityScore: qualityScore,
        dataSources: ['coresignal'],
        lastVerified: new Date(),
        updatedAt: new Date()
      }
    });
  }

  extractRevenue(profileData) {
    // Extract revenue from Coresignal's nested structure
    if (!profileData.revenue_annual) return null;
    
    // Try different revenue sources
    const revenueSources = [
      profileData.revenue_annual?.source_1_annual_revenue?.annual_revenue,
      profileData.revenue_annual?.source_2_annual_revenue?.annual_revenue,
      profileData.revenue_annual?.source_3_annual_revenue?.annual_revenue,
      profileData.revenue_annual?.source_4_annual_revenue?.annual_revenue,
      profileData.revenue_annual?.source_5_annual_revenue?.annual_revenue,
      profileData.revenue_annual_range
    ];
    
    for (const revenue of revenueSources) {
      if (revenue && typeof revenue === 'number') {
        return revenue;
      }
      if (revenue && typeof revenue === 'string') {
        // Extract number from string like "$100M" or "100000000"
        const match = revenue.match(/[\d.]+/);
        if (match) {
          let value = parseFloat(match[0]);
          if (revenue.includes('B')) value *= 1000000000;
          else if (revenue.includes('M')) value *= 1000000;
          else if (revenue.includes('K')) value *= 1000;
          return value;
        }
      }
    }
    
    return null;
  }

  calculateDataQualityScore(company, profileData) {
    let score = 0;
    let maxScore = 0;

    // Core fields (40 points)
    maxScore += 40;
    if (company.name) score += 10;
    if (company.website || profileData.website) score += 10;
    if (company.linkedinUrl || profileData.linkedin_url) score += 10;
    if (company.description || profileData.description) score += 10;

    // Coresignal data (40 points)
    maxScore += 40;
    if (profileData.description) score += 10;
    if (profileData.industry) score += 10;
    if (profileData.employee_count || profileData.size_range) score += 10;
    if (profileData.founded_year) score += 10;

    // Business data (20 points)
    maxScore += 20;
    if (profileData.revenue_annual) score += 10;
    if (profileData.stock_ticker || profileData.ownership_status) score += 10;

    return Math.round((score / maxScore) * 100);
  }

  calculateCompanyMatchConfidence(company, coresignalProfile) {
    let score = 0;
    let factors = [];
    
    // Website/Domain match (100 points) - EXACT match preferred, but allow partial matches
    const companyDomain = this.extractDomain(company.website);
    const coresignalDomain = this.extractDomain(coresignalProfile.website);
    
    if (companyDomain && coresignalDomain) {
      const normalizedCompany = this.normalizeDomain(companyDomain);
      const normalizedCoresignal = this.normalizeDomain(coresignalDomain);
      
      if (normalizedCompany === normalizedCoresignal) {
        score += 100;
        factors.push({ factor: 'exact_domain', score: 100, weight: 1.0 });
      } else if (normalizedCompany.includes(normalizedCoresignal) || normalizedCoresignal.includes(normalizedCompany)) {
        score += 80;
        factors.push({ factor: 'partial_domain', score: 80, weight: 0.8 });
      } else {
        // Check if the base domains match (without subdomains)
        const companyBase = normalizedCompany.split('.').slice(-2).join('.');
        const coresignalBase = normalizedCoresignal.split('.').slice(-2).join('.');
        if (companyBase === coresignalBase) {
          score += 60;
          factors.push({ factor: 'base_domain', score: 60, weight: 0.6 });
        }
      }
    }
    
    // Company name match (50 points)
    const companyName = company.name.toLowerCase().trim();
    const coresignalName = (coresignalProfile.name || coresignalProfile.company_name || '').toLowerCase().trim();
    
    if (companyName && coresignalName) {
      if (companyName === coresignalName) {
        score += 50;
        factors.push({ factor: 'exact_name', score: 50, weight: 0.5 });
      } else if (companyName.includes(coresignalName) || coresignalName.includes(companyName)) {
        score += 30;
        factors.push({ factor: 'partial_name', score: 30, weight: 0.3 });
      }
    }
    
    // If we have any match, give it a chance
    if (score === 0) {
      return { 
        confidence: 0, 
        factors, 
        reasoning: `No domain or name match: ${companyDomain} vs ${coresignalDomain}, ${companyName} vs ${coresignalName}` 
      };
    }
    
    // Bonus points for additional matches (but domain is the key)
    if (company.linkedinUrl && coresignalProfile.linkedin_url) {
      const linkedinMatch = this.normalizeLinkedInUrl(company.linkedinUrl) === 
                            this.normalizeLinkedInUrl(coresignalProfile.linkedin_url);
      if (linkedinMatch) {
        score += 5; // Bonus for LinkedIn match
        factors.push({ factor: 'linkedin', score: 100, weight: 0.05 });
      }
    }
    
    return { 
      confidence: Math.min(100, score), 
      factors, 
      reasoning: `Exact domain match: ${companyDomain} = ${coresignalDomain}` 
    };
  }

  normalizeDomain(domain) {
    if (!domain) return '';
    
    // Remove protocol and www
    let normalized = domain.replace(/^https?:\/\/(www\.)?/, '');
    
    // Remove trailing slash
    normalized = normalized.replace(/\/$/, '');
    
    // Convert to lowercase
    normalized = normalized.toLowerCase();
    
    return normalized;
  }

  normalizeLinkedInUrl(url) {
    if (!url) return '';
    
    // Remove protocol and www
    let normalized = url.replace(/^https?:\/\/(www\.)?/, '');
    
    // Remove trailing slash
    normalized = normalized.replace(/\/$/, '');
    
    // Convert to lowercase
    normalized = normalized.toLowerCase();
    
    return normalized;
  }

  printResults() {
    console.log('\n📊 Dan Adrata Companies Enrichment Results:');
    console.log('='.repeat(60));
    console.log(`Total Companies: ${this.results.totalCompanies}`);
    console.log(`Companies with Websites: ${this.results.withWebsites}`);
    console.log(`Companies without Websites: ${this.results.withoutWebsites}`);
    console.log(`Already Enriched: ${this.results.alreadyEnriched}`);
    console.log(`Successfully Enriched: ${this.results.successfullyEnriched}`);
    console.log(`Failed Enrichment: ${this.results.failedEnrichment}`);
    console.log(`Credits Used - Search: ${this.results.creditsUsed.search}`);
    console.log(`Credits Used - Collect: ${this.results.creditsUsed.collect}`);
    console.log(`Total Credits Used: ${this.results.creditsUsed.search + this.results.creditsUsed.collect}`);
    
    if (this.results.errors.length > 0) {
      console.log(`\n❌ Errors (${this.results.errors.length}):`);
      this.results.errors.slice(0, 10).forEach(error => {
        console.log(`   - ${error.company}: ${error.error}`);
      });
      if (this.results.errors.length > 10) {
        console.log(`   ... and ${this.results.errors.length - 10} more errors`);
      }
    }
  }

  delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

// Run the enrichment
const enrichment = new DanAdrataCompanyEnrichment();
enrichment.run().catch(console.error);
