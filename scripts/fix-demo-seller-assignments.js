#!/usr/bin/env node

/**
 * 🔄 FIX DEMO SELLER ASSIGNMENTS
 * 
 * Sets Dan as main seller and Ross as co-seller for all Demo workspace data
 */

const { PrismaClient } = require('@prisma/client');

const newPrisma = new PrismaClient();

async function fixDemoSellerAssignments() {
  try {
    console.log('🔄 Fixing Demo seller assignments...\n');
    
    await newPrisma.$connect();
    console.log('✅ Connected to database!\n');

    // 1. Find users
    const dan = await newPrisma.users.findFirst({
      where: { name: { contains: 'Dan', mode: 'insensitive' } }
    });
    
    const ross = await newPrisma.users.findFirst({
      where: { name: { contains: 'Ross', mode: 'insensitive' } }
    });
    
    if (!dan || !ross) {
      throw new Error('Dan or Ross user not found!');
    }
    
    console.log(`✅ Dan: ${dan.name} (${dan.id})`);
    console.log(`✅ Ross: ${ross.name} (${ross.id})`);

    // 2. Find Demo workspace
    const demoWorkspace = await newPrisma.workspaces.findFirst({
      where: { name: { contains: 'Demo', mode: 'insensitive' } }
    });
    
    if (!demoWorkspace) {
      throw new Error('Demo workspace not found!');
    }
    
    console.log(`✅ Demo workspace: ${demoWorkspace.name} (${demoWorkspace.id})`);

    // 3. Get current counts
    const demoCompanies = await newPrisma.companies.count({
      where: { workspaceId: demoWorkspace.id }
    });
    
    const demoPeople = await newPrisma.people.count({
      where: { workspaceId: demoWorkspace.id }
    });
    
    console.log(`\n📊 DEMO WORKSPACE DATA:`);
    console.log(`   Companies: ${demoCompanies}`);
    console.log(`   People: ${demoPeople}`);

    // 4. Set Dan as main seller for all companies
    console.log('\n👑 SETTING DAN AS MAIN SELLER FOR ALL COMPANIES:');
    const companiesUpdated = await newPrisma.companies.updateMany({
      where: { workspaceId: demoWorkspace.id },
      data: { mainSellerId: dan.id }
    });
    console.log(`✅ Updated ${companiesUpdated.count} companies with Dan as main seller`);

    // 5. Set Dan as main seller for all people
    console.log('\n👑 SETTING DAN AS MAIN SELLER FOR ALL PEOPLE:');
    const peopleUpdated = await newPrisma.people.updateMany({
      where: { workspaceId: demoWorkspace.id },
      data: { mainSellerId: dan.id }
    });
    console.log(`✅ Updated ${peopleUpdated.count} people with Dan as main seller`);

    // 6. Clear existing co-seller relationships for Demo workspace people
    console.log('\n🗑️ CLEARING EXISTING CO-SELLER RELATIONSHIPS:');
    
    // Get all people in Demo workspace
    const demoPeopleRecords = await newPrisma.people.findMany({
      where: { workspaceId: demoWorkspace.id },
      select: { id: true }
    });
    
    const peopleIds = demoPeopleRecords.map(p => p.id);
    
    // Delete existing co-seller relationships for these people
    const deletedCoSellers = await newPrisma.person_co_sellers.deleteMany({
      where: { personId: { in: peopleIds } }
    });
    console.log(`✅ Deleted ${deletedCoSellers.count} existing co-seller relationships`);

    // 7. Add Ross as co-seller for all people
    console.log('\n👥 ADDING ROSS AS CO-SELLER FOR ALL PEOPLE:');
    
    const coSellerData = peopleIds.map(personId => ({
      personId: personId,
      userId: ross.id
    }));
    
    // Insert in batches to avoid query size limits
    const batchSize = 1000;
    let totalCoSellersAdded = 0;
    
    for (let i = 0; i < coSellerData.length; i += batchSize) {
      const batch = coSellerData.slice(i, i + batchSize);
      const result = await newPrisma.person_co_sellers.createMany({
        data: batch
      });
      totalCoSellersAdded += result.count;
      console.log(`   Added ${result.count} co-seller relationships (batch ${Math.floor(i/batchSize) + 1})`);
    }
    
    console.log(`✅ Added ${totalCoSellersAdded} co-seller relationships with Ross`);

    // 8. Summary
    console.log('\n📊 ASSIGNMENT SUMMARY:');
    console.log('======================');
    console.log(`✅ Dan is main seller for ${companiesUpdated.count} companies`);
    console.log(`✅ Dan is main seller for ${peopleUpdated.count} people`);
    console.log(`✅ Ross is co-seller for ${totalCoSellersAdded} people`);
    console.log('\n🎉 Demo seller assignments fixed successfully!');

  } catch (error) {
    console.error('❌ Error during seller assignment fix:', error);
  } finally {
    await newPrisma.$disconnect();
  }
}

// Run the fix
fixDemoSellerAssignments();
