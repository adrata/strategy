#!/usr/bin/env node

/**
 * 🔍 DATABASE DATA CHECK SCRIPT
 * 
 * This script checks what data is actually available in the database
 * to understand the current state and validate our API implementation.
 */

const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function checkDatabaseData() {
  console.log('🔍 [DATABASE CHECK] Checking available data...\n');

  try {
    // Check all workspaces
    console.log('🏢 [WORKSPACES] Available workspaces:');
    const workspaces = await prisma.workspaces.findMany({
      select: {
        id: true,
        name: true,
        createdAt: true
      },
      take: 5
    });
    
    workspaces.forEach(ws => {
      console.log(`   - ${ws.name} (${ws.id}) - Created: ${ws.createdAt}`);
    });

    // Check leads across all workspaces
    console.log('\n👥 [LEADS] Lead statistics:');
    const leadStats = await prisma.leads.groupBy({
      by: ['workspaceId', 'status'],
      _count: {
        id: true
      },
      where: {
        deletedAt: null
      }
    });

    const workspaceLeadCounts = {};
    leadStats.forEach(stat => {
      if (!workspaceLeadCounts[stat.workspaceId]) {
        workspaceLeadCounts[stat.workspaceId] = { total: 0, byStatus: {} };
      }
      workspaceLeadCounts[stat.workspaceId].total += stat._count.id;
      workspaceLeadCounts[stat.workspaceId].byStatus[stat.status] = stat._count.id;
    });

    Object.entries(workspaceLeadCounts).forEach(([workspaceId, counts]) => {
      console.log(`   Workspace ${workspaceId}: ${counts.total} total leads`);
      Object.entries(counts.byStatus).forEach(([status, count]) => {
        console.log(`     - ${status}: ${count} leads`);
      });
    });

    // Check prospects across all workspaces
    console.log('\n🎯 [PROSPECTS] Prospect statistics:');
    const prospectStats = await prisma.prospects.groupBy({
      by: ['workspaceId', 'status'],
      _count: {
        id: true
      },
      where: {
        deletedAt: null
      }
    });

    const workspaceProspectCounts = {};
    prospectStats.forEach(stat => {
      if (!workspaceProspectCounts[stat.workspaceId]) {
        workspaceProspectCounts[stat.workspaceId] = { total: 0, byStatus: {} };
      }
      workspaceProspectCounts[stat.workspaceId].total += stat._count.id;
      workspaceProspectCounts[stat.workspaceId].byStatus[stat.status] = stat._count.id;
    });

    Object.entries(workspaceProspectCounts).forEach(([workspaceId, counts]) => {
      console.log(`   Workspace ${workspaceId}: ${counts.total} total prospects`);
      Object.entries(counts.byStatus).forEach(([status, count]) => {
        console.log(`     - ${status}: ${count} prospects`);
      });
    });

    // Check for records with last action data
    console.log('\n📅 [LAST ACTION DATA] Records with action dates:');
    
    const leadsWithLastAction = await prisma.leads.count({
      where: {
        deletedAt: null,
        lastActionDate: { not: null }
      }
    });
    
    const leadsWithLastContact = await prisma.leads.count({
      where: {
        deletedAt: null,
        lastContactDate: { not: null }
      }
    });
    
    const prospectsWithLastAction = await prisma.prospects.count({
      where: {
        deletedAt: null,
        lastActionDate: { not: null }
      }
    });
    
    const prospectsWithLastContact = await prisma.prospects.count({
      where: {
        deletedAt: null,
        lastContactDate: { not: null }
      }
    });

    console.log(`   Leads with lastActionDate: ${leadsWithLastAction}`);
    console.log(`   Leads with lastContactDate: ${leadsWithLastContact}`);
    console.log(`   Prospects with lastActionDate: ${prospectsWithLastAction}`);
    console.log(`   Prospects with lastContactDate: ${prospectsWithLastContact}`);

    // Sample some records with last action data
    console.log('\n📋 [SAMPLE RECORDS] Sample records with last action data:');
    
    const sampleLeads = await prisma.leads.findMany({
      where: {
        deletedAt: null,
        OR: [
          { lastActionDate: { not: null } },
          { lastContactDate: { not: null } }
        ]
      },
      select: {
        id: true,
        fullName: true,
        status: true,
        lastActionDate: true,
        lastContactDate: true,
        assignedUserId: true,
        workspaceId: true
      },
      take: 5
    });

    sampleLeads.forEach((lead, index) => {
      console.log(`\n   ${index + 1}. ${lead.fullName} (${lead.status})`);
      console.log(`      Workspace: ${lead.workspaceId}`);
      console.log(`      Assigned User: ${lead.assignedUserId || 'None'}`);
      console.log(`      Last Action: ${lead.lastActionDate || 'null'}`);
      console.log(`      Last Contact: ${lead.lastContactDate || 'null'}`);
    });

    const sampleProspects = await prisma.prospects.findMany({
      where: {
        deletedAt: null,
        OR: [
          { lastActionDate: { not: null } },
          { lastContactDate: { not: null } }
        ]
      },
      select: {
        id: true,
        fullName: true,
        status: true,
        lastActionDate: true,
        lastContactDate: true,
        assignedUserId: true,
        workspaceId: true
      },
      take: 5
    });

    sampleProspects.forEach((prospect, index) => {
      console.log(`\n   ${index + 1}. ${prospect.fullName} (${prospect.status})`);
      console.log(`      Workspace: ${prospect.workspaceId}`);
      console.log(`      Assigned User: ${prospect.assignedUserId || 'None'}`);
      console.log(`      Last Action: ${prospect.lastActionDate || 'null'}`);
      console.log(`      Last Contact: ${prospect.lastContactDate || 'null'}`);
    });

    console.log('\n✅ [DATABASE CHECK COMPLETE]');

  } catch (error) {
    console.error('❌ [DATABASE ERROR]', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the check
checkDatabaseData().catch(console.error);
