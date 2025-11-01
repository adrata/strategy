/**
 * Create Pinpoint Workspace and Leonardo User
 * Creates a workspace called "pinpoint" and user "leonardo" with email leonardo@pinpoint-adrata.com
 */

const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: process.env.DATABASE_URL
    }
  }
});

// Configuration
const WORKSPACE_CONFIG = {
  name: 'Pinpoint',
  slug: 'pinpoint',
  description: 'Pinpoint workspace'
};

const USER_CONFIG = {
  email: 'leonardo@pinpoint-adrata.com',
  name: 'Leonardo Sylvester',
  firstName: 'Leonardo',
  lastName: 'Sylvester',
  timezone: 'UTC'
};

async function createPinpointWorkspaceAndLeonardo() {
  try {
    console.log('🚀 Creating Pinpoint workspace and Leonardo user...\n');

    // Step 1: Check if workspace already exists
    console.log('🏢 Checking for existing workspace...');
    let workspace = await prisma.workspaces.findUnique({
      where: { slug: WORKSPACE_CONFIG.slug }
    });

    if (workspace) {
      console.log(`✅ Workspace already exists: ${workspace.name} (${workspace.slug})`);
      console.log(`   ID: ${workspace.id}\n`);
      
      // Update workspace name if it's lowercase
      if (workspace.name !== 'Pinpoint') {
        console.log('🔄 Updating workspace name to "Pinpoint"...');
        workspace = await prisma.workspaces.update({
          where: { id: workspace.id },
          data: {
            name: 'Pinpoint',
            updatedAt: new Date()
          }
        });
        console.log(`✅ Workspace name updated to: ${workspace.name}\n`);
      }
    } else {
      // Create workspace
      console.log('🏢 Creating workspace...');
      workspace = await prisma.workspaces.create({
        data: {
          name: WORKSPACE_CONFIG.name,
          slug: WORKSPACE_CONFIG.slug,
          description: WORKSPACE_CONFIG.description,
          timezone: 'UTC',
          isActive: true,
          createdAt: new Date(),
          updatedAt: new Date()
        }
      });
      console.log(`✅ Workspace created: ${workspace.name} (${workspace.slug})`);
      console.log(`   ID: ${workspace.id}\n`);
    }

    // Step 2: Check if user already exists
    console.log('👤 Checking for existing user...');
    let user = await prisma.users.findUnique({
      where: { email: USER_CONFIG.email }
    });

    if (user) {
      console.log(`✅ User already exists: ${user.name} (${user.email})`);
      console.log(`   ID: ${user.id}\n`);
    } else {
      // Generate a secure password
      console.log('🔐 Generating secure password...');
      const password = crypto.randomBytes(16).toString('base64').slice(0, 20); // 20 character password
      const hashedPassword = await bcrypt.hash(password, 12);

      // Create user
      console.log('👤 Creating user...');
      user = await prisma.users.create({
        data: {
          email: USER_CONFIG.email,
          password: hashedPassword,
          username: 'leonardo',
          name: USER_CONFIG.name,
          firstName: USER_CONFIG.firstName,
          lastName: USER_CONFIG.lastName,
          timezone: USER_CONFIG.timezone,
          isActive: true,
          activeWorkspaceId: workspace.id,
          createdAt: new Date(),
          updatedAt: new Date()
        }
      });
      console.log(`✅ User created: ${user.name} (${user.email})`);
      console.log(`   ID: ${user.id}`);
      console.log(`\n🔑 GENERATED PASSWORD: ${password}`);
      console.log('⚠️  Please share this password with Leonardo for login\n');
    }

    // Step 3: Check if workspace membership exists
    console.log('🔗 Checking workspace membership...');
    const existingMembership = await prisma.workspace_users.findFirst({
      where: {
        workspaceId: workspace.id,
        userId: user.id
      }
    });

    if (existingMembership) {
      console.log('✅ Workspace membership already exists');
      console.log(`   Role: ${existingMembership.role}\n`);
    } else {
      // Create workspace membership with ADMIN role
      console.log('🔗 Creating workspace membership...');
      const membership = await prisma.workspace_users.create({
        data: {
          workspaceId: workspace.id,
          userId: user.id,
          role: 'WORKSPACE_ADMIN',
          isActive: true,
          joinedAt: new Date(),
          createdAt: new Date(),
          updatedAt: new Date()
        }
      });
      console.log(`✅ Workspace membership created`);
      console.log(`   Role: ${membership.role}\n`);
    }

    // Step 4: Ensure user's name, username and set Pinpoint as active workspace
    const updates = {};
    let needsUpdate = false;

    if (user.firstName !== 'Leonardo' || user.lastName !== 'Sylvester' || user.name !== 'Leonardo Sylvester') {
      updates.firstName = 'Leonardo';
      updates.lastName = 'Sylvester';
      updates.name = 'Leonardo Sylvester';
      needsUpdate = true;
    }

    if (user.username !== 'leonardo') {
      updates.username = 'leonardo';
      needsUpdate = true;
    }

    // Set Pinpoint as the active workspace
    if (user.activeWorkspaceId !== workspace.id) {
      updates.activeWorkspaceId = workspace.id;
      needsUpdate = true;
    }

    if (needsUpdate) {
      console.log('🔄 Updating user...');
      updates.updatedAt = new Date();
      user = await prisma.users.update({
        where: { id: user.id },
        data: updates
      });
      console.log('✅ User updated');
      if (updates.username) {
        console.log(`   Username set to: ${user.username}`);
      }
      if (updates.activeWorkspaceId) {
        console.log(`   Active workspace updated`);
      }
      console.log('');
    }

    // Summary
    console.log('🎉 Setup complete!\n');
    console.log('Summary:');
    console.log(`   Workspace: ${workspace.name} (${workspace.slug})`);
    console.log(`   Workspace ID: ${workspace.id}`);
    console.log(`   User: ${user.name} (${user.email})`);
    console.log(`   User ID: ${user.id}`);
    console.log(`   Email: ${USER_CONFIG.email}`);
    if (!user.password) {
      console.log('   Password: Already set (existing user)');
    }

  } catch (error) {
    console.error('❌ Error creating workspace and user:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Run the setup
createPinpointWorkspaceAndLeonardo()
  .then(() => {
    console.log('✅ Script completed successfully');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Script failed:', error);
    process.exit(1);
  });

