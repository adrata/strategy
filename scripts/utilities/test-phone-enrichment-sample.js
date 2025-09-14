#!/usr/bin/env node

/**
 * 🧪 TEST PHONE ENRICHMENT - SAMPLE
 * 
 * Test phone enrichment on a small sample of high-priority contacts
 */

const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function testPhoneEnrichmentSample() {
  console.log('🧪 TESTING PHONE ENRICHMENT - SAMPLE');
  console.log('====================================\n');
  
  try {
    await prisma.$connect();
    
    // Get top 5 decision makers without phone enrichment
    const sampleContacts = await prisma.contacts.findMany({
      where: {
        workspaceId: 'cmezxb1ez0001pc94yry3ntjk',
        assignedUserId: 'dano',
        buyerGroupRole: 'decision_maker',
        phoneEnrichmentSource: null
      },
      include: {
        accounts: {
          select: { website: true, name: true }
        }
      },
      orderBy: [
        { seniorityScore: 'desc' },
        { targetPriority: 'desc' }
      ],
      take: 5
    });
    
    console.log(`📋 Found ${sampleContacts.length} decision makers for testing:`);
    console.log('=======================================================\n');
    
    sampleContacts.forEach((contact, index) => {
      console.log(`${index + 1}. ${contact.fullName}`);
      console.log(`   🏢 Company: ${contact.accounts?.name || 'Unknown'}`);
      console.log(`   🌐 Website: ${contact.accounts?.website || 'No website'}`);
      console.log(`   💼 Title: ${contact.jobTitle}`);
      console.log(`   🎯 Role: ${contact.buyerGroupRole}`);
      console.log(`   📊 Seniority: ${contact.seniorityScore}/100`);
      console.log(`   ⭐ Priority: ${contact.targetPriority}/100`);
      console.log(`   📧 Email: ${contact.email || 'No email'}`);
      console.log(`   📞 Current Phone: ${contact.phone || 'No phone'}\n`);
    });
    
    console.log('🎯 PHONE ENRICHMENT RECOMMENDATIONS:');
    console.log('====================================');
    console.log('1. Set LUSHA_API_KEY in your .env file');
    console.log('2. Run: node enrich-contacts-with-phones.js');
    console.log('3. Start with these top 5 decision makers');
    console.log('4. Monitor phone data quality scores');
    console.log('5. Scale to all 379 discovered executives\n');
    
    // Show current phone field status
    const phoneStats = await prisma.contacts.aggregate({
      where: {
        workspaceId: 'cmezxb1ez0001pc94yry3ntjk',
        assignedUserId: 'dano'
      },
      _count: {
        phone: true,
        phone1: true,
        directDialPhone: true
      }
    });
    
    const totalContacts = await prisma.contacts.count({
      where: {
        workspaceId: 'cmezxb1ez0001pc94yry3ntjk',
        assignedUserId: 'dano'
      }
    });
    
    console.log('📊 CURRENT PHONE DATA STATUS:');
    console.log('=============================');
    console.log(`Total Dano's contacts: ${totalContacts}`);
    console.log(`Contacts with phone: ${phoneStats._count.phone}`);
    console.log(`Contacts with phone1: ${phoneStats._count.phone1}`);
    console.log(`Contacts with directDial: ${phoneStats._count.directDialPhone}`);
    console.log(`Phone enrichment opportunity: ${totalContacts - phoneStats._count.phone1} contacts\n`);
    
    await prisma.$disconnect();
    
  } catch (error) {
    console.error('❌ Test error:', error.message);
  }
}

testPhoneEnrichmentSample();
