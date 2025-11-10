/**
 * Create Top-Temp Workspace and Tester User
 * Creates a workspace called "top-temp" and user "tester" with specified password
 */

const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');
const { ulid } = require('ulid');

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: process.env.DATABASE_URL
    }
  }
});

// Configuration
const WORKSPACE_CONFIG = {
  name: 'Top Temp',
  slug: 'top-temp',
  description: 'Top Temp workspace'
};

const USER_CONFIG = {
  email: 'tester@top-temp.com',
  username: 'tester',
  name: 'Tester',
  firstName: 'Tester',
  lastName: '',
  password: 'WeTesting01!',
  timezone: 'UTC'
};

async function createTopTempWorkspaceAndTester() {
  try {
    console.log('🚀 Creating Top-Temp workspace and Tester user...\n');

    // Step 1: Check if workspace already exists
    console.log('🏢 Checking for existing workspace...');
    let workspace = await prisma.workspaces.findUnique({
      where: { slug: WORKSPACE_CONFIG.slug }
    });

    if (workspace) {
      console.log(`✅ Workspace already exists: ${workspace.name} (${workspace.slug})`);
      console.log(`   ID: ${workspace.id}\n`);
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
      where: { email: USER_CONFIG.email },
      select: {
        id: true,
        email: true,
        username: true,
        name: true,
        firstName: true,
        lastName: true,
        activeWorkspaceId: true,
        isActive: true
      }
    });

    if (user) {
      console.log(`✅ User already exists: ${user.name} (${user.email})`);
      console.log(`   ID: ${user.id}\n`);
      
      // Update password if user exists
      console.log('🔐 Updating password...');
      const hashedPassword = await bcrypt.hash(USER_CONFIG.password, 12);
      await prisma.users.update({
        where: { id: user.id },
        data: {
          password: hashedPassword,
          updatedAt: new Date()
        }
      });
      console.log('✅ Password updated\n');
    } else {
      // Hash the password
      console.log('🔐 Hashing password...');
      const hashedPassword = await bcrypt.hash(USER_CONFIG.password, 12);

      // Create user using raw SQL to avoid schema mismatch
      console.log('👤 Creating user...');
      const userId = ulid();
      const now = new Date();
      const result = await prisma.$queryRaw`
        INSERT INTO users (
          id, email, password, username, name, "firstName", "lastName", 
          timezone, "isActive", "activeWorkspaceId", "createdAt", "updatedAt"
        )
        VALUES (
          ${userId}, ${USER_CONFIG.email}, ${hashedPassword}, ${USER_CONFIG.username}, 
          ${USER_CONFIG.name}, ${USER_CONFIG.firstName}, ${USER_CONFIG.lastName || null},
          ${USER_CONFIG.timezone}, true, ${workspace.id}, ${now}, ${now}
        )
        RETURNING id, email, username, name, "firstName", "lastName", "activeWorkspaceId", "isActive"
      `;
      
      if (result && result.length > 0) {
        user = {
          id: result[0].id,
          email: result[0].email,
          username: result[0].username,
          name: result[0].name,
          firstName: result[0].firstName,
          lastName: result[0].lastName,
          activeWorkspaceId: result[0].activeWorkspaceId,
          isActive: result[0].isActive
        };
        console.log(`✅ User created: ${user.name} (${user.email})`);
        console.log(`   ID: ${user.id}\n`);
      } else {
        throw new Error('Failed to create user - no result returned');
      }
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

    // Step 4: Ensure user's active workspace is set
    if (user.activeWorkspaceId !== workspace.id) {
      console.log('🔄 Updating user active workspace...');
      await prisma.users.update({
        where: { id: user.id },
        data: {
          activeWorkspaceId: workspace.id,
          updatedAt: new Date()
        }
      });
      // Refresh user data
      const updatedUser = await prisma.users.findUnique({
        where: { id: user.id },
        select: {
          id: true,
          email: true,
          username: true,
          name: true,
          firstName: true,
          lastName: true,
          activeWorkspaceId: true,
          isActive: true
        }
      });
      if (updatedUser) {
        user = updatedUser;
      }
      console.log('✅ Active workspace updated\n');
    }

    // Summary
    console.log('🎉 Setup complete!\n');
    console.log('Summary:');
    console.log(`   Workspace: ${workspace.name} (${workspace.slug})`);
    console.log(`   Workspace ID: ${workspace.id}`);
    console.log(`   User: ${user.name} (${user.email})`);
    console.log(`   User ID: ${user.id}`);
    console.log(`   Username: ${user.username || USER_CONFIG.username}`);
    console.log(`   Password: ${USER_CONFIG.password}`);

  } catch (error) {
    console.error('❌ Error creating workspace and user:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Run the setup
createTopTempWorkspaceAndTester()
  .then(() => {
    console.log('✅ Script completed successfully');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Script failed:', error);
    process.exit(1);
  });

