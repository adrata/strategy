#!/usr/bin/env node

/**
 * 🧪 TEST LUSHA ENRICHMENT FOR MICHELLE LEE - TOP
 * 
 * Test Lusha enrichment specifically for:
 * Michelle Lee
 * Southern California Edison Company
 */

const { PrismaClient } = require('@prisma/client');

async function testMichelleLeeLushaEnrichment() {
  console.log('🧪 TESTING LUSHA ENRICHMENT FOR MICHELLE LEE');
  console.log('==========================================\n');
  
  const apiKey = process.env.LUSHA_API_KEY;
  
  if (!apiKey) {
    console.log('❌ LUSHA_API_KEY not found in environment variables');
    console.log('   Please set LUSHA_API_KEY in your environment');
    return;
  }
  
  console.log('✅ Lusha API key found');
  
  // Test contact information
  const testContact = {
    name: 'Michelle Lee',
    company: 'Southern California Edison Company',
    companyDomain: 'sce.com', // Southern California Edison domain
    jobTitle: 'Executive', // We'll try different titles
    firstName: 'Michelle',
    lastName: 'Lee'
  };
  
  console.log(`🎯 Testing Lusha enrichment for:`);
  console.log(`   Name: ${testContact.name}`);
  console.log(`   Company: ${testContact.company}`);
  console.log(`   Domain: ${testContact.companyDomain}`);
  console.log(`   Job Title: ${testContact.jobTitle}\n`);
  
  // Test different approaches
  await testLushaPersonAPI(testContact, apiKey);
  await testLushaProspectingAPI(testContact, apiKey);
  await testLushaCompanyAPI(testContact, apiKey);
}

async function testLushaPersonAPI(contact, apiKey) {
  console.log('🔍 TEST 1: Lusha Person API (v2/person)');
  console.log('-'.repeat(40));
  
  try {
    const params = new URLSearchParams({
      firstName: contact.firstName,
      lastName: contact.lastName,
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
        'api_key': apiKey,
        'Content-Type': 'application/json'
      },
      timeout: 15000
    });
    
    console.log(`   📊 Response Status: ${response.status}`);
    
    if (response.ok) {
      const data = await response.json();
      
      console.log('\n   📋 LUSHA PERSON API RESPONSE:');
      console.log('   =============================');
      console.log(`   Full Name: ${data.fullName || 'Not found'}`);
      console.log(`   Job Title: ${data.jobTitle || 'Not found'}`);
      console.log(`   Company: ${data.company?.name || 'Not found'}`);
      console.log(`   LinkedIn: ${data.linkedinUrl || 'Not found'}`);
      
      // Email addresses
      if (data.emailAddresses && data.emailAddresses.length > 0) {
        console.log('\n   📧 EMAIL ADDRESSES:');
        data.emailAddresses.forEach((email, index) => {
          console.log(`     ${index + 1}. ${email.email} (type: ${email.type || 'unknown'})`);
        });
      } else {
        console.log('\n   📧 EMAIL ADDRESSES: None found');
      }
      
      // Phone numbers
      if (data.phoneNumbers && data.phoneNumbers.length > 0) {
        console.log('\n   📞 PHONE NUMBERS:');
        data.phoneNumbers.forEach((phone, index) => {
          console.log(`     ${index + 1}. ${phone.number} (type: ${phone.type || 'unknown'})`);
        });
      } else {
        console.log('\n   📞 PHONE NUMBERS: None found');
      }
      
      console.log('\n   ✅ Lusha Person API: SUCCESS');
      
    } else {
      const errorText = await response.text();
      console.log(`   ❌ Lusha Person API failed: ${response.status}`);
      console.log(`   Error: ${errorText}`);
    }
    
  } catch (error) {
    console.log(`   ❌ Lusha Person API error: ${error.message}`);
  }
  
  console.log('\n');
}

async function testLushaProspectingAPI(contact, apiKey) {
  console.log('🔍 TEST 2: Lusha Prospecting API (v2/prospecting/people)');
  console.log('-'.repeat(50));
  
  try {
    const requestBody = {
      company_domain: contact.companyDomain,
      job_title: contact.jobTitle,
      seniority: ['executive', 'c-suite', 'director']
    };
    
    console.log(`   🌐 API Call: https://api.lusha.com/v2/prospecting/people`);
    console.log(`   📋 Request Body:`, JSON.stringify(requestBody, null, 2));
    
    const response = await fetch('https://api.lusha.com/v2/prospecting/people', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(requestBody),
      timeout: 15000
    });
    
    console.log(`   📊 Response Status: ${response.status}`);
    
    if (response.ok) {
      const data = await response.json();
      
      console.log('\n   📋 LUSHA PROSPECTING API RESPONSE:');
      console.log('   ===================================');
      console.log(`   Total Results: ${data.data?.length || 0}`);
      
      if (data.data && data.data.length > 0) {
        // Look for Michelle Lee specifically
        const michelleLee = data.data.find(person => 
          person.fullName?.toLowerCase().includes('michelle') && 
          person.fullName?.toLowerCase().includes('lee')
        );
        
        if (michelleLee) {
          console.log('\n   🎯 FOUND MICHELLE LEE:');
          console.log('   =====================');
          console.log(`   Full Name: ${michelleLee.fullName}`);
          console.log(`   Job Title: ${michelleLee.jobTitle?.title || 'Not found'}`);
          console.log(`   Company: ${michelleLee.companyName}`);
          
          // Email addresses
          if (michelleLee.emailAddresses && michelleLee.emailAddresses.length > 0) {
            console.log('\n   📧 EMAIL ADDRESSES:');
            michelleLee.emailAddresses.forEach((email, index) => {
              console.log(`     ${index + 1}. ${email.email} (type: ${email.type || 'unknown'})`);
            });
          } else {
            console.log('\n   📧 EMAIL ADDRESSES: None found');
          }
          
          // Phone numbers
          if (michelleLee.phoneNumbers && michelleLee.phoneNumbers.length > 0) {
            console.log('\n   📞 PHONE NUMBERS:');
            michelleLee.phoneNumbers.forEach((phone, index) => {
              console.log(`     ${index + 1}. ${phone.number} (type: ${phone.type || 'unknown'})`);
            });
          } else {
            console.log('\n   📞 PHONE NUMBERS: None found');
          }
          
          console.log('\n   ✅ Found Michelle Lee in prospecting results!');
        } else {
          console.log('\n   ⚠️ Michelle Lee not found in prospecting results');
          console.log('   📋 Available executives:');
          data.data.slice(0, 5).forEach((person, index) => {
            console.log(`     ${index + 1}. ${person.fullName} - ${person.jobTitle?.title || 'Unknown title'}`);
          });
        }
      } else {
        console.log('\n   ⚠️ No executives found for Southern California Edison');
      }
      
    } else {
      const errorText = await response.text();
      console.log(`   ❌ Lusha Prospecting API failed: ${response.status}`);
      console.log(`   Error: ${errorText}`);
    }
    
  } catch (error) {
    console.log(`   ❌ Lusha Prospecting API error: ${error.message}`);
  }
  
  console.log('\n');
}

async function testLushaCompanyAPI(contact, apiKey) {
  console.log('🔍 TEST 3: Lusha Company API (v2/company)');
  console.log('-'.repeat(40));
  
  try {
    const params = new URLSearchParams({
      domain: contact.companyDomain
    });
    
    console.log(`   🌐 API Call: https://api.lusha.com/v2/company?${params}`);
    
    const response = await fetch(`https://api.lusha.com/v2/company?${params}`, {
      method: 'GET',
      headers: {
        'api_key': apiKey,
        'Content-Type': 'application/json'
      },
      timeout: 15000
    });
    
    console.log(`   📊 Response Status: ${response.status}`);
    
    if (response.ok) {
      const data = await response.json();
      
      console.log('\n   📋 LUSHA COMPANY API RESPONSE:');
      console.log('   =============================');
      console.log(`   Company Name: ${data.name || 'Not found'}`);
      console.log(`   Domain: ${data.domain || 'Not found'}`);
      console.log(`   Industry: ${data.industry || 'Not found'}`);
      console.log(`   Size: ${data.size || 'Not found'}`);
      console.log(`   Location: ${data.location || 'Not found'}`);
      
      // Check if we can find executives
      if (data.employees && data.employees.length > 0) {
        console.log('\n   👥 COMPANY EXECUTIVES:');
        data.employees.slice(0, 10).forEach((employee, index) => {
          console.log(`     ${index + 1}. ${employee.fullName} - ${employee.jobTitle || 'Unknown title'}`);
        });
        
        // Look for Michelle Lee
        const michelleLee = data.employees.find(emp => 
          emp.fullName?.toLowerCase().includes('michelle') && 
          emp.fullName?.toLowerCase().includes('lee')
        );
        
        if (michelleLee) {
          console.log('\n   🎯 FOUND MICHELLE LEE IN COMPANY DATA:');
          console.log('   ======================================');
          console.log(`   Full Name: ${michelleLee.fullName}`);
          console.log(`   Job Title: ${michelleLee.jobTitle || 'Not found'}`);
          console.log(`   Email: ${michelleLee.email || 'Not found'}`);
          console.log(`   Phone: ${michelleLee.phone || 'Not found'}`);
        }
      } else {
        console.log('\n   ⚠️ No employee data available');
      }
      
      console.log('\n   ✅ Lusha Company API: SUCCESS');
      
    } else {
      const errorText = await response.text();
      console.log(`   ❌ Lusha Company API failed: ${response.status}`);
      console.log(`   Error: ${errorText}`);
    }
    
  } catch (error) {
    console.log(`   ❌ Lusha Company API error: ${error.message}`);
  }
  
  console.log('\n');
}

// Run the test
testMichelleLeeLushaEnrichment().catch(console.error);
