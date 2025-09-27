#!/usr/bin/env node

/**
 * 🔍 CHECK USER EMAIL
 * 
 * Check if a user with the specified email exists in the database
 */

require('dotenv').config();
const { PrismaClient } = require('@prisma/client');

class CheckUserEmail {
  constructor() {
    this.prisma = new PrismaClient();
  }

  async checkUserEmail() {
    console.log('🔍 CHECKING USER EMAIL');
    console.log('======================');
    console.log('Checking if user with email exists in database');
    console.log('');
    
    try {
      // Test database connection first
      await this.prisma.$connect();
      console.log('✅ Database connected successfully');
      console.log('');
      
      const emailToCheck = 'vleland@topengineersplus.coma';
      console.log(`📧 SEARCHING FOR EMAIL: ${emailToCheck}`);
      console.log('==========================================');
      
      // Search for user with exact email
      const user = await this.prisma.users.findFirst({
        where: {
          email: emailToCheck
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
      
      if (user) {
        console.log('✅ USER FOUND:');
        console.log('==============');
        console.log(`   ID: ${user.id}`);
        console.log(`   Email: ${user.email}`);
        console.log(`   Name: ${user.name}`);
        console.log(`   First Name: ${user.firstName || 'None'}`);
        console.log(`   Last Name: ${user.lastName || 'None'}`);
        console.log(`   Created: ${user.createdAt.toISOString().split('T')[0]}`);
        console.log(`   Updated: ${user.updatedAt.toISOString().split('T')[0]}`);
        console.log('');
        
        // Check if this user is in any workspaces
        const workspaceUsers = await this.prisma.workspace_users.findMany({
          where: {
            userId: user.id
          },
          select: {
            id: true,
            workspaceId: true,
            role: true,
            createdAt: true
          }
        });
        
        if (workspaceUsers.length > 0) {
          console.log('🏢 WORKSPACE MEMBERSHIPS:');
          console.log('=========================');
          workspaceUsers.forEach((wu, index) => {
            console.log(`${index + 1}. Workspace ID: ${wu.workspaceId}`);
            console.log(`   Role: ${wu.role}`);
            console.log(`   Joined: ${wu.createdAt.toISOString().split('T')[0]}`);
            console.log('');
          });
        } else {
          console.log('❌ User is not a member of any workspaces');
        }
        
      } else {
        console.log('❌ USER NOT FOUND');
        console.log('');
        
        // Let's also check for similar emails (in case of typos)
        console.log('🔍 SEARCHING FOR SIMILAR EMAILS:');
        console.log('=================================');
        
        // Remove the 'a' at the end and search
        const correctedEmail = emailToCheck.slice(0, -1); // Remove last character
        console.log(`Checking corrected email: ${correctedEmail}`);
        
        const correctedUser = await this.prisma.users.findFirst({
          where: {
            email: correctedEmail
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
        
        if (correctedUser) {
          console.log('✅ SIMILAR USER FOUND:');
          console.log('======================');
          console.log(`   ID: ${correctedUser.id}`);
          console.log(`   Email: ${correctedUser.email}`);
          console.log(`   Name: ${correctedUser.name}`);
          console.log(`   First Name: ${correctedUser.firstName || 'None'}`);
          console.log(`   Last Name: ${correctedUser.lastName || 'None'}`);
          console.log(`   Created: ${correctedUser.createdAt.toISOString().split('T')[0]}`);
          console.log(`   Updated: ${correctedUser.updatedAt.toISOString().split('T')[0]}`);
        } else {
          console.log('❌ No similar user found');
        }
        
        // Let's also search for any users with 'vleland' in their email
        console.log('');
        console.log('🔍 SEARCHING FOR USERS WITH "vleland" IN EMAIL:');
        console.log('================================================');
        
        const vlelandUsers = await this.prisma.users.findMany({
          where: {
            email: {
              contains: 'vleland',
              mode: 'insensitive'
            }
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
        
        if (vlelandUsers.length > 0) {
          console.log(`✅ FOUND ${vlelandUsers.length} USER(S) WITH "vleland" IN EMAIL:`);
          console.log('===============================================================');
          vlelandUsers.forEach((user, index) => {
            console.log(`${index + 1}. ${user.email}`);
            console.log(`   Name: ${user.name}`);
            console.log(`   First Name: ${user.firstName || 'None'}`);
            console.log(`   Last Name: ${user.lastName || 'None'}`);
            console.log(`   Created: ${user.createdAt.toISOString().split('T')[0]}`);
            console.log('');
          });
        } else {
          console.log('❌ No users found with "vleland" in email');
        }
        
        // Let's also search for any users with 'topengineersplus' in their email
        console.log('');
        console.log('🔍 SEARCHING FOR USERS WITH "topengineersplus" IN EMAIL:');
        console.log('=========================================================');
        
        const topEngineersUsers = await this.prisma.users.findMany({
          where: {
            email: {
              contains: 'topengineersplus',
              mode: 'insensitive'
            }
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
        
        if (topEngineersUsers.length > 0) {
          console.log(`✅ FOUND ${topEngineersUsers.length} USER(S) WITH "topengineersplus" IN EMAIL:`);
          console.log('================================================================================');
          topEngineersUsers.forEach((user, index) => {
            console.log(`${index + 1}. ${user.email}`);
            console.log(`   Name: ${user.name}`);
            console.log(`   First Name: ${user.firstName || 'None'}`);
            console.log(`   Last Name: ${user.lastName || 'None'}`);
            console.log(`   Created: ${user.createdAt.toISOString().split('T')[0]}`);
            console.log('');
          });
        } else {
          console.log('❌ No users found with "topengineersplus" in email');
        }
      }
      
    } catch (error) {
      console.log(`❌ ERROR: ${error.message}`);
    }
    
    await this.prisma.$disconnect();
  }
}

// Run user email check
async function main() {
  const checker = new CheckUserEmail();
  await checker.checkUserEmail();
}

if (require.main === module) {
  main().catch(console.error);
}

module.exports = CheckUserEmail;
