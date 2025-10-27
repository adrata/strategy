/**
 * Seed Welcome Messages
 * 
 * Add welcome messages from Adrata AI to all channels and create DMs
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const WELCOME_MESSAGES = {
  general: "Welcome to #general! This is where we share updates and announcements.",
  sell: "Welcome to #sell! Share your wins, strategies, and best practices here.",
  build: "Welcome to #build! Let's collaborate on product and engineering discussions.",
  random: "Welcome to #random! Share memes, random thoughts, and anything off-topic here.",
  wins: "Welcome to #wins! Celebrate your victories and successes here!"
};

async function seedWelcomeMessages() {
  console.log('💬 Seeding welcome messages from Adrata AI...');

  try {
    // Get Adrata AI user
    const adrataAI = await prisma.users.findFirst({
      where: { email: 'ai@adrata.com' }
    });

    if (!adrataAI) {
      console.log('❌ Adrata AI user not found. Run create-adrata-ai-user.ts first.');
      return;
    }

    console.log(`🤖 Found Adrata AI user: ${adrataAI.name}`);

    // Get all active workspaces
    const workspaces = await prisma.workspaces.findMany({
      where: { isActive: true },
      include: {
        oasis_channels: {
          where: {
            name: {
              in: Object.keys(WELCOME_MESSAGES)
            }
          }
        },
        workspace_users: {
          where: {
            userId: { not: adrataAI.id }, // Exclude Adrata AI
            isActive: true
          },
          include: {
            user: true
          }
        }
      }
    });

    console.log(`📊 Found ${workspaces.length} active workspaces`);

    for (const workspace of workspaces) {
      console.log(`\n🏢 Processing workspace: ${workspace.name}`);

      // Add welcome messages to channels
      for (const channel of workspace.oasis_channels) {
        const welcomeMessage = WELCOME_MESSAGES[channel.name as keyof typeof WELCOME_MESSAGES];
        
        if (welcomeMessage) {
          // Check if welcome message already exists
          const existingMessage = await prisma.oasisMessage.findFirst({
            where: {
              channelId: channel.id,
              senderId: adrataAI.id,
              content: welcomeMessage
            }
          });

          if (!existingMessage) {
            await prisma.oasisMessage.create({
              data: {
                content: welcomeMessage,
                channelId: channel.id,
                senderId: adrataAI.id,
              }
            });
            console.log(`   ✅ Added welcome message to #${channel.name}`);
          } else {
            console.log(`   ⏭️ Welcome message already exists in #${channel.name}`);
          }
        }
      }

      // Create DMs with Adrata AI for each workspace user
      for (const workspaceUser of workspace.workspace_users) {
        const user = workspaceUser.user;
        
        // Check if DM already exists
        const existingDM = await prisma.oasisDirectMessage.findFirst({
          where: {
            workspaceId: workspace.id,
            participants: {
              every: {
                userId: {
                  in: [adrataAI.id, user.id]
                }
              }
            }
          },
          include: {
            participants: true
          }
        });

        if (!existingDM) {
          // Create DM
          const newDM = await prisma.oasisDirectMessage.create({
            data: {
              workspaceId: workspace.id,
              participants: {
                create: [
                  { userId: adrataAI.id },
                  { userId: user.id }
                ]
              }
            }
          });

          // Add welcome message
          await prisma.oasisMessage.create({
            data: {
              content: `Hi ${user.name}! I'm Adrata, your AI assistant. Message me anytime you need help.`,
              dmId: newDM.id,
              senderId: adrataAI.id,
            }
          });

          console.log(`   ✅ Created DM with ${user.name} and added welcome message`);
        } else {
          // Check if welcome message exists
          const existingWelcomeMessage = await prisma.oasisMessage.findFirst({
            where: {
              dmId: existingDM.id,
              senderId: adrataAI.id,
              content: {
                contains: "Hi"
              }
            }
          });

          if (!existingWelcomeMessage) {
            await prisma.oasisMessage.create({
              data: {
                content: `Hi ${user.name}! I'm Adrata, your AI assistant. Message me anytime you need help.`,
                dmId: existingDM.id,
                senderId: adrataAI.id,
              }
            });
            console.log(`   ✅ Added welcome message to DM with ${user.name}`);
          } else {
            console.log(`   ⏭️ Welcome message already exists in DM with ${user.name}`);
          }
        }
      }
    }

    console.log('\n🎉 Welcome messages seeding completed!');

  } catch (error) {
    console.error('❌ Error seeding welcome messages:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Run if called directly
if (require.main === module) {
  seedWelcomeMessages()
    .then(() => {
      console.log('✅ Script completed successfully');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ Script failed:', error);
      process.exit(1);
    });
}

export { seedWelcomeMessages };
