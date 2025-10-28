const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function testAuth() {
  try {
    console.log('🔍 Testing authentication...');
    
    // Check if Ryan exists and is in the Notary Everyday workspace
    const ryan = await prisma.users.findFirst({
      where: { email: 'ryan@notaryeveryday.com' }
    });
    
    console.log('👤 Ryan user:', ryan);
    
    if (ryan) {
      // Check if Ryan is in the Notary Everyday workspace
      const workspaceUser = await prisma.workspace_users.findFirst({
        where: {
          userId: ryan.id,
          workspaceId: '01K7DNYR5VZ7JY36KGKKN76XZ1'
        },
        include: {
          workspace: true
        }
      });
      
      console.log('🏢 Ryan workspace membership:', workspaceUser);
      
      // Check stories assigned to Ryan
      const ryanStories = await prisma.stacksStory.findMany({
        where: {
          assigneeId: ryan.id,
          project: {
            workspaceId: '01K7DNYR5VZ7JY36KGKKN76XZ1'
          }
        },
        include: {
          project: true,
          epic: true
        }
      });
      
      console.log('📝 Ryan stories:', ryanStories.length);
      console.log('📝 First few stories:', ryanStories.slice(0, 3));
    }
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

testAuth();
