#!/usr/bin/env node

/**
 * 🔍 VERIFY VICTORIA LELAND WORKSPACE ACCESS
 * 
 * Verify that Victoria Leland is actually in the TOP Engineering Plus workspace
 */

require('dotenv').config();
const { PrismaClient } = require('@prisma/client');

class VerifyVictoriaWorkspaceAccess {
  constructor() {
    this.prisma = new PrismaClient();
  }

  async verifyAccess() {
    console.log('🔍 VERIFYING VICTORIA LELAND WORKSPACE ACCESS');
    console.log('============================================');
    console.log('Checking if Victoria Leland is actually in the TOP Engineering Plus workspace');
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
          name: true
        }
      });
      
      if (!victoriaUser) {
        console.log('❌ Victoria Leland user not found in database');
        return;
      }
      
      console.log('👤 VICTORIA LELAND USER FOUND:');
      console.log('==============================');
      console.log(`   ID: ${victoriaUser.id}`);
      console.log(`   Email: ${victoriaUser.email}`);
      console.log(`   Name: ${victoriaUser.name}`);
      console.log('');
      
      // Find TOP Engineering Plus workspace
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
      
      console.log('🏢 TOP ENGINEERING PLUS WORKSPACE FOUND:');
      console.log('=======================================');
      console.log(`   ID: ${workspace.id}`);
      console.log(`   Name: ${workspace.name}`);
      console.log('');
      
      // Check if Victoria is in the workspace
      const workspaceUser = await this.prisma.workspace_users.findFirst({
        where: {
          workspaceId: workspace.id,
          userId: victoriaUser.id
        },
        select: {
          id: true,
          workspaceId: true,
          userId: true,
          role: true,
          createdAt: true,
          updatedAt: true
        }
      });
      
      if (!workspaceUser) {
        console.log('❌ Victoria Leland is NOT in the TOP Engineering Plus workspace');
        console.log('   She needs to be added to the workspace');
        return;
      }
      
      console.log('✅ VICTORIA LELAND IS IN THE WORKSPACE:');
      console.log('======================================');
      console.log(`   Workspace User ID: ${workspaceUser.id}`);
      console.log(`   Workspace ID: ${workspaceUser.workspaceId}`);
      console.log(`   User ID: ${workspaceUser.userId}`);
      console.log(`   Role: ${workspaceUser.role}`);
      console.log(`   Added: ${workspaceUser.createdAt.toISOString().split('T')[0]}`);
      console.log(`   Updated: ${workspaceUser.updatedAt.toISOString().split('T')[0]}`);
      console.log('');
      
      // Get all users in the workspace to see the full list
      const allWorkspaceUsers = await this.prisma.workspace_users.findMany({
        where: {
          workspaceId: workspace.id
        },
        select: {
          id: true,
          userId: true,
          role: true,
          createdAt: true
        },
        orderBy: {
          createdAt: 'asc'
        }
      });
      
      console.log('👥 ALL USERS IN TOP ENGINEERING PLUS WORKSPACE:');
      console.log('===============================================');
      console.log(`   Total Users: ${allWorkspaceUsers.length}`);
      console.log('');
      
      for (let i = 0; i < allWorkspaceUsers.length; i++) {
        const workspaceUser = allWorkspaceUsers[i];
        const user = await this.prisma.users.findUnique({
          where: { id: workspaceUser.userId },
          select: { email: true, name: true }
        });
        
        console.log(`   ${i + 1}. ${user?.name || 'Unknown'} (${user?.email || 'Unknown'})`);
        console.log(`      Role: ${workspaceUser.role}`);
        console.log(`      Added: ${workspaceUser.createdAt.toISOString().split('T')[0]}`);
        console.log(`      Workspace User ID: ${workspaceUser.id}`);
        console.log('');
      }
      
    } catch (error) {
      console.log(`❌ ERROR: ${error.message}`);
      console.log('Stack trace:', error.stack);
    }
    
    await this.prisma.$disconnect();
  }
}

// Run verification
async function main() {
  const verifier = new VerifyVictoriaWorkspaceAccess();
  await verifier.verifyAccess();
}

if (require.main === module) {
  main().catch(console.error);
}

module.exports = VerifyVictoriaWorkspaceAccess;

