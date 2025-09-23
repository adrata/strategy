#!/usr/bin/env node

/**
 * 🔧 FIX ORPHANED LEADS/PROSPECTS
 * 
 * This script identifies and fixes orphaned leads/prospects that don't have
 * corresponding people records, or creates the missing people records.
 */

const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

// TOP Engineering Plus workspace ID
const TOP_WORKSPACE_ID = '01K5D01YCQJ9TJ7CT4DZDE79T1';

async function fixOrphanedLeadsProspects() {
  console.log('🔧 FIXING ORPHANED LEADS/PROSPECTS');
  console.log('==================================\n');
  
  try {
    await prisma.$connect();
    console.log('✅ Connected to database\n');

    // 1. Find orphaned leads (no personId, no corresponding people record)
    await findOrphanedLeads();
    
    // 2. Find orphaned prospects (no personId, no corresponding people record)
    await findOrphanedProspects();
    
    // 3. Create missing people records
    await createMissingPeopleRecords();
    
    // 4. Update personId references
    await updatePersonIdReferences();
    
    // 5. Verify the fix
    await verifyFix();

  } catch (error) {
    console.error('❌ Fix failed:', error);
  } finally {
    await prisma.$disconnect();
  }
}

async function findOrphanedLeads() {
  console.log('🔍 1. FINDING ORPHANED LEADS');
  console.log('============================\n');
  
  // Find leads without personId
  const leadsWithoutPersonId = await prisma.leads.findMany({
    where: { 
      workspaceId: TOP_WORKSPACE_ID, 
      deletedAt: null,
      personId: null
    },
    select: {
      id: true,
      fullName: true,
      email: true,
      company: true,
      jobTitle: true,
      createdAt: true
    },
    take: 10
  });

  console.log(`📊 Leads without personId: ${leadsWithoutPersonId.length} (showing first 10)`);
  leadsWithoutPersonId.forEach((lead, index) => {
    console.log(`   ${index + 1}. ${lead.fullName} (${lead.email || 'no email'}) - ${lead.company || 'no company'}`);
  });
  console.log('');

  // Find leads that don't have corresponding people records
  const allLeads = await prisma.leads.findMany({
    where: { 
      workspaceId: TOP_WORKSPACE_ID, 
      deletedAt: null
    },
    select: {
      id: true,
      fullName: true,
      email: true,
      personId: true
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
      email: true
    }
  });

  const peopleEmailSet = new Set(allPeople.map(p => p.email?.toLowerCase()).filter(Boolean));
  const peopleNameSet = new Set(allPeople.map(p => p.fullName.toLowerCase()));

  const orphanedLeads = allLeads.filter(lead => {
    // Check if lead has personId
    if (lead.personId) return false;
    
    // Check if there's a people record with same email
    if (lead.email && peopleEmailSet.has(lead.email.toLowerCase())) return false;
    
    // Check if there's a people record with same name
    if (peopleNameSet.has(lead.fullName.toLowerCase())) return false;
    
    return true;
  });

  console.log(`🚫 Orphaned leads (no people record): ${orphanedLeads.length}`);
  orphanedLeads.slice(0, 10).forEach((lead, index) => {
    console.log(`   ${index + 1}. ${lead.fullName} (${lead.email || 'no email'})`);
  });
  console.log('');

  return orphanedLeads;
}

async function findOrphanedProspects() {
  console.log('🔍 2. FINDING ORPHANED PROSPECTS');
  console.log('================================\n');
  
  // Find prospects without personId
  const prospectsWithoutPersonId = await prisma.prospects.findMany({
    where: { 
      workspaceId: TOP_WORKSPACE_ID, 
      deletedAt: null,
      personId: null
    },
    select: {
      id: true,
      fullName: true,
      email: true,
      company: true,
      jobTitle: true,
      createdAt: true
    },
    take: 10
  });

  console.log(`📊 Prospects without personId: ${prospectsWithoutPersonId.length} (showing first 10)`);
  prospectsWithoutPersonId.forEach((prospect, index) => {
    console.log(`   ${index + 1}. ${prospect.fullName} (${prospect.email || 'no email'}) - ${prospect.company || 'no company'}`);
  });
  console.log('');

  // Find prospects that don't have corresponding people records
  const allProspects = await prisma.prospects.findMany({
    where: { 
      workspaceId: TOP_WORKSPACE_ID, 
      deletedAt: null
    },
    select: {
      id: true,
      fullName: true,
      email: true,
      personId: true
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
      email: true
    }
  });

  const peopleEmailSet = new Set(allPeople.map(p => p.email?.toLowerCase()).filter(Boolean));
  const peopleNameSet = new Set(allPeople.map(p => p.fullName.toLowerCase()));

  const orphanedProspects = allProspects.filter(prospect => {
    // Check if prospect has personId
    if (prospect.personId) return false;
    
    // Check if there's a people record with same email
    if (prospect.email && peopleEmailSet.has(prospect.email.toLowerCase())) return false;
    
    // Check if there's a people record with same name
    if (peopleNameSet.has(prospect.fullName.toLowerCase())) return false;
    
    return true;
  });

  console.log(`🚫 Orphaned prospects (no people record): ${orphanedProspects.length}`);
  orphanedProspects.slice(0, 10).forEach((prospect, index) => {
    console.log(`   ${index + 1}. ${prospect.fullName} (${prospect.email || 'no email'})`);
  });
  console.log('');

  return orphanedProspects;
}

async function createMissingPeopleRecords() {
  console.log('👥 3. CREATING MISSING PEOPLE RECORDS');
  console.log('====================================\n');
  
  // Get all orphaned leads and prospects
  const allLeads = await prisma.leads.findMany({
    where: { 
      workspaceId: TOP_WORKSPACE_ID, 
      deletedAt: null,
      personId: null
    },
    select: {
      id: true,
      fullName: true,
      email: true,
      company: true,
      jobTitle: true,
      phone: true,
      mobilePhone: true,
      workPhone: true,
      linkedinUrl: true,
      address: true,
      city: true,
      state: true,
      country: true,
      postalCode: true
    }
  });

  const allProspects = await prisma.prospects.findMany({
    where: { 
      workspaceId: TOP_WORKSPACE_ID, 
      deletedAt: null,
      personId: null
    },
    select: {
      id: true,
      fullName: true,
      email: true,
      company: true,
      jobTitle: true,
      phone: true,
      mobilePhone: true,
      workPhone: true,
      linkedinUrl: true,
      address: true,
      city: true,
      state: true,
      country: true,
      postalCode: true
    }
  });

  // Get existing people to avoid duplicates
  const existingPeople = await prisma.people.findMany({
    where: { 
      workspaceId: TOP_WORKSPACE_ID, 
      deletedAt: null
    },
    select: {
      id: true,
      fullName: true,
      email: true
    }
  });

  const existingPeopleEmailSet = new Set(existingPeople.map(p => p.email?.toLowerCase()).filter(Boolean));
  const existingPeopleNameSet = new Set(existingPeople.map(p => p.fullName.toLowerCase()));

  // Combine and deduplicate
  const allRecords = [...allLeads, ...allProspects];
  const uniqueRecords = new Map();

  allRecords.forEach(record => {
    const key = record.email?.toLowerCase() || record.fullName.toLowerCase();
    if (!uniqueRecords.has(key)) {
      uniqueRecords.set(key, record);
    }
  });

  // Filter out records that already have people records
  const recordsToCreate = Array.from(uniqueRecords.values()).filter(record => {
    if (record.email && existingPeopleEmailSet.has(record.email.toLowerCase())) return false;
    if (existingPeopleNameSet.has(record.fullName.toLowerCase())) return false;
    return true;
  });

  console.log(`📊 Records to create as people: ${recordsToCreate.length}`);
  
  if (recordsToCreate.length === 0) {
    console.log('✅ No missing people records to create\n');
    return;
  }

  // Create people records in batches
  const batchSize = 100;
  let createdCount = 0;

  for (let i = 0; i < recordsToCreate.length; i += batchSize) {
    const batch = recordsToCreate.slice(i, i + batchSize);
    
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
        mobilePhone: record.mobilePhone,
        workPhone: record.workPhone,
        linkedinUrl: record.linkedinUrl,
        address: record.address,
        city: record.city,
        state: record.state,
        country: record.country,
        postalCode: record.postalCode,
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
      console.log(`   Created ${createdPeople.count} people records (batch ${Math.floor(i/batchSize) + 1})`);
    } catch (error) {
      console.error(`   Error creating batch ${Math.floor(i/batchSize) + 1}:`, error.message);
    }
  }

  console.log(`✅ Created ${createdCount} new people records\n`);
}

async function updatePersonIdReferences() {
  console.log('🔗 4. UPDATING PERSONID REFERENCES');
  console.log('==================================\n');
  
  // Get all people records
  const allPeople = await prisma.people.findMany({
    where: { 
      workspaceId: TOP_WORKSPACE_ID, 
      deletedAt: null
    },
    select: {
      id: true,
      fullName: true,
      email: true
    }
  });

  // Create lookup maps
  const peopleByEmail = new Map();
  const peopleByName = new Map();

  allPeople.forEach(person => {
    if (person.email) {
      peopleByEmail.set(person.email.toLowerCase(), person.id);
    }
    peopleByName.set(person.fullName.toLowerCase(), person.id);
  });

  // Update leads
  const leadsToUpdate = await prisma.leads.findMany({
    where: { 
      workspaceId: TOP_WORKSPACE_ID, 
      deletedAt: null,
      personId: null
    },
    select: {
      id: true,
      fullName: true,
      email: true
    }
  });

  let leadsUpdated = 0;
  for (const lead of leadsToUpdate) {
    let personId = null;
    
    // Try to find by email first
    if (lead.email) {
      personId = peopleByEmail.get(lead.email.toLowerCase());
    }
    
    // If not found by email, try by name
    if (!personId) {
      personId = peopleByName.get(lead.fullName.toLowerCase());
    }
    
    if (personId) {
      try {
        await prisma.leads.update({
          where: { id: lead.id },
          data: { personId: personId }
        });
        leadsUpdated++;
      } catch (error) {
        console.error(`   Error updating lead ${lead.id}:`, error.message);
      }
    }
  }

  console.log(`✅ Updated ${leadsUpdated} leads with personId references`);

  // Update prospects
  const prospectsToUpdate = await prisma.prospects.findMany({
    where: { 
      workspaceId: TOP_WORKSPACE_ID, 
      deletedAt: null,
      personId: null
    },
    select: {
      id: true,
      fullName: true,
      email: true
    }
  });

  let prospectsUpdated = 0;
  for (const prospect of prospectsToUpdate) {
    let personId = null;
    
    // Try to find by email first
    if (prospect.email) {
      personId = peopleByEmail.get(prospect.email.toLowerCase());
    }
    
    // If not found by email, try by name
    if (!personId) {
      personId = peopleByName.get(prospect.fullName.toLowerCase());
    }
    
    if (personId) {
      try {
        await prisma.prospects.update({
          where: { id: prospect.id },
          data: { personId: personId }
        });
        prospectsUpdated++;
      } catch (error) {
        console.error(`   Error updating prospect ${prospect.id}:`, error.message);
      }
    }
  }

  console.log(`✅ Updated ${prospectsUpdated} prospects with personId references\n`);
}

async function verifyFix() {
  console.log('✅ 5. VERIFYING THE FIX');
  console.log('=======================\n');
  
  // Get updated counts
  const [peopleCount, leadsCount, prospectsCount] = await Promise.all([
    prisma.people.count({ where: { workspaceId: TOP_WORKSPACE_ID, deletedAt: null } }),
    prisma.leads.count({ where: { workspaceId: TOP_WORKSPACE_ID, deletedAt: null } }),
    prisma.prospects.count({ where: { workspaceId: TOP_WORKSPACE_ID, deletedAt: null } })
  ]);

  const [leadsWithPersonId, prospectsWithPersonId] = await Promise.all([
    prisma.leads.count({
      where: { 
        workspaceId: TOP_WORKSPACE_ID, 
        deletedAt: null,
        personId: { not: null }
      }
    }),
    prisma.prospects.count({
      where: { 
        workspaceId: TOP_WORKSPACE_ID, 
        deletedAt: null,
        personId: { not: null }
      }
    })
  ]);

  console.log('📊 Updated Record Counts:');
  console.log(`   People: ${peopleCount.toLocaleString()}`);
  console.log(`   Leads: ${leadsCount.toLocaleString()}`);
  console.log(`   Prospects: ${prospectsCount.toLocaleString()}`);
  console.log(`   Total: ${(peopleCount + leadsCount + prospectsCount).toLocaleString()}\n`);

  console.log('🔗 PersonId References:');
  console.log(`   Leads with personId: ${leadsWithPersonId}/${leadsCount} (${((leadsWithPersonId/leadsCount)*100).toFixed(1)}%)`);
  console.log(`   Prospects with personId: ${prospectsWithPersonId}/${prospectsCount} (${((prospectsWithPersonId/prospectsCount)*100).toFixed(1)}%)\n`);

  const totalLeadsProspects = leadsCount + prospectsCount;
  const difference = Math.abs(peopleCount - totalLeadsProspects);

  console.log('🔍 Data Structure Check:');
  console.log(`   People: ${peopleCount.toLocaleString()}`);
  console.log(`   Leads + Prospects: ${totalLeadsProspects.toLocaleString()}`);
  console.log(`   Difference: ${difference.toLocaleString()} records\n`);

  if (difference === 0) {
    console.log('✅ SUCCESS: Data structure is now correct!');
    console.log('   People count matches leads + prospects count');
  } else if (peopleCount > totalLeadsProspects) {
    console.log('⚠️  Still have more people than leads+prospects');
    console.log(`   Difference: ${difference.toLocaleString()} extra people`);
  } else {
    console.log('⚠️  Still have more leads+prospects than people');
    console.log(`   Difference: ${difference.toLocaleString()} extra leads+prospects`);
  }

  console.log('\n🎯 RECOMMENDATIONS:');
  console.log('   1. Review any remaining orphaned records');
  console.log('   2. Consider data cleanup for duplicates');
  console.log('   3. Implement proper data validation for future imports');
  console.log('   4. Monitor data relationships going forward\n');
}

// Run the fix
fixOrphanedLeadsProspects().catch(console.error);
