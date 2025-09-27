#!/usr/bin/env node

/**
 * 🔍 CHECK VICTORIA LELAND USERNAME AND ADD TO WORKSPACE
 * 
 * Check Victoria Leland's username and add her to TOP Engineering Plus workspace
 */

require('dotenv').config();
const { PrismaClient } = require('@prisma/client');

class CheckVictoriaUsernameAndAddToWorkspace {
  constructor() {
    this.prisma = new PrismaClient();
  }

  async checkUsernameAndAddToWorkspace() {
    console.log('🔍 CHECKING VICTORIA LELAND USERNAME AND ADDING TO WORKSPACE');
    console.log('============================================================');
    console.log('Checking username and adding Victoria Leland to TOP Engineering Plus workspace');
    console.log('');
    
    try {
      // Test database connection first
      await this.prisma.$connect();
      console.log('✅ Database connected successfully');
      console.log('');
      
      // Find Victoria Leland user
      const victoriaUser = await this.prisma.users.findFirst({
        where: {
          email: 'vleland@topengineersplus.com'
        },
        select: {
          id: true,
          email: true,
          name: true,
          firstName: true,
          lastName: true,
          createdAt: true,
          updatedAt: true
        }
      });
      
      if (!victoriaUser) {
        console.log('❌ Victoria Leland user not found');
        return;
      }
      
      console.log('👤 VICTORIA LELAND USER DETAILS:');
      console.log('================================');
      console.log(`   ID: ${victoriaUser.id}`);
      console.log(`   Email: ${victoriaUser.email}`);
      console.log(`   Name: ${victoriaUser.name}`);
      console.log(`   First Name: ${victoriaUser.firstName || 'None'}`);
      console.log(`   Last Name: ${victoriaUser.lastName || 'None'}`);
      console.log(`   Created: ${victoriaUser.createdAt.toISOString().split('T')[0]}`);
      console.log(`   Updated: ${victoriaUser.updatedAt.toISOString().split('T')[0]}`);
      console.log('');
      
      // Check if she's already in the TOP Engineering Plus workspace
      const workspace = await this.prisma.workspaces.findFirst({
        where: {
          name: {
            contains: 'TOP',
            mode: 'insensitive'
          }
        },
        select: {
          id: true,
          name: true
        }
      });
      
      if (!workspace) {
        console.log('❌ TOP Engineering Plus workspace not found');
        return;
      }
      
      console.log('🏢 WORKSPACE FOUND:');
      console.log('==================');
      console.log(`   ID: ${workspace.id}`);
      console.log(`   Name: ${workspace.name}`);
      console.log('');
      
      // Check if she's already in the workspace
      const existingWorkspaceUser = await this.prisma.workspace_users.findFirst({
        where: {
          workspaceId: workspace.id,
          userId: victoriaUser.id
        }
      });
      
      if (existingWorkspaceUser) {
        console.log('✅ Victoria Leland is already in the TOP Engineering Plus workspace');
        console.log(`   Role: ${existingWorkspaceUser.role}`);
        console.log(`   Joined: ${existingWorkspaceUser.createdAt.toISOString().split('T')[0]}`);
        return;
      }
      
      // Add her to the workspace
      console.log('➕ ADDING VICTORIA LELAND TO WORKSPACE:');
      console.log('======================================');
      
      const newWorkspaceUser = await this.prisma.workspace_users.create({
        data: {
          workspaceId: workspace.id,
          userId: victoriaUser.id,
          role: 'member', // Default role, can be changed to 'admin' if needed
          updatedAt: new Date()
        }
      });
      
      console.log('✅ SUCCESSFULLY ADDED TO WORKSPACE:');
      console.log('==================================');
      console.log(`   Workspace User ID: ${newWorkspaceUser.id}`);
      console.log(`   Workspace ID: ${newWorkspaceUser.workspaceId}`);
      console.log(`   User ID: ${newWorkspaceUser.userId}`);
      console.log(`   Role: ${newWorkspaceUser.role}`);
      console.log(`   Added: ${newWorkspaceUser.createdAt.toISOString().split('T')[0]}`);
      console.log('');
      
      // Verify the addition
      const verifyUser = await this.prisma.workspace_users.findFirst({
        where: {
          workspaceId: workspace.id,
          userId: victoriaUser.id
        },
        select: {
          id: true,
          role: true,
          createdAt: true
        }
      });
      
      if (verifyUser) {
        console.log('✅ VERIFICATION SUCCESSFUL:');
        console.log('============================');
        console.log(`   User: Victoria Leland (vleland@topengineersplus.com)`);
        console.log(`   Role: ${verifyUser.role}`);
        console.log(`   Added: ${verifyUser.createdAt.toISOString().split('T')[0]}`);
      } else {
        console.log('❌ Verification failed - user not found in workspace');
      }
      
    } catch (error) {
      console.log(`❌ ERROR: ${error.message}`);
    }
    
    await this.prisma.$disconnect();
  }
}

// Run username check and workspace addition
async function main() {
  const checker = new CheckVictoriaUsernameAndAddToWorkspace();
  await checker.checkUsernameAndAddToWorkspace();
}

if (require.main === module) {
  main().catch(console.error);
}

module.exports = CheckVictoriaUsernameAndAddToWorkspace;
