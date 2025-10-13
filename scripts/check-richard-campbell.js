#!/usr/bin/env node

/**
 * CHECK RICHARD CAMPBELL ACTIONS
 * Check if Richard Campbell exists and has actions in the database
 */

const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function checkRichardCampbell() {
  console.log('🔍 CHECKING RICHARD CAMPBELL');
  console.log('============================\n');

  try {
    // Find Richard Campbell
    const richard = await prisma.people.findFirst({
      where: {
        OR: [
          { fullName: { contains: 'Richard Campbell', mode: 'insensitive' } },
          { firstName: { contains: 'Richard', mode: 'insensitive' } },
          { lastName: { contains: 'Campbell', mode: 'insensitive' } }
        ]
      },
      include: {
        company: {
          select: { id: true, name: true }
        },
        actions: {
          select: {
            id: true,
            type: true,
            subject: true,
            description: true,
            status: true,
            createdAt: true,
            completedAt: true
          },
          orderBy: { createdAt: 'desc' },
          take: 10
        }
      }
    });

    if (!richard) {
      console.log('❌ Richard Campbell not found in database');
      
      // Let's see what people we do have
      const allPeople = await prisma.people.findMany({
        select: {
          id: true,
          fullName: true,
          firstName: true,
          lastName: true,
          email: true
        },
        take: 10
      });
      
      console.log('\n📋 Available people in database:');
      allPeople.forEach((person, i) => {
        console.log(`  ${i + 1}. ${person.fullName} (${person.email})`);
      });
      
      return;
    }

    console.log(`✅ Found Richard Campbell:`);
    console.log(`   ID: ${richard.id}`);
    console.log(`   Name: ${richard.fullName}`);
    console.log(`   Email: ${richard.email || 'No email'}`);
    console.log(`   Company: ${richard.company?.name || 'No company'}`);
    console.log(`   Last Action: ${richard.lastAction || 'No action'}`);
    console.log(`   Last Action Date: ${richard.lastActionDate || 'No date'}`);

    console.log(`\n📊 Actions for Richard Campbell: ${richard.actions.length}`);
    
    if (richard.actions.length === 0) {
      console.log('❌ NO ACTIONS FOUND - This explains why timeline shows no actions');
      
      // Check if there are any actions in the database at all
      const totalActions = await prisma.actions.count();
      console.log(`\n📈 Total actions in database: ${totalActions}`);
      
      if (totalActions > 0) {
        console.log('\n🔍 Sample actions in database:');
        const sampleActions = await prisma.actions.findMany({
          select: {
            id: true,
            type: true,
            subject: true,
            personId: true,
            companyId: true,
            createdAt: true
          },
          take: 5,
          orderBy: { createdAt: 'desc' }
        });
        
        sampleActions.forEach((action, i) => {
          console.log(`  ${i + 1}. ${action.subject} (${action.type}) - Person: ${action.personId || 'None'}`);
        });
      }
    } else {
      console.log('\n📋 Actions found:');
      richard.actions.forEach((action, i) => {
        console.log(`  ${i + 1}. ${action.subject}`);
        console.log(`     Type: ${action.type}`);
        console.log(`     Status: ${action.status}`);
        console.log(`     Created: ${action.createdAt}`);
        if (action.completedAt) console.log(`     Completed: ${action.completedAt}`);
        console.log('');
      });
    }

    // Check timeline tab API call
    console.log('\n🔍 Timeline Tab API Investigation:');
    console.log('The timeline tab makes these API calls:');
    console.log('1. /api/v1/actions?companyId=${record.id}&personId=${record.id}');
    console.log('2. /api/v1/people?companyId=${record.id}');
    console.log('3. /api/v1/companies?id=${record.id}');
    
    console.log(`\nFor Richard Campbell (ID: ${richard.id}), the timeline would call:`);
    console.log(`- /api/v1/actions?companyId=${richard.id}&personId=${richard.id}`);
    console.log(`- /api/v1/people?companyId=${richard.id}`);
    console.log(`- /api/v1/companies?id=${richard.id}`);

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the check
checkRichardCampbell();
