#!/usr/bin/env node

/**
 * 🔍 DEBUG ROSS AUTHENTICATION
 * 
 * Debug why Ross can't sign in
 */

require('dotenv').config();
const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcrypt');

class DebugRossAuth {
  constructor() {
    this.prisma = new PrismaClient();
  }

  async debugAuth() {
    console.log('🔍 DEBUGGING ROSS AUTHENTICATION');
    console.log('=================================');
    console.log('');

    try {
      // Test database connection first
      await this.prisma.$connect();
      console.log('✅ Database connected successfully');
      console.log('');

      // Test different login methods
      const testCredentials = [
        { type: 'email', value: 'ross@adrata.com' },
        { type: 'username', value: 'ross' },
        { type: 'name', value: 'Ross Sylvester' }
      ];

      for (const cred of testCredentials) {
        console.log(`🔍 Testing ${cred.type}: "${cred.value}"`);
        console.log('=====================================');

        // Build OR conditions like the auth API does
        const orConditions = [];
        if (cred.type === 'email') {
          orConditions.push({ email: cred.value.toLowerCase() });
        } else if (cred.type === 'username') {
          orConditions.push({ username: cred.value.toLowerCase() });
        } else {
          orConditions.push({ name: cred.value });
        }

        console.log('OR Conditions:', orConditions);

        try {
          const user = await this.prisma.users.findFirst({
            where: {
              OR: orConditions,
              isActive: true,
            },
            select: {
              id: true,
              email: true,
              username: true,
              name: true,
              password: true,
              isActive: true,
              activeWorkspaceId: true,
            }
          });

          if (user) {
            console.log('✅ USER FOUND:');
            console.log(`   ID: ${user.id}`);
            console.log(`   Email: ${user.email}`);
            console.log(`   Username: ${user.username}`);
            console.log(`   Name: ${user.name}`);
            console.log(`   Is Active: ${user.isActive}`);
            console.log(`   Has Password: ${!!user.password}`);
            console.log(`   Password Length: ${user.password ? user.password.length : 0}`);

            // Test password verification
            if (user.password) {
              const testPassword = 'RossGoat25!';
              const isValidPassword = await bcrypt.compare(testPassword, user.password);
              console.log(`   Password Valid: ${isValidPassword}`);
              
              if (!isValidPassword) {
                console.log('❌ PASSWORD MISMATCH!');
                console.log('   Expected: RossGoat25!');
                console.log('   Hash starts with: ' + user.password.substring(0, 10) + '...');
              }
            } else {
              console.log('❌ NO PASSWORD SET!');
            }
          } else {
            console.log('❌ USER NOT FOUND');
          }
        } catch (error) {
          console.log('❌ DATABASE ERROR:', error.message);
        }
        console.log('');
      }

      // Test the exact query the auth API would use
      console.log('🔍 TESTING EXACT AUTH API QUERY');
      console.log('===============================');
      
      const email = 'ross@adrata.com';
      const isEmail = email.includes("@");
      console.log(`Input: "${email}"`);
      console.log(`Is Email: ${isEmail}`);

      const orConditions = [];
      if (isEmail) {
        orConditions.push({ email: email.toLowerCase() });
      } else {
        orConditions.push({ username: email.toLowerCase() });
      }
      orConditions.push({ name: email }); // Fallback: name login

      console.log('OR Conditions:', orConditions);

      const user = await this.prisma.users.findFirst({
        where: {
          OR: orConditions,
          isActive: true,
        },
        select: {
          id: true,
          email: true,
          username: true,
          name: true,
          password: true,
          isActive: true,
          activeWorkspaceId: true,
        }
      });

      if (user) {
        console.log('✅ USER FOUND WITH EMAIL LOGIN:');
        console.log(`   ID: ${user.id}`);
        console.log(`   Email: ${user.email}`);
        console.log(`   Username: ${user.username}`);
        console.log(`   Name: ${user.name}`);
        console.log(`   Is Active: ${user.isActive}`);
        console.log(`   Has Password: ${!!user.password}`);

        // Test password
        const testPassword = 'RossGoat25!';
        if (user.password) {
          const isValidPassword = await bcrypt.compare(testPassword, user.password);
          console.log(`   Password Valid: ${isValidPassword}`);
        }
      } else {
        console.log('❌ USER NOT FOUND WITH EMAIL LOGIN');
      }

    } catch (error) {
      console.log(`❌ ERROR: ${error.message}`);
      console.log('');
      if (error.code) {
        console.log(`   Error Code: ${error.code}`);
      }
    }

    await this.prisma.$disconnect();
  }
}

// Run the debug
async function main() {
  const debug = new DebugRossAuth();
  await debug.debugAuth();
}

if (require.main === module) {
  main().catch(console.error);
}

module.exports = DebugRossAuth;
