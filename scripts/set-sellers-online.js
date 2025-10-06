const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function setSellersOnline() {
  try {
    console.log('🔄 Setting all sellers to online status...');
    
    // Get the demo workspace ID
    const DEMO_WORKSPACE_ID = '01K1VBYX2YERMXBFJ60RC6J194';
    
    // Update all sellers to show as online
    const result = await prisma.sellers.updateMany({
      where: {
        workspaceId: DEMO_WORKSPACE_ID,
        deletedAt: null
      },
      data: {
        // Add online status fields
        metadata: {
          isOnline: true,
          status: 'online',
          lastSeen: new Date().toISOString(),
          lastActivity: new Date().toISOString()
        },
        updatedAt: new Date()
      }
    });
    
    console.log(`✅ Updated ${result.count} sellers to online status`);
    
    // Verify the updates
    const onlineSellers = await prisma.sellers.findMany({
      where: {
        workspaceId: DEMO_WORKSPACE_ID,
        deletedAt: null
      },
      select: {
        id: true,
        name: true,
        metadata: true
      }
    });
    
    console.log('📊 Seller status verification:');
    onlineSellers.forEach(seller => {
      const metadata = seller.metadata || {};
      console.log(`👤 ${seller.name}: ${metadata.isOnline ? 'Online' : 'Offline'} (Last seen: ${metadata.lastSeen || 'Never'})`);
    });
    
  } catch (error) {
    console.error('❌ Error setting sellers to online:', error);
  } finally {
    await prisma.$disconnect();
  }
}

if (require.main === module) {
  setSellersOnline()
    .catch((e) => {
      console.error(e);
      process.exit(1);
    });
}

module.exports = { setSellersOnline };
