#!/usr/bin/env node

/**
 * 🗑️ REMOVE D'ASTI AND CULTURE CULZ WORKSPACES
 * 
 * Removes "D'Asti Maritime Services" and "Culture Culz" workspaces from Dan's account
 * Also removes all people associated with D'Asti workspace (4 people)
 */

const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function removeWorkspaces() {
  try {
    console.log('🗑️ Removing D\'Asti and Culture Culz workspaces...\n');
    
    await prisma.$connect();
    console.log('✅ Connected to database!\n');

    // 1. Find Dan's user
    console.log('👤 FINDING DAN\'S USER:');
    const danUser = await prisma.users.findFirst({
      where: {
        email: 'dan@adrata.com'
      }
    });
    
    if (!danUser) {
      console.log('❌ Dan user not found!');
      return;
    }
    
    console.log(`✅ Found Dan: ${danUser.name} (${danUser.id})\n`);

    // 2. Find D'Asti Maritime Services workspace
    console.log('📋 FINDING D\'ASTI MARITIME SERVICES WORKSPACE:');
    const dastiWorkspace = await prisma.workspaces.findFirst({
      where: {
        name: {
          contains: "D'Asti",
          mode: 'insensitive'
        }
      }
    });
    
    if (!dastiWorkspace) {
      console.log('❌ D\'Asti workspace not found!');
    } else {
      console.log(`✅ Found workspace: ${dastiWorkspace.name} (${dastiWorkspace.id})\n`);
    }

    // 3. Find Culture Culz workspace
    console.log('📋 FINDING CULTURE CULZ WORKSPACE:');
    const cultureWorkspace = await prisma.workspaces.findFirst({
      where: {
        name: {
          contains: 'Culture Culz',
          mode: 'insensitive'
        }
      }
    });
    
    if (!cultureWorkspace) {
      console.log('❌ Culture Culz workspace not found!');
    } else {
      console.log(`✅ Found workspace: ${cultureWorkspace.name} (${cultureWorkspace.id})\n`);
    }

    // 4. Find and delete people associated with D'Asti workspace
    if (dastiWorkspace) {
      console.log('👥 FINDING PEOPLE ASSOCIATED WITH D\'ASTI:');
      const dastiPeople = await prisma.people.findMany({
        where: {
          workspaceId: dastiWorkspace.id
        },
        select: {
          id: true,
          firstName: true,
          lastName: true,
          email: true
        }
      });
      
      console.log(`✅ Found ${dastiPeople.length} people associated with D'Asti:`);
      dastiPeople.forEach((person, index) => {
        const name = `${person.firstName || ''} ${person.lastName || ''}`.trim() || 'Unknown';
        console.log(`   ${index + 1}. ${name} (${person.email || 'no email'}) - ${person.id}`);
      });
      console.log('');

      // Delete people
      console.log('🗑️ DELETING PEOPLE FROM D\'ASTI WORKSPACE:');
      const deletedPeople = await prisma.people.deleteMany({
        where: {
          workspaceId: dastiWorkspace.id
        }
      });
      console.log(`✅ Deleted ${deletedPeople.count} people\n`);
    }

    // 5. Delete all companies from both workspaces
    if (dastiWorkspace) {
      console.log('🏢 DELETING COMPANIES FROM D\'ASTI:');
      const deletedCompaniesDasti = await prisma.companies.deleteMany({
        where: { workspaceId: dastiWorkspace.id }
      });
      console.log(`✅ Deleted ${deletedCompaniesDasti.count} companies from D'Asti`);
    }

    if (cultureWorkspace) {
      console.log('🏢 DELETING COMPANIES FROM CULTURE CULZ:');
      const deletedCompaniesCulture = await prisma.companies.deleteMany({
        where: { workspaceId: cultureWorkspace.id }
      });
      console.log(`✅ Deleted ${deletedCompaniesCulture.count} companies from Culture Culz`);
    }

    // 6. Delete all actions from both workspaces
    if (dastiWorkspace) {
      console.log('\n📝 DELETING ACTIONS FROM D\'ASTI:');
      const deletedActionsDasti = await prisma.actions.deleteMany({
        where: { workspaceId: dastiWorkspace.id }
      });
      console.log(`✅ Deleted ${deletedActionsDasti.count} actions from D'Asti`);
    }

    if (cultureWorkspace) {
      console.log('📝 DELETING ACTIONS FROM CULTURE CULZ:');
      const deletedActionsCulture = await prisma.actions.deleteMany({
        where: { workspaceId: cultureWorkspace.id }
      });
      console.log(`✅ Deleted ${deletedActionsCulture.count} actions from Culture Culz`);
    }

    // 7. Delete workspace users associations
    if (dastiWorkspace) {
      console.log('\n👥 DELETING WORKSPACE USERS FROM D\'ASTI:');
      const deletedWorkspaceUsersDasti = await prisma.workspace_users.deleteMany({
        where: { workspaceId: dastiWorkspace.id }
      });
      console.log(`✅ Deleted ${deletedWorkspaceUsersDasti.count} workspace user associations from D'Asti`);
    }

    if (cultureWorkspace) {
      console.log('👥 DELETING WORKSPACE USERS FROM CULTURE CULZ:');
      const deletedWorkspaceUsersCulture = await prisma.workspace_users.deleteMany({
        where: { workspaceId: cultureWorkspace.id }
      });
      console.log(`✅ Deleted ${deletedWorkspaceUsersCulture.count} workspace user associations from Culture Culz`);
    }

    // 8. Delete the workspaces themselves
    if (dastiWorkspace) {
      console.log('\n🗑️ DELETING D\'ASTI WORKSPACE:');
      await prisma.workspaces.delete({
        where: { id: dastiWorkspace.id }
      });
      console.log(`✅ Deleted D'Asti workspace`);
    }

    if (cultureWorkspace) {
      console.log('🗑️ DELETING CULTURE CULZ WORKSPACE:');
      await prisma.workspaces.delete({
        where: { id: cultureWorkspace.id }
      });
      console.log(`✅ Deleted Culture Culz workspace`);
    }

    console.log('\n🎉 Workspace removal complete!');

  } catch (error) {
    console.error('❌ Error during workspace removal:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Run the removal
removeWorkspaces();

