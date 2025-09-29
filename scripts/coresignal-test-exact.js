// Test the exact script format you provided

const CORESIGNAL_API_KEY = 'hzwQmb13cF21if4arzLpx0SRWyoOUyzP';

// Test 1: LinkedIn search (exactly like your example)
async function testLinkedInSearch() {
  console.log('🔍 Testing LinkedIn search (exact format)...');
  
  const url = 'https://api.coresignal.com/cdapi/v2/employee_multi_source/search/es_dsl';
  const data = {
    "query": {
      "bool": {
        "must": [
          {
            "match_phrase": {
              "linkedin_url": "https://www.linkedin.com/in/aaron-adkins-116b29170"
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
    console.log('LinkedIn search result:');
    console.log('Status:', response.status);
    console.log('Total hits:', result.hits?.total);
    console.log('Hits length:', result.hits?.hits?.length);
    
    if (result.hits?.hits?.length > 0) {
      console.log('Employee ID:', result.hits.hits[0]._source.id);
      console.log('Name:', result.hits.hits[0]._source.full_name);
      return result.hits.hits[0]._source.id;
    } else {
      console.log('No results found');
      return null;
    }
  } catch (error) {
    console.error('LinkedIn search error:', error);
    return null;
  }
}

// Test 2: Email search (exactly like your example)
async function testEmailSearch() {
  console.log('🔍 Testing email search (exact format)...');
  
  const url = 'https://api.coresignal.com/cdapi/v2/employee_multi_source/search/es_dsl';
  const data = {
    "query": {
      "bool": {
        "should": [
          {
            "term": {
              "primary_professional_email.exact": "aadkins@steubenfoods.com"
            }
          },
          {
            "nested": {
              "path": "professional_emails_collection",
              "query": {
                "term": {
                  "professional_emails_collection.professional_email.exact": "aadkins@steubenfoods.com"
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
    console.log('Email search result:');
    console.log('Status:', response.status);
    console.log('Total hits:', result.hits?.total);
    console.log('Hits length:', result.hits?.hits?.length);
    
    if (result.hits?.hits?.length > 0) {
      console.log('Employee ID:', result.hits.hits[0]._source.id);
      console.log('Name:', result.hits.hits[0]._source.full_name);
      return result.hits.hits[0]._source.id;
    } else {
      console.log('No results found');
      return null;
    }
  } catch (error) {
    console.error('Email search error:', error);
    return null;
  }
}

// Test 3: Employee collection (exactly like your example)
async function testEmployeeCollection(employeeId) {
  console.log(`🔍 Testing employee collection for ID: ${employeeId}...`);
  
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
    console.log('Employee collection result:');
    console.log('Status:', response.status);
    console.log('Employee ID:', result.id);
    console.log('Name:', result.full_name);
    console.log('LinkedIn URL:', result.linkedin_url);
    console.log('Professional emails:', result.professional_emails_collection?.length || 0);
    console.log('Experience records:', result.experience?.length || 0);
    console.log('Education records:', result.education?.length || 0);
    console.log('Inferred skills:', result.inferred_skills?.length || 0);
    console.log('Activity records:', result.activity?.length || 0);
    console.log('Connections:', result.connections_count);
    console.log('Followers:', result.followers_count);
    console.log('Decision maker:', result.is_decision_maker);
    console.log('Total experience months:', result.total_experience_duration_months);
    
    return result;
  } catch (error) {
    console.error('Employee collection error:', error);
    return null;
  }
}

// Run all tests
async function runTests() {
  try {
    console.log('🚀 Testing CoreSignal API (Exact Format)');
    console.log('=========================================');
    console.log('');
    
    // Test LinkedIn search
    const linkedinEmployeeId = await testLinkedInSearch();
    console.log('');
    
    // Test email search
    const emailEmployeeId = await testEmailSearch();
    console.log('');
    
    // Test employee collection with known ID
    const knownEmployeeId = '505666130'; // Aaron Adkins' ID
    const employeeData = await testEmployeeCollection(knownEmployeeId);
    console.log('');
    
    console.log('📊 TEST SUMMARY');
    console.log('===============');
    console.log('LinkedIn search employee ID:', linkedinEmployeeId);
    console.log('Email search employee ID:', emailEmployeeId);
    console.log('Known employee ID:', knownEmployeeId);
    console.log('Employee data collected:', !!employeeData);
    
    if (employeeData) {
      console.log('');
      console.log('✅ SUCCESS: CoreSignal API is working correctly!');
      console.log('We can now create the enrichment script.');
    } else {
      console.log('');
      console.log('❌ FAILED: CoreSignal API is not working');
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

// Run the tests
runTests();
