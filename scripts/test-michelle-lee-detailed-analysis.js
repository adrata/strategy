#!/usr/bin/env node

/**
 * 🔍 DETAILED LUSHA ANALYSIS FOR MICHELLE LEE
 * 
 * Deep dive into the response structure to understand what data we're getting
 */

const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));

// Load and clean environment variables
require('dotenv').config({ path: '.env.local' });

// Clean API keys (remove newlines and trim)
const LUSHA_API_KEY = process.env.LUSHA_API_KEY?.replace(/\\n/g, '').trim();

async function detailedAnalysis() {
  console.log('🔍 DETAILED LUSHA ANALYSIS FOR MICHELLE LEE');
  console.log('==========================================\n');
  
  if (!LUSHA_API_KEY) {
    console.log('❌ LUSHA_API_KEY not found');
    return;
  }
  
  console.log('✅ Lusha API key found\n');
  
  // Test the name + company method that worked
  await testNameCompanyMethod();
  
  // Test LinkedIn method with different parameters
  await testLinkedInMethodVariations();
}

async function testNameCompanyMethod() {
  console.log('🔍 METHOD 1: Name + Company (WORKING METHOD)');
  console.log('============================================');
  
  try {
    const params = new URLSearchParams({
      firstName: 'Michelle',
      lastName: 'Lee',
      companyName: 'Southern California Edison Company',
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
      
      console.log('\n   📋 FULL RESPONSE STRUCTURE:');
      console.log('   ==========================');
      console.log(JSON.stringify(data, null, 2));
      
      // Analyze the structure
      if (data.contact) {
        console.log('\n   🔍 CONTACT ANALYSIS:');
        console.log(`   Error: ${data.contact.error ? 'Yes' : 'No'}`);
        console.log(`   Credit Charged: ${data.contact.isCreditCharged}`);
        console.log(`   Has Data: ${!!data.contact.data}`);
        
        if (data.contact.data) {
          const contactData = data.contact.data;
          console.log('\n   📊 CONTACT DATA BREAKDOWN:');
          console.log(`   Full Name: ${contactData.fullName}`);
          console.log(`   Job Title Type: ${typeof contactData.jobTitle}`);
          console.log(`   Job Title: ${JSON.stringify(contactData.jobTitle)}`);
          console.log(`   Company: ${contactData.company?.name}`);
          console.log(`   LinkedIn: ${contactData.linkedinUrl}`);
          console.log(`   Location: ${contactData.location}`);
          
          if (contactData.emailAddresses) {
            console.log(`   Email Count: ${contactData.emailAddresses.length}`);
            contactData.emailAddresses.forEach((email, i) => {
              console.log(`     Email ${i+1}: ${email.email} (${email.type})`);
            });
          }
          
          if (contactData.phoneNumbers) {
            console.log(`   Phone Count: ${contactData.phoneNumbers.length}`);
            contactData.phoneNumbers.forEach((phone, i) => {
              console.log(`     Phone ${i+1}: ${phone.number} (${phone.type})`);
            });
          }
        }
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

async function testLinkedInMethodVariations() {
  console.log('🔍 METHOD 2: LinkedIn URL Variations');
  console.log('====================================');
  
  const linkedinUrl = 'https://www.linkedin.com/in/michelleleexue';
  
  // Test 1: Basic LinkedIn lookup
  console.log('\n   📋 Test 2A: Basic LinkedIn Lookup');
  await testLinkedInBasic(linkedinUrl);
  
  // Test 2: LinkedIn with minimal parameters
  console.log('\n   📋 Test 2B: LinkedIn with Minimal Parameters');
  await testLinkedInMinimal(linkedinUrl);
  
  // Test 3: LinkedIn with company context
  console.log('\n   📋 Test 2C: LinkedIn with Company Context');
  await testLinkedInWithCompany(linkedinUrl);
}

async function testLinkedInBasic(linkedinUrl) {
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

async function testLinkedInMinimal(linkedinUrl) {
  try {
    const params = new URLSearchParams({
      linkedinUrl: linkedinUrl,
      refreshJobInfo: 'true'
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

async function testLinkedInWithCompany(linkedinUrl) {
  try {
    const params = new URLSearchParams({
      linkedinUrl: linkedinUrl,
      companyName: 'Southern California Edison Company',
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

// Run the detailed analysis
detailedAnalysis().catch(console.error);
