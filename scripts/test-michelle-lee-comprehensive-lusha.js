#!/usr/bin/env node

/**
 * 🎯 COMPREHENSIVE LUSHA TEST FOR MICHELLE LEE - TOP
 * 
 * Tests ALL Lusha API patterns to find Michelle Lee at Southern California Edison
 * Uses proven working patterns from our existing implementations
 */

const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));

// Load and clean environment variables
require('dotenv').config({ path: '.env.local' });

// Clean API keys (remove newlines and trim)
const LUSHA_API_KEY = process.env.LUSHA_API_KEY?.replace(/\\n/g, '').trim();

async function testMichelleLeeComprehensive() {
  console.log('🎯 COMPREHENSIVE LUSHA TEST FOR MICHELLE LEE');
  console.log('============================================\n');
  
  if (!LUSHA_API_KEY) {
    console.log('❌ LUSHA_API_KEY not found in environment variables');
    console.log('   Please set LUSHA_API_KEY in your environment');
    return;
  }
  
  console.log('✅ Lusha API key found');
  console.log(`   Key length: ${LUSHA_API_KEY.length} characters\n`);
  
  // Test contact information
  const testContact = {
    name: 'Michelle Lee',
    company: 'Southern California Edison Company',
    companyDomain: 'sce.com',
    firstName: 'Michelle',
    lastName: 'Lee',
    // Alternative company names that might work better
    alternativeCompanies: [
      'Southern California Edison',
      'SCE',
      'Edison International',
      'Edison'
    ],
    // Alternative job titles to try
    jobTitles: [
      'Executive',
      'Manager',
      'Director',
      'Vice President',
      'President',
      'CEO',
      'CFO',
      'COO'
    ]
  };
  
  console.log(`🎯 Target Contact:`);
  console.log(`   Name: ${testContact.name}`);
  console.log(`   Company: ${testContact.company}`);
  console.log(`   Domain: ${testContact.companyDomain}\n`);
  
  // Test all approaches
  await testLushaPersonAPI(testContact);
  await testLushaProspectingAPI(testContact);
  await testLushaCompanyAPI(testContact);
  await testLushaAlternativeCompanies(testContact);
  await testLushaAlternativeTitles(testContact);
  await testLushaLinkedInSearch(testContact);
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
}

async function testLushaProspectingAPI(contact) {
  console.log('🔍 TEST 2: Lusha Prospecting API (v2/prospecting/people)');
  console.log('-'.repeat(60));
  
  try {
    const requestBody = {
      company_domain: contact.companyDomain,
      job_title: 'Executive',
      seniority: ['executive', 'c-suite', 'director', 'manager']
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
}

async function testLushaCompanyAPI(contact) {
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
}

async function testLushaAlternativeCompanies(contact) {
  console.log('🔍 TEST 4: Lusha Person API - Alternative Company Names');
  console.log('-'.repeat(60));
  
  for (const altCompany of contact.alternativeCompanies) {
    console.log(`   🏢 Testing with company: "${altCompany}"`);
    
    try {
      const params = new URLSearchParams({
        firstName: contact.firstName,
        lastName: contact.lastName,
        companyName: altCompany,
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
          console.log(`     ✅ FOUND with company "${altCompany}"!`);
          console.log(`     👤 Name: ${data.fullName || 'Not provided'}`);
          console.log(`     📧 Emails: ${data.emailAddresses?.length || 0}`);
          console.log(`     📞 Phones: ${data.phoneNumbers?.length || 0}`);
          
          if (data.emailAddresses?.length > 0) {
            console.log(`     📧 Primary Email: ${data.emailAddresses[0].email}`);
          }
          
          if (data.phoneNumbers?.length > 0) {
            console.log(`     📞 Primary Phone: ${data.phoneNumbers[0].number}`);
          }
          
          console.log('\n   🎉 SUCCESS: Found Michelle Lee with alternative company name!');
          return; // Stop testing other companies
        } else {
          console.log(`     ⚠️ No data found with company "${altCompany}"`);
        }
      } else {
        console.log(`     ❌ API Error: ${response.status}`);
      }
      
    } catch (error) {
      console.log(`     ❌ Exception: ${error.message}`);
    }
    
    // Wait between requests to respect rate limits
    await new Promise(resolve => setTimeout(resolve, 1000));
  }
  
  console.log('\n');
}

async function testLushaAlternativeTitles(contact) {
  console.log('🔍 TEST 5: Lusha Prospecting API - Alternative Job Titles');
  console.log('-'.repeat(60));
  
  for (const jobTitle of contact.jobTitles) {
    console.log(`   💼 Testing with job title: "${jobTitle}"`);
    
    try {
      const requestBody = {
        company_domain: contact.companyDomain,
        job_title: jobTitle,
        seniority: ['executive', 'c-suite', 'director', 'manager']
      };
      
      const response = await fetch('https://api.lusha.com/v2/prospecting/people', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${LUSHA_API_KEY}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(requestBody),
        timeout: 15000
      });
      
      if (response.ok) {
        const data = await response.json();
        
        if (data.data && data.data.length > 0) {
          const michelleLee = data.data.find(person => 
            person.fullName?.toLowerCase().includes('michelle') && 
            person.fullName?.toLowerCase().includes('lee')
          );
          
          if (michelleLee) {
            console.log(`     ✅ FOUND Michelle Lee with title "${jobTitle}"!`);
            console.log(`     👤 Name: ${michelleLee.fullName}`);
            console.log(`     💼 Title: ${michelleLee.jobTitle?.title || 'Not found'}`);
            console.log(`     📧 Emails: ${michelleLee.emailAddresses?.length || 0}`);
            console.log(`     📞 Phones: ${michelleLee.phoneNumbers?.length || 0}`);
            
            if (michelleLee.emailAddresses?.length > 0) {
              console.log(`     📧 Primary Email: ${michelleLee.emailAddresses[0].email}`);
            }
            
            if (michelleLee.phoneNumbers?.length > 0) {
              console.log(`     📞 Primary Phone: ${michelleLee.phoneNumbers[0].number}`);
            }
            
            console.log('\n   🎉 SUCCESS: Found Michelle Lee with alternative job title!');
            return; // Stop testing other titles
          } else {
            console.log(`     ⚠️ No Michelle Lee found with title "${jobTitle}"`);
            console.log(`     📋 Found ${data.data.length} other executives`);
          }
        } else {
          console.log(`     ⚠️ No executives found with title "${jobTitle}"`);
        }
      } else {
        console.log(`     ❌ API Error: ${response.status}`);
      }
      
    } catch (error) {
      console.log(`     ❌ Exception: ${error.message}`);
    }
    
    // Wait between requests to respect rate limits
    await new Promise(resolve => setTimeout(resolve, 1000));
  }
  
  console.log('\n');
}

async function testLushaLinkedInSearch(contact) {
  console.log('🔍 TEST 6: Lusha LinkedIn URL Search (if available)');
  console.log('-'.repeat(50));
  
  // This would require a LinkedIn URL, which we don't have
  // But we can show how it would work
  console.log('   ℹ️ This test requires a LinkedIn URL for Michelle Lee');
  console.log('   If you have her LinkedIn URL, we can use it to get direct contact info');
  console.log('   Example: https://www.linkedin.com/in/michelle-lee-sce/');
  console.log('\n   📝 To use LinkedIn search:');
  console.log('   1. Find Michelle Lee\'s LinkedIn profile');
  console.log('   2. Use the LinkedIn URL with Lusha Person API');
  console.log('   3. This often provides the most accurate results');
  
  console.log('\n');
}

// Run the comprehensive test
testMichelleLeeComprehensive().catch(console.error);
