#!/usr/bin/env node

/**
 * 🔧 FIX VICTORIA LELAND AUTHENTICATION
 * 
 * Set username and password for Victoria Leland to fix login issues
 */

require('dotenv').config();
const { PrismaClient } = require('@prisma/client');
const crypto = require('crypto');

class FixVictoriaAuthentication {
  constructor() {
    this.prisma = new PrismaClient();
  }

  async fixAuthentication() {
    console.log('🔧 FIXING VICTORIA LELAND AUTHENTICATION');
    console.log('======================================');
    console.log('Setting username and password for Victoria Leland');
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
        }
      });
      
      if (!victoriaUser) {
        console.log('❌ Victoria Leland user not found');
        return;
      }
      
      console.log('👤 CURRENT VICTORIA LELAND RECORD:');
      console.log('==================================');
      console.log(`   ID: ${victoriaUser.id}`);
      console.log(`   Email: ${victoriaUser.email}`);
      console.log(`   Username: ${victoriaUser.username || 'NULL'}`);
      console.log(`   Password: ${victoriaUser.password ? 'SET' : 'NULL'}`);
      console.log(`   Is Active: ${victoriaUser.isActive}`);
      console.log('');
      
      // Create a simple hash for the password (using Node.js crypto instead of bcrypt)
      const password = 'TOPgtm01!';
      const hashedPassword = crypto.createHash('sha256').update(password).digest('hex');
      
      console.log('🔧 SETTING AUTHENTICATION CREDENTIALS:');
      console.log('=======================================');
      console.log(`   Username: vleland`);
      console.log(`   Password: ${password} (will be hashed)`);
      console.log('');
      
      // Update Victoria's user record
      const updatedUser = await this.prisma.users.update({
        where: { id: victoriaUser.id },
        data: {
          username: 'vleland',
          password: hashedPassword,
          updatedAt: new Date()
        }
      });
      
      console.log('✅ AUTHENTICATION CREDENTIALS SET:');
      console.log('==================================');
      console.log(`   Username: ${updatedUser.username}`);
      console.log(`   Password: SET (hashed)`);
      console.log(`   Updated: ${updatedUser.updatedAt.toISOString().split('T')[0]}`);
      console.log('');
      
      console.log('🎯 LOGIN CREDENTIALS FOR VICTORIA:');
      console.log('==================================');
      console.log('   Username: vleland');
      console.log('   Password: TOPgtm01!');
      console.log('   Email: vleland@topengineersplus.com');
      console.log('');
      
      console.log('✅ Victoria Leland should now be able to log in!');
      console.log('   Try logging in with username: vleland');
      console.log('   Password: TOPgtm01!');
      
    } catch (error) {
      console.log(`❌ ERROR: ${error.message}`);
      console.log('Stack trace:', error.stack);
    }
    
    await this.prisma.$disconnect();
  }
}

// Run authentication fix
async function main() {
  const fixer = new FixVictoriaAuthentication();
  await fixer.fixAuthentication();
}

if (require.main === module) {
  main().catch(console.error);
}

module.exports = FixVictoriaAuthentication;

