const { PrismaClient } = require('@prisma/client');
const https = require('https');

const prisma = new PrismaClient();
const TOP_WORKSPACE_ID = '01K5D01YCQJ9TJ7CT4DZDE79T1';

const CORESIGNAL_API_KEY = process.env.CORESIGNAL_API_KEY;
const CORESIGNAL_BASE_URL = 'https://api.coresignal.com/cdapi/v2';

class DiagnosticCoreSignalAPI {
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

  async searchPeopleByCompany(companyName) {
    const searchQuery = {
      query: {
        bool: {
          must: [
            {
              nested: {
                path: 'experience',
                query: {
                  bool: {
                    should: [
                      { match: { 'experience.company_name': companyName } },
                      { match_phrase: { 'experience.company_name': companyName } }
                    ]
                  }
                }
              }
            }
          ]
        }
      }
    };

    const url = `${this.baseUrl}/employee_multi_source/search/es_dsl?items_per_page=100`;
    return await this.makeRequest(url, 'POST', searchQuery);
  }

  async getPersonData(employeeId) {
    const url = `${this.baseUrl}/employee_multi_source/collect/${employeeId}`;
    return await this.makeRequest(url);
  }
}

async function diagnoseCompanyContextSearch() {
  try {
    await prisma.$connect();
    console.log('🔍 DIAGNOSING COMPANY-CONTEXT SEARCH');
    console.log('===================================');

    if (!CORESIGNAL_API_KEY) {
      console.error('🔑 CORESIGNAL_API_KEY is not set.');
      return;
    }

    const coresignal = new DiagnosticCoreSignalAPI();

    // Test with just one person and company
    const person = await prisma.$queryRaw`
      SELECT p.id, p."fullName", p."jobTitle", p.email, p.phone, p."linkedinUrl", p."customFields", p."companyId",
             c.name as company_name, c.website as company_website
      FROM people p
      LEFT JOIN companies c ON p."companyId" = c.id
      WHERE p."workspaceId" = ${TOP_WORKSPACE_ID} 
        AND (p."customFields" IS NULL OR p."customFields"->>'coresignalId' IS NULL)
        AND c.name IS NOT NULL
      ORDER BY p."fullName"
      LIMIT 1
    `;

    if (person.length === 0) {
      console.log('❌ No people found to test');
      return;
    }

    const testPerson = person[0];
    console.log(`\n👤 Testing: ${testPerson.fullName}`);
    console.log(`🏢 Company: ${testPerson.company_name}`);
    console.log(`🌐 Website: ${testPerson.company_website}`);

    // Search for people at the company
    console.log(`\n🔍 Searching for people at "${testPerson.company_name}"...`);
    const employeeIds = await coresignal.searchPeopleByCompany(testPerson.company_name);
    console.log(`📊 Found ${employeeIds.length} employee IDs`);

    if (employeeIds.length === 0) {
      console.log('❌ No employees found at this company');
      return;
    }

    // Get detailed profiles for the first 10 employees to see what we're getting
    console.log(`\n📋 Sample of employees at ${testPerson.company_name}:`);
    const sampleSize = Math.min(10, employeeIds.length);
    
    for (let i = 0; i < sampleSize; i++) {
      const employeeId = employeeIds[i];
      try {
        const profile = await coresignal.getPersonData(employeeId);
        
        if (profile) {
          const fullName = profile.full_name || profile.member_full_name || 'Unknown';
          const currentTitle = profile.active_experience_title || 'Unknown Title';
          const currentCompany = profile.active_experience_company_name || 'Unknown Company';
          
          console.log(`   ${i + 1}. ${fullName} - ${currentTitle} at ${currentCompany}`);
          
          // Check if this could be our person
          const nameMatch = fullName.toLowerCase().includes(testPerson.fullName.toLowerCase()) ||
                           testPerson.fullName.toLowerCase().includes(fullName.toLowerCase());
          
          if (nameMatch) {
            console.log(`      🎯 POTENTIAL MATCH for "${testPerson.fullName}"!`);
          }
        }
      } catch (error) {
        console.log(`   ${i + 1}. Error getting profile for ID ${employeeId}: ${error.message}`);
      }
    }

    // Try alternative company name variations
    console.log(`\n🔍 Trying alternative company name variations...`);
    const companyVariations = [
      testPerson.company_name,
      testPerson.company_name.split(' ')[0], // First word only
      testPerson.company_name.replace(/[.,]/g, ''), // Remove punctuation
      testPerson.company_name.split(' ').slice(0, 2).join(' '), // First two words
    ].filter((name, index, arr) => arr.indexOf(name) === index && name.trim().length > 0);

    for (const variation of companyVariations) {
      if (variation !== testPerson.company_name) {
        console.log(`   🔍 Trying "${variation}"...`);
        try {
          const altResults = await coresignal.searchPeopleByCompany(variation);
          console.log(`   📊 Found ${altResults.length} employees with variation "${variation}"`);
        } catch (error) {
          console.log(`   ❌ Error with variation "${variation}": ${error.message}`);
        }
      }
    }

    console.log(`\n📊 DIAGNOSIS SUMMARY:`);
    console.log(`   Company: ${testPerson.company_name}`);
    console.log(`   Total employees found: ${employeeIds.length}`);
    console.log(`   Sample checked: ${sampleSize}`);
    console.log(`   Target person: ${testPerson.fullName}`);
    
    if (employeeIds.length > 0) {
      console.log(`\n💡 RECOMMENDATIONS:`);
      console.log(`   1. The company search is working (found ${employeeIds.length} employees)`);
      console.log(`   2. We need to check more employees or improve name matching`);
      console.log(`   3. Consider checking if the person works at a different company`);
      console.log(`   4. The person might have a different name in CoreSignal`);
    } else {
      console.log(`\n❌ ISSUE: No employees found at this company`);
      console.log(`   This suggests the company name doesn't match CoreSignal's data`);
    }

  } catch (error) {
    console.error('❌ Diagnostic error:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

diagnoseCompanyContextSearch();
const https = require('https');

const prisma = new PrismaClient();
const TOP_WORKSPACE_ID = '01K5D01YCQJ9TJ7CT4DZDE79T1';

const CORESIGNAL_API_KEY = process.env.CORESIGNAL_API_KEY;
const CORESIGNAL_BASE_URL = 'https://api.coresignal.com/cdapi/v2';

class DiagnosticCoreSignalAPI {
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

  async searchPeopleByCompany(companyName) {
    const searchQuery = {
      query: {
        bool: {
          must: [
            {
              nested: {
                path: 'experience',
                query: {
                  bool: {
                    should: [
                      { match: { 'experience.company_name': companyName } },
                      { match_phrase: { 'experience.company_name': companyName } }
                    ]
                  }
                }
              }
            }
          ]
        }
      }
    };

    const url = `${this.baseUrl}/employee_multi_source/search/es_dsl?items_per_page=100`;
    return await this.makeRequest(url, 'POST', searchQuery);
  }

  async getPersonData(employeeId) {
    const url = `${this.baseUrl}/employee_multi_source/collect/${employeeId}`;
    return await this.makeRequest(url);
  }
}

async function diagnoseCompanyContextSearch() {
  try {
    await prisma.$connect();
    console.log('🔍 DIAGNOSING COMPANY-CONTEXT SEARCH');
    console.log('===================================');

    if (!CORESIGNAL_API_KEY) {
      console.error('🔑 CORESIGNAL_API_KEY is not set.');
      return;
    }

    const coresignal = new DiagnosticCoreSignalAPI();

    // Test with just one person and company
    const person = await prisma.$queryRaw`
      SELECT p.id, p."fullName", p."jobTitle", p.email, p.phone, p."linkedinUrl", p."customFields", p."companyId",
             c.name as company_name, c.website as company_website
      FROM people p
      LEFT JOIN companies c ON p."companyId" = c.id
      WHERE p."workspaceId" = ${TOP_WORKSPACE_ID} 
        AND (p."customFields" IS NULL OR p."customFields"->>'coresignalId' IS NULL)
        AND c.name IS NOT NULL
      ORDER BY p."fullName"
      LIMIT 1
    `;

    if (person.length === 0) {
      console.log('❌ No people found to test');
      return;
    }

    const testPerson = person[0];
    console.log(`\n👤 Testing: ${testPerson.fullName}`);
    console.log(`🏢 Company: ${testPerson.company_name}`);
    console.log(`🌐 Website: ${testPerson.company_website}`);

    // Search for people at the company
    console.log(`\n🔍 Searching for people at "${testPerson.company_name}"...`);
    const employeeIds = await coresignal.searchPeopleByCompany(testPerson.company_name);
    console.log(`📊 Found ${employeeIds.length} employee IDs`);

    if (employeeIds.length === 0) {
      console.log('❌ No employees found at this company');
      return;
    }

    // Get detailed profiles for the first 10 employees to see what we're getting
    console.log(`\n📋 Sample of employees at ${testPerson.company_name}:`);
    const sampleSize = Math.min(10, employeeIds.length);
    
    for (let i = 0; i < sampleSize; i++) {
      const employeeId = employeeIds[i];
      try {
        const profile = await coresignal.getPersonData(employeeId);
        
        if (profile) {
          const fullName = profile.full_name || profile.member_full_name || 'Unknown';
          const currentTitle = profile.active_experience_title || 'Unknown Title';
          const currentCompany = profile.active_experience_company_name || 'Unknown Company';
          
          console.log(`   ${i + 1}. ${fullName} - ${currentTitle} at ${currentCompany}`);
          
          // Check if this could be our person
          const nameMatch = fullName.toLowerCase().includes(testPerson.fullName.toLowerCase()) ||
                           testPerson.fullName.toLowerCase().includes(fullName.toLowerCase());
          
          if (nameMatch) {
            console.log(`      🎯 POTENTIAL MATCH for "${testPerson.fullName}"!`);
          }
        }
      } catch (error) {
        console.log(`   ${i + 1}. Error getting profile for ID ${employeeId}: ${error.message}`);
      }
    }

    // Try alternative company name variations
    console.log(`\n🔍 Trying alternative company name variations...`);
    const companyVariations = [
      testPerson.company_name,
      testPerson.company_name.split(' ')[0], // First word only
      testPerson.company_name.replace(/[.,]/g, ''), // Remove punctuation
      testPerson.company_name.split(' ').slice(0, 2).join(' '), // First two words
    ].filter((name, index, arr) => arr.indexOf(name) === index && name.trim().length > 0);

    for (const variation of companyVariations) {
      if (variation !== testPerson.company_name) {
        console.log(`   🔍 Trying "${variation}"...`);
        try {
          const altResults = await coresignal.searchPeopleByCompany(variation);
          console.log(`   📊 Found ${altResults.length} employees with variation "${variation}"`);
        } catch (error) {
          console.log(`   ❌ Error with variation "${variation}": ${error.message}`);
        }
      }
    }

    console.log(`\n📊 DIAGNOSIS SUMMARY:`);
    console.log(`   Company: ${testPerson.company_name}`);
    console.log(`   Total employees found: ${employeeIds.length}`);
    console.log(`   Sample checked: ${sampleSize}`);
    console.log(`   Target person: ${testPerson.fullName}`);
    
    if (employeeIds.length > 0) {
      console.log(`\n💡 RECOMMENDATIONS:`);
      console.log(`   1. The company search is working (found ${employeeIds.length} employees)`);
      console.log(`   2. We need to check more employees or improve name matching`);
      console.log(`   3. Consider checking if the person works at a different company`);
      console.log(`   4. The person might have a different name in CoreSignal`);
    } else {
      console.log(`\n❌ ISSUE: No employees found at this company`);
      console.log(`   This suggests the company name doesn't match CoreSignal's data`);
    }

  } catch (error) {
    console.error('❌ Diagnostic error:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

diagnoseCompanyContextSearch();


