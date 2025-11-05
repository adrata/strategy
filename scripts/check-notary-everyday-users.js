const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

(async () => {
  try {
    // Find the "Notary Everyday" workspace
    const workspace = await prisma.workspaces.findFirst({
      where: {
        OR: [
          { name: { contains: 'Notary Everyday', mode: 'insensitive' } },
          { slug: 'ne' }
        ]
      }
    });

    if (!workspace) {
      console.log('❌ Workspace "Notary Everyday" not found');
      process.exit(0);
    }

    console.log('✅ Found workspace:', workspace.name);
    console.log('   ID:', workspace.id);
    console.log('   Slug:', workspace.slug);
    console.log('');

    // Get all users in this workspace
    const workspaceUsers = await prisma.workspace_users.findMany({
      where: {
        workspaceId: workspace.id
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            firstName: true,
            lastName: true
          }
        }
      },
      orderBy: {
        createdAt: 'asc'
      }
    });

    console.log(`📊 Total users in workspace: ${workspaceUsers.length}`);
    console.log('');

    if (workspaceUsers.length === 0) {
      console.log('⚠️  No users found in this workspace');
    } else {
      console.log('👥 Users in workspace:');
      console.log('─'.repeat(60));
      
      workspaceUsers.forEach((wu, index) => {
        const u = wu.user;
        const displayName = 
          (u.firstName && u.lastName 
            ? `${u.firstName} ${u.lastName}`.trim()
            : u.firstName || u.lastName || u.name || u.email || 'Unknown User');
        
        console.log(`${index + 1}. ${displayName}`);
        console.log(`   Email: ${u.email || 'N/A'}`);
        console.log(`   User ID: ${u.id}`);
        console.log(`   Role: ${wu.role || 'member'}`);
        console.log('');
      });
    }

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
})();

