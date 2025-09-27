#!/usr/bin/env node

/**
 * 🔍 CHECK WORKSPACE USERS
 * 
 * Find who are the users (people who can access) the TOP Engineering Plus workspace
 */

require('dotenv').config();
const { PrismaClient } = require('@prisma/client');

class CheckWorkspaceUsers {
  constructor() {
    this.prisma = new PrismaClient();
  }

  async checkWorkspaceUsers() {
    console.log('🔍 CHECKING WORKSPACE USERS');
    console.log('===========================');
    console.log('Finding who are the users (people who can access) the TOP Engineering Plus workspace');
    console.log('');
    
    try {
      // Test database connection first
      await this.prisma.$connect();
      console.log('✅ Database connected successfully');
      console.log('');
      
      // First, let's find the TOP Engineering Plus workspace
      const workspace = await this.prisma.workspaces.findFirst({
        where: {
          name: {
            contains: 'TOP',
            mode: 'insensitive'
          }
        },
        select: {
          id: true,
          name: true,
          createdAt: true,
          updatedAt: true
        }
      });
      
      if (workspace) {
        console.log('📊 WORKSPACE FOUND:');
        console.log('==================');
        console.log(`   ID: ${workspace.id}`);
        console.log(`   Name: ${workspace.name}`);
        console.log(`   Created: ${workspace.createdAt}`);
        console.log(`   Updated: ${workspace.updatedAt}`);
        console.log('');
        
        // Get workspace users
        const workspaceUsers = await this.prisma.workspace_users.findMany({
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
        
        // Get user details for each workspace user
        const workspaceUsersWithDetails = [];
        for (const workspaceUser of workspaceUsers) {
          const user = await this.prisma.users.findUnique({
            where: {
              id: workspaceUser.userId
            },
            select: {
              id: true,
              email: true,
              firstName: true,
              lastName: true,
              name: true,
              createdAt: true,
              updatedAt: true
            }
          });
          
          workspaceUsersWithDetails.push({
            ...workspaceUser,
            user: user
          });
        }
        
        console.log(`👥 WORKSPACE USERS (${workspaceUsersWithDetails.length} total):`);
        console.log('===============================================');
        
        if (workspaceUsersWithDetails.length > 0) {
          workspaceUsersWithDetails.forEach((workspaceUser, index) => {
            console.log(`${index + 1}. ${workspaceUser.user.firstName} ${workspaceUser.user.lastName}`);
            console.log(`   Email: ${workspaceUser.user.email}`);
            console.log(`   Role: ${workspaceUser.role}`);
            console.log(`   User ID: ${workspaceUser.userId}`);
            console.log(`   Joined: ${workspaceUser.createdAt.toISOString().split('T')[0]}`);
            console.log(`   User Created: ${workspaceUser.user.createdAt.toISOString().split('T')[0]}`);
            console.log('');
          });
          
          // Get summary statistics
          console.log('📊 WORKSPACE USERS SUMMARY:');
          console.log('===========================');
          console.log(`   Total Users: ${workspaceUsersWithDetails.length}`);
          
          const roles = {};
          workspaceUsersWithDetails.forEach(wu => {
            roles[wu.role] = (roles[wu.role] || 0) + 1;
          });
          
          console.log('   Roles:');
          Object.entries(roles).forEach(([role, count]) => {
            console.log(`     ${role}: ${count} users`);
          });
          
          // Show recent users
          const recentUsers = workspaceUsersWithDetails
            .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
            .slice(0, 5);
          
          console.log('');
          console.log('🕒 RECENT USERS (Last 5 to join):');
          console.log('==================================');
          recentUsers.forEach((user, index) => {
            console.log(`${index + 1}. ${user.user.firstName} ${user.user.lastName} (${user.role}) - ${user.createdAt.toISOString().split('T')[0]}`);
          });
          
        } else {
          console.log('❌ No users found for this workspace');
        }
        
      } else {
        console.log('❌ TOP Engineering Plus workspace not found');
        
        // Let's see what workspaces exist
        const allWorkspaces = await this.prisma.workspaces.findMany({
          select: {
            id: true,
            name: true,
            createdAt: true
          },
          orderBy: {
            name: 'asc'
          }
        });
        
        console.log('');
        console.log('📋 ALL WORKSPACES:');
        console.log('==================');
        allWorkspaces.forEach((ws, index) => {
          console.log(`${index + 1}. ${ws.name} (ID: ${ws.id})`);
        });
      }
      
    } catch (error) {
      console.log(`❌ ERROR: ${error.message}`);
    }
    
    await this.prisma.$disconnect();
  }
}

// Run workspace users check
async function main() {
  const checker = new CheckWorkspaceUsers();
  await checker.checkWorkspaceUsers();
}

if (require.main === module) {
  main().catch(console.error);
}

module.exports = CheckWorkspaceUsers;
