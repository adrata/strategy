#!/usr/bin/env node

/**
 * 📞 Enrich Noel's buyer group people with phone numbers using Lusha v2 API
 * Uses LinkedIn URLs for accurate phone discovery
 */

const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../../.env.local') });
require('dotenv').config({ path: path.join(__dirname, '../../.env') });

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const ROLE_PRIORITY = {
  decision: 1,
  champion: 2,
  stakeholder: 3,
  blocker: 4,
  introducer: 5
};

async function enrichPhoneWithLusha(linkedinUrl) {
  try {
    const response = await fetch(`https://api.lusha.com/v2/person?linkedinUrl=${encodeURIComponent(linkedinUrl)}`, {
      method: 'GET',
      headers: {
        'api_key': process.env.LUSHA_API_KEY?.trim()
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
  console.log('\n' + '═'.repeat(70));
  console.log('   📞 ENRICHING NOEL\'S BUYER GROUP WITH PHONE NUMBERS');
  console.log('═'.repeat(70) + '\n');

  // Find Noel
  const noel = await prisma.users.findFirst({
    where: { email: 'noel@notaryeveryday.com' }
  });

  if (!noel) {
    throw new Error('Noel (noel@notaryeveryday.com) not found');
  }

  console.log(`✅ Found Noel: ${noel.name} (${noel.id})\n`);

  // Find workspace
  const workspace = await prisma.workspaces.findFirst({
    where: {
      OR: [
        { name: { contains: 'Notary Everyday', mode: 'insensitive' } },
        { slug: { contains: 'notary-everyday', mode: 'insensitive' } }
      ]
    }
  });

  if (!workspace) {
    throw new Error('Notary Everyday workspace not found');
  }

  console.log(`✅ Found Workspace: ${workspace.name} (${workspace.id})\n`);

  // Get people needing phone enrichment (prioritize by role)
  const people = await prisma.people.findMany({
    where: {
      workspaceId: workspace.id,
      mainSellerId: noel.id,
      deletedAt: null,
      buyerGroupRole: { not: null },
      linkedinUrl: { not: null, not: '' },
      AND: [
        { OR: [{ phone: null }, { phone: '' }] },
        { OR: [{ mobilePhone: null }, { mobilePhone: '' }] },
        { OR: [{ workPhone: null }, { workPhone: '' }] }
      ]
    },
    include: { 
      company: { 
        select: { name: true } 
      } 
    },
    orderBy: { buyerGroupRole: 'asc' }
  });

  // Sort by role priority
  people.sort((a, b) => {
    const priorityA = ROLE_PRIORITY[a.buyerGroupRole] || 999;
    const priorityB = ROLE_PRIORITY[b.buyerGroupRole] || 999;
    return priorityA - priorityB;
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
    
    const roleEmoji = {
      decision: '👔',
      champion: '⭐',
      stakeholder: '👤',
      blocker: '🚧',
      introducer: '🤝'
    }[person.buyerGroupRole] || '👤';
    
    console.log(`📊 [${processed}/${people.length}] ${roleEmoji} ${person.fullName}`);
    console.log(`   💼 ${person.jobTitle || 'N/A'} @ ${person.company?.name || 'Unknown'}`);
    console.log(`   🔗 ${person.linkedinUrl}`);
    
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
        console.log(`   ✅ Mobile Phone: ${result.phone}`);
      } else {
        updates.workPhone = result.phone;
        console.log(`   ✅ Work Phone: ${result.phone} (${result.phoneType})`);
      }
      
      await prisma.people.update({
        where: { id: person.id },
        data: updates
      });
      
      phonesFound++;
    } else {
      console.log('   ⚠️ No phone found');
    }
    
    console.log(''); // Empty line for readability
    
    // Rate limit - 1 request per second
    await new Promise(r => setTimeout(r, 1000));
  }

  console.log('\n' + '═'.repeat(70));
  console.log('   📊 PHONE ENRICHMENT COMPLETE');
  console.log('═'.repeat(70));
  console.log(`\n   Processed: ${processed}`);
  console.log(`   Phones found: ${phonesFound}`);
  console.log(`   Lusha credits used: ~${creditsUsed}`);
  if (outOfCredits) {
    console.log(`\n   ⚠️ Stopped early: Out of Lusha credits`);
  }
  if (rateLimited) {
    console.log(`\n   ⚠️ Stopped early: Rate limited`);
  }
  console.log('');
  
  await prisma.$disconnect();
}

main().catch(console.error);
