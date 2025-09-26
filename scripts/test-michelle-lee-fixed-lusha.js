#!/usr/bin/env node

/**
 * 🎯 FIXED LUSHA TEST FOR MICHELLE LEE - TOP
 * 
 * Fixed authentication issues and uses proven working patterns
 */

const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));

// Load and clean environment variables
require('dotenv').config({ path: '.env.local' });

// Clean API keys (remove newlines and trim)
const LUSHA_API_KEY = process.env.LUSHA_API_KEY?.replace(/\\n/g, '').trim();

async function testMichelleLeeFixed() {
  console.log('🎯 FIXED LUSHA TEST FOR MICHELLE LEE');
  console.log('====================================\n');
  
  if (!LUSHA_API_KEY) {
    console.log('❌ LUSHA_API_KEY not found in environment variables');
    return;
  }
  
  console.log('✅ Lusha API key found');
  console.log(`   Key length: ${LUSHA_API_KEY.length} characters\n`);
  
  // Test contact information with multiple approaches
  const testContact = {
    name: 'Michelle Lee',
    company: 'Southern California Edison Company',
    companyDomain: 'sce.com',
    firstName: 'Michelle',
    lastName: 'Lee'
  };
  
  console.log(`🎯 Target Contact:`);
  console.log(`   Name: ${testContact.name}`);
  console.log(`   Company: ${testContact.company}`);
  console.log(`   Domain: ${testContact.companyDomain}\n`);
  
  // Test all working approaches
  await testLushaPersonAPI(testContact);
  await testLushaProspectingAPIFixed(testContact);
  await testLushaCompanyAPIFixed(testContact);
  await testLushaAlternativeSearch(testContact);
}

async function testLushaPersonAPI(contact) {
  console.log('🔍 TEST 1: Lusha Person API (v2/person) - Standard Search');
  console.log('-'.repeat(60));
  
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
        'api_key': LUSHA_API_KEY,
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
      
      if (data.fullName || data.emailAddresses?.length > 0 || data.phoneNumbers?.length > 0) {
        console.log('\n   ✅ SUCCESS: Found Michelle Lee!');
        return true;
      } else {
        console.log('\n   ⚠️ No data found for Michelle Lee');
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

async function testLushaProspectingAPIFixed(contact) {
  console.log('🔍 TEST 2: Lusha Prospecting API (v2/prospecting/people) - FIXED AUTH');
  console.log('-'.repeat(70));
  
  try {
    const requestBody = {
      company_domain: contact.companyDomain,
      job_title: 'Executive',
      seniority: ['executive', 'c-suite', 'director', 'manager']
    };
    
    console.log(`   🌐 API Call: https://api.lusha.com/v2/prospecting/people`);
    console.log(`   📋 Request Body:`, JSON.stringify(requestBody, null, 2));
    
    // Use the correct authentication method for prospecting API
    const response = await fetch('https://api.lusha.com/v2/prospecting/people', {
      method: 'POST',
      headers: {
        'api_key': LUSHA_API_KEY,  // Use api_key instead of Authorization Bearer
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
          
          console.log('\n   ✅ SUCCESS: Found Michelle Lee in prospecting results!');
          return true;
        } else {
          console.log('\n   ⚠️ Michelle Lee not found in prospecting results');
          console.log('   📋 Available executives:');
          data.data.slice(0, 10).forEach((person, index) => {
            console.log(`     ${index + 1}. ${person.fullName} - ${person.jobTitle?.title || 'Unknown title'}`);
          });
        }
      } else {
        console.log('\n   ⚠️ No executives found for Southern California Edison');
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

async function testLushaCompanyAPIFixed(contact) {
  console.log('🔍 TEST 3: Lusha Company API (v2/company) - FIXED');
  console.log('-'.repeat(50));
  
  try {
    const params = new URLSearchParams({
      domain: contact.companyDomain
    });
    
    console.log(`   🌐 API Call: https://api.lusha.com/v2/company?${params}`);
    
    const response = await fetch(`https://api.lusha.com/v2/company?${params}`, {
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
          return true;
        }
      } else {
        console.log('\n   ⚠️ No employee data available');
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

async function testLushaAlternativeSearch(contact) {
  console.log('🔍 TEST 4: Alternative Search Strategies');
  console.log('-'.repeat(45));
  
  // Try different name variations
  const nameVariations = [
    { firstName: 'Michelle', lastName: 'Lee' },
    { firstName: 'M', lastName: 'Lee' },
    { firstName: 'Michelle', lastName: 'L' }
  ];
  
  // Try different company variations
  const companyVariations = [
    'Southern California Edison Company',
    'Southern California Edison',
    'SCE',
    'Edison International',
    'Edison'
  ];
  
  for (const nameVar of nameVariations) {
    console.log(`   👤 Testing name: "${nameVar.firstName} ${nameVar.lastName}"`);
    
    for (const companyVar of companyVariations) {
      console.log(`     🏢 Testing company: "${companyVar}"`);
      
      try {
        const params = new URLSearchParams({
          firstName: nameVar.firstName,
          lastName: nameVar.lastName,
          companyName: companyVar,
          companyDomain: contact.companyDomain,
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
          
          if (data.fullName || data.emailAddresses?.length > 0 || data.phoneNumbers?.length > 0) {
            console.log(`       ✅ FOUND with "${nameVar.firstName} ${nameVar.lastName}" at "${companyVar}"!`);
            console.log(`       👤 Name: ${data.fullName || 'Not provided'}`);
            console.log(`       📧 Emails: ${data.emailAddresses?.length || 0}`);
            console.log(`       📞 Phones: ${data.phoneNumbers?.length || 0}`);
            
            if (data.emailAddresses?.length > 0) {
              console.log(`       📧 Primary Email: ${data.emailAddresses[0].email}`);
            }
            
            if (data.phoneNumbers?.length > 0) {
              console.log(`       📞 Primary Phone: ${data.phoneNumbers[0].number}`);
            }
            
            console.log('\n   🎉 SUCCESS: Found Michelle Lee with alternative search!');
            return true;
          } else {
            console.log(`       ⚠️ No data found`);
          }
        } else {
          console.log(`       ❌ API Error: ${response.status}`);
        }
        
      } catch (error) {
        console.log(`       ❌ Exception: ${error.message}`);
      }
      
      // Wait between requests to respect rate limits
      await new Promise(resolve => setTimeout(resolve, 500));
    }
  }
  
  console.log('\n');
  return false;
}

// Run the fixed test
testMichelleLeeFixed().catch(console.error);
