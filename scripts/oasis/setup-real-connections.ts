/**
 * Setup Real User Connections
 * 
 * Creates DMs and connections between real users in the database
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function setupRealConnections() {
  console.log('🌱 Setting up real user connections...');

  try {
    // Get all workspaces
    const workspaces = await prisma.workspaces.findMany({
      where: { isActive: true },
      include: {
        workspace_users: {
          include: {
            user: {
              select: { id: true, name: true, email: true, username: true }
            }
          }
        }
      }
    });

    console.log(`📊 Found ${workspaces.length} workspaces`);

    for (const workspace of workspaces) {
      console.log(`\n🏢 Processing workspace: ${workspace.name} (${workspace.slug})`);
      
      const users = workspace.workspace_users
        .filter(wu => wu.isActive)
        .map(wu => wu.user);

      console.log(`👥 Found ${users.length} users: ${users.map(u => u.name).join(', ')}`);

      // Create DMs between all users in the workspace
      for (let i = 0; i < users.length; i++) {
        for (let j = i + 1; j < users.length; j++) {
          const user1 = users[i];
          const user2 = users[j];

          // Check if DM already exists
          const existingDM = await prisma.oasisDirectMessage.findFirst({
            where: {
              workspaceId: workspace.id,
              participants: {
                every: {
                  userId: { in: [user1.id, user2.id] }
                }
              }
            },
            include: {
              participants: true
            }
          });

          if (!existingDM || existingDM.participants.length !== 2) {
            const dm = await prisma.oasisDirectMessage.create({
              data: {
                workspaceId: workspace.id
              }
            });

            // Add both users as participants
            await prisma.oasisDMParticipant.createMany({
              data: [
                { dmId: dm.id, userId: user1.id },
                { dmId: dm.id, userId: user2.id }
              ]
            });

            console.log(`💬 Created DM between ${user1.name} and ${user2.name}`);
          } else {
            console.log(`💬 DM already exists between ${user1.name} and ${user2.name}`);
          }
        }
      }

      // Create external connections between workspaces
      for (let i = 0; i < workspaces.length; i++) {
        for (let j = i + 1; j < workspaces.length; j++) {
          const workspace1 = workspaces[i];
          const workspace2 = workspaces[j];

          // Get users from each workspace
          const users1 = workspace1.workspace_users
            .filter(wu => wu.isActive)
            .map(wu => wu.user);
          const users2 = workspace2.workspace_users
            .filter(wu => wu.isActive)
            .map(wu => wu.user);

          // Create connections between users from different workspaces
          for (const user1 of users1) {
            for (const user2 of users2) {
              // Check if connection already exists
              const existingConnection = await prisma.oasisExternalConnection.findFirst({
                where: {
                  userId: user1.id,
                  externalUserId: user2.id,
                  externalWorkspaceId: workspace2.id
                }
              });

              if (!existingConnection) {
                // Create connection from user1 to user2
                await prisma.oasisExternalConnection.create({
                  data: {
                    userId: user1.id,
                    externalUserId: user2.id,
                    externalWorkspaceId: workspace2.id,
                    status: 'accepted'
                  }
                });

                // Create reverse connection from user2 to user1
                await prisma.oasisExternalConnection.create({
                  data: {
                    userId: user2.id,
                    externalUserId: user1.id,
                    externalWorkspaceId: workspace1.id,
                    status: 'accepted'
                  }
                });

                console.log(`🔗 Created external connection between ${user1.name} (${workspace1.name}) and ${user2.name} (${workspace2.name})`);
              }
            }
          }
        }
      }
    }

    console.log('\n🎉 Successfully set up real user connections!');

  } catch (error) {
    console.error('❌ Error setting up connections:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Run if called directly
if (require.main === module) {
  setupRealConnections()
    .then(() => {
      console.log('✅ Script completed successfully');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ Script failed:', error);
      process.exit(1);
    });
}

export { setupRealConnections };
