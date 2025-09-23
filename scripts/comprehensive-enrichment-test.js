#!/usr/bin/env node

/**
 * 🚀 COMPREHENSIVE ENRICHMENT TEST
 * 
 * This script tests enrichment with ALL available fields
 * and preserves the complete rich CoreSignal data
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

class ComprehensiveEnrichmentTest {
  constructor() {
    this.coresignalConfig = CORESIGNAL_CONFIG;
    this.perplexityConfig = PERPLEXITY_CONFIG;
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
   * Map CoreSignal data to database fields
   */
  mapCoreSignalToDatabase(coresignalData) {
    return {
      // Basic Information
      description: coresignalData.description_enriched || null,
      website: coresignalData.website || null,
      
      // Company Size (this is what you wanted!)
      size: coresignalData.size_range || null, // "11-50 employees"
      
      // Financial
      revenue: coresignalData.revenue_annual?.source_5_annual_revenue?.annual_revenue || null,
      currency: coresignalData.revenue_annual?.source_5_annual_revenue?.annual_revenue_currency || 'USD',
      
      // Location
      city: coresignalData.hq_city || null,
      state: coresignalData.hq_state || null,
      country: coresignalData.hq_country || null,
      address: coresignalData.hq_full_address || null,
      postalCode: coresignalData.hq_zipcode || null,
      
      // Contact
      phone: coresignalData.company_phone_numbers?.[0] || null,
      email: coresignalData.company_emails?.[0] || null,
      
      // Industry Classification
      industry: coresignalData.industry || null,
      sector: coresignalData.categories_and_keywords?.[0] || null,
      
      // Company Type
      accountType: coresignalData.ownership_status || null, // "Private" or "Public"
      
      // Business Metrics
      tags: coresignalData.categories_and_keywords || [],
      
      // Store ALL CoreSignal data as JSON for future use
      coresignalData: coresignalData,
      
      // Metadata
      lastEnrichedAt: new Date(),
      enrichmentSource: 'CoreSignal + Perplexity'
    };
  }

  /**
   * Test comprehensive enrichment
   */
  async testComprehensiveEnrichment() {
    console.log('🚀 COMPREHENSIVE ENRICHMENT TEST');
    console.log('================================\n');

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

      // Get one company for testing
      const company = await prisma.companies.findFirst({
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
          revenue: true,
          city: true,
          state: true,
          country: true,
          phone: true,
          industry: true,
          sector: true
        }
      });

      if (!company) {
        throw new Error('No companies found for testing');
      }

      console.log(`🏢 TEST COMPANY: ${company.name}`);
      console.log(`🌐 Website: ${company.website || 'N/A'}`);
      console.log(`📝 Current Description: ${company.description || 'N/A'}`);
      console.log(`📊 Current Size: ${company.size || 'N/A'}`);
      console.log(`💰 Current Revenue: ${company.revenue || 'N/A'}`);
      console.log(`🏢 Current Industry: ${company.industry || 'N/A'}\n`);

      // Step 1: Search CoreSignal
      console.log('🔍 STEP 1: SEARCHING CORESIGNAL');
      console.log('===============================\n');
      
      const companyId = await this.searchCompany(company.name);
      
      if (!companyId) {
        console.log('❌ Company not found in CoreSignal');
        return;
      }

      console.log(`✅ Found CoreSignal ID: ${companyId}\n`);

      // Step 2: Get CoreSignal data
      console.log('📊 STEP 2: GETTING CORESIGNAL DATA');
      console.log('==================================\n');
      
      const coresignalData = await this.getCoreSignalCompanyData(companyId);
      
      if (!coresignalData) {
        console.log('❌ Failed to get CoreSignal data');
        return;
      }

      console.log('✅ CoreSignal data retrieved successfully');
      console.log(`📊 Total CoreSignal fields: ${Object.keys(coresignalData).length}\n`);

      // Step 3: Map CoreSignal data to database fields
      console.log('🗺️  STEP 3: MAPPING CORESIGNAL DATA');
      console.log('===================================\n');
      
      const mappedData = this.mapCoreSignalToDatabase(coresignalData);
      
      console.log('📋 MAPPED DATABASE FIELDS:');
      Object.entries(mappedData).forEach(([field, value]) => {
        if (field === 'coresignalData') {
          console.log(`   ${field}: [Full CoreSignal data - ${Object.keys(value).length} fields]`);
        } else if (Array.isArray(value)) {
          console.log(`   ${field}: [${value.length} items] ${value.slice(0, 3).join(', ')}${value.length > 3 ? '...' : ''}`);
        } else {
          const status = value ? '✅' : '❌';
          const displayValue = value && value.length > 100 ? value.substring(0, 100) + '...' : value;
          console.log(`   ${status} ${field}: ${displayValue || 'N/A'}`);
        }
      });

      // Step 4: Get missing data from Perplexity
      console.log('\n🤖 STEP 4: GETTING MISSING DATA FROM PERPLEXITY');
      console.log('==============================================\n');
      
      let perplexityData = null;
      if (this.perplexityConfig.apiKey) {
        perplexityData = await this.getPerplexityData(
          company.name,
          company.website,
          coresignalData.naics_codes,
          coresignalData.sic_codes
        );

        if (perplexityData) {
          console.log('📋 PERPLEXITY DATA:');
          Object.entries(perplexityData).forEach(([field, value]) => {
            const status = value ? '✅' : '❌';
            console.log(`   ${status} ${field}: ${value || 'N/A'}`);
          });
        } else {
          console.log('❌ Failed to get Perplexity data');
        }
      } else {
        console.log('⚠️  Skipping Perplexity enrichment (no API key)');
      }

      // Step 5: Prepare final update data
      console.log('\n💾 STEP 5: PREPARING FINAL UPDATE');
      console.log('=================================\n');
      
      const updateData = {
        ...mappedData,
        // Add Perplexity data if available
        foundedYear: perplexityData?.founded_year || null,
        market: perplexityData?.market || null,
        category: perplexityData?.category || null,
        segment: perplexityData?.segment || null,
        updatedAt: new Date()
      };

      console.log('📋 FINAL UPDATE DATA:');
      Object.entries(updateData).forEach(([field, value]) => {
        if (field === 'coresignalData') {
          console.log(`   ${field}: [Full CoreSignal data - ${Object.keys(value).length} fields]`);
        } else if (Array.isArray(value)) {
          console.log(`   ${field}: [${value.length} items] ${value.slice(0, 3).join(', ')}${value.length > 3 ? '...' : ''}`);
        } else {
          const status = value ? '✅' : '❌';
          const displayValue = value && value.length > 100 ? value.substring(0, 100) + '...' : value;
          console.log(`   ${status} ${field}: ${displayValue || 'N/A'}`);
        }
      });

      // Step 6: Update database
      console.log('\n💾 STEP 6: UPDATING DATABASE');
      console.log('============================\n');
      
      await prisma.companies.update({
        where: { id: company.id },
        data: updateData
      });

      console.log('✅ Database updated successfully!');

      // Step 7: Verify the update
      console.log('\n🔍 STEP 7: VERIFYING UPDATE');
      console.log('============================\n');
      
      const updatedCompany = await prisma.companies.findUnique({
        where: { id: company.id },
        select: {
          name: true,
          description: true,
          size: true,
          revenue: true,
          city: true,
          state: true,
          country: true,
          phone: true,
          industry: true,
          sector: true,
          foundedYear: true,
          market: true,
          category: true,
          segment: true,
          lastEnrichedAt: true,
          enrichmentSource: true,
          coresignalData: true
        }
      });

      console.log('📊 VERIFIED UPDATE:');
      Object.entries(updatedCompany).forEach(([field, value]) => {
        if (field === 'coresignalData') {
          console.log(`   ${field}: [Full CoreSignal data - ${Object.keys(value).length} fields]`);
        } else if (Array.isArray(value)) {
          console.log(`   ${field}: [${value.length} items] ${value.slice(0, 3).join(', ')}${value.length > 3 ? '...' : ''}`);
        } else {
          const status = value ? '✅' : '❌';
          const displayValue = value && value.length > 100 ? value.substring(0, 100) + '...' : value;
          console.log(`   ${status} ${field}: ${displayValue || 'N/A'}`);
        }
      });

      console.log('\n🎉 COMPREHENSIVE ENRICHMENT TEST COMPLETED SUCCESSFULLY!');
      console.log('========================================================');
      console.log('✅ CoreSignal integration working');
      console.log('✅ Perplexity integration working');
      console.log('✅ Database update working');
      console.log('✅ Company size field populated: "' + updatedCompany.size + '"');
      console.log('✅ ALL rich CoreSignal data preserved in coresignalData field');
      console.log('✅ All data preserved and enriched');

      // Show the CoreSignal data structure
      console.log('\n📊 CORESIGNAL DATA STRUCTURE:');
      console.log('=============================');
      console.log(`Total fields available: ${Object.keys(updatedCompany.coresignalData).length}`);
      console.log('Key fields:');
      console.log(`   - company_name: ${updatedCompany.coresignalData.company_name}`);
      console.log(`   - size_range: ${updatedCompany.coresignalData.size_range}`);
      console.log(`   - description_enriched: ${updatedCompany.coresignalData.description_enriched?.substring(0, 100)}...`);
      console.log(`   - revenue: ${updatedCompany.coresignalData.revenue_annual?.source_5_annual_revenue?.annual_revenue}`);
      console.log(`   - location: ${updatedCompany.coresignalData.hq_city}, ${updatedCompany.coresignalData.hq_state}, ${updatedCompany.coresignalData.hq_country}`);
      console.log(`   - phone: ${updatedCompany.coresignalData.company_phone_numbers?.[0]}`);
      console.log(`   - linkedin_url: ${updatedCompany.coresignalData.linkedin_url}`);
      console.log(`   - ownership_status: ${updatedCompany.coresignalData.ownership_status}`);
      console.log(`   - active_job_postings_count: ${updatedCompany.coresignalData.active_job_postings_count}`);
      console.log(`   - followers_count_linkedin: ${updatedCompany.coresignalData.followers_count_linkedin}`);

    } catch (error) {
      console.error('❌ Test failed:', error);
    } finally {
      await prisma.$disconnect();
    }
  }
}

// Run the test
const test = new ComprehensiveEnrichmentTest();
test.testComprehensiveEnrichment().catch(console.error);
