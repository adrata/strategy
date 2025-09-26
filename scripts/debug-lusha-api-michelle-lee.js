#!/usr/bin/env node

/**
 * 🐛 DEBUG LUSHA API FOR MICHELLE LEE
 * 
 * Since she's found in Lusha dashboard, our API calls must be wrong
 * Let's debug the exact API call that should work
 */

const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));

// Load and clean environment variables
require('dotenv').config({ path: '.env.local' });

// Clean API keys (remove newlines and trim)
const LUSHA_API_KEY = process.env.LUSHA_API_KEY?.replace(/\\n/g, '').trim();

async function debugLushaAPI() {
  console.log('🐛 DEBUG LUSHA API FOR MICHELLE LEE');
  console.log('==================================\n');
  
  if (!LUSHA_API_KEY) {
    console.log('❌ LUSHA_API_KEY not found in environment variables');
    return;
  }
  
  console.log('✅ Lusha API key found');
  console.log(`   Key length: ${LUSHA_API_KEY.length} characters\n`);
  
  const linkedinUrl = 'https://www.linkedin.com/in/michelleleexue/';
  
  console.log(`🎯 Target: Michelle Lee via LinkedIn URL`);
  console.log(`   LinkedIn: ${linkedinUrl}\n`);
  
  // Test different API approaches
  await testLushaPersonAPIDebug(linkedinUrl);
  await testLushaProspectingAPIDebug();
  await testLushaCompanyAPIDebug();
  await testLushaAccountUsage();
}

async function testLushaPersonAPIDebug(linkedinUrl) {
  console.log('🔍 DEBUG 1: Lusha Person API (v2/person) - LinkedIn URL');
  console.log('-'.repeat(65));
  
  try {
    // Test with different parameter formats
    const testCases = [
      {
        name: 'Standard LinkedIn URL',
        params: new URLSearchParams({
          linkedinUrl: linkedinUrl,
          refreshJobInfo: 'true',
          revealEmails: 'true',
          revealPhones: 'true'
        })
      },
      {
        name: 'LinkedIn URL without refresh',
        params: new URLSearchParams({
          linkedinUrl: linkedinUrl,
          revealEmails: 'true',
          revealPhones: 'true'
        })
      },
      {
        name: 'LinkedIn URL minimal',
        params: new URLSearchParams({
          linkedinUrl: linkedinUrl
        })
      }
    ];
    
    for (const testCase of testCases) {
      console.log(`   🧪 Testing: ${testCase.name}`);
      console.log(`   🌐 API Call: https://api.lusha.com/v2/person?${testCase.params}`);
      
      const response = await fetch(`https://api.lusha.com/v2/person?${testCase.params}`, {
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
          console.log(`   ✅ SUCCESS with ${testCase.name}!`);
          console.log(`   👤 Name: ${data.fullName || 'Not provided'}`);
          console.log(`   💼 Title: ${data.jobTitle || 'Not provided'}`);
          console.log(`   🏢 Company: ${data.company?.name || 'Not provided'}`);
          console.log(`   📧 Emails: ${data.emailAddresses?.length || 0}`);
          console.log(`   📞 Phones: ${data.phoneNumbers?.length || 0}`);
          
          if (data.emailAddresses?.length > 0) {
            console.log(`   📧 Primary Email: ${data.emailAddresses[0].email}`);
          }
          
          if (data.phoneNumbers?.length > 0) {
            console.log(`   📞 Primary Phone: ${data.phoneNumbers[0].number}`);
          }
          
          console.log('\n   🎉 FOUND MICHELLE LEE!');
          return true;
        } else {
          console.log(`   ⚠️ No data found with ${testCase.name}`);
        }
      } else {
        const errorText = await response.text();
        console.log(`   ❌ API Error: ${response.status}`);
        console.log(`   Error: ${errorText}`);
      }
      
      console.log('');
      
      // Wait between requests
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
    
  } catch (error) {
    console.log(`   ❌ Exception: ${error.message}`);
  }
  
  console.log('\n');
  return false;
}

async function testLushaProspectingAPIDebug() {
  console.log('🔍 DEBUG 2: Lusha Prospecting API - Company Search');
  console.log('-'.repeat(50));
  
  try {
    // Try different prospecting approaches
    const testCases = [
      {
        name: 'Company domain search',
        body: {
          company_domain: 'sce.com',
          job_title: 'Engineer',
          seniority: ['individual_contributor', 'manager']
        }
      },
      {
        name: 'Company domain with broader search',
        body: {
          company_domain: 'sce.com',
          seniority: ['individual_contributor', 'manager', 'director']
        }
      },
      {
        name: 'Company domain with all roles',
        body: {
          company_domain: 'sce.com'
        }
      }
    ];
    
    for (const testCase of testCases) {
      console.log(`   🧪 Testing: ${testCase.name}`);
      console.log(`   📋 Request Body:`, JSON.stringify(testCase.body, null, 2));
      
      const response = await fetch('https://api.lusha.com/v2/prospecting/people', {
        method: 'POST',
        headers: {
          'api_key': LUSHA_API_KEY,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(testCase.body),
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
            console.log(`   ✅ FOUND MICHELLE LEE with ${testCase.name}!`);
            console.log(`   👤 Name: ${michelleLee.fullName}`);
            console.log(`   💼 Title: ${michelleLee.jobTitle?.title || 'Not found'}`);
            console.log(`   🏢 Company: ${michelleLee.companyName}`);
            console.log(`   📧 Emails: ${michelleLee.emailAddresses?.length || 0}`);
            console.log(`   📞 Phones: ${michelleLee.phoneNumbers?.length || 0}`);
            
            if (michelleLee.emailAddresses?.length > 0) {
              console.log(`   📧 Primary Email: ${michelleLee.emailAddresses[0].email}`);
            }
            
            if (michelleLee.phoneNumbers?.length > 0) {
              console.log(`   📞 Primary Phone: ${michelleLee.phoneNumbers[0].number}`);
            }
            
            console.log('\n   🎉 FOUND MICHELLE LEE!');
            return true;
          } else {
            console.log(`   ⚠️ Michelle Lee not found with ${testCase.name}`);
            console.log(`   📋 Found ${data.data.length} other people:`);
            data.data.slice(0, 5).forEach((person, index) => {
              console.log(`     ${index + 1}. ${person.fullName} - ${person.jobTitle?.title || 'Unknown title'}`);
            });
          }
        } else {
          console.log(`   ⚠️ No results with ${testCase.name}`);
        }
      } else {
        const errorText = await response.text();
        console.log(`   ❌ API Error: ${response.status}`);
        console.log(`   Error: ${errorText}`);
      }
      
      console.log('');
      
      // Wait between requests
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
    
  } catch (error) {
    console.log(`   ❌ Exception: ${error.message}`);
  }
  
  console.log('\n');
  return false;
}

async function testLushaCompanyAPIDebug() {
  console.log('🔍 DEBUG 3: Lusha Company API - SCE Company Data');
  console.log('-'.repeat(50));
  
  try {
    const params = new URLSearchParams({
      domain: 'sce.com'
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
      
      // Check if we can find employees
      if (data.employees && data.employees.length > 0) {
        console.log('\n   👥 COMPANY EMPLOYEES:');
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

async function testLushaAccountUsage() {
  console.log('🔍 DEBUG 4: Lusha Account Usage Check');
  console.log('-'.repeat(40));
  
  try {
    const response = await fetch('https://api.lusha.com/account/usage', {
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
      
      console.log('\n   📋 LUSHA ACCOUNT USAGE:');
      console.log('   =====================');
      console.log(`   Credits Used: ${data.creditsUsed || 'Not available'}`);
      console.log(`   Credits Remaining: ${data.creditsRemaining || 'Not available'}`);
      console.log(`   Plan Type: ${data.planType || 'Not available'}`);
      console.log(`   Billing Period: ${data.billingPeriod || 'Not available'}`);
      
      if (data.creditsRemaining === 0) {
        console.log('\n   ⚠️ WARNING: No credits remaining!');
      } else {
        console.log('\n   ✅ Credits available for API calls');
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

// Run the debug test
debugLushaAPI().catch(console.error);
