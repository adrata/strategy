#!/usr/bin/env node

/**
 * 🗑️ REMOVE SBI WORKSPACE
 * 
 * Completely removes the SBI workspace and all its data
 */

const { PrismaClient } = require('@prisma/client');

const newPrisma = new PrismaClient();

async function removeSbiWorkspace() {
  try {
    console.log('🗑️ Removing SBI workspace...\n');
    
    await newPrisma.$connect();
    console.log('✅ Connected to database!\n');

    // 1. Find SBI workspace
    console.log('📋 FINDING SBI WORKSPACE:');
    const sbiWorkspace = await newPrisma.workspaces.findFirst({
      where: {
        name: {
          contains: 'SBI',
          mode: 'insensitive'
        }
      }
    });
    
    if (!sbiWorkspace) {
      console.log('❌ SBI workspace not found!');
      return;
    }
    
    console.log(`✅ Found workspace: ${sbiWorkspace.name} (${sbiWorkspace.id})\n`);

    // 2. Remove Victoria from SBI workspace
    console.log('👤 REMOVING VICTORIA FROM SBI WORKSPACE:');
    const victoria = await newPrisma.users.findFirst({
      where: {
        name: {
          contains: 'Victoria',
          mode: 'insensitive'
        }
      }
    });
    
    if (victoria) {
      await newPrisma.workspace_users.deleteMany({
        where: {
          workspaceId: sbiWorkspace.id,
          userId: victoria.id
        }
      });
      console.log(`✅ Removed Victoria from SBI workspace`);
    }

    // 3. Delete all workspace users
    console.log('\n👥 DELETING WORKSPACE USERS:');
    const deletedWorkspaceUsers = await newPrisma.workspace_users.deleteMany({
      where: { workspaceId: sbiWorkspace.id }
    });
    console.log(`✅ Deleted ${deletedWorkspaceUsers.count} workspace users`);

    // 4. Delete all companies
    console.log('\n🏢 DELETING COMPANIES:');
    const deletedCompanies = await newPrisma.companies.deleteMany({
      where: { workspaceId: sbiWorkspace.id }
    });
    console.log(`✅ Deleted ${deletedCompanies.count} companies`);

    // 5. Delete all people
    console.log('\n👥 DELETING PEOPLE:');
    const deletedPeople = await newPrisma.people.deleteMany({
      where: { workspaceId: sbiWorkspace.id }
    });
    console.log(`✅ Deleted ${deletedPeople.count} people`);

    // 6. Delete all actions
    console.log('\n📝 DELETING ACTIONS:');
    const deletedActions = await newPrisma.actions.deleteMany({
      where: { workspaceId: sbiWorkspace.id }
    });
    console.log(`✅ Deleted ${deletedActions.count} actions`);

    // 7. Delete all audit logs
    console.log('\n📊 DELETING AUDIT LOGS:');
    const deletedAuditLogs = await newPrisma.audit_logs.deleteMany({
      where: { workspaceId: sbiWorkspace.id }
    });
    console.log(`✅ Deleted ${deletedAuditLogs.count} audit logs`);

    // 8. Delete the workspace itself
    console.log('\n🗑️ DELETING WORKSPACE:');
    await newPrisma.workspaces.delete({
      where: { id: sbiWorkspace.id }
    });
    console.log(`✅ Deleted SBI workspace`);

    console.log('\n🎉 SBI workspace completely removed!');

  } catch (error) {
    console.error('❌ Error during SBI workspace removal:', error);
  } finally {
    await newPrisma.$disconnect();
  }
}

// Run the removal
removeSbiWorkspace();
