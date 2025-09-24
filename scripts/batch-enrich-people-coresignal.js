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

async function getCurrentPeopleStatus() {
  const total = await prisma.people.count({
    where: { workspaceId: TOP_WORKSPACE_ID }
  });

  const withCoreSignal = await prisma.people.count({
    where: {
      workspaceId: TOP_WORKSPACE_ID,
      customFields: {
        path: ['coresignalData'],
        not: null
      }
    }
  });

  return { total, withCoreSignal, remaining: total - withCoreSignal };
}

async function processPeopleBatch() {
  try {
    console.log('\n🚀 PROCESSING PEOPLE BATCH');
    console.log('============================');

    const coresignal = new CoreSignalAPI();

    // Get people that need CoreSignal enrichment
    const people = await prisma.$queryRaw`
      SELECT id, "fullName", "jobTitle", email, phone, "linkedinUrl", "customFields", "companyId"
      FROM people 
      WHERE "workspaceId" = ${TOP_WORKSPACE_ID} 
        AND ("customFields" IS NULL OR "customFields"->>'coresignalId' IS NULL)
      ORDER BY "fullName"
      LIMIT 50
    `;

    console.log(`📊 Found ${people.length} people to process`);

    if (people.length === 0) {
      console.log('🎉 All people already have CoreSignal data!');
      return { success: true, completed: true };
    }

    let successCount = 0;
    let errorCount = 0;

    for (let i = 0; i < people.length; i++) {
      const person = people[i];
      console.log(`\n🏢 [${i + 1}/${people.length}] Processing: ${person.fullName}`);

      try {
        // Check if person already has coresignalId (duplicate protection)
        if (person.customFields?.coresignalId) {
          console.log('   ⏭️ Already has CoreSignal ID, skipping');
          continue;
        }

        // Search CoreSignal
        let coresignalPersonId = await coresignal.searchPersonByName(person.fullName);
        
        if (!coresignalPersonId) {
          console.log('   ❌ Not found in CoreSignal');
          errorCount++;
          continue;
        }

        console.log(`   ✅ Found CoreSignal ID: ${coresignalPersonId}`);

        // Get CoreSignal data
        const coresignalData = await coresignal.getPersonData(coresignalPersonId);

        if (!coresignalData) {
          console.log('   ❌ Failed to get CoreSignal data');
          errorCount++;
          continue;
        }

        console.log('   ✅ CoreSignal data retrieved');

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
          location: coresignalData.location || undefined,
          headline: coresignalData.headline || undefined,
          summary: coresignalData.summary || undefined,
          skills: coresignalData.skills || undefined,
          interests: coresignalData.interests || undefined,
          education: coresignalData.education || undefined,
          experience: coresignalData.experience || undefined,
          followersCount: coresignalData.followers_count || undefined,
          connectionsCount: coresignalData.connections_count || undefined,
          postsCount: coresignalData.posts_count || undefined,
          profilePictureUrl: coresignalData.profile_picture_url || undefined,
          coverPhotoUrl: coresignalData.cover_photo_url || undefined,
          verified: coresignalData.verified || undefined,
          lastActive: coresignalData.last_active || undefined,
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

    console.log(`\n📊 BATCH SUMMARY:`);
    console.log(`   ✅ Successful: ${successCount}`);
    console.log(`   ❌ Errors: ${errorCount}`);
    console.log(`   📈 Success rate: ${Math.round(successCount / people.length * 100)}%`);

    return { success: true, completed: false, processed: people.length, successCount, errorCount };

  } catch (error) {
    console.error('❌ Batch processing error:', error.message);
    return { success: false, error: error.message };
  }
}

async function automatedPeopleBatchProcessor() {
  console.log('🤖 AUTOMATED PEOPLE BATCH PROCESSOR');
  console.log('===================================');
  console.log('Processing people in batches of 50 until completion...\n');

  try {
    await prisma.$connect();
    console.log('✅ Connected to database\n');

    if (!CORESIGNAL_API_KEY) {
      console.error('🔑 CORESIGNAL_API_KEY is not set. Please set the environment variable.');
      return;
    }

    let batchNumber = 1;
    let totalProcessed = 0;
    let totalSuccess = 0;
    let totalErrors = 0;

    while (true) {
      console.log(`\n🔄 BATCH ${batchNumber}`);
      console.log('='.repeat(50));

      // Get current status
      const status = await getCurrentPeopleStatus();
      console.log(`📊 Current status: ${status.withCoreSignal}/${status.total} (${Math.round((status.withCoreSignal/status.total)*100)}%)`);
      console.log(`⏳ Remaining: ${status.remaining} people`);

      if (status.remaining === 0) {
        console.log('\n🎉 ALL PEOPLE ENRICHED!');
        console.log('========================');
        console.log(`✅ Total people: ${status.total}`);
        console.log(`✅ With CoreSignal: ${status.withCoreSignal} (100%)`);
        console.log(`📊 Final stats:`);
        console.log(`   Total processed: ${totalProcessed}`);
        console.log(`   Successful: ${totalSuccess}`);
        console.log(`   Errors: ${totalErrors}`);
        console.log(`   Success rate: ${Math.round((totalSuccess/totalProcessed)*100)}%`);
        break;
      }

      // Process batch
      const result = await processPeopleBatch();

      if (result.completed) {
        console.log('\n🎉 PEOPLE ENRICHMENT COMPLETED!');
        break;
      }

      if (!result.success) {
        console.log(`❌ Batch ${batchNumber} failed: ${result.error}`);
        console.log('⏳ Waiting 30 seconds before retry...');
        await new Promise(resolve => setTimeout(resolve, 30000));
        continue;
      }

      // Update totals
      totalProcessed += result.processed;
      totalSuccess += result.successCount;
      totalErrors += result.errorCount;

      console.log(`\n📈 PROGRESS UPDATE:`);
      console.log(`   Batch ${batchNumber} completed`);
      console.log(`   Total processed: ${totalProcessed}`);
      console.log(`   Total successful: ${totalSuccess}`);
      console.log(`   Total errors: ${totalErrors}`);

      // Check if we should continue
      const newStatus = await getCurrentPeopleStatus();
      const progress = Math.round((newStatus.withCoreSignal/newStatus.total)*100);
      
      console.log(`   Current progress: ${progress}%`);
      
      if (progress >= 90) {
        console.log('\n🎯 TARGET REACHED! 90%+ CoreSignal coverage achieved!');
        console.log('Continuing to process remaining people...');
      }

      batchNumber++;

      // Add delay between batches
      console.log('\n⏳ Waiting 10 seconds before next batch...');
      await new Promise(resolve => setTimeout(resolve, 10000));
    }

  } catch (error) {
    console.error('❌ AUTOMATED PROCESSOR ERROR:', error);
  } finally {
    await prisma.$disconnect();
  }
}

automatedPeopleBatchProcessor();


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

async function getCurrentPeopleStatus() {
  const total = await prisma.people.count({
    where: { workspaceId: TOP_WORKSPACE_ID }
  });

  const withCoreSignal = await prisma.people.count({
    where: {
      workspaceId: TOP_WORKSPACE_ID,
      customFields: {
        path: ['coresignalData'],
        not: null
      }
    }
  });

  return { total, withCoreSignal, remaining: total - withCoreSignal };
}

async function processPeopleBatch() {
  try {
    console.log('\n🚀 PROCESSING PEOPLE BATCH');
    console.log('============================');

    const coresignal = new CoreSignalAPI();

    // Get people that need CoreSignal enrichment
    const people = await prisma.$queryRaw`
      SELECT id, "fullName", "jobTitle", email, phone, "linkedinUrl", "customFields", "companyId"
      FROM people 
      WHERE "workspaceId" = ${TOP_WORKSPACE_ID} 
        AND ("customFields" IS NULL OR "customFields"->>'coresignalId' IS NULL)
      ORDER BY "fullName"
      LIMIT 50
    `;

    console.log(`📊 Found ${people.length} people to process`);

    if (people.length === 0) {
      console.log('🎉 All people already have CoreSignal data!');
      return { success: true, completed: true };
    }

    let successCount = 0;
    let errorCount = 0;

    for (let i = 0; i < people.length; i++) {
      const person = people[i];
      console.log(`\n🏢 [${i + 1}/${people.length}] Processing: ${person.fullName}`);

      try {
        // Check if person already has coresignalId (duplicate protection)
        if (person.customFields?.coresignalId) {
          console.log('   ⏭️ Already has CoreSignal ID, skipping');
          continue;
        }

        // Search CoreSignal
        let coresignalPersonId = await coresignal.searchPersonByName(person.fullName);
        
        if (!coresignalPersonId) {
          console.log('   ❌ Not found in CoreSignal');
          errorCount++;
          continue;
        }

        console.log(`   ✅ Found CoreSignal ID: ${coresignalPersonId}`);

        // Get CoreSignal data
        const coresignalData = await coresignal.getPersonData(coresignalPersonId);

        if (!coresignalData) {
          console.log('   ❌ Failed to get CoreSignal data');
          errorCount++;
          continue;
        }

        console.log('   ✅ CoreSignal data retrieved');

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
          location: coresignalData.location || undefined,
          headline: coresignalData.headline || undefined,
          summary: coresignalData.summary || undefined,
          skills: coresignalData.skills || undefined,
          interests: coresignalData.interests || undefined,
          education: coresignalData.education || undefined,
          experience: coresignalData.experience || undefined,
          followersCount: coresignalData.followers_count || undefined,
          connectionsCount: coresignalData.connections_count || undefined,
          postsCount: coresignalData.posts_count || undefined,
          profilePictureUrl: coresignalData.profile_picture_url || undefined,
          coverPhotoUrl: coresignalData.cover_photo_url || undefined,
          verified: coresignalData.verified || undefined,
          lastActive: coresignalData.last_active || undefined,
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

    console.log(`\n📊 BATCH SUMMARY:`);
    console.log(`   ✅ Successful: ${successCount}`);
    console.log(`   ❌ Errors: ${errorCount}`);
    console.log(`   📈 Success rate: ${Math.round(successCount / people.length * 100)}%`);

    return { success: true, completed: false, processed: people.length, successCount, errorCount };

  } catch (error) {
    console.error('❌ Batch processing error:', error.message);
    return { success: false, error: error.message };
  }
}

async function automatedPeopleBatchProcessor() {
  console.log('🤖 AUTOMATED PEOPLE BATCH PROCESSOR');
  console.log('===================================');
  console.log('Processing people in batches of 50 until completion...\n');

  try {
    await prisma.$connect();
    console.log('✅ Connected to database\n');

    if (!CORESIGNAL_API_KEY) {
      console.error('🔑 CORESIGNAL_API_KEY is not set. Please set the environment variable.');
      return;
    }

    let batchNumber = 1;
    let totalProcessed = 0;
    let totalSuccess = 0;
    let totalErrors = 0;

    while (true) {
      console.log(`\n🔄 BATCH ${batchNumber}`);
      console.log('='.repeat(50));

      // Get current status
      const status = await getCurrentPeopleStatus();
      console.log(`📊 Current status: ${status.withCoreSignal}/${status.total} (${Math.round((status.withCoreSignal/status.total)*100)}%)`);
      console.log(`⏳ Remaining: ${status.remaining} people`);

      if (status.remaining === 0) {
        console.log('\n🎉 ALL PEOPLE ENRICHED!');
        console.log('========================');
        console.log(`✅ Total people: ${status.total}`);
        console.log(`✅ With CoreSignal: ${status.withCoreSignal} (100%)`);
        console.log(`📊 Final stats:`);
        console.log(`   Total processed: ${totalProcessed}`);
        console.log(`   Successful: ${totalSuccess}`);
        console.log(`   Errors: ${totalErrors}`);
        console.log(`   Success rate: ${Math.round((totalSuccess/totalProcessed)*100)}%`);
        break;
      }

      // Process batch
      const result = await processPeopleBatch();

      if (result.completed) {
        console.log('\n🎉 PEOPLE ENRICHMENT COMPLETED!');
        break;
      }

      if (!result.success) {
        console.log(`❌ Batch ${batchNumber} failed: ${result.error}`);
        console.log('⏳ Waiting 30 seconds before retry...');
        await new Promise(resolve => setTimeout(resolve, 30000));
        continue;
      }

      // Update totals
      totalProcessed += result.processed;
      totalSuccess += result.successCount;
      totalErrors += result.errorCount;

      console.log(`\n📈 PROGRESS UPDATE:`);
      console.log(`   Batch ${batchNumber} completed`);
      console.log(`   Total processed: ${totalProcessed}`);
      console.log(`   Total successful: ${totalSuccess}`);
      console.log(`   Total errors: ${totalErrors}`);

      // Check if we should continue
      const newStatus = await getCurrentPeopleStatus();
      const progress = Math.round((newStatus.withCoreSignal/newStatus.total)*100);
      
      console.log(`   Current progress: ${progress}%`);
      
      if (progress >= 90) {
        console.log('\n🎯 TARGET REACHED! 90%+ CoreSignal coverage achieved!');
        console.log('Continuing to process remaining people...');
      }

      batchNumber++;

      // Add delay between batches
      console.log('\n⏳ Waiting 10 seconds before next batch...');
      await new Promise(resolve => setTimeout(resolve, 10000));
    }

  } catch (error) {
    console.error('❌ AUTOMATED PROCESSOR ERROR:', error);
  } finally {
    await prisma.$disconnect();
  }
}

automatedPeopleBatchProcessor();
