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

// Search by email (exactly like your example with minimum_should_match)
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

// Test with the exact examples you provided
async function testWithYourExamples() {
  try {
    console.log('🚀 Testing CoreSignal API with Your Exact Examples');
    console.log('==================================================');
    
    // Test 1: Alena Brandenberger LinkedIn
    console.log('\n🔍 Test 1: Alena Brandenberger LinkedIn');
    console.log('LinkedIn URL: https://www.linkedin.com/in/alena-chavychalova-0701a6164');
    
    const linkedinResult = await searchByLinkedIn('https://www.linkedin.com/in/alena-chavychalova-0701a6164');
    console.log('LinkedIn search result:');
    console.log('Total hits:', linkedinResult.hits?.total);
    console.log('Hits length:', linkedinResult.hits?.hits?.length);
    
    if (linkedinResult.hits?.hits?.length > 0) {
      const employeeId = linkedinResult.hits.hits[0]._source.id;
      console.log('Employee ID:', employeeId);
      console.log('Name:', linkedinResult.hits.hits[0]._source.full_name);
      
      // Collect employee data
      console.log('\n📊 Collecting employee data...');
      const employeeData = await collectEmployeeData(employeeId);
      console.log('Employee data collected:');
      console.log('Name:', employeeData.full_name);
      console.log('Professional emails:', employeeData.professional_emails_collection?.length || 0);
      console.log('Experience records:', employeeData.experience?.length || 0);
      console.log('Inferred skills:', employeeData.inferred_skills?.length || 0);
    } else {
      console.log('❌ No results found for LinkedIn search');
    }
    
    // Test 2: Justin Bedard Email
    console.log('\n🔍 Test 2: Justin Bedard Email');
    console.log('Email: jbedard@columbiacc.com');
    
    const emailResult = await searchByEmail('jbedard@columbiacc.com');
    console.log('Email search result:');
    console.log('Total hits:', emailResult.hits?.total);
    console.log('Hits length:', emailResult.hits?.hits?.length);
    
    if (emailResult.hits?.hits?.length > 0) {
      const employeeId = emailResult.hits.hits[0]._source.id;
      console.log('Employee ID:', employeeId);
      console.log('Name:', emailResult.hits.hits[0]._source.full_name);
      
      // Collect employee data
      console.log('\n📊 Collecting employee data...');
      const employeeData = await collectEmployeeData(employeeId);
      console.log('Employee data collected:');
      console.log('Name:', employeeData.full_name);
      console.log('Professional emails:', employeeData.professional_emails_collection?.length || 0);
      console.log('Experience records:', employeeData.experience?.length || 0);
      console.log('Inferred skills:', employeeData.inferred_skills?.length || 0);
    } else {
      console.log('❌ No results found for email search');
    }
    
    console.log('\n✅ Testing complete!');
    
  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

// Run the test
testWithYourExamples();
