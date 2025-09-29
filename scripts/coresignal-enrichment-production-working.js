const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// CoreSignal API configuration
const CORESIGNAL_API_KEY = 'hzwQmb13cF21if4arzLpx0SRWyoOUyzP';

// Configuration
const CONFIG = {
  TOP_WORKSPACE_ID: '01K5D01YCQJ9TJ7CT4DZDE79T1',
  TEST_MODE: process.argv.includes('--test'),
  TEST_LIMIT: 20, // Test with 20 people
  DELAY_BETWEEN_REQUESTS: 1000, // 1 second between requests
  BATCH_SIZE: 10 // Process in smaller batches
};

// Search by LinkedIn URL (returns array of employee IDs)
async function searchByLinkedIn(linkedinUrl) {
  const url = 'https://api.coresignal.com/cdapi/v2/employee_multi_source/search/es_dsl';
  const data = {
    "query": {
      "bool": {
        "must": [
          {
            "match_phrase": {
              "linkedin_url": linkedinUrl
            }
          }
        ]
      }
    }
  };
  const customHeaders = {
    "Content-Type": "application/json",
    "apikey": CORESIGNAL_API_KEY
  };

  try {
    const response = await fetch(url, { 
      method: 'POST', 
      headers: customHeaders, 
      body: JSON.stringify(data) 
    });
    
    const result = await response.json();
    // The response is an array of employee IDs
    return Array.isArray(result) ? result : [];
  } catch (error) {
    console.error('LinkedIn search error:', error);
    return [];
  }
}

// Search by email (returns array of employee IDs)
async function searchByEmail(email) {
  const url = 'https://api.coresignal.com/cdapi/v2/employee_multi_source/search/es_dsl';
  const data = {
    "query": {
      "bool": {
        "should": [
          {
            "term": {
              "primary_professional_email.exact": email
            }
          },
          {
            "nested": {
              "path": "professional_emails_collection",
              "query": {
                "term": {
                  "professional_emails_collection.professional_email.exact": email
                }
              }
            }
          }
        ],
        "minimum_should_match": 1
      }
    }
  };
  const customHeaders = {
    "Content-Type": "application/json",
    "apikey": CORESIGNAL_API_KEY
  };

  try {
    const response = await fetch(url, { 
      method: 'POST', 
      headers: customHeaders, 
      body: JSON.stringify(data) 
    });
    
    const result = await response.json();
    // The response is an array of employee IDs
    return Array.isArray(result) ? result : [];
  } catch (error) {
    console.error('Email search error:', error);
    return [];
  }
}

// Collect full employee data
async function collectEmployeeData(employeeId) {
  const url = `https://api.coresignal.com/cdapi/v2/employee_multi_source/collect/${employeeId}`;
  const customHeaders = {
    "Content-Type": "application/json",
    "apikey": CORESIGNAL_API_KEY
  };

  try {
    const response = await fetch(url, { 
      method: 'GET', 
      headers: customHeaders 
    });
    
    const result = await response.json();
    return result;
  } catch (error) {
    console.error('Employee collection error:', error);
    throw error;
  }
}

// Store complete CoreSignal data
async function storeCompleteCoreSignalData(personId, coresignalData, method) {
  try {
    console.log(`📊 Storing complete CoreSignal data for person ${personId} (method: ${method})`);
    
    // Store the ENTIRE CoreSignal response
    await prisma.people.update({
      where: { id: personId },
      data: {
        customFields: {
          // Store the complete CoreSignal data
          coresignal: coresignalData,
          // Add our metadata
          enriched_at: new Date().toISOString(),
          enrichment_method: method,
          enrichment_source: 'coresignal_complete'
        },
        enrichmentSources: {
          push: 'coresignal_complete'
        },
        lastEnriched: new Date(),
        updatedAt: new Date()
      }
    });

    console.log(`✅ Successfully stored complete CoreSignal data for person ${personId}`);
    return true;

  } catch (error) {
    console.error(`❌ Error storing CoreSignal data for person ${personId}:`, error);
    throw error;
  }
}

// Enrich a single person
async function enrichPerson(person) {
  try {
    console.log(`🔍 Enriching ${person.fullName}`);
    
    let employeeIds = [];
    let method = '';

    // Try LinkedIn first if available
    if (person.linkedinUrl) {
      try {
        console.log(`📎 Searching by LinkedIn: ${person.linkedinUrl}`);
        employeeIds = await searchByLinkedIn(person.linkedinUrl);
        
        if (employeeIds.length > 0) {
          console.log(`✅ Found by LinkedIn, employee IDs: ${employeeIds.join(', ')}`);
          method = 'linkedin';
        }
      } catch (error) {
        console.log(`⚠️ LinkedIn search failed: ${error.message}`);
      }
    }

    // Try email if LinkedIn didn't work
    if (employeeIds.length === 0 && person.email) {
      try {
        console.log(`📧 Searching by email: ${person.email}`);
        employeeIds = await searchByEmail(person.email);
        
        if (employeeIds.length > 0) {
          console.log(`✅ Found by email, employee IDs: ${employeeIds.join(', ')}`);
          method = 'email';
        }
      } catch (error) {
        console.log(`⚠️ Email search failed: ${error.message}`);
      }
    }

    if (employeeIds.length > 0) {
      // Use the first employee ID
      const employeeId = employeeIds[0];
      console.log(`📊 Collecting data for employee ID: ${employeeId}`);
      
      const coresignalData = await collectEmployeeData(employeeId);
      console.log(`📊 Storing comprehensive data (method: ${method})`);
      
      await storeCompleteCoreSignalData(person.id, coresignalData, method);
      return { success: true, method: method, employeeId: employeeId };
    } else {
      console.log(`❌ No CoreSignal data found for ${person.fullName}`);
      return { success: false, method: 'none' };
    }

  } catch (error) {
    console.error(`❌ Error enriching ${person.fullName}:`, error);
    return { success: false, method: 'error', error: error.message };
  }
}

// Main enrichment function
async function runComprehensiveEnrichment() {
  try {
    console.log('🚀 Starting CoreSignal Enrichment Production Script');
    console.log('====================================================');
    console.log(`Mode: ${CONFIG.TEST_MODE ? `TEST (${CONFIG.TEST_LIMIT} people)` : 'FULL PRODUCTION'}`);
    console.log(`TOP Workspace: ${CONFIG.TOP_WORKSPACE_ID}`);
    console.log('');
    
    // Get people to enrich
    const whereClause = {
      workspaceId: CONFIG.TOP_WORKSPACE_ID,
      OR: [
        { email: { not: null } },
        { linkedinUrl: { not: null } }
      ],
      NOT: {
        enrichmentSources: { hasSome: ['coresignal_complete'] }
      }
    };
    
    const people = await prisma.people.findMany({
      where: whereClause,
      select: {
        id: true,
        fullName: true,
        email: true,
        linkedinUrl: true
      },
      take: CONFIG.TEST_MODE ? CONFIG.TEST_LIMIT : undefined,
      orderBy: [
        { linkedinUrl: { sort: 'desc', nulls: 'last' } }, // LinkedIn first
        { email: { sort: 'desc', nulls: 'last' } }
      ]
    });
    
    console.log(`📋 Found ${people.length} people to enrich`);
    console.log('');
    
    const results = {
      total: people.length,
      successful: 0,
      failed: 0,
      byMethod: { linkedin: 0, email: 0, none: 0, error: 0 }
    };
    
    // Process in batches
    const batches = [];
    for (let i = 0; i < people.length; i += CONFIG.BATCH_SIZE) {
      batches.push(people.slice(i, i + CONFIG.BATCH_SIZE));
    }
    
    console.log(`📦 Processing ${batches.length} batches of up to ${CONFIG.BATCH_SIZE} people each`);
    console.log('');
    
    // Enrich each batch
    for (let batchIndex = 0; batchIndex < batches.length; batchIndex++) {
      const batch = batches[batchIndex];
      console.log(`\n📦 Batch ${batchIndex + 1}/${batches.length} (${batch.length} people)`);
      console.log('='.repeat(50));
      
      for (const person of batch) {
        console.log(`\n🔄 Processing: ${person.fullName}`);
        console.log('─'.repeat(50));
        
        const result = await enrichPerson(person);
        
        if (result.success) {
          results.successful++;
          results.byMethod[result.method]++;
          console.log(`✅ Success: ${person.fullName} (${result.method}) - Employee ID: ${result.employeeId}`);
        } else {
          results.failed++;
          results.byMethod[result.method]++;
          console.log(`❌ Failed: ${person.fullName} (${result.method})`);
          if (result.error) {
            console.log(`   Error: ${result.error}`);
          }
        }
        
        // Add delay to avoid rate limiting
        await new Promise(resolve => setTimeout(resolve, CONFIG.DELAY_BETWEEN_REQUESTS));
      }
      
      // Delay between batches
      if (batchIndex < batches.length - 1) {
        console.log(`\n⏳ Waiting ${CONFIG.DELAY_BETWEEN_REQUESTS}ms before next batch...`);
        await new Promise(resolve => setTimeout(resolve, CONFIG.DELAY_BETWEEN_REQUESTS));
      }
    }
    
    console.log('\n📊 ENRICHMENT RESULTS');
    console.log('=====================');
    console.log(`Total processed: ${results.total}`);
    console.log(`Successful: ${results.successful}`);
    console.log(`Failed: ${results.failed}`);
    console.log(`Success rate: ${Math.round((results.successful / results.total) * 100)}%`);
    console.log('');
    console.log('By method:');
    console.log(`  LinkedIn: ${results.byMethod.linkedin}`);
    console.log(`  Email: ${results.byMethod.email}`);
    console.log(`  None found: ${results.byMethod.none}`);
    console.log(`  Errors: ${results.byMethod.error}`);
    
    if (CONFIG.TEST_MODE) {
      console.log('\n🧪 TEST MODE COMPLETE - Ready for full production run!');
      console.log('Run without --test flag to process all TOP workspace people');
    } else {
      console.log('\n🎉 FULL PRODUCTION ENRICHMENT COMPLETE!');
      console.log(`✅ Enriched ${results.successful} people with comprehensive CoreSignal data`);
    }
    
  } catch (error) {
    console.error('❌ Fatal error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the enrichment
runComprehensiveEnrichment();
