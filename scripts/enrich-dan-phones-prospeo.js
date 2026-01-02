/**
 * Enrich Dan's contacts - fill in missing phones using Prospeo Mobile Finder
 */

require('dotenv').config();
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

const WORKSPACE_ID = '01K7464TNANHQXPCZT1FYX205V';
const DAN_ID = '01K7B327HWN9G6KGWA97S1TK43';

async function enrichPhoneWithProspeo(linkedinUrl) {
  try {
    const response = await fetch('https://api.prospeo.io/mobile-finder', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-KEY': process.env.PROSPEO_API_KEY
      },
      body: JSON.stringify({
        url: linkedinUrl
      })
    });

    if (response.status === 429) {
      return { rateLimited: true };
    }

    if (response.status === 402 || response.status === 403) {
      const data = await response.json();
      if (data.message?.includes('credits') || data.reason?.includes('credits')) {
        return { outOfCredits: true };
      }
    }

    if (!response.ok) {
      return null;
    }

    const data = await response.json();
    
    if (!data.error && data.response?.raw_format) {
      return {
        phone: data.response.international_format || data.response.raw_format,
        country: data.response.country_name
      };
    }
    
    return null;
  } catch (error) {
    console.log('   ❌ Prospeo error:', error.message);
    return null;
  }
}

async function main() {
  console.log('\n🚀 Enriching Dan\'s contacts with Prospeo Mobile Finder...\n');

  // Get people needing phone enrichment with valid LinkedIn URLs
  const people = await prisma.people.findMany({
    where: {
      workspaceId: WORKSPACE_ID,
      mainSellerId: DAN_ID,
      deletedAt: null,
      linkedinUrl: { contains: 'linkedin.com/in/' },
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

  for (const person of people) {
    if (rateLimited || outOfCredits) break;
    
    processed++;
    
    console.log(`📊 ${processed}/${people.length}: ${person.fullName} @ ${person.company?.name || 'Unknown'}`);
    
    const result = await enrichPhoneWithProspeo(person.linkedinUrl);
    
    if (result?.outOfCredits) {
      outOfCredits = true;
      console.log('\n❌ Out of Prospeo credits - stopping\n');
      break;
    }
    
    if (result?.rateLimited) {
      rateLimited = true;
      console.log('\n⚠️ Rate limited - stopping. Run again later.\n');
      break;
    }
    
    if (result?.phone) {
      await prisma.people.update({
        where: { id: person.id },
        data: { mobilePhone: result.phone }
      });
      
      phonesFound++;
      console.log(`   ✅ Mobile: ${result.phone} (${result.country})`);
    } else {
      console.log('   ⚠️ No mobile found');
    }
    
    // Rate limit - 500ms between requests
    await new Promise(r => setTimeout(r, 500));
  }

  console.log('\n📊 PROSPEO PHONE ENRICHMENT COMPLETE:');
  console.log(`   Processed: ${processed}`);
  console.log(`   Phones found: ${phonesFound}`);
  
  await prisma.$disconnect();
}

main().catch(console.error);


