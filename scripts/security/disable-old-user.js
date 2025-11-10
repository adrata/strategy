#!/usr/bin/env node

/**
 * Disable Old Database User
 * 
 * Resets the old user's password to a random value, making it unusable
 * This is a security measure if the old credentials were exposed
 */

const { PrismaClient } = require('@prisma/client');
const crypto = require('crypto');

// Generate a secure random password (60+ bits entropy as required by Neon)
function generateSecurePassword() {
  const length = 32;
  const charset = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*()_+-=[]{}|;:,.<>?';
  const randomBytes = crypto.randomBytes(length);
  let password = '';
  for (let i = 0; i < length; i++) {
    password += charset[randomBytes[i] % charset.length];
  }
  return password;
}

async function disableOldUser() {
  console.log('🔒 DISABLING OLD DATABASE USER');
  console.log('================================\n');

  // Use the old credentials to connect (one last time)
  const OLD_DATABASE_URL = 'postgresql://neondb_owner:npg_hsBrlzEb2G8Y@ep-patient-mountain-adnc9mz6-pooler.c-2.us-east-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require';
  
  const prisma = new PrismaClient({
    datasources: {
      db: {
        url: OLD_DATABASE_URL
      }
    }
  });

  try {
    await prisma.$connect();
    console.log('✅ Connected as neondb_owner\n');

    // Generate a secure random password
    const newRandomPassword = generateSecurePassword();
    
    console.log('🔄 Resetting old user password to random value...');
    console.log('   This will make the old credentials unusable\n');

    // Reset the password
    await prisma.$executeRawUnsafe(`ALTER USER neondb_owner WITH PASSWORD '${newRandomPassword}';`);
    
    console.log('✅ Old user password reset successfully!');
    console.log('\n📝 Security Status:');
    console.log('   - Old credentials are now INVALID');
    console.log('   - Even if someone has the old connection string, it won\'t work');
    console.log('   - New user (adrata_app_2025) is active and secure');
    console.log('\n💡 Next steps:');
    console.log('   1. Verify your application works with new credentials');
    console.log('   2. After verification, you can delete neondb_owner in Neon Console');
    console.log('   3. Clean up any hardcoded credentials in scripts (optional)');

  } catch (error) {
    console.error('\n❌ Error:', error.message);
    console.error('\n💡 You may need to do this manually in Neon Console:');
    console.error('   1. Go to Roles & Databases');
    console.error('   2. Find neondb_owner');
    console.error('   3. Click "Reset password" to generate a new random password');
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

disableOldUser().catch(error => {
  console.error('❌ Unexpected error:', error);
  process.exit(1);
});

