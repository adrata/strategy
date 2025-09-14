#!/usr/bin/env node

/**
 * 🎯 COMPLETE SYSTEM TEST
 * 
 * Tests the complete intelligence system with real API calls
 * Validates LinkedIn-first approach and contact guarantee
 */

const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));

// Load and clean environment variables
require('dotenv').config({ path: '.env.local' });

// Clean API keys (remove newlines and trim)
const LUSHA_API_KEY = process.env.LUSHA_API_KEY?.replace(/\\n/g, '').trim();
const CORESIGNAL_API_KEY = process.env.CORESIGNAL_API_KEY?.replace(/\\n/g, '').trim();
const PROSPEO_API_KEY = process.env.PROSPEO_API_KEY?.replace(/\\n/g, '').trim();

const INTELLIGENCE_API_URL = 'http://localhost:3000/api/intelligence';

async function testCompleteSystem() {
  console.log('🎯 COMPLETE INTELLIGENCE SYSTEM TEST');
  console.log('=' .repeat(60));
  console.log('Testing complete system with real executives');
  console.log('');

  console.log('🔑 API Keys Status:');
  console.log(`   Lusha: ${LUSHA_API_KEY ? `✅ Available (${LUSHA_API_KEY.length} chars)` : '❌ Missing'}`);
  console.log(`   CoreSignal: ${CORESIGNAL_API_KEY ? `✅ Available (${CORESIGNAL_API_KEY.length} chars)` : '❌ Missing'}`);
  console.log(`   Prospeo: ${PROSPEO_API_KEY ? `✅ Available (${PROSPEO_API_KEY.length} chars)` : '❌ Missing'}`);
  console.log('');

  // Test 1: Individual API calls
  console.log('🧪 TEST 1: Individual API Validation');
  console.log('─'.repeat(50));
  await testIndividualAPIs();
  
  console.log('');
  
  // Test 2: Complete Intelligence System
  console.log('🧠 TEST 2: Complete Intelligence System');
  console.log('─'.repeat(50));
  await testIntelligenceSystem();
  
  console.log('');
  
  // Test 3: Contact Guarantee Test
  console.log('🛡️ TEST 3: Contact Guarantee Validation');
  console.log('─'.repeat(50));
  await testContactGuarantee();
}

async function testIndividualAPIs() {
  // Test CoreSignal with working pattern
  console.log('🏢 CoreSignal API Test:');
  try {
    const response = await fetch('https://api.coresignal.com/cdapi/v1/employee/search/filter', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${CORESIGNAL_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        full_name: "Kenneth Cornick",
        company_name: "First American Financial Corporation",
        limit: 5
      }),
      timeout: 15000
    });

    console.log(`   📊 Status: ${response.status}`);
    
    if (response.ok) {
      const data = await response.json();
      console.log(`   ✅ SUCCESS! Found ${data.employees?.length || 0} employees`);
      
      if (data.employees && data.employees.length > 0) {
        const employee = data.employees[0];
        console.log(`   👤 Name: ${employee.full_name}`);
        console.log(`   📧 Email: ${employee.primary_professional_email || 'Not found'}`);
        console.log(`   📊 Email Status: ${employee.primary_professional_email_status || 'N/A'}`);
      }
    } else {
      const errorText = await response.text();
      console.log(`   ❌ Error: ${errorText}`);
    }
  } catch (error) {
    console.log(`   ❌ Exception: ${error.message}`);
  }
  
  console.log('');
  
  // Test Lusha with working pattern
  console.log('📞 Lusha API Test:');
  try {
    const params = new URLSearchParams({
      firstName: 'Kenneth',
      lastName: 'Cornick',
      companyName: 'First American Financial Corporation',
      companyDomain: 'firstam.com',
      refreshJobInfo: 'true',
      revealEmails: 'true',
      revealPhones: 'true'
    });
    
    const response = await fetch(`https://api.lusha.com/v2/person?${params}`, {
      method: 'GET',
      headers: {
        'api_key': LUSHA_API_KEY,
        'Content-Type': 'application/json'
      },
      timeout: 10000
    });

    console.log(`   📊 Status: ${response.status}`);
    
    if (response.ok) {
      const data = await response.json();
      console.log(`   ✅ SUCCESS! Person data retrieved`);
      console.log(`   👤 Name: ${data.fullName || 'Not provided'}`);
      console.log(`   📧 Emails: ${data.emailAddresses?.length || 0}`);
      console.log(`   📞 Phones: ${data.phoneNumbers?.length || 0}`);
      console.log(`   💼 LinkedIn: ${data.linkedinUrl ? 'Found' : 'Not found'}`);
      
      if (data.emailAddresses?.length > 0) {
        console.log(`   📧 Primary Email: ${data.emailAddresses[0].email}`);
      }
      
      if (data.phoneNumbers?.length > 0) {
        console.log(`   📞 Primary Phone: ${data.phoneNumbers[0].number}`);
      }
    } else {
      const errorText = await response.text();
      console.log(`   ❌ Error: ${errorText}`);
    }
  } catch (error) {
    console.log(`   ❌ Exception: ${error.message}`);
  }
}

async function testIntelligenceSystem() {
  try {
    const testAccount = {
      name: "First American Financial Corporation",
      website: "firstam.com",
      industry: "Financial Services",
      dealSize: 100000
    };
    
    console.log(`🧠 Testing intelligence system with: ${testAccount.name}`);
    
    const response = await fetch(`${INTELLIGENCE_API_URL}/research`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-user-id': 'test-user',
        'x-workspace-id': 'test-workspace'
      },
      body: JSON.stringify({
        workspaceId: 'test-workspace',
        userId: 'test-user',
        accounts: [testAccount],
        researchDepth: 'comprehensive',
        targetRoles: ['CEO', 'CFO', 'COO', 'President']
      })
    });

    console.log(`   📊 Response Status: ${response.status}`);
    
    if (response.ok) {
      const result = await response.json();
      
      console.log(`   ✅ Intelligence System Success!`);
      console.log(`   👥 Executives Found: ${result.executives?.length || 0}`);
      console.log(`   📝 Contacts Added: ${result.contactsAdded || 0}`);
      console.log(`   🎯 Leads Added: ${result.leadsAdded || 0}`);
      console.log(`   💰 Total Cost: $${result.totalCost?.toFixed(2) || '0.00'}`);
      console.log(`   📊 Confidence: ${result.confidence || 0}%`);
      
      if (result.executives && result.executives.length > 0) {
        console.log(`\n   👥 Executive Details:`);
        result.executives.slice(0, 3).forEach((exec, index) => {
          console.log(`   ${index + 1}. ${exec.name} (${exec.role})`);
          console.log(`      📧 Email: ${exec.email || 'Not found'}`);
          console.log(`      📞 Phone: ${exec.phone || 'Not found'}`);
          console.log(`      💼 LinkedIn: ${exec.linkedin || 'Not found'}`);
          console.log(`      📊 Confidence: ${exec.confidence}%`);
        });
      }
      
      if (result.buyerGroupAnalysis) {
        console.log(`\n   🎯 Buyer Group Analysis:`);
        const bg = result.buyerGroupAnalysis;
        if (bg.decisionMaker) {
          console.log(`   Decision Maker: ${bg.decisionMaker.name} (${bg.decisionMaker.role})`);
        }
        if (bg.champions && bg.champions.length > 0) {
          console.log(`   Champions: ${bg.champions.map(c => c.name).join(', ')}`);
        }
      }
      
    } else {
      const errorText = await response.text();
      console.log(`   ❌ Intelligence System Error: ${errorText}`);
    }
    
  } catch (error) {
    console.log(`   ❌ Intelligence System Exception: ${error.message}`);
  }
}

async function testContactGuarantee() {
  const testExecutives = [
    { name: "Kenneth Cornick", company: "First American Financial Corporation", role: "CEO" },
    { name: "Chris Leavy", company: "First American Financial Corporation", role: "CFO" },
    { name: "Peter Sadowski", company: "First American Financial Corporation", role: "COO" }
  ];
  
  let totalTested = 0;
  let totalWithEmail = 0;
  let totalWithPhone = 0;
  let totalWithLinkedIn = 0;
  let totalComplete = 0;
  
  for (const executive of testExecutives) {
    console.log(`👤 Testing: ${executive.name} (${executive.role})`);
    
    let hasEmail = false;
    let hasPhone = false;
    let hasLinkedIn = false;
    
    // Test Lusha
    try {
      const params = new URLSearchParams({
        firstName: executive.name.split(' ')[0],
        lastName: executive.name.split(' ').slice(1).join(' '),
        companyName: executive.company,
        companyDomain: 'firstam.com',
        refreshJobInfo: 'true',
        revealEmails: 'true',
        revealPhones: 'true'
      });
      
      const lushaResponse = await fetch(`https://api.lusha.com/v2/person?${params}`, {
        method: 'GET',
        headers: {
          'api_key': LUSHA_API_KEY,
          'Content-Type': 'application/json'
        },
        timeout: 10000
      });

      if (lushaResponse.ok) {
        const data = await lushaResponse.json();
        hasEmail = !!(data.emailAddresses?.length > 0);
        hasPhone = !!(data.phoneNumbers?.length > 0);
        hasLinkedIn = !!data.linkedinUrl;
      }
    } catch (error) {
      console.log(`   ⚠️ Lusha test failed: ${error.message}`);
    }
    
    // Test CoreSignal
    try {
      const coresignalResponse = await fetch('https://api.coresignal.com/cdapi/v1/employee/search/filter', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${CORESIGNAL_API_KEY}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          full_name: executive.name,
          company_name: executive.company,
          limit: 5
        }),
        timeout: 15000
      });

      if (coresignalResponse.ok) {
        const data = await coresignalResponse.json();
        if (data.employees && data.employees.length > 0) {
          const employee = data.employees[0];
          if (!hasEmail && employee.primary_professional_email) {
            hasEmail = true;
          }
        }
      }
    } catch (error) {
      console.log(`   ⚠️ CoreSignal test failed: ${error.message}`);
    }
    
    totalTested++;
    if (hasEmail) totalWithEmail++;
    if (hasPhone) totalWithPhone++;
    if (hasLinkedIn) totalWithLinkedIn++;
    if (hasEmail && hasPhone && hasLinkedIn) totalComplete++;
    
    console.log(`   📧 Email: ${hasEmail ? '✅' : '❌'}`);
    console.log(`   📞 Phone: ${hasPhone ? '✅' : '❌'}`);
    console.log(`   💼 LinkedIn: ${hasLinkedIn ? '✅' : '❌'}`);
    console.log(`   🎯 Complete: ${hasEmail && hasPhone && hasLinkedIn ? '✅' : '❌'}`);
    console.log('');
    
    // Small delay between tests
    await new Promise(resolve => setTimeout(resolve, 2000));
  }
  
  console.log('📊 CONTACT GUARANTEE RESULTS:');
  console.log(`   Total Tested: ${totalTested}`);
  console.log(`   📧 Email Rate: ${Math.round(totalWithEmail/totalTested*100)}% (${totalWithEmail}/${totalTested})`);
  console.log(`   📞 Phone Rate: ${Math.round(totalWithPhone/totalTested*100)}% (${totalWithPhone}/${totalTested})`);
  console.log(`   💼 LinkedIn Rate: ${Math.round(totalWithLinkedIn/totalTested*100)}% (${totalWithLinkedIn}/${totalTested})`);
  console.log(`   🎯 Complete Rate: ${Math.round(totalComplete/totalTested*100)}% (${totalComplete}/${totalTested})`);
  
  const guaranteeRate = totalComplete / totalTested;
  if (guaranteeRate >= 0.8) {
    console.log('   ✅ SYSTEM READY: 80%+ guarantee rate achieved!');
  } else if (guaranteeRate >= 0.6) {
    console.log('   ⚠️ SYSTEM PARTIAL: 60-80% guarantee rate - needs improvement');
  } else {
    console.log('   ❌ SYSTEM NOT READY: <60% guarantee rate - requires fixes');
  }
}

// Run the test
if (require.main === module) {
  testCompleteSystem().catch(console.error);
}

module.exports = { testCompleteSystem };
