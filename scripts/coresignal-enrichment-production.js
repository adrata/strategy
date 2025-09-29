const { PrismaClient } = require('@prisma/client');
require('dotenv').config();

const prisma = new PrismaClient();

// CoreSignal API configuration
const CORESIGNAL_API_KEY = process.env.CORESIGNAL_API_KEY;
const CORESIGNAL_BASE_URL = 'https://api.coresignal.com/cdapi/v2';

const customHeaders = {
  'Authorization': `Bearer ${CORESIGNAL_API_KEY}`,
  'Content-Type': 'application/json'
};

// Configuration
const CONFIG = {
  TOP_WORKSPACE_ID: '01K5D01YCQJ9TJ7CT4DZDE79T1',
  BATCH_SIZE: 50, // Process in batches to avoid overwhelming the API
  DELAY_BETWEEN_BATCHES: 2000, // 2 seconds between batches
  DELAY_BETWEEN_REQUESTS: 500, // 0.5 seconds between individual requests
  MAX_RETRIES: 3,
  TEST_MODE: process.argv.includes('--test'),
  TEST_LIMIT: 100
};

// Statistics tracking
const stats = {
  total: 0,
  processed: 0,
  successful: 0,
  failed: 0,
  skipped: 0,
  startTime: null,
  endTime: null
};

async function searchCoreSignal(queryData, method) {
  const url = `${CORESIGNAL_BASE_URL}/employee_multi_source/search/es_dsl`;
  
  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: customHeaders,
      body: JSON.stringify(queryData)
    });
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    
    const data = await response.json();
    
    // CoreSignal search API returns an array of employee IDs directly
    return Array.isArray(data) ? data : [];
    
  } catch (error) {
    console.error(`❌ Search failed for ${method}:`, error.message);
    return [];
  }
}

async function collectCoreSignalData(employeeId) {
  const url = `${CORESIGNAL_BASE_URL}/employee_multi_source/collect/${employeeId}`;
  
  try {
    const response = await fetch(url, {
      method: 'GET',
      headers: customHeaders
    });
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    
    return await response.json();
    
  } catch (error) {
    console.error(`❌ Collection failed for employee ${employeeId}:`, error.message);
    return null;
  }
}

async function enrichPerson(person) {
  console.log(`\n🔍 Enriching: ${person.fullName} (${person.email})`);
  
  let employeeIds = [];
  let enrichmentMethod = 'none';
  
  // Try LinkedIn search first
  if (person.linkedinUrl && person.linkedinUrl.trim() !== '') {
    console.log(`  🔗 Searching LinkedIn: ${person.linkedinUrl}`);
    
    const linkedinQuery = {
      query: {
        bool: {
          must: [
            {
              term: {
                "linkedin_url.keyword": person.linkedinUrl
              }
            }
          ]
        }
      },
      size: 1
    };
    
    employeeIds = await searchCoreSignal(linkedinQuery, 'linkedin');
    
    if (employeeIds.length > 0) {
      enrichmentMethod = 'linkedin';
      console.log(`  ✅ Found ${employeeIds.length} LinkedIn match(es)`);
    }
  }
  
  // Try email search if LinkedIn didn't work
  if (employeeIds.length === 0 && person.email && person.email.trim() !== '') {
    console.log(`  📧 Searching email: ${person.email}`);
    
    const emailQuery = {
      query: {
        bool: {
          should: [
            {
              term: {
                "primary_professional_email.keyword": person.email
              }
            },
            {
              term: {
                "professional_emails_collection.professional_email.keyword": person.email
              }
            }
          ],
          minimum_should_match: 1
        }
      },
      size: 1
    };
    
    employeeIds = await searchCoreSignal(emailQuery, 'email');
    
    if (employeeIds.length > 0) {
      enrichmentMethod = 'email';
      console.log(`  ✅ Found ${employeeIds.length} email match(es)`);
    }
  }
  
  // Collect data if we found matches
  if (employeeIds.length > 0) {
    const employeeId = employeeIds[0];
    console.log(`  📥 Collecting data for employee ${employeeId}...`);
    
    const coresignalData = await collectCoreSignalData(employeeId);
    
    if (coresignalData) {
      console.log(`  ✅ Collected comprehensive data`);
      
      // Update the person record
      await prisma.people.update({
        where: { id: person.id },
        data: {
          customFields: {
            ...person.customFields,
            coresignal: coresignalData,
            enrichment_method: enrichmentMethod,
            enriched_at: new Date().toISOString()
          },
          enrichmentSources: ['coresignal_complete'],
          lastEnriched: new Date()
        }
      });
      
      console.log(`  💾 Saved comprehensive CoreSignal data`);
      return { success: true, method: enrichmentMethod, employeeId };
    } else {
      console.log(`  ❌ Failed to collect data`);
      return { success: false, method: enrichmentMethod, error: 'Collection failed' };
    }
  } else {
    console.log(`  ❌ No matches found in CoreSignal database`);
    return { success: false, method: 'none', error: 'No matches found' };
  }
}

async function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function processBatch(people, batchNumber) {
  console.log(`\n📦 Processing Batch ${batchNumber} (${people.length} people)`);
  console.log('='.repeat(50));
  
  const batchResults = {
    successful: 0,
    failed: 0,
    skipped: 0
  };
  
  for (let i = 0; i < people.length; i++) {
    const person = people[i];
    stats.processed++;
    
    try {
      const result = await enrichPerson(person);
      
      if (result.success) {
        stats.successful++;
        batchResults.successful++;
        console.log(`  ✅ Success: ${person.fullName} (${result.method})`);
      } else {
        stats.failed++;
        batchResults.failed++;
        console.log(`  ❌ Failed: ${person.fullName} (${result.error})`);
      }
      
      // Delay between requests to avoid rate limiting
      if (i < people.length - 1) {
        await delay(CONFIG.DELAY_BETWEEN_REQUESTS);
      }
      
    } catch (error) {
      stats.failed++;
      batchResults.failed++;
      console.error(`  💥 Error processing ${person.fullName}:`, error.message);
    }
  }
  
  console.log(`\n📊 Batch ${batchNumber} Results:`);
  console.log(`  ✅ Successful: ${batchResults.successful}`);
  console.log(`  ❌ Failed: ${batchResults.failed}`);
  console.log(`  📈 Success Rate: ${Math.round((batchResults.successful / people.length) * 100)}%`);
  
  return batchResults;
}

async function getEnrichmentCandidates() {
  console.log('🔍 Finding enrichment candidates...');
  
  // Get people in TOP workspace who can be enriched
  const candidates = await prisma.people.findMany({
    where: {
      workspaceId: CONFIG.TOP_WORKSPACE_ID,
      OR: [
        {
          AND: [
            { linkedinUrl: { not: null } },
            { linkedinUrl: { not: '' } }
          ]
        },
        {
          AND: [
            { email: { not: null } },
            { email: { not: '' } }
          ]
        }
      ],
      NOT: {
        enrichmentSources: { hasSome: ['coresignal_complete'] }
      }
    },
    select: {
      id: true,
      fullName: true,
      email: true,
      linkedinUrl: true,
      customFields: true,
      enrichmentSources: true
    },
    orderBy: [
      { linkedinUrl: { sort: 'desc', nulls: 'last' } }, // LinkedIn first
      { email: { sort: 'desc', nulls: 'last' } }
    ]
  });
  
  console.log(`📊 Found ${candidates.length} enrichment candidates`);
  
  // Apply test limit if in test mode
  if (CONFIG.TEST_MODE) {
    const limitedCandidates = candidates.slice(0, CONFIG.TEST_LIMIT);
    console.log(`🧪 Test mode: Processing first ${limitedCandidates.length} candidates`);
    return limitedCandidates;
  }
  
  return candidates;
}

async function main() {
  try {
    console.log('🚀 CORESIGNAL ENRICHMENT PRODUCTION SCRIPT');
    console.log('==========================================');
    console.log(`Mode: ${CONFIG.TEST_MODE ? 'TEST (100 people)' : 'FULL PRODUCTION'}`);
    console.log(`TOP Workspace: ${CONFIG.TOP_WORKSPACE_ID}`);
    console.log(`Batch Size: ${CONFIG.BATCH_SIZE}`);
    console.log(`Delay Between Batches: ${CONFIG.DELAY_BETWEEN_BATCHES}ms`);
    console.log(`Delay Between Requests: ${CONFIG.DELAY_BETWEEN_REQUESTS}ms`);
    console.log('');
    
    // Verify API key
    if (!CORESIGNAL_API_KEY) {
      throw new Error('CORESIGNAL_API_KEY environment variable is required');
    }
    
    stats.startTime = new Date();
    
    // Get enrichment candidates
    const candidates = await getEnrichmentCandidates();
    stats.total = candidates.length;
    
    if (candidates.length === 0) {
      console.log('✅ No candidates found for enrichment');
      return;
    }
    
    console.log(`\n🎯 Starting enrichment of ${candidates.length} people...`);
    console.log('='.repeat(60));
    
    // Process in batches
    const batches = [];
    for (let i = 0; i < candidates.length; i += CONFIG.BATCH_SIZE) {
      batches.push(candidates.slice(i, i + CONFIG.BATCH_SIZE));
    }
    
    console.log(`📦 Processing ${batches.length} batches of up to ${CONFIG.BATCH_SIZE} people each`);
    
    for (let i = 0; i < batches.length; i++) {
      const batch = batches[i];
      const batchNumber = i + 1;
      
      await processBatch(batch, batchNumber);
      
      // Delay between batches (except for the last one)
      if (i < batches.length - 1) {
        console.log(`\n⏳ Waiting ${CONFIG.DELAY_BETWEEN_BATCHES}ms before next batch...`);
        await delay(CONFIG.DELAY_BETWEEN_BATCHES);
      }
    }
    
    stats.endTime = new Date();
    const duration = Math.round((stats.endTime - stats.startTime) / 1000);
    
    // Final statistics
    console.log('\n🎯 ENRICHMENT COMPLETE!');
    console.log('=======================');
    console.log(`Total candidates: ${stats.total}`);
    console.log(`Processed: ${stats.processed}`);
    console.log(`Successful: ${stats.successful}`);
    console.log(`Failed: ${stats.failed}`);
    console.log(`Success rate: ${Math.round((stats.successful / stats.processed) * 100)}%`);
    console.log(`Duration: ${duration} seconds`);
    console.log(`Average time per person: ${Math.round(duration / stats.processed)} seconds`);
    
    if (CONFIG.TEST_MODE) {
      console.log('\n🧪 TEST MODE COMPLETE - Ready for full production run!');
      console.log('Run without --test flag to process all TOP workspace people');
    } else {
      console.log('\n🎉 FULL PRODUCTION ENRICHMENT COMPLETE!');
      console.log(`✅ Enriched ${stats.successful} people with comprehensive CoreSignal data`);
    }
    
  } catch (error) {
    console.error('💥 Fatal error:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

// Handle graceful shutdown
process.on('SIGINT', async () => {
  console.log('\n⏹️  Graceful shutdown requested...');
  console.log(`📊 Progress: ${stats.processed}/${stats.total} processed`);
  console.log(`✅ Successful: ${stats.successful}`);
  console.log(`❌ Failed: ${stats.failed}`);
  await prisma.$disconnect();
  process.exit(0);
});

// Run the script
main();
