/**
 * Create Adrata AI User
 * 
 * Creates the Adrata AI user and adds them to all workspaces
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function createAdrataAIUser() {
  console.log('🤖 Creating Adrata AI user...');

  try {
    // Check if Adrata AI user already exists
    let adrataAI = await prisma.users.findFirst({
      where: { email: 'ai@adrata.com' }
    });

    if (!adrataAI) {
      // Create Adrata AI user
      adrataAI = await prisma.users.create({
        data: {
          name: 'Adrata',
          email: 'ai@adrata.com',
          username: 'adrata-ai',
          isActive: true,
        }
      });
      console.log('✅ Created Adrata AI user');
    } else {
      console.log('✅ Adrata AI user already exists');
    }

    // Get all active workspaces
    const workspaces = await prisma.workspaces.findMany({
      where: { isActive: true },
      include: {
        workspace_users: {
          where: { userId: adrataAI.id }
        }
      }
    });

    console.log(`📊 Found ${workspaces.length} active workspaces`);

    // Add Adrata AI to all workspaces
    for (const workspace of workspaces) {
      if (workspace.workspace_users.length === 0) {
        await prisma.workspace_users.create({
          data: {
            workspaceId: workspace.id,
            userId: adrataAI.id,
            isActive: true,
            role: 'SELLER' // Use valid UserRole enum value
          }
        });
        console.log(`   ✅ Added Adrata AI to ${workspace.name}`);
      } else {
        console.log(`   ⏭️ Adrata AI already in ${workspace.name}`);
      }
    }

    console.log('\n🎉 Adrata AI user setup completed!');

  } catch (error) {
    console.error('❌ Error creating Adrata AI user:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Run if called directly
if (require.main === module) {
  createAdrataAIUser()
    .then(() => {
      console.log('✅ Script completed successfully');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ Script failed:', error);
      process.exit(1);
    });
}

export { createAdrataAIUser };
