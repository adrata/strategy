#!/usr/bin/env node

/**
 * 👥 CREATE MISSING PEOPLE RECORDS
 * 
 * This script creates the 1,354 missing People records
 * to achieve the 1:1 relationship with leads/prospects.
 */

const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

// TOP Engineering Plus workspace ID
const TOP_WORKSPACE_ID = '01K5D01YCQJ9TJ7CT4DZDE79T1';

async function createMissingPeopleRecords() {
  console.log('👥 CREATING MISSING PEOPLE RECORDS');
  console.log('==================================\n');
  
  try {
    await prisma.$connect();
    console.log('✅ Connected to database\n');

    // Find all leads and prospects that don't have People records
    const allLeads = await prisma.leads.findMany({
      where: { 
        workspaceId: TOP_WORKSPACE_ID, 
        deletedAt: null 
      },
      select: {
        id: true,
        fullName: true,
        email: true,
        jobTitle: true,
        phone: true,
        companyId: true
      }
    });

    const allProspects = await prisma.prospects.findMany({
      where: { 
        workspaceId: TOP_WORKSPACE_ID, 
        deletedAt: null 
      },
      select: {
        id: true,
        fullName: true,
        email: true,
        jobTitle: true,
        phone: true,
        companyId: true
      }
    });

    console.log(`📊 FOUND RECORDS:`);
    console.log(`   Leads: ${allLeads.length}`);
    console.log(`   Prospects: ${allProspects.length}\n`);

    // Get existing People records
    const existingPeople = await prisma.people.findMany({
      where: { workspaceId: TOP_WORKSPACE_ID, deletedAt: null },
      select: { fullName: true, email: true }
    });

    const existingPeopleSet = new Set(
      existingPeople.map(p => `${p.fullName}|${p.email || ''}`)
    );

    // Find records that need People records
    const recordsNeedingPeople = [];
    
    for (const lead of allLeads) {
      const key = `${lead.fullName}|${lead.email || ''}`;
      if (!existingPeopleSet.has(key)) {
        recordsNeedingPeople.push({ ...lead, type: 'lead' });
      }
    }

    for (const prospect of allProspects) {
      const key = `${prospect.fullName}|${prospect.email || ''}`;
      if (!existingPeopleSet.has(key)) {
        recordsNeedingPeople.push({ ...prospect, type: 'prospect' });
      }
    }

    console.log(`📊 RECORDS NEEDING PEOPLE:`);
    console.log(`   Total: ${recordsNeedingPeople.length}\n`);

    if (recordsNeedingPeople.length === 0) {
      console.log('✅ All records already have People records!\n');
      return;
    }

    // Create People records in batches
    const batchSize = 100;
    let createdCount = 0;

    for (let i = 0; i < recordsNeedingPeople.length; i += batchSize) {
      const batch = recordsNeedingPeople.slice(i, i + batchSize);
      
      const peopleToCreate = batch.map(record => {
        const nameParts = record.fullName.split(' ');
        const firstName = nameParts[0] || '';
        const lastName = nameParts.slice(1).join(' ') || '';

        return {
          workspaceId: TOP_WORKSPACE_ID,
          firstName: firstName,
          lastName: lastName,
          fullName: record.fullName,
          email: record.email,
          jobTitle: record.jobTitle,
          phone: record.phone,
          companyId: record.companyId,
          status: 'active',
          createdAt: new Date(),
          updatedAt: new Date()
        };
      });

      try {
        const createdPeople = await prisma.people.createMany({
          data: peopleToCreate,
          skipDuplicates: true
        });
        createdCount += createdPeople.count;
        console.log(`✅ Created ${createdPeople.count} People records (batch ${Math.floor(i / batchSize) + 1})`);
      } catch (error) {
        console.error(`❌ Error creating batch ${Math.floor(i / batchSize) + 1}:`, error.message);
      }
    }

    console.log(`\n🎉 CREATED ${createdCount} NEW PEOPLE RECORDS!\n`);

    // Verify the results
    const finalPeopleCount = await prisma.people.count({
      where: { workspaceId: TOP_WORKSPACE_ID, deletedAt: null }
    });

    const finalLeadsCount = await prisma.leads.count({
      where: { workspaceId: TOP_WORKSPACE_ID, deletedAt: null }
    });

    const finalProspectsCount = await prisma.prospects.count({
      where: { workspaceId: TOP_WORKSPACE_ID, deletedAt: null }
    });

    console.log('📊 FINAL VERIFICATION:');
    console.log(`   People: ${finalPeopleCount.toLocaleString()}`);
    console.log(`   Leads: ${finalLeadsCount.toLocaleString()}`);
    console.log(`   Prospects: ${finalProspectsCount.toLocaleString()}`);
    console.log(`   Expected: ${(finalLeadsCount + finalProspectsCount).toLocaleString()}`);
    
    const difference = (finalLeadsCount + finalProspectsCount) - finalPeopleCount;
    if (Math.abs(difference) <= 10) {
      console.log('✅ SUCCESS: People count matches expected!\n');
    } else {
      console.log(`⚠️  WARNING: Difference of ${difference.toLocaleString()} records\n`);
    }

  } catch (error) {
    console.error('❌ Failed to create People records:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the script
createMissingPeopleRecords().catch(console.error);
