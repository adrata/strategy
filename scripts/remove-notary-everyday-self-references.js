#!/usr/bin/env node

/**
 * REMOVE NOTARY EVERYDAY SELF-REFERENCES
 * 
 * Removes companies and people named "Notary Everyday" from the Notary Everyday workspace
 * as these represent the business itself (should be users/workspace) rather than prospects.
 * 
 * This script performs hard deletion of:
 * - Related actions
 * - People records
 * - Company records
 */

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function removeNotaryEverydaySelfReferences() {
  let transaction = null;
  
  try {
    console.log('🔍 Starting Notary Everyday self-reference removal...\n');
    
    // Find the Notary Everyday workspace
    const workspace = await prisma.workspaces.findFirst({
      where: {
        OR: [
          { name: { contains: 'Notary Everyday', mode: 'insensitive' } },
          { slug: { contains: 'notary-everyday', mode: 'insensitive' } }
        ]
      }
    });
    
    if (!workspace) {
      console.log('❌ Notary Everyday workspace not found!');
      return;
    }
    
    console.log(`✅ Found workspace: ${workspace.name} (${workspace.id})\n`);
    
    // Find companies named "Notary Everyday"
    const companies = await prisma.companies.findMany({
      where: {
        workspaceId: workspace.id,
        name: {
          contains: 'Notary Everyday',
          mode: 'insensitive'
        },
        deletedAt: null
      },
      select: {
        id: true,
        name: true,
        website: true,
        domain: true,
        createdAt: true
      }
    });
    
    // Find people named "Notary Everyday"
    const people = await prisma.people.findMany({
      where: {
        workspaceId: workspace.id,
        OR: [
          { fullName: { contains: 'Notary Everyday', mode: 'insensitive' } },
          { firstName: { contains: 'Notary Everyday', mode: 'insensitive' } },
          { lastName: { contains: 'Notary Everyday', mode: 'insensitive' } }
        ],
        deletedAt: null
      },
      select: {
        id: true,
        fullName: true,
        firstName: true,
        lastName: true,
        email: true,
        jobTitle: true,
        companyId: true,
        createdAt: true
      }
    });
    
    console.log(`📊 Found ${companies.length} companies and ${people.length} people to remove\n`);
    
    if (companies.length === 0 && people.length === 0) {
      console.log('✅ No self-references found. Nothing to remove.');
      return;
    }
    
    // Show what will be deleted
    if (companies.length > 0) {
      console.log('🏢 Companies to remove:');
      companies.forEach((company, index) => {
        console.log(`   ${index + 1}. ${company.name} (${company.id})`);
      });
      console.log('');
    }
    
    if (people.length > 0) {
      console.log('👥 People to remove:');
      people.forEach((person, index) => {
        console.log(`   ${index + 1}. ${person.fullName} (${person.id})`);
      });
      console.log('');
    }
    
    // Start transaction for atomic operations
    transaction = await prisma.$transaction(async (tx) => {
      const deletedRecords = {
        actions: [],
        people: [],
        companies: []
      };
      
      // Get company and person IDs for action queries
      const companyIds = companies.map(c => c.id);
      const personIds = people.map(p => p.id);
      
      // 1. Delete related actions first
      if (companyIds.length > 0 || personIds.length > 0) {
        const actionsToDelete = await tx.actions.findMany({
          where: {
            workspaceId: workspace.id,
            OR: [
              ...(companyIds.length > 0 ? [{ companyId: { in: companyIds } }] : []),
              ...(personIds.length > 0 ? [{ personId: { in: personIds } }] : [])
            ],
            deletedAt: null
          },
          select: {
            id: true,
            type: true,
            subject: true,
            companyId: true,
            personId: true
          }
        });
        
        if (actionsToDelete.length > 0) {
          console.log(`🗑️  Deleting ${actionsToDelete.length} related actions...`);
          
          const deletedActions = await tx.actions.deleteMany({
            where: {
              id: { in: actionsToDelete.map(a => a.id) }
            }
          });
          
          deletedRecords.actions = actionsToDelete;
          console.log(`   ✅ Deleted ${deletedActions.count} actions`);
        }
      }
      
      // 2. Delete people records
      if (people.length > 0) {
        console.log(`🗑️  Deleting ${people.length} people records...`);
        
        const deletedPeople = await tx.people.deleteMany({
          where: {
            id: { in: personIds }
          }
        });
        
        deletedRecords.people = people;
        console.log(`   ✅ Deleted ${deletedPeople.count} people`);
      }
      
      // 3. Delete company records
      if (companies.length > 0) {
        console.log(`🗑️  Deleting ${companies.length} company records...`);
        
        const deletedCompanies = await tx.companies.deleteMany({
          where: {
            id: { in: companyIds }
          }
        });
        
        deletedRecords.companies = companies;
        console.log(`   ✅ Deleted ${deletedCompanies.count} companies`);
      }
      
      return deletedRecords;
    });
    
    // Report summary
    console.log('\n📊 REMOVAL SUMMARY:');
    console.log('==================');
    console.log(`Actions deleted: ${transaction.actions.length}`);
    console.log(`People deleted: ${transaction.people.length}`);
    console.log(`Companies deleted: ${transaction.companies.length}`);
    
    if (transaction.actions.length > 0) {
      console.log('\n🗑️  Deleted Actions:');
      transaction.actions.forEach((action, index) => {
        console.log(`   ${index + 1}. ${action.type}: ${action.subject} (${action.id})`);
      });
    }
    
    if (transaction.people.length > 0) {
      console.log('\n👥 Deleted People:');
      transaction.people.forEach((person, index) => {
        console.log(`   ${index + 1}. ${person.fullName} (${person.id})`);
      });
    }
    
    if (transaction.companies.length > 0) {
      console.log('\n🏢 Deleted Companies:');
      transaction.companies.forEach((company, index) => {
        console.log(`   ${index + 1}. ${company.name} (${company.id})`);
      });
    }
    
    console.log('\n✅ Notary Everyday self-references successfully removed!');
    console.log('   These records represented the business itself and should not be prospects.');
    
  } catch (error) {
    console.error('❌ Error during removal:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Run the script
removeNotaryEverydaySelfReferences()
  .then(() => {
    console.log('\n🎉 Script completed successfully!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n💥 Script failed:', error);
    process.exit(1);
  });
