#!/usr/bin/env node

/**
 * 🔍 CHECK VICTORIA LELAND USER FIELDS
 * 
 * Check what fields Victoria Leland has in her user record
 */

require('dotenv').config();
const { PrismaClient } = require('@prisma/client');

class CheckVictoriaUserFields {
  constructor() {
    this.prisma = new PrismaClient();
  }

  async checkUserFields() {
    console.log('🔍 CHECKING VICTORIA LELAND USER FIELDS');
    console.log('======================================');
    console.log('Checking what fields Victoria Leland has in her user record');
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
      console.log(`   First Name: ${victoriaUser.firstName || 'NULL'}`);
      console.log(`   Last Name: ${victoriaUser.lastName || 'NULL'}`);
      console.log(`   Display Name: ${victoriaUser.displayName || 'NULL'}`);
      console.log(`   Password: ${victoriaUser.password ? 'SET' : 'NULL'}`);
      console.log(`   Is Active: ${victoriaUser.isActive}`);
      console.log(`   Active Workspace ID: ${victoriaUser.activeWorkspaceId || 'NULL'}`);
      console.log(`   Created: ${victoriaUser.createdAt.toISOString().split('T')[0]}`);
      console.log(`   Updated: ${victoriaUser.updatedAt.toISOString().split('T')[0]}`);
      console.log('');
      
      // Check if she has a password set
      if (!victoriaUser.password) {
        console.log('❌ PROBLEM: Victoria Leland has no password set!');
        console.log('   This is why authentication is failing.');
        console.log('');
        
        // Set a password for her
        const bcrypt = require('bcrypt');
        const hashedPassword = await bcrypt.hash('TOPgtm01!', 10);
        
        console.log('🔧 SETTING PASSWORD FOR VICTORIA LELAND:');
        console.log('======================================');
        
        const updatedUser = await this.prisma.users.update({
          where: { id: victoriaUser.id },
          data: {
            password: hashedPassword,
            username: 'vleland', // Set username for login
            updatedAt: new Date()
          }
        });
        
        console.log('✅ PASSWORD SET SUCCESSFULLY:');
        console.log('============================');
        console.log(`   Username: ${updatedUser.username}`);
        console.log(`   Password: SET (hashed)`);
        console.log(`   Updated: ${updatedUser.updatedAt.toISOString().split('T')[0]}`);
        console.log('');
        
        console.log('🎯 LOGIN CREDENTIALS:');
        console.log('====================');
        console.log('   Username: vleland');
        console.log('   Password: TOPgtm01!');
        console.log('   Email: vleland@topengineersplus.com');
        console.log('');
        
      } else {
        console.log('✅ Victoria Leland has a password set');
        console.log('   Username field:', victoriaUser.username || 'NULL');
        console.log('   If username is NULL, that might be the issue');
        
        if (!victoriaUser.username) {
          console.log('');
          console.log('🔧 SETTING USERNAME FOR VICTORIA LELAND:');
          console.log('=========================================');
          
          const updatedUser = await this.prisma.users.update({
            where: { id: victoriaUser.id },
            data: {
              username: 'vleland',
              updatedAt: new Date()
            }
          });
          
          console.log('✅ USERNAME SET SUCCESSFULLY:');
          console.log('============================');
          console.log(`   Username: ${updatedUser.username}`);
          console.log(`   Updated: ${updatedUser.updatedAt.toISOString().split('T')[0]}`);
        }
      }
      
    } catch (error) {
      console.log(`❌ ERROR: ${error.message}`);
      console.log('Stack trace:', error.stack);
    }
    
    await this.prisma.$disconnect();
  }
}

// Run field check
async function main() {
  const checker = new CheckVictoriaUserFields();
  await checker.checkUserFields();
}

if (require.main === module) {
  main().catch(console.error);
}

module.exports = CheckVictoriaUserFields;

