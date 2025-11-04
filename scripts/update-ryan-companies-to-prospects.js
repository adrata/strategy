#!/usr/bin/env node

/**
 * UPDATE RYAN'S COMPANIES AND PEOPLE TO PROSPECTS FOR EXPANSION DEALS
 * 
 * Updates all companies and people in the "notary everyday" workspace where ryan is the main seller
 * to have PROSPECT status instead of LEAD, enabling them to be managed as expansion deals in revenueos.
 */

const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function updateRyanCompaniesToProspects() {
  try {
    console.log('🚀 Starting update of Ryan\'s companies and people to PROSPECT status...\n');
    
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

    // 2. Find Ryan user in the workspace
    console.log('👤 FINDING RYAN USER:');
    const ryanUser = await prisma.users.findFirst({
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
    
    if (!ryanUser) {
      throw new Error('Ryan user not found!');
    }
    
    if (!ryanUser.workspace_users || ryanUser.workspace_users.length === 0) {
      throw new Error(`Ryan user found but not a member of ${workspace.name} workspace!`);
    }
    
    const ryan = ryanUser;
    console.log(`✅ Found Ryan: ${ryan.name || ryan.email} (${ryan.id})\n`);

    // 3. Get current status counts before update
    console.log('📊 CURRENT COMPANY STATUS COUNTS:');
    const companyStatusCounts = await prisma.companies.groupBy({
      by: ['status'],
      where: {
        workspaceId: workspace.id,
        mainSellerId: ryan.id,
        deletedAt: null
      },
      _count: {
        id: true
      }
    });
    
    const companyStatusCountsMap = companyStatusCounts.reduce((acc, stat) => {
      const status = stat.status || 'NULL';
      acc[status] = stat._count.id;
      return acc;
    }, {});
    
    Object.entries(companyStatusCountsMap).forEach(([status, count]) => {
      console.log(`   ${status}: ${count}`);
    });
    
    const totalCompanies = await prisma.companies.count({
      where: {
        workspaceId: workspace.id,
        mainSellerId: ryan.id,
        deletedAt: null
      }
    });
    
    console.log(`   TOTAL COMPANIES: ${totalCompanies}\n`);
    
    console.log('📊 CURRENT PEOPLE STATUS COUNTS:');
    const peopleStatusCounts = await prisma.people.groupBy({
      by: ['status'],
      where: {
        workspaceId: workspace.id,
        mainSellerId: ryan.id,
        deletedAt: null
      },
      _count: {
        id: true
      }
    });
    
    const peopleStatusCountsMap = peopleStatusCounts.reduce((acc, stat) => {
      const status = stat.status || 'NULL';
      acc[status] = stat._count.id;
      return acc;
    }, {});
    
    Object.entries(peopleStatusCountsMap).forEach(([status, count]) => {
      console.log(`   ${status}: ${count}`);
    });
    
    const totalPeople = await prisma.people.count({
      where: {
        workspaceId: workspace.id,
        mainSellerId: ryan.id,
        deletedAt: null
      }
    });
    
    console.log(`   TOTAL PEOPLE: ${totalPeople}\n`);

    // 4. Update companies to PROSPECT status
    console.log('🔄 UPDATING COMPANIES TO PROSPECT STATUS:');
    const companyUpdateResult = await prisma.companies.updateMany({
      where: {
        workspaceId: workspace.id,
        mainSellerId: ryan.id,
        deletedAt: null
      },
      data: {
        status: 'PROSPECT'
      }
    });
    
    console.log(`✅ Updated ${companyUpdateResult.count} companies to PROSPECT status\n`);
    
    // 4b. Update people to PROSPECT status
    console.log('🔄 UPDATING PEOPLE TO PROSPECT STATUS:');
    const peopleUpdateResult = await prisma.people.updateMany({
      where: {
        workspaceId: workspace.id,
        mainSellerId: ryan.id,
        deletedAt: null
      },
      data: {
        status: 'PROSPECT'
      }
    });
    
    console.log(`✅ Updated ${peopleUpdateResult.count} people to PROSPECT status\n`);

    // 5. Verify update - get new status counts
    console.log('🔍 VERIFICATION - NEW COMPANY STATUS COUNTS:');
    const newCompanyStatusCounts = await prisma.companies.groupBy({
      by: ['status'],
      where: {
        workspaceId: workspace.id,
        mainSellerId: ryan.id,
        deletedAt: null
      },
      _count: {
        id: true
      }
    });
    
    const newCompanyStatusCountsMap = newCompanyStatusCounts.reduce((acc, stat) => {
      const status = stat.status || 'NULL';
      acc[status] = stat._count.id;
      return acc;
    }, {});
    
    Object.entries(newCompanyStatusCountsMap).forEach(([status, count]) => {
      console.log(`   ${status}: ${count}`);
    });
    
    const newTotalCompanies = await prisma.companies.count({
      where: {
        workspaceId: workspace.id,
        mainSellerId: ryan.id,
        deletedAt: null
      }
    });
    
    console.log(`   TOTAL COMPANIES: ${newTotalCompanies}\n`);
    
    console.log('🔍 VERIFICATION - NEW PEOPLE STATUS COUNTS:');
    const newPeopleStatusCounts = await prisma.people.groupBy({
      by: ['status'],
      where: {
        workspaceId: workspace.id,
        mainSellerId: ryan.id,
        deletedAt: null
      },
      _count: {
        id: true
      }
    });
    
    const newPeopleStatusCountsMap = newPeopleStatusCounts.reduce((acc, stat) => {
      const status = stat.status || 'NULL';
      acc[status] = stat._count.id;
      return acc;
    }, {});
    
    Object.entries(newPeopleStatusCountsMap).forEach(([status, count]) => {
      console.log(`   ${status}: ${count}`);
    });
    
    const newTotalPeople = await prisma.people.count({
      where: {
        workspaceId: workspace.id,
        mainSellerId: ryan.id,
        deletedAt: null
      }
    });
    
    console.log(`   TOTAL PEOPLE: ${newTotalPeople}\n`);

    // 6. Show sample of updated companies
    console.log('📋 SAMPLE OF UPDATED COMPANIES:');
    const sampleCompanies = await prisma.companies.findMany({
      where: {
        workspaceId: workspace.id,
        mainSellerId: ryan.id,
        deletedAt: null,
        status: 'PROSPECT'
      },
      take: 10,
      select: {
        id: true,
        name: true,
        status: true,
        updatedAt: true
      },
      orderBy: {
        updatedAt: 'desc'
      }
    });
    
    sampleCompanies.forEach((company, index) => {
      console.log(`   ${index + 1}. ${company.name} (${company.id}) - Status: ${company.status}`);
    });
    
    if (sampleCompanies.length < totalCompanies) {
      console.log(`   ... and ${totalCompanies - sampleCompanies.length} more companies\n`);
    } else {
      console.log('');
    }
    
    // 6b. Show sample of updated people
    console.log('📋 SAMPLE OF UPDATED PEOPLE:');
    const samplePeople = await prisma.people.findMany({
      where: {
        workspaceId: workspace.id,
        mainSellerId: ryan.id,
        deletedAt: null,
        status: 'PROSPECT'
      },
      take: 10,
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        status: true,
        updatedAt: true
      },
      orderBy: {
        updatedAt: 'desc'
      }
    });
    
    samplePeople.forEach((person, index) => {
      const name = `${person.firstName || ''} ${person.lastName || ''}`.trim() || 'No name';
      console.log(`   ${index + 1}. ${name} (${person.email || 'No email'}) - Status: ${person.status}`);
    });
    
    if (samplePeople.length < totalPeople) {
      console.log(`   ... and ${totalPeople - samplePeople.length} more people\n`);
    } else {
      console.log('');
    }

    // 7. Summary
    console.log('🎉 SUCCESS SUMMARY:');
    console.log(`   ✅ Workspace: ${workspace.name}`);
    console.log(`   ✅ User: ${ryan.name || ryan.email}`);
    console.log(`   ✅ Companies updated: ${companyUpdateResult.count}`);
    console.log(`   ✅ People updated: ${peopleUpdateResult.count}`);
    console.log(`   ✅ New status: PROSPECT`);
    console.log('');
    console.log('✨ All companies and people are now set to PROSPECT status for expansion deal management!');

  } catch (error) {
    console.error('❌ Error during update:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Run the update
if (require.main === module) {
  updateRyanCompaniesToProspects()
    .then(() => {
      console.log('🏁 Update script completed successfully');
      process.exit(0);
    })
    .catch((error) => {
      console.error('💥 Update script failed:', error);
      process.exit(1);
    });
}

module.exports = { updateRyanCompaniesToProspects };

