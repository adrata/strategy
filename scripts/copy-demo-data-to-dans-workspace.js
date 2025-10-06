const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function copyDemoDataToDansWorkspace() {
  try {
    console.log('🔄 Copying demo data to Dan\'s workspace...');
    
    const DEMO_WORKSPACE_ID = '01K1VBYX2YERMXBFJ60RC6J194';
    const DANS_WORKSPACE_ID = '01K1VBYXHD0J895XAN0HGFBKJP';
    const DANS_USER_ID = '01K1VBYZMWTCT09FWEKBDMCXZM';
    
    // Copy speedrun leads (leads with speedrun tag)
    console.log('📊 Copying speedrun leads...');
    const speedrunLeads = await prisma.leads.findMany({
      where: {
        workspaceId: DEMO_WORKSPACE_ID,
        deletedAt: null,
        tags: { has: 'speedrun' }
      }
    });
    
    console.log(`📊 Found ${speedrunLeads.length} speedrun leads to copy`);
    
    for (const lead of speedrunLeads) {
      await prisma.leads.create({
        data: {
          ...lead,
          id: lead.id, // Keep the same ID
          workspaceId: DANS_WORKSPACE_ID,
          assignedUserId: DANS_USER_ID, // Assign to Dan
          createdAt: new Date(),
          updatedAt: new Date()
        }
      });
    }
    
    console.log(`✅ Copied ${speedrunLeads.length} speedrun leads to Dan's workspace`);
    
    // Copy sellers
    console.log('📊 Copying sellers...');
    const sellers = await prisma.sellers.findMany({
      where: {
        workspaceId: DEMO_WORKSPACE_ID,
        deletedAt: null
      }
    });
    
    console.log(`📊 Found ${sellers.length} sellers to copy`);
    
    for (const seller of sellers) {
      await prisma.sellers.create({
        data: {
          ...seller,
          id: seller.id, // Keep the same ID
          workspaceId: DANS_WORKSPACE_ID,
          createdAt: new Date(),
          updatedAt: new Date()
        }
      });
    }
    
    console.log(`✅ Copied ${sellers.length} sellers to Dan's workspace`);
    
    // Copy additional companies if needed
    console.log('📊 Copying additional companies...');
    const demoCompanies = await prisma.companies.findMany({
      where: {
        workspaceId: DEMO_WORKSPACE_ID,
        deletedAt: null
      },
      take: 100 // Copy first 100 companies
    });
    
    console.log(`📊 Found ${demoCompanies.length} companies to copy`);
    
    for (const company of demoCompanies) {
      try {
        await prisma.companies.create({
          data: {
            ...company,
            id: company.id, // Keep the same ID
            workspaceId: DANS_WORKSPACE_ID,
            assignedUserId: DANS_USER_ID, // Assign to Dan
            createdAt: new Date(),
            updatedAt: new Date()
          }
        });
      } catch (error) {
        // Skip if company already exists
        if (!error.message.includes('Unique constraint')) {
          console.warn(`⚠️ Skipped company ${company.id}: ${error.message}`);
        }
      }
    }
    
    console.log(`✅ Copied companies to Dan's workspace`);
    
    // Copy additional people if needed
    console.log('📊 Copying additional people...');
    const demoPeople = await prisma.people.findMany({
      where: {
        workspaceId: DEMO_WORKSPACE_ID,
        deletedAt: null
      },
      take: 100 // Copy first 100 people
    });
    
    console.log(`📊 Found ${demoPeople.length} people to copy`);
    
    for (const person of demoPeople) {
      try {
        await prisma.people.create({
          data: {
            ...person,
            id: person.id, // Keep the same ID
            workspaceId: DANS_WORKSPACE_ID,
            assignedUserId: DANS_USER_ID, // Assign to Dan
            createdAt: new Date(),
            updatedAt: new Date()
          }
        });
      } catch (error) {
        // Skip if person already exists
        if (!error.message.includes('Unique constraint')) {
          console.warn(`⚠️ Skipped person ${person.id}: ${error.message}`);
        }
      }
    }
    
    console.log(`✅ Copied people to Dan's workspace`);
    
    // Check final counts
    const finalCounts = await Promise.all([
      prisma.leads.count({
        where: {
          workspaceId: DANS_WORKSPACE_ID,
          deletedAt: null,
          tags: { has: 'speedrun' }
        }
      }),
      prisma.sellers.count({
        where: {
          workspaceId: DANS_WORKSPACE_ID,
          deletedAt: null
        }
      }),
      prisma.companies.count({
        where: {
          workspaceId: DANS_WORKSPACE_ID,
          deletedAt: null
        }
      }),
      prisma.people.count({
        where: {
          workspaceId: DANS_WORKSPACE_ID,
          deletedAt: null
        }
      })
    ]);
    
    console.log('✅ Final counts in Dan\'s workspace:');
    console.log(`  - Speedrun leads: ${finalCounts[0]}`);
    console.log(`  - Sellers: ${finalCounts[1]}`);
    console.log(`  - Companies: ${finalCounts[2]}`);
    console.log(`  - People: ${finalCounts[3]}`);
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

if (require.main === module) {
  copyDemoDataToDansWorkspace();
}
