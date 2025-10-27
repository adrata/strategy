/**
 * Fix User Data
 * 
 * Audit and fix user information in the database
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function fixUserData() {
  console.log('🔍 Auditing and fixing user data...');

  try {
    // Get Notary Everyday workspace
    const notaryWorkspace = await prisma.workspaces.findFirst({
      where: { slug: 'notary-everyday' },
      include: {
        workspace_users: {
          include: {
            user: true
          }
        }
      }
    });

    if (!notaryWorkspace) {
      console.log('❌ Notary Everyday workspace not found');
      return;
    }

    console.log(`\n🏢 Found workspace: ${notaryWorkspace.name}`);
    console.log(`👥 Found ${notaryWorkspace.workspace_users.length} users`);

    // Check and fix each user
    for (const wu of notaryWorkspace.workspace_users) {
      const user = wu.user;
      console.log(`\n👤 Checking user: ${user.name} (${user.email})`);

      let needsUpdate = false;
      const updates: any = {};

      // Fix Ryan Hoffman
      if (user.email === 'ryan@notary-everyday.com') {
        console.log('   🔧 Fixing Ryan Hoffman email typo');
        updates.email = 'ryan@notaryeveryday.com';
        updates.name = 'Ryan';
        needsUpdate = true;
      }

      // Fix Just Dano to just "Dano"
      if (user.name === 'Just Dano') {
        console.log('   🔧 Fixing Dano name');
        updates.name = 'Dano';
        needsUpdate = true;
      }

      // Check Ryan Serrato
      if (user.name === 'Ryan Serrato' && user.email === 'ryan@notaryeveryday.com') {
        console.log('   ✅ Ryan Serrato looks correct');
      }

      // Check Noel Serrato
      if (user.name === 'Noel Serrato') {
        console.log('   ✅ Noel Serrato looks correct');
      }

      if (needsUpdate) {
        await prisma.users.update({
          where: { id: user.id },
          data: updates
        });
        console.log(`   ✅ Updated user: ${updates.name || user.name} (${updates.email || user.email})`);
      }
    }

    // Verify all expected users exist
    console.log('\n📋 Verifying all expected users exist:');
    const expectedUsers = [
      { name: 'Ryan', email: 'ryan@notaryeveryday.com' },
      { name: 'Ryan Serrato', email: 'ryan@notaryeveryday.com' },
      { name: 'Dano', email: 'dano@notaryeveryday.com' },
      { name: 'Noel Serrato', email: 'noel@notaryeveryday.com' }
    ];

    for (const expected of expectedUsers) {
      const user = await prisma.users.findFirst({
        where: {
          email: expected.email,
          workspace_users: {
            some: {
              workspaceId: notaryWorkspace.id,
              isActive: true
            }
          }
        }
      });

      if (user) {
        console.log(`   ✅ ${expected.name} (${expected.email}) - Found`);
      } else {
        console.log(`   ❌ ${expected.name} (${expected.email}) - Missing`);
      }
    }

    console.log('\n🎉 User data audit and fix completed!');

  } catch (error) {
    console.error('❌ Error fixing user data:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Run if called directly
if (require.main === module) {
  fixUserData()
    .then(() => {
      console.log('✅ Script completed successfully');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ Script failed:', error);
      process.exit(1);
    });
}

export { fixUserData };
