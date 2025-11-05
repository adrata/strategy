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

    // Find the users to remove
    const usersToRemove = [
      { email: 'todd@adrata.com', name: 'Todd Nestor' },
      { email: 'dan@adrata.com', name: 'Dan Mirolli' }
    ];

    console.log('🔍 Finding users to remove...');
    const users = await prisma.users.findMany({
      where: {
        email: { in: usersToRemove.map(u => u.email) }
      },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        name: true
      }
    });

    if (users.length === 0) {
      console.log('❌ No users found with those emails');
      process.exit(1);
    }

    console.log(`✅ Found ${users.length} users:`);
    users.forEach(u => {
      const displayName = (u.firstName && u.lastName) 
        ? `${u.firstName} ${u.lastName}` 
        : u.name || u.email;
      console.log(`   - ${displayName} (${u.email})`);
    });
    console.log('');

    // Find and delete workspace_users records
    const userIds = users.map(u => u.id);
    const workspaceUserRecords = await prisma.workspace_users.findMany({
      where: {
        workspaceId: workspace.id,
        userId: { in: userIds }
      },
      include: {
        user: {
          select: {
            email: true,
            firstName: true,
            lastName: true,
            name: true
          }
        }
      }
    });

    if (workspaceUserRecords.length === 0) {
      console.log('⚠️  No workspace_users records found to delete');
      process.exit(0);
    }

    console.log(`🗑️  Found ${workspaceUserRecords.length} workspace_users record(s) to delete:`);
    workspaceUserRecords.forEach(wu => {
      const displayName = (wu.user.firstName && wu.user.lastName) 
        ? `${wu.user.firstName} ${wu.user.lastName}` 
        : wu.user.name || wu.user.email;
      console.log(`   - ${displayName} (${wu.user.email}) - Role: ${wu.role}`);
    });
    console.log('');

    // Confirm deletion
    console.log('⚠️  About to delete the following workspace_users records:');
    const recordIds = workspaceUserRecords.map(wu => wu.id);
    console.log('   Record IDs:', recordIds.join(', '));
    console.log('');

    // Delete the records
    const deleteResult = await prisma.workspace_users.deleteMany({
      where: {
        id: { in: recordIds }
      }
    });

    console.log(`✅ Successfully removed ${deleteResult.count} user(s) from workspace`);
    console.log('');

    // Verify deletion
    const remainingUsers = await prisma.workspace_users.findMany({
      where: {
        workspaceId: workspace.id,
        userId: { in: userIds }
      }
    });

    if (remainingUsers.length === 0) {
      console.log('✅ Verification: All specified users have been removed from the workspace');
    } else {
      console.log('⚠️  Warning: Some users may still be in the workspace');
      console.log('   Remaining records:', remainingUsers.length);
    }

  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
})();

