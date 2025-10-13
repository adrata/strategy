#!/usr/bin/env node

/**
 * 🗑️ CLEAR ADRATA WORKSPACE
 * 
 * Clears all existing data from the Adrata workspace in the new database
 */

const { PrismaClient } = require('@prisma/client');

const newPrisma = new PrismaClient();

async function clearAdrataWorkspace() {
  try {
    console.log('🗑️ Clearing Adrata workspace data...\n');
    
    await newPrisma.$connect();
    console.log('✅ Connected to new database!\n');

    // 1. Find Adrata workspace
    console.log('📋 FINDING ADRATA WORKSPACE:');
    const adrataWorkspace = await newPrisma.workspaces.findFirst({
      where: {
        name: {
          contains: 'Adrata',
          mode: 'insensitive'
        }
      }
    });
    
    if (!adratraWorkspace) {
      throw new Error('Adrata workspace not found!');
    }
    
    console.log(`✅ Found workspace: ${adratraWorkspace.name} (${adratraWorkspace.id})\n`);

    // 2. Get current counts
    console.log('📊 GETTING CURRENT COUNTS:');
    const companyCount = await newPrisma.companies.count({
      where: { workspaceId: adrataWorkspace.id }
    });
    
    const peopleCount = await newPrisma.people.count({
      where: { workspaceId: adrataWorkspace.id }
    });
    
    console.log(`   Companies to delete: ${companyCount}`);
    console.log(`   People to delete: ${peopleCount}\n`);

    // 3. Delete all companies
    console.log('🏢 DELETING ALL COMPANIES:');
    const deletedCompanies = await newPrisma.companies.deleteMany({
      where: { workspaceId: adrataWorkspace.id }
    });
    console.log(`✅ Deleted ${deletedCompanies.count} companies\n`);

    // 4. Delete all people
    console.log('👥 DELETING ALL PEOPLE:');
    const deletedPeople = await newPrisma.people.deleteMany({
      where: { workspaceId: adrataWorkspace.id }
    });
    console.log(`✅ Deleted ${deletedPeople.count} people\n`);

    // 5. Verify cleanup
    console.log('🔍 VERIFYING CLEANUP:');
    const remainingCompanies = await newPrisma.companies.count({
      where: { workspaceId: adrataWorkspace.id }
    });
    
    const remainingPeople = await newPrisma.people.count({
      where: { workspaceId: adrataWorkspace.id }
    });
    
    console.log(`   Remaining companies: ${remainingCompanies}`);
    console.log(`   Remaining people: ${remainingPeople}\n`);

    if (remainingCompanies === 0 && remainingPeople === 0) {
      console.log('🎉 Adrata workspace cleared successfully!');
      console.log('Ready for fresh data migration.');
    } else {
      console.log('⚠️  Some data may still remain. Please check manually.');
    }

  } catch (error) {
    console.error('❌ Error during cleanup:', error);
  } finally {
    await newPrisma.$disconnect();
  }
}

// Run the cleanup
clearAdrataWorkspace();
