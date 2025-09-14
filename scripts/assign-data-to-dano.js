#!/usr/bin/env node

/**
 * Script to assign all data in the retail product solutions workspace to Dano
 * This will update assignedUserId fields across all relevant tables
 */

const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: process.env.DATABASE_URL || process.env.POSTGRES_URL
    }
  }
});

// Dano's details from the investigation
const WORKSPACE_ID = '01K1VBYV8ETM2RCQA4GNN9EG72';
const DANO_USER_ID = '01K1VBYYV7TRPY04NW4TW4XWRB';
const DANO_EMAIL = 'dano@retail-products.com';

async function main() {
  console.log('🚀 Starting data assignment to Dano...');
  console.log(`📋 Workspace ID: ${WORKSPACE_ID}`);
  console.log(`👤 User ID: ${DANO_USER_ID}`);
  console.log(`📧 Email: ${DANO_EMAIL}`);
  
  try {
    // Connect to database
    await prisma.$connect();
    console.log('✅ Connected to database');

    // First, let's verify the workspace and user exist
    const workspace = await prisma.workspace.findUnique({
      where: { id: WORKSPACE_ID },
      select: { id: true, name: true }
    });
    
    if (!workspace) {
      console.error('❌ Workspace not found!');
      return;
    }
    
    console.log(`✅ Found workspace: ${workspace.name || workspace.id}`);

    const user = await prisma.user.findUnique({
      where: { id: DANO_USER_ID },
      select: { id: true, name: true, email: true }
    });
    
    if (!user) {
      console.error('❌ User not found!');
      return;
    }
    
    console.log(`✅ Found user: ${user.name || user.email}`);

    // Update accounts
    console.log('\n📊 Updating accounts...');
    const accountsResult = await prisma.account.updateMany({
      where: {
        workspaceId: WORKSPACE_ID,
        // Update all accounts in workspace regardless of current assignment
      },
      data: {
        assignedUserId: DANO_USER_ID
      }
    });
    console.log(`✅ Updated ${accountsResult.count} accounts`);

    // Update contacts
    console.log('\n👥 Updating contacts...');
    const contactsResult = await prisma.contact.updateMany({
      where: {
        workspaceId: WORKSPACE_ID,
      },
      data: {
        assignedUserId: DANO_USER_ID
      }
    });
    console.log(`✅ Updated ${contactsResult.count} contacts`);

    // Update prospects
    console.log('\n🎯 Updating prospects...');
    const prospectsResult = await prisma.prospect.updateMany({
      where: {
        workspaceId: WORKSPACE_ID,
      },
      data: {
        assignedUserId: DANO_USER_ID
      }
    });
    console.log(`✅ Updated ${prospectsResult.count} prospects`);

    // Update leads
    console.log('\n📈 Updating leads...');
    const leadsResult = await prisma.lead.updateMany({
      where: {
        workspaceId: WORKSPACE_ID,
      },
      data: {
        assignedUserId: DANO_USER_ID
      }
    });
    console.log(`✅ Updated ${leadsResult.count} leads`);

    // Update opportunities
    console.log('\n💰 Updating opportunities...');
    const opportunitiesResult = await prisma.opportunity.updateMany({
      where: {
        workspaceId: WORKSPACE_ID,
      },
      data: {
        assignedUserId: DANO_USER_ID
      }
    });
    console.log(`✅ Updated ${opportunitiesResult.count} opportunities`);

    // Summary
    console.log('\n🎉 Data assignment completed!');
    console.log('📊 Summary:');
    console.log(`   • Accounts: ${accountsResult.count}`);
    console.log(`   • Contacts: ${contactsResult.count}`);
    console.log(`   • Prospects: ${prospectsResult.count}`);
    console.log(`   • Leads: ${leadsResult.count}`);
    console.log(`   • Opportunities: ${opportunitiesResult.count}`);
    
    const totalRecords = accountsResult.count + contactsResult.count + prospectsResult.count + leadsResult.count + opportunitiesResult.count;
    console.log(`   • Total: ${totalRecords} records assigned to Dano`);

  } catch (error) {
    console.error('❌ Error during data assignment:', error);
  } finally {
    await prisma.$disconnect();
    console.log('🔌 Disconnected from database');
  }
}

main()
  .catch((error) => {
    console.error('❌ Script failed:', error);
    process.exit(1);
  });
