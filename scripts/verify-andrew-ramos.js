#!/usr/bin/env node

const { PrismaClient } = require('@prisma/client');

async function checkAndrewRamos() {
  const prisma = new PrismaClient();
  
  try {
    const andrew = await prisma.people.findFirst({
      where: {
        fullName: { contains: 'Andrew Ramos', mode: 'insensitive' },
        deletedAt: null
      },
      include: {
        company: { select: { name: true } }
      }
    });
    
    if (andrew) {
      console.log('🔍 Andrew Ramos Record:');
      console.log('   Name:', andrew.fullName);
      console.log('   Company:', andrew.company?.name);
      console.log('   Job Title:', andrew.jobTitle);
      console.log('   Buyer Group Role:', andrew.buyerGroupRole);
      console.log('   Is Buyer Group Member:', andrew.isBuyerGroupMember);
      console.log('   Status:', andrew.status);
    } else {
      console.log('❌ Andrew Ramos not found');
    }
    
    // Also check a few other people to verify the fixes
    const samplePeople = await prisma.people.findMany({
      where: {
        deletedAt: null,
        buyerGroupRole: { not: null }
      },
      take: 5,
      include: {
        company: { select: { name: true } }
      }
    });
    
    console.log('\n📊 Sample of Fixed Records:');
    samplePeople.forEach((person, index) => {
      console.log(`   ${index + 1}. ${person.fullName} (${person.company?.name})`);
      console.log(`      Role: ${person.buyerGroupRole}`);
      console.log(`      Member: ${person.isBuyerGroupMember}`);
    });
    
    // Check overall statistics
    const totalPeople = await prisma.people.count({
      where: { deletedAt: null }
    });
    
    const peopleWithRoles = await prisma.people.count({
      where: { 
        deletedAt: null,
        buyerGroupRole: { not: null }
      }
    });
    
    const peopleWithMembership = await prisma.people.count({
      where: { 
        deletedAt: null,
        isBuyerGroupMember: true
      }
    });
    
    console.log('\n📈 Overall Statistics After Fix:');
    console.log(`   Total People: ${totalPeople}`);
    console.log(`   People with Roles: ${peopleWithRoles} (${((peopleWithRoles / totalPeople) * 100).toFixed(1)}%)`);
    console.log(`   People with Membership: ${peopleWithMembership} (${((peopleWithMembership / totalPeople) * 100).toFixed(1)}%)`);
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkAndrewRamos();
