/**
 * Test script to show real employee ID data for a small company
 */

const fetch = globalThis.fetch || require('node-fetch');

const CORESIGNAL_API_KEY = process.env.CORESIGNAL_API_KEY;
const CORESIGNAL_BASE_URL = 'https://api.coresignal.com';

async function testSmallCompanyEmployeeIds() {
  try {
    console.log('🔍 Testing employee ID search for small company...');
    
    // Step 1: Find a small company (using Mux - video infrastructure)
    const companyWebsite = 'mux.com';
    console.log('\n📍 Looking up company:', companyWebsite);
    
    const companyResponse = await fetch(
      `${CORESIGNAL_BASE_URL}/cdapi/v2/company_multi_source/enrich?website=${companyWebsite}`,
      {
        method: 'GET',
        headers: {
          'apikey': CORESIGNAL_API_KEY,
          'Accept': 'application/json'
        }
      }
    );
    
    if (!companyResponse.ok) {
      console.log(`❌ Company lookup failed: ${companyResponse.status}`);
      return;
    }
    
    const companyData = await companyResponse.json();
    console.log(`✅ Found company: ${companyData.company_name} (ID: ${companyData.id})`);
    console.log(`   Employee count: ${companyData.employees_count || 'Unknown'}`);
    console.log(`   Industry: ${companyData.industry || 'Unknown'}`);
    console.log(`   Location: ${companyData.hq_country || 'Unknown'}`);
    
    // Step 2: Search for current employees
    console.log('\n👥 Searching for current employees...');
    
    const employeeSearchQuery = {
      "query": {
        "bool": {
          "must": [
            {
              "term": {
                "is_working": 1
              }
            },
            {
              "term": {
                "active_experience_company_id": companyData.id
              }
            }
          ]
        }
      },
      "size": 15,  // Get first 15 employees for demo
      "from": 0
    };
    
    const searchResponse = await fetch(
      `${CORESIGNAL_BASE_URL}/cdapi/v2/employee_multi_source/search/es_dsl?items_per_page=15`,
      {
        method: 'POST',
        headers: {
          'apikey': CORESIGNAL_API_KEY,
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify(employeeSearchQuery)
      }
    );
    
    if (!searchResponse.ok) {
      console.log(`❌ Employee search failed: ${searchResponse.status}`);
      const errorText = await searchResponse.text();
      console.log('Error details:', errorText.substring(0, 200));
      return;
    }
    
    const searchResults = await searchResponse.json();
    console.log(`📊 Search completed - found ${searchResults.hits.total.value} total employees`);
    
    // Step 3: Extract and display employee IDs with basic info
    console.log('\n📋 EMPLOYEE IDs + BASIC INFO:');
    console.log('='.repeat(80));
    
    if (searchResults.hits && searchResults.hits.hits) {
      searchResults.hits.hits.forEach((hit, index) => {
        const emp = hit._source;
        console.log(`${index + 1}. ID: ${hit._id}`);
        console.log(`   Name: ${emp.full_name || 'N/A'}`);
        console.log(`   Title: ${emp.active_experience_title || 'N/A'}`);
        console.log(`   Department: ${emp.active_experience_department || 'N/A'}`);
        console.log(`   Email: ${emp.primary_professional_email || 'Not available'}`);
        console.log(`   LinkedIn: ${emp.professional_network_url ? 'Available' : 'Not available'}`);
        console.log(`   Location: ${emp.location_full || 'N/A'}`);
        console.log(`   Decision Maker: ${emp.is_decision_maker === 1 ? 'Yes' : 'No'}`);
        console.log(`   Connections: ${emp.connections_count || 'N/A'}`);
        console.log(`   Management Level: ${emp.active_experience_management_level || 'N/A'}`);
        console.log('   ---');
      });
      
      // Show summary of decision makers
      const decisionMakers = searchResults.hits.hits.filter(hit => hit._source.is_decision_maker === 1);
      console.log(`\n🎯 DECISION MAKERS FOUND: ${decisionMakers.length}/${searchResults.hits.hits.length}`);
      decisionMakers.forEach((hit, index) => {
        const emp = hit._source;
        console.log(`   ${index + 1}. ${emp.full_name} - ${emp.active_experience_title}`);
      });
    }
    
    // Step 4: Show cost breakdown
    console.log('\n💰 COST BREAKDOWN:');
    console.log('='.repeat(40));
    console.log(`   Search cost: 2 CoreSignal credits`);
    console.log(`   Found: ${searchResults.hits.hits.length} employees (showing first 15)`);
    console.log(`   Total employees at company: ${searchResults.hits.total.value}`);
    console.log(`   To collect ALL full profiles: ${searchResults.hits.total.value * 2} additional credits`);
    console.log(`   TOTAL for complete enrichment: ${2 + (searchResults.hits.total.value * 2)} credits`);
    
    // CoreSignal plan recommendations
    const totalCredits = 2 + (searchResults.hits.total.value * 2);
    console.log('\n📊 CORESIGNAL PLAN RECOMMENDATIONS:');
    if (totalCredits <= 250) {
      console.log('   ✅ Starter Plan ($49/month) - 250 collect credits - SUFFICIENT');
    } else if (totalCredits <= 1000) {
      console.log('   ✅ Professional Plan ($149/month) - 1,000 collect credits - RECOMMENDED');
    } else {
      console.log('   ⚠️  Business Plan ($449/month) - 5,000 collect credits - REQUIRED');
    }
    
    return {
      company: companyData.company_name,
      totalEmployees: searchResults.hits.total.value,
      sampleEmployees: searchResults.hits.hits.length,
      decisionMakers: searchResults.hits.hits.filter(hit => hit._source.is_decision_maker === 1).length,
      totalCost: totalCredits
    };
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

// Run the test
testSmallCompanyEmployeeIds().then(result => {
  if (result) {
    console.log('\n🎉 TEST COMPLETED SUCCESSFULLY');
    console.log(`Company: ${result.company}`);
    console.log(`Total Employees: ${result.totalEmployees}`);
    console.log(`Decision Makers: ${result.decisionMakers}`);
    console.log(`Total Cost: ${result.totalCost} CoreSignal credits`);
  }
}).catch(console.error);
