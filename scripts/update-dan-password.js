#!/usr/bin/env node

/**
 * 🔐 UPDATE DAN'S PASSWORD
 * Update dan@adrata.com password to "DanGoat90!"
 * This script directly updates the database with the new hashed password
 */

const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

// Set the DATABASE_URL environment variable from production config
process.env.DATABASE_URL = "postgresql://neondb_owner:npg_lt0xGowzW5yV@ep-damp-math-a8ht5oj3.eastus2.azure.neon.tech/neondb?sslmode=require&pgbouncer=true&connection_limit=20&pool_timeout=20&statement_timeout=30000";

const prisma = new PrismaClient();

async function updateDanPassword() {
  try {
    console.log('🔐 UPDATING DAN\'S PASSWORD\n');
    console.log('Target user: dan@adrata.com');
    console.log('New password: DanGoat90!\n');

    // Find Dan's user
    console.log('🔍 Finding dan@adrata.com user...');
    const danUser = await prisma.users.findFirst({
      where: { email: 'dan@adrata.com' }
    });

    if (!danUser) {
      console.log('❌ dan@adrata.com user not found');
      return;
    }

    console.log(`✅ Found user: ${danUser.name} (${danUser.id})`);
    console.log(`   Email: ${danUser.email}`);
    console.log(`   Current password hash: ${danUser.password ? 'Set' : 'Not set'}\n`);

    // Hash the new password
    console.log('🔐 Hashing new password...');
    const newPassword = 'DanGoat90!';
    const saltRounds = 12;
    const hashedPassword = await bcrypt.hash(newPassword, saltRounds);
    
    console.log(`✅ Password hashed successfully (salt rounds: ${saltRounds})`);
    console.log(`   Hash length: ${hashedPassword.length} characters`);
    console.log(`   Hash prefix: ${hashedPassword.substring(0, 10)}...\n`);

    // Update the password in the database
    console.log('💾 Updating password in database...');
    const updateResult = await prisma.users.update({
      where: { id: danUser.id },
      data: {
        password: hashedPassword,
        updatedAt: new Date()
      }
    });

    console.log('✅ Password updated successfully!');
    console.log(`   User ID: ${updateResult.id}`);
    console.log(`   Updated at: ${updateResult.updatedAt}\n`);

    // Verify the password works
    console.log('🧪 Testing password verification...');
    const testPassword = 'DanGoat90!';
    const isPasswordValid = await bcrypt.compare(testPassword, hashedPassword);
    
    if (isPasswordValid) {
      console.log('✅ Password verification successful!');
      console.log('   Dan can now login with password: DanGoat90!');
    } else {
      console.log('❌ Password verification failed!');
    }

    console.log('\n🎉 DAN\'S PASSWORD UPDATE COMPLETE');
    console.log('=====================================');
    console.log('Email: dan@adrata.com');
    console.log('Password: DanGoat90!');
    console.log('Status: Ready for login');

  } catch (error) {
    console.error('❌ Error updating Dan\'s password:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the script
updateDanPassword();
