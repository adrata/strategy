#!/usr/bin/env node

/**
 * Test Coresignal API Field Structure
 * 
 * This script tests the Coresignal API to understand the correct field names
 * and data structure for revenue and company filtering.
 */

require('dotenv').config();
const { PrismaClient } = require('@prisma/client');

class CoresignalFieldTester {
  constructor() {
    this.apiKey = process.env.CORESIGNAL_API_KEY;
    this.prisma = new PrismaClient();
  }

  async run() {
    try {
      console.log('🔍 Testing Coresignal API Field Structure...\n');
      
      // Test 1: Basic search to see response structure
      await this.testBasicSearch();
      
      // Test 2: Get a few company profiles to see revenue fields
      await this.testCompanyProfiles();
      
    } catch (error) {
      console.error('❌ Error:', error);
    } finally {
      await this.prisma.$disconnect();
    }
  }

  async testBasicSearch() {
    console.log('📋 Test 1: Basic Company Search');
    console.log('=' .repeat(40));
    
    const searchQuery = {
      query: {
        match_all: {}
      }
    };

    try {
      const response = await fetch('https://api.coresignal.com/cdapi/v2/company_multi_source/search/es_dsl?items_per_page=3', {
        method: 'POST',
        headers: {
          'apikey': this.apiKey,
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify(searchQuery)
      });

      if (!response.ok) {
        throw new Error(`Search failed: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      console.log('✅ Search successful');
      console.log(`📊 Found ${data.length} companies`);
      console.log('📋 Company IDs:', data.slice(0, 3));
      
      return data.slice(0, 3);
      
    } catch (error) {
      console.error('❌ Search failed:', error.message);
      return [];
    }
  }

  async testCompanyProfiles() {
    console.log('\n📋 Test 2: Company Profile Analysis');
    console.log('=' .repeat(40));
    
    // Get a few company IDs first
    const companyIds = await this.testBasicSearch();
    
    if (companyIds.length === 0) {
      console.log('❌ No companies to analyze');
      return;
    }

    for (let i = 0; i < Math.min(2, companyIds.length); i++) {
      const companyId = companyIds[i];
      console.log(`\n🔍 Analyzing Company ID: ${companyId}`);
      
      try {
        const response = await fetch(`https://api.coresignal.com/cdapi/v2/company_multi_source/collect/${companyId}`, {
          method: 'GET',
          headers: {
            'apikey': this.apiKey,
            'Accept': 'application/json'
          }
        });

        if (!response.ok) {
          console.log(`❌ Profile fetch failed: ${response.status}`);
          continue;
        }

        const profile = await response.json();
        
        console.log('📊 Company Profile Fields:');
        console.log(`   Name: ${profile.name || profile.company_name || 'N/A'}`);
        console.log(`   Industry: ${profile.industry || profile.company_industry || 'N/A'}`);
        console.log(`   Country: ${profile.hq_country || profile.company_hq_country || 'N/A'}`);
        console.log(`   HQ Country: ${profile.company_hq_country || 'N/A'}`);
        console.log(`   HQ Country ISO: ${profile.company_hq_country_iso2 || 'N/A'}`);
        console.log(`   Employee Count: ${profile.employee_count || profile.company_employees_count || 'N/A'}`);
        console.log(`   Size Range: ${profile.size_range || profile.company_size_range || 'N/A'}`);
        
        // Check revenue fields
        console.log('💰 Revenue Fields:');
        console.log(`   revenue_annual: ${JSON.stringify(profile.revenue_annual) || 'N/A'}`);
        console.log(`   revenue_annual_range: ${profile.revenue_annual_range || 'N/A'}`);
        console.log(`   company_annual_revenue_source_1: ${profile.company_annual_revenue_source_1 || 'N/A'}`);
        console.log(`   revenue_annual_usd: ${profile.revenue_annual_usd || 'N/A'}`);
        console.log(`   annual_revenue: ${profile.annual_revenue || 'N/A'}`);
        if (profile.revenue_annual && typeof profile.revenue_annual === 'object') {
          console.log(`   revenue_annual.annual_revenue: ${profile.revenue_annual.annual_revenue || 'N/A'}`);
          console.log(`   revenue_annual structure:`, Object.keys(profile.revenue_annual));
        }
        
        // Check B2B field
        console.log('🏢 B2B Field:');
        console.log(`   company_is_b2b: ${profile.company_is_b2b || 'N/A'}`);
        
        // Show all keys for reference
        console.log('🔑 All Available Keys:');
        const keys = Object.keys(profile).filter(key => 
          key.includes('revenue') || 
          key.includes('size') || 
          key.includes('employee') ||
          key.includes('b2b') ||
          key.includes('industry')
        );
        console.log('   Relevant keys:', keys.join(', '));
        
      } catch (error) {
        console.error(`❌ Error analyzing company ${companyId}:`, error.message);
      }
    }
  }
}

// Run the tester
const tester = new CoresignalFieldTester();
tester.run().catch(console.error);
