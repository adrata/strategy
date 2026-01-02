const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../../.env.local') });
require('dotenv').config({ path: path.join(__dirname, '../../.env') });

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const CORESIGNAL_API_KEY = process.env.CORESIGNAL_API_KEY?.trim();
const LUSHA_API_KEY = process.env.LUSHA_API_KEY?.trim();

const ROLE_PRIORITY = {
  decision: 1,
  champion: 2,
  stakeholder: 3,
  blocker: 4,
  introducer: 5
};

async function enrichWithCoresignal(person) {
  if (!CORESIGNAL_API_KEY) {
    console.log('      ⚠️ Coresignal API key not configured');
    return null;
  }

  try {
    // Use the filter endpoint (simpler and more reliable)
    const searchUrl = 'https://api.coresignal.com/cdapi/v1/professional_network/member/search/filter';
    
    // Build search payload
    const searchPayload = {};
    
    if (person.linkedinUrl) {
      searchPayload.linkedin_url = person.linkedinUrl;
    } else if (person.email || person.workEmail) {
      searchPayload.primary_professional_email = person.email || person.workEmail;
    } else if (person.fullName && person.companyId) {
      const company = await prisma.companies.findUnique({
        where: { id: person.companyId },
        select: { name: true }
      });
      
      if (company) {
        const [firstName, ...lastNameParts] = person.fullName.split(' ');
        const lastName = lastNameParts.join(' ');
        searchPayload.first_name = firstName;
        searchPayload.last_name = lastName;
        searchPayload.company_name = company.name;
      }
    }

    if (Object.keys(searchPayload).length === 0) {
      return null;
    }

    const response = await fetch(searchUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${CORESIGNAL_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(searchPayload)
    });

    if (!response.ok) {
      if (response.status === 402) {
        console.log('      ⚠️ Coresignal out of credits');
        return { outOfCredits: true };
      }
      return null;
    }

    const searchResults = await response.json();
    
    if (!searchResults || searchResults.length === 0) {
      return null;
    }

    // Get the first (best) match
    const coresignalPerson = searchResults[0];
    const coresignalId = coresignalPerson.id;

    // Fetch detailed person data
    const detailsUrl = `https://api.coresignal.com/cdapi/v1/professional_network/member/collect/${coresignalId}`;
    
    const detailsResponse = await fetch(detailsUrl, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${CORESIGNAL_API_KEY}`,
        'Content-Type': 'application/json'
      }
    });

    if (!detailsResponse.ok) {
      return null;
    }

    const profile = await detailsResponse.json();
    
    // Extract email (prefer work email)
    const email = profile.primary_professional_email || 
                  profile.work_email || 
                  profile.email || 
                  null;
    
    // Extract phone (prefer work phone)
    const phone = profile.work_phone || 
                  profile.mobile_phone || 
                  profile.phone || 
                  null;
    
    // Extract LinkedIn
    const linkedinUrl = profile.linkedin_url || person.linkedinUrl;
    
    // Extract job title
    const jobTitle = profile.job_title || person.jobTitle;

    return {
      email,
      phone,
      linkedinUrl,
      jobTitle,
      source: 'coresignal'
    };
  } catch (error) {
    console.error(`      ❌ Coresignal error: ${error.message}`);
    return null;
  }
}

async function enrichWithLusha(person) {
  if (!LUSHA_API_KEY) {
    return null;
  }

  try {
    // Lusha requires LinkedIn URL
    if (!person.linkedinUrl) {
      return null;
    }

    const linkedinId = person.linkedinUrl.split('/in/')[1]?.split('/')[0];
    if (!linkedinId) {
      return null;
    }

    const company = person.companyId 
      ? await prisma.companies.findUnique({
          where: { id: person.companyId },
          select: { name: true, website: true }
        })
      : null;

    const [firstName, ...lastNameParts] = person.fullName.split(' ');
    const lastName = lastNameParts.join(' ');

    const response = await fetch('https://api.lusha.com/person', {
      method: 'POST',
      headers: {
        'api_key': LUSHA_API_KEY,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        firstName: firstName,
        lastName: lastName,
        company: company?.name || '',
        linkedInUrl: person.linkedinUrl
      })
    });

    if (response.ok) {
      const data = await response.json();
      if (data.data) {
        return {
          email: data.data.email || null,
          phone: data.data.phoneNumbers?.[0]?.number || null,
          phoneType: data.data.phoneNumbers?.[0]?.type || null,
          source: 'lusha'
        };
      }
    } else if (response.status === 402) {
      console.log('      ⚠️ Lusha out of credits');
      return { outOfCredits: true };
    } else if (response.status === 429) {
      console.log('      ⚠️ Lusha rate limited');
      return { rateLimited: true };
    }

    return null;
  } catch (error) {
    console.error(`      ❌ Lusha error: ${error.message}`);
    return null;
  }
}

async function enrichBuyerGroups() {
  const workspaceId = '01K7DNYR5VZ7JY36KGKKN76XZ1';
  
  const noel = await prisma.users.findFirst({
    where: { email: 'noel@notaryeveryday.com' }
  });
  
  if (!noel) {
    throw new Error('Noel (noel@notaryeveryday.com) not found');
  }

  console.log('🚀 BUYER GROUP ENRICHMENT WITH CORESIGNAL & LUSHA\n');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  // Get all people in buyer groups, prioritized by role
  const people = await prisma.people.findMany({
    where: {
      workspaceId,
      mainSellerId: noel.id,
      deletedAt: null,
      buyerGroupRole: { not: null }
    },
    include: {
      company: {
        select: {
          id: true,
          name: true,
          website: true
        }
      }
    },
    orderBy: [
      { buyerGroupRole: 'asc' } // This will prioritize decision, then champion, etc.
    ]
  });

  // Sort by role priority
  people.sort((a, b) => {
    const priorityA = ROLE_PRIORITY[a.buyerGroupRole] || 999;
    const priorityB = ROLE_PRIORITY[b.buyerGroupRole] || 999;
    return priorityA - priorityB;
  });

  console.log(`📊 Found ${people.length} people in buyer groups\n`);

  const stats = {
    processed: 0,
    emailsFound: 0,
    phonesFound: 0,
    linkedinFound: 0,
    failed: 0,
    skipped: 0,
    outOfCredits: false,
    rateLimited: false
  };

  for (const person of people) {
    if (stats.outOfCredits || stats.rateLimited) break;

    stats.processed++;
    const needsEmail = !person.email && !person.workEmail;
    const needsPhone = !person.phone && !person.workPhone && !person.mobilePhone;
    const needsLinkedIn = !person.linkedinUrl;

    if (!needsEmail && !needsPhone && !needsLinkedIn) {
      stats.skipped++;
      continue;
    }

    console.log(`\n${stats.processed}/${people.length}: ${person.fullName}`);
    console.log(`   Role: ${person.buyerGroupRole || 'N/A'}`);
    console.log(`   Company: ${person.company?.name || 'N/A'}`);
    console.log(`   Needs: ${needsEmail ? 'email ' : ''}${needsPhone ? 'phone ' : ''}${needsLinkedIn ? 'linkedin' : ''}`);

    const updates = {};
    let enriched = false;

    // Try Coresignal first (for LinkedIn, email, phone)
    if (needsLinkedIn || needsEmail || needsPhone) {
      console.log('   🔍 Trying Coresignal...');
      const coresignalData = await enrichWithCoresignal({
        ...person,
        companyId: person.company?.id
      });

      if (coresignalData) {
        if (needsLinkedIn && coresignalData.linkedinUrl) {
          updates.linkedinUrl = coresignalData.linkedinUrl;
          stats.linkedinFound++;
          enriched = true;
        }
        if (needsEmail && coresignalData.email) {
          updates.workEmail = coresignalData.email;
          stats.emailsFound++;
          enriched = true;
        }
        if (needsPhone && coresignalData.phone) {
          updates.workPhone = coresignalData.phone;
          stats.phonesFound++;
          enriched = true;
        }
        if (coresignalData.jobTitle && !person.jobTitle) {
          updates.jobTitle = coresignalData.jobTitle;
        }
      }

      // Rate limit: 1 request per second for Coresignal
      await new Promise(r => setTimeout(r, 1000));
    }

    // Try Lusha for email/phone (if still needed)
    if ((needsEmail || needsPhone) && person.linkedinUrl && !stats.outOfCredits) {
      console.log('   🔍 Trying Lusha...');
      const lushaData = await enrichWithLusha({
        ...person,
        companyId: person.company?.id
      });

      if (lushaData?.outOfCredits) {
        stats.outOfCredits = true;
        console.log('\n❌ Out of Lusha credits - stopping enrichment\n');
        break;
      }

      if (lushaData?.rateLimited) {
        stats.rateLimited = true;
        console.log('\n⚠️ Rate limited - stopping enrichment. Run again later.\n');
        break;
      }

      if (lushaData) {
        if (needsEmail && lushaData.email && !updates.workEmail) {
          updates.workEmail = lushaData.email;
          stats.emailsFound++;
          enriched = true;
        }
        if (needsPhone && lushaData.phone && !updates.workPhone) {
          if (lushaData.phoneType === 'mobile') {
            updates.mobilePhone = lushaData.phone;
          } else {
            updates.workPhone = lushaData.phone;
          }
          stats.phonesFound++;
          enriched = true;
        }
      }

      // Rate limit: 1 request per second for Lusha
      await new Promise(r => setTimeout(r, 1000));
    }

    // Update database if we found new data
    if (Object.keys(updates).length > 0) {
      try {
        await prisma.people.update({
          where: { id: person.id },
          data: updates
        });
        console.log(`   ✅ Updated: ${Object.keys(updates).join(', ')}`);
      } catch (error) {
        console.error(`   ❌ Update failed: ${error.message}`);
        stats.failed++;
      }
    } else if (!enriched) {
      console.log('   ⚠️ No data found');
    }
  }

  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('📊 ENRICHMENT COMPLETE:');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
  console.log(`   Processed: ${stats.processed}`);
  console.log(`   Skipped (already complete): ${stats.skipped}`);
  console.log(`   Emails Found: ${stats.emailsFound}`);
  console.log(`   Phones Found: ${stats.phonesFound}`);
  console.log(`   LinkedIn Found: ${stats.linkedinFound}`);
  console.log(`   Failed: ${stats.failed}`);
  if (stats.outOfCredits) {
    console.log(`\n   ⚠️ Stopped early: Out of Lusha credits`);
  }
  if (stats.rateLimited) {
    console.log(`\n   ⚠️ Stopped early: Rate limited`);
  }
  console.log('');

  await prisma.$disconnect();
}

enrichBuyerGroups().catch(console.error);
