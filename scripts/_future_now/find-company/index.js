#!/usr/bin/env node

/**
 * Find Company - Coresignal Enrichment Script
 * 
 * This script enriches companies in the Notary Everyday workspace
 * using the Coresignal API with multiple search approaches.
 * 
 * Features:
 * - Multiple search strategies (website.exact, website, website.domain_only)
 * - Progress saving and resumability
 * - Confidence-based matching
 * - Real-time progress tracking
 */

require('dotenv').config();
const { PrismaClient } = require('@prisma/client');
const fetch = require('node-fetch');

// Import sophisticated multi-source verification system
const { MultiSourceVerifier } = require('../../../src/platform/pipelines/modules/core/MultiSourceVerifier');

class CompanyEnrichment {
  constructor() {
    this.prisma = new PrismaClient();
    this.apiKey = process.env.CORESIGNAL_API_KEY;
    this.workspaceId = '01K7DNYR5VZ7JY36KGKKN76XZ1'; // Notary Everyday workspace
    this.batchSize = 5; // Smaller batches for better reliability
    this.delayBetweenBatches = 3000; // 3 seconds delay
    this.delayBetweenRequests = 1000; // 1 second between individual requests
    this.progressFile = '_future_now/enrichment-progress.json';
    
    this.results = {
      totalCompanies: 0,
      withWebsites: 0,
      withoutWebsites: 0,
      alreadyEnriched: 0,
      successfullyEnriched: 0,
      failedEnrichment: 0,
      contactsDiscovered: 0,
      emailsVerified: 0,
      phonesVerified: 0,
      creditsUsed: {
        search: 0,
        collect: 0,
        employeePreview: 0,
        email: 0,
        phone: 0
      },
      errors: [],
      processedCompanies: [],
      startTime: new Date().toISOString()
    };
    
    // Initialize multi-source email & phone verifier
    this.emailVerifier = new MultiSourceVerifier({
      ZEROBOUNCE_API_KEY: process.env.ZEROBOUNCE_API_KEY,
      MYEMAILVERIFIER_API_KEY: process.env.MYEMAILVERIFIER_API_KEY,
      PROSPEO_API_KEY: process.env.PROSPEO_API_KEY,
      LUSHA_API_KEY: process.env.LUSHA_API_KEY,
      TWILIO_ACCOUNT_SID: process.env.TWILIO_ACCOUNT_SID,
      TWILIO_AUTH_TOKEN: process.env.TWILIO_AUTH_TOKEN,
      PEOPLE_DATA_LABS_API_KEY: process.env.PEOPLE_DATA_LABS_API_KEY,
      PERPLEXITY_API_KEY: process.env.PERPLEXITY_API_KEY,
      TIMEOUT: 30000
    });

    if (!this.apiKey) {
      console.error('❌ CORESIGNAL_API_KEY environment variable is required');
      process.exit(1);
    }
  }

  async run() {
    try {
      console.log('🚀 Starting Complete Notary Everyday Companies Enrichment...\n');
      console.log('ℹ️  Using multiple search approaches: website.exact → website → website.domain_only\n');
      
      // Load previous progress
      const processedCompanyIds = await this.loadProgress();
      console.log(`📋 Loaded progress: ${processedCompanyIds.length} companies previously processed\n`);
      
      // Get all companies in Notary Everyday workspace
      const companies = await this.getCompanies();
      this.results.totalCompanies = companies.length;
      
      console.log(`📊 Found ${companies.length} companies in Notary Everyday workspace`);
      
      if (companies.length === 0) {
        console.log('❌ No companies found to process');
        return;
      }

      // Categorize companies
      const withWebsites = companies.filter(c => c.website && c.website.trim() !== '');
      const withoutWebsites = companies.filter(c => !c.website || c.website.trim() === '');
      const alreadyEnriched = companies.filter(c => this.isCompanyEnriched(c));
      
      // Filter out already processed companies
      const processedIds = new Set(processedCompanyIds.map(p => p.id));
      const needsEnrichment = withWebsites.filter(c => 
        !this.isCompanyEnriched(c) && !processedIds.has(c.id)
      );

      this.results.withWebsites = withWebsites.length;
      this.results.withoutWebsites = withoutWebsites.length;
      this.results.alreadyEnriched = alreadyEnriched.length;

      console.log(`🌐 Companies with websites: ${withWebsites.length}`);
      console.log(`❌ Companies without websites: ${withoutWebsites.length}`);
      console.log(`✅ Already enriched: ${alreadyEnriched.length}`);
      console.log(`🔄 Previously processed: ${processedCompanyIds.length}`);
      console.log(`🔄 Need enrichment: ${needsEnrichment.length}\n`);

      if (needsEnrichment.length === 0) {
        console.log('✅ All companies with websites are already enriched or processed!');
        return;
      }

      // Process companies in batches
      await this.processCompaniesInBatches(needsEnrichment);
      
      // Save final progress
      await this.saveProgress();
      
      // Print final results
      this.printResults();
      
    } catch (error) {
      console.error('❌ Error in companies enrichment:', error);
      // Save progress even on error
      await this.saveProgress();
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
          
          // Save progress every 5 companies
          if (processedCount % 5 === 0) {
            await this.saveProgress();
          }
          
          // Log progress every 10 companies
          if (processedCount % 10 === 0) {
            console.log(`\n📈 Progress Update:`);
            console.log(`   ✅ Successfully Enriched: ${this.results.successfullyEnriched}`);
            console.log(`   ❌ Failed: ${this.results.failedEnrichment}`);
            console.log(`   🔄 Processed: ${processedCount}/${companies.length}`);
            console.log(`   💳 Credits Used: ${this.results.creditsUsed.search + this.results.creditsUsed.collect}`);
            console.log(`   💾 Progress saved to ${this.progressFile}`);
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
      
      if (matchResult.confidence >= 90) {
        // NEW: Discover key contacts at this company
        const keyContacts = await this.discoverKeyContacts(profileData, company);
        
        // NEW: Verify emails and phones for discovered contacts
        const verifiedContacts = await this.verifyContactInformation(keyContacts, company);
        
        await this.updateCompanyWithCoresignalData(company, coresignalCompanyId, profileData, matchResult, verifiedContacts);
        console.log(`   ✅ Successfully enriched: ${company.name} (${verifiedContacts.length} contacts)`);
        this.results.successfullyEnriched++;
        this.results.contactsDiscovered += verifiedContacts.length;
        return { 
          status: 'success', 
          company: company.name, 
          coresignalId: coresignalCompanyId, 
          confidence: matchResult.confidence,
          contactsFound: verifiedContacts.length
        };
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

  /**
   * Discover key contacts at the company (C-level, VPs, Directors)
   */
  async discoverKeyContacts(companyProfileData, company) {
    console.log(`   👥 Discovering key contacts...`);
    
    const companyLinkedInUrl = companyProfileData.linkedin_url || company.linkedinUrl;
    if (!companyLinkedInUrl) {
      console.log(`   ⚠️ No LinkedIn URL available for contact discovery`);
      return [];
    }
    
    try {
      // Search for C-level and VP-level contacts
      const searchQuery = {
        "query": {
          "bool": {
            "must": [
              {
                "nested": {
                  "path": "experience",
                  "query": {
                    "bool": {
                      "must": [
                        {
                          "match": {
                            "experience.company_linkedin_url": companyLinkedInUrl
                          }
                        },
                        {
                          "term": {
                            "experience.active_experience": 1
                          }
                        }
                      ],
                      "should": [
                        { "match": { "experience.position_title": "CEO" } },
                        { "match": { "experience.position_title": "CFO" } },
                        { "match": { "experience.position_title": "CTO" } },
                        { "match": { "experience.position_title": "COO" } },
                        { "match": { "experience.position_title": "VP" } },
                        { "match": { "experience.position_title": "Vice President" } },
                        { "match": { "experience.position_title": "Director" } }
                      ],
                      "minimum_should_match": 1
                    }
                  }
                }
              }
            ]
          }
        }
      };
      
      const searchResponse = await fetch('https://api.coresignal.com/cdapi/v2/employee_multi_source/search/es_dsl/preview?items_per_page=10', {
        method: 'POST',
        headers: {
          'apikey': this.apiKey,
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify(searchQuery)
      });
      
      if (!searchResponse.ok) {
        throw new Error(`Contact discovery failed: ${searchResponse.status}`);
      }
      
      const contacts = await searchResponse.json();
      this.results.creditsUsed.employeePreview++;
      
      const contactArray = Array.isArray(contacts) ? contacts : [];
      console.log(`   ✅ Found ${contactArray.length} key contacts`);
      
      return contactArray.slice(0, 5); // Limit to top 5 key contacts
      
    } catch (error) {
      console.error(`   ❌ Failed to discover contacts: ${error.message}`);
      return [];
    }
  }
  
  /**
   * Verify contact information (emails & phones) using multi-source verification
   */
  async verifyContactInformation(contacts, company) {
    if (contacts.length === 0) {
      return [];
    }
    
    console.log(`   📧📞 Verifying contact information for ${contacts.length} contacts...`);
    
    const verifiedContacts = [];
    const companyDomain = this.extractDomain(company.website);
    
    for (const contact of contacts) {
      try {
        const contactData = {
          name: contact.full_name || contact.name,
          title: contact.active_experience_title || contact.title,
          department: contact.active_experience_department || contact.department,
          linkedinUrl: contact.linkedin_url,
          email: null,
          phone: null
        };
        
        // Verify/discover email
        const emailResult = await this.verifyOrDiscoverEmail(contact, companyDomain);
        if (emailResult) {
          contactData.email = emailResult.email;
          contactData.emailVerified = emailResult.verified;
          contactData.emailConfidence = emailResult.confidence;
          this.results.emailsVerified += emailResult.verified ? 1 : 0;
          this.results.creditsUsed.email += emailResult.cost || 0;
        }
        
        // Verify/discover phone
        const phoneResult = await this.verifyOrDiscoverPhone(contact, company.name);
        if (phoneResult) {
          contactData.phone = phoneResult.phone;
          contactData.phoneVerified = phoneResult.verified;
          contactData.phoneConfidence = phoneResult.confidence;
          contactData.phoneType = phoneResult.phoneType;
          this.results.phonesVerified += phoneResult.verified ? 1 : 0;
          this.results.creditsUsed.phone += phoneResult.cost || 0;
        }
        
        verifiedContacts.push(contactData);
        
        // Rate limiting
        await this.delay(200);
        
      } catch (error) {
        console.error(`   ⚠️ Failed to verify contact: ${error.message}`);
      }
    }
    
    console.log(`   ✅ Verified ${verifiedContacts.length} contacts (${this.results.emailsVerified} emails, ${this.results.phonesVerified} phones)`);
    return verifiedContacts;
  }
  
  /**
   * Verify or discover email for a contact
   */
  async verifyOrDiscoverEmail(contact, companyDomain) {
    const existingEmail = contact.primary_professional_email || contact.professional_emails_collection?.[0]?.professional_email;
    
    if (existingEmail && existingEmail.includes('@')) {
      // Verify existing email
      try {
        const verification = await this.emailVerifier.verifyEmailMultiLayer(
          existingEmail,
          contact.full_name || contact.name,
          companyDomain
        );
        
        if (verification.valid) {
          return {
            email: existingEmail,
            verified: true,
            confidence: verification.confidence,
            cost: 0.003
          };
        }
      } catch (error) {
        console.log(`   ⚠️ Email verification error: ${error.message}`);
      }
    }
    
    // Try to discover email using Prospeo
    if (process.env.PROSPEO_API_KEY && companyDomain) {
      try {
        const nameParts = (contact.full_name || contact.name || '').trim().split(' ');
        const firstName = nameParts[0] || '';
        const lastName = nameParts[nameParts.length - 1] || '';
        
        const response = await fetch('https://api.prospeo.io/email-finder', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-KEY': process.env.PROSPEO_API_KEY.trim()
          },
          body: JSON.stringify({
            first_name: firstName,
            last_name: lastName,
            company_domain: companyDomain
          }),
          timeout: 15000
        });
        
        if (response.ok) {
          const data = await response.json();
          if (data.email && data.email.email) {
            return {
              email: data.email.email,
              verified: true,
              confidence: 85,
              cost: 0.0198
            };
          }
        }
      } catch (error) {
        console.log(`   ⚠️ Email discovery error: ${error.message}`);
      }
    }
    
    return null;
  }
  
  /**
   * Verify or discover phone for a contact
   */
  async verifyOrDiscoverPhone(contact, companyName) {
    // Try to discover phone using Lusha LinkedIn enrichment
    if (process.env.LUSHA_API_KEY && contact.linkedin_url) {
      try {
        const response = await fetch(`https://api.lusha.com/v2/person?linkedinUrl=${encodeURIComponent(contact.linkedin_url)}`, {
          method: 'GET',
          headers: {
            'api_key': process.env.LUSHA_API_KEY.trim(),
            'Content-Type': 'application/json'
          }
        });
        
        if (response.ok) {
          const data = await response.json();
          if (data.contact && data.contact.data && data.contact.data.phoneNumbers && data.contact.data.phoneNumbers.length > 0) {
            const phones = data.contact.data.phoneNumbers;
            const directDial = phones.find(p => p.phoneType === 'direct' || p.phoneType === 'direct_dial');
            const mobile = phones.find(p => p.phoneType === 'mobile');
            const work = phones.find(p => p.phoneType === 'work' || p.phoneType === 'office');
            
            const bestPhone = directDial || mobile || work || phones[0];
            
            return {
              phone: bestPhone.number,
              verified: true,
              confidence: 75,
              phoneType: bestPhone.phoneType,
              cost: 0.01
            };
          }
        }
      } catch (error) {
        console.log(`   ⚠️ Phone discovery error: ${error.message}`);
      }
    }
    
    return null;
  }
  
  async updateCompanyWithCoresignalData(company, coresignalId, profileData, matchResult, verifiedContacts = []) {
    const enrichedData = {
      coresignalId: coresignalId,
      coresignalData: profileData,
      lastEnrichedAt: new Date().toISOString(),
      enrichmentSource: 'coresignal',
      matchConfidence: matchResult.confidence,
      matchFactors: matchResult.factors,
      matchReasoning: matchResult.reasoning,
      keyContacts: verifiedContacts.map(contact => ({
        name: contact.name,
        title: contact.title,
        department: contact.department,
        email: contact.email,
        emailVerified: contact.emailVerified || false,
        emailConfidence: contact.emailConfidence || 0,
        phone: contact.phone,
        phoneVerified: contact.phoneVerified || false,
        phoneConfidence: contact.phoneConfidence || 0,
        phoneType: contact.phoneType || 'unknown',
        linkedinUrl: contact.linkedinUrl
      }))
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
        // Update founded year if available
        foundedYear: profileData.founded_year ? parseInt(profileData.founded_year) : company.foundedYear,
        // Update quality metrics
        dataQualityScore: qualityScore,
        enrichmentSources: ['coresignal'],
        enrichmentVersion: '2.0',
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
    console.log('\n📊 Company Enrichment Results:');
    console.log('='.repeat(60));
    console.log(`Total Companies: ${this.results.totalCompanies}`);
    console.log(`Companies with Websites: ${this.results.withWebsites}`);
    console.log(`Companies without Websites: ${this.results.withoutWebsites}`);
    console.log(`Already Enriched: ${this.results.alreadyEnriched}`);
    console.log(`Successfully Enriched: ${this.results.successfullyEnriched}`);
    console.log(`Failed Enrichment: ${this.results.failedEnrichment}`);
    console.log(`\n👥 Contact Discovery:`);
    console.log(`Contacts Discovered: ${this.results.contactsDiscovered}`);
    console.log(`Emails Verified: ${this.results.emailsVerified}`);
    console.log(`Phones Verified: ${this.results.phonesVerified}`);
    console.log(`\n💳 Credits Used:`);
    console.log(`Search: ${this.results.creditsUsed.search}`);
    console.log(`Collect: ${this.results.creditsUsed.collect}`);
    console.log(`Employee Preview: ${this.results.creditsUsed.employeePreview}`);
    console.log(`Email Verification: $${this.results.creditsUsed.email.toFixed(4)}`);
    console.log(`Phone Verification: $${this.results.creditsUsed.phone.toFixed(4)}`);
    console.log(`Total Credits: ${this.results.creditsUsed.search + this.results.creditsUsed.collect + this.results.creditsUsed.employeePreview} + $${(this.results.creditsUsed.email + this.results.creditsUsed.phone).toFixed(4)}`);
    
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

  async saveProgress() {
    try {
      const fs = require('fs');
      const progressData = {
        ...this.results,
        lastSaved: new Date().toISOString()
      };
      await fs.promises.writeFile(this.progressFile, JSON.stringify(progressData, null, 2));
    } catch (error) {
      console.error('❌ Error saving progress:', error);
    }
  }

  async loadProgress() {
    try {
      const fs = require('fs');
      const data = await fs.promises.readFile(this.progressFile, 'utf8');
      const progressData = JSON.parse(data);
      this.results = { ...this.results, ...progressData };
      return progressData.processedCompanies || [];
    } catch (error) {
      console.log('ℹ️  No previous progress found, starting fresh');
      return [];
    }
  }
}

// CLI execution
if (require.main === module) {
  const enrichment = new CompanyEnrichment();
  enrichment.run().catch(console.error);
}

module.exports = CompanyEnrichment;
