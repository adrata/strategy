const https = require('https');
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const TOP_WORKSPACE_ID = '01K5D01YCQJ9TJ7CT4DZDE79T1';

class CoreSignalAPI {
  constructor() {
    this.apiKey = process.env.CORESIGNAL_API_KEY;
    this.baseUrl = 'https://api.coresignal.com/cdapi/v2';
  }

  async makeRequest(url, method = 'GET', data = null) {
    return new Promise((resolve, reject) => {
      const options = {
        method: method,
        headers: {
          'apikey': this.apiKey,
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

  async searchCompany(query) {
    const searchQuery = {
      query: {
        query_string: {
          query: query,
          default_field: "company_name",
          default_operator: "and"
        }
      }
    };

    const url = `${this.baseUrl}/company_multi_source/search/es_dsl`;
    
    try {
      const response = await this.makeRequest(url, 'POST', searchQuery);
      
      if (Array.isArray(response) && response.length > 0) {
        return response[0]; // Return the company ID
      }
      return null;
    } catch (error) {
      console.error(`Error searching for company "${query}":`, error.message);
      return null;
    }
  }

  async getCompanyData(companyId) {
    const url = `${this.baseUrl}/company_multi_source/collect/${companyId}`;
    try {
      return await this.makeRequest(url);
    } catch (error) {
      console.error(`Error getting company data for ID ${companyId}:`, error.message);
      return null;
    }
  }
}

async function testSpecificCompany() {
  console.log('🧪 TESTING SPECIFIC COMPANY ENRICHMENT');
  console.log('=====================================\n');

  try {
    await prisma.$connect();
    console.log('✅ Connected to database\n');

    if (!process.env.CORESIGNAL_API_KEY) {
      console.error('❌ CORESIGNAL_API_KEY not configured');
      return;
    }
    console.log('🔑 API Keys configured\n');

    const coresignal = new CoreSignalAPI();

    // Test with Lockard & White (we know this works)
    console.log('🏢 Testing with Lockard & White, Inc. (known working company)');
    
    // Find the company in database
    let company = await prisma.companies.findFirst({
      where: {
        workspaceId: TOP_WORKSPACE_ID,
        OR: [
          { name: { contains: 'Lockard', mode: 'insensitive' } },
          { website: { contains: 'landw.com', mode: 'insensitive' } }
        ]
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
      console.log('❌ Lockard & White not found in database');
      return;
    }

    console.log(`   Found: ${company.name}`);
    console.log(`   Website: ${company.website}`);

    // Search CoreSignal
    console.log('   🔍 Searching CoreSignal...');
    let companyId = await coresignal.searchCompany(company.name);
    
    if (!companyId) {
      companyId = await coresignal.searchCompany('Lockard White');
    }
    
    if (!companyId) {
      console.log('   ❌ Not found in CoreSignal');
      return;
    }

    console.log(`   ✅ Found CoreSignal ID: ${companyId}`);

    // Get CoreSignal data
    console.log('   📊 Getting CoreSignal data...');
    const coresignalData = await coresignal.getCompanyData(companyId);
    
    if (!coresignalData) {
      console.log('   ❌ Failed to get CoreSignal data');
      return;
    }

    console.log('   ✅ CoreSignal data retrieved successfully!');
    console.log(`   📋 Company: ${coresignalData.company_name}`);
    console.log(`   📋 Website: ${coresignalData.website}`);
    console.log(`   📋 Industry: ${coresignalData.industry}`);
    console.log(`   📋 Employee Count: ${coresignalData.employees_count}`);
    console.log(`   📋 LinkedIn: ${coresignalData.linkedin_url}`);
    console.log(`   📋 Founded Year: ${coresignalData.founded_year}`);

    // Test with a few other companies that might be in CoreSignal
    console.log('\n🏢 Testing with other companies...');
    
    const testCompanies = [
      'Microsoft',
      'Google', 
      'Apple',
      'Amazon',
      'Tesla'
    ];

    for (const companyName of testCompanies) {
      console.log(`\n   Testing: ${companyName}`);
      const testCompanyId = await coresignal.searchCompany(companyName);
      
      if (testCompanyId) {
        console.log(`   ✅ Found in CoreSignal: ${testCompanyId}`);
        const testData = await coresignal.getCompanyData(testCompanyId);
        if (testData) {
          console.log(`   📋 Industry: ${testData.industry || 'N/A'}`);
          console.log(`   📋 Employee Count: ${testData.employees_count || 'N/A'}`);
        }
      } else {
        console.log(`   ❌ Not found in CoreSignal`);
      }
    }

    console.log('\n🎉 TEST COMPLETED SUCCESSFULLY!');
    console.log('===============================');
    console.log('✅ CoreSignal API working correctly');
    console.log('✅ Search and data retrieval working');
    console.log('✅ Ready to enrich companies that exist in CoreSignal');

  } catch (error) {
    console.error('❌ TEST FAILED:', error);
  } finally {
    await prisma.$disconnect();
  }
}

testSpecificCompany();
