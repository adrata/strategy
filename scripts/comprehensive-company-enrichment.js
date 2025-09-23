#!/usr/bin/env node

/**
 * 🚀 COMPREHENSIVE COMPANY ENRICHMENT
 * 
 * This script enriches companies with CoreSignal data and Perplexity AI
 * - Preserves ALL 178 CoreSignal fields for future use
 * - Maps Overview tab fields correctly
 * - Uses Perplexity only for missing fields (Founded Year, Market/Category/Segment)
 * - Stores everything for potential use in other parts of the page
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

class ComprehensiveCompanyEnrichment {
  constructor() {
    this.coresignalConfig = CORESIGNAL_CONFIG;
    this.perplexityConfig = PERPLEXITY_CONFIG;
    this.stats = {
      totalProcessed: 0,
      coresignalEnriched: 0,
      perplexityEnriched: 0,
      errors: 0
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
        max_tokens: 500
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
   * Get missing data from Perplexity
   */
  async getPerplexityData(companyName, website, naicsCodes, sicCodes) {
    const query = `For the company "${companyName}" (website: ${website}), provide the following information in JSON format:
    {
      "founded_year": "YYYY",
      "market": "Primary market/industry",
      "category": "Business category",
      "segment": "Market segment"
    }
    
    Use the following industry codes for context:
    - NAICS: ${naicsCodes || 'Not available'}
    - SIC: ${sicCodes || 'Not available'}
    
    If any information is not available, use null.`;

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
   * Map CoreSignal data to Overview tab fields
   */
  mapOverviewTabFields(coresignalData) {
    return {
      // Basic Information
      companyName: coresignalData.company_name || null,
      description: coresignalData.description_enriched || null,
      website: coresignalData.website || null,
      
      // Company Size (this is what you wanted!)
      size: coresignalData.size_range || null, // "11-50 employees"
      employeeCount: coresignalData.employees_count || null,
      
      // Location
      headquarters: coresignalData.hq_full_address || coresignalData.hq_location || null,
      city: coresignalData.hq_city || null,
      state: coresignalData.hq_state || null,
      country: coresignalData.hq_country || null,
      
      // Contact
      phone: coresignalData.company_phone_numbers?.[0] || null,
      
      // Social Media
      linkedinUrl: coresignalData.linkedin_url || null,
      twitterUrl: coresignalData.twitter_url?.[0] || null,
      facebookUrl: coresignalData.facebook_url?.[0] || null,
      
      // Financial
      revenue: coresignalData.revenue_annual?.source_5_annual_revenue?.annual_revenue || null,
      revenueCurrency: coresignalData.revenue_annual?.source_5_annual_revenue?.annual_revenue_currency || null,
      
      // Company Type (ownership_status)
      companyType: coresignalData.ownership_status || null, // "Private" or "Public"
      
      // Industry Classification
      naicsCodes: coresignalData.naics_codes || [],
      sicCodes: coresignalData.sic_codes || [],
      
      // Business Metrics
      activeJobPostings: coresignalData.active_job_postings_count || null,
      linkedinFollowers: coresignalData.followers_count_linkedin || null,
      
      // Status
      status: coresignalData.status?.value || null,
      isPublic: coresignalData.is_public || false,
      isB2B: coresignalData.is_b2b || false
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
        return { success: false, reason: 'Not found in CoreSignal' };
      }

      console.log(`✅ Found CoreSignal ID: ${companyId}`);

      // Step 2: Get CoreSignal data
      console.log('📊 Step 2: Getting CoreSignal data...');
      const coresignalData = await this.getCoreSignalCompanyData(companyId);
      
      if (!coresignalData) {
        console.log('❌ Failed to get CoreSignal data');
        return { success: false, reason: 'CoreSignal data retrieval failed' };
      }

      console.log('✅ CoreSignal data retrieved');

      // Step 3: Map Overview tab fields
      console.log('🗺️  Step 3: Mapping Overview tab fields...');
      const overviewFields = this.mapOverviewTabFields(coresignalData);
      
      console.log('📋 Overview Tab Fields:');
      Object.entries(overviewFields).forEach(([field, value]) => {
        const status = value ? '✅' : '❌';
        console.log(`   ${status} ${field}: ${value || 'N/A'}`);
      });

      // Step 4: Get missing data from Perplexity
      console.log('🤖 Step 4: Getting missing data from Perplexity...');
      const perplexityData = await this.getPerplexityData(
        company.name,
        company.website,
        overviewFields.naicsCodes,
        overviewFields.sicCodes
      );

      if (perplexityData) {
        console.log('📋 Perplexity Data:');
        Object.entries(perplexityData).forEach(([field, value]) => {
          const status = value ? '✅' : '❌';
          console.log(`   ${status} ${field}: ${value || 'N/A'}`);
        });
      }

      // Step 5: Prepare update data
      const updateData = {
        // Overview tab fields
        description: overviewFields.description,
        size: overviewFields.size, // This is the company size you wanted!
        revenue: overviewFields.revenue,
        city: overviewFields.city,
        state: overviewFields.state,
        country: overviewFields.country,
        phone: overviewFields.phone,
        linkedinUrl: overviewFields.linkedinUrl,
        
        // Perplexity data
        foundedYear: perplexityData?.founded_year || null,
        market: perplexityData?.market || null,
        category: perplexityData?.category || null,
        segment: perplexityData?.segment || null,
        
        // Store ALL CoreSignal data as JSON for future use
        coresignalData: coresignalData,
        
        // Metadata
        lastEnrichedAt: new Date(),
        enrichmentSource: 'CoreSignal + Perplexity'
      };

      // Step 6: Update database
      console.log('💾 Step 5: Updating database...');
      await prisma.companies.update({
        where: { id: company.id },
        data: updateData
      });

      console.log('✅ Company enriched successfully!');
      
      this.stats.coresignalEnriched++;
      if (perplexityData) {
        this.stats.perplexityEnriched++;
      }

      return { 
        success: true, 
        coresignalData: coresignalData,
        overviewFields: overviewFields,
        perplexityData: perplexityData
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
    console.log('🚀 COMPREHENSIVE COMPANY ENRICHMENT');
    console.log('==================================\n');

    try {
      await prisma.$connect();
      console.log('✅ Connected to database\n');

      // Check API keys
      if (!this.coresignalConfig.apiKey) {
        throw new Error('CORESIGNAL_API_KEY not set');
      }
      if (!this.perplexityConfig.apiKey) {
        throw new Error('PERPLEXITY_API_KEY not set');
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
          size: true
        },
        take: 10 // Start with 10 companies for testing
      });

      console.log(`📊 Found ${companies.length} companies to enrich\n`);

      // Enrich each company
      for (const company of companies) {
        await this.enrichCompany(company);
        this.stats.totalProcessed++;
        
        // Add delay to respect API rate limits
        await new Promise(resolve => setTimeout(resolve, 1000));
      }

      // Final statistics
      console.log('\n📊 ENRICHMENT COMPLETE');
      console.log('======================');
      console.log(`Total Processed: ${this.stats.totalProcessed}`);
      console.log(`CoreSignal Enriched: ${this.stats.coresignalEnriched}`);
      console.log(`Perplexity Enriched: ${this.stats.perplexityEnriched}`);
      console.log(`Errors: ${this.stats.errors}`);

    } catch (error) {
      console.error('❌ Enrichment failed:', error);
    } finally {
      await prisma.$disconnect();
    }
  }
}

// Run the enrichment
const enrichment = new ComprehensiveCompanyEnrichment();
enrichment.enrichAllCompanies().catch(console.error);
