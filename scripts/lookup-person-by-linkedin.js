#!/usr/bin/env node
/**
 * 🔍 PERSON LOOKUP BY LINKEDIN URL
 * 
 * Uses Lusha v2 API to enrich person data from a LinkedIn URL
 * This is the proven high-accuracy method used in buyer group intelligence
 * 
 * Usage: 
 *   node scripts/lookup-person-by-linkedin.js "https://www.linkedin.com/in/erin-kropp-a312589a/"
 * 
 * Or run directly with the URL hardcoded below
 */

require('dotenv').config();

// ============================================================
// TARGET PERSON - Edit this for your lookup
// ============================================================
const TARGET_LINKEDIN = process.argv[2] || 'https://www.linkedin.com/in/erin-kropp-a312589a/';
const TARGET_NAME = 'Erin Kropp';
const TARGET_TITLE = 'National Director of Operations';
const TARGET_COMPANY_NAME = 'One Real Title'; // or 'Real Title'
const TARGET_COMPANY_DOMAIN = 'onerealtitle.com';
const TARGET_COMPANY_LINKEDIN = 'https://www.linkedin.com/company/therealtitle/';

// ============================================================

async function lookupWithLushaLinkedIn(linkedinUrl, companyName, companyDomain) {
  const LUSHA_API_KEY = process.env.LUSHA_API_KEY?.trim();
  
  if (!LUSHA_API_KEY) {
    console.log('❌ LUSHA_API_KEY not found in environment variables');
    console.log('   Set it in your .env file');
    return null;
  }

  console.log(`🔗 Lusha LinkedIn lookup: ${linkedinUrl}\n`);
  console.log(`   Note: v2 GET endpoint may prioritize phone numbers\n`);
  
  try {
    // Method 1: Use the PROVEN Lusha v2 GET method (may prioritize phone)
    const response = await fetch(`https://api.lusha.com/v2/person?linkedinUrl=${encodeURIComponent(linkedinUrl)}`, {
      method: 'GET',
      headers: {
        'api_key': LUSHA_API_KEY,
        'Content-Type': 'application/json'
      }
    });

    if (response.status === 429) {
      console.log('⚠️ Rate limited - try again in a few seconds');
      return { error: 'rate_limited' };
    }

    if (response.status === 402) {
      console.log('❌ Out of Lusha credits');
      return { error: 'out_of_credits' };
    }

    if (!response.ok) {
      const errorText = await response.text();
      console.log(`⚠️ Lusha API error: ${response.status}`);
      console.log(`   ${errorText.substring(0, 200)}`);
      return null;
    }

    const data = await response.json();
    
    // Lusha v2 response format: { contact: { data: {...}, error: {...}, isCreditCharged: boolean } }
    if (data.contact?.data) {
      const personData = data.contact.data;
      console.log(`💳 Credit charged: ${data.contact.isCreditCharged}`);
      console.log(`   📧 Emails in response: ${personData.emailAddresses?.length || 0}`);
      console.log(`   📞 Phones in response: ${personData.phoneNumbers?.length || 0}`);
      console.log('');
      return {
        success: true,
        creditCharged: data.contact.isCreditCharged,
        person: personData
      };
    } else if (data.contact?.error) {
      console.log(`⚠️ Lusha lookup error: ${data.contact.error.message} (${data.contact.error.name})`);
      console.log(`💳 Credit charged: ${data.contact.isCreditCharged}`);
      return { error: data.contact.error.message };
    } else {
      console.log('⚠️ Unexpected response format');
      console.log(JSON.stringify(data, null, 2));
      return null;
    }
  } catch (error) {
    console.log(`❌ Error: ${error.message}`);
    return null;
  }
}

function formatPhoneNumber(number) {
  if (!number) return 'N/A';
  // Return as-is for now
  return number;
}

/**
 * Try Lusha POST method with name + company (alternative to LinkedIn URL method)
 * This method explicitly requests email data
 */
async function tryLushaNameCompanyLookup(firstName, lastName, companyName, companyDomain) {
  const LUSHA_API_KEY = process.env.LUSHA_API_KEY?.trim();
  if (!LUSHA_API_KEY || !firstName || !lastName) {
    return null;
  }

  console.log(`   🔍 Trying Lusha POST with name + company (email-focused)...`);

  try {
    // Method 1: POST with property.emailAddress to explicitly request email
    const response = await fetch('https://api.lusha.com/person', {
      method: 'POST',
      headers: {
        'api_key': LUSHA_API_KEY,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        firstName: firstName,
        lastName: lastName,
        ...(companyName ? { company: companyName } : {}),
        ...(companyDomain ? { companyDomain: companyDomain } : {}),
        property: {
          emailAddress: true  // Explicitly request email
        }
      })
    });

    if (response.ok) {
      const data = await response.json();
      
      // Lusha POST can return different formats:
      // 1. { data: {...} } - single person object
      // 2. { data: [...] } - array of results
      // 3. Direct person object
      
      let personData = null;
      if (Array.isArray(data.data)) {
        // Array of results - take first match
        personData = data.data[0];
        console.log(`      📊 Response is array with ${data.data.length} result(s), using first`);
      } else if (data.data && typeof data.data === 'object') {
        // Single person object
        personData = data.data;
        console.log(`      📊 Response is single person object`);
      } else {
        // Direct person object
        personData = data;
        console.log(`      📊 Response is direct person object`);
      }
      
      if (personData) {
        // Check for emails in various possible locations
        const emails = personData.emailAddresses || personData.emails || [];
        
        if (emails.length > 0) {
          const email = emails.find(e => (e.type === 'work' || e.emailType === 'work')) || emails[0];
          console.log(`      ✅ Found email via POST method: ${email.email || email.emailAddress}`);
          return {
            email: email.email || email.emailAddress,
            type: email.type || email.emailType || 'work',
            verified: email.verified || email.isVerified || false,
            source: 'lusha_name_company_post'
          };
        } else if (personData.email) {
          // Sometimes email is directly in the person object
          console.log(`      ✅ Found email directly in person object: ${personData.email}`);
          return {
            email: personData.email,
            type: 'work',
            verified: personData.emailVerified || false,
            source: 'lusha_name_company_post'
          };
        } else {
          console.log(`      ⚠️ No email found in POST response (checked emailAddresses, emails, email fields)`);
        }
      } else {
        console.log(`      ⚠️ Could not parse POST response structure`);
      }
    } else {
      const errorText = await response.text();
      console.log(`      ⚠️ POST method failed: ${response.status} - ${errorText.substring(0, 100)}`);
    }

    // Method 2: Try v1 GET with params (sometimes works better for email)
    console.log(`   🔍 Trying Lusha v1 GET with name + company...`);
    const getResponse = await fetch(`https://api.lusha.com/person?firstName=${encodeURIComponent(firstName)}&lastName=${encodeURIComponent(lastName)}${companyName ? `&company=${encodeURIComponent(companyName)}` : ''}${companyDomain ? `&companyDomain=${encodeURIComponent(companyDomain)}` : ''}`, {
      method: 'GET',
      headers: {
        'api-key': LUSHA_API_KEY,
        'Content-Type': 'application/json'
      }
    });

    if (getResponse.ok) {
      const getData = await getResponse.json();
      if (getData?.emailAddresses?.length > 0 || getData?.data?.emailAddresses?.length > 0) {
        const emails = getData.emailAddresses || getData.data?.emailAddresses || [];
        const email = emails.find(e => e.type === 'work') || emails[0];
        console.log(`      ✅ Found email via GET method`);
        return {
          email: email.email,
          type: email.type || 'work',
          verified: email.verified || email.isVerified || false,
          source: 'lusha_name_company_get'
        };
      }
    }
  } catch (error) {
    console.log(`      ⚠️ Error: ${error.message}`);
  }
  
  return null;
}

/**
 * Try CoreSignal for email discovery from LinkedIn profile
 */
async function tryCoreSignalEmailLookup(linkedinUrl, firstName, lastName) {
  const CORESIGNAL_API_KEY = process.env.CORESIGNAL_API_KEY?.trim();
  if (!CORESIGNAL_API_KEY || !linkedinUrl) {
    return null;
  }

  try {
    // First search for the person
    const searchUrl = 'https://api.coresignal.com/cdapi/v1/professional_network/member/search';
    const searchResponse = await fetch(searchUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${CORESIGNAL_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        linkedin_url: linkedinUrl,
        ...(firstName ? { first_name: firstName } : {}),
        ...(lastName ? { last_name: lastName } : {})
      })
    });

    if (searchResponse.ok) {
      const searchData = await searchResponse.json();
      if (searchData.data?.length > 0) {
        const memberId = searchData.data[0].id;
        
        // Get full profile
        const profileUrl = `https://api.coresignal.com/cdapi/v1/professional_network/member/collect/${memberId}`;
        const profileResponse = await fetch(profileUrl, {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${CORESIGNAL_API_KEY}`,
            'Content-Type': 'application/json'
          }
        });

        if (profileResponse.ok) {
          const profileData = await profileResponse.json();
          // CoreSignal returns email in professional_emails_collection
          const emails = profileData.professional_emails_collection || [];
          if (emails.length > 0) {
            const email = emails[0].professional_email;
            return {
              email: email,
              type: 'work',
              verified: true,
              source: 'coresignal'
            };
          }
        }
      }
    }
  } catch (error) {
    // Silent fail
  }
  
  return null;
}

/**
 * Try Prospeo for email discovery
 */
async function tryProspeoEmailLookup(firstName, lastName, companyDomain) {
  const PROSPEO_API_KEY = process.env.PROSPEO_API_KEY?.trim();
  if (!PROSPEO_API_KEY || !firstName || !lastName || !companyDomain) {
    return null;
  }

  try {
    const response = await fetch('https://api.prospeo.io/email-finder', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-KEY': PROSPEO_API_KEY
      },
      body: JSON.stringify({
        first_name: firstName,
        last_name: lastName,
        company_domain: companyDomain.replace(/^https?:\/\//, '').replace(/^www\./, '').split('/')[0]
      })
    });

    if (response.ok) {
      const data = await response.json();
      if (data.email?.email) {
        return {
          email: data.email.email,
          type: 'work',
          verified: true,
          source: 'prospeo'
        };
      }
    }
  } catch (error) {
    // Silent fail
  }
  
  return null;
}

async function main() {
  console.log('═══════════════════════════════════════════════════════════════');
  console.log('🔍 BUYER GROUP INTELLIGENCE - PERSON LOOKUP');
  console.log('═══════════════════════════════════════════════════════════════\n');
  
  console.log(`👤 Target: ${TARGET_NAME}`);
  console.log(`📋 Title: ${TARGET_TITLE}`);
  console.log(`🔗 LinkedIn: ${TARGET_LINKEDIN}`);
  console.log(`🏢 Company: ${TARGET_COMPANY_NAME}`);
  console.log(`🌐 Domain: ${TARGET_COMPANY_DOMAIN}\n`);
  console.log('───────────────────────────────────────────────────────────────\n');
  
  const result = await lookupWithLushaLinkedIn(TARGET_LINKEDIN, TARGET_COMPANY_NAME, TARGET_COMPANY_DOMAIN);
  
  if (!result || result.error) {
    console.log('\n═══════════════════════════════════════════════════════════════');
    console.log('❌ LOOKUP FAILED');
    console.log('═══════════════════════════════════════════════════════════════');
    return;
  }
  
  const person = result.person;
  
  console.log('═══════════════════════════════════════════════════════════════');
  console.log('✅ PERSON FOUND');
  console.log('═══════════════════════════════════════════════════════════════\n');
  
  // Basic Info
  console.log('📋 BASIC INFORMATION:');
  console.log('───────────────────────────────────────────────────────────────');
  console.log(`   Full Name:    ${person.fullName || 'N/A'}`);
  console.log(`   First Name:   ${person.firstName || 'N/A'}`);
  console.log(`   Last Name:    ${person.lastName || 'N/A'}`);
  
  // Handle jobTitle which can be object or string
  const jobTitle = typeof person.jobTitle === 'object' 
    ? person.jobTitle?.title || 'N/A'
    : person.jobTitle || 'N/A';
  const seniority = typeof person.jobTitle === 'object'
    ? person.jobTitle?.seniority || person.seniorityLevel || 'N/A'
    : person.seniorityLevel || 'N/A';
  const department = typeof person.jobTitle === 'object'
    ? person.jobTitle?.departments?.[0] || person.department || 'N/A'
    : person.department || 'N/A';
  
  console.log(`   Title:        ${jobTitle}`);
  console.log(`   Seniority:    ${seniority}`);
  console.log(`   Department:   ${department}`);
  console.log('');
  
  // Company Info
  console.log('🏢 COMPANY INFORMATION:');
  console.log('───────────────────────────────────────────────────────────────');
  const companyName = person.companyName || person.company?.name || TARGET_COMPANY_NAME || 'N/A';
  const companyDomain = person.companyDomain || person.company?.domain || TARGET_COMPANY_DOMAIN || 'N/A';
  const industry = person.industry || person.company?.industry || 'N/A';
  console.log(`   Company:      ${companyName}`);
  console.log(`   Domain:       ${companyDomain}`);
  console.log(`   Industry:     ${industry}`);
  console.log('');
  
  // Contact Info - THE KEY DATA
  console.log('📞 CONTACT INFORMATION:');
  console.log('───────────────────────────────────────────────────────────────');
  
  // Emails
  let emails = [];
  if (person.emailAddresses?.length > 0) {
    emails = person.emailAddresses.map(e => ({
      email: e.email,
      type: e.type || 'unknown',
      verified: e.isVerified || false,
      source: 'lusha_linkedin'
    }));
  }
  
  // If no emails from LinkedIn lookup, try alternative methods
  if (emails.length === 0) {
    console.log('   📧 Emails:    No emails found from LinkedIn lookup');
    console.log('   🔍 Trying alternative email discovery methods...\n');
    
    // Try Lusha POST method with name + company (now with company info)
    const alternativeEmail = await tryLushaNameCompanyLookup(
      person.firstName || TARGET_NAME.split(' ')[0],
      person.lastName || TARGET_NAME.split(' ').slice(1).join(' '),
      companyName !== 'N/A' ? companyName : TARGET_COMPANY_NAME,
      companyDomain !== 'N/A' ? companyDomain : TARGET_COMPANY_DOMAIN
    );
    
    if (alternativeEmail) {
      emails.push(alternativeEmail);
      console.log(`   ✅ Found email via Lusha name+company lookup: ${alternativeEmail.email}\n`);
    }
    
    // Try CoreSignal if available (often has email data from LinkedIn)
    if (emails.length === 0 && process.env.CORESIGNAL_API_KEY) {
      console.log(`   🔍 Trying CoreSignal (often has email from LinkedIn profiles)...`);
      const coresignalEmail = await tryCoreSignalEmailLookup(
        person.linkedinUrl || TARGET_LINKEDIN,
        person.firstName || TARGET_NAME.split(' ')[0],
        person.lastName || TARGET_NAME.split(' ').slice(1).join(' ')
      );
      
      if (coresignalEmail) {
        emails.push(coresignalEmail);
        console.log(`   ✅ Found email via CoreSignal: ${coresignalEmail.email}\n`);
      } else {
        console.log(`   ⚠️ CoreSignal did not return email\n`);
      }
    } else if (emails.length === 0 && !process.env.CORESIGNAL_API_KEY) {
      console.log(`   ⚠️ CoreSignal API key not available (often best source for emails)\n`);
    }
    
    // Try Prospeo if available
    if (emails.length === 0 && process.env.PROSPEO_API_KEY && companyDomain !== 'N/A') {
      const prospeoEmail = await tryProspeoEmailLookup(
        person.firstName || TARGET_NAME.split(' ')[0],
        person.lastName || TARGET_NAME.split(' ').slice(1).join(' '),
        companyDomain
      );
      
      if (prospeoEmail) {
        emails.push(prospeoEmail);
        console.log(`   ✅ Found email via Prospeo: ${prospeoEmail.email}\n`);
      }
    }
  }
  
  // Display emails
  if (emails.length > 0) {
    console.log('   📧 Emails Found:');
    emails.forEach((email, i) => {
      const verified = email.verified ? '✓ verified' : '';
      console.log(`      ${i + 1}. ${email.email} (${email.type}) ${verified} [${email.source}]`);
    });
  } else {
    console.log('   📧 Emails:    No emails found after trying all methods');
  }
  console.log('');
  
  // Phone Numbers
  if (person.phoneNumbers?.length > 0) {
    console.log('   📞 Phone Numbers:');
    person.phoneNumbers.forEach((phone, i) => {
      const type = phone.phoneType || phone.type || 'unknown';
      const doNotCall = phone.doNotCall ? '⚠️ DNC' : '';
      console.log(`      ${i + 1}. ${formatPhoneNumber(phone.number)} (${type}) ${doNotCall}`);
    });
  } else {
    console.log('   📞 Phone Numbers: No phone numbers found');
  }
  console.log('');
  
  // Location
  console.log('📍 LOCATION:');
  console.log('───────────────────────────────────────────────────────────────');
  if (person.location) {
    console.log(`   City:         ${person.location.city || 'N/A'}`);
    console.log(`   State:        ${person.location.state || 'N/A'}`);
    console.log(`   Country:      ${person.location.country || 'N/A'}`);
  } else if (person.city || person.state || person.country) {
    console.log(`   City:         ${person.city || 'N/A'}`);
    console.log(`   State:        ${person.state || 'N/A'}`);
    console.log(`   Country:      ${person.country || 'N/A'}`);
  } else {
    console.log('   Location not available');
  }
  console.log('');
  
  // LinkedIn
  console.log('🔗 SOCIAL PROFILES:');
  console.log('───────────────────────────────────────────────────────────────');
  console.log(`   LinkedIn:     ${person.linkedinUrl || TARGET_LINKEDIN}`);
  console.log('');
  
  console.log('═══════════════════════════════════════════════════════════════');
  console.log('📊 RAW DATA (for debugging):');
  console.log('═══════════════════════════════════════════════════════════════');
  console.log(JSON.stringify(person, null, 2));
}

main().catch(console.error);
