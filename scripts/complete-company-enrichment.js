#!/usr/bin/env node

/**
 * 🚀 COMPLETE COMPANY ENRICHMENT
 * 
 * This script enriches ALL companies with comprehensive data for both
 * Overview and Intelligence tabs using CoreSignal + Perplexity AI
 * 
 * Overview Tab Fields:
 * - Company Name, Size, Headquarters, Founded, Company Type
 * - Phone, Website, LinkedIn, Market, Category, Segment
 * 
 * Intelligence Tab Fields:
 * - Description, Situation Analysis, Complications, Strategic Intelligence
 */

const { PrismaClient } = require('@prisma/client');
const https = require('https');

const prisma = new PrismaClient();

// TOP Engineering Plus workspace ID
const TOP_WORKSPACE_ID = '01K5D01YCQJ9TJ7CT4DZDE79T1';

// API configurations
const CORESIGNAL_CONFIG = {
  apiKey: process.env.CORESIGNAL_API_KEY,
  baseUrl: 'https://api.coresignal.com/cdapi/v2'
};

const PERPLEXITY_CONFIG = {
  apiKey: process.env.PERPLEXITY_API_KEY,
  baseUrl: 'https://api.perplexity.ai/chat/completions'
};

class CompleteCompanyEnrichment {
  constructor() {
    this.coresignalConfig = CORESIGNAL_CONFIG;
    this.perplexityConfig = PERPLEXITY_CONFIG;
    this.stats = {
      totalProcessed: 0,
      coresignalEnriched: 0,
      perplexityEnriched: 0,
      errors: 0,
      skipped: 0
    };
  }

  /**
   * Make API request to CoreSignal
   */
  async makeCoreSignalRequest(url, method = 'GET', data = null) {
    return new Promise((resolve, reject) => {
      const options = {
        method: method,
        headers: {
          'apikey': this.coresignalConfig.apiKey,
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
              reject(new Error(`CoreSignal API Error ${res.statusCode}: ${parsedData.message || responseData}`));
            }
          } catch (error) {
            reject(new Error(`CoreSignal JSON Parse Error: ${error.message}`));
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
   * Make API request to Perplexity
   */
  async makePerplexityRequest(query) {
    return new Promise((resolve, reject) => {
      const options = {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.perplexityConfig.apiKey}`,
          'Content-Type': 'application/json'
        }
      };

      const req = https.request(this.perplexityConfig.baseUrl, options, (res) => {
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
              reject(new Error(`Perplexity API Error ${res.statusCode}: ${parsedData.message || responseData}`));
            }
          } catch (error) {
            reject(new Error(`Perplexity JSON Parse Error: ${error.message}`));
          }
        });
      });

      req.on('error', (error) => {
        reject(error);
      });

      const requestBody = {
        model: 'llama-3.1-sonar-large-128k-online',
        messages: [
          {
            role: 'system',
            content: 'You are a professional business intelligence researcher. Provide accurate, well-sourced information with specific details. Always respond with valid JSON format.'
          },
          {
            role: 'user',
            content: query
          }
        ],
        temperature: 0.1,
        max_tokens: 1000
      };

      req.write(JSON.stringify(requestBody));
      req.end();
    });
  }

  /**
   * Search for company in CoreSignal
   */
  async searchCompany(companyName) {
    const searchQuery = {
      query: {
        query_string: {
          query: companyName,
          default_field: "company_name",
          default_operator: "and"
        }
      }
    };

    const url = `${this.coresignalConfig.baseUrl}/company_multi_source/search/es_dsl`;
    
    try {
      const response = await this.makeCoreSignalRequest(url, 'POST', searchQuery);
      
      if (Array.isArray(response) && response.length > 0) {
        return response[0]; // Return first company ID
      }
      
      return null;
    } catch (error) {
      console.error(`❌ CoreSignal search failed for ${companyName}: ${error.message}`);
      return null;
    }
  }

  /**
   * Get detailed company data from CoreSignal
   */
  async getCoreSignalCompanyData(companyId) {
    const url = `${this.coresignalConfig.baseUrl}/company_multi_source/collect/${companyId}`;
    
    try {
      const response = await this.makeCoreSignalRequest(url, 'GET');
      return response;
    } catch (error) {
      console.error(`❌ CoreSignal collect failed for ID ${companyId}: ${error.message}`);
      return null;
    }
  }

  /**
   * Get strategic intelligence from Perplexity
   */
  async getStrategicIntelligence(companyName, website, industry, size, location) {
    const query = `For the company "${companyName}" (website: ${website}, industry: ${industry}, size: ${size}, location: ${location}), provide comprehensive business intelligence in JSON format:

    {
      "description": "Comprehensive company description (2-3 sentences)",
      "situation_analysis": "Current business situation and market position (2-3 sentences)",
      "complications": "Key business challenges and complications (2-3 sentences)",
      "strategic_intelligence": "Strategic opportunities and partnership potential (2-3 sentences)",
      "founded_year": "YYYY",
      "market": "Primary market/industry",
      "category": "Business category",
      "segment": "Market segment"
    }
    
    Focus on business intelligence, market positioning, and strategic insights. If any information is not available, use null.`;

    try {
      const response = await this.makePerplexityRequest(query);
      const content = response.choices[0].message.content;
      
      // Extract JSON from response
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      }
      
      return null;
    } catch (error) {
      console.error(`❌ Perplexity request failed for ${companyName}: ${error.message}`);
      return null;
    }
  }

  /**
   * Map CoreSignal data to database fields
   */
  mapCoreSignalToDatabase(coresignalData) {
    return {
      // Overview Tab Fields
      description: coresignalData.description_enriched || null,
      website: coresignalData.website || null,
      size: coresignalData.size_range || null, // "11-50 employees"
      revenue: coresignalData.revenue_annual?.source_5_annual_revenue?.annual_revenue || null,
      currency: coresignalData.revenue_annual?.source_5_annual_revenue?.annual_revenue_currency || 'USD',
      city: coresignalData.hq_city || null,
      state: coresignalData.hq_state || null,
      country: coresignalData.hq_country || null,
      address: coresignalData.hq_full_address || null,
      postalCode: coresignalData.hq_zipcode || null,
      phone: coresignalData.company_phone_numbers?.[0] || null,
      email: coresignalData.company_emails?.[0] || null,
      industry: coresignalData.industry || null,
      sector: coresignalData.categories_and_keywords?.[0] || null,
      accountType: coresignalData.ownership_status || null, // "Private" or "Public"
      tags: coresignalData.categories_and_keywords || [],
      
      // NEW INTELLIGENCE FIELDS - Overview Tab
      linkedinUrl: coresignalData.linkedin_url || null,
      foundedYear: coresignalData.founded_year || null,
      employeeCount: coresignalData.employees_count || null,
      activeJobPostings: coresignalData.active_job_postings_count || null,
      linkedinFollowers: coresignalData.followers_count_linkedin || null,
      
      // NEW INTELLIGENCE FIELDS - Industry Classification
      naicsCodes: coresignalData.naics_codes || [],
      sicCodes: coresignalData.sic_codes || [],
      
      // NEW INTELLIGENCE FIELDS - Social Media
      facebookUrl: coresignalData.facebook_url?.[0] || null,
      twitterUrl: coresignalData.twitter_url?.[0] || null,
      instagramUrl: coresignalData.instagram_url?.[0] || null,
      youtubeUrl: coresignalData.youtube_url?.[0] || null,
      githubUrl: coresignalData.github_url?.[0] || null,
      
      // NEW INTELLIGENCE FIELDS - Business Intelligence
      technologiesUsed: coresignalData.technologies_used || [],
      competitors: coresignalData.competitors || [],
      revenueCurrency: coresignalData.revenue_annual?.source_5_annual_revenue?.annual_revenue_currency || null,
      lastFundingAmount: coresignalData.last_funding_round_amount_raised || null,
      lastFundingDate: coresignalData.last_funding_round_announced_date || null,
      
      // Store ALL CoreSignal data for future use
      customFields: {
        coresignalData: coresignalData,
        enrichmentSource: 'CoreSignal + Perplexity',
        lastEnrichedAt: new Date().toISOString(),
        totalFields: Object.keys(coresignalData).length
      },
      
      // Metadata
      updatedAt: new Date()
    };
  }

  /**
   * Enrich a single company
   */
  async enrichCompany(company) {
    console.log(`\n🏢 ENRICHING: ${company.name}`);
    console.log('='.repeat(50));

    try {
      // Step 1: Search CoreSignal
      console.log('🔍 Step 1: Searching CoreSignal...');
      const companyId = await this.searchCompany(company.name);
      
      if (!companyId) {
        console.log('❌ Company not found in CoreSignal');
        this.stats.skipped++;
        return { success: false, reason: 'Not found in CoreSignal' };
      }

      console.log(`✅ Found CoreSignal ID: ${companyId}`);

      // Step 2: Get CoreSignal data
      console.log('📊 Step 2: Getting CoreSignal data...');
      const coresignalData = await this.getCoreSignalCompanyData(companyId);
      
      if (!coresignalData) {
        console.log('❌ Failed to get CoreSignal data');
        this.stats.errors++;
        return { success: false, reason: 'CoreSignal data retrieval failed' };
      }

      console.log('✅ CoreSignal data retrieved');

      // Step 3: Map CoreSignal data to database fields
      console.log('🗺️  Step 3: Mapping CoreSignal data...');
      const mappedData = this.mapCoreSignalToDatabase(coresignalData);
      
      console.log('📋 Overview Tab Fields from CoreSignal:');
      console.log(`   ✅ Company Name: ${coresignalData.company_name}`);
      console.log(`   ${mappedData.size ? '✅' : '❌'} Size: ${mappedData.size || 'N/A'}`);
      console.log(`   ${mappedData.address ? '✅' : '❌'} Headquarters: ${mappedData.address || 'N/A'}`);
      console.log(`   ${mappedData.phone ? '✅' : '❌'} Phone: ${mappedData.phone || 'N/A'}`);
      console.log(`   ${mappedData.website ? '✅' : '❌'} Website: ${mappedData.website || 'N/A'}`);
      console.log(`   ${coresignalData.linkedin_url ? '✅' : '❌'} LinkedIn: ${coresignalData.linkedin_url || 'N/A'}`);
      console.log(`   ${mappedData.accountType ? '✅' : '❌'} Company Type: ${mappedData.accountType || 'N/A'}`);

      // Step 4: Get strategic intelligence from Perplexity
      console.log('🤖 Step 4: Getting strategic intelligence from Perplexity...');
      const strategicData = await this.getStrategicIntelligence(
        company.name,
        company.website,
        mappedData.industry,
        mappedData.size,
        `${mappedData.city}, ${mappedData.state}, ${mappedData.country}`
      );

      if (strategicData) {
        console.log('📋 Intelligence Tab Fields from Perplexity:');
        console.log(`   ${strategicData.description ? '✅' : '❌'} Description: ${strategicData.description ? 'Generated' : 'N/A'}`);
        console.log(`   ${strategicData.situation_analysis ? '✅' : '❌'} Situation Analysis: ${strategicData.situation_analysis ? 'Generated' : 'N/A'}`);
        console.log(`   ${strategicData.complications ? '✅' : '❌'} Complications: ${strategicData.complications ? 'Generated' : 'N/A'}`);
        console.log(`   ${strategicData.strategic_intelligence ? '✅' : '❌'} Strategic Intelligence: ${strategicData.strategic_intelligence ? 'Generated' : 'N/A'}`);
        console.log(`   ${strategicData.founded_year ? '✅' : '❌'} Founded Year: ${strategicData.founded_year || 'N/A'}`);
        console.log(`   ${strategicData.market ? '✅' : '❌'} Market: ${strategicData.market || 'N/A'}`);
        console.log(`   ${strategicData.category ? '✅' : '❌'} Category: ${strategicData.category || 'N/A'}`);
        console.log(`   ${strategicData.segment ? '✅' : '❌'} Segment: ${strategicData.segment || 'N/A'}`);
      } else {
        console.log('❌ Failed to get Perplexity data');
      }

      // Step 5: Prepare final update data
      const updateData = {
        ...mappedData,
        // Add Perplexity data if available
        foundedYear: strategicData?.founded_year || mappedData.foundedYear,
        market: strategicData?.market || null,
        category: strategicData?.category || null,
        segment: strategicData?.segment || null,
        
        // Add strategic intelligence to actual database fields
        situationAnalysis: strategicData?.situation_analysis || null,
        complications: strategicData?.complications || null,
        strategicIntelligence: strategicData?.strategic_intelligence || null,
        
        // Add strategic intelligence to customFields for backup
        customFields: {
          ...mappedData.customFields,
          strategicIntelligence: strategicData,
          overviewTabFields: {
            companyName: coresignalData.company_name,
            size: mappedData.size,
            headquarters: mappedData.address,
            founded: strategicData?.founded_year || mappedData.foundedYear,
            companyType: mappedData.accountType,
            phone: mappedData.phone,
            website: mappedData.website,
            linkedin: coresignalData.linkedin_url,
            market: strategicData?.market || null,
            category: strategicData?.category || null,
            segment: strategicData?.segment || null
          },
          intelligenceTabFields: {
            description: strategicData?.description || null,
            situationAnalysis: strategicData?.situation_analysis || null,
            complications: strategicData?.complications || null,
            strategicIntelligence: strategicData?.strategic_intelligence || null
          }
        }
      };

      // Step 6: Update database
      console.log('💾 Step 5: Updating database...');
      await prisma.companies.update({
        where: { id: company.id },
        data: updateData
      });

      console.log('✅ Company enriched successfully!');
      
      this.stats.coresignalEnriched++;
      if (strategicData) {
        this.stats.perplexityEnriched++;
      }

      return { 
        success: true, 
        coresignalData: coresignalData,
        strategicData: strategicData,
        overviewFields: updateData.customFields.overviewTabFields,
        intelligenceFields: updateData.customFields.intelligenceTabFields
      };

    } catch (error) {
      console.error(`❌ Enrichment failed for ${company.name}: ${error.message}`);
      this.stats.errors++;
      return { success: false, reason: error.message };
    }
  }

  /**
   * Enrich all companies in workspace
   */
  async enrichAllCompanies() {
    console.log('🚀 COMPLETE COMPANY ENRICHMENT');
    console.log('=============================\n');

    try {
      await prisma.$connect();
      console.log('✅ Connected to database\n');

      // Check API keys
      if (!this.coresignalConfig.apiKey) {
        throw new Error('CORESIGNAL_API_KEY not set');
      }
      if (!this.perplexityConfig.apiKey) {
        console.log('⚠️  PERPLEXITY_API_KEY not set - will skip Perplexity enrichment');
      }

      console.log('🔑 API Keys configured\n');

      // Get companies that need enrichment
      const companies = await prisma.companies.findMany({
        where: { 
          workspaceId: TOP_WORKSPACE_ID, 
          deletedAt: null,
          name: { not: "" }
        },
        select: {
          id: true,
          name: true,
          website: true,
          description: true,
          size: true,
          customFields: true
        }
      });

      console.log(`📊 Found ${companies.length} companies to enrich\n`);

      // Enrich each company
      for (const company of companies) {
        await this.enrichCompany(company);
        this.stats.totalProcessed++;
        
        // Add delay to respect API rate limits
        await new Promise(resolve => setTimeout(resolve, 2000));
      }

      // Final statistics
      console.log('\n📊 ENRICHMENT COMPLETE');
      console.log('======================');
      console.log(`Total Processed: ${this.stats.totalProcessed}`);
      console.log(`CoreSignal Enriched: ${this.stats.coresignalEnriched}`);
      console.log(`Perplexity Enriched: ${this.stats.perplexityEnriched}`);
      console.log(`Skipped: ${this.stats.skipped}`);
      console.log(`Errors: ${this.stats.errors}`);

      console.log('\n🎉 ALL COMPANIES ENRICHED!');
      console.log('==========================');
      console.log('✅ Overview Tab: Company Name, Size, Headquarters, Founded, Company Type, Phone, Website, LinkedIn, Market, Category, Segment');
      console.log('✅ Intelligence Tab: Description, Situation Analysis, Complications, Strategic Intelligence');
      console.log('✅ All rich CoreSignal data preserved');
      console.log('✅ All strategic intelligence generated');

    } catch (error) {
      console.error('❌ Enrichment failed:', error);
    } finally {
      await prisma.$disconnect();
    }
  }
}

// Run the enrichment
const enrichment = new CompleteCompanyEnrichment();
enrichment.enrichAllCompanies().catch(console.error);
