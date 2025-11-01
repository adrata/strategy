/**
 * Reset Leonardo User Password
 * Resets the password for user "leonardo" with email leonardo@pinpoint-adrata.com
 */

const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: process.env.DATABASE_URL
    }
  }
});

async function resetLeonardoPassword() {
  try {
    console.log('🔐 Resetting Leonardo password...\n');

    // Find the Leonardo user
    const user = await prisma.users.findUnique({
      where: { email: 'leonardo@pinpoint-adrata.com' }
    });

    if (!user) {
      throw new Error('Leonardo user not found. Please create the user first.');
    }

    console.log(`✅ Found user: ${user.name} (${user.email})`);
    console.log(`   ID: ${user.id}\n`);

    // Generate a new secure password
    console.log('🔐 Generating new secure password...');
    const newPassword = crypto.randomBytes(16).toString('base64').slice(0, 20); // 20 character password
    const hashedPassword = await bcrypt.hash(newPassword, 12);

    // Update the password
    console.log('🔄 Updating password...');
    await prisma.users.update({
      where: { id: user.id },
      data: {
        password: hashedPassword,
        updatedAt: new Date()
      }
    });

    console.log('✅ Password reset successfully!\n');
    console.log('═══════════════════════════════════════');
    console.log('🔑 NEW PASSWORD FOR LEONARDO:');
    console.log('═══════════════════════════════════════');
    console.log(`   Username: leonardo`);
    console.log(`   Email: leonardo@pinpoint-adrata.com`);
    console.log(`   Password: ${newPassword}`);
    console.log('═══════════════════════════════════════\n');

    return newPassword;

  } catch (error) {
    console.error('❌ Error resetting password:', error);
    throw error;
  }
}

// Run the password reset with proper cleanup
(async () => {
  try {
    const password = await resetLeonardoPassword();
    console.log('✅ Password reset completed successfully');
  } catch (error) {
    console.error('❌ Password reset failed:', error);
    process.exitCode = 1;
  } finally {
    // Ensure proper cleanup with a small delay to allow all operations to complete
    try {
      await prisma.$disconnect();
      // Small delay to ensure all handles are properly closed
      await new Promise(resolve => setTimeout(resolve, 100));
    } catch (disconnectError) {
      console.error('⚠️ Error during disconnect:', disconnectError);
    }
    process.exit(process.exitCode || 0);
  }
})();

