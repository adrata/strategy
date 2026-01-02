/**
 * Enrich Dan's contacts - fill in missing phones using Lusha v2 GET API
 */

require('dotenv').config();
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

const WORKSPACE_ID = '01K7464TNANHQXPCZT1FYX205V';
const DAN_ID = '01K7B327HWN9G6KGWA97S1TK43';

async function enrichPhoneWithLusha(linkedinUrl) {
  try {
    const response = await fetch(`https://api.lusha.com/v2/person?linkedinUrl=${encodeURIComponent(linkedinUrl)}`, {
      method: 'GET',
      headers: {
        'api_key': process.env.LUSHA_API_KEY
      }
    });

    if (response.status === 429) {
      return { rateLimited: true };
    }

    if (response.status === 402) {
      return { outOfCredits: true };
    }

    if (!response.ok) {
      return null;
    }

    const data = await response.json();
    
    if (data.contact?.data?.phoneNumbers?.length) {
      const phones = data.contact.data.phoneNumbers;
      const mobile = phones.find(p => p.phoneType === 'mobile');
      const direct = phones.find(p => p.phoneType === 'direct' || p.phoneType === 'direct_dial');
      const work = phones.find(p => p.phoneType === 'work');
      
      const bestPhone = mobile || direct || work || phones[0];
      
      return {
        phone: bestPhone.number,
        phoneType: bestPhone.phoneType,
        creditCharged: data.contact.isCreditCharged
      };
    }
    
    return null;
  } catch (error) {
    console.log('   ❌ Lusha error:', error.message);
    return null;
  }
}

async function main() {
  console.log('\n🚀 Enriching Dan\'s contacts with missing phone numbers...\n');

  // Get people needing phone enrichment
  const people = await prisma.people.findMany({
    where: {
      workspaceId: WORKSPACE_ID,
      mainSellerId: DAN_ID,
      deletedAt: null,
      linkedinUrl: { not: null, not: '' },
      AND: [
        { OR: [{ phone: null }, { phone: '' }] },
        { OR: [{ mobilePhone: null }, { mobilePhone: '' }] },
        { OR: [{ workPhone: null }, { workPhone: '' }] }
      ]
    },
    include: { company: { select: { name: true } } },
    orderBy: { createdAt: 'desc' }
  });

  console.log(`📊 Found ${people.length} people needing phone enrichment\n`);

  let phonesFound = 0;
  let processed = 0;
  let rateLimited = false;
  let outOfCredits = false;
  let creditsUsed = 0;

  for (const person of people) {
    if (rateLimited || outOfCredits) break;
    
    processed++;
    
    console.log(`📊 ${processed}/${people.length}: ${person.fullName} @ ${person.company?.name || 'Unknown'}`);
    
    const result = await enrichPhoneWithLusha(person.linkedinUrl);
    
    if (result?.outOfCredits) {
      outOfCredits = true;
      console.log('\n❌ Out of Lusha credits - stopping\n');
      break;
    }
    
    if (result?.rateLimited) {
      rateLimited = true;
      console.log('\n⚠️ Rate limited - stopping. Run again later.\n');
      break;
    }
    
    if (result?.phone) {
      if (result.creditCharged) creditsUsed++;
      
      const updates = {};
      if (result.phoneType === 'mobile') {
        updates.mobilePhone = result.phone;
      } else {
        updates.workPhone = result.phone;
      }
      
      await prisma.people.update({
        where: { id: person.id },
        data: updates
      });
      
      phonesFound++;
      console.log(`   ✅ Phone: ${result.phone} (${result.phoneType})`);
    } else {
      console.log('   ⚠️ No phone found');
    }
    
    // Rate limit - 1 request per second
    await new Promise(r => setTimeout(r, 1000));
  }

  console.log('\n📊 PHONE ENRICHMENT COMPLETE:');
  console.log(`   Processed: ${processed}`);
  console.log(`   Phones found: ${phonesFound}`);
  console.log(`   Lusha credits used: ~${creditsUsed}`);
  
  await prisma.$disconnect();
}

main().catch(console.error);
