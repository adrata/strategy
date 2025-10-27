/**
 * Seed Test Users and Connections
 * 
 * Creates test users (Dan, Todd, Ryan) and sets up connections for Ross
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function seedTestUsers() {
  console.log('🌱 Seeding test users and connections...');

  try {
    // Find Ross Sylvester (assuming he's the main user)
    const ross = await prisma.users.findFirst({
      where: { name: { contains: 'Ross' } },
      include: { workspaces: true }
    });

    if (!ross) {
      console.log('❌ Ross user not found');
      return;
    }

    console.log(`👤 Found Ross: ${ross.name} (${ross.email})`);

    // Find the Adrata workspace
    const adrataWorkspace = await prisma.workspaces.findFirst({
      where: { slug: 'adrata' }
    });

    if (!adrataWorkspace) {
      console.log('❌ Adrata workspace not found');
      return;
    }

    console.log(`🏢 Found workspace: ${adratWorkspace.name}`);

    // Create test users in the Adrata workspace
    const testUsers = [
      { name: 'Dan Wilson', email: 'dan@adrata.com', username: 'dan-wilson' },
      { name: 'Todd Johnson', email: 'todd@adrata.com', username: 'todd-johnson' },
      { name: 'Ryan Hoffman', email: 'ryan@notary-everyday.com', username: 'ryan-hoffman' }
    ];

    for (const userData of testUsers) {
      // Check if user already exists
      let user = await prisma.users.findFirst({
        where: { email: userData.email }
      });

      if (!user) {
        user = await prisma.users.create({
          data: {
            name: userData.name,
            email: userData.email,
            username: userData.username,
            activeWorkspaceId: adrataWorkspace.id
          }
        });
        console.log(`✅ Created user: ${userData.name}`);
      } else {
        console.log(`👤 User already exists: ${userData.name}`);
      }

      // Add user to Adrata workspace if not already a member
      const existingMembership = await prisma.workspace_users.findFirst({
        where: {
          workspaceId: adrataWorkspace.id,
          userId: user.id
        }
      });

      if (!existingMembership) {
        await prisma.workspace_users.create({
          data: {
            workspaceId: adrataWorkspace.id,
            userId: user.id,
            role: 'VIEWER',
            isActive: true
          }
        });
        console.log(`👥 Added ${userData.name} to Adrata workspace`);
      }

      // Create DM conversations between Ross and each user
      const existingDM = await prisma.oasisDirectMessage.findFirst({
        where: {
          workspaceId: adrataWorkspace.id,
          participants: {
            some: { userId: ross.id }
          }
        },
        include: {
          participants: {
            where: { userId: user.id }
          }
        }
      });

      if (!existingDM || existingDM.participants.length === 0) {
        const dm = await prisma.oasisDirectMessage.create({
          data: {
            workspaceId: adrataWorkspace.id
          }
        });

        // Add both users as participants
        await prisma.oasisDMParticipant.createMany({
          data: [
            { dmId: dm.id, userId: ross.id },
            { dmId: dm.id, userId: user.id }
          ]
        });

        console.log(`💬 Created DM between Ross and ${userData.name}`);
      }
    }

    // Create external connection for Ryan (he's in notary-everyday workspace)
    const notaryWorkspace = await prisma.workspaces.findFirst({
      where: { slug: 'notary-everyday' }
    });

    if (notaryWorkspace) {
      const ryan = await prisma.users.findFirst({
        where: { email: 'ryan@notary-everyday.com' }
      });

      if (ryan) {
        // Create external connection
        const existingConnection = await prisma.oasisExternalConnection.findFirst({
          where: {
            userId: ross.id,
            externalUserId: ryan.id,
            externalWorkspaceId: notaryWorkspace.id
          }
        });

        if (!existingConnection) {
          await prisma.oasisExternalConnection.create({
            data: {
              userId: ross.id,
              externalUserId: ryan.id,
              externalWorkspaceId: notaryWorkspace.id,
              status: 'accepted'
            }
          });

          // Create reverse connection
          await prisma.oasisExternalConnection.create({
            data: {
              userId: ryan.id,
              externalUserId: ross.id,
              externalWorkspaceId: adrataWorkspace.id,
              status: 'accepted'
            }
          });

          console.log(`🔗 Created external connection between Ross and Ryan`);
        }
      }
    }

    console.log('🎉 Successfully seeded test users and connections!');

  } catch (error) {
    console.error('❌ Error seeding test users:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Run if called directly
if (require.main === module) {
  seedTestUsers()
    .then(() => {
      console.log('✅ Script completed successfully');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ Script failed:', error);
      process.exit(1);
    });
}

export { seedTestUsers };
