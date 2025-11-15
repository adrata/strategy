#!/usr/bin/env node

/**
 * Replace Temp Users with Real Production Users in TOP Workspace
 * 
 * 1. Finds all temp users (temp-victoria, temp-justin, temp-judy, temp-hilary)
 * 2. Creates real production users for them (or uses existing ones)
 * 3. Reassigns all people and companies from temp users to real users
 * 4. Removes temp users from workspace
 */

require('dotenv').config();
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

const TOP_WORKSPACE_ID = '01K75ZD7DWHG1XF16HAF2YVKCK';

// Mapping of temp users to real production users
const USER_MAPPINGS = [
  {
    tempEmail: 'temp-victoria@top-temp.com',
    tempUsername: 'temp-victoria',
    realEmail: 'vleland@topengineersplus.com',
    realUsername: 'vleland',
    name: 'Victoria Leland',
    firstName: 'Victoria',
    lastName: 'Leland'
  },
  {
    tempEmail: 'temp-justin@top-temp.com',
    tempUsername: 'temp-justin',
    realEmail: 'justin@topengineersplus.com',
    realUsername: 'justin',
    name: 'Justin Bedard',
    firstName: 'Justin',
    lastName: 'Bedard'
  },
  {
    tempEmail: 'temp-judy@top-temp.com',
    tempUsername: 'temp-judy',
    realEmail: 'judy@topengineersplus.com',
    realUsername: 'judy',
    name: 'Judy Wigginton',
    firstName: 'Judy',
    lastName: 'Wigginton'
  },
  {
    tempEmail: 'temp-hilary@top-temp.com',
    tempUsername: 'temp-hilary',
    realEmail: 'hilary@topengineersplus.com',
    realUsername: 'hilary',
    name: 'Hilary Tristan',
    firstName: 'Hilary',
    lastName: 'Tristan'
  }
];

async function replaceTempUsersWithRealUsers() {
  console.log('🔄 REPLACING TEMP USERS WITH REAL PRODUCTION USERS');
  console.log('===================================================');
  console.log('');

  try {
    await prisma.$connect();
    console.log('✅ Connected to database');
    console.log('');

    // Get workspace info
    const workspace = await prisma.workspaces.findUnique({
      where: { id: TOP_WORKSPACE_ID },
      select: { id: true, name: true, slug: true }
    });

    if (!workspace) {
      console.log('❌ TOP workspace not found!');
      return;
    }

    console.log(`✅ Workspace: ${workspace.name} (${workspace.slug})`);
    console.log('');

    const stats = {
      usersCreated: 0,
      usersFound: 0,
      peopleReassigned: 0,
      companiesReassigned: 0,
      workspaceMembershipsRemoved: 0,
      errors: []
    };

    // Process each user mapping
    for (const mapping of USER_MAPPINGS) {
      console.log(`👤 Processing ${mapping.name}...`);
      console.log(`   Temp: ${mapping.tempEmail}`);
      console.log(`   Real: ${mapping.realEmail}`);
      console.log('');

      // Step 1: Find temp user
      const tempUser = await prisma.users.findFirst({
        where: {
          OR: [
            { email: mapping.tempEmail },
            { username: mapping.tempUsername }
          ]
        },
        select: {
          id: true,
          name: true,
          email: true,
          username: true
        }
      });

      if (!tempUser) {
        console.log(`   ⚠️  Temp user not found, skipping...`);
        console.log('');
        continue;
      }

      console.log(`   ✅ Found temp user: ${tempUser.name} (${tempUser.id})`);

      // Step 2: Find or create real user
      let realUser = await prisma.users.findFirst({
        where: {
          OR: [
            { email: mapping.realEmail },
            { username: mapping.realUsername }
          ]
        },
        select: {
          id: true,
          name: true,
          email: true,
          username: true
        }
      });

      if (!realUser) {
        // Victoria already exists, so if we can't find the real user, skip creation for her
        if (mapping.realEmail === 'vleland@topengineersplus.com') {
          console.log(`   ⚠️  Real user not found for ${mapping.name}, but skipping creation (should already exist)`);
          console.log('');
          continue;
        }
        
        console.log(`   📝 Creating real user: ${mapping.realEmail}...`);
        try {
          realUser = await prisma.users.create({
            data: {
              email: mapping.realEmail,
              username: mapping.realUsername,
              name: mapping.name,
              firstName: mapping.firstName,
              lastName: mapping.lastName,
              isActive: true,
              createdAt: new Date(),
              updatedAt: new Date()
            }
          });
          console.log(`   ✅ Created real user: ${realUser.name} (${realUser.id})`);
          stats.usersCreated++;
        } catch (error) {
          if (error.code === 'P2002') {
            // Unique constraint - user might exist with different email/username
            console.log(`   ⚠️  Username or email already exists, trying to find user...`);
            realUser = await prisma.users.findFirst({
              where: {
                OR: [
                  { email: mapping.realEmail },
                  { username: mapping.realUsername },
                  { name: { contains: mapping.firstName, mode: 'insensitive' } }
                ]
              },
              select: {
                id: true,
                name: true,
                email: true,
                username: true
              }
            });
            if (realUser) {
              console.log(`   ✅ Found existing user: ${realUser.name} (${realUser.id})`);
              stats.usersFound++;
            } else {
              console.log(`   ❌ Could not create or find user, skipping...`);
              console.log('');
              continue;
            }
          } else {
            throw error;
          }
        }
      } else {
        console.log(`   ✅ Found existing real user: ${realUser.name} (${realUser.id})`);
        stats.usersFound++;
      }
      console.log('');

      // Step 3: Ensure real user is in workspace
      const workspaceMembership = await prisma.workspace_users.findFirst({
        where: {
          workspaceId: TOP_WORKSPACE_ID,
          userId: realUser.id
        }
      });

      if (!workspaceMembership) {
        console.log(`   🔐 Adding real user to workspace...`);
        await prisma.workspace_users.create({
          data: {
            workspaceId: TOP_WORKSPACE_ID,
            userId: realUser.id,
            role: 'SELLER',
            isActive: true,
            createdAt: new Date(),
            updatedAt: new Date()
          }
        });
        console.log(`   ✅ Added to workspace as SELLER`);
      } else {
        console.log(`   ✅ Already in workspace (role: ${workspaceMembership.role})`);
      }
      console.log('');

      // Step 4: Count records to reassign
      const peopleToReassign = await prisma.people.count({
        where: {
          workspaceId: TOP_WORKSPACE_ID,
          deletedAt: null,
          mainSellerId: tempUser.id
        }
      });

      const companiesToReassign = await prisma.companies.count({
        where: {
          workspaceId: TOP_WORKSPACE_ID,
          deletedAt: null,
          mainSellerId: tempUser.id
        }
      });

      console.log(`   📊 Records to reassign:`);
      console.log(`      People: ${peopleToReassign}`);
      console.log(`      Companies: ${companiesToReassign}`);
      console.log('');

      // Step 5: Reassign people
      if (peopleToReassign > 0) {
        console.log(`   👥 Reassigning ${peopleToReassign} people...`);
        const peopleResult = await prisma.people.updateMany({
          where: {
            workspaceId: TOP_WORKSPACE_ID,
            deletedAt: null,
            mainSellerId: tempUser.id
          },
          data: {
            mainSellerId: realUser.id,
            updatedAt: new Date()
          }
        });
        console.log(`   ✅ Reassigned ${peopleResult.count} people`);
        stats.peopleReassigned += peopleResult.count;
      }

      // Step 6: Reassign companies
      if (companiesToReassign > 0) {
        console.log(`   🏢 Reassigning ${companiesToReassign} companies...`);
        const companiesResult = await prisma.companies.updateMany({
          where: {
            workspaceId: TOP_WORKSPACE_ID,
            deletedAt: null,
            mainSellerId: tempUser.id
          },
          data: {
            mainSellerId: realUser.id,
            updatedAt: new Date()
          }
        });
        console.log(`   ✅ Reassigned ${companiesResult.count} companies`);
        stats.companiesReassigned += companiesResult.count;
      }

      // Step 7: Remove temp user from workspace
      const tempWorkspaceMembership = await prisma.workspace_users.findFirst({
        where: {
          workspaceId: TOP_WORKSPACE_ID,
          userId: tempUser.id
        }
      });

      if (tempWorkspaceMembership) {
        console.log(`   🗑️  Removing temp user from workspace...`);
        await prisma.workspace_users.delete({
          where: { id: tempWorkspaceMembership.id }
        });
        console.log(`   ✅ Removed temp user from workspace`);
        stats.workspaceMembershipsRemoved++;
      } else {
        console.log(`   ℹ️  Temp user not in workspace`);
      }

      console.log('');
      console.log(`   ✅ Completed processing ${mapping.name}`);
      console.log('');
    }

    // Final summary
    console.log('📊 FINAL SUMMARY');
    console.log('================');
    console.log(`✅ Real users created: ${stats.usersCreated}`);
    console.log(`✅ Real users found: ${stats.usersFound}`);
    console.log(`✅ People reassigned: ${stats.peopleReassigned}`);
    console.log(`✅ Companies reassigned: ${stats.companiesReassigned}`);
    console.log(`✅ Workspace memberships removed: ${stats.workspaceMembershipsRemoved}`);
    console.log('');

    // Verify final state
    console.log('🔍 Verifying final state...');
    console.log('');

    for (const mapping of USER_MAPPINGS) {
      const realUser = await prisma.users.findFirst({
        where: { email: mapping.realEmail }
      });

      if (realUser) {
        const peopleCount = await prisma.people.count({
          where: {
            workspaceId: TOP_WORKSPACE_ID,
            deletedAt: null,
            mainSellerId: realUser.id
          }
        });

        const companiesCount = await prisma.companies.count({
          where: {
            workspaceId: TOP_WORKSPACE_ID,
            deletedAt: null,
            mainSellerId: realUser.id
          }
        });

        console.log(`   ${mapping.name} (${mapping.realEmail}):`);
        console.log(`      People: ${peopleCount}`);
        console.log(`      Companies: ${companiesCount}`);
      }
    }

    console.log('');
    console.log('🎉 REPLACEMENT COMPLETED SUCCESSFULLY');
    console.log('=====================================');
    console.log('');
    console.log('💡 Note: Temp users still exist in the database but are no longer');
    console.log('   assigned to any records or workspace memberships.');

  } catch (error) {
    console.error('❌ Error during replacement:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Run the replacement
if (require.main === module) {
  replaceTempUsersWithRealUsers().catch(console.error);
}

module.exports = { replaceTempUsersWithRealUsers };

