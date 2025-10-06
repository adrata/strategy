const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function assignCompaniesToSellers() {
  try {
    console.log('🔄 Assigning companies to sellers...');
    
    // Get all sellers
    const sellers = await prisma.sellers.findMany({
      where: { deletedAt: null },
      select: { id: true, name: true, assignedUserId: true }
    });
    
    console.log(`📊 Found ${sellers.length} sellers`);
    
    // Get some companies to assign
    const companies = await prisma.companies.findMany({
      where: { 
        deletedAt: null,
        assignedUserId: null // Only get unassigned companies
      },
      select: { id: true, name: true },
      take: 100 // Take first 100 unassigned companies
    });
    
    console.log(`📊 Found ${companies.length} unassigned companies`);
    
    if (companies.length === 0) {
      console.log('⚠️ No unassigned companies found, will reassign existing ones');
      
      // Get some companies that are already assigned
      const assignedCompanies = await prisma.companies.findMany({
        where: { 
          deletedAt: null,
          assignedUserId: { not: null }
        },
        select: { id: true, name: true, assignedUserId: true },
        take: 100
      });
      
      console.log(`📊 Found ${assignedCompanies.length} assigned companies to reassign`);
      
      // Reassign companies to sellers
      const companiesPerSeller = Math.floor(assignedCompanies.length / sellers.length);
      
      for (let i = 0; i < sellers.length; i++) {
        const seller = sellers[i];
        const startIndex = i * companiesPerSeller;
        const endIndex = Math.min(startIndex + companiesPerSeller, assignedCompanies.length);
        
        console.log(`🔄 Assigning companies ${startIndex}-${endIndex} to ${seller.name}`);
        
        for (let j = startIndex; j < endIndex; j++) {
          const company = assignedCompanies[j];
          
          await prisma.companies.update({
            where: { id: company.id },
            data: {
              assignedUserId: seller.assignedUserId, // Use the seller's assignedUserId
              updatedAt: new Date()
            }
          });
          
          console.log(`✅ Assigned ${company.name} to ${seller.name}`);
        }
      }
    } else {
      // Assign unassigned companies to sellers
      const companiesPerSeller = Math.floor(companies.length / sellers.length);
      
      for (let i = 0; i < sellers.length; i++) {
        const seller = sellers[i];
        const startIndex = i * companiesPerSeller;
        const endIndex = Math.min(startIndex + companiesPerSeller, companies.length);
        
        console.log(`🔄 Assigning companies ${startIndex}-${endIndex} to ${seller.name}`);
        
        for (let j = startIndex; j < endIndex; j++) {
          const company = companies[j];
          
          await prisma.companies.update({
            where: { id: company.id },
            data: {
              assignedUserId: seller.assignedUserId, // Use the seller's assignedUserId
              updatedAt: new Date()
            }
          });
          
          console.log(`✅ Assigned ${company.name} to ${seller.name}`);
        }
      }
    }
    
    // Verify the assignments
    console.log('\n📊 Verifying company assignments...');
    
    for (const seller of sellers) {
      const assignedCompanies = await prisma.companies.findMany({
        where: {
          deletedAt: null,
          assignedUserId: seller.assignedUserId
        },
        select: { id: true, name: true }
      });
      
      console.log(`👤 ${seller.name}: ${assignedCompanies.length} companies assigned`);
      if (assignedCompanies.length > 0) {
        console.log(`   Sample companies: ${assignedCompanies.slice(0, 3).map(c => c.name).join(', ')}`);
      }
    }
    
    console.log('\n✅ Successfully assigned companies to sellers');
    
  } catch (error) {
    console.error('❌ Error assigning companies to sellers:', error);
  } finally {
    await prisma.$disconnect();
  }
}

if (require.main === module) {
  assignCompaniesToSellers()
    .catch(console.error);
}

module.exports = { assignCompaniesToSellers };