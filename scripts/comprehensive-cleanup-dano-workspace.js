#!/usr/bin/env node

const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

const NOTARY_WORKSPACE_ID = '01K1VBYmf75hgmvmz06psnc9ug';
const DANO_USER_ID = '01K1VBYV8ETM2RCQA4GNN9EG72'; // Dano's user ID

async function comprehensiveCleanup() {
  try {
    console.log('🧹 Starting comprehensive cleanup for Dano workspace...');
    
    // Step 1: Permanently delete all soft-deleted records
    console.log('\n🗑️  Step 1: Permanently deleting soft-deleted records...');
    
    const softDeletedLeads = await prisma.leads.count({
      where: { workspaceId: NOTARY_WORKSPACE_ID, deletedAt: { not: null } }
    });
    
    const softDeletedProspects = await prisma.prospects.count({
      where: { workspaceId: NOTARY_WORKSPACE_ID, deletedAt: { not: null } }
    });
    
    const softDeletedPeople = await prisma.people.count({
      where: { workspaceId: NOTARY_WORKSPACE_ID, deletedAt: { not: null } }
    });
    
    const softDeletedCompanies = await prisma.companies.count({
      where: { workspaceId: NOTARY_WORKSPACE_ID, deletedAt: { not: null } }
    });
    
    console.log(`Found soft-deleted records:`);
    console.log(`- Leads: ${softDeletedLeads}`);
    console.log(`- Prospects: ${softDeletedProspects}`);
    console.log(`- People: ${softDeletedPeople}`);
    console.log(`- Companies: ${softDeletedCompanies}`);
    
    // Permanently delete soft-deleted records
    await prisma.leads.deleteMany({
      where: { workspaceId: NOTARY_WORKSPACE_ID, deletedAt: { not: null } }
    });
    
    await prisma.prospects.deleteMany({
      where: { workspaceId: NOTARY_WORKSPACE_ID, deletedAt: { not: null } }
    });
    
    await prisma.people.deleteMany({
      where: { workspaceId: NOTARY_WORKSPACE_ID, deletedAt: { not: null } }
    });
    
    await prisma.companies.deleteMany({
      where: { workspaceId: NOTARY_WORKSPACE_ID, deletedAt: { not: null } }
    });
    
    console.log('✅ Permanently deleted all soft-deleted records');
    
    // Step 2: Fix duplicate people
    console.log('\n👥 Step 2: Fixing duplicate people...');
    
    const allPeople = await prisma.people.findMany({
      where: { workspaceId: NOTARY_WORKSPACE_ID },
      select: {
        id: true,
        fullName: true,
        email: true,
        workEmail: true,
        personalEmail: true,
        createdAt: true
      },
      orderBy: { createdAt: 'asc' }
    });
    
    const peopleMap = new Map();
    const duplicatesToDelete = [];
    
    allPeople.forEach(person => {
      const emails = [person.email, person.workEmail, person.personalEmail].filter(Boolean);
      const key = `${person.fullName}_${emails.join('_')}`;
      
      if (peopleMap.has(key)) {
        // Keep the older record, mark newer one for deletion
        const existing = peopleMap.get(key);
        if (person.createdAt > existing.createdAt) {
          duplicatesToDelete.push(person.id);
        } else {
          duplicatesToDelete.push(existing.id);
          peopleMap.set(key, person);
        }
      } else {
        peopleMap.set(key, person);
      }
    });
    
    console.log(`Found ${duplicatesToDelete.length} duplicate people to delete`);
    
    if (duplicatesToDelete.length > 0) {
      await prisma.people.deleteMany({
        where: { id: { in: duplicatesToDelete } }
      });
      console.log('✅ Deleted duplicate people');
    }
    
    // Step 3: Ensure 1:1 relationship between prospects and people
    console.log('\n🔗 Step 3: Ensuring 1:1 prospect-people relationships...');
    
    const prospects = await prisma.prospects.findMany({
      where: { workspaceId: NOTARY_WORKSPACE_ID },
      select: {
        id: true,
        fullName: true,
        email: true,
        workEmail: true,
        personalEmail: true,
        personId: true
      }
    });
    
    const people = await prisma.people.findMany({
      where: { workspaceId: NOTARY_WORKSPACE_ID },
      select: {
        id: true,
        fullName: true,
        email: true,
        workEmail: true,
        personalEmail: true
      }
    });
    
    // Create email lookup for people
    const peopleByEmail = new Map();
    people.forEach(person => {
      const emails = [person.email, person.workEmail, person.personalEmail].filter(Boolean);
      emails.forEach(email => {
        if (!peopleByEmail.has(email)) {
          peopleByEmail.set(email, []);
        }
        peopleByEmail.get(email).push(person);
      });
    });
    
    let updatedProspects = 0;
    
    for (const prospect of prospects) {
      if (!prospect.personId) {
        // Find matching person by email
        const emails = [prospect.email, prospect.workEmail, prospect.personalEmail].filter(Boolean);
        let matchingPerson = null;
        
        for (const email of emails) {
          if (peopleByEmail.has(email)) {
            matchingPerson = peopleByEmail.get(email)[0];
            break;
          }
        }
        
        if (matchingPerson) {
          await prisma.prospects.update({
            where: { id: prospect.id },
            data: { personId: matchingPerson.id }
          });
          updatedProspects++;
        }
      }
    }
    
    console.log(`✅ Updated ${updatedProspects} prospects with personId`);
    
    // Step 4: Ensure all prospects have corresponding companies
    console.log('\n🏢 Step 4: Ensuring all prospects have corresponding companies...');
    
    const prospectsWithCompanies = await prisma.prospects.findMany({
      where: { 
        workspaceId: NOTARY_WORKSPACE_ID,
        company: { not: null }
      },
      select: { company: true }
    });
    
    const uniqueCompanies = [...new Set(prospectsWithCompanies.map(p => p.company))];
    const existingCompanies = await prisma.companies.findMany({
      where: { workspaceId: NOTARY_WORKSPACE_ID },
      select: { name: true }
    });
    
    const existingCompanyNames = new Set(existingCompanies.map(c => c.name));
    const missingCompanies = uniqueCompanies.filter(name => !existingCompanyNames.has(name));
    
    console.log(`Found ${missingCompanies.length} missing companies to create`);
    
    let createdCompanies = 0;
    for (const companyName of missingCompanies) {
      if (companyName) {
        const companyId = `acc_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`;
        await prisma.companies.create({
          data: {
            id: companyId,
            workspaceId: NOTARY_WORKSPACE_ID,
            name: companyName,
            createdAt: new Date(),
            updatedAt: new Date()
          }
        });
        createdCompanies++;
      }
    }
    
    console.log(`✅ Created ${createdCompanies} missing companies`);
    
    // Step 5: Assign all records to Dano
    console.log('\n👤 Step 5: Assigning all records to Dano...');
    
    const updatedProspectsAssigned = await prisma.prospects.updateMany({
      where: { 
        workspaceId: NOTARY_WORKSPACE_ID,
        assignedUserId: { not: DANO_USER_ID }
      },
      data: { assignedUserId: DANO_USER_ID }
    });
    
    const updatedPeopleAssigned = await prisma.people.updateMany({
      where: { 
        workspaceId: NOTARY_WORKSPACE_ID,
        assignedUserId: { not: DANO_USER_ID }
      },
      data: { assignedUserId: DANO_USER_ID }
    });
    
    const updatedCompaniesAssigned = await prisma.companies.updateMany({
      where: { 
        workspaceId: NOTARY_WORKSPACE_ID,
        assignedUserId: { not: DANO_USER_ID }
      },
      data: { assignedUserId: DANO_USER_ID }
    });
    
    console.log(`✅ Assigned records to Dano:`);
    console.log(`- Prospects: ${updatedProspectsAssigned.count}`);
    console.log(`- People: ${updatedPeopleAssigned.count}`);
    console.log(`- Companies: ${updatedCompaniesAssigned.count}`);
    
    // Final verification
    console.log('\n📊 Final verification:');
    
    const finalCounts = await Promise.all([
      prisma.leads.count({ where: { workspaceId: NOTARY_WORKSPACE_ID } }),
      prisma.prospects.count({ where: { workspaceId: NOTARY_WORKSPACE_ID } }),
      prisma.people.count({ where: { workspaceId: NOTARY_WORKSPACE_ID } }),
      prisma.companies.count({ where: { workspaceId: NOTARY_WORKSPACE_ID } }),
      prisma.prospects.count({ 
        where: { 
          workspaceId: NOTARY_WORKSPACE_ID,
          personId: { not: null }
        }
      })
    ]);
    
    console.log(`- Leads: ${finalCounts[0]}`);
    console.log(`- Prospects: ${finalCounts[1]}`);
    console.log(`- People: ${finalCounts[2]}`);
    console.log(`- Companies: ${finalCounts[3]}`);
    console.log(`- Prospects with personId: ${finalCounts[4]} (${Math.round(finalCounts[4]/finalCounts[1]*100)}%)`);
    
    // Check for 1:1 relationship
    const peopleWithProspects = await prisma.people.count({
      where: {
        workspaceId: NOTARY_WORKSPACE_ID,
        prospects: { some: {} }
      }
    });
    
    console.log(`- People with prospects: ${peopleWithProspects}`);
    
    if (finalCounts[2] === finalCounts[4] && finalCounts[2] === peopleWithProspects) {
      console.log('✅ Perfect 1:1 relationship between prospects and people!');
    } else {
      console.log('⚠️  Not quite 1:1 - some cleanup may be needed');
    }
    
  } catch (error) {
    console.error('❌ Fatal error during cleanup:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the comprehensive cleanup
comprehensiveCleanup();
