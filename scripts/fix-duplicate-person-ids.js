#!/usr/bin/env node

/**
 * 🔧 FIX DUPLICATE PERSON IDs
 * 
 * Fixes the data integrity issue where 249 prospects share the same personId
 * by generating unique person IDs and creating corresponding people records
 */

const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: process.env.DATABASE_URL || process.env.POSTGRES_URL
    }
  }
});

const NOTARY_EVERYDAY_WORKSPACE_ID = '01K1VBYmf75hgmvmz06psnc9ug';

// Generate a unique person ID
function generatePersonId() {
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(2, 8);
  return `con_${timestamp}_${random}`;
}

async function fixDuplicatePersonIds() {
  console.log('🔧 FIXING DUPLICATE PERSON IDs');
  console.log('='.repeat(50));
  console.log('Generating unique person IDs for prospects with duplicate personId');
  console.log('');

  try {
    // Get all prospects with their personId
    const prospects = await prisma.prospects.findMany({
      where: { 
        workspaceId: NOTARY_EVERYDAY_WORKSPACE_ID, 
        deletedAt: null 
      },
      select: {
        id: true,
        fullName: true,
        firstName: true,
        lastName: true,
        email: true,
        workEmail: true,
        personalEmail: true,
        phone: true,
        mobilePhone: true,
        workPhone: true,
        jobTitle: true,
        title: true,
        department: true,
        company: true,
        companyId: true,
        personId: true,
        state: true,
        city: true,
        country: true,
        createdAt: true,
        updatedAt: true
      }
    });

    // Get all people records
    const people = await prisma.people.findMany({
      where: { 
        workspaceId: NOTARY_EVERYDAY_WORKSPACE_ID, 
        deletedAt: null 
      },
      select: {
        id: true,
        fullName: true,
        email: true,
        workEmail: true,
        personalEmail: true
      }
    });

    console.log(`📊 Found ${prospects.length} prospects and ${people.length} people records`);
    console.log('');

    // Find prospects that don't have corresponding people records
    const peopleIds = new Set(people.map(p => p.id));
    const orphanedProspects = prospects.filter(prospect => !peopleIds.has(prospect.personId));

    console.log(`🔍 Orphaned prospects (without people records): ${orphanedProspects.length}`);
    console.log('');

    if (orphanedProspects.length === 0) {
      console.log('✅ All prospects have corresponding people records!');
      return;
    }

    // Group by personId to see the duplicates
    const personIdGroups = {};
    orphanedProspects.forEach(prospect => {
      if (!personIdGroups[prospect.personId]) {
        personIdGroups[prospect.personId] = [];
      }
      personIdGroups[prospect.personId].push(prospect);
    });

    console.log('📋 Person ID groups (showing duplicates):');
    Object.entries(personIdGroups).forEach(([personId, prospects]) => {
      console.log(`   PersonId: ${personId} (${prospects.length} prospects)`);
      prospects.slice(0, 3).forEach(prospect => {
        console.log(`     - ${prospect.fullName} (${prospect.email || prospect.workEmail || prospect.personalEmail || 'No email'})`);
      });
      if (prospects.length > 3) {
        console.log(`     ... and ${prospects.length - 3} more`);
      }
      console.log('');
    });

    // Fix the duplicates by generating unique person IDs and creating people records
    console.log('🔨 Fixing duplicate person IDs...');
    let fixedCount = 0;

    for (const [duplicatePersonId, prospectsWithSameId] of Object.entries(personIdGroups)) {
      console.log(`   Processing ${prospectsWithSameId.length} prospects with personId: ${duplicatePersonId}`);
      
      for (const prospect of prospectsWithSameId) {
        try {
          // Generate a new unique person ID
          const newPersonId = generatePersonId();
          
          // Update the prospect with the new person ID
          await prisma.prospects.update({
            where: { id: prospect.id },
            data: { personId: newPersonId }
          });

          // Create the corresponding people record
          const newPerson = await prisma.people.create({
            data: {
              id: newPersonId,
              workspaceId: NOTARY_EVERYDAY_WORKSPACE_ID,
              companyId: prospect.companyId,
              assignedUserId: null, // Will be set later if needed
              firstName: prospect.firstName,
              lastName: prospect.lastName,
              fullName: prospect.fullName,
              displayName: prospect.fullName,
              jobTitle: prospect.jobTitle || prospect.title,
              department: prospect.department,
              email: prospect.email,
              workEmail: prospect.workEmail,
              personalEmail: prospect.personalEmail,
              phone: prospect.phone,
              mobilePhone: prospect.mobilePhone,
              workPhone: prospect.workPhone,
              company: prospect.company,
              industry: null,
              status: 'active',
              priority: 'medium',
              notes: `Created from prospect record: ${prospect.id}`,
              tags: ['auto-created'],
              source: 'prospect-migration',
              location: prospect.state ? `${prospect.city || ''}, ${prospect.state}`.trim() : null,
              city: prospect.city,
              state: prospect.state,
              country: prospect.country,
              createdAt: prospect.createdAt || new Date(),
              updatedAt: new Date()
            }
          });

          console.log(`     ✅ Fixed ${prospect.fullName} -> ${newPersonId}`);
          fixedCount++;

        } catch (error) {
          console.error(`     ❌ Error fixing ${prospect.fullName}:`, error.message);
        }
      }
    }

    console.log('');
    console.log(`🎉 Successfully fixed ${fixedCount} duplicate person IDs`);

    // Verify the fix
    console.log('');
    console.log('🔍 Verifying fix...');
    
    const updatedPeopleCount = await prisma.people.count({
      where: { 
        workspaceId: NOTARY_EVERYDAY_WORKSPACE_ID, 
        deletedAt: null 
      }
    });

    const updatedProspectsCount = await prisma.prospects.count({
      where: { 
        workspaceId: NOTARY_EVERYDAY_WORKSPACE_ID, 
        deletedAt: null 
      }
    });

    console.log(`   Updated counts: ${updatedProspectsCount} prospects, ${updatedPeopleCount} people`);
    
    if (updatedProspectsCount === updatedPeopleCount) {
      console.log('   ✅ Perfect! All prospects now have corresponding people records');
    } else {
      console.log(`   ⚠️  Still have a mismatch: ${updatedProspectsCount} prospects vs ${updatedPeopleCount} people`);
    }

    // Check for any remaining duplicates
    const remainingProspects = await prisma.prospects.findMany({
      where: { 
        workspaceId: NOTARY_EVERYDAY_WORKSPACE_ID, 
        deletedAt: null 
      },
      select: {
        personId: true,
        fullName: true
      }
    });

    const personIdCounts = {};
    remainingProspects.forEach(prospect => {
      personIdCounts[prospect.personId] = (personIdCounts[prospect.personId] || 0) + 1;
    });

    const stillDuplicated = Object.entries(personIdCounts).filter(([_, count]) => count > 1);
    
    if (stillDuplicated.length > 0) {
      console.log(`   ⚠️  Still have ${stillDuplicated.length} person IDs with duplicates:`);
      stillDuplicated.forEach(([personId, count]) => {
        console.log(`     ${personId}: ${count} prospects`);
      });
    } else {
      console.log('   ✅ No more duplicate person IDs found!');
    }

  } catch (error) {
    console.error('❌ Error fixing duplicate person IDs:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the fix
fixDuplicatePersonIds().catch(console.error);
