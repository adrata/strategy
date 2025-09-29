const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// CoreSignal API configuration
const CORESIGNAL_API_KEY = 'hzwQmb13cF21if4arzLpx0SRWyoOUyzP';

// Search by LinkedIn URL (exactly like your example)
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
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error('LinkedIn search error:', error);
    throw error;
  }
}

// Search by email (exactly like your example)
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
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error('Email search error:', error);
    throw error;
  }
}

// Collect full employee data (exactly like your example)
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
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error('Employee collection error:', error);
    throw error;
  }
}

// Store comprehensive CoreSignal data
async function storeComprehensiveData(personId, coresignalData, enrichmentMethod) {
  try {
    console.log(`📊 Storing comprehensive data (method: ${enrichmentMethod})`);
    
    // Store ALL the data we get from CoreSignal
    const enrichedData = {
      // Store the entire CoreSignal response
      ...coresignalData,
      
      // Add our metadata
      enriched_at: new Date().toISOString(),
      enrichment_method: enrichmentMethod,
      enrichment_source: 'coresignal_comprehensive'
    };

    // Update the person record
    await prisma.people.update({
      where: { id: personId },
      data: {
        customFields: {
          // Keep existing custom fields
          ...enrichedData,
          // Store the full CoreSignal data
          coresignal: coresignalData
        },
        enrichmentSources: {
          push: 'coresignal_comprehensive'
        },
        lastEnriched: new Date(),
        updatedAt: new Date()
      }
    });

    console.log(`✅ Successfully stored comprehensive data for person ${personId}`);
    return true;

  } catch (error) {
    console.error(`❌ Error storing data for person ${personId}:`, error);
    throw error;
  }
}

// Enrich a single person
async function enrichPerson(person) {
  try {
    console.log(`🔍 Enriching ${person.fullName}`);
    
    let coresignalData = null;
    let enrichmentMethod = '';

    // Try LinkedIn first if available
    if (person.linkedinUrl) {
      try {
        console.log(`📎 Searching by LinkedIn: ${person.linkedinUrl}`);
        const searchResult = await searchByLinkedIn(person.linkedinUrl);
        
        if (searchResult.hits && searchResult.hits.total > 0) {
          const employeeId = searchResult.hits.hits[0]._source.id;
          console.log(`✅ Found by LinkedIn, employee ID: ${employeeId}`);
          
          coresignalData = await collectEmployeeData(employeeId);
          enrichmentMethod = 'linkedin';
        }
      } catch (error) {
        console.log(`⚠️ LinkedIn search failed: ${error.message}`);
      }
    }

    // Try email if LinkedIn didn't work
    if (!coresignalData && person.email) {
      try {
        console.log(`📧 Searching by email: ${person.email}`);
        const searchResult = await searchByEmail(person.email);
        
        if (searchResult.hits && searchResult.hits.total > 0) {
          const employeeId = searchResult.hits.hits[0]._source.id;
          console.log(`✅ Found by email, employee ID: ${employeeId}`);
          
          coresignalData = await collectEmployeeData(employeeId);
          enrichmentMethod = 'email';
        }
      } catch (error) {
        console.log(`⚠️ Email search failed: ${error.message}`);
      }
    }

    if (coresignalData) {
      console.log(`📊 Storing comprehensive data (method: ${enrichmentMethod})`);
      await storeComprehensiveData(person.id, coresignalData, enrichmentMethod);
      return { success: true, method: enrichmentMethod };
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
    console.log('🚀 Starting Comprehensive CoreSignal Enrichment');
    console.log('================================================');
    
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
    
    // Get people to enrich - start with a small batch for testing
    const people = await prisma.people.findMany({
      where: {
        workspaceId: workspace.id,
        OR: [
          { email: { not: null } },
          { linkedinUrl: { not: null } }
        ]
      },
      select: {
        id: true,
        fullName: true,
        email: true,
        linkedinUrl: true
      },
      take: 10 // Start with 10 people for testing
    });
    
    console.log(`📋 Found ${people.length} people to enrich`);
    console.log('');
    
    const results = {
      total: people.length,
      successful: 0,
      failed: 0,
      byMethod: {
        linkedin: 0,
        email: 0,
        none: 0,
        error: 0
      }
    };
    
    // Enrich each person
    for (const person of people) {
      console.log(`\n🔄 Processing: ${person.fullName}`);
      console.log('─'.repeat(50));
      
      const result = await enrichPerson(person);
      
      if (result.success) {
        results.successful++;
        results.byMethod[result.method]++;
        console.log(`✅ Success: ${person.fullName} (${result.method})`);
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
    
  } catch (error) {
    console.error('❌ Fatal error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the enrichment
runComprehensiveEnrichment();
