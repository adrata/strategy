#!/usr/bin/env node

/**
 * 🔍 INVESTIGATE API vs DASHBOARD DISCREPANCY
 * 
 * The Lusha dashboard shows Michelle Lee at SCE as "Engineer 1"
 * But the API returns her at "The Leading Hotels of the World"
 * Let's investigate this discrepancy
 */

const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));

// Load and clean environment variables
require('dotenv').config({ path: '.env.local' });

// Clean API keys (remove newlines and trim)
const LUSHA_API_KEY = process.env.LUSHA_API_KEY?.replace(/\\n/g, '').trim();

async function investigateApiVsDashboard() {
  console.log('🔍 INVESTIGATING API vs DASHBOARD DISCREPANCY');
  console.log('============================================\n');
  
  if (!LUSHA_API_KEY) {
    console.log('❌ LUSHA_API_KEY not found');
    return;
  }
  
  console.log('✅ Lusha API key found\n');
  
  // Test 1: Try the exact LinkedIn URL from the dashboard
  await testExactLinkedInUrl();
  
  // Test 2: Try different API endpoints
  await testDifferentEndpoints();
  
  // Test 3: Try with different parameters
  await testDifferentParameters();
  
  // Test 4: Try prospecting API
  await testProspectingAPI();
}

async function testExactLinkedInUrl() {
  console.log('🔍 TEST 1: Exact LinkedIn URL from Dashboard');
  console.log('==========================================');
  
  try {
    // Use the exact LinkedIn URL from the dashboard
    const linkedinUrl = 'https://www.linkedin.com/in/michelleleexue/';
    
    const params = new URLSearchParams({
      linkedinUrl: linkedinUrl,
      refreshJobInfo: 'true',
      revealEmails: 'true',
      revealPhones: 'true'
    });
    
    console.log(`   🌐 API Call: https://api.lusha.com/v2/person?${params}`);
    console.log(`   📋 LinkedIn URL: ${linkedinUrl}`);
    
    const response = await fetch(`https://api.lusha.com/v2/person?${params}`, {
      method: 'GET',
      headers: {
        'api_key': LUSHA_API_KEY,
        'Content-Type': 'application/json'
      },
      timeout: 15000
    });
    
    console.log(`   📊 Response Status: ${response.status}`);
    
    if (response.ok) {
      const data = await response.json();
      
      if (data.contact && data.contact.data) {
        const contactData = data.contact.data;
        console.log('\n   ✅ FOUND CONTACT DATA!');
        console.log('   =====================');
        console.log(`   👤 Full Name: ${contactData.fullName}`);
        console.log(`   💼 Job Title: ${contactData.jobTitle?.title || 'Not found'}`);
        console.log(`   🏢 Company: ${contactData.company?.name || 'Not found'}`);
        console.log(`   📧 Email: ${contactData.emailAddresses?.[0]?.email || 'Not found'}`);
        console.log(`   📞 Phone: ${contactData.phoneNumbers?.[0]?.number || 'Not found'}`);
        console.log(`   🔗 LinkedIn: ${contactData.socialLinks?.linkedin || 'Not found'}`);
        
        // Check if this matches the dashboard data
        const isAtSCE = contactData.company?.name?.toLowerCase().includes('southern california edison') || 
                       contactData.company?.name?.toLowerCase().includes('sce');
        const isEngineer = contactData.jobTitle?.title?.toLowerCase().includes('engineer');
        
        console.log('\n   🔍 DASHBOARD COMPARISON:');
        console.log(`   Expected Company: Southern California Edison`);
        console.log(`   Actual Company: ${contactData.company?.name}`);
        console.log(`   Company Match: ${isAtSCE ? '✅ YES' : '❌ NO'}`);
        console.log(`   Expected Title: Engineer 1`);
        console.log(`   Actual Title: ${contactData.jobTitle?.title}`);
        console.log(`   Title Match: ${isEngineer ? '✅ YES' : '❌ NO'}`);
        
        if (isAtSCE && isEngineer) {
          console.log('\n   🎉 SUCCESS: API matches dashboard data!');
        } else {
          console.log('\n   ⚠️ DISCREPANCY: API data does not match dashboard');
        }
        
      } else if (data.contact && data.contact.error) {
        console.log('\n   ❌ ERROR FOUND:');
        console.log(`   Code: ${data.contact.error.code}`);
        console.log(`   Name: ${data.contact.error.name}`);
        console.log(`   Message: ${data.contact.error.message}`);
        console.log('\n   📊 This means the LinkedIn URL is not found in the API database');
      } else {
        console.log('\n   ⚠️ No contact data found');
      }
      
    } else {
      const errorText = await response.text();
      console.log(`   ❌ API Error: ${response.status}`);
      console.log(`   Error: ${errorText}`);
    }
    
  } catch (error) {
    console.log(`   ❌ Exception: ${error.message}`);
  }
  
  console.log('\n');
}

async function testDifferentEndpoints() {
  console.log('🔍 TEST 2: Different API Endpoints');
  console.log('=================================');
  
  const linkedinUrl = 'https://www.linkedin.com/in/michelleleexue/';
  
  // Test v1 API
  console.log('\n   📋 Test 2A: v1 API Endpoint');
  await testV1API(linkedinUrl);
  
  // Test v2 API with different parameters
  console.log('\n   📋 Test 2B: v2 API with minimal parameters');
  await testV2Minimal(linkedinUrl);
  
  // Test v2 API with all parameters
  console.log('\n   📋 Test 2C: v2 API with all parameters');
  await testV2AllParams(linkedinUrl);
}

async function testV1API(linkedinUrl) {
  try {
    const params = new URLSearchParams({
      linkedinUrl: linkedinUrl
    });
    
    const response = await fetch(`https://api.lusha.com/v1/person?${params}`, {
      method: 'GET',
      headers: {
        'api_key': LUSHA_API_KEY,
        'Content-Type': 'application/json'
      },
      timeout: 15000
    });
    
    console.log(`     📊 Response Status: ${response.status}`);
    
    if (response.ok) {
      const data = await response.json();
      console.log(`     📋 Response: ${JSON.stringify(data, null, 2).substring(0, 300)}...`);
    } else {
      const errorText = await response.text();
      console.log(`     ❌ Error: ${response.status} - ${errorText}`);
    }
    
  } catch (error) {
    console.log(`     ❌ Exception: ${error.message}`);
  }
}

async function testV2Minimal(linkedinUrl) {
  try {
    const params = new URLSearchParams({
      linkedinUrl: linkedinUrl
    });
    
    const response = await fetch(`https://api.lusha.com/v2/person?${params}`, {
      method: 'GET',
      headers: {
        'api_key': LUSHA_API_KEY,
        'Content-Type': 'application/json'
      },
      timeout: 15000
    });
    
    console.log(`     📊 Response Status: ${response.status}`);
    
    if (response.ok) {
      const data = await response.json();
      console.log(`     📋 Response: ${JSON.stringify(data, null, 2).substring(0, 300)}...`);
    } else {
      const errorText = await response.text();
      console.log(`     ❌ Error: ${response.status} - ${errorText}`);
    }
    
  } catch (error) {
    console.log(`     ❌ Exception: ${error.message}`);
  }
}

async function testV2AllParams(linkedinUrl) {
  try {
    const params = new URLSearchParams({
      linkedinUrl: linkedinUrl,
      refreshJobInfo: 'true',
      revealEmails: 'true',
      revealPhones: 'true',
      signals: 'allSignals',
      signalsStartDate: '2025-01-01',
      partialProfile: 'true'
    });
    
    const response = await fetch(`https://api.lusha.com/v2/person?${params}`, {
      method: 'GET',
      headers: {
        'api_key': LUSHA_API_KEY,
        'Content-Type': 'application/json'
      },
      timeout: 15000
    });
    
    console.log(`     📊 Response Status: ${response.status}`);
    
    if (response.ok) {
      const data = await response.json();
      console.log(`     📋 Response: ${JSON.stringify(data, null, 2).substring(0, 300)}...`);
    } else {
      const errorText = await response.text();
      console.log(`     ❌ Error: ${response.status} - ${errorText}`);
    }
    
  } catch (error) {
    console.log(`     ❌ Exception: ${error.message}`);
  }
}

async function testDifferentParameters() {
  console.log('🔍 TEST 3: Different Parameter Combinations');
  console.log('==========================================');
  
  const linkedinUrl = 'https://www.linkedin.com/in/michelleleexue/';
  
  // Test with company context
  console.log('\n   📋 Test 3A: LinkedIn + Company Context');
  await testLinkedInWithCompany(linkedinUrl);
  
  // Test with email context
  console.log('\n   📋 Test 3B: LinkedIn + Email Context');
  await testLinkedInWithEmail(linkedinUrl);
  
  // Test with name context
  console.log('\n   📋 Test 3C: LinkedIn + Name Context');
  await testLinkedInWithName(linkedinUrl);
}

async function testLinkedInWithCompany(linkedinUrl) {
  try {
    const params = new URLSearchParams({
      linkedinUrl: linkedinUrl,
      companyName: 'Southern California Edison',
      companyDomain: 'sce.com',
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
      timeout: 15000
    });
    
    console.log(`     📊 Response Status: ${response.status}`);
    
    if (response.ok) {
      const data = await response.json();
      console.log(`     📋 Response: ${JSON.stringify(data, null, 2).substring(0, 300)}...`);
    } else {
      const errorText = await response.text();
      console.log(`     ❌ Error: ${response.status} - ${errorText}`);
    }
    
  } catch (error) {
    console.log(`     ❌ Exception: ${error.message}`);
  }
}

async function testLinkedInWithEmail(linkedinUrl) {
  try {
    const params = new URLSearchParams({
      linkedinUrl: linkedinUrl,
      email: 'michelle.lee@sce.com',
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
      timeout: 15000
    });
    
    console.log(`     📊 Response Status: ${response.status}`);
    
    if (response.ok) {
      const data = await response.json();
      console.log(`     📋 Response: ${JSON.stringify(data, null, 2).substring(0, 300)}...`);
    } else {
      const errorText = await response.text();
      console.log(`     ❌ Error: ${response.status} - ${errorText}`);
    }
    
  } catch (error) {
    console.log(`     ❌ Exception: ${error.message}`);
  }
}

async function testLinkedInWithName(linkedinUrl) {
  try {
    const params = new URLSearchParams({
      linkedinUrl: linkedinUrl,
      firstName: 'Michelle',
      lastName: 'Lee',
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
      timeout: 15000
    });
    
    console.log(`     📊 Response Status: ${response.status}`);
    
    if (response.ok) {
      const data = await response.json();
      console.log(`     📋 Response: ${JSON.stringify(data, null, 2).substring(0, 300)}...`);
    } else {
      const errorText = await response.text();
      console.log(`     ❌ Error: ${response.status} - ${errorText}`);
    }
    
  } catch (error) {
    console.log(`     ❌ Exception: ${error.message}`);
  }
}

async function testProspectingAPI() {
  console.log('🔍 TEST 4: Prospecting API');
  console.log('==========================');
  
  try {
    const requestBody = {
      company_domain: 'sce.com',
      job_title: 'Engineer',
      seniority: ['engineer', 'manager', 'director']
    };
    
    console.log(`   🌐 API Call: https://api.lusha.com/v2/prospecting/people`);
    console.log(`   📋 Request Body:`, JSON.stringify(requestBody, null, 2));
    
    const response = await fetch('https://api.lusha.com/v2/prospecting/people', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LUSHA_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(requestBody),
      timeout: 15000
    });
    
    console.log(`   📊 Response Status: ${response.status}`);
    
    if (response.ok) {
      const data = await response.json();
      
      if (data.data && data.data.length > 0) {
        console.log(`   📋 Found ${data.data.length} engineers at SCE`);
        
        // Look for Michelle Lee
        const michelleLee = data.data.find(person => 
          person.fullName?.toLowerCase().includes('michelle') && 
          person.fullName?.toLowerCase().includes('lee')
        );
        
        if (michelleLee) {
          console.log('\n   🎯 FOUND MICHELLE LEE IN PROSPECTING RESULTS!');
          console.log('   ===========================================');
          console.log(`   👤 Full Name: ${michelleLee.fullName}`);
          console.log(`   💼 Job Title: ${michelleLee.jobTitle?.title || 'Not found'}`);
          console.log(`   🏢 Company: ${michelleLee.companyName}`);
          console.log(`   📧 Email: ${michelleLee.emailAddresses?.[0]?.email || 'Not found'}`);
          console.log(`   📞 Phone: ${michelleLee.phoneNumbers?.[0]?.number || 'Not found'}`);
        } else {
          console.log('\n   ⚠️ Michelle Lee not found in prospecting results');
          console.log('   📋 Available engineers:');
          data.data.slice(0, 5).forEach((person, index) => {
            console.log(`     ${index + 1}. ${person.fullName} - ${person.jobTitle?.title || 'Unknown title'}`);
          });
        }
      } else {
        console.log('\n   ⚠️ No engineers found at SCE');
      }
      
    } else {
      const errorText = await response.text();
      console.log(`   ❌ API Error: ${response.status}`);
      console.log(`   Error: ${errorText}`);
    }
    
  } catch (error) {
    console.log(`   ❌ Exception: ${error.message}`);
  }
  
  console.log('\n');
}

// Run the investigation
investigateApiVsDashboard().catch(console.error);
