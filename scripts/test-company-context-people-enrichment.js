const { PrismaClient } = require('@prisma/client');
const https = require('https');

const prisma = new PrismaClient();
const TOP_WORKSPACE_ID = '01K5D01YCQJ9TJ7CT4DZDE79T1';

const CORESIGNAL_API_KEY = process.env.CORESIGNAL_API_KEY;
const CORESIGNAL_BASE_URL = 'https://api.coresignal.com/cdapi/v2';

class CompanyContextCoreSignalAPI {
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

  /**
   * Search for people who work at a specific company using company-context search
   * This is the CORRECT approach - search by company, not by person name
   */
  async searchPeopleByCompany(companyName) {
    console.log(`   🔍 Searching for people at "${companyName}"...`);
    
    // Use the same query structure as the working buyer-group-bulk API
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

    try {
      const response = await this.makeRequest(url, 'POST', searchQuery);
      
      if (Array.isArray(response) && response.length > 0) {
        console.log(`   ✅ Found ${response.length} people at ${companyName}`);
        return response; // Returns array of employee IDs
      }
      console.log(`   ❌ No people found at ${companyName}`);
      return [];
    } catch (error) {
      console.error(`   ❌ Error searching for people at ${companyName}:`, error.message);
      return [];
    }
  }

  /**
   * Get detailed profile data for a person
   */
  async getPersonData(employeeId) {
    const url = `${this.baseUrl}/employee_multi_source/collect/${employeeId}`;
    try {
      return await this.makeRequest(url);
    } catch (error) {
      console.error(`   ❌ Error getting person data for ID ${employeeId}:`, error.message);
      return null;
    }
  }

  /**
   * Find a specific person among the company employees
   */
  async findPersonAtCompany(personName, companyName) {
    // First, get all people who work at the company
    const companyEmployees = await this.searchPeopleByCompany(companyName);
    
    if (companyEmployees.length === 0) {
      return null;
    }

    console.log(`   🔍 Looking for "${personName}" among ${companyEmployees.length} employees...`);

    // Get detailed profiles for up to 20 employees to find our person
    const maxCheck = Math.min(20, companyEmployees.length);
    
    for (let i = 0; i < maxCheck; i++) {
      const employeeId = companyEmployees[i];
      const profile = await this.getPersonData(employeeId);
      
      if (profile) {
        const fullName = profile.full_name || profile.member_full_name || '';
        
        // Check if this is the person we're looking for
        if (this.isPersonMatch(personName, fullName)) {
          console.log(`   ✅ Found "${personName}" as "${fullName}" (ID: ${employeeId})`);
          return { employeeId, profile };
        }
      }
    }

    console.log(`   ❌ "${personName}" not found among ${maxCheck} employees at ${companyName}`);
    return null;
  }

  /**
   * Check if two names match (handles variations)
   */
  isPersonMatch(targetName, foundName) {
    const normalize = (name) => name.toLowerCase().trim().replace(/[.,]/g, '');
    const target = normalize(targetName);
    const found = normalize(foundName);
    
    // Exact match
    if (target === found) return true;
    
    // Check if first and last names match
    const targetParts = target.split(' ').filter(p => p.length > 0);
    const foundParts = found.split(' ').filter(p => p.length > 0);
    
    if (targetParts.length >= 2 && foundParts.length >= 2) {
      const targetFirst = targetParts[0];
      const targetLast = targetParts[targetParts.length - 1];
      const foundFirst = foundParts[0];
      const foundLast = foundParts[foundParts.length - 1];
      
      return targetFirst === foundFirst && targetLast === foundLast;
    }
    
    return false;
  }
}

async function testCompanyContextPeopleEnrichment() {
  try {
    await prisma.$connect();
    console.log('🧪 TESTING COMPANY-CONTEXT PEOPLE ENRICHMENT');
    console.log('============================================');

    if (!CORESIGNAL_API_KEY) {
      console.error('🔑 CORESIGNAL_API_KEY is not set. Please set the environment variable.');
      return;
    }

    const coresignal = new CompanyContextCoreSignalAPI();

    // Get 10 people who need CoreSignal data
    const people = await prisma.$queryRaw`
      SELECT p.id, p."fullName", p."jobTitle", p.email, p.phone, p."linkedinUrl", p."customFields", p."companyId",
             c.name as company_name, c.website as company_website
      FROM people p
      LEFT JOIN companies c ON p."companyId" = c.id
      WHERE p."workspaceId" = ${TOP_WORKSPACE_ID} 
        AND (p."customFields" IS NULL OR p."customFields"->>'coresignalId' IS NULL)
        AND c.name IS NOT NULL
      ORDER BY p."fullName"
      LIMIT 10
    `;

    console.log(`📊 Found ${people.length} people to test`);

    if (people.length === 0) {
      console.log('🎉 All people already have CoreSignal data!');
      return;
    }

    let successCount = 0;
    let errorCount = 0;
    let accuracyCount = 0;

    for (let i = 0; i < people.length; i++) {
      const person = people[i];
      console.log(`\n🏢 [${i + 1}/${people.length}] Testing: ${person.fullName}`);
      console.log(`   🏢 Company: ${person.company_name}`);

      try {
        // Check if person already has coresignalId (duplicate protection)
        if (person.customFields?.coresignalId) {
          console.log('   ⏭️ Already has CoreSignal ID, skipping');
          continue;
        }

        // Use company-context search to find the person
        const result = await coresignal.findPersonAtCompany(person.fullName, person.company_name);
        
        if (!result) {
          console.log('   ❌ Person not found at company');
          errorCount++;
          continue;
        }

        const { employeeId, profile } = result;
        console.log(`   ✅ Found CoreSignal ID: ${employeeId}`);

        // Verify this is the right person by checking company match
        const profileCompany = profile.active_experience_company_name || 
                              (profile.experience && profile.experience[0]?.company_name) || '';
        
        const companyMatch = person.company_name.toLowerCase().includes(profileCompany.toLowerCase()) ||
                           profileCompany.toLowerCase().includes(person.company_name.toLowerCase());
        
        if (companyMatch) {
          console.log(`   ✅ Company match confirmed: "${profileCompany}"`);
          accuracyCount++;
        } else {
          console.log(`   ⚠️ Company mismatch: CoreSignal shows "${profileCompany}"`);
        }

        // Prepare update data
        const customFields = {
          ...person.customFields,
          coresignalId: employeeId,
          coresignalData: profile,
          enrichmentSource: 'CoreSignal (Company-Context)',
          lastEnrichedAt: new Date().toISOString(),
          totalFields: Object.keys(profile).length
        };

        const updateData = {
          email: profile.primary_professional_email || person.email || undefined,
          phone: profile.primary_phone_number || person.phone || undefined,
          linkedinUrl: profile.linkedin_url || person.linkedinUrl || undefined,
          jobTitle: profile.active_experience_title || person.jobTitle || undefined,
          department: profile.active_experience_department || undefined,
          seniority: profile.active_experience_management_level || undefined,
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
    console.log(`   🎯 Accurate matches: ${accuracyCount}`);
    console.log(`   📈 Success rate: ${Math.round(successCount / people.length * 100)}%`);
    console.log(`   🎯 Accuracy rate: ${Math.round(accuracyCount / people.length * 100)}%`);

    if (successCount > 0 && accuracyCount === successCount) {
      console.log('\n🎉 SUCCESS! Company-context people enrichment is working correctly!');
      console.log('All enriched people have accurate company matches.');
      console.log('You can now run the full batch processor with confidence.');
    } else if (successCount > 0) {
      console.log('\n⚠️ PARTIAL SUCCESS: Some people were enriched but with company mismatches.');
      console.log('Consider refining the company matching logic.');
    } else {
      console.log('\n❌ ISSUE: No people were successfully enriched.');
      console.log('Check the company-context search logic.');
    }

    return { success: true, processed: people.length, successCount, errorCount, accuracyCount };

  } catch (error) {
    console.error('❌ Test error:', error.message);
    return { success: false, error: error.message };
  } finally {
    await prisma.$disconnect();
  }
}

testCompanyContextPeopleEnrichment();
const https = require('https');

const prisma = new PrismaClient();
const TOP_WORKSPACE_ID = '01K5D01YCQJ9TJ7CT4DZDE79T1';

const CORESIGNAL_API_KEY = process.env.CORESIGNAL_API_KEY;
const CORESIGNAL_BASE_URL = 'https://api.coresignal.com/cdapi/v2';

class CompanyContextCoreSignalAPI {
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

  /**
   * Search for people who work at a specific company using company-context search
   * This is the CORRECT approach - search by company, not by person name
   */
  async searchPeopleByCompany(companyName) {
    console.log(`   🔍 Searching for people at "${companyName}"...`);
    
    // Use the same query structure as the working buyer-group-bulk API
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

    try {
      const response = await this.makeRequest(url, 'POST', searchQuery);
      
      if (Array.isArray(response) && response.length > 0) {
        console.log(`   ✅ Found ${response.length} people at ${companyName}`);
        return response; // Returns array of employee IDs
      }
      console.log(`   ❌ No people found at ${companyName}`);
      return [];
    } catch (error) {
      console.error(`   ❌ Error searching for people at ${companyName}:`, error.message);
      return [];
    }
  }

  /**
   * Get detailed profile data for a person
   */
  async getPersonData(employeeId) {
    const url = `${this.baseUrl}/employee_multi_source/collect/${employeeId}`;
    try {
      return await this.makeRequest(url);
    } catch (error) {
      console.error(`   ❌ Error getting person data for ID ${employeeId}:`, error.message);
      return null;
    }
  }

  /**
   * Find a specific person among the company employees
   */
  async findPersonAtCompany(personName, companyName) {
    // First, get all people who work at the company
    const companyEmployees = await this.searchPeopleByCompany(companyName);
    
    if (companyEmployees.length === 0) {
      return null;
    }

    console.log(`   🔍 Looking for "${personName}" among ${companyEmployees.length} employees...`);

    // Get detailed profiles for up to 20 employees to find our person
    const maxCheck = Math.min(20, companyEmployees.length);
    
    for (let i = 0; i < maxCheck; i++) {
      const employeeId = companyEmployees[i];
      const profile = await this.getPersonData(employeeId);
      
      if (profile) {
        const fullName = profile.full_name || profile.member_full_name || '';
        
        // Check if this is the person we're looking for
        if (this.isPersonMatch(personName, fullName)) {
          console.log(`   ✅ Found "${personName}" as "${fullName}" (ID: ${employeeId})`);
          return { employeeId, profile };
        }
      }
    }

    console.log(`   ❌ "${personName}" not found among ${maxCheck} employees at ${companyName}`);
    return null;
  }

  /**
   * Check if two names match (handles variations)
   */
  isPersonMatch(targetName, foundName) {
    const normalize = (name) => name.toLowerCase().trim().replace(/[.,]/g, '');
    const target = normalize(targetName);
    const found = normalize(foundName);
    
    // Exact match
    if (target === found) return true;
    
    // Check if first and last names match
    const targetParts = target.split(' ').filter(p => p.length > 0);
    const foundParts = found.split(' ').filter(p => p.length > 0);
    
    if (targetParts.length >= 2 && foundParts.length >= 2) {
      const targetFirst = targetParts[0];
      const targetLast = targetParts[targetParts.length - 1];
      const foundFirst = foundParts[0];
      const foundLast = foundParts[foundParts.length - 1];
      
      return targetFirst === foundFirst && targetLast === foundLast;
    }
    
    return false;
  }
}

async function testCompanyContextPeopleEnrichment() {
  try {
    await prisma.$connect();
    console.log('🧪 TESTING COMPANY-CONTEXT PEOPLE ENRICHMENT');
    console.log('============================================');

    if (!CORESIGNAL_API_KEY) {
      console.error('🔑 CORESIGNAL_API_KEY is not set. Please set the environment variable.');
      return;
    }

    const coresignal = new CompanyContextCoreSignalAPI();

    // Get 10 people who need CoreSignal data
    const people = await prisma.$queryRaw`
      SELECT p.id, p."fullName", p."jobTitle", p.email, p.phone, p."linkedinUrl", p."customFields", p."companyId",
             c.name as company_name, c.website as company_website
      FROM people p
      LEFT JOIN companies c ON p."companyId" = c.id
      WHERE p."workspaceId" = ${TOP_WORKSPACE_ID} 
        AND (p."customFields" IS NULL OR p."customFields"->>'coresignalId' IS NULL)
        AND c.name IS NOT NULL
      ORDER BY p."fullName"
      LIMIT 10
    `;

    console.log(`📊 Found ${people.length} people to test`);

    if (people.length === 0) {
      console.log('🎉 All people already have CoreSignal data!');
      return;
    }

    let successCount = 0;
    let errorCount = 0;
    let accuracyCount = 0;

    for (let i = 0; i < people.length; i++) {
      const person = people[i];
      console.log(`\n🏢 [${i + 1}/${people.length}] Testing: ${person.fullName}`);
      console.log(`   🏢 Company: ${person.company_name}`);

      try {
        // Check if person already has coresignalId (duplicate protection)
        if (person.customFields?.coresignalId) {
          console.log('   ⏭️ Already has CoreSignal ID, skipping');
          continue;
        }

        // Use company-context search to find the person
        const result = await coresignal.findPersonAtCompany(person.fullName, person.company_name);
        
        if (!result) {
          console.log('   ❌ Person not found at company');
          errorCount++;
          continue;
        }

        const { employeeId, profile } = result;
        console.log(`   ✅ Found CoreSignal ID: ${employeeId}`);

        // Verify this is the right person by checking company match
        const profileCompany = profile.active_experience_company_name || 
                              (profile.experience && profile.experience[0]?.company_name) || '';
        
        const companyMatch = person.company_name.toLowerCase().includes(profileCompany.toLowerCase()) ||
                           profileCompany.toLowerCase().includes(person.company_name.toLowerCase());
        
        if (companyMatch) {
          console.log(`   ✅ Company match confirmed: "${profileCompany}"`);
          accuracyCount++;
        } else {
          console.log(`   ⚠️ Company mismatch: CoreSignal shows "${profileCompany}"`);
        }

        // Prepare update data
        const customFields = {
          ...person.customFields,
          coresignalId: employeeId,
          coresignalData: profile,
          enrichmentSource: 'CoreSignal (Company-Context)',
          lastEnrichedAt: new Date().toISOString(),
          totalFields: Object.keys(profile).length
        };

        const updateData = {
          email: profile.primary_professional_email || person.email || undefined,
          phone: profile.primary_phone_number || person.phone || undefined,
          linkedinUrl: profile.linkedin_url || person.linkedinUrl || undefined,
          jobTitle: profile.active_experience_title || person.jobTitle || undefined,
          department: profile.active_experience_department || undefined,
          seniority: profile.active_experience_management_level || undefined,
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
    console.log(`   🎯 Accurate matches: ${accuracyCount}`);
    console.log(`   📈 Success rate: ${Math.round(successCount / people.length * 100)}%`);
    console.log(`   🎯 Accuracy rate: ${Math.round(accuracyCount / people.length * 100)}%`);

    if (successCount > 0 && accuracyCount === successCount) {
      console.log('\n🎉 SUCCESS! Company-context people enrichment is working correctly!');
      console.log('All enriched people have accurate company matches.');
      console.log('You can now run the full batch processor with confidence.');
    } else if (successCount > 0) {
      console.log('\n⚠️ PARTIAL SUCCESS: Some people were enriched but with company mismatches.');
      console.log('Consider refining the company matching logic.');
    } else {
      console.log('\n❌ ISSUE: No people were successfully enriched.');
      console.log('Check the company-context search logic.');
    }

    return { success: true, processed: people.length, successCount, errorCount, accuracyCount };

  } catch (error) {
    console.error('❌ Test error:', error.message);
    return { success: false, error: error.message };
  } finally {
    await prisma.$disconnect();
  }
}

testCompanyContextPeopleEnrichment();


