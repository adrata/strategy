#!/usr/bin/env node

/**
 * ADD CLIENT STATUS TO RYAN'S ENTITIES
 * 
 * Adds 'CLIENT' to additionalStatuses array for all companies and people 
 * in the "notary everyday" workspace where ryan is the main seller.
 * This allows entities to be both CLIENT and PROSPECT/OPPORTUNITY simultaneously.
 */

const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function addClientStatusToRyanEntities() {
  try {
    console.log('🚀 Starting addition of CLIENT status to Ryan\'s companies and people...\n');
    
    await prisma.$connect();
    console.log('✅ Connected to database!\n');

    // 1. Find Notary Everyday workspace
    console.log('📋 FINDING NOTARY EVERYDAY WORKSPACE:');
    const workspace = await prisma.workspaces.findFirst({
      where: {
        name: {
          contains: 'notary everyday',
          mode: 'insensitive'
        }
      }
    });
    
    if (!workspace) {
      throw new Error('Notary Everyday workspace not found!');
    }
    
    console.log(`✅ Found workspace: ${workspace.name} (${workspace.id})\n`);

    // 2. Find Ryan user by username "ryan"
    console.log('👤 FINDING RYAN USER BY USERNAME:');
    const ryanUser = await prisma.users.findFirst({
      where: {
        username: 'ryan'
      },
      include: {
        workspace_users: {
          where: {
            workspaceId: workspace.id,
            isActive: true
          }
        }
      }
    });
    
    if (!ryanUser) {
      // Fallback: try by name or email
      console.log('⚠️  Ryan not found by username, trying by name/email...');
      const ryanUserFallback = await prisma.users.findFirst({
        where: {
          OR: [
            { name: { contains: 'ryan', mode: 'insensitive' } },
            { email: { contains: 'ryan', mode: 'insensitive' } }
          ]
        },
        include: {
          workspace_users: {
            where: {
              workspaceId: workspace.id,
              isActive: true
            }
          }
        }
      });
      
      if (!ryanUserFallback) {
        throw new Error('Ryan user not found!');
      }
      
      if (!ryanUserFallback.workspace_users || ryanUserFallback.workspace_users.length === 0) {
        throw new Error(`Ryan user found but not a member of ${workspace.name} workspace!`);
      }
      
      var ryan = ryanUserFallback;
    } else {
      if (!ryanUser.workspace_users || ryanUser.workspace_users.length === 0) {
        throw new Error(`Ryan user found but not a member of ${workspace.name} workspace!`);
      }
      
      var ryan = ryanUser;
    }
    
    console.log(`✅ Found Ryan: ${ryan.name || ryan.email} (username: ${ryan.username || 'N/A'}, id: ${ryan.id})\n`);

    // 3. Get all Ryan's companies
    console.log('📊 FETCHING RYAN\'S COMPANIES:');
    const ryanCompanies = await prisma.companies.findMany({
      where: {
        workspaceId: workspace.id,
        mainSellerId: ryan.id,
        deletedAt: null
      },
      select: {
        id: true,
        name: true,
        status: true,
        additionalStatuses: true
      }
    });
    
    console.log(`   Found ${ryanCompanies.length} companies\n`);

    // 4. Update companies to add CLIENT to additionalStatuses
    console.log('🔄 UPDATING COMPANIES TO ADD CLIENT STATUS:');
    let companiesUpdated = 0;
    let companiesAlreadyHad = 0;
    
    for (const company of ryanCompanies) {
      const currentStatuses = company.additionalStatuses || [];
      
      if (currentStatuses.includes('CLIENT')) {
        companiesAlreadyHad++;
        continue;
      }
      
      const newStatuses = [...currentStatuses, 'CLIENT'];
      
      await prisma.companies.update({
        where: { id: company.id },
        data: {
          additionalStatuses: newStatuses
        }
      });
      
      companiesUpdated++;
    }
    
    console.log(`✅ Updated ${companiesUpdated} companies (${companiesAlreadyHad} already had CLIENT status)\n`);

    // 5. Get all Ryan's people
    console.log('📊 FETCHING RYAN\'S PEOPLE:');
    const ryanPeople = await prisma.people.findMany({
      where: {
        workspaceId: workspace.id,
        mainSellerId: ryan.id,
        deletedAt: null
      },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        status: true,
        additionalStatuses: true
      }
    });
    
    console.log(`   Found ${ryanPeople.length} people\n`);

    // 6. Update people to add CLIENT to additionalStatuses
    console.log('🔄 UPDATING PEOPLE TO ADD CLIENT STATUS:');
    let peopleUpdated = 0;
    let peopleAlreadyHad = 0;
    
    for (const person of ryanPeople) {
      const currentStatuses = person.additionalStatuses || [];
      
      if (currentStatuses.includes('CLIENT')) {
        peopleAlreadyHad++;
        continue;
      }
      
      const newStatuses = [...currentStatuses, 'CLIENT'];
      
      await prisma.people.update({
        where: { id: person.id },
        data: {
          additionalStatuses: newStatuses
        }
      });
      
      peopleUpdated++;
    }
    
    console.log(`✅ Updated ${peopleUpdated} people (${peopleAlreadyHad} already had CLIENT status)\n`);

    // 7. Verification - show sample of updated entities
    console.log('🔍 VERIFICATION - SAMPLE UPDATED COMPANIES:');
    const sampleCompanies = await prisma.companies.findMany({
      where: {
        workspaceId: workspace.id,
        mainSellerId: ryan.id,
        deletedAt: null,
        additionalStatuses: {
          has: 'CLIENT'
        }
      },
      take: 10,
      select: {
        id: true,
        name: true,
        status: true,
        additionalStatuses: true
      },
      orderBy: {
        updatedAt: 'desc'
      }
    });
    
    sampleCompanies.forEach((company, index) => {
      console.log(`   ${index + 1}. ${company.name}`);
      console.log(`      Primary Status: ${company.status || 'NULL'}`);
      console.log(`      Additional Statuses: ${company.additionalStatuses?.join(', ') || '[]'}`);
    });
    
    if (sampleCompanies.length < ryanCompanies.length) {
      console.log(`   ... and ${ryanCompanies.length - sampleCompanies.length} more companies\n`);
    } else {
      console.log('');
    }
    
    console.log('🔍 VERIFICATION - SAMPLE UPDATED PEOPLE:');
    const samplePeople = await prisma.people.findMany({
      where: {
        workspaceId: workspace.id,
        mainSellerId: ryan.id,
        deletedAt: null,
        additionalStatuses: {
          has: 'CLIENT'
        }
      },
      take: 10,
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        status: true,
        additionalStatuses: true
      },
      orderBy: {
        updatedAt: 'desc'
      }
    });
    
    samplePeople.forEach((person, index) => {
      const name = `${person.firstName || ''} ${person.lastName || ''}`.trim() || 'No name';
      console.log(`   ${index + 1}. ${name} (${person.email || 'No email'})`);
      console.log(`      Primary Status: ${person.status || 'NULL'}`);
      console.log(`      Additional Statuses: ${person.additionalStatuses?.join(', ') || '[]'}`);
    });
    
    if (samplePeople.length < ryanPeople.length) {
      console.log(`   ... and ${ryanPeople.length - samplePeople.length} more people\n`);
    } else {
      console.log('');
    }

    // 8. Summary
    console.log('🎉 SUCCESS SUMMARY:');
    console.log(`   ✅ Workspace: ${workspace.name}`);
    console.log(`   ✅ User: ${ryan.name || ryan.email} (${ryan.username || 'no username'})`);
    console.log(`   ✅ Companies updated: ${companiesUpdated} (${companiesAlreadyHad} already had CLIENT)`);
    console.log(`   ✅ People updated: ${peopleUpdated} (${peopleAlreadyHad} already had CLIENT)`);
    console.log(`   ✅ Total companies with CLIENT: ${companiesUpdated + companiesAlreadyHad}`);
    console.log(`   ✅ Total people with CLIENT: ${peopleUpdated + peopleAlreadyHad}`);
    console.log('');
    console.log('✨ All companies and people now have CLIENT in additionalStatuses!');
    console.log('✨ Entities can now be both PROSPECT/OPPORTUNITY (primary status) AND CLIENT (additional status) simultaneously!');

  } catch (error) {
    console.error('❌ Error during update:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Run the update
if (require.main === module) {
  addClientStatusToRyanEntities()
    .then(() => {
      console.log('🏁 Update script completed successfully');
      process.exit(0);
    })
    .catch((error) => {
      console.error('💥 Update script failed:', error);
      process.exit(1);
    });
}

module.exports = { addClientStatusToRyanEntities };

