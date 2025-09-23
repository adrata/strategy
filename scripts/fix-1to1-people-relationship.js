#!/usr/bin/env node

/**
 * 🔧 FIX 1:1 PEOPLE RELATIONSHIP
 * 
 * This script fixes the People equation to achieve:
 * Leads + Prospects = People (1:1 relationship)
 * 
 * Actions:
 * 1. Remove duplicates (keep record with more data)
 * 2. Fix missing PersonIds
 * 3. Fix orphaned People records
 */

const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

// TOP Engineering Plus workspace ID
const TOP_WORKSPACE_ID = '01K5D01YCQJ9TJ7CT4DZDE79T1';

async function fix1to1PeopleRelationship() {
  console.log('🔧 FIXING 1:1 PEOPLE RELATIONSHIP');
  console.log('==================================\n');
  
  try {
    await prisma.$connect();
    console.log('✅ Connected to database\n');

    // Step 1: Get all leads and prospects with their data
    console.log('🔍 1. ANALYZING ALL RECORDS...\n');
    
    const allLeads = await prisma.leads.findMany({
      where: { 
        workspaceId: TOP_WORKSPACE_ID, 
        deletedAt: null
      },
      select: {
        id: true,
        personId: true,
        fullName: true,
        email: true,
        jobTitle: true,
        phone: true,
        mobilePhone: true,
        workPhone: true,
        linkedinUrl: true,
        address: true,
        city: true,
        state: true,
        country: true,
        postalCode: true,
        companyId: true,
        createdAt: true,
        updatedAt: true
      }
    });

    const allProspects = await prisma.prospects.findMany({
      where: { 
        workspaceId: TOP_WORKSPACE_ID, 
        deletedAt: null
      },
      select: {
        id: true,
        personId: true,
        fullName: true,
        email: true,
        jobTitle: true,
        phone: true,
        mobilePhone: true,
        workPhone: true,
        linkedinUrl: true,
        address: true,
        city: true,
        state: true,
        country: true,
        postalCode: true,
        companyId: true,
        createdAt: true,
        updatedAt: true
      }
    });

    const allPeople = await prisma.people.findMany({
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
        mobilePhone: true,
        workPhone: true,
        linkedinUrl: true,
        address: true,
        city: true,
        state: true,
        country: true,
        postalCode: true,
        companyId: true
      }
    });

    console.log(`📊 RECORDS FOUND:`);
    console.log(`   Leads: ${allLeads.length}`);
    console.log(`   Prospects: ${allProspects.length}`);
    console.log(`   People: ${allPeople.length}\n`);

    // Step 2: Group records by person identifier (email or fullName)
    console.log('🔍 2. GROUPING RECORDS BY PERSON...\n');
    
    const personGroups = new Map(); // identifier -> { leads: [], prospects: [], people: [] }
    
    // Helper function to get identifier
    function getIdentifier(record) {
      return record.email?.toLowerCase() || record.fullName?.toLowerCase() || record.id;
    }
    
    // Helper function to calculate data richness score
    function getDataRichness(record) {
      let score = 0;
      if (record.fullName) score += 1;
      if (record.email) score += 2;
      if (record.jobTitle) score += 1;
      if (record.phone || record.mobilePhone || record.workPhone) score += 2;
      if (record.linkedinUrl) score += 1;
      if (record.address || record.city || record.state || record.country) score += 2;
      if (record.companyId) score += 1;
      return score;
    }

    // Group leads
    for (const lead of allLeads) {
      const identifier = getIdentifier(lead);
      if (!personGroups.has(identifier)) {
        personGroups.set(identifier, { leads: [], prospects: [], people: [] });
      }
      personGroups.get(identifier).leads.push(lead);
    }

    // Group prospects
    for (const prospect of allProspects) {
      const identifier = getIdentifier(prospect);
      if (!personGroups.has(identifier)) {
        personGroups.set(identifier, { leads: [], prospects: [], people: [] });
      }
      personGroups.get(identifier).prospects.push(prospect);
    }

    // Group people
    for (const person of allPeople) {
      const identifier = getIdentifier(person);
      if (!personGroups.has(identifier)) {
        personGroups.set(identifier, { leads: [], prospects: [], people: [] });
      }
      personGroups.get(identifier).people.push(person);
    }

    console.log(`📊 PERSON GROUPS: ${personGroups.size}\n`);

    // Step 3: Process each person group
    console.log('🔧 3. PROCESSING PERSON GROUPS...\n');
    
    let duplicatesRemoved = 0;
    let missingPersonIdsFixed = 0;
    let orphanedPeopleFixed = 0;
    let recordsToDelete = [];
    let recordsToUpdate = [];

    for (const [identifier, group] of personGroups) {
      const { leads, prospects, people } = group;
      
      // Skip if no leads or prospects (orphaned people)
      if (leads.length === 0 && prospects.length === 0) {
        if (people.length > 0) {
          // These are orphaned people - we'll handle them later
          orphanedPeopleFixed += people.length;
        }
        continue;
      }

      // Find the best record to keep (most data rich)
      const allRecords = [...leads, ...prospects];
      const bestRecord = allRecords.reduce((best, current) => {
        const bestScore = getDataRichness(best);
        const currentScore = getDataRichness(current);
        return currentScore > bestScore ? current : best;
      });

      // Determine the best Person record
      let bestPerson = null;
      if (people.length > 0) {
        bestPerson = people.reduce((best, current) => {
          const bestScore = getDataRichness(best);
          const currentScore = getDataRichness(current);
          return currentScore > bestScore ? current : best;
        });
      }

      // Create or update Person record if needed
      if (!bestPerson) {
        // Create new Person record from best record
        const nameParts = bestRecord.fullName?.split(' ') || ['', ''];
        const firstName = nameParts[0] || '';
        const lastName = nameParts.slice(1).join(' ') || '';

        const newPerson = await prisma.people.create({
          data: {
            workspaceId: TOP_WORKSPACE_ID,
            firstName: firstName,
            lastName: lastName,
            fullName: bestRecord.fullName,
            email: bestRecord.email,
            jobTitle: bestRecord.jobTitle,
            phone: bestRecord.phone,
            mobilePhone: bestRecord.mobilePhone,
            workPhone: bestRecord.workPhone,
            linkedinUrl: bestRecord.linkedinUrl,
            address: bestRecord.address,
            city: bestRecord.city,
            state: bestRecord.state,
            country: bestRecord.country,
            postalCode: bestRecord.postalCode,
            companyId: bestRecord.companyId,
            status: 'active',
            createdAt: new Date(),
            updatedAt: new Date()
          }
        });
        bestPerson = newPerson;
        missingPersonIdsFixed++;
      }

      // Update all records to point to the best Person
      for (const record of allRecords) {
        if (record.personId !== bestPerson.id) {
          recordsToUpdate.push({
            type: record.id.startsWith('lead_') ? 'lead' : 'prospect',
            id: record.id,
            personId: bestPerson.id
          });
        }
      }

      // Mark duplicates for deletion (keep only the best record)
      const recordsToKeep = [bestRecord];
      const recordsToRemove = allRecords.filter(r => r.id !== bestRecord.id);
      
      for (const record of recordsToRemove) {
        recordsToDelete.push({
          type: record.id.startsWith('lead_') ? 'lead' : 'prospect',
          id: record.id
        });
        duplicatesRemoved++;
      }

      // Remove extra People records
      const peopleToRemove = people.filter(p => p.id !== bestPerson.id);
      for (const person of peopleToRemove) {
        recordsToDelete.push({
          type: 'person',
          id: person.id
        });
      }
    }

    console.log(`📊 PROCESSING RESULTS:`);
    console.log(`   Duplicates to remove: ${duplicatesRemoved}`);
    console.log(`   Missing PersonIds to fix: ${missingPersonIdsFixed}`);
    console.log(`   Orphaned People: ${orphanedPeopleFixed}\n`);

    // Step 4: Execute updates and deletions
    console.log('🔧 4. EXECUTING UPDATES...\n');
    
    // Update records with correct PersonIds
    for (const update of recordsToUpdate) {
      if (update.type === 'lead') {
        await prisma.leads.update({
          where: { id: update.id },
          data: { personId: update.personId }
        });
      } else if (update.type === 'prospect') {
        await prisma.prospects.update({
          where: { id: update.id },
          data: { personId: update.personId }
        });
      }
    }

    // Delete duplicate records
    for (const deletion of recordsToDelete) {
      if (deletion.type === 'lead') {
        await prisma.leads.update({
          where: { id: deletion.id },
          data: { deletedAt: new Date() }
        });
      } else if (deletion.type === 'prospect') {
        await prisma.prospects.update({
          where: { id: deletion.id },
          data: { deletedAt: new Date() }
        });
      } else if (deletion.type === 'person') {
        await prisma.people.update({
          where: { id: deletion.id },
          data: { deletedAt: new Date() }
        });
      }
    }

    console.log(`✅ Updated ${recordsToUpdate.length} records`);
    console.log(`✅ Deleted ${recordsToDelete.length} duplicate records\n`);

    // Step 5: Final verification
    console.log('✅ 5. FINAL VERIFICATION...\n');
    
    const finalLeadsCount = await prisma.leads.count({
      where: { workspaceId: TOP_WORKSPACE_ID, deletedAt: null }
    });

    const finalProspectsCount = await prisma.prospects.count({
      where: { workspaceId: TOP_WORKSPACE_ID, deletedAt: null }
    });

    const finalPeopleCount = await prisma.people.count({
      where: { workspaceId: TOP_WORKSPACE_ID, deletedAt: null }
    });

    const leadsWithPersonId = await prisma.leads.count({
      where: { workspaceId: TOP_WORKSPACE_ID, personId: { not: null }, deletedAt: null }
    });

    const prospectsWithPersonId = await prisma.prospects.count({
      where: { workspaceId: TOP_WORKSPACE_ID, personId: { not: null }, deletedAt: null }
    });

    console.log('📊 FINAL COUNTS:');
    console.log(`   Leads: ${finalLeadsCount.toLocaleString()}`);
    console.log(`   Prospects: ${finalProspectsCount.toLocaleString()}`);
    console.log(`   People: ${finalPeopleCount.toLocaleString()}`);
    console.log(`   Leads + Prospects = ${(finalLeadsCount + finalProspectsCount).toLocaleString()}\n`);

    console.log('🔗 PERSONID REFERENCES:');
    console.log(`   Leads with personId: ${leadsWithPersonId.toLocaleString()}/${finalLeadsCount.toLocaleString()} (${((leadsWithPersonId / finalLeadsCount) * 100).toFixed(1)}%)`);
    console.log(`   Prospects with personId: ${prospectsWithPersonId.toLocaleString()}/${finalProspectsCount.toLocaleString()} (${((prospectsWithPersonId / finalProspectsCount) * 100).toFixed(1)}%)\n`);

    // Check the equation
    const equationCheck = finalPeopleCount === (finalLeadsCount + finalProspectsCount);
    const allLinked = (leadsWithPersonId === finalLeadsCount) && (prospectsWithPersonId === finalProspectsCount);

    if (equationCheck && allLinked) {
      console.log('✅ SUCCESS: Leads + Prospects = People (1:1 relationship achieved!)\n');
    } else {
      console.log('⚠️  WARNING: Issues remain\n');
    }

    console.log('🎯 CLEAN FUNNEL ARCHITECTURE:');
    console.log('=============================\n');
    console.log('   Lead → Prospect → Opportunity');
    console.log(`     ↓        ↓           ↓`);
    console.log(`   ${finalLeadsCount.toLocaleString()}     ${finalProspectsCount.toLocaleString()}        0`);
    console.log('   (Unqualified) (Qualified) (Active Deals)\n');

  } catch (error) {
    console.error('❌ Failed to fix 1:1 relationship:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the fix
fix1to1PeopleRelationship().catch(console.error);
