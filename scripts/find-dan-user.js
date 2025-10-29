#!/usr/bin/env node

/**
 * 🔍 FIND DAN USER
 * 
 * Find Dan's actual user ID in the database
 */

const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function findDanUser() {
  try {
    console.log('🔍 FINDING DAN USER');
    console.log('===================');
    console.log('');

    await prisma.$connect();
    console.log('✅ Connected to database!\n');

    // Find all users with "Dan" in their name
    console.log('👤 ALL USERS WITH "DAN" IN NAME:');
    console.log('=================================');
    const danUsers = await prisma.users.findMany({
      where: {
        OR: [
          { name: { contains: 'Dan', mode: 'insensitive' } },
          { firstName: { contains: 'Dan', mode: 'insensitive' } },
          { lastName: { contains: 'Dan', mode: 'insensitive' } }
        ]
      },
      select: {
        id: true,
        name: true,
        firstName: true,
        lastName: true,
        email: true,
        username: true
      }
    });

    danUsers.forEach(user => {
      console.log(`   ${user.id} - ${user.name} (${user.email}) - @${user.username}`);
    });
    console.log('');

    // Find users by email
    console.log('📧 USERS BY EMAIL:');
    console.log('==================');
    const danByEmail = await prisma.users.findFirst({
      where: { email: 'dan@adrata.com' },
      select: {
        id: true,
        name: true,
        email: true,
        username: true
      }
    });

    if (danByEmail) {
      console.log(`✅ Found by email: ${danByEmail.id} - ${danByEmail.name} (${danByEmail.email})`);
    } else {
      console.log('❌ No user found with email dan@adrata.com');
    }
    console.log('');

    // Check workspace memberships
    console.log('🏢 WORKSPACE MEMBERSHIPS:');
    console.log('==========================');
    
    const adrataWorkspace = await prisma.workspaces.findFirst({
      where: {
        OR: [
          { slug: 'adrata' },
          { name: { contains: 'Adrata', mode: 'insensitive' } }
        ]
      },
      select: { id: true, name: true, slug: true }
    });

    if (adrataWorkspace) {
      console.log(`Adrata workspace: ${adrataWorkspace.id} - ${adrataWorkspace.name} (${adrataWorkspace.slug})`);
      
      // Find users in Adrata workspace
      const workspaceUsers = await prisma.accounts.findMany({
        where: { workspaceId: adrataWorkspace.id },
        select: {
          assignedUserId: true,
          user: {
            select: {
              id: true,
              name: true,
              email: true
            }
          }
        }
      });

      const uniqueUsers = workspaceUsers.reduce((acc, account) => {
        if (account.user && !acc.find(u => u.id === account.user.id)) {
          acc.push(account.user);
        }
        return acc;
      }, []);

      console.log(`Users in Adrata workspace: ${uniqueUsers.length}`);
      uniqueUsers.forEach(user => {
        console.log(`   ${user.id} - ${user.name} (${user.email})`);
      });
    } else {
      console.log('❌ Adrata workspace not found');
    }
    console.log('');

    // Check who the current companies are assigned to
    console.log('🏢 CURRENT COMPANY ASSIGNMENTS:');
    console.log('===============================');
    const companies = await prisma.companies.findMany({
      where: {
        workspaceId: adrataWorkspace?.id,
        deletedAt: null
      },
      select: {
        id: true,
        name: true,
        mainSellerId: true
      }
    });

    const sellerIds = [...new Set(companies.map(c => c.mainSellerId).filter(Boolean))];
    console.log(`Companies assigned to ${sellerIds.length} different sellers:`);
    
    for (const sellerId of sellerIds) {
      const seller = await prisma.users.findUnique({
        where: { id: sellerId },
        select: { id: true, name: true, email: true }
      });
      
      const count = companies.filter(c => c.mainSellerId === sellerId).length;
      console.log(`   ${sellerId} - ${seller?.name || 'Unknown'} (${seller?.email || 'Unknown'}) - ${count} companies`);
    }

  } catch (error) {
    console.error('❌ ERROR:', error);
    console.error('Stack trace:', error.stack);
  } finally {
    await prisma.$disconnect();
    console.log('\n🔌 Disconnected from database');
  }
}

// Run the script
findDanUser();
