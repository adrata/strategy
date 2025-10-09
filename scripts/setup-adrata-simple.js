#!/usr/bin/env node

/**
 * 🚀 SIMPLE SETUP FOR ADRATA WORKSPACE AND ROSS SYLVESTER USER
 * 
 * Creates the Adrata workspace and Ross Sylvester user with proper configuration
 * - Workspace: "Adrata" with slug "adrata"
 * - User: Ross Sylvester with email ross@adrata.com and username "ross"
 * - Timezone: America/Phoenix (Arizona)
 * - Role: WORKSPACE_ADMIN
 */

require('dotenv').config();
const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcrypt');

class SimpleAdrataSetup {
  constructor() {
    this.prisma = new PrismaClient();
  }

  async setupWorkspaceAndUser() {
    console.log('🚀 SETTING UP ADRATA WORKSPACE AND ROSS SYLVESTER USER');
    console.log('=====================================================');
    console.log('');

    try {
      // Test database connection first
      await this.prisma.$connect();
      console.log('✅ Database connected successfully');
      console.log('');

      // First, let's add the username column if it doesn't exist
      console.log('🔧 CHECKING/ADDING USERNAME COLUMN:');
      console.log('===================================');
      
      try {
        await this.prisma.$executeRaw`
          ALTER TABLE users ADD COLUMN IF NOT EXISTS username VARCHAR(50) UNIQUE;
        `;
        console.log('✅ Username column added/verified');
      } catch (error) {
        console.log('⚠️  Username column may already exist or error occurred:', error.message);
      }

      try {
        await this.prisma.$executeRaw`
          CREATE INDEX IF NOT EXISTS idx_users_username ON users(username);
        `;
        console.log('✅ Username index added/verified');
      } catch (error) {
        console.log('⚠️  Username index may already exist or error occurred:', error.message);
      }
      console.log('');

      // Check if workspace already exists
      const existingWorkspace = await this.prisma.workspaces.findFirst({
        where: {
          OR: [
            { slug: 'adrata' },
            { name: { contains: 'Adrata', mode: 'insensitive' } }
          ]
        }
      });

      let workspace;
      if (existingWorkspace) {
        console.log('⚠️  WORKSPACE ALREADY EXISTS:');
        console.log('============================');
        console.log(`   ID: ${existingWorkspace.id}`);
        console.log(`   Name: ${existingWorkspace.name}`);
        console.log(`   Slug: ${existingWorkspace.slug}`);
        console.log(`   Created: ${existingWorkspace.createdAt.toISOString().split('T')[0]}`);
        console.log('');
        workspace = existingWorkspace;
      } else {
        // Create the Adrata workspace
        console.log('🏢 CREATING ADRATA WORKSPACE:');
        console.log('=============================');

        workspace = await this.prisma.workspaces.create({
          data: {
            name: 'Adrata',
            slug: 'adrata',
            timezone: 'America/Phoenix',
            description: 'Adrata workspace for sales and customer management',
            updatedAt: new Date()
          }
        });

        console.log('✅ WORKSPACE CREATED SUCCESSFULLY:');
        console.log('=================================');
        console.log(`   ID: ${workspace.id}`);
        console.log(`   Name: ${workspace.name}`);
        console.log(`   Slug: ${workspace.slug}`);
        console.log(`   Timezone: ${workspace.timezone}`);
        console.log(`   Created: ${workspace.createdAt.toISOString().split('T')[0]}`);
        console.log('');
      }

      // Check if Ross Sylvester user already exists
      const existingUser = await this.prisma.users.findFirst({
        where: {
          email: 'ross@adrata.com'
        }
      });

      let user;
      if (existingUser) {
        console.log('⚠️  USER ALREADY EXISTS:');
        console.log('=======================');
        console.log(`   ID: ${existingUser.id}`);
        console.log(`   Email: ${existingUser.email}`);
        console.log(`   Name: ${existingUser.name}`);
        console.log(`   Created: ${existingUser.createdAt.toISOString().split('T')[0]}`);
        console.log('');

        // Update username and password
        console.log('🔄 UPDATING USER DETAILS:');
        console.log('=========================');
        
        const password = 'RossGoat25!';
        const hashedPassword = await bcrypt.hash(password, 12);
        
        user = await this.prisma.users.update({
          where: { id: existingUser.id },
          data: { 
            username: 'ross',
            password: hashedPassword,
            firstName: 'Ross',
            lastName: 'Sylvester',
            timezone: 'America/Phoenix',
            updatedAt: new Date()
          }
        });

        console.log('✅ USER DETAILS UPDATED:');
        console.log(`   Username: ${user.username}`);
        console.log(`   Password: Updated successfully`);
        console.log(`   Timezone: ${user.timezone}`);
        console.log('');
      } else {
        // Create Ross Sylvester user
        console.log('👤 CREATING ROSS SYLVESTER USER:');
        console.log('================================');

        const password = 'RossGoat25!';
        const hashedPassword = await bcrypt.hash(password, 12);

        user = await this.prisma.users.create({
          data: {
            email: 'ross@adrata.com',
            username: 'ross',
            password: hashedPassword,
            name: 'Ross Sylvester',
            firstName: 'Ross',
            lastName: 'Sylvester',
            timezone: 'America/Phoenix',
            updatedAt: new Date()
          }
        });

        console.log('✅ USER CREATED SUCCESSFULLY:');
        console.log('============================');
        console.log(`   ID: ${user.id}`);
        console.log(`   Email: ${user.email}`);
        console.log(`   Username: ${user.username}`);
        console.log(`   Name: ${user.name}`);
        console.log(`   Timezone: ${user.timezone}`);
        console.log(`   Created: ${user.createdAt.toISOString().split('T')[0]}`);
        console.log(`   Password: Set successfully`);
        console.log('');
      }

      // Check if user is already linked to workspace
      const existingWorkspaceUser = await this.prisma.workspace_users.findFirst({
        where: {
          workspaceId: workspace.id,
          userId: user.id
        }
      });

      if (existingWorkspaceUser) {
        console.log('✅ USER ALREADY LINKED TO WORKSPACE:');
        console.log('===================================');
        console.log(`   Role: ${existingWorkspaceUser.role}`);
        console.log(`   Joined: ${existingWorkspaceUser.createdAt.toISOString().split('T')[0]}`);
        console.log('');
      } else {
        // Link user to workspace with WORKSPACE_ADMIN role
        console.log('🔗 LINKING USER TO WORKSPACE:');
        console.log('=============================');

        const workspaceUser = await this.prisma.workspace_users.create({
          data: {
            workspaceId: workspace.id,
            userId: user.id,
            role: 'WORKSPACE_ADMIN',
            updatedAt: new Date()
          }
        });

        console.log('✅ USER LINKED TO WORKSPACE:');
        console.log('============================');
        console.log(`   Workspace User ID: ${workspaceUser.id}`);
        console.log(`   Role: ${workspaceUser.role}`);
        console.log(`   Joined: ${workspaceUser.createdAt.toISOString().split('T')[0]}`);
        console.log('');
      }

      // Set user's active workspace
      console.log('🎯 SETTING ACTIVE WORKSPACE:');
      console.log('============================');

      const updatedUser = await this.prisma.users.update({
        where: { id: user.id },
        data: { 
          activeWorkspaceId: workspace.id,
          updatedAt: new Date()
        }
      });

      console.log('✅ ACTIVE WORKSPACE SET:');
      console.log('========================');
      console.log(`   User: ${updatedUser.name} (@${updatedUser.username})`);
      console.log(`   Active Workspace: ${workspace.name} (${workspace.slug})`);
      console.log('');

      // Final verification
      console.log('🔍 FINAL VERIFICATION:');
      console.log('======================');
      
      const finalUser = await this.prisma.users.findFirst({
        where: { email: 'ross@adrata.com' },
        include: {
          workspaces: true,
          workspace_users: {
            include: {
              workspace: true
            }
          }
        }
      });

      if (finalUser) {
        console.log('✅ SETUP COMPLETE:');
        console.log('==================');
        console.log(`   User: ${finalUser.name} (@${finalUser.username})`);
        console.log(`   Email: ${finalUser.email}`);
        console.log(`   Timezone: ${finalUser.timezone}`);
        console.log(`   Active Workspace: ${finalUser.workspaces?.name || 'None'}`);
        console.log(`   Workspace Role: ${finalUser.workspace_users[0]?.role || 'None'}`);
        console.log('');
        console.log('🎉 Adrata workspace and Ross Sylvester user are ready!');
        console.log('');
        console.log('📋 LOGIN CREDENTIALS:');
        console.log('=====================');
        console.log(`   Email: ross@adrata.com`);
        console.log(`   Username: @ross`);
        console.log(`   Password: RossGoat25!`);
        console.log(`   Workspace: Adrata`);
      }

    } catch (error) {
      console.log(`❌ ERROR: ${error.message}`);
      console.log('');
      if (error.code) {
        console.log(`   Error Code: ${error.code}`);
      }
      console.log('   Stack Trace:', error.stack);
    }

    await this.prisma.$disconnect();
  }
}

// Run the setup
async function main() {
  const setup = new SimpleAdrataSetup();
  await setup.setupWorkspaceAndUser();
}

if (require.main === module) {
  main().catch(console.error);
}

module.exports = SimpleAdrataSetup;
