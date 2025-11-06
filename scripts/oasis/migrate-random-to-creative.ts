/**
 * Migrate Random to Creative Channel
 * 
 * Renames all existing "random" channels to "creative" in the database.
 * This migration should be run after the code change from "random" to "creative".
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function migrateRandomToCreative() {
  console.log('🔄 Migrating "random" channels to "creative"...\n');

  try {
    // Find all channels named "random"
    const randomChannels = await prisma.oasisChannel.findMany({
      where: { name: 'random' },
      include: {
        workspace: {
          select: { id: true, name: true, slug: true }
        }
      }
    });

    if (randomChannels.length === 0) {
      console.log('✅ No "random" channels found. Migration not needed.');
      return;
    }

    console.log(`📊 Found ${randomChannels.length} "random" channel(s) to migrate:\n`);

    for (const channel of randomChannels) {
      const workspace = channel.workspace;
      console.log(`   - Workspace: ${workspace.name} (${workspace.slug})`);
      console.log(`     Channel ID: ${channel.id}`);
      console.log(`     Current name: ${channel.name}`);

      // Check if "creative" channel already exists in this workspace
      const existingCreativeChannel = await prisma.oasisChannel.findFirst({
        where: {
          workspaceId: channel.workspaceId,
          name: 'creative'
        }
      });

      if (existingCreativeChannel) {
        console.log(`     ⚠️  "creative" channel already exists in this workspace.`);
        console.log(`     📋 Options:`);
        console.log(`        1. Delete the "random" channel (recommended if empty)`);
        console.log(`        2. Merge messages from "random" to "creative" (if needed)`);
        console.log(`        3. Keep both channels`);
        
        // For now, we'll just delete the random channel if it has no messages
        const messageCount = await prisma.oasisMessage.count({
          where: { channelId: channel.id }
        });

        if (messageCount === 0) {
          console.log(`     🗑️  Deleting empty "random" channel...`);
          await prisma.oasisChannel.delete({
            where: { id: channel.id }
          });
          console.log(`     ✅ Deleted empty "random" channel`);
        } else {
          console.log(`     ⚠️  "random" channel has ${messageCount} message(s). Manual review needed.`);
          console.log(`     💡 Consider manually merging messages or archiving the channel.`);
        }
      } else {
        // Rename "random" to "creative"
        console.log(`     🔄 Renaming "random" to "creative"...`);
        await prisma.oasisChannel.update({
          where: { id: channel.id },
          data: { name: 'creative' }
        });
        console.log(`     ✅ Successfully renamed to "creative"`);
      }
      console.log('');
    }

    console.log('🎉 Migration completed!');

  } catch (error) {
    console.error('❌ Error during migration:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Run if called directly
if (require.main === module) {
  migrateRandomToCreative()
    .then(() => {
      console.log('✅ Script completed successfully');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ Script failed:', error);
      process.exit(1);
    });
}

export { migrateRandomToCreative };

