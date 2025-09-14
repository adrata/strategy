#!/usr/bin/env node

/**
 * Script to verify data assignment to Dano worked correctly
 */

const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: process.env.DATABASE_URL || process.env.POSTGRES_URL
    }
  }
});

const WORKSPACE_ID = '01K1VBYV8ETM2RCQA4GNN9EG72';
const DANO_USER_ID = '01K1VBYYV7TRPY04NW4TW4XWRB';

async function main() {
  console.log('🔍 Verifying data assignment to Dano...');
  
  try {
    await prisma.$connect();
    
    // Check accounts
    const accountsCount = await prisma.account.count({
      where: {
        workspaceId: WORKSPACE_ID,
        assignedUserId: DANO_USER_ID,
        deletedAt: null
      }
    });
    console.log(`📊 Accounts assigned to Dano: ${accountsCount}`);
    
    // Check contacts
    const contactsCount = await prisma.contact.count({
      where: {
        workspaceId: WORKSPACE_ID,
        assignedUserId: DANO_USER_ID
      }
    });
    console.log(`👥 Contacts assigned to Dano: ${contactsCount}`);
    
    // Check prospects
    const prospectsCount = await prisma.prospect.count({
      where: {
        workspaceId: WORKSPACE_ID,
        assignedUserId: DANO_USER_ID,
        deletedAt: null
      }
    });
    console.log(`🎯 Prospects assigned to Dano: ${prospectsCount}`);
    
    // Check leads
    const leadsCount = await prisma.lead.count({
      where: {
        workspaceId: WORKSPACE_ID,
        assignedUserId: DANO_USER_ID
      }
    });
    console.log(`📈 Leads assigned to Dano: ${leadsCount}`);
    
    // Check opportunities
    const opportunitiesCount = await prisma.opportunity.count({
      where: {
        workspaceId: WORKSPACE_ID,
        assignedUserId: DANO_USER_ID
      }
    });
    console.log(`💰 Opportunities assigned to Dano: ${opportunitiesCount}`);
    
    console.log('\n🔍 Sample account query (same as Pipeline API):');
    const sampleAccounts = await prisma.account.findMany({
      where: {
        workspaceId: WORKSPACE_ID,
        assignedUserId: DANO_USER_ID,
        deletedAt: null
      },
      take: 5,
      select: {
        id: true,
        name: true,
        assignedUserId: true,
        workspaceId: true
      }
    });
    console.log(`Found ${sampleAccounts.length} accounts:`, sampleAccounts);
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

main();
