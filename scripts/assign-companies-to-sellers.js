const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function assignCompaniesToSellers() {
  try {
    console.log('🔄 Starting company assignment to sellers...');
    
    // Get the demo workspace ID
    const DEMO_WORKSPACE_ID = '01K1VBYX2YERMXBFJ60RC6J194';
    
    // Get all sellers in the demo workspace
    const sellers = await prisma.sellers.findMany({
      where: {
        workspaceId: DEMO_WORKSPACE_ID,
        deletedAt: null
      }
    });
    
    console.log(`📊 Found ${sellers.length} sellers`);
    
    // Get all companies in the demo workspace
    const companies = await prisma.companies.findMany({
      where: {
        workspaceId: DEMO_WORKSPACE_ID,
        deletedAt: null
      }
    });
    
    console.log(`🏢 Found ${companies.length} companies`);
    
    if (sellers.length === 0 || companies.length === 0) {
      console.log('❌ No sellers or companies found. Please ensure demo data exists.');
      return;
    }
    
    // Assign companies to sellers (distribute evenly)
    const companiesPerSeller = Math.ceil(companies.length / sellers.length);
    console.log(`📈 Assigning ~${companiesPerSeller} companies per seller`);
    
    let companyIndex = 0;
    
    for (let i = 0; i < sellers.length; i++) {
      const seller = sellers[i];
      const sellerCompanies = [];
      
      // Assign companies to this seller
      for (let j = 0; j < companiesPerSeller && companyIndex < companies.length; j++) {
        const company = companies[companyIndex];
        sellerCompanies.push(company);
        companyIndex++;
      }
      
      // Update companies with seller assignment
      if (sellerCompanies.length > 0) {
        const companyIds = sellerCompanies.map(c => c.id);
        
        await prisma.companies.updateMany({
          where: {
            id: { in: companyIds }
          },
          data: {
            assignedUserId: seller.id, // Assign to seller ID, not user ID
            updatedAt: new Date()
          }
        });
        
        console.log(`✅ Assigned ${sellerCompanies.length} companies to ${seller.name}`);
      }
    }
    
    // Verify assignments
    const assignedCompanies = await prisma.companies.count({
      where: {
        workspaceId: DEMO_WORKSPACE_ID,
        assignedUserId: { not: null },
        deletedAt: null
      }
    });
    
    console.log(`✅ Successfully assigned ${assignedCompanies} companies to sellers`);
    
    // Show distribution
    for (const seller of sellers) {
      const sellerCompanyCount = await prisma.companies.count({
        where: {
          workspaceId: DEMO_WORKSPACE_ID,
          assignedUserId: seller.id,
          deletedAt: null
        }
      });
      console.log(`👤 ${seller.name}: ${sellerCompanyCount} companies`);
    }
    
  } catch (error) {
    console.error('❌ Error assigning companies to sellers:', error);
  } finally {
    await prisma.$disconnect();
  }
}

if (require.main === module) {
  assignCompaniesToSellers()
    .catch((e) => {
      console.error(e);
      process.exit(1);
    });
}

module.exports = { assignCompaniesToSellers };
