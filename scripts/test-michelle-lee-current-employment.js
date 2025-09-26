#!/usr/bin/env node

/**
 * 🔍 VERIFY MICHELLE LEE'S CURRENT EMPLOYMENT
 * 
 * Test to see if Michelle Lee is actually at Southern California Edison
 * This will help us understand data accuracy vs. current reality
 */

const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));

// Load and clean environment variables
require('dotenv').config({ path: '.env.local' });

// Clean API keys (remove newlines and trim)
const LUSHA_API_KEY = process.env.LUSHA_API_KEY?.replace(/\\n/g, '').trim();

async function verifyMichelleLeeEmployment() {
  console.log('🔍 VERIFYING MICHELLE LEE\'S CURRENT EMPLOYMENT');
  console.log('===============================================\n');
  
  if (!LUSHA_API_KEY) {
    console.log('❌ LUSHA_API_KEY not found');
    return;
  }
  
  console.log('✅ Lusha API key found\n');
  
  // Test 1: Search for Michelle Lee at Southern California Edison
  await testMichelleLeeAtSCE();
  
  // Test 2: Search for Michelle Lee at The Leading Hotels of the World
  await testMichelleLeeAtLHW();
  
  // Test 3: Search for any Michelle Lee at SCE
  await testAnyMichelleLeeAtSCE();
  
  // Test 4: Search for Michelle Lee with different company variations
  await testMichelleLeeCompanyVariations();
}

async function testMichelleLeeAtSCE() {
  console.log('🔍 TEST 1: Michelle Lee at Southern California Edison');
  console.log('====================================================');
  
  try {
    const params = new URLSearchParams({
      firstName: 'Michelle',
      lastName: 'Lee',
      companyName: 'Southern California Edison',
      companyDomain: 'sce.com',
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
        console.log('\n   ✅ FOUND MICHELLE LEE AT SCE!');
        console.log('   =============================');
        console.log(`   👤 Full Name: ${contactData.fullName}`);
        console.log(`   💼 Job Title: ${contactData.jobTitle?.title || 'Not found'}`);
        console.log(`   🏢 Company: ${contactData.company?.name || 'Not found'}`);
        console.log(`   📧 Email: ${contactData.emailAddresses?.[0]?.email || 'Not found'}`);
        console.log(`   📞 Phone: ${contactData.phoneNumbers?.[0]?.number || 'Not found'}`);
        console.log(`   🔗 LinkedIn: ${contactData.socialLinks?.linkedin || 'Not found'}`);
        
        if (contactData.emailAddresses && contactData.emailAddresses.length > 0) {
          console.log('\n   📧 EMAIL ADDRESSES:');
          contactData.emailAddresses.forEach((email, index) => {
            console.log(`     ${index + 1}. ${email.email} (${email.emailType})`);
          });
        }
        
        if (contactData.phoneNumbers && contactData.phoneNumbers.length > 0) {
          console.log('\n   📞 PHONE NUMBERS:');
          contactData.phoneNumbers.forEach((phone, index) => {
            console.log(`     ${index + 1}. ${phone.number} (${phone.phoneType})`);
          });
        }
        
      } else if (data.contact && data.contact.error) {
        console.log('\n   ❌ ERROR FOUND:');
        console.log(`   Code: ${data.contact.error.code}`);
        console.log(`   Name: ${data.contact.error.name}`);
        console.log(`   Message: ${data.contact.error.message}`);
        console.log('\n   📊 This means Michelle Lee is NOT found at SCE in Lusha\'s database');
      } else {
        console.log('\n   ⚠️ No data found for Michelle Lee at SCE');
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

async function testMichelleLeeAtLHW() {
  console.log('🔍 TEST 2: Michelle Lee at The Leading Hotels of the World');
  console.log('========================================================');
  
  try {
    const params = new URLSearchParams({
      firstName: 'Michelle',
      lastName: 'Lee',
      companyName: 'The Leading Hotels of the World',
      companyDomain: 'lhw.com',
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
        console.log('\n   ✅ FOUND MICHELLE LEE AT LHW!');
        console.log('   =============================');
        console.log(`   👤 Full Name: ${contactData.fullName}`);
        console.log(`   💼 Job Title: ${contactData.jobTitle?.title || 'Not found'}`);
        console.log(`   🏢 Company: ${contactData.company?.name || 'Not found'}`);
        console.log(`   📧 Email: ${contactData.emailAddresses?.[0]?.email || 'Not found'}`);
        console.log(`   📞 Phone: ${contactData.phoneNumbers?.[0]?.number || 'Not found'}`);
        
      } else if (data.contact && data.contact.error) {
        console.log('\n   ❌ ERROR FOUND:');
        console.log(`   Code: ${data.contact.error.code}`);
        console.log(`   Name: ${data.contact.error.name}`);
        console.log(`   Message: ${data.contact.error.message}`);
      } else {
        console.log('\n   ⚠️ No data found for Michelle Lee at LHW');
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

async function testAnyMichelleLeeAtSCE() {
  console.log('🔍 TEST 3: Any Michelle Lee at Southern California Edison');
  console.log('=======================================================');
  
  try {
    const params = new URLSearchParams({
      firstName: 'Michelle',
      lastName: 'Lee',
      companyName: 'Southern California Edison Company',
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
        console.log('\n   ✅ FOUND MICHELLE LEE AT SCE!');
        console.log(`   👤 Full Name: ${contactData.fullName}`);
        console.log(`   💼 Job Title: ${contactData.jobTitle?.title || 'Not found'}`);
        console.log(`   🏢 Company: ${contactData.company?.name || 'Not found'}`);
        
      } else if (data.contact && data.contact.error) {
        console.log('\n   ❌ NO MICHELLE LEE FOUND AT SCE');
        console.log(`   Error: ${data.contact.error.name} - ${data.contact.error.message}`);
      } else {
        console.log('\n   ⚠️ No data found');
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

async function testMichelleLeeCompanyVariations() {
  console.log('🔍 TEST 4: Michelle Lee with Company Variations');
  console.log('==============================================');
  
  const companyVariations = [
    'Southern California Edison',
    'SCE',
    'Edison International',
    'Edison',
    'Southern California Edison Company'
  ];
  
  for (const companyName of companyVariations) {
    console.log(`\n   🏢 Testing with company: "${companyName}"`);
    
    try {
      const params = new URLSearchParams({
        firstName: 'Michelle',
        lastName: 'Lee',
        companyName: companyName,
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
      
      if (response.ok) {
        const data = await response.json();
        
        if (data.contact && data.contact.data) {
          const contactData = data.contact.data;
          console.log(`     ✅ FOUND with "${companyName}"!`);
          console.log(`     👤 Name: ${contactData.fullName}`);
          console.log(`     💼 Title: ${contactData.jobTitle?.title || 'Not found'}`);
          console.log(`     🏢 Company: ${contactData.company?.name || 'Not found'}`);
          console.log(`     📧 Email: ${contactData.emailAddresses?.[0]?.email || 'Not found'}`);
          return; // Stop testing other variations
        } else if (data.contact && data.contact.error) {
          console.log(`     ❌ Not found with "${companyName}"`);
        } else {
          console.log(`     ⚠️ No data with "${companyName}"`);
        }
      } else {
        console.log(`     ❌ API Error: ${response.status}`);
      }
      
    } catch (error) {
      console.log(`     ❌ Exception: ${error.message}`);
    }
    
    // Wait between requests
    await new Promise(resolve => setTimeout(resolve, 1000));
  }
  
  console.log('\n');
}

// Run the verification
verifyMichelleLeeEmployment().catch(console.error);
