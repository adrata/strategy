#!/usr/bin/env node

/**
 * 🧪 REAL API CALLS TEST
 * 
 * Tests the actual API calls with real executives to validate our implementation
 * Uses the exact same patterns as the working pipeline
 */

const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));

// Load environment variables
require('dotenv').config();

const TEST_EXECUTIVE = {
  name: "John Smith",
  title: "Chief Financial Officer",
  company: "First American Title", 
  website: "firstam.com"
};

async function testRealAPICalls() {
  console.log('🧪 REAL API CALLS TEST');
  console.log('=' .repeat(60));
  console.log('Testing actual API calls with real executive data');
  console.log('');
  
  console.log(`👤 Test Executive: ${TEST_EXECUTIVE.name}`);
  console.log(`🏢 Company: ${TEST_EXECUTIVE.company}`);
  console.log(`🌐 Website: ${TEST_EXECUTIVE.website}`);
  console.log('');
  
  // Check API keys
  console.log('🔑 API Keys Status:');
  console.log(`   CoreSignal: ${process.env.CORESIGNAL_API_KEY ? '✅ Available' : '❌ Missing'}`);
  console.log(`   Lusha: ${process.env.LUSHA_API_KEY ? '✅ Available' : '❌ Missing'}`);
  console.log(`   Prospeo: ${process.env.PROSPEO_API_KEY ? '✅ Available' : '❌ Missing'}`);
  console.log('');

  // Test 1: Lusha API with exact proven pattern
  console.log('📞 TEST 1: Lusha API (Exact Proven Pattern)');
  console.log('─'.repeat(50));
  await testLushaAPI();
  
  console.log('');
  
  // Test 2: CoreSignal API with exact proven pattern  
  console.log('🏢 TEST 2: CoreSignal API (Exact Proven Pattern)');
  console.log('─'.repeat(50));
  await testCoreSignalAPI();
  
  console.log('');
  
  // Test 3: Prospeo API with exact proven pattern
  console.log('📧 TEST 3: Prospeo API (Exact Proven Pattern)');
  console.log('─'.repeat(50));
  await testProspeoAPI();
}

async function testLushaAPI() {
  if (!process.env.LUSHA_API_KEY) {
    console.log('❌ Lusha API key not available');
    return;
  }
  
  try {
    const nameParts = TEST_EXECUTIVE.name.split(' ');
    const firstName = nameParts[0];
    const lastName = nameParts[nameParts.length - 1];
    const domain = TEST_EXECUTIVE.website.replace(/^https?:\/\//, '').replace(/^www\./, '');
    
    console.log(`   🔍 Search parameters:`);
    console.log(`      First Name: ${firstName}`);
    console.log(`      Last Name: ${lastName}`);
    console.log(`      Company: ${TEST_EXECUTIVE.company}`);
    console.log(`      Domain: ${domain}`);
    
    // Use EXACT proven working pattern
    const params = new URLSearchParams({
      firstName: firstName,
      lastName: lastName,
      companyName: TEST_EXECUTIVE.company,
      companyDomain: domain,
      refreshJobInfo: 'true',
      revealEmails: 'true',
      revealPhones: 'true'
    });

    console.log(`   🌐 API Call: https://api.lusha.com/v2/person?${params}`);
    
    const response = await fetch(`https://api.lusha.com/v2/person?${params}`, {
      method: 'GET',
      headers: {
        'api_key': process.env.LUSHA_API_KEY,
        'Content-Type': 'application/json'
      },
      timeout: 10000
    });

    console.log(`   📊 Response Status: ${response.status}`);
    
    if (response.ok) {
      const data = await response.json();
      console.log(`   📋 Response Structure:`, {
        fullName: data.fullName,
        hasEmailAddresses: !!data.emailAddresses,
        emailCount: data.emailAddresses?.length || 0,
        hasPhoneNumbers: !!data.phoneNumbers,
        phoneCount: data.phoneNumbers?.length || 0,
        hasLinkedIn: !!data.linkedinUrl,
        jobTitle: data.jobTitle
      });
      
      // Extract using proven pattern
      const emails = data.emailAddresses || [];
      const phones = data.phoneNumbers || [];
      
      if (emails.length > 0) {
        console.log(`   📧 Email Found: ${emails[0].email}`);
      } else {
        console.log(`   📧 No email found`);
      }
      
      if (phones.length > 0) {
        console.log(`   📞 Phone Found: ${phones[0].number}`);
      } else {
        console.log(`   📞 No phone found`);
      }
      
      if (data.linkedinUrl) {
        console.log(`   💼 LinkedIn Found: ${data.linkedinUrl}`);
      } else {
        console.log(`   💼 No LinkedIn found`);
      }
      
      console.log(`   ✅ Lusha API test successful`);
      
    } else if (response.status === 404) {
      console.log(`   ⚠️ Person not found in Lusha database`);
    } else {
      const errorText = await response.text();
      console.log(`   ❌ Lusha API error: ${response.status} - ${errorText}`);
    }
    
  } catch (error) {
    console.log(`   ❌ Lusha test error: ${error.message}`);
  }
}

async function testCoreSignalAPI() {
  if (!process.env.CORESIGNAL_API_KEY) {
    console.log('❌ CoreSignal API key not available');
    return;
  }
  
  try {
    console.log(`   🔍 Search parameters:`);
    console.log(`      Full Name: ${TEST_EXECUTIVE.name}`);
    console.log(`      Company: ${TEST_EXECUTIVE.company}`);
    
    const response = await fetch('https://api.coresignal.com/cdapi/v1/employee/search/filter', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.CORESIGNAL_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        full_name: TEST_EXECUTIVE.name,
        company_name: TEST_EXECUTIVE.company,
        limit: 5
      }),
      timeout: 15000
    });

    console.log(`   📊 Response Status: ${response.status}`);
    
    if (response.ok) {
      const data = await response.json();
      console.log(`   📋 Found ${data.employees?.length || 0} employees`);
      
      if (data.employees && data.employees.length > 0) {
        const employee = data.employees[0];
        console.log(`   👤 Employee Match:`, {
          fullName: employee.full_name,
          hasPrimaryEmail: !!employee.primary_professional_email,
          emailStatus: employee.primary_professional_email_status,
          title: employee.active_experience_title,
          companyId: employee.active_experience_company_id
        });
        
        if (employee.primary_professional_email) {
          console.log(`   📧 Email Found: ${employee.primary_professional_email}`);
          console.log(`   📊 Email Status: ${employee.primary_professional_email_status}`);
        } else {
          console.log(`   📧 No professional email found`);
        }
        
        console.log(`   ✅ CoreSignal API test successful`);
      } else {
        console.log(`   ⚠️ No employees found in CoreSignal`);
      }
      
    } else {
      const errorText = await response.text();
      console.log(`   ❌ CoreSignal API error: ${response.status} - ${errorText}`);
    }
    
  } catch (error) {
    console.log(`   ❌ CoreSignal test error: ${error.message}`);
  }
}

async function testProspeoAPI() {
  if (!process.env.PROSPEO_API_KEY) {
    console.log('❌ Prospeo API key not available');
    return;
  }
  
  try {
    const firstName = TEST_EXECUTIVE.name.split(' ')[0];
    const lastName = TEST_EXECUTIVE.name.split(' ').slice(1).join(' ');
    const domain = TEST_EXECUTIVE.website.replace(/^https?:\/\//, '').replace(/^www\./, '');
    
    console.log(`   🔍 Search parameters:`);
    console.log(`      First Name: ${firstName}`);
    console.log(`      Last Name: ${lastName}`);
    console.log(`      Domain: ${domain}`);
    
    const response = await fetch('https://api.prospeo.io/email-finder', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-KEY': process.env.PROSPEO_API_KEY
      },
      body: JSON.stringify({
        first_name: firstName,
        last_name: lastName,
        company_domain: domain
      })
    });

    console.log(`   📊 Response Status: ${response.status}`);
    
    if (response.ok) {
      const data = await response.json();
      console.log(`   📋 Response:`, {
        email: data.email,
        score: data.score,
        status: data.status
      });
      
      if (data.email && data.score > 70) {
        console.log(`   📧 Email Found: ${data.email} (${data.score}% confidence)`);
        console.log(`   ✅ Prospeo API test successful`);
      } else {
        console.log(`   ⚠️ Email found but low confidence: ${data.score}%`);
      }
      
    } else {
      const errorText = await response.text();
      console.log(`   ❌ Prospeo API error: ${response.status} - ${errorText}`);
    }
    
  } catch (error) {
    console.log(`   ❌ Prospeo test error: ${error.message}`);
  }
}

// Run the test
if (require.main === module) {
  testRealAPICalls().catch(console.error);
}

module.exports = { testRealAPICalls };
