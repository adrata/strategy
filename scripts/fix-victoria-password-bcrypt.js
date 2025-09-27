#!/usr/bin/env node

/**
 * 🔧 FIX VICTORIA LELAND PASSWORD WITH BCRYPT
 * 
 * Set the correct bcrypt password for Victoria Leland to match the authentication system
 */

require('dotenv').config();
const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

class FixVictoriaPasswordBcrypt {
  constructor() {
    this.prisma = new PrismaClient();
  }

  async fixPassword() {
    console.log('🔧 FIXING VICTORIA LELAND PASSWORD WITH BCRYPT');
    console.log('============================================');
    console.log('Setting bcrypt password for Victoria Leland to match authentication system');
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
      
      // Create bcrypt hash for the password (matching the authentication system)
      const password = 'TOPgtm01!';
      const saltRounds = 10;
      const hashedPassword = await bcrypt.hash(password, saltRounds);
      
      console.log('🔧 SETTING BCRYPT PASSWORD:');
      console.log('============================');
      console.log(`   Username: vleland`);
      console.log(`   Password: ${password} (will be bcrypt hashed)`);
      console.log(`   Salt Rounds: ${saltRounds}`);
      console.log('');
      
      // Update Victoria's user record with bcrypt password
      const updatedUser = await this.prisma.users.update({
        where: { id: victoriaUser.id },
        data: {
          username: 'vleland',
          password: hashedPassword,
          updatedAt: new Date()
        }
      });
      
      console.log('✅ BCRYPT PASSWORD SET:');
      console.log('======================');
      console.log(`   Username: ${updatedUser.username}`);
      console.log(`   Password: SET (bcrypt hashed)`);
      console.log(`   Updated: ${updatedUser.updatedAt.toISOString().split('T')[0]}`);
      console.log('');
      
      // Test the password to make sure it works
      console.log('🧪 TESTING PASSWORD VERIFICATION:');
      console.log('==================================');
      const testPassword = 'TOPgtm01!';
      const isPasswordValid = await bcrypt.compare(testPassword, updatedUser.password);
      console.log(`   Test Password: ${testPassword}`);
      console.log(`   Password Valid: ${isPasswordValid ? '✅ YES' : '❌ NO'}`);
      console.log('');
      
      console.log('🎯 LOGIN CREDENTIALS FOR VICTORIA:');
      console.log('==================================');
      console.log('   Username: vleland');
      console.log('   Password: TOPgtm01!');
      console.log('   Email: vleland@topengineersplus.com');
      console.log('');
      
      console.log('✅ Victoria Leland should now be able to log in with bcrypt password!');
      
    } catch (error) {
      console.log(`❌ ERROR: ${error.message}`);
      console.log('Stack trace:', error.stack);
    }
    
    await this.prisma.$disconnect();
  }
}

// Run password fix
async function main() {
  const fixer = new FixVictoriaPasswordBcrypt();
  await fixer.fixPassword();
}

if (require.main === module) {
  main().catch(console.error);
}

module.exports = FixVictoriaPasswordBcrypt;

