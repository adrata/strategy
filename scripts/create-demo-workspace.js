#!/usr/bin/env node

/**
 * Create Demo Workspace Script
 * Creates a new "demo" workspace and adds user Ross to it
 */

const { PrismaClient } = require('@prisma/client');

class DemoWorkspaceCreator {
  constructor() {
    this.prisma = new PrismaClient();
  }

  async createDemoWorkspace() {
    try {
      console.log('🚀 Creating demo workspace...');

      // First, find the Ross user
      const rossUser = await this.prisma.users.findFirst({
        where: {
          OR: [
            { email: 'ross@adrata.com' },
            { username: 'ross' },
            { name: { contains: 'Ross', mode: 'insensitive' } }
          ]
        }
      });

      if (!rossUser) {
        throw new Error('Ross user not found. Please ensure the user exists in the database.');
      }

      console.log(`✅ Found Ross user: ${rossUser.name} (${rossUser.email})`);

      // Check if demo workspace already exists
      const existingDemoWorkspace = await this.prisma.workspaces.findFirst({
        where: {
          OR: [
            { slug: 'demo' },
            { name: { contains: 'demo', mode: 'insensitive' } }
          ]
        }
      });

      if (existingDemoWorkspace) {
        console.log(`⚠️  Demo workspace already exists: ${existingDemoWorkspace.name} (${existingDemoWorkspace.slug})`);
        
        // Check if Ross is already in this workspace
        const existingMembership = await this.prisma.workspace_users.findFirst({
          where: {
            workspaceId: existingDemoWorkspace.id,
            userId: rossUser.id,
            isActive: true
          }
        });

        if (existingMembership) {
          console.log('✅ Ross is already a member of the demo workspace');
          return existingDemoWorkspace;
        } else {
          // Add Ross to existing demo workspace
          await this.prisma.workspace_users.create({
            data: {
              workspaceId: existingDemoWorkspace.id,
              userId: rossUser.id,
              role: 'WORKSPACE_ADMIN',
              isActive: true,
              joinedAt: new Date(),
              createdAt: new Date(),
              updatedAt: new Date(),
            }
          });
          console.log('✅ Added Ross to existing demo workspace');
          return existingDemoWorkspace;
        }
      }

      // Create new demo workspace
      const demoWorkspace = await this.prisma.workspaces.create({
        data: {
          name: 'Demo',
          slug: 'demo',
          description: 'Demo workspace for testing and demonstration purposes',
          timezone: 'UTC',
          isActive: true,
          createdAt: new Date(),
          updatedAt: new Date(),
        }
      });

      console.log(`✅ Created demo workspace: ${demoWorkspace.name} (${demoWorkspace.slug})`);

      // Add Ross to the demo workspace as admin
      await this.prisma.workspace_users.create({
        data: {
          workspaceId: demoWorkspace.id,
          userId: rossUser.id,
          role: 'WORKSPACE_ADMIN',
          isActive: true,
          joinedAt: new Date(),
          createdAt: new Date(),
          updatedAt: new Date(),
        }
      });

      console.log('✅ Added Ross to demo workspace as admin');

      // Get final workspace info with user count
      const finalWorkspace = await this.prisma.workspaces.findUnique({
        where: { id: demoWorkspace.id },
        include: {
          workspace_users: {
            where: { isActive: true },
            include: {
              user: {
                select: {
                  id: true,
                  name: true,
                  email: true,
                  username: true
                }
              }
            }
          }
        }
      });

      console.log('\n📊 Demo Workspace Summary:');
      console.log(`   ID: ${finalWorkspace.id}`);
      console.log(`   Name: ${finalWorkspace.name}`);
      console.log(`   Slug: ${finalWorkspace.slug}`);
      console.log(`   Description: ${finalWorkspace.description}`);
      console.log(`   User Count: ${finalWorkspace.workspace_users.length}`);
      console.log('   Members:');
      finalWorkspace.workspace_users.forEach(member => {
        console.log(`     - ${member.user.name} (${member.user.email}) - ${member.role}`);
      });

      return finalWorkspace;

    } catch (error) {
      console.error('❌ Error creating demo workspace:', error);
      throw error;
    } finally {
      await this.prisma.$disconnect();
    }
  }

  async listAllWorkspaces() {
    try {
      console.log('\n📋 All Workspaces:');
      const workspaces = await this.prisma.workspaces.findMany({
        where: { isActive: true },
        include: {
          workspace_users: {
            where: { isActive: true },
            include: {
              user: {
                select: {
                  id: true,
                  name: true,
                  email: true
                }
              }
            }
          }
        },
        orderBy: { createdAt: 'asc' }
      });

      workspaces.forEach(workspace => {
        console.log(`\n   ${workspace.name} (${workspace.slug})`);
        console.log(`   ID: ${workspace.id}`);
        console.log(`   Users: ${workspace.workspace_users.length}`);
        workspace.workspace_users.forEach(member => {
          console.log(`     - ${member.user.name} (${member.user.email}) - ${member.role}`);
        });
      });

    } catch (error) {
      console.error('❌ Error listing workspaces:', error);
    }
  }
}

// Main execution
async function main() {
  const creator = new DemoWorkspaceCreator();
  
  try {
    await creator.createDemoWorkspace();
    await creator.listAllWorkspaces();
    console.log('\n🎉 Demo workspace setup completed successfully!');
  } catch (error) {
    console.error('❌ Demo workspace setup failed:', error);
    process.exit(1);
  }
}

// Run if called directly
if (require.main === module) {
  main();
}

module.exports = { DemoWorkspaceCreator };
