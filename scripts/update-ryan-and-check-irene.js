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
      process.exit(1);
    }

    console.log('✅ Found workspace:', workspace.name);
    console.log('   ID:', workspace.id);
    console.log('');

    // Step 1: Update ryan's name
    console.log('📝 Step 1: Updating ryan\'s name to "Ryan Serrato"...');
    const ryanUser = await prisma.users.findUnique({
      where: { email: 'ryan@notaryeveryday.com' }
    });

    if (!ryanUser) {
      console.log('❌ User ryan@notaryeveryday.com not found');
    } else {
      console.log('   Current name:', ryanUser.name);
      console.log('   Current firstName:', ryanUser.firstName);
      console.log('   Current lastName:', ryanUser.lastName);
      
      const updated = await prisma.users.update({
        where: { id: ryanUser.id },
        data: {
          firstName: 'Ryan',
          lastName: 'Serrato',
          name: 'Ryan Serrato'
        }
      });
      
      console.log('✅ Updated user:');
      console.log('   Name:', updated.name);
      console.log('   FirstName:', updated.firstName);
      console.log('   LastName:', updated.lastName);
      console.log('');
    }

    // Step 2: Check if Irene Serrato exists
    console.log('🔍 Step 2: Checking for Irene Serrato...');
    const ireneEmail = 'irene@notaryeveryday.com';
    const ireneUser = await prisma.users.findUnique({
      where: { email: ireneEmail }
    });

    if (ireneUser) {
      console.log('✅ Irene Serrato already exists:');
      console.log('   Name:', ireneUser.name || `${ireneUser.firstName || ''} ${ireneUser.lastName || ''}`.trim());
      console.log('   Email:', ireneUser.email);
      console.log('   User ID:', ireneUser.id);
      
      // Check if she's in the workspace
      const workspaceUser = await prisma.workspace_users.findFirst({
        where: {
          workspaceId: workspace.id,
          userId: ireneUser.id
        }
      });

      if (workspaceUser) {
        console.log('   ✅ Already in workspace with role:', workspaceUser.role);
      } else {
        console.log('   ⚠️  Not in workspace, adding now...');
        await prisma.workspace_users.create({
          data: {
            workspaceId: workspace.id,
            userId: ireneUser.id,
            role: 'SELLER',
            updatedAt: new Date()
          }
        });
        console.log('   ✅ Added to workspace as SELLER');
      }
    } else {
      console.log('❌ Irene Serrato not found, creating...');
      
      // Create the user
      const newIrene = await prisma.users.create({
        data: {
          email: ireneEmail,
          firstName: 'Irene',
          lastName: 'Serrato',
          name: 'Irene Serrato'
        }
      });
      
      console.log('✅ Created user:');
      console.log('   Name:', newIrene.name);
      console.log('   Email:', newIrene.email);
      console.log('   User ID:', newIrene.id);
      
      // Add to workspace
      await prisma.workspace_users.create({
        data: {
          workspaceId: workspace.id,
          userId: newIrene.id,
          role: 'SELLER',
          updatedAt: new Date()
        }
      });
      
      console.log('✅ Added to workspace as SELLER');
    }

    console.log('');
    console.log('📊 Final workspace users:');
    const allWorkspaceUsers = await prisma.workspace_users.findMany({
      where: { workspaceId: workspace.id },
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
      orderBy: { createdAt: 'asc' }
    });

    allWorkspaceUsers.forEach((wu, index) => {
      const u = wu.user;
      const displayName = 
        (u.firstName && u.lastName 
          ? `${u.firstName} ${u.lastName}`.trim()
          : u.firstName || u.lastName || u.name || u.email || 'Unknown User');
      console.log(`${index + 1}. ${displayName} (${u.email}) - ${wu.role}`);
    });

  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
})();

