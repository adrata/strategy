#!/usr/bin/env node

/**
 * Zonar Person Companies Enrichment Script
 * 
 * This script enriches companies that are tied to people in the Notary Everyday workspace.
 * It focuses on companies that are actually associated with prospects.
 */

require('dotenv').config();
const { PrismaClient } = require('@prisma/client');

class ZonarPersonCompaniesEnrichment {
  constructor() {
    this.prisma = new PrismaClient();
    this.apiKey = process.env.CORESIGNAL_API_KEY;
    this.workspaceId = '01K7DNYR5VZ7JY36KGKKN76XZ1'; // Notary Everyday workspace
    this.batchSize = 5; // Smaller batches for person companies
    this.delayBetweenBatches = 3000; // 3 seconds between batches
    
    this.results = {
      totalPersonCompanies: 0,
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
      console.log('🚀 Starting Zonar Person Companies Enrichment for Notary Everyday workspace...\n');
      console.log('ℹ️  Focus: Companies tied to people (prospects)\n');
      
      // Get all companies that are tied to people
      const personCompanies = await this.getPersonCompanies();
      this.results.totalPersonCompanies = personCompanies.length;
      
      console.log(`📊 Found ${personCompanies.length} companies tied to people in Notary Everyday workspace`);
      
      if (personCompanies.length === 0) {
        console.log('❌ No person companies found to process');
        return;
      }

      // Process companies in batches
      await this.processCompaniesInBatches(personCompanies);
      
      // Print final results
      this.printResults();
      
    } catch (error) {
      console.error('❌ Error in person companies enrichment:', error);
    } finally {
      await this.prisma.$disconnect();
    }
  }

  async getPersonCompanies() {
    // Get companies that have people associated with them
    const companies = await this.prisma.companies.findMany({
      where: {
        workspaceId: this.workspaceId,
        deletedAt: null,
        people: {
          some: {
            deletedAt: null
          }
        }
      },
      include: {
        people: {
          where: {
            deletedAt: null
          },
          select: {
            id: true,
            firstName: true,
            lastName: true,
            jobTitle: true
          }
        }
      },
      orderBy: {
        createdAt: 'asc'
      }
    });

    return companies;
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
    const peopleCount = company.people.length;
    const peopleNames = company.people.map(p => `${p.firstName} ${p.lastName}`).join(', ');
    
    console.log(`   🔍 Processing: ${company.name}`);
    console.log(`   👥 Associated people (${peopleCount}): ${peopleNames}`);
    
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
      // Try direct enrichment endpoint first if we have a website
      if (company.website) {
        const domain = this.extractDomain(company.website);
        if (domain) {
          console.log(`   🔍 Trying direct enrichment for domain: ${domain}`);
          const enrichResult = await this.tryDirectEnrichment(company, domain);
          if (enrichResult) {
            console.log(`   ✅ Enriched via direct API: ${company.name}`);
            this.results.successfullyEnriched++;
            return;
          }
        }
      }

      // Fallback to search with exact_website filter
      console.log(`   🔍 Trying search with exact_website filter`);
      const searchResult = await this.trySearchEnrichment(company);
      if (searchResult) {
        console.log(`   ✅ Enriched via search API: ${company.name}`);
        this.results.successfullyEnriched++;
        return;
      }

      console.log(`   ⚠️ No Coresignal data found for ${company.name} - likely not in database`);
      this.results.failedEnrichment++;

    } catch (error) {
      console.error(`   ❌ Failed to enrich ${company.name}:`, error.message);
      this.results.failedEnrichment++;
    }
  }

  async tryDirectEnrichment(company, domain) {
    try {
      // Use the direct enrichment endpoint with website parameter
      const enrichResponse = await fetch(`https://api.coresignal.com/cdapi/v2/company_multi_source/enrich?website=${encodeURIComponent(domain)}`, {
        method: 'GET',
        headers: {
          'apikey': this.apiKey,
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        }
      });

      this.results.creditsUsed.search++; // Direct enrichment counts as 1 credit

      if (!enrichResponse.ok) {
        if (enrichResponse.status === 404) {
          console.log(`   ⚠️ Company not found via direct enrichment`);
          return null;
        }
        throw new Error(`Direct enrichment failed: ${enrichResponse.status} ${enrichResponse.statusText}`);
      }

      const profileData = await enrichResponse.json();
      
      // Verify this is the right company
      const matchResult = this.calculateCompanyMatchConfidence(company, profileData);
      
      console.log(`   🔍 Direct match confidence: ${matchResult.confidence}%`);
      console.log(`   📊 Match factors:`, matchResult.factors);
      
      if (matchResult.confidence >= 90) {
        await this.updateCompanyWithCoresignalData(company, profileData.id, profileData, matchResult);
        return true;
      }
      
      console.log(`   ⚠️ Direct enrichment confidence too low: ${matchResult.confidence}%`);
      return null;

    } catch (error) {
      console.log(`   ⚠️ Direct enrichment error: ${error.message}`);
      return null;
    }
  }

  async trySearchEnrichment(company) {
    try {
      // Build search query with exact_website filter
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
      
      // Handle different response formats
      let companyIds = [];
      if (Array.isArray(searchData)) {
        companyIds = searchData;
      } else if (searchData.hits?.hits) {
        companyIds = searchData.hits.hits.map(hit => hit._id || hit._source?.id);
      } else if (searchData.hits) {
        companyIds = searchData.hits;
      }

      if (companyIds.length === 0) {
        console.log(`   ⚠️ No results from search`);
        return null;
      }

      // Get profiles for all matches and calculate confidence scores
      let bestMatch = null;
      let bestConfidence = 0;
      
      for (const coresignalCompanyId of companyIds.slice(0, 3)) { // Check top 3 matches
        try {
          const collectResponse = await fetch(`https://api.coresignal.com/cdapi/v2/company_multi_source/collect/${coresignalCompanyId}`, {
            headers: { 
              'apikey': this.apiKey,
              'Accept': 'application/json'
            }
          });

          this.results.creditsUsed.collect++;

          if (!collectResponse.ok) {
            console.log(`   ⚠️ Failed to collect profile ${coresignalCompanyId}: ${collectResponse.status}`);
            continue;
          }

          const profileData = await collectResponse.json();
          
          // Calculate match confidence
          const matchResult = this.calculateCompanyMatchConfidence(company, profileData);
          
          console.log(`   🔍 Match confidence for ${coresignalCompanyId}: ${matchResult.confidence}%`);
          console.log(`   📊 Match factors:`, matchResult.factors);
          
          if (matchResult.confidence > bestConfidence) {
            bestConfidence = matchResult.confidence;
            bestMatch = { coresignalCompanyId, profileData, matchResult };
          }
          
        } catch (error) {
          console.log(`   ⚠️ Error collecting profile ${coresignalCompanyId}:`, error.message);
          continue;
        }
      }

      // Only proceed if we have a high confidence match (exact domain match)
      if (!bestMatch || bestConfidence < 90) {
        console.log(`   ⚠️ No exact match found (best: ${bestConfidence}%)`);
        return null;
      }

      // Update company with Coresignal data including match confidence
      await this.updateCompanyWithCoresignalData(company, bestMatch.coresignalCompanyId, bestMatch.profileData, bestMatch.matchResult);
      
      console.log(`   🎯 Match found with ${bestConfidence}% confidence`);
      return true;

    } catch (error) {
      console.log(`   ⚠️ Search enrichment error: ${error.message}`);
      return null;
    }
  }

  buildSearchQuery(company) {
    const mustClauses = [];
    const shouldClauses = [];

    // Use exact_website filter for precise domain matching (highest priority)
    if (company.website) {
      const domain = this.extractDomain(company.website);
      if (domain) {
        // Coresignal's exact_website filter - this is the key for exact matches
        mustClauses.push({
          term: { 'exact_website': domain }
        });
        
        // Also try variations as fallback
        shouldClauses.push(
          { term: { 'exact_website': `www.${domain}` } },
          { term: { 'exact_website': `https://${domain}` } },
          { term: { 'exact_website': `http://${domain}` } },
          { term: { 'website': domain } },
          { term: { 'domain': domain } }
        );
      }
    }

    // Add company name as additional filter
    if (company.name) {
      shouldClauses.push(
        { match: { 'name': company.name } },
        { match_phrase: { 'name': company.name } }
      );
    }

    // LinkedIn URL matching as additional signal
    if (company.linkedinUrl) {
      shouldClauses.push(
        { term: { 'linkedin_url': this.normalizeLinkedInUrl(company.linkedinUrl) } }
      );
    }

    const query = {
      query: {
        bool: {
          must: mustClauses.length > 0 ? mustClauses : undefined,
          should: shouldClauses.length > 0 ? shouldClauses : undefined,
          minimum_should_match: mustClauses.length > 0 ? undefined : 1
        }
      }
    };

    // Remove undefined fields
    if (!query.query.bool.must) delete query.query.bool.must;
    if (!query.query.bool.should) delete query.query.bool.should;
    if (!query.query.bool.minimum_should_match) delete query.query.bool.minimum_should_match;

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
        // Update founded year if available (convert to int)
        foundedYear: profileData.founded_year ? parseInt(profileData.founded_year) : company.foundedYear,
        // Update quality metrics
        dataQualityScore: qualityScore,
        enrichmentSources: ['coresignal'],
        enrichmentVersion: '1.0',
        lastEnriched: new Date(),
        updatedAt: new Date()
      }
    });
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
    
    // Website/Domain match (100 points) - EXACT match required for companies
    const companyDomain = this.extractDomain(company.website);
    const coresignalDomain = this.extractDomain(coresignalProfile.website);
    
    if (companyDomain && coresignalDomain) {
      const domainMatch = this.normalizeDomain(companyDomain) === this.normalizeDomain(coresignalDomain);
      score += domainMatch ? 100 : 0;
      factors.push({ factor: 'domain', score: domainMatch ? 100 : 0, weight: 1.0 });
    }
    
    // If no exact domain match, this is not the right company
    if (score === 0) {
      return { 
        confidence: 0, 
        factors, 
        reasoning: `No exact domain match: ${companyDomain} vs ${coresignalDomain}` 
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
    console.log('\n📊 Zonar Person Companies Enrichment Results:');
    console.log('===============================================');
    console.log(`Total Person Companies: ${this.results.totalPersonCompanies}`);
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
const enrichment = new ZonarPersonCompaniesEnrichment();
enrichment.run().catch(console.error);
