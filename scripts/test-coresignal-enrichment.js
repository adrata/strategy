const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

// CoreSignal API configuration
const CORESIGNAL_API_KEY = 'hzwQmb13cF21if4arzLpx0SRWyoOUyzP';
const CORESIGNAL_BASE_URL = 'https://api.coresignal.com/cdapi/v2/company_multi_source/enrich';

async function testCoreSignalAPI(website) {
  try {
    console.log(`🔍 Testing CoreSignal API with: ${website}`);
    
    const url = `${CORESIGNAL_BASE_URL}?website=${encodeURIComponent(website)}`;
    const headers = {
      "Content-Type": "application/json",
      "apikey": CORESIGNAL_API_KEY
    };

    console.log(`📡 Making request to: ${url}`);
    
    const response = await fetch(url, {
      method: 'GET',
      headers: headers
    });

    console.log(`📊 Response status: ${response.status}`);
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    
    console.log(`📦 Response data:`, JSON.stringify(data, null, 2));
    
    if (!data || data.length === 0) {
      console.log(`❌ No data found for ${website}`);
      return null;
    }

    console.log(`✅ Found ${data.length} result(s) for ${website}`);
    return data[0]; // Return first result

  } catch (error) {
    console.error(`❌ Error testing ${website}:`, error.message);
    return null;
  }
}

async function testEnrichment() {
  try {
    console.log('🧪 Testing CoreSignal API with sample companies');
    console.log('=' .repeat(50));
    
    // Get a few companies with websites to test
    const companies = await prisma.companies.findMany({
      where: {
        workspaceId: '01K5D01YCQJ9TJ7CT4DZDE79T1', // TOP Engineering Plus workspace
        deletedAt: null,
        website: {
          not: null
        }
      },
      select: {
        id: true,
        name: true,
        website: true,
        industry: true
      },
      take: 5, // Test with just 5 companies
      orderBy: { name: 'asc' }
    });

    console.log(`📊 Testing with ${companies.length} companies:`);
    companies.forEach((company, index) => {
      console.log(`  ${index + 1}. ${company.name} - ${company.website}`);
    });

    console.log('\n' + '='.repeat(50));
    
    for (const company of companies) {
      console.log(`\n🔍 Testing: ${company.name}`);
      const result = await testCoreSignalAPI(company.website);
      
      if (result) {
        console.log(`✅ Success! Found data for ${company.name}`);
        console.log(`   - Company: ${result.company_name || 'N/A'}`);
        console.log(`   - Industry: ${result.industry || 'N/A'}`);
        console.log(`   - Employees: ${result.employees_count || 'N/A'}`);
        console.log(`   - Founded: ${result.founded_year || 'N/A'}`);
        console.log(`   - Technologies: ${result.technologies_used?.length || 0}`);
        console.log(`   - Competitors: ${result.competitors?.length || 0}`);
      } else {
        console.log(`❌ No data found for ${company.name}`);
      }
      
      // Wait 2 seconds between requests to be respectful to the API
      await new Promise(resolve => setTimeout(resolve, 2000));
    }

    console.log('\n🎉 Testing completed!');

  } catch (error) {
    console.error('💥 Fatal error during testing:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the test
testEnrichment();
