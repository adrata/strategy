#!/usr/bin/env node

/**
 * 👥 CREATE UNIQUE PEOPLE RECORDS
 * 
 * This script creates People records ensuring 1:1 relationship
 * by handling duplicates between leads and prospects properly.
 */

const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

// TOP Engineering Plus workspace ID
const TOP_WORKSPACE_ID = '01K5D01YCQJ9TJ7CT4DZDE79T1';

async function createUniquePeopleRecords() {
  console.log('👥 CREATING UNIQUE PEOPLE RECORDS');
  console.log('=================================\n');
  
  try {
    await prisma.$connect();
    console.log('✅ Connected to database\n');

    // Get all unique people from leads and prospects
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
        companyId: true,
        firstName: true,
        lastName: true
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
        companyId: true,
        firstName: true,
        lastName: true
      }
    });

    console.log(`📊 FOUND RECORDS:`);
    console.log(`   Leads: ${allLeads.length}`);
    console.log(`   Prospects: ${allProspects.length}\n`);

    // Create a map of unique people
    const uniquePeopleMap = new Map();

    // Process leads
    for (const lead of allLeads) {
      const key = lead.email || lead.fullName;
      if (!uniquePeopleMap.has(key)) {
        uniquePeopleMap.set(key, {
          fullName: lead.fullName,
          firstName: lead.firstName,
          lastName: lead.lastName,
          email: lead.email,
          jobTitle: lead.jobTitle,
          phone: lead.phone,
          companyId: lead.companyId,
          leadIds: [lead.id],
          prospectIds: []
        });
      } else {
        uniquePeopleMap.get(key).leadIds.push(lead.id);
      }
    }

    // Process prospects
    for (const prospect of allProspects) {
      const key = prospect.email || prospect.fullName;
      if (!uniquePeopleMap.has(key)) {
        uniquePeopleMap.set(key, {
          fullName: prospect.fullName,
          firstName: prospect.firstName,
          lastName: prospect.lastName,
          email: prospect.email,
          jobTitle: prospect.jobTitle,
          phone: prospect.phone,
          companyId: prospect.companyId,
          leadIds: [],
          prospectIds: [prospect.id]
        });
      } else {
        uniquePeopleMap.get(key).prospectIds.push(prospect.id);
      }
    }

    console.log(`📊 UNIQUE PEOPLE IDENTIFIED: ${uniquePeopleMap.size}\n`);

    // Get existing People records
    const existingPeople = await prisma.people.findMany({
      where: { workspaceId: TOP_WORKSPACE_ID, deletedAt: null },
      select: { fullName: true, email: true }
    });

    const existingPeopleSet = new Set(
      existingPeople.map(p => p.email || p.fullName)
    );

    // Find people that need to be created
    const peopleToCreate = [];
    for (const [key, personData] of uniquePeopleMap) {
      if (!existingPeopleSet.has(key)) {
        peopleToCreate.push(personData);
      }
    }

    console.log(`📊 PEOPLE TO CREATE: ${peopleToCreate.length}\n`);

    if (peopleToCreate.length === 0) {
      console.log('✅ All unique people already exist!\n');
      return;
    }

    // Create People records in batches
    const batchSize = 100;
    let createdCount = 0;

    for (let i = 0; i < peopleToCreate.length; i += batchSize) {
      const batch = peopleToCreate.slice(i, i + batchSize);
      
      const peopleToCreateData = batch.map(person => ({
        workspaceId: TOP_WORKSPACE_ID,
        firstName: person.firstName,
        lastName: person.lastName,
        fullName: person.fullName,
        email: person.email,
        jobTitle: person.jobTitle,
        phone: person.phone,
        companyId: person.companyId,
        status: 'active',
        createdAt: new Date(),
        updatedAt: new Date()
      }));

      try {
        const createdPeople = await prisma.people.createMany({
          data: peopleToCreateData,
          skipDuplicates: true
        });
        createdCount += createdPeople.count;
        console.log(`✅ Created ${createdPeople.count} People records (batch ${Math.floor(i / batchSize) + 1})`);
      } catch (error) {
        console.error(`❌ Error creating batch ${Math.floor(i / batchSize) + 1}:`, error.message);
      }
    }

    console.log(`\n🎉 CREATED ${createdCount} NEW PEOPLE RECORDS!\n`);

    // Now update all leads and prospects to reference their People records
    console.log('🔗 UPDATING LEAD/PROSPECT REFERENCES...\n');
    
    let updatedLeads = 0;
    let updatedProspects = 0;

    for (const [key, personData] of uniquePeopleMap) {
      // Find the People record
      const peopleRecord = await prisma.people.findFirst({
        where: {
          workspaceId: TOP_WORKSPACE_ID,
          OR: [
            { email: personData.email },
            { fullName: personData.fullName }
          ]
        }
      });

      if (peopleRecord) {
        // Update leads
        for (const leadId of personData.leadIds) {
          await prisma.leads.update({
            where: { id: leadId },
            data: { personId: peopleRecord.id }
          });
          updatedLeads++;
        }

        // Update prospects
        for (const prospectId of personData.prospectIds) {
          await prisma.prospects.update({
            where: { id: prospectId },
            data: { personId: peopleRecord.id }
          });
          updatedProspects++;
        }
      }
    }

    console.log(`✅ Updated ${updatedLeads} leads with personId references`);
    console.log(`✅ Updated ${updatedProspects} prospects with personId references\n`);

    // Final verification
    const finalPeopleCount = await prisma.people.count({
      where: { workspaceId: TOP_WORKSPACE_ID, deletedAt: null }
    });

    const finalLeadsCount = await prisma.leads.count({
      where: { workspaceId: TOP_WORKSPACE_ID, deletedAt: null }
    });

    const finalProspectsCount = await prisma.prospects.count({
      where: { workspaceId: TOP_WORKSPACE_ID, deletedAt: null }
    });

    const leadsWithPersonId = await prisma.leads.count({
      where: { workspaceId: TOP_WORKSPACE_ID, personId: { not: null }, deletedAt: null }
    });

    const prospectsWithPersonId = await prisma.prospects.count({
      where: { workspaceId: TOP_WORKSPACE_ID, personId: { not: null }, deletedAt: null }
    });

    console.log('📊 FINAL VERIFICATION:');
    console.log(`   People: ${finalPeopleCount.toLocaleString()}`);
    console.log(`   Leads: ${finalLeadsCount.toLocaleString()}`);
    console.log(`   Prospects: ${finalProspectsCount.toLocaleString()}`);
    console.log(`   Unique People Expected: ${uniquePeopleMap.size.toLocaleString()}\n`);

    console.log('🔗 PERSONID REFERENCES:');
    console.log(`   Leads with personId: ${leadsWithPersonId.toLocaleString()}/${finalLeadsCount.toLocaleString()} (${((leadsWithPersonId / finalLeadsCount) * 100).toFixed(1)}%)`);
    console.log(`   Prospects with personId: ${prospectsWithPersonId.toLocaleString()}/${finalProspectsCount.toLocaleString()} (${((prospectsWithPersonId / finalProspectsCount) * 100).toFixed(1)}%)\n`);

    if (finalPeopleCount === uniquePeopleMap.size) {
      console.log('✅ SUCCESS: People count matches unique people count!\n');
    } else {
      console.log(`⚠️  WARNING: People count (${finalPeopleCount}) doesn't match unique count (${uniquePeopleMap.size})\n`);
    }

    if (leadsWithPersonId === finalLeadsCount && prospectsWithPersonId === finalProspectsCount) {
      console.log('✅ SUCCESS: All leads and prospects have personId references!\n');
    } else {
      console.log('⚠️  WARNING: Some leads/prospects missing personId references\n');
    }

  } catch (error) {
    console.error('❌ Failed to create People records:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the script
createUniquePeopleRecords().catch(console.error);
