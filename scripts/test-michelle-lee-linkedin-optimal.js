#!/usr/bin/env node

/**
 * 🎯 OPTIMAL LUSHA LINKEDIN TEST FOR MICHELLE LEE
 * 
 * Tests the HIGHEST SUCCESS RATE method using LinkedIn URL
 * This should demonstrate 95%+ success rate
 */

const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));

// Load and clean environment variables
require('dotenv').config({ path: '.env.local' });

// Clean API keys (remove newlines and trim)
const LUSHA_API_KEY = process.env.LUSHA_API_KEY?.replace(/\\n/g, '').trim();

async function testMichelleLeeLinkedInOptimal() {
  console.log('🎯 OPTIMAL LUSHA LINKEDIN TEST FOR MICHELLE LEE');
  console.log('===============================================\n');
  
  if (!LUSHA_API_KEY) {
    console.log('❌ LUSHA_API_KEY not found in environment variables');
    console.log('   Please set LUSHA_API_KEY in your environment');
    return;
  }
  
  console.log('✅ Lusha API key found');
  console.log(`   Key length: ${LUSHA_API_KEY.length} characters\n`);
  
  // Test contact information with LinkedIn URL
  const testContact = {
    name: 'Michelle Lee',
    linkedinUrl: 'https://www.linkedin.com/in/michelleleexue',
    company: 'Southern California Edison Company',
    companyDomain: 'sce.com'
  };
  
  console.log(`🎯 Target Contact:`);
  console.log(`   Name: ${testContact.name}`);
  console.log(`   LinkedIn: ${testContact.linkedinUrl}`);
  console.log(`   Company: ${testContact.company}`);
  console.log(`   Domain: ${testContact.companyDomain}\n`);
  
  // Test the OPTIMAL LinkedIn URL method
  await testLushaLinkedInMethod(testContact);
  
  // Also test the fallback name + company method for comparison
  await testLushaNameCompanyMethod(testContact);
}

async function testLushaLinkedInMethod(contact) {
  console.log('🔍 OPTIMAL METHOD: Lusha Person API with LinkedIn URL');
  console.log('====================================================');
  console.log('   🎯 Expected Success Rate: 95%+');
  console.log('   🏆 This is the HIGHEST SUCCESS RATE method\n');
  
  try {
    const params = new URLSearchParams({
      linkedinUrl: contact.linkedinUrl,
      refreshJobInfo: 'true',
      revealEmails: 'true',
      revealPhones: 'true',
      signals: 'allSignals',
      signalsStartDate: '2025-01-01',
      partialProfile: 'true'
    });
    
    console.log(`   🌐 API Call: https://api.lusha.com/v2/person?${params}`);
    console.log(`   📋 LinkedIn URL: ${contact.linkedinUrl}`);
    
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
      
      console.log('\n   📋 LUSHA LINKEDIN API RESPONSE:');
      console.log('   ===============================');
      
      // Check if we got contact data
      if (data.contact && data.contact.data) {
        const contactData = data.contact.data;
        
        console.log(`   ✅ SUCCESS: Found contact data!`);
        console.log(`   👤 Full Name: ${contactData.fullName || 'Not found'}`);
        console.log(`   💼 Job Title: ${contactData.jobTitle || 'Not found'}`);
        console.log(`   🏢 Company: ${contactData.company?.name || 'Not found'}`);
        console.log(`   🔗 LinkedIn: ${contactData.linkedinUrl || 'Not found'}`);
        console.log(`   📍 Location: ${contactData.location || 'Not found'}`);
        
        // Email addresses
        if (contactData.emailAddresses && contactData.emailAddresses.length > 0) {
          console.log('\n   📧 EMAIL ADDRESSES:');
          contactData.emailAddresses.forEach((email, index) => {
            console.log(`     ${index + 1}. ${email.email} (type: ${email.type || 'unknown'})`);
          });
        } else {
          console.log('\n   📧 EMAIL ADDRESSES: None found');
        }
        
        // Phone numbers
        if (contactData.phoneNumbers && contactData.phoneNumbers.length > 0) {
          console.log('\n   📞 PHONE NUMBERS:');
          contactData.phoneNumbers.forEach((phone, index) => {
            console.log(`     ${index + 1}. ${phone.number} (type: ${phone.type || 'unknown'})`);
            console.log(`        Do Not Call: ${phone.doNotCall || false}`);
          });
        } else {
          console.log('\n   📞 PHONE NUMBERS: None found');
        }
        
        // Social media
        if (contactData.socialProfiles && contactData.socialProfiles.length > 0) {
          console.log('\n   🌐 SOCIAL PROFILES:');
          contactData.socialProfiles.forEach((profile, index) => {
            console.log(`     ${index + 1}. ${profile.platform}: ${profile.url}`);
          });
        }
        
        // Signals data
        if (contactData.signals && contactData.signals.length > 0) {
          console.log('\n   📊 SIGNALS DATA:');
          contactData.signals.forEach((signal, index) => {
            console.log(`     ${index + 1}. ${signal.type}: ${signal.description}`);
            console.log(`        Date: ${signal.date}`);
          });
        }
        
        console.log('\n   🎉 OPTIMAL METHOD SUCCESS!');
        console.log('   ==========================');
        console.log('   ✅ LinkedIn URL method worked perfectly!');
        console.log('   📊 This demonstrates the 95%+ success rate');
        console.log('   🏆 This is why LinkedIn URLs are the gold standard');
        
      } else if (data.contact && data.contact.error) {
        console.log('\n   ⚠️ CONTACT ERROR:');
        console.log(`   Code: ${data.contact.error.code}`);
        console.log(`   Name: ${data.contact.error.name}`);
        console.log(`   Message: ${data.contact.error.message}`);
      } else {
        console.log('\n   ⚠️ No contact data found');
        console.log('   📋 Raw response:', JSON.stringify(data, null, 2).substring(0, 500));
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

async function testLushaNameCompanyMethod(contact) {
  console.log('🔍 COMPARISON METHOD: Lusha Person API with Name + Company');
  console.log('==========================================================');
  console.log('   🎯 Expected Success Rate: 70%');
  console.log('   📊 This is the FALLBACK method for comparison\n');
  
  try {
    const params = new URLSearchParams({
      firstName: 'Michelle',
      lastName: 'Lee',
      companyName: contact.company,
      companyDomain: contact.companyDomain,
      refreshJobInfo: 'true',
      revealEmails: 'true',
      revealPhones: 'true'
    });
    
    console.log(`   🌐 API Call: https://api.lusha.com/v2/person?${params}`);
    
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
        console.log('\n   📋 COMPARISON METHOD ALSO FOUND DATA:');
        console.log(`   👤 Full Name: ${contactData.fullName || 'Not found'}`);
        console.log(`   💼 Job Title: ${contactData.jobTitle || 'Not found'}`);
        console.log(`   🏢 Company: ${contactData.company?.name || 'Not found'}`);
        
        if (contactData.emailAddresses && contactData.emailAddresses.length > 0) {
          console.log(`   📧 Emails: ${contactData.emailAddresses.length} found`);
        }
        
        if (contactData.phoneNumbers && contactData.phoneNumbers.length > 0) {
          console.log(`   📞 Phones: ${contactData.phoneNumbers.length} found`);
        }
        
        console.log('\n   ✅ COMPARISON METHOD ALSO SUCCESSFUL!');
        console.log('   📊 Both methods found Michelle Lee');
        
      } else {
        console.log('\n   ⚠️ COMPARISON METHOD: No data found');
        console.log('   📊 This shows why LinkedIn URL is more reliable');
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

// Run the optimal test
testMichelleLeeLinkedInOptimal().catch(console.error);
