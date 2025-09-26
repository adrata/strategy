#!/usr/bin/env node

/**
 * 🎯 FIXED RESPONSE PARSING FOR MICHELLE LEE
 * 
 * Fixing the response parsing issue with the correct data structure
 */

const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));

// Load and clean environment variables
require('dotenv').config({ path: '.env.local' });

// Clean API keys (remove newlines and trim)
const LUSHA_API_KEY = process.env.LUSHA_API_KEY?.replace(/\\n/g, '').trim();

async function testMichelleLeeFixedParsing() {
  console.log('🎯 FIXED RESPONSE PARSING FOR MICHELLE LEE');
  console.log('==========================================\n');
  
  if (!LUSHA_API_KEY) {
    console.log('❌ LUSHA_API_KEY not found in environment variables');
    return;
  }
  
  console.log('✅ Lusha API key found');
  console.log(`   Key length: ${LUSHA_API_KEY.length} characters\n`);
  
  const linkedinUrl = 'https://www.linkedin.com/in/michelleleexue/';
  
  console.log(`🎯 Target: Michelle Lee via LinkedIn URL`);
  console.log(`   LinkedIn: ${linkedinUrl}\n`);
  
  await testLushaPersonAPIPOSTFixed(linkedinUrl);
}

async function testLushaPersonAPIPOSTFixed(linkedinUrl) {
  console.log('🔍 LUSHA PERSON API (v2/person) - POST Method with Fixed Parsing');
  console.log('-'.repeat(70));
  
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
      
      console.log('\n   📋 FULL LUSHA API RESPONSE:');
      console.log('   ===========================');
      console.log(JSON.stringify(data, null, 2));
      
      console.log('\n   📋 LUSHA PERSON API RESPONSE ANALYSIS:');
      console.log('   ======================================');
      console.log(`   Response Structure:`, Object.keys(data));
      
      if (data.contacts) {
        console.log(`   Contacts Structure:`, Object.keys(data.contacts));
        
        if (data.contacts["1"]) {
          console.log(`   Contact 1 Structure:`, Object.keys(data.contacts["1"]));
          
          if (data.contacts["1"].data) {
            const contact = data.contacts["1"].data;
            console.log(`   Contact Data Structure:`, Object.keys(contact));
            
            console.log('\n   ✅ FOUND MICHELLE LEE!');
            console.log('   =====================');
            console.log(`   👤 Full Name: ${contact.fullName || 'Not found'}`);
            console.log(`   👤 First Name: ${contact.firstName || 'Not found'}`);
            console.log(`   👤 Last Name: ${contact.lastName || 'Not found'}`);
            console.log(`   💼 Job Title: ${contact.jobTitle || 'Not found'}`);
            console.log(`   📍 Location: ${contact.location?.city || 'Not found'}, ${contact.location?.state || 'Not found'}`);
            console.log(`   🏢 Company ID: ${contact.companyId || 'Not found'}`);
            
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
            console.log('\n   ⚠️ No data found in contact 1');
            console.log(`   Contact 1 content:`, data.contacts["1"]);
          }
        } else {
          console.log('\n   ⚠️ No contact 1 found');
          console.log(`   Available contacts:`, Object.keys(data.contacts));
        }
      } else {
        console.log('\n   ⚠️ No contacts found in response');
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

// Run the fixed parsing test
testMichelleLeeFixedParsing().catch(console.error);
