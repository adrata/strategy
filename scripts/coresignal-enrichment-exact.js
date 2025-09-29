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
    
    const result = await response.json();
    return result;
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
    
    const result = await response.json();
    return result;
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
    
    const result = await response.json();
    return result;
  } catch (error) {
    console.error('Employee collection error:', error);
    throw error;
  }
}

// Store the complete CoreSignal data
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

// Main enrichment function
async function runEnrichment() {
  try {
    console.log('🚀 Starting CoreSignal Enrichment (Exact API Format)');
    console.log('====================================================');
    
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
    
    // Get people to enrich - start with 5 for testing
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
      take: 5
    });
    
    console.log(`📋 Found ${people.length} people to enrich`);
    console.log('');
    
    const results = {
      total: people.length,
      successful: 0,
      failed: 0,
      byMethod: { linkedin: 0, email: 0, none: 0, error: 0 }
    };
    
    // Process each person
    for (const person of people) {
      console.log(`\n🔄 Processing: ${person.fullName}`);
      console.log('─'.repeat(50));
      
      let coresignalData = null;
      let method = '';
      
      try {
        // Try LinkedIn first if available
        if (person.linkedinUrl) {
          console.log(`📎 Searching by LinkedIn: ${person.linkedinUrl}`);
          const searchResult = await searchByLinkedIn(person.linkedinUrl);
          
          if (searchResult.hits && searchResult.hits.total > 0) {
            const employeeId = searchResult.hits.hits[0]._source.id;
            console.log(`✅ Found by LinkedIn, employee ID: ${employeeId}`);
            
            coresignalData = await collectEmployeeData(employeeId);
            method = 'linkedin';
          }
        }
        
        // Try email if LinkedIn didn't work
        if (!coresignalData && person.email) {
          console.log(`📧 Searching by email: ${person.email}`);
          const searchResult = await searchByEmail(person.email);
          
          if (searchResult.hits && searchResult.hits.total > 0) {
            const employeeId = searchResult.hits.hits[0]._source.id;
            console.log(`✅ Found by email, employee ID: ${employeeId}`);
            
            coresignalData = await collectEmployeeData(employeeId);
            method = 'email';
          }
        }
        
        if (coresignalData) {
          console.log(`📊 Storing complete CoreSignal data (method: ${method})`);
          await storeCompleteCoreSignalData(person.id, coresignalData, method);
          
          results.successful++;
          results.byMethod[method]++;
          console.log(`✅ Success: ${person.fullName} (${method})`);
        } else {
          results.failed++;
          results.byMethod.none++;
          console.log(`❌ No CoreSignal data found for ${person.fullName}`);
        }
        
      } catch (error) {
        results.failed++;
        results.byMethod.error++;
        console.log(`❌ Error enriching ${person.fullName}: ${error.message}`);
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
runEnrichment();
