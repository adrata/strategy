#!/usr/bin/env node

/**
 * Test script to verify exact domain matching with Coresignal API
 * Tests both the direct enrichment endpoint and the exact_website filter
 */

require('dotenv').config();
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();
const apiKey = process.env.CORESIGNAL_API_KEY;
const workspaceId = '01K7DNYR5VZ7JY36KGKKN76XZ1'; // Notary Everyday

async function testDirectEnrichment(domain) {
  console.log(`\n🔍 Testing direct enrichment for domain: ${domain}`);
  console.log('='.repeat(60));
  
  try {
    const response = await fetch(`https://api.coresignal.com/cdapi/v2/company_multi_source/enrich?website=${encodeURIComponent(domain)}`, {
      method: 'GET',
      headers: {
        'apikey': apiKey,
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      }
    });

    console.log(`Status: ${response.status} ${response.statusText}`);
    
    if (response.ok) {
      const data = await response.json();
      console.log('\n✅ Success! Company found:');
      console.log(`   Name: ${data.name}`);
      console.log(`   Website: ${data.website}`);
      console.log(`   Domain: ${data.domain}`);
      console.log(`   LinkedIn: ${data.linkedin_url}`);
      console.log(`   Industry: ${data.industry}`);
      console.log(`   Employees: ${data.employee_count}`);
      console.log(`   ID: ${data.id}`);
      return data;
    } else if (response.status === 404) {
      console.log('❌ Company not found (404)');
      return null;
    } else {
      const errorText = await response.text();
      console.log(`❌ Error: ${errorText}`);
      return null;
    }
  } catch (error) {
    console.log(`❌ Exception: ${error.message}`);
    return null;
  }
}

async function testExactWebsiteFilter(domain) {
  console.log(`\n🔍 Testing exact_website filter for domain: ${domain}`);
  console.log('='.repeat(60));
  
  const query = {
    query: {
      bool: {
        must: [
          { term: { 'exact_website': domain } }
        ]
      }
    }
  };
  
  console.log('Query:', JSON.stringify(query, null, 2));
  
  try {
    const response = await fetch('https://api.coresignal.com/cdapi/v2/company_multi_source/search/es_dsl?items_per_page=5', {
      method: 'POST',
      headers: {
        'apikey': apiKey,
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: JSON.stringify(query)
    });

    console.log(`Status: ${response.status} ${response.statusText}`);
    
    if (response.ok) {
      const data = await response.json();
      console.log('\nSearch response:', JSON.stringify(data, null, 2));
      
      // Handle different response formats
      let companyIds = [];
      if (Array.isArray(data)) {
        companyIds = data;
      } else if (data.hits?.hits) {
        companyIds = data.hits.hits.map(hit => hit._id || hit._source?.id);
      } else if (data.hits) {
        companyIds = data.hits;
      }
      
      if (companyIds.length > 0) {
        console.log(`\n✅ Found ${companyIds.length} company(ies)`);
        console.log('Company IDs:', companyIds);
        
        // Collect the first one
        const firstId = companyIds[0];
        console.log(`\n📥 Collecting profile for ID: ${firstId}`);
        
        const collectResponse = await fetch(`https://api.coresignal.com/cdapi/v2/company_multi_source/collect/${firstId}`, {
          headers: { 
            'apikey': apiKey,
            'Accept': 'application/json'
          }
        });
        
        if (collectResponse.ok) {
          const profileData = await collectResponse.json();
          console.log('\n✅ Profile collected:');
          console.log(`   Name: ${profileData.name}`);
          console.log(`   Website: ${profileData.website}`);
          console.log(`   Domain: ${profileData.domain}`);
          console.log(`   LinkedIn: ${profileData.linkedin_url}`);
          return profileData;
        }
      } else {
        console.log('❌ No companies found');
        return null;
      }
    } else {
      const errorText = await response.text();
      console.log(`❌ Error: ${errorText}`);
      return null;
    }
  } catch (error) {
    console.log(`❌ Exception: ${error.message}`);
    return null;
  }
}

async function testWebsiteFilter(domain) {
  console.log(`\n🔍 Testing website filter (not exact) for domain: ${domain}`);
  console.log('='.repeat(60));
  
  const query = {
    query: {
      bool: {
        must: [
          { term: { 'website': domain } }
        ]
      }
    }
  };
  
  console.log('Query:', JSON.stringify(query, null, 2));
  
  try {
    const response = await fetch('https://api.coresignal.com/cdapi/v2/company_multi_source/search/es_dsl?items_per_page=5', {
      method: 'POST',
      headers: {
        'apikey': apiKey,
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: JSON.stringify(query)
    });

    console.log(`Status: ${response.status} ${response.statusText}`);
    
    if (response.ok) {
      const data = await response.json();
      
      // Handle different response formats
      let companyIds = [];
      if (Array.isArray(data)) {
        companyIds = data;
      } else if (data.hits?.hits) {
        companyIds = data.hits.hits.map(hit => hit._id || hit._source?.id);
      } else if (data.hits) {
        companyIds = data.hits;
      }
      
      if (companyIds.length > 0) {
        console.log(`\n✅ Found ${companyIds.length} company(ies) with 'website' filter`);
        return true;
      } else {
        console.log('❌ No companies found with website filter');
        return false;
      }
    }
  } catch (error) {
    console.log(`❌ Exception: ${error.message}`);
    return false;
  }
}

async function run() {
  try {
    console.log('🚀 Testing Coresignal Exact Domain Matching');
    console.log('='.repeat(60));
    
    // Get a few companies with websites from our database
    const companies = await prisma.companies.findMany({
      where: {
        workspaceId,
        deletedAt: null,
        website: { not: null }
      },
      take: 5
    });
    
    console.log(`\n📊 Found ${companies.length} companies with websites in database`);
    
    for (const company of companies) {
      console.log('\n' + '='.repeat(60));
      console.log(`\n🏢 Testing: ${company.name}`);
      console.log(`   Website: ${company.website}`);
      
      // Extract domain
      let domain = company.website;
      try {
        const url = new URL(company.website.startsWith('http') ? company.website : `https://${company.website}`);
        domain = url.hostname.replace('www.', '');
      } catch (e) {
        console.log(`   ⚠️ Could not parse URL: ${e.message}`);
        continue;
      }
      
      console.log(`   Extracted domain: ${domain}`);
      
      // Test 1: Direct enrichment endpoint
      const directResult = await testDirectEnrichment(domain);
      
      // Test 2: exact_website filter
      const exactResult = await testExactWebsiteFilter(domain);
      
      // Test 3: website filter (not exact)
      const websiteResult = await testWebsiteFilter(domain);
      
      console.log('\n📊 Summary for', company.name);
      console.log(`   Direct enrichment: ${directResult ? '✅ Found' : '❌ Not found'}`);
      console.log(`   exact_website filter: ${exactResult ? '✅ Found' : '❌ Not found'}`);
      console.log(`   website filter: ${websiteResult ? '✅ Found' : '❌ Not found'}`);
      
      // Wait a bit between companies to avoid rate limiting
      await new Promise(resolve => setTimeout(resolve, 2000));
    }
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

run();

