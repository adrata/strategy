#!/usr/bin/env node

/**
 * 🔍 DEBUG SPEEDRUN API SCRIPT
 * 
 * This script debugs the speedrun API to understand why it's failing.
 */

const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function debugSpeedrunAPI() {
  console.log('🔍 [DEBUG SPEEDRUN API] Debugging API issues...\n');

  try {
    const workspaceId = '01K1VBYXHD0J895XAN0HGFBKJP';
    const userId = '01K1VBYZMWTCT09FWEKBDMCXZM';

    console.log(`📊 [DEBUG] Testing with workspace: ${workspaceId}`);
    console.log(`👤 [DEBUG] Testing with user: ${userId}\n`);

    // 1. Test the exact database query that the API should be running
    console.log('🗄️ [DATABASE QUERY] Testing leads query:');
    
    const leadsQuery = {
      where: {
        workspaceId,
        assignedUserId: userId,
        status: { in: ['new', 'New', 'contacted', 'qualified', 'follow-up', 'active'] },
        deletedAt: null
      },
      select: {
        id: true,
        fullName: true,
        email: true,
        company: true,
        jobTitle: true,
        title: true,
        status: true,
        priority: true,
        estimatedValue: true,
        lastActionDate: true,
        lastContactDate: true,
        nextActionDate: true,
        updatedAt: true,
        accountId: true
      },
      orderBy: [
        { priority: 'asc' },
        { updatedAt: 'desc' }
      ],
      take: 50
    };

    console.log('   Query:', JSON.stringify(leadsQuery, null, 2));
    
    const leads = await prisma.leads.findMany(leadsQuery);
    console.log(`   Result: ${leads.length} leads found`);
    
    if (leads.length > 0) {
      console.log('   Sample lead:', JSON.stringify(leads[0], null, 2));
    }

    console.log('\n🗄️ [DATABASE QUERY] Testing prospects query:');
    
    const prospectsQuery = {
      where: {
        workspaceId,
        assignedUserId: userId,
        status: { in: ['new', 'New', 'identified', 'researching', 'Engaged', 'engaged'] },
        deletedAt: null
      },
      select: {
        id: true,
        fullName: true,
        email: true,
        company: true,
        jobTitle: true,
        title: true,
        status: true,
        priority: true,
        estimatedValue: true,
        lastActionDate: true,
        lastContactDate: true,
        nextActionDate: true,
        updatedAt: true
      },
      orderBy: [
        { priority: 'asc' },
        { updatedAt: 'desc' }
      ],
      take: 50
    };

    console.log('   Query:', JSON.stringify(prospectsQuery, null, 2));
    
    const prospects = await prisma.prospects.findMany(prospectsQuery);
    console.log(`   Result: ${prospects.length} prospects found`);
    
    if (prospects.length > 0) {
      console.log('   Sample prospect:', JSON.stringify(prospects[0], null, 2));
    }

    // 2. Test without status filtering to see what we get
    console.log('\n🔍 [NO FILTER TEST] Testing without status filter:');
    
    const allLeads = await prisma.leads.findMany({
      where: {
        workspaceId,
        assignedUserId: userId,
        deletedAt: null
      },
      select: {
        id: true,
        fullName: true,
        status: true,
        lastActionDate: true,
        lastContactDate: true
      }
    });

    const allProspects = await prisma.prospects.findMany({
      where: {
        workspaceId,
        assignedUserId: userId,
        deletedAt: null
      },
      select: {
        id: true,
        fullName: true,
        status: true,
        lastActionDate: true,
        lastContactDate: true
      }
    });

    console.log(`   All leads: ${allLeads.length}`);
    allLeads.forEach(lead => {
      console.log(`     - ${lead.fullName} (${lead.status}) - Last Action: ${lead.lastActionDate}, Last Contact: ${lead.lastContactDate}`);
    });

    console.log(`   All prospects: ${allProspects.length}`);
    allProspects.forEach(prospect => {
      console.log(`     - ${prospect.fullName} (${prospect.status}) - Last Action: ${prospect.lastActionDate}, Last Contact: ${prospect.lastContactDate}`);
    });

    // 3. Test the speedrun data transformation
    console.log('\n🔄 [TRANSFORMATION TEST] Testing speedrun data transformation:');
    
    if (leads.length > 0 || prospects.length > 0) {
      const speedrunItems = [
        ...leads.map((lead) => ({
          id: lead.id,
          type: 'lead',
          priority: lead.priority || 'medium',
          name: lead.fullName || 'Unknown',
          fullName: lead.fullName || 'Unknown',
          company: lead.company || 'Unknown Company',
          title: lead.title || lead.jobTitle || 'Unknown Title',
          status: lead.status,
          lastActionDate: lead.lastActionDate,
          lastContactDate: lead.lastContactDate,
          nextActionDate: lead.nextActionDate,
          estimatedValue: lead.estimatedValue,
          source: 'leads',
          urgency: lead.priority === 'high' ? 'high' : 'medium'
        })),
        ...prospects.map((prospect) => ({
          id: prospect.id,
          type: 'prospect',
          priority: prospect.priority || 'medium',
          name: prospect.fullName || 'Unknown',
          fullName: prospect.fullName || 'Unknown',
          company: prospect.company || 'Unknown Company',
          title: prospect.title || prospect.jobTitle || 'Unknown Title',
          status: prospect.status,
          lastActionDate: prospect.lastActionDate,
          lastContactDate: prospect.lastContactDate,
          nextActionDate: prospect.nextActionDate,
          estimatedValue: prospect.estimatedValue,
          source: 'prospects',
          urgency: prospect.priority === 'high' ? 'high' : 'medium'
        }))
      ];

      console.log(`   Transformed speedrun items: ${speedrunItems.length}`);
      if (speedrunItems.length > 0) {
        console.log('   Sample transformed item:', JSON.stringify(speedrunItems[0], null, 2));
      }
    }

    console.log('\n✅ [DEBUG COMPLETE]');

  } catch (error) {
    console.error('❌ [DEBUG ERROR]', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the debug
debugSpeedrunAPI().catch(console.error);
