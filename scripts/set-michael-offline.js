const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function setMichaelOffline() {
  try {
    console.log('🔄 Setting Michael Thompson to offline status...');
    
    // Get the demo workspace ID
    const DEMO_WORKSPACE_ID = '01K1VBYX2YERMXBFJ60RC6J194';
    
    // Find Michael Thompson
    const michael = await prisma.sellers.findFirst({
      where: {
        workspaceId: DEMO_WORKSPACE_ID,
        name: { contains: 'Michael Thompson' },
        deletedAt: null
      }
    });
    
    if (!michael) {
      console.log('❌ Michael Thompson not found');
      return;
    }
    
    console.log(`👤 Found Michael Thompson: ${michael.name} (ID: ${michael.id})`);
    
    // Set him to offline with a last seen time of 2 hours ago
    const twoHoursAgo = new Date(Date.now() - 2 * 60 * 60 * 1000);
    
    await prisma.sellers.update({
      where: {
        id: michael.id
      },
      data: {
        metadata: {
          isOnline: false,
          status: 'offline',
          lastSeen: twoHoursAgo.toISOString(),
          lastActivity: twoHoursAgo.toISOString()
        },
        updatedAt: new Date()
      }
    });
    
    console.log('✅ Michael Thompson set to offline (last seen 2 hours ago)');
    
    // Verify the update
    const updatedMichael = await prisma.sellers.findUnique({
      where: {
        id: michael.id
      },
      select: {
        name: true,
        metadata: true
      }
    });
    
    const metadata = updatedMichael?.metadata || {};
    console.log(`📊 Status verification: ${updatedMichael?.name}: ${metadata.isOnline ? 'Online' : 'Offline'} (Last seen: ${metadata.lastSeen})`);
    
  } catch (error) {
    console.error('❌ Error setting Michael to offline:', error);
  } finally {
    await prisma.$disconnect();
  }
}

if (require.main === module) {
  setMichaelOffline()
    .catch((e) => {
      console.error(e);
      process.exit(1);
    });
}

module.exports = { setMichaelOffline };
