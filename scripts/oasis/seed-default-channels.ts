/**
 * Seed Default Oasis Channels
 * 
 * Creates the default channels (general, build, sell, wins) for all existing workspaces
 * and sets up auto-creation for new workspaces.
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const DEFAULT_CHANNELS = [
  { name: 'general', description: 'General discussion and announcements' },
  { name: 'sell', description: 'Sales strategies and customer conversations' },
  { name: 'build', description: 'Product development and engineering discussions' },
  { name: 'random', description: 'Random thoughts, memes, and off-topic discussions' },
  { name: 'wins', description: 'Celebrate victories and success stories' }
];

async function seedDefaultChannels() {
  console.log('🌱 Seeding default Oasis channels...');

  try {
    // Get all active workspaces
    const workspaces = await prisma.workspaces.findMany({
      where: { isActive: true },
      select: { id: true, name: true, slug: true }
    });

    console.log(`📊 Found ${workspaces.length} active workspaces`);

    for (const workspace of workspaces) {
      console.log(`\n🏢 Processing workspace: ${workspace.name} (${workspace.slug})`);

      // Check if channels already exist
      const existingChannels = await prisma.oasisChannel.findMany({
        where: { workspaceId: workspace.id },
        select: { name: true }
      });

      const existingChannelNames = existingChannels.map(c => c.name);
      const channelsToCreate = DEFAULT_CHANNELS.filter(
        channel => !existingChannelNames.includes(channel.name)
      );

      if (channelsToCreate.length === 0) {
        console.log(`   ✅ All default channels already exist`);
        continue;
      }

      // Create missing channels
      for (const channel of channelsToCreate) {
        const createdChannel = await prisma.oasisChannel.create({
          data: {
            workspaceId: workspace.id,
            name: channel.name,
            description: channel.description
          }
        });

        console.log(`   ✅ Created channel: #${channel.name}`);

        // Add all workspace members to the channel
        const workspaceMembers = await prisma.workspace_users.findMany({
          where: { 
            workspaceId: workspace.id,
            isActive: true 
          },
          select: { userId: true }
        });

        for (const member of workspaceMembers) {
          await prisma.oasisChannelMember.create({
            data: {
              channelId: createdChannel.id,
              userId: member.userId
            }
          });
        }

        console.log(`   👥 Added ${workspaceMembers.length} members to #${channel.name}`);
      }
    }

    console.log('\n🎉 Successfully seeded default channels for all workspaces!');

  } catch (error) {
    console.error('❌ Error seeding default channels:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Run if called directly
if (require.main === module) {
  seedDefaultChannels()
    .then(() => {
      console.log('✅ Script completed successfully');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ Script failed:', error);
      process.exit(1);
    });
}

export { seedDefaultChannels };
