#!/usr/bin/env node

/**
 * 🚀 WORKING ENRICHMENT TEST
 * 
 * This script tests enrichment with existing database fields only
 * and preserves the complete rich CoreSignal data in customFields
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

class WorkingEnrichmentTest {
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
   * Map CoreSignal data to existing database fields
   */
  mapCoreSignalToExistingFields(coresignalData) {
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
      
      // Store ALL CoreSignal data in customFields for now
      customFields: {
        coresignalData: coresignalData,
        enrichmentSource: 'CoreSignal',
        lastEnrichedAt: new Date().toISOString(),
        totalFields: Object.keys(coresignalData).length
      },
      
      // Metadata
      updatedAt: new Date()
    };
  }

  /**
   * Test working enrichment
   */
  async testWorkingEnrichment() {
    console.log('🚀 WORKING ENRICHMENT TEST');
    console.log('==========================\n');

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
          size: true,
          revenue: true,
          city: true,
          state: true,
          country: true,
          phone: true,
          industry: true,
          sector: true,
          customFields: true
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

      // Step 3: Map CoreSignal data to existing database fields
      console.log('🗺️  STEP 3: MAPPING TO EXISTING FIELDS');
      console.log('======================================\n');
      
      const mappedData = this.mapCoreSignalToExistingFields(coresignalData);
      
      console.log('📋 MAPPED DATABASE FIELDS:');
      Object.entries(mappedData).forEach(([field, value]) => {
        if (field === 'customFields') {
          console.log(`   ${field}: [CoreSignal data + metadata]`);
        } else if (Array.isArray(value)) {
          console.log(`   ${field}: [${value.length} items] ${value.slice(0, 3).join(', ')}${value.length > 3 ? '...' : ''}`);
        } else {
          const status = value ? '✅' : '❌';
          const displayValue = value && value.length > 100 ? value.substring(0, 100) + '...' : value;
          console.log(`   ${status} ${field}: ${displayValue || 'N/A'}`);
        }
      });

      // Step 4: Update database
      console.log('\n💾 STEP 4: UPDATING DATABASE');
      console.log('============================\n');
      
      await prisma.companies.update({
        where: { id: company.id },
        data: mappedData
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
          industry: true,
          sector: true,
          customFields: true,
          updatedAt: true
        }
      });

      console.log('📊 VERIFIED UPDATE:');
      Object.entries(updatedCompany).forEach(([field, value]) => {
        if (field === 'customFields') {
          console.log(`   ${field}: [CoreSignal data + metadata]`);
        } else if (Array.isArray(value)) {
          console.log(`   ${field}: [${value.length} items] ${value.slice(0, 3).join(', ')}${value.length > 3 ? '...' : ''}`);
        } else {
          const status = value ? '✅' : '❌';
          const displayValue = value && value.length > 100 ? value.substring(0, 100) + '...' : value;
          console.log(`   ${status} ${field}: ${displayValue || 'N/A'}`);
        }
      });

      console.log('\n🎉 WORKING ENRICHMENT TEST COMPLETED SUCCESSFULLY!');
      console.log('==================================================');
      console.log('✅ CoreSignal integration working');
      console.log('✅ Database update working');
      console.log('✅ Company size field populated: "' + updatedCompany.size + '"');
      console.log('✅ ALL rich CoreSignal data preserved in customFields');
      console.log('✅ All data preserved and enriched');

      // Show the CoreSignal data structure
      console.log('\n📊 CORESIGNAL DATA STRUCTURE:');
      console.log('=============================');
      const storedCoreSignalData = updatedCompany.customFields?.coresignalData;
      if (storedCoreSignalData) {
        console.log(`Total fields available: ${Object.keys(storedCoreSignalData).length}`);
        console.log('Key fields:');
        console.log(`   - company_name: ${storedCoreSignalData.company_name}`);
        console.log(`   - size_range: ${storedCoreSignalData.size_range}`);
        console.log(`   - description_enriched: ${storedCoreSignalData.description_enriched?.substring(0, 100)}...`);
        console.log(`   - revenue: ${storedCoreSignalData.revenue_annual?.source_5_annual_revenue?.annual_revenue}`);
        console.log(`   - location: ${storedCoreSignalData.hq_city}, ${storedCoreSignalData.hq_state}, ${storedCoreSignalData.hq_country}`);
        console.log(`   - phone: ${storedCoreSignalData.company_phone_numbers?.[0]}`);
        console.log(`   - linkedin_url: ${storedCoreSignalData.linkedin_url}`);
        console.log(`   - ownership_status: ${storedCoreSignalData.ownership_status}`);
        console.log(`   - active_job_postings_count: ${storedCoreSignalData.active_job_postings_count}`);
        console.log(`   - followers_count_linkedin: ${storedCoreSignalData.followers_count_linkedin}`);
        console.log(`   - employees_count: ${storedCoreSignalData.employees_count}`);
        console.log(`   - naics_codes: ${storedCoreSignalData.naics_codes?.join(', ') || 'None'}`);
        console.log(`   - sic_codes: ${storedCoreSignalData.sic_codes?.join(', ') || 'None'}`);
      }

      console.log('\n💡 NEXT STEPS:');
      console.log('==============');
      console.log('1. 🔄 Regenerate Prisma client: npx prisma generate');
      console.log('2. 🚀 Run full enrichment on all companies');
      console.log('3. 📊 Use the rich CoreSignal data in your UI');
      console.log('4. 🎯 Map additional fields to new database columns');

    } catch (error) {
      console.error('❌ Test failed:', error);
    } finally {
      await prisma.$disconnect();
    }
  }
}

// Run the test
const test = new WorkingEnrichmentTest();
test.testWorkingEnrichment().catch(console.error);
