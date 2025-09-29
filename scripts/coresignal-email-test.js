const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// CoreSignal API configuration
const CORESIGNAL_API_KEY = 'hzwQmb13cF21if4arzLpx0SRWyoOUyzP';

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

// Enrich a single person (email only version)
async function enrichPerson(person) {
  try {
    console.log(`🔍 Enriching ${person.fullName}`);
    
    let employeeIds = [];
    let method = '';

    // Try email only (since these people have no LinkedIn)
    if (person.email) {
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
    console.log('🧪 TESTING EMAIL ENRICHMENT (20 PEOPLE)');
    console.log('========================================');
    
    // Get TOP workspace
    const workspace = await prisma.workspaces.findFirst({
      where: { name: { contains: 'TOP' } },
      select: { id: true, name: true }
    });
    
    if (!workspace) {
      console.log('❌ No TOP workspace found');
      return;
    }
    
    console.log(`📊 Workspace: ${workspace.name}`);
    
    // Get people to enrich - email only, no LinkedIn, not already enriched
    const people = await prisma.people.findMany({
      where: {
        workspaceId: workspace.id,
        email: { not: null },
        email: { not: '' },
        OR: [
          { linkedinUrl: null },
          { linkedinUrl: '' }
        ],
        NOT: {
          enrichmentSources: { hasSome: ['coresignal_complete'] }
        }
      },
      select: {
        id: true,
        fullName: true,
        email: true,
        linkedinUrl: true
      },
      take: 20,
      orderBy: { fullName: 'asc' }
    });
    
    console.log(`📋 Found ${people.length} people with email only (no LinkedIn)`);
    console.log('');
    
    const results = {
      total: people.length,
      successful: 0,
      failed: 0,
      byMethod: { email: 0, none: 0, error: 0 }
    };
    
    // Enrich each person
    for (const person of people) {
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
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
    
    console.log('\n📊 EMAIL ENRICHMENT TEST RESULTS');
    console.log('=================================');
    console.log(`Total processed: ${results.total}`);
    console.log(`Successful: ${results.successful}`);
    console.log(`Failed: ${results.failed}`);
    console.log(`Success rate: ${Math.round((results.successful / results.total) * 100)}%`);
    console.log('');
    console.log('By method:');
    console.log(`  Email: ${results.byMethod.email}`);
    console.log(`  None found: ${results.byMethod.none}`);
    console.log(`  Errors: ${results.byMethod.error}`);
    
    console.log('\n🎯 EMAIL ENRICHMENT TEST COMPLETE!');
    console.log('This test validates the email search functionality.');
    console.log('If successful, we can proceed with full production enrichment.');
    
  } catch (error) {
    console.error('❌ Fatal error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the enrichment
runComprehensiveEnrichment();
