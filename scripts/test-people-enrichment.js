const { PrismaClient } = require('@prisma/client');
const https = require('https');

const prisma = new PrismaClient();
const TOP_WORKSPACE_ID = '01K5D01YCQJ9TJ7CT4DZDE79T1';

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

  async searchPerson(query, searchField = "full_name") {
    const searchQuery = {
      query: {
        query_string: {
          query: query,
          default_field: searchField,
          default_operator: "and"
        }
      }
    };

    const url = `${this.baseUrl}/employee_multi_source/search/es_dsl`;

    try {
      const response = await this.makeRequest(url, 'POST', searchQuery);

      if (Array.isArray(response) && response.length > 0) {
        return response[0].employee_id || response[0];
      }
      return null;
    } catch (error) {
      console.error(`Error searching for person "${query}" in field "${searchField}":`, error.message);
      return null;
    }
  }

  async searchPersonByName(personName, companyName = null) {
    // Try multiple variations of person name
    const nameVariations = [
      personName, // Full name
      personName.split(' ')[0], // First name only
      personName.split(' ').slice(-1)[0], // Last name only
      personName.replace(/[.,]/g, ''), // Remove punctuation
    ].filter((name, index, arr) => arr.indexOf(name) === index && name.trim().length > 2);

    for (const name of nameVariations) {
      const result = await this.searchPerson(name, "full_name");
      if (result) {
        return result;
      }
    }

    // Try searching with company context
    if (companyName) {
      const companyResult = await this.searchPerson(`${personName} ${companyName}`, "full_name");
      if (companyResult) {
        return companyResult;
      }
    }

    return null;
  }

  async getPersonData(personId) {
    const url = `${this.baseUrl}/employee_multi_source/collect/${personId}`;
    try {
      return await this.makeRequest(url);
    } catch (error) {
      console.error(`Error getting person data for ID ${personId}:`, error.message);
      return null;
    }
  }
}

async function testPeopleEnrichment() {
  try {
    await prisma.$connect();
    console.log('🧪 TESTING PEOPLE ENRICHMENT');
    console.log('============================');

    if (!CORESIGNAL_API_KEY) {
      console.error('🔑 CORESIGNAL_API_KEY is not set. Please set the environment variable.');
      return;
    }

    const coresignal = new CoreSignalAPI();

    // Get 10 people who need CoreSignal data
    const people = await prisma.$queryRaw`
      SELECT id, "fullName", "jobTitle", email, phone, "linkedinUrl", "customFields", "companyId"
      FROM people 
      WHERE "workspaceId" = ${TOP_WORKSPACE_ID} 
        AND ("customFields" IS NULL OR "customFields"->>'coresignalId' IS NULL)
      ORDER BY "fullName"
      LIMIT 10
    `;

    console.log(`📊 Found ${people.length} people to test`);

    if (people.length === 0) {
      console.log('🎉 All people already have CoreSignal data!');
      return;
    }

    let successCount = 0;
    let errorCount = 0;

    for (let i = 0; i < people.length; i++) {
      const person = people[i];
      console.log(`\n🏢 [${i + 1}/${people.length}] Testing: ${person.fullName}`);

      try {
        // Check if person already has coresignalId (duplicate protection)
        if (person.customFields?.coresignalId) {
          console.log('   ⏭️ Already has CoreSignal ID, skipping');
          continue;
        }

        // Search CoreSignal
        console.log('   🔍 Searching CoreSignal...');
        let coresignalPersonId = await coresignal.searchPersonByName(person.fullName);
        
        if (!coresignalPersonId) {
          console.log('   ❌ Not found in CoreSignal');
          errorCount++;
          continue;
        }

        console.log(`   ✅ Found CoreSignal ID: ${coresignalPersonId}`);

        // Get CoreSignal data
        console.log('   📥 Getting CoreSignal data...');
        const coresignalData = await coresignal.getPersonData(coresignalPersonId);

        if (!coresignalData) {
          console.log('   ❌ Failed to get CoreSignal data');
          errorCount++;
          continue;
        }

        console.log('   ✅ CoreSignal data retrieved');
        console.log(`   📊 Data fields: ${Object.keys(coresignalData).length} fields`);
        console.log(`   👤 Name: ${coresignalData.full_name || coresignalData.name || 'N/A'}`);
        console.log(`   📧 Email: ${coresignalData.email || 'N/A'}`);
        console.log(`   💼 Job: ${coresignalData.job_title || 'N/A'}`);
        console.log(`   🏢 Company: ${coresignalData.company_name || 'N/A'}`);

        // Prepare update data
        const customFields = {
          ...person.customFields,
          coresignalId: coresignalPersonId,
          coresignalData: coresignalData,
          enrichmentSource: 'CoreSignal',
          lastEnrichedAt: new Date().toISOString(),
          totalFields: Object.keys(coresignalData).length
        };

        const updateData = {
          email: coresignalData.email || person.email || undefined,
          phone: coresignalData.phone || person.phone || undefined,
          linkedinUrl: coresignalData.linkedin_url || person.linkedinUrl || undefined,
          jobTitle: coresignalData.job_title || person.jobTitle || undefined,
          department: coresignalData.department || undefined,
          seniority: coresignalData.seniority || undefined,
          customFields: customFields,
          lastEnriched: new Date(),
          enrichmentSources: ['coresignal'],
          updatedAt: new Date()
        };

        // Remove undefined values
        Object.keys(updateData).forEach(key => {
          if (updateData[key] === undefined) {
            delete updateData[key];
          }
        });

        // Update database
        await prisma.people.update({
          where: { id: person.id },
          data: updateData
        });

        console.log(`   ✅ Successfully enriched ${person.fullName}`);
        successCount++;

      } catch (error) {
        console.log(`   ❌ Error: ${error.message}`);
        errorCount++;
      }
    }

    console.log(`\n📊 TEST SUMMARY:`);
    console.log(`   ✅ Successful: ${successCount}`);
    console.log(`   ❌ Errors: ${errorCount}`);
    console.log(`   📈 Success rate: ${Math.round(successCount / people.length * 100)}%`);

    if (successCount > 0) {
      console.log('\n🎉 SUCCESS! People enrichment is working correctly!');
      console.log('You can now run the full batch processor.');
    } else {
      console.log('\n❌ ISSUE: No people were successfully enriched.');
      console.log('Check the API endpoints and search logic.');
    }

    return { success: true, processed: people.length, successCount, errorCount };

  } catch (error) {
    console.error('❌ Test error:', error.message);
    return { success: false, error: error.message };
  } finally {
    await prisma.$disconnect();
  }
}

testPeopleEnrichment();


const prisma = new PrismaClient();
const TOP_WORKSPACE_ID = '01K5D01YCQJ9TJ7CT4DZDE79T1';

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

  async searchPerson(query, searchField = "full_name") {
    const searchQuery = {
      query: {
        query_string: {
          query: query,
          default_field: searchField,
          default_operator: "and"
        }
      }
    };

    const url = `${this.baseUrl}/employee_multi_source/search/es_dsl`;

    try {
      const response = await this.makeRequest(url, 'POST', searchQuery);

      if (Array.isArray(response) && response.length > 0) {
        return response[0].employee_id || response[0];
      }
      return null;
    } catch (error) {
      console.error(`Error searching for person "${query}" in field "${searchField}":`, error.message);
      return null;
    }
  }

  async searchPersonByName(personName, companyName = null) {
    // Try multiple variations of person name
    const nameVariations = [
      personName, // Full name
      personName.split(' ')[0], // First name only
      personName.split(' ').slice(-1)[0], // Last name only
      personName.replace(/[.,]/g, ''), // Remove punctuation
    ].filter((name, index, arr) => arr.indexOf(name) === index && name.trim().length > 2);

    for (const name of nameVariations) {
      const result = await this.searchPerson(name, "full_name");
      if (result) {
        return result;
      }
    }

    // Try searching with company context
    if (companyName) {
      const companyResult = await this.searchPerson(`${personName} ${companyName}`, "full_name");
      if (companyResult) {
        return companyResult;
      }
    }

    return null;
  }

  async getPersonData(personId) {
    const url = `${this.baseUrl}/employee_multi_source/collect/${personId}`;
    try {
      return await this.makeRequest(url);
    } catch (error) {
      console.error(`Error getting person data for ID ${personId}:`, error.message);
      return null;
    }
  }
}

async function testPeopleEnrichment() {
  try {
    await prisma.$connect();
    console.log('🧪 TESTING PEOPLE ENRICHMENT');
    console.log('============================');

    if (!CORESIGNAL_API_KEY) {
      console.error('🔑 CORESIGNAL_API_KEY is not set. Please set the environment variable.');
      return;
    }

    const coresignal = new CoreSignalAPI();

    // Get 10 people who need CoreSignal data
    const people = await prisma.$queryRaw`
      SELECT id, "fullName", "jobTitle", email, phone, "linkedinUrl", "customFields", "companyId"
      FROM people 
      WHERE "workspaceId" = ${TOP_WORKSPACE_ID} 
        AND ("customFields" IS NULL OR "customFields"->>'coresignalId' IS NULL)
      ORDER BY "fullName"
      LIMIT 10
    `;

    console.log(`📊 Found ${people.length} people to test`);

    if (people.length === 0) {
      console.log('🎉 All people already have CoreSignal data!');
      return;
    }

    let successCount = 0;
    let errorCount = 0;

    for (let i = 0; i < people.length; i++) {
      const person = people[i];
      console.log(`\n🏢 [${i + 1}/${people.length}] Testing: ${person.fullName}`);

      try {
        // Check if person already has coresignalId (duplicate protection)
        if (person.customFields?.coresignalId) {
          console.log('   ⏭️ Already has CoreSignal ID, skipping');
          continue;
        }

        // Search CoreSignal
        console.log('   🔍 Searching CoreSignal...');
        let coresignalPersonId = await coresignal.searchPersonByName(person.fullName);
        
        if (!coresignalPersonId) {
          console.log('   ❌ Not found in CoreSignal');
          errorCount++;
          continue;
        }

        console.log(`   ✅ Found CoreSignal ID: ${coresignalPersonId}`);

        // Get CoreSignal data
        console.log('   📥 Getting CoreSignal data...');
        const coresignalData = await coresignal.getPersonData(coresignalPersonId);

        if (!coresignalData) {
          console.log('   ❌ Failed to get CoreSignal data');
          errorCount++;
          continue;
        }

        console.log('   ✅ CoreSignal data retrieved');
        console.log(`   📊 Data fields: ${Object.keys(coresignalData).length} fields`);
        console.log(`   👤 Name: ${coresignalData.full_name || coresignalData.name || 'N/A'}`);
        console.log(`   📧 Email: ${coresignalData.email || 'N/A'}`);
        console.log(`   💼 Job: ${coresignalData.job_title || 'N/A'}`);
        console.log(`   🏢 Company: ${coresignalData.company_name || 'N/A'}`);

        // Prepare update data
        const customFields = {
          ...person.customFields,
          coresignalId: coresignalPersonId,
          coresignalData: coresignalData,
          enrichmentSource: 'CoreSignal',
          lastEnrichedAt: new Date().toISOString(),
          totalFields: Object.keys(coresignalData).length
        };

        const updateData = {
          email: coresignalData.email || person.email || undefined,
          phone: coresignalData.phone || person.phone || undefined,
          linkedinUrl: coresignalData.linkedin_url || person.linkedinUrl || undefined,
          jobTitle: coresignalData.job_title || person.jobTitle || undefined,
          department: coresignalData.department || undefined,
          seniority: coresignalData.seniority || undefined,
          customFields: customFields,
          lastEnriched: new Date(),
          enrichmentSources: ['coresignal'],
          updatedAt: new Date()
        };

        // Remove undefined values
        Object.keys(updateData).forEach(key => {
          if (updateData[key] === undefined) {
            delete updateData[key];
          }
        });

        // Update database
        await prisma.people.update({
          where: { id: person.id },
          data: updateData
        });

        console.log(`   ✅ Successfully enriched ${person.fullName}`);
        successCount++;

      } catch (error) {
        console.log(`   ❌ Error: ${error.message}`);
        errorCount++;
      }
    }

    console.log(`\n📊 TEST SUMMARY:`);
    console.log(`   ✅ Successful: ${successCount}`);
    console.log(`   ❌ Errors: ${errorCount}`);
    console.log(`   📈 Success rate: ${Math.round(successCount / people.length * 100)}%`);

    if (successCount > 0) {
      console.log('\n🎉 SUCCESS! People enrichment is working correctly!');
      console.log('You can now run the full batch processor.');
    } else {
      console.log('\n❌ ISSUE: No people were successfully enriched.');
      console.log('Check the API endpoints and search logic.');
    }

    return { success: true, processed: people.length, successCount, errorCount };

  } catch (error) {
    console.error('❌ Test error:', error.message);
    return { success: false, error: error.message };
  } finally {
    await prisma.$disconnect();
  }
}

testPeopleEnrichment();
