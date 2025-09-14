#!/usr/bin/env node

/**
 * 📊 MONITOR PHONE ENRICHMENT PROGRESS
 * 
 * Real-time monitoring of phone enrichment progress
 */

const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function monitorPhoneEnrichment() {
  console.log('📊 MONITORING PHONE ENRICHMENT PROGRESS');
  console.log('=======================================\n');
  
  try {
    await prisma.$connect();
    
    // Get overall stats
    const totalContacts = await prisma.contacts.count({
      where: {
        workspaceId: 'cmezxb1ez0001pc94yry3ntjk',
        assignedUserId: 'dano'
      }
    });
    
    const enrichedContacts = await prisma.contacts.count({
      where: {
        workspaceId: 'cmezxb1ez0001pc94yry3ntjk',
        assignedUserId: 'dano',
        phoneEnrichmentSource: 'lusha_v2_linkedin'
      }
    });
    
    const contactsWithPhones = await prisma.contacts.count({
      where: {
        workspaceId: 'cmezxb1ez0001pc94yry3ntjk',
        assignedUserId: 'dano',
        phone1: { not: null }
      }
    });
    
    const contactsWithDirectDial = await prisma.contacts.count({
      where: {
        workspaceId: 'cmezxb1ez0001pc94yry3ntjk',
        assignedUserId: 'dano',
        directDialPhone: { not: null }
      }
    });
    
    // Get phone stats by buyer group role
    const phonesByRole = await prisma.contacts.groupBy({
      by: ['buyerGroupRole'],
      where: {
        workspaceId: 'cmezxb1ez0001pc94yry3ntjk',
        assignedUserId: 'dano',
        phone1: { not: null }
      },
      _count: {
        id: true
      }
    });
    
    // Get recent discoveries
    const recentPhones = await prisma.contacts.findMany({
      where: {
        workspaceId: 'cmezxb1ez0001pc94yry3ntjk',
        assignedUserId: 'dano',
        phone1: { not: null }
      },
      select: {
        fullName: true,
        jobTitle: true,
        phone1: true,
        phone1Type: true,
        directDialPhone: true,
        phoneDataQuality: true,
        buyerGroupRole: true,
        phoneEnrichmentDate: true
      },
      orderBy: { phoneEnrichmentDate: 'desc' },
      take: 10
    });
    
    console.log('📊 OVERALL PROGRESS:');
    console.log('===================');
    console.log(`📋 Total Dano's contacts: ${totalContacts}`);
    console.log(`🔄 Enrichment attempted: ${enrichedContacts}`);
    console.log(`📞 Contacts with phones: ${contactsWithPhones}`);
    console.log(`🎯 Contacts with direct dial: ${contactsWithDirectDial}`);
    console.log(`📈 Phone discovery rate: ${((contactsWithPhones / enrichedContacts) * 100).toFixed(1)}%`);
    console.log(`📊 Overall completion: ${((enrichedContacts / totalContacts) * 100).toFixed(1)}%\n`);
    
    console.log('📞 PHONES BY BUYER GROUP ROLE:');
    console.log('==============================');
    phonesByRole.forEach(role => {
      console.log(`${role.buyerGroupRole}: ${role._count.id} contacts`);
    });
    console.log('');
    
    console.log('🏆 RECENT PHONE DISCOVERIES:');
    console.log('============================');
    recentPhones.forEach((contact, i) => {
      const enrichedTime = contact.phoneEnrichmentDate ? 
        new Date(contact.phoneEnrichmentDate).toLocaleTimeString() : 'Unknown';
      
      console.log(`${i+1}. ${contact.fullName} (${contact.jobTitle})`);
      console.log(`   📞 ${contact.phone1} (${contact.phone1Type})`);
      if (contact.directDialPhone) {
        console.log(`   🎯 Direct: ${contact.directDialPhone}`);
      }
      console.log(`   🎯 Role: ${contact.buyerGroupRole}`);
      console.log(`   📊 Quality: ${contact.phoneDataQuality}/100`);
      console.log(`   ⏰ Enriched: ${enrichedTime}\n`);
    });
    
    await prisma.$disconnect();
    
  } catch (error) {
    console.error('❌ Monitor error:', error.message);
  }
}

monitorPhoneEnrichment();
