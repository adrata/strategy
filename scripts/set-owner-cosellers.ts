#!/usr/bin/env tsx

/**
 * Set Owner and Co-Sellers Script
 * 
 * This script sets Dan as the owner and Ross as a co-seller for all people in the database.
 * It's designed to populate the multi-player sales system with initial data.
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function findUserByEmail(email: string) {
  return await prisma.users.findFirst({
    where: { email }
  });
}

async function findUserByName(firstName: string, lastName: string) {
  return await prisma.users.findFirst({
    where: {
      AND: [
        { firstName: { contains: firstName, mode: 'insensitive' } },
        { lastName: { contains: lastName, mode: 'insensitive' } }
      ]
    }
  });
}

async function setOwnerAndCoSellers() {
  console.log('🚀 Starting owner and co-seller assignment...');
  
  try {
    // Find Dan's user ID
    let dan = await findUserByEmail('dan@adrata.com');
    if (!dan) {
      dan = await findUserByName('Dan', 'Sylvester');
    }
    if (!dan) {
      dan = await findUserByName('Dan', '');
    }
    
    if (!dan) {
      console.log('❌ Could not find Dan user. Please check the database.');
      console.log('Available users:');
      const users = await prisma.users.findMany({
        select: { id: true, email: true, firstName: true, lastName: true, name: true }
      });
      console.table(users);
      return;
    }
    
    console.log(`✅ Found Dan: ${dan.name || dan.email} (ID: ${dan.id})`);
    
    // Find Ross's user ID
    let ross = await findUserByEmail('ross@adrata.com');
    if (!ross) {
      ross = await findUserByName('Ross', 'Sylvester');
    }
    if (!ross) {
      ross = await findUserByName('Ross', '');
    }
    
    if (!ross) {
      console.log('❌ Could not find Ross user. Please check the database.');
      console.log('Available users:');
      const users = await prisma.users.findMany({
        select: { id: true, email: true, firstName: true, lastName: true, name: true }
      });
      console.table(users);
      return;
    }
    
    console.log(`✅ Found Ross: ${ross.name || ross.email} (ID: ${ross.id})`);
    
    // Get all people
    const allPeople = await prisma.people.findMany({
      select: { id: true, fullName: true, email: true }
    });
    
    console.log(`📊 Found ${allPeople.length} people to update`);
    
    if (allPeople.length === 0) {
      console.log('⚠️ No people found in the database. Nothing to update.');
      return;
    }
    
    // Update all people to have Dan as owner
    console.log('👑 Setting Dan as owner for all people...');
    const updateResult = await prisma.people.updateMany({
      where: {
        id: { in: allPeople.map(p => p.id) }
      },
      data: {
        ownerId: dan.id
      }
    });
    
    console.log(`✅ Updated ${updateResult.count} people with Dan as owner`);
    
    // Add Ross as co-seller for all people
    console.log('🤝 Adding Ross as co-seller for all people...');
    
    // First, remove any existing co-seller relationships for Ross
    await prisma.person_co_sellers.deleteMany({
      where: { userId: ross.id }
    });
    
    // Then add Ross as co-seller for all people
    const coSellerRecords = allPeople.map(person => ({
      personId: person.id,
      userId: ross.id
    }));
    
    const coSellerResult = await prisma.person_co_sellers.createMany({
      data: coSellerRecords,
      skipDuplicates: true
    });
    
    console.log(`✅ Added Ross as co-seller for ${coSellerResult.count} people`);
    
    // Verify the results
    console.log('🔍 Verifying results...');
    
    const peopleWithDanAsOwner = await prisma.people.count({
      where: { ownerId: dan.id }
    });
    
    const peopleWithRossAsCoSeller = await prisma.person_co_sellers.count({
      where: { userId: ross.id }
    });
    
    console.log(`📈 Final Results:`);
    console.log(`   - People with Dan as owner: ${peopleWithDanAsOwner}`);
    console.log(`   - People with Ross as co-seller: ${peopleWithRossAsCoSeller}`);
    
    // Show a sample of the results
    const samplePeople = await prisma.people.findMany({
      where: { ownerId: dan.id },
      take: 5,
      select: {
        id: true,
        fullName: true,
        email: true,
        owner: {
          select: { name: true, email: true }
        },
        coSellers: {
          select: {
            user: {
              select: { name: true, email: true }
            }
          }
        }
      }
    });
    
    console.log('\n📋 Sample Results:');
    samplePeople.forEach((person, index) => {
      console.log(`${index + 1}. ${person.fullName} (${person.email})`);
      console.log(`   Owner: ${person.owner?.name || person.owner?.email || 'None'}`);
      console.log(`   Co-sellers: ${person.coSellers.map(cs => cs.user.name || cs.user.email).join(', ') || 'None'}`);
    });
    
    console.log('\n🎉 Owner and co-seller assignment completed successfully!');
    
  } catch (error) {
    console.error('❌ Error during owner and co-seller assignment:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Run the script
if (require.main === module) {
  setOwnerAndCoSellers()
    .then(() => {
      console.log('✅ Script completed successfully');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ Script failed:', error);
      process.exit(1);
    });
}

export { setOwnerAndCoSellers };
