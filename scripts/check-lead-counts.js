#!/usr/bin/env node

/**
 * Check Lead Counts for Notary Everyday and Dano
 */

const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: process.env.DATABASE_URL || process.env.POSTGRES_URL
    }
  }
});

async function getLeadCounts() {
  try {
    // Workspace IDs
    const notaryWorkspaceId = '01K1VBYmf75hgmvmz06psnc9ug'; // Notary Everyday
    const danoUserId = '01K1VBYYV7TRPY04NW4TW4XWRB'; // Dano's user ID
    
    console.log('🔍 LEAD COUNTS AUDIT');
    console.log('='.repeat(50));
    
    // Get Notary Everyday workspace info
    const notaryWorkspace = await prisma.workspace.findUnique({
      where: { id: notaryWorkspaceId },
      select: { id: true, name: true, slug: true }
    });
    
    console.log('📊 NOTARY EVERYDAY WORKSPACE:');
    console.log('Workspace:', notaryWorkspace?.name || 'Not Found');
    console.log('ID:', notaryWorkspaceId);
    
    // Count leads in Notary Everyday workspace
    const notaryLeadsCount = await prisma.people.count({
      where: {
        workspaceId: notaryWorkspaceId,
        deletedAt: null
      }
    });
    
    console.log('Total Leads:', notaryLeadsCount);
    
    // Count leads assigned to Dano in Notary Everyday
    const danoNotaryLeadsCount = await prisma.people.count({
      where: {
        workspaceId: notaryWorkspaceId,
        assignedUserId: danoUserId,
        deletedAt: null
      }
    });
    
    console.log('Leads assigned to Dano:', danoNotaryLeadsCount);
    
    console.log('\n' + '='.repeat(50));
    console.log('📊 DANO\'S TOTAL LEADS ACROSS ALL WORKSPACES:');
    
    // Count all leads assigned to Dano across all workspaces
    const danoTotalLeads = await prisma.people.count({
      where: {
        assignedUserId: danoUserId,
        deletedAt: null
      }
    });
    
    console.log('Total leads assigned to Dano:', danoTotalLeads);
    
    // Get breakdown by workspace
    const danoLeadsByWorkspace = await prisma.people.groupBy({
      by: ['workspaceId'],
      where: {
        assignedUserId: danoUserId,
        deletedAt: null
      },
      _count: { id: true }
    });
    
    console.log('\nBreakdown by workspace:');
    for (const group of danoLeadsByWorkspace) {
      const workspace = await prisma.workspace.findUnique({
        where: { id: group.workspaceId },
        select: { name: true }
      });
      console.log(`  ${workspace?.name || 'Unknown'}: ${group._count.id} leads`);
    }
    
    // Also check the leads table for comparison
    console.log('\n' + '='.repeat(50));
    console.log('📊 LEADS TABLE COMPARISON:');
    
    const notaryLeadsTableCount = await prisma.leads.count({
      where: {
        workspaceId: notaryWorkspaceId,
        deletedAt: null
      }
    });
    
    const danoLeadsTableCount = await prisma.leads.count({
      where: {
        assignedUserId: danoUserId,
        deletedAt: null
      }
    });
    
    console.log('Notary Everyday leads (leads table):', notaryLeadsTableCount);
    console.log('Dano leads (leads table):', danoLeadsTableCount);
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

getLeadCounts();
