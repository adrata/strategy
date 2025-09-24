const { PrismaClient } = require('@prisma/client');
const https = require('https');

const prisma = new PrismaClient();
const CORESIGNAL_API_KEY = process.env.CORESIGNAL_API_KEY;
const CORESIGNAL_BASE_URL = 'https://api.coresignal.com/cdapi/v2';

class CoreSignalAPI {
  constructor() {
    this.apiKey = CORESIGNAL_API_KEY;
    this.baseUrl = CORESIGNAL_BASE_URL;
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

  async searchCompany(query, searchField = "company_name") {
    const searchQuery = {
      query: {
        query_string: {
          query: query,
          default_field: searchField,
          default_operator: "and"
        }
      }
    };

    const url = `${this.baseUrl}/company_multi_source/search/es_dsl`;

    try {
      const response = await this.makeRequest(url, 'POST', searchQuery);
      console.log(`🔍 Search response for "${query}":`, JSON.stringify(response, null, 2));

      if (Array.isArray(response) && response.length > 0) {
        return response[0].company_id || response[0];
      }
      return null;
    } catch (error) {
      console.error(`Error searching for company "${query}" in field "${searchField}":`, error.message);
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

async function testCoreSignalAPI() {
  console.log('🧪 TESTING CORESIGNAL API');
  console.log('==========================');

  try {
    if (!CORESIGNAL_API_KEY) {
      console.error('❌ CORESIGNAL_API_KEY is not set');
      return;
    }

    console.log('✅ API Key is set');
    console.log(`🔗 Base URL: ${CORESIGNAL_BASE_URL}`);

    const coresignal = new CoreSignalAPI();

    // Test with a well-known company
    const testCompanies = [
      'Microsoft',
      'Apple',
      'Google',
      'Amazon',
      'AT&T'
    ];

    for (const companyName of testCompanies) {
      console.log(`\n🔍 Testing with: ${companyName}`);
      console.log('='.repeat(50));

      try {
        const companyId = await coresignal.searchCompany(companyName, "company_name");
        
        if (companyId) {
          console.log(`✅ Found company ID: ${companyId}`);
          
          const companyData = await coresignal.getCompanyData(companyId);
          if (companyData) {
            console.log(`✅ Retrieved company data`);
            console.log(`   Company: ${companyData.company_name || 'N/A'}`);
            console.log(`   Industry: ${companyData.industry || 'N/A'}`);
            console.log(`   Size: ${companyData.size_range || 'N/A'}`);
            console.log(`   LinkedIn: ${companyData.linkedin_url || 'N/A'}`);
            break; // Stop after first successful test
          } else {
            console.log(`❌ Failed to get company data for ID: ${companyId}`);
          }
        } else {
          console.log(`❌ Company not found: ${companyName}`);
        }
      } catch (error) {
        console.log(`❌ Error testing ${companyName}: ${error.message}`);
      }
    }

  } catch (error) {
    console.error('❌ Test failed:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

testCoreSignalAPI();