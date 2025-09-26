#!/usr/bin/env node

/**
 * 🎯 CORRECT LUSHA API FOR MICHELLE LEE
 * 
 * Using the correct POST method for Person API with LinkedIn URL
 * Based on official Lusha API documentation
 */

const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));

// Load and clean environment variables
require('dotenv').config({ path: '.env.local' });

// Clean API keys (remove newlines and trim)
const LUSHA_API_KEY = process.env.LUSHA_API_KEY?.replace(/\\n/g, '').trim();

async function testMichelleLeeCorrectAPI() {
  console.log('🎯 CORRECT LUSHA API FOR MICHELLE LEE');
  console.log('=====================================\n');
  
  if (!LUSHA_API_KEY) {
    console.log('❌ LUSHA_API_KEY not found in environment variables');
    return;
  }
  
  console.log('✅ Lusha API key found');
  console.log(`   Key length: ${LUSHA_API_KEY.length} characters\n`);
  
  const linkedinUrl = 'https://www.linkedin.com/in/michelleleexue/';
  
  console.log(`🎯 Target: Michelle Lee via LinkedIn URL`);
  console.log(`   LinkedIn: ${linkedinUrl}\n`);
  
  // Test the correct POST method for Person API
  await testLushaPersonAPIPOST(linkedinUrl);
  
  // Test alternative approaches
  await testLushaPersonAPIGET(linkedinUrl);
  await testLushaProspectingAPICorrect();
}

async function testLushaPersonAPIPOST(linkedinUrl) {
  console.log('🔍 TEST 1: Lusha Person API (v2/person) - POST Method');
  console.log('-'.repeat(55));
  
  try {
    const requestBody = {
      contacts: [
        {
          contactId: "1",
          linkedinUrl: linkedinUrl
        }
      ],
      metadata: {
        revealEmails: true,
        revealPhones: true
      }
    };
    
    console.log(`   🌐 API Call: POST https://api.lusha.com/v2/person`);
    console.log(`   📋 Request Body:`, JSON.stringify(requestBody, null, 2));
    
    const response = await fetch('https://api.lusha.com/v2/person', {
      method: 'POST',
      headers: {
        'api_key': LUSHA_API_KEY,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(requestBody),
      timeout: 15000
    });
    
    console.log(`   📊 Response Status: ${response.status}`);
    
    if (response.ok) {
      const data = await response.json();
      
      console.log('\n   📋 LUSHA PERSON API RESPONSE:');
      console.log('   =============================');
      console.log(`   Response Structure:`, Object.keys(data));
      
      if (data.contacts && data.contacts["1"]) {
        const contact = data.contacts["1"].data;
        
        console.log('\n   ✅ FOUND MICHELLE LEE!');
        console.log('   =====================');
        console.log(`   👤 Full Name: ${contact.fullName || 'Not found'}`);
        console.log(`   💼 Job Title: ${contact.jobTitle || 'Not found'}`);
        console.log(`   📍 Location: ${contact.location?.city || 'Not found'}, ${contact.location?.state || 'Not found'}`);
        
        // Email addresses
        if (contact.emailAddresses && contact.emailAddresses.length > 0) {
          console.log('\n   📧 EMAIL ADDRESSES:');
          contact.emailAddresses.forEach((email, index) => {
            console.log(`     ${index + 1}. ${email.email} (type: ${email.emailType || 'unknown'}, confidence: ${email.emailConfidence || 'unknown'})`);
          });
        } else {
          console.log('\n   📧 EMAIL ADDRESSES: None found');
        }
        
        // Phone numbers
        if (contact.phoneNumbers && contact.phoneNumbers.length > 0) {
          console.log('\n   📞 PHONE NUMBERS:');
          contact.phoneNumbers.forEach((phone, index) => {
            console.log(`     ${index + 1}. ${phone.number} (type: ${phone.phoneType || 'unknown'}, doNotCall: ${phone.doNotCall || false})`);
          });
        } else {
          console.log('\n   📞 PHONE NUMBERS: None found');
        }
        
        // Company information
        if (data.companies && contact.companyId && data.companies[contact.companyId]) {
          const company = data.companies[contact.companyId];
          console.log('\n   🏢 COMPANY INFORMATION:');
          console.log(`     Name: ${company.name || 'Not found'}`);
          console.log(`     Domain: ${company.domain || 'Not found'}`);
          console.log(`     Location: ${company.location?.city || 'Not found'}, ${company.location?.state || 'Not found'}`);
          console.log(`     Size: ${company.companySize ? company.companySize.join('-') : 'Not found'}`);
          console.log(`     Revenue: ${company.revenueRange ? company.revenueRange.join('-') : 'Not found'}`);
        }
        
        console.log('\n   🎉 SUCCESS: Found Michelle Lee with correct API method!');
        return true;
      } else {
        console.log('\n   ⚠️ No contact data found in response');
        console.log(`   Response structure:`, JSON.stringify(data, null, 2));
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
  return false;
}

async function testLushaPersonAPIGET(linkedinUrl) {
  console.log('🔍 TEST 2: Lusha Person API (v2/person) - GET Method (for comparison)');
  console.log('-'.repeat(70));
  
  try {
    const params = new URLSearchParams({
      linkedinUrl: linkedinUrl,
      revealEmails: 'true',
      revealPhones: 'true'
    });
    
    console.log(`   🌐 API Call: GET https://api.lusha.com/v2/person?${params}`);
    
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
      
      if (data.fullName || data.emailAddresses?.length > 0 || data.phoneNumbers?.length > 0) {
        console.log(`   ✅ FOUND with GET method too!`);
        console.log(`   👤 Name: ${data.fullName || 'Not provided'}`);
        console.log(`   📧 Emails: ${data.emailAddresses?.length || 0}`);
        console.log(`   📞 Phones: ${data.phoneNumbers?.length || 0}`);
        return true;
      } else {
        console.log(`   ⚠️ No data found with GET method`);
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
  return false;
}

async function testLushaProspectingAPICorrect() {
  console.log('🔍 TEST 3: Lusha Prospecting API - Correct Endpoint');
  console.log('-'.repeat(50));
  
  try {
    // Try the correct prospecting endpoint
    const requestBody = {
      company_domain: 'sce.com',
      job_title: 'Engineer',
      seniority: ['individual_contributor', 'manager']
    };
    
    console.log(`   🌐 API Call: POST https://api.lusha.com/v2/prospecting/people`);
    console.log(`   📋 Request Body:`, JSON.stringify(requestBody, null, 2));
    
    const response = await fetch('https://api.lusha.com/v2/prospecting/people', {
      method: 'POST',
      headers: {
        'api_key': LUSHA_API_KEY,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(requestBody),
      timeout: 15000
    });
    
    console.log(`   📊 Response Status: ${response.status}`);
    
    if (response.ok) {
      const data = await response.json();
      console.log(`   📋 Total Results: ${data.data?.length || 0}`);
      
      if (data.data && data.data.length > 0) {
        // Look for Michelle Lee
        const michelleLee = data.data.find(person => 
          person.fullName?.toLowerCase().includes('michelle') && 
          person.fullName?.toLowerCase().includes('lee')
        );
        
        if (michelleLee) {
          console.log(`   ✅ FOUND MICHELLE LEE in prospecting results!`);
          console.log(`   👤 Name: ${michelleLee.fullName}`);
          console.log(`   💼 Title: ${michelleLee.jobTitle?.title || 'Not found'}`);
          console.log(`   🏢 Company: ${michelleLee.companyName}`);
          console.log(`   📧 Emails: ${michelleLee.emailAddresses?.length || 0}`);
          console.log(`   📞 Phones: ${michelleLee.phoneNumbers?.length || 0}`);
          return true;
        } else {
          console.log(`   ⚠️ Michelle Lee not found in prospecting results`);
          console.log(`   📋 Found ${data.data.length} other people:`);
          data.data.slice(0, 5).forEach((person, index) => {
            console.log(`     ${index + 1}. ${person.fullName} - ${person.jobTitle?.title || 'Unknown title'}`);
          });
        }
      } else {
        console.log(`   ⚠️ No results found`);
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
  return false;
}

// Run the correct API test
testMichelleLeeCorrectAPI().catch(console.error);
