const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function updateSellersToZeroPoint() {
  try {
    console.log('🔄 Updating all sellers to ZeroPoint company and Michael Thompson name...');
    
    // Get all sellers in the workspace
    const sellers = await prisma.sellers.findMany({
      where: {
        deletedAt: null
      },
      select: {
        id: true,
        name: true,
        workspaceId: true
      }
    });
    
    console.log(`📊 Found ${sellers.length} sellers to update`);
    
    // Update each seller
    for (const seller of sellers) {
      console.log(`🔄 Updating seller: ${seller.name} (${seller.id})`);
      
      await prisma.sellers.update({
        where: { id: seller.id },
        data: {
          name: 'Michael Thompson',
          firstName: 'Michael',
          lastName: 'Thompson',
          company: 'ZeroPoint',
          title: 'Account Executive',
          email: 'michael.thompson@zeropoint.com',
          phone: '+1 (555) 123-4567',
          department: 'Sales',
          metadata: {
            isOnline: true,
            status: 'active',
            lastSeen: new Date().toISOString(),
            lastActivity: new Date().toISOString(),
            region: 'West Coast',
            activeBuyerGroups: 25,
            maxBuyerGroups: 40,
            dmEngagement: 85,
            stakeholders: 120,
            pacing: 'On Track',
            percentToGoal: 92,
            city: 'San Francisco',
            state: 'CA',
            country: 'United States',
            seniority: 'Senior'
          },
          updatedAt: new Date()
        }
      });
      
      console.log(`✅ Updated seller: ${seller.id}`);
    }
    
    // Verify the updates
    const updatedSellers = await prisma.sellers.findMany({
      where: {
        deletedAt: null
      },
      select: {
        id: true,
        name: true,
        company: true,
        email: true,
        metadata: true
      }
    });
    
    console.log('\n📊 Updated sellers verification:');
    updatedSellers.forEach(seller => {
      const metadata = seller.metadata || {};
      console.log(`👤 ${seller.name} (${seller.company}) - ${seller.email}`);
      console.log(`   Status: ${metadata.status || 'Unknown'} | Online: ${metadata.isOnline ? 'Yes' : 'No'}`);
      console.log(`   Region: ${metadata.region || 'Unknown'} | Engagement: ${metadata.dmEngagement || 'N/A'}%`);
      console.log(`   Buyer Groups: ${metadata.activeBuyerGroups || 0}/${metadata.maxBuyerGroups || 0}`);
      console.log(`   Goal Progress: ${metadata.percentToGoal || 0}%`);
      console.log('');
    });
    
    console.log(`✅ Successfully updated ${updatedSellers.length} sellers to ZeroPoint company`);
    
  } catch (error) {
    console.error('❌ Error updating sellers:', error);
  } finally {
    await prisma.$disconnect();
  }
}

if (require.main === module) {
  updateSellersToZeroPoint()
    .catch(console.error);
}

module.exports = { updateSellersToZeroPoint };
