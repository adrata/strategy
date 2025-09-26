#!/usr/bin/env node

/**
 * 🎯 LUSHA TEST WITH MICHELLE LEE'S LINKEDIN URL
 * 
 * Testing with her actual LinkedIn profile:
 * https://www.linkedin.com/in/michelleleexue/
 */

const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));

// Load and clean environment variables
require('dotenv').config({ path: '.env.local' });

// Clean API keys (remove newlines and trim)
const LUSHA_API_KEY = process.env.LUSHA_API_KEY?.replace(/\\n/g, '').trim();
const CORESIGNAL_API_KEY = process.env.CORESIGNAL_API_KEY?.replace(/\\n/g, '').trim();

async function testMichelleLeeLinkedIn() {
  console.log('🎯 LUSHA TEST WITH MICHELLE LEE\'S LINKEDIN URL');
  console.log('===============================================\n');
  
  if (!LUSHA_API_KEY) {
    console.log('❌ LUSHA_API_KEY not found in environment variables');
    return;
  }
  
  console.log('✅ Lusha API key found');
  console.log(`   Key length: ${LUSHA_API_KEY.length} characters\n`);
  
  // Michelle Lee's actual LinkedIn profile
  const linkedinUrl = 'https://www.linkedin.com/in/michelleleexue/';
  
  console.log(`🎯 Target Contact:`);
  console.log(`   Name: Michelle Lee`);
  console.log(`   LinkedIn: ${linkedinUrl}`);
  console.log(`   Company: Southern California Edison Company\n`);
  
  // Test Lusha with LinkedIn URL
  await testLushaWithLinkedIn(linkedinUrl);
  
  // Test CoreSignal with LinkedIn URL
  if (CORESIGNAL_API_KEY) {
    await testCoreSignalWithLinkedIn(linkedinUrl);
  }
  
  // Test why our previous searches failed
  await testWhyPreviousSearchesFailed();
}

async function testLushaWithLinkedIn(linkedinUrl) {
  console.log('🔍 TEST 1: Lusha Person API with LinkedIn URL');
  console.log('-'.repeat(55));
  
  try {
    const params = new URLSearchParams({
      linkedinUrl: linkedinUrl,
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
        console.log('\n   ✅ SUCCESS: Found Michelle Lee via LinkedIn!');
        return true;
      } else {
        console.log('\n   ⚠️ No data found even with LinkedIn URL');
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

async function testCoreSignalWithLinkedIn(linkedinUrl) {
  console.log('🔍 TEST 2: CoreSignal API with LinkedIn URL');
  console.log('-'.repeat(50));
  
  try {
    // Extract LinkedIn username from URL
    const linkedinUsername = linkedinUrl.split('/in/')[1]?.split('/')[0];
    console.log(`   🔍 LinkedIn Username: ${linkedinUsername}`);
    
    // Use CoreSignal v2 endpoint with LinkedIn URL
    const searchQuery = {
      query: {
        bool: {
          must: [
            {
              match: {
                "member_linkedin_url": linkedinUrl
              }
            }
          ]
        }
      },
      size: 5
    };
    
    console.log(`   🌐 API Call: https://api.coresignal.com/cdapi/v2/employee_multi_source/search/es_dsl`);
    
    const response = await fetch('https://api.coresignal.com/cdapi/v2/employee_multi_source/search/es_dsl', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${CORESIGNAL_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(searchQuery),
      timeout: 15000
    });
    
    console.log(`   📊 Response Status: ${response.status}`);
    
    if (response.ok) {
      const data = await response.json();
      console.log(`   📋 Found: ${data.hits?.length || 0} results`);
      
      if (data.hits && data.hits.length > 0) {
        const person = data.hits[0]._source;
        console.log('\n   ✅ CORE SIGNAL FOUND MICHELLE LEE:');
        console.log('   ==================================');
        console.log(`   👤 Name: ${person.member_full_name || 'Not provided'}`);
        console.log(`   💼 Title: ${person.member_position_title || 'Not provided'}`);
        console.log(`   🏢 Company: ${person.current_company_name || 'Not provided'}`);
        console.log(`   📧 Email: ${person.member_professional_email || 'Not found'}`);
        console.log(`   💼 LinkedIn: ${person.member_linkedin_url || 'Not found'}`);
        
        // Show email status if available
        if (person.member_professional_email_status) {
          console.log(`   📊 Email Status: ${person.member_professional_email_status}`);
        }
        
        return true;
      } else {
        console.log('\n   ⚠️ CoreSignal: No results found for LinkedIn URL');
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

async function testWhyPreviousSearchesFailed() {
  console.log('🔍 TEST 3: Why Previous Searches Failed');
  console.log('-'.repeat(45));
  
  console.log('   🤔 Possible reasons why Lusha/CoreSignal didn\'t find her:');
  console.log('   ======================================================');
  console.log('   1. Name variations in database:');
  console.log('      - "Michelle Lee" vs "Michelle L" vs "M. Lee"');
  console.log('      - Different spelling or formatting');
  console.log('   2. Company name variations:');
  console.log('      - "Southern California Edison Company" vs "SCE"');
  console.log('      - "Edison International" vs "Southern California Edison"');
  console.log('   3. Job title variations:');
  console.log('      - Exact title not matching database');
  console.log('      - Seniority level differences');
  console.log('   4. Data coverage:');
  console.log('      - Utility companies may have limited coverage');
  console.log('      - Privacy settings protecting contact info');
  console.log('   5. Search methodology:');
  console.log('      - Need exact name + company match');
  console.log('      - LinkedIn URL is most reliable method');
  
  console.log('\n   💡 Best practices for finding contacts:');
  console.log('   ======================================');
  console.log('   1. LinkedIn URL is the most reliable identifier');
  console.log('   2. Try multiple name variations');
  console.log('   3. Try multiple company name variations');
  console.log('   4. Use both Lusha and CoreSignal for coverage');
  console.log('   5. Manual LinkedIn research as fallback');
  
  console.log('\n');
}

// Run the LinkedIn test
testMichelleLeeLinkedIn().catch(console.error);
