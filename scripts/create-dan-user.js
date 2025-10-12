#!/usr/bin/env node

/**
 * 🚀 CREATE DAN MIROLLI USER ACCOUNT
 * 
 * Creates Dan Mirolli user account with full admin access
 * - Email: dan@adrata.com
 * - Name: Dan Mirolli
 * - Username: dan
 * - Password: DanGoat25!
 * - Location: Atlanta, Georgia
 * - Timezone: America/New_York (Eastern Time for Atlanta)
 * - Role: Full admin access (same as Ross)
 */

require('dotenv').config();
const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcrypt');

class CreateDanUser {
  constructor() {
    this.prisma = new PrismaClient({
      datasources: {
        db: {
          url: process.env.DATABASE_URL
        }
      }
    });
  }

  async createDanUser() {
    console.log('🚀 CREATING DAN MIROLLI USER ACCOUNT');
    console.log('====================================');
    console.log('Creating Dan Mirolli with full admin access');
    console.log('');

    try {
      // Test database connection first
      await this.prisma.$connect();
      console.log('✅ Database connected successfully');
      console.log('');

      // Check if Dan already exists
      const existingUser = await this.prisma.users.findFirst({
        where: {
          OR: [
            { email: 'dan@adrata.com' },
            { username: 'dan' }
          ]
        }
      });

      if (existingUser) {
        console.log('⚠️  USER ALREADY EXISTS:');
        console.log('=======================');
        console.log(`   ID: ${existingUser.id}`);
        console.log(`   Email: ${existingUser.email}`);
        console.log(`   Username: ${existingUser.username || 'None'}`);
        console.log(`   Name: ${existingUser.name}`);
        console.log(`   Created: ${existingUser.createdAt.toISOString().split('T')[0]}`);
        console.log('');

        // Update password if needed
        console.log('🔄 UPDATING PASSWORD:');
        console.log('=====================');
        
        const password = 'DanGoat25!';
        const hashedPassword = await bcrypt.hash(password, 12);
        
        const updatedUser = await this.prisma.users.update({
          where: { id: existingUser.id },
          data: { 
            password: hashedPassword,
            updatedAt: new Date()
          }
        });

        console.log('✅ PASSWORD UPDATED SUCCESSFULLY');
        console.log('');
      } else {
        // Create Dan Mirolli user
        console.log('👤 CREATING DAN MIROLLI USER:');
        console.log('=============================');

        // Use the specified password
        const password = 'DanGoat25!';
        const hashedPassword = await bcrypt.hash(password, 12);

        const user = await this.prisma.users.create({
          data: {
            email: 'dan@adrata.com',
            username: 'dan',
            password: hashedPassword,
            name: 'Dan Mirolli',
            firstName: 'Dan',
            lastName: 'Mirolli',
            timezone: 'America/New_York', // Eastern Time for Atlanta, Georgia
            updatedAt: new Date()
          }
        });

        console.log('✅ USER CREATED SUCCESSFULLY:');
        console.log('=============================');
        console.log(`   ID: ${user.id}`);
        console.log(`   Email: ${user.email}`);
        console.log(`   Username: ${user.username}`);
        console.log(`   Name: ${user.name}`);
        console.log(`   Timezone: ${user.timezone}`);
        console.log(`   Created: ${user.createdAt.toISOString().split('T')[0]}`);
        console.log('');
      }

      // Find or create Adrata workspace
      const workspace = await this.prisma.workspaces.findFirst({
        where: {
          OR: [
            { slug: 'adrata' },
            { name: { contains: 'Adrata', mode: 'insensitive' } }
          ]
        }
      });

      if (!workspace) {
        console.log('❌ ERROR: Adrata workspace not found!');
        console.log('Please run setup-adrata-workspace-and-ross.js first');
        return;
      }

      console.log('🏢 LINKING TO ADRATA WORKSPACE:');
      console.log('===============================');
      console.log(`   Workspace ID: ${workspace.id}`);
      console.log(`   Workspace Name: ${workspace.name}`);
      console.log(`   Workspace Slug: ${workspace.slug}`);
      console.log('');

      // Check if user is already linked to workspace
      const userId = existingUser?.id || user?.id;
      const existingMembership = await this.prisma.workspace_users.findFirst({
        where: {
          userId: userId,
          workspaceId: workspace.id
        }
      });

      if (existingMembership) {
        console.log('✅ USER ALREADY LINKED TO WORKSPACE');
        console.log('===================================');
        console.log(`   Role: ${existingMembership.role}`);
        console.log('');
      } else {
        // Link user to Adrata workspace with admin role
        const membership = await this.prisma.workspace_users.create({
          data: {
            userId: userId,
            workspaceId: workspace.id,
            role: 'WORKSPACE_ADMIN',
            joinedAt: new Date(),
            updatedAt: new Date()
          }
        });

        console.log('✅ USER LINKED TO WORKSPACE:');
        console.log('============================');
        console.log(`   Membership ID: ${membership.id}`);
        console.log(`   Role: ${membership.role}`);
        console.log(`   Joined: ${membership.joinedAt.toISOString().split('T')[0]}`);
        console.log('');
      }

      console.log('🎉 DAN MIROLLI SETUP COMPLETE!');
      console.log('==============================');
      console.log('Dan now has full admin access including:');
      console.log('• Left panel on metrics/chronicle pages');
      console.log('• ProfileBox advanced features');
      console.log('• Grand Central access');
      console.log('• Tower access');
      console.log('• Olympus access');
      console.log('• Docs access');
      console.log('');
      console.log('Login credentials:');
      console.log('• Email: dan@adrata.com');
      console.log('• Password: DanGoat25!');
      console.log('• Workspace: Adrata');
      console.log('');

    } catch (error) {
      console.error('❌ ERROR CREATING DAN USER:');
      console.error('============================');
      console.error(error);
      process.exit(1);
    } finally {
      await this.prisma.$disconnect();
    }
  }
}

// Run the setup
const setup = new CreateDanUser();
setup.createDanUser().catch(console.error);
