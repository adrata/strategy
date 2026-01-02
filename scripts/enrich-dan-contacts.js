/**
 * Enrich Dan's contacts - fill in missing emails and phones using Lusha v2 API
 */

require('dotenv').config();
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

const WORKSPACE_ID = '01K7464TNANHQXPCZT1FYX205V';
const DAN_ID = '01K7B327HWN9G6KGWA97S1TK43';

async function enrichWithLusha(person, contactId) {
  // Only use LinkedIn URL for v2 API
  if (!person.linkedinUrl) return null;
  
  const contacts = [{
    contactId: contactId,
    linkedinUrl: person.linkedinUrl.replace(/\/$/, '')
  }];
  
  try {
    const response = await fetch('https://api.lusha.com/v2/person', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'api_key': process.env.LUSHA_API_KEY
      },
      body: JSON.stringify({ contacts })
    });

    if (response.status === 429) {
      console.log('   ⚠️ Lusha rate limit hit');
      return { rateLimited: true };
    }

    if (response.status === 402) {
      console.log('   ❌ Lusha out of credits');
      return { outOfCredits: true };
    }

    if (!response.ok) {
      const errorText = await response.text();
      console.log(`   ⚠️ Lusha API error: ${response.status} - ${errorText.slice(0, 100)}`);
      return null;
    }

    const data = await response.json();
    
    // Check each contact result
    for (const [id, result] of Object.entries(data.contacts || {})) {
      if (result.data) {
        const personData = result.data;
        return {
          email: personData.emailAddresses?.[0]?.email || null,
          phone: personData.phoneNumbers?.[0]?.localizedNumber || 
                 personData.phoneNumbers?.[0]?.internationalNumber || null,
          phoneType: personData.phoneNumbers?.[0]?.type || null,
          creditCharged: result.isCreditCharged
        };
      }
    }
    
    return null;
  } catch (error) {
    console.log('   ❌ Lusha error:', error.message);
    return null;
  }
}

async function main() {
  console.log('\n🚀 Enriching Dan\'s contacts with missing data...\n');

  // Get people needing enrichment (missing email OR phone)
  const people = await prisma.people.findMany({
    where: {
      workspaceId: WORKSPACE_ID,
      mainSellerId: DAN_ID,
      deletedAt: null,
      OR: [
        { email: null },
        { email: '' },
        { AND: [
          { OR: [{ phone: null }, { phone: '' }] },
          { OR: [{ mobilePhone: null }, { mobilePhone: '' }] },
          { OR: [{ workPhone: null }, { workPhone: '' }] }
        ]}
      ]
    },
    include: { company: { select: { name: true, website: true } } },
    orderBy: { createdAt: 'desc' }
  });

  console.log(`📊 Found ${people.length} people needing enrichment\n`);

  let emailsFound = 0;
  let phonesFound = 0;
  let processed = 0;
  let rateLimited = false;
  let outOfCredits = false;
  let creditsUsed = 0;

  for (const person of people) {
    if (rateLimited || outOfCredits) break;
    
    processed++;
    const needsEmail = !person.email;
    const needsPhone = !person.phone && !person.mobilePhone && !person.workPhone;
    
    if (!needsEmail && !needsPhone) continue;
    
    // Must have LinkedIn URL for Lusha v2
    if (!person.linkedinUrl) {
      console.log('   ⚠️ No LinkedIn URL - skipping');
      continue;
    }
    
    console.log(`📊 ${processed}/${people.length}: ${person.fullName} @ ${person.company?.name || 'Unknown'}`);
    console.log(`   Needs: ${needsEmail ? 'email' : ''} ${needsPhone ? 'phone' : ''}`);
    
    const result = await enrichWithLusha(person, person.id);
    
    if (result?.outOfCredits) {
      outOfCredits = true;
      console.log('\n❌ Out of Lusha credits - stopping enrichment\n');
      break;
    }
    
    if (result?.rateLimited) {
      rateLimited = true;
      console.log('\n⚠️ Rate limited - stopping enrichment. Run again later.\n');
      break;
    }
    
    if (result) {
      const updates = {};
      
      if (result.creditCharged) creditsUsed++;
      
      if (needsEmail && result.email) {
        updates.email = result.email;
        emailsFound++;
        console.log(`   ✅ Email: ${result.email}`);
      }
      
      if (needsPhone && result.phone) {
        if (result.phoneType === 'mobile') {
          updates.mobilePhone = result.phone;
        } else {
          updates.workPhone = result.phone;
        }
        phonesFound++;
        console.log(`   ✅ Phone: ${result.phone} (${result.phoneType || 'unknown'})`);
      }
      
      if (Object.keys(updates).length > 0) {
        await prisma.people.update({
          where: { id: person.id },
          data: updates
        });
      } else {
        console.log('   ⚠️ No data found');
      }
    } else {
      console.log('   ⚠️ No data found');
    }
    
    // Rate limit - 1 request per second
    await new Promise(r => setTimeout(r, 1000));
  }

  console.log('\n📊 ENRICHMENT COMPLETE:');
  console.log(`   Processed: ${processed}`);
  console.log(`   Emails found: ${emailsFound}`);
  console.log(`   Phones found: ${phonesFound}`);
  console.log(`   Lusha credits used: ~${creditsUsed}`);
  
  await prisma.$disconnect();
}

main().catch(console.error);
