#!/usr/bin/env node

/**
 * 🔧 FIX MISSING PEOPLE RECORD
 * 
 * Identifies and creates the missing people record for the prospect
 * that doesn't have a corresponding people record in Notary Everyday workspace
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

async function fixMissingPeopleRecord() {
  console.log('🔧 FIXING MISSING PEOPLE RECORD');
  console.log('='.repeat(50));
  console.log('Finding prospect without corresponding people record');
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

    // Show details of orphaned prospects
    console.log('📋 Orphaned prospects details:');
    orphanedProspects.forEach((prospect, index) => {
      console.log(`   ${index + 1}. ${prospect.fullName}`);
      console.log(`      PersonId: ${prospect.personId}`);
      console.log(`      Email: ${prospect.email || prospect.workEmail || prospect.personalEmail || 'No email'}`);
      console.log(`      Company: ${prospect.company || 'No company'}`);
      console.log(`      Title: ${prospect.jobTitle || prospect.title || 'No title'}`);
      console.log('');
    });

    // Create missing people records
    console.log('🔨 Creating missing people records...');
    let createdCount = 0;

    for (const prospect of orphanedProspects) {
      try {
        // Check if the personId already exists in people table
        const existingPerson = await prisma.people.findUnique({
          where: { id: prospect.personId }
        });

        if (existingPerson) {
          console.log(`   ⚠️  Person record ${prospect.personId} already exists for ${prospect.fullName}`);
          continue;
        }

        // Create the missing people record
        const newPerson = await prisma.people.create({
          data: {
            id: prospect.personId,
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

        console.log(`   ✅ Created people record for ${prospect.fullName} (${newPerson.id})`);
        createdCount++;

      } catch (error) {
        console.error(`   ❌ Error creating people record for ${prospect.fullName}:`, error.message);
      }
    }

    console.log('');
    console.log(`🎉 Successfully created ${createdCount} missing people records`);

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

  } catch (error) {
    console.error('❌ Error fixing missing people record:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the fix
fixMissingPeopleRecord().catch(console.error);
