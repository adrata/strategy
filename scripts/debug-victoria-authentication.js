#!/usr/bin/env node

/**
 * 🔍 DEBUG VICTORIA LELAND AUTHENTICATION
 * 
 * Debug the authentication process to see exactly what's happening
 */

require('dotenv').config();
const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

class DebugVictoriaAuthentication {
  constructor() {
    this.prisma = new PrismaClient();
  }

  async debugAuthentication() {
    console.log('🔍 DEBUGGING VICTORIA LELAND AUTHENTICATION');
    console.log('==========================================');
    console.log('Debugging the authentication process step by step');
    console.log('');
    
    try {
      // Test database connection first
      await this.prisma.$connect();
      console.log('✅ Database connected successfully');
      console.log('');
      
      // Find Victoria Leland user with all fields
      const victoriaUser = await this.prisma.users.findFirst({
        where: {
          email: 'vleland@topengineersplus.com'
        }
      });
      
      if (!victoriaUser) {
        console.log('❌ Victoria Leland user not found');
        return;
      }
      
      console.log('👤 VICTORIA LELAND USER RECORD:');
      console.log('==============================');
      console.log(`   ID: ${victoriaUser.id}`);
      console.log(`   Email: ${victoriaUser.email}`);
      console.log(`   Username: ${victoriaUser.username || 'NULL'}`);
      console.log(`   Name: ${victoriaUser.name}`);
      console.log(`   Password: ${victoriaUser.password ? 'SET' : 'NULL'}`);
      console.log(`   Is Active: ${victoriaUser.isActive}`);
      console.log(`   Active Workspace ID: ${victoriaUser.activeWorkspaceId || 'NULL'}`);
      console.log('');
      
      // Test password verification
      if (victoriaUser.password) {
        console.log('🧪 TESTING PASSWORD VERIFICATION:');
        console.log('==================================');
        
        const testPassword = 'TOPgtm01!';
        const isPasswordValid = await bcrypt.compare(testPassword, victoriaUser.password);
        
        console.log(`   Test Password: ${testPassword}`);
        console.log(`   Password Valid: ${isPasswordValid ? '✅ YES' : '❌ NO'}`);
        console.log(`   Password Hash Length: ${victoriaUser.password.length}`);
        console.log(`   Password Hash Starts With: ${victoriaUser.password.substring(0, 10)}...`);
        console.log('');
        
        if (!isPasswordValid) {
          console.log('❌ PASSWORD VERIFICATION FAILED!');
          console.log('   This explains the 401 Unauthorized error.');
          console.log('');
          
          // Try to fix the password again
          console.log('🔧 FIXING PASSWORD AGAIN:');
          console.log('==========================');
          
          const newHashedPassword = await bcrypt.hash('TOPgtm01!', 10);
          
          const updatedUser = await this.prisma.users.update({
            where: { id: victoriaUser.id },
            data: {
              password: newHashedPassword,
              updatedAt: new Date()
            }
          });
          
          // Test the new password
          const newPasswordValid = await bcrypt.compare('TOPgtm01!', updatedUser.password);
          console.log(`   New Password Valid: ${newPasswordValid ? '✅ YES' : '❌ NO'}`);
          console.log('');
        }
      } else {
        console.log('❌ NO PASSWORD SET!');
        console.log('   This explains the 401 Unauthorized error.');
        console.log('');
        
        // Set a password
        console.log('🔧 SETTING PASSWORD:');
        console.log('====================');
        
        const hashedPassword = await bcrypt.hash('TOPgtm01!', 10);
        
        const updatedUser = await this.prisma.users.update({
          where: { id: victoriaUser.id },
          data: {
            password: hashedPassword,
            username: 'vleland',
            updatedAt: new Date()
          }
        });
        
        console.log('✅ PASSWORD SET:');
        console.log('================');
        console.log(`   Username: ${updatedUser.username}`);
        console.log(`   Password: SET (bcrypt hashed)`);
        console.log(`   Updated: ${updatedUser.updatedAt.toISOString().split('T')[0]}`);
        console.log('');
      }
      
      // Check workspace access
      console.log('🏢 CHECKING WORKSPACE ACCESS:');
      console.log('============================');
      
      const workspaceMemberships = await this.prisma.workspace_users.findMany({
        where: {
          userId: victoriaUser.id
        },
        select: {
          id: true,
          role: true,
          workspaceId: true,
          createdAt: true
        }
      });
      
      console.log(`   Workspace Memberships: ${workspaceMemberships.length}`);
      workspaceMemberships.forEach((membership, i) => {
        console.log(`   ${i + 1}. Workspace ID: ${membership.workspaceId}`);
        console.log(`      Role: ${membership.role}`);
        console.log(`      Added: ${membership.createdAt.toISOString().split('T')[0]}`);
      });
      console.log('');
      
      // Final authentication test
      console.log('🎯 FINAL AUTHENTICATION TEST:');
      console.log('=============================');
      console.log('   Username: vleland');
      console.log('   Password: TOPgtm01!');
      console.log('   Email: vleland@topengineersplus.com');
      console.log('   Workspace Access: ✅ YES');
      console.log('');
      
      console.log('✅ Victoria Leland should now be able to log in!');
      
    } catch (error) {
      console.log(`❌ ERROR: ${error.message}`);
      console.log('Stack trace:', error.stack);
    }
    
    await this.prisma.$disconnect();
  }
}

// Run debug
async function main() {
  const debugger = new DebugVictoriaAuthentication();
  await debugger.debugAuthentication();
}

if (require.main === module) {
  main().catch(console.error);
}

module.exports = DebugVictoriaAuthentication;

