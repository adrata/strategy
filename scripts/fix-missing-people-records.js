#!/usr/bin/env node

/**
 * 👥 FIX MISSING PEOPLE RECORDS
 * 
 * This script creates People records for leads/prospects that don't have them
 * to achieve the equation: Leads + Prospects = People
 */

const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

// TOP Engineering Plus workspace ID
const TOP_WORKSPACE_ID = '01K5D01YCQJ9TJ7CT4DZDE79T1';

async function fixMissingPeopleRecords() {
  console.log('👥 FIXING MISSING PEOPLE RECORDS');
  console.log('=================================\n');
  
  try {
    await prisma.$connect();
    console.log('✅ Connected to database\n');

    // Find leads without People records
    const leadsWithoutPeople = await prisma.leads.findMany({
      where: { 
        workspaceId: TOP_WORKSPACE_ID, 
        deletedAt: null,
        personId: null
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

    // Find prospects without People records
    const prospectsWithoutPeople = await prisma.prospects.findMany({
      where: { 
        workspaceId: TOP_WORKSPACE_ID, 
        deletedAt: null,
        personId: null
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

    console.log('📊 RECORDS WITHOUT PEOPLE:');
    console.log(`   Leads without People: ${leadsWithoutPeople.length}`);
    console.log(`   Prospects without People: ${prospectsWithoutPeople.length}`);
    console.log(`   Total missing: ${leadsWithoutPeople.length + prospectsWithoutPeople.length}\n`);

    if (leadsWithoutPeople.length === 0 && prospectsWithoutPeople.length === 0) {
      console.log('✅ All records already have People records!\n');
      return;
    }

    // Create People records for leads
    let createdCount = 0;
    if (leadsWithoutPeople.length > 0) {
      console.log('🔧 Creating People records for leads...');
      
      const batchSize = 100;
      for (let i = 0; i < leadsWithoutPeople.length; i += batchSize) {
        const batch = leadsWithoutPeople.slice(i, i + batchSize);
        
        const peopleToCreate = batch.map(lead => ({
          workspaceId: TOP_WORKSPACE_ID,
          firstName: lead.firstName,
          lastName: lead.lastName,
          fullName: lead.fullName,
          email: lead.email,
          jobTitle: lead.jobTitle,
          phone: lead.phone,
          companyId: lead.companyId,
          status: 'active',
          createdAt: new Date(),
          updatedAt: new Date()
        }));

        try {
          const createdPeople = await prisma.people.createMany({
            data: peopleToCreate,
            skipDuplicates: true
          });
          createdCount += createdPeople.count;
          console.log(`   ✅ Created ${createdPeople.count} People records for leads (batch ${Math.floor(i / batchSize) + 1})`);
        } catch (error) {
          console.error(`   ❌ Error creating batch ${Math.floor(i / batchSize) + 1}:`, error.message);
        }
      }
    }

    // Create People records for prospects
    if (prospectsWithoutPeople.length > 0) {
      console.log('🔧 Creating People records for prospects...');
      
      const batchSize = 100;
      for (let i = 0; i < prospectsWithoutPeople.length; i += batchSize) {
        const batch = prospectsWithoutPeople.slice(i, i + batchSize);
        
        const peopleToCreate = batch.map(prospect => ({
          workspaceId: TOP_WORKSPACE_ID,
          firstName: prospect.firstName,
          lastName: prospect.lastName,
          fullName: prospect.fullName,
          email: prospect.email,
          jobTitle: prospect.jobTitle,
          phone: prospect.phone,
          companyId: prospect.companyId,
          status: 'active',
          createdAt: new Date(),
          updatedAt: new Date()
        }));

        try {
          const createdPeople = await prisma.people.createMany({
            data: peopleToCreate,
            skipDuplicates: true
          });
          createdCount += createdPeople.count;
          console.log(`   ✅ Created ${createdPeople.count} People records for prospects (batch ${Math.floor(i / batchSize) + 1})`);
        } catch (error) {
          console.error(`   ❌ Error creating batch ${Math.floor(i / batchSize) + 1}:`, error.message);
        }
      }
    }

    console.log(`\n🎉 CREATED ${createdCount} NEW PEOPLE RECORDS!\n`);

    // Now link all records to their People records
    console.log('🔗 Linking records to People...\n');
    
    // Link leads
    let linkedLeads = 0;
    for (const lead of leadsWithoutPeople) {
      const person = await prisma.people.findFirst({
        where: {
          workspaceId: TOP_WORKSPACE_ID,
          OR: [
            { email: lead.email },
            { fullName: lead.fullName }
          ]
        }
      });

      if (person) {
        await prisma.leads.update({
          where: { id: lead.id },
          data: { personId: person.id }
        });
        linkedLeads++;
      }
    }

    // Link prospects
    let linkedProspects = 0;
    for (const prospect of prospectsWithoutPeople) {
      const person = await prisma.people.findFirst({
        where: {
          workspaceId: TOP_WORKSPACE_ID,
          OR: [
            { email: prospect.email },
            { fullName: prospect.fullName }
          ]
        }
      });

      if (person) {
        await prisma.prospects.update({
          where: { id: prospect.id },
          data: { personId: person.id }
        });
        linkedProspects++;
      }
    }

    console.log(`✅ Linked ${linkedLeads} leads to People records`);
    console.log(`✅ Linked ${linkedProspects} prospects to People records\n`);

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
    console.log(`   Leads + Prospects = ${(finalLeadsCount + finalProspectsCount).toLocaleString()}\n`);

    console.log('🔗 PERSONID REFERENCES:');
    console.log(`   Leads with personId: ${leadsWithPersonId.toLocaleString()}/${finalLeadsCount.toLocaleString()} (${((leadsWithPersonId / finalLeadsCount) * 100).toFixed(1)}%)`);
    console.log(`   Prospects with personId: ${prospectsWithPersonId.toLocaleString()}/${finalProspectsCount.toLocaleString()} (${((prospectsWithPersonId / finalProspectsCount) * 100).toFixed(1)}%)\n`);

    const equationCheck = finalPeopleCount === (finalLeadsCount + finalProspectsCount);
    const allLinked = (leadsWithPersonId === finalLeadsCount) && (prospectsWithPersonId === finalProspectsCount);

    if (equationCheck && allLinked) {
      console.log('✅ SUCCESS: Leads + Prospects = People with all records linked!\n');
    } else {
      console.log('⚠️  WARNING: Issues remain\n');
    }

  } catch (error) {
    console.error('❌ Failed to fix missing People records:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the fix
fixMissingPeopleRecords().catch(console.error);
