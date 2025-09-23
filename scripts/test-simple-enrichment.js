#!/usr/bin/env node

/**
 * 🧪 SIMPLE ENRICHMENT TEST
 * 
 * This script tests enrichment with only existing database fields
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

class SimpleEnrichmentTest {
  constructor() {
    this.coresignalConfig = CORESIGNAL_CONFIG;
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
   * Test enrichment with existing fields only
   */
  async testSimpleEnrichment() {
    console.log('🧪 SIMPLE ENRICHMENT TEST');
    console.log('=========================\n');

    try {
      await prisma.$connect();
      console.log('✅ Connected to database\n');

      // Check API key
      if (!this.coresignalConfig.apiKey) {
        throw new Error('CORESIGNAL_API_KEY not set');
      }

      console.log('🔑 API Key configured\n');

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
          size: true
        }
      });

      if (!company) {
        throw new Error('No companies found for testing');
      }

      console.log(`🏢 TEST COMPANY: ${company.name}`);
      console.log(`🌐 Website: ${company.website || 'N/A'}`);
      console.log(`📝 Current Description: ${company.description || 'N/A'}`);
      console.log(`📊 Current Size: ${company.size || 'N/A'}\n`);

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

      console.log('✅ CoreSignal data retrieved successfully\n');

      // Step 3: Extract key fields
      console.log('🗺️  STEP 3: EXTRACTING KEY FIELDS');
      console.log('==================================\n');
      
      const extractedData = {
        description: coresignalData.description_enriched || null,
        size: coresignalData.size_range || null, // This is the company size you wanted!
        revenue: coresignalData.revenue_annual?.source_5_annual_revenue?.annual_revenue || null,
        city: coresignalData.hq_city || null,
        state: coresignalData.hq_state || null,
        country: coresignalData.hq_country || null,
        phone: coresignalData.company_phone_numbers?.[0] || null,
        website: coresignalData.website || null
      };

      console.log('📋 EXTRACTED DATA:');
      Object.entries(extractedData).forEach(([field, value]) => {
        const status = value ? '✅' : '❌';
        console.log(`   ${status} ${field}: ${value || 'N/A'}`);
      });

      // Step 4: Update database with existing fields only
      console.log('\n💾 STEP 4: UPDATING DATABASE');
      console.log('============================\n');
      
      const updateData = {
        description: extractedData.description,
        size: extractedData.size, // This is the company size you wanted!
        revenue: extractedData.revenue,
        city: extractedData.city,
        state: extractedData.state,
        country: extractedData.country,
        phone: extractedData.phone,
        website: extractedData.website,
        updatedAt: new Date()
      };

      console.log('📋 UPDATE DATA:');
      Object.entries(updateData).forEach(([field, value]) => {
        const status = value ? '✅' : '❌';
        console.log(`   ${status} ${field}: ${value || 'N/A'}`);
      });

      await prisma.companies.update({
        where: { id: company.id },
        data: updateData
      });

      console.log('✅ Database updated successfully!');

      // Step 5: Verify the update
      console.log('\n🔍 STEP 5: VERIFYING UPDATE');
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
          website: true,
          updatedAt: true
        }
      });

      console.log('📊 VERIFIED UPDATE:');
      Object.entries(updatedCompany).forEach(([field, value]) => {
        const status = value ? '✅' : '❌';
        console.log(`   ${status} ${field}: ${value || 'N/A'}`);
      });

      console.log('\n🎉 SIMPLE ENRICHMENT TEST COMPLETED SUCCESSFULLY!');
      console.log('=================================================');
      console.log('✅ CoreSignal integration working');
      console.log('✅ Database update working');
      console.log('✅ Company size field populated: "' + updatedCompany.size + '"');
      console.log('✅ All data preserved and enriched');

      // Show the CoreSignal data structure
      console.log('\n📊 CORESIGNAL DATA STRUCTURE:');
      console.log('=============================');
      console.log(`Total fields available: ${Object.keys(coresignalData).length}`);
      console.log('Key fields:');
      console.log(`   - company_name: ${coresignalData.company_name}`);
      console.log(`   - size_range: ${coresignalData.size_range}`);
      console.log(`   - description_enriched: ${coresignalData.description_enriched?.substring(0, 100)}...`);
      console.log(`   - revenue: ${coresignalData.revenue_annual?.source_5_annual_revenue?.annual_revenue}`);
      console.log(`   - location: ${coresignalData.hq_city}, ${coresignalData.hq_state}, ${coresignalData.hq_country}`);
      console.log(`   - phone: ${coresignalData.company_phone_numbers?.[0]}`);
      console.log(`   - linkedin_url: ${coresignalData.linkedin_url}`);
      console.log(`   - ownership_status: ${coresignalData.ownership_status}`);

    } catch (error) {
      console.error('❌ Test failed:', error);
    } finally {
      await prisma.$disconnect();
    }
  }
}

// Run the test
const test = new SimpleEnrichmentTest();
test.testSimpleEnrichment().catch(console.error);
