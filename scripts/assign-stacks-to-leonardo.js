/**
 * Assign All Stacks to Leonardo
 * Assigns all unassigned stacks in Pinpoint workspace to Leonardo
 */

const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: process.env.DATABASE_URL
    }
  }
});

async function assignStacksToLeonardo() {
  try {
    console.log('🔍 Assigning stacks to Leonardo...\n');

    // Step 1: Find Leonardo user
    console.log('👤 Step 1: Finding Leonardo user...');
    const leonardo = await prisma.users.findUnique({
      where: { email: 'leonardo@pinpoint-adrata.com' }
    });

    if (!leonardo) {
      console.log('❌ Leonardo user not found!');
      return;
    }

    console.log(`✅ Found Leonardo:`);
    console.log(`   ID: ${leonardo.id}`);
    console.log(`   Name: ${leonardo.name}`);
    console.log(`   Email: ${leonardo.email}\n`);

    // Step 2: Find Pinpoint workspace
    console.log('🏢 Step 2: Finding Pinpoint workspace...');
    const pinpointWorkspace = await prisma.workspaces.findUnique({
      where: { slug: 'pinpoint' }
    });

    if (!pinpointWorkspace) {
      console.log('❌ Pinpoint workspace not found!');
      return;
    }

    console.log(`✅ Found Pinpoint workspace:`);
    console.log(`   ID: ${pinpointWorkspace.id}`);
    console.log(`   Name: ${pinpointWorkspace.name}\n`);

    // Step 3: Find all unassigned stories in Pinpoint workspace
    console.log('📚 Step 3: Finding unassigned stories in Pinpoint workspace...');
    const unassignedStories = await prisma.stacksStory.findMany({
      where: {
        assigneeId: null,
        project: {
          workspaceId: pinpointWorkspace.id
        }
      },
      select: {
        id: true,
        title: true,
        status: true,
        assigneeId: true
      }
    });

    console.log(`✅ Found ${unassignedStories.length} unassigned stories:\n`);
    if (unassignedStories.length > 0) {
      unassignedStories.forEach((story, index) => {
        console.log(`   ${index + 1}. ${story.title} (ID: ${story.id})`);
      });
      console.log('');

      // Step 4: Assign all stories to Leonardo
      console.log('📝 Step 4: Assigning all stories to Leonardo...');
      const updateResult = await prisma.stacksStory.updateMany({
        where: {
          assigneeId: null,
          project: {
            workspaceId: pinpointWorkspace.id
          }
        },
        data: {
          assigneeId: leonardo.id
        }
      });

      console.log(`✅ Successfully assigned ${updateResult.count} stories to Leonardo\n`);

      // Step 5: Verify assignment
      console.log('✅ Step 5: Verifying assignment...');
      const leonardoStories = await prisma.stacksStory.findMany({
        where: {
          assigneeId: leonardo.id,
          project: {
            workspaceId: pinpointWorkspace.id
          }
        },
        select: {
          id: true,
          title: true,
          status: true
        }
      });

      console.log(`✅ Verified: Leonardo now has ${leonardoStories.length} assigned stories`);
    } else {
      console.log('ℹ️  No unassigned stories found. All stories are already assigned.');
      
      // Check if Leonardo has any assigned stories
      const leonardoStories = await prisma.stacksStory.findMany({
        where: {
          assigneeId: leonardo.id,
          project: {
            workspaceId: pinpointWorkspace.id
          }
        }
      });
      
      if (leonardoStories.length > 0) {
        console.log(`✅ Leonardo already has ${leonardoStories.length} assigned stories`);
      }
    }

    // Summary
    console.log('\n' + '='.repeat(60));
    console.log('📊 SUMMARY');
    console.log('='.repeat(60));
    const totalStories = await prisma.stacksStory.count({
      where: {
        project: {
          workspaceId: pinpointWorkspace.id
        }
      }
    });
    const leonardoStoriesCount = await prisma.stacksStory.count({
      where: {
        assigneeId: leonardo.id,
        project: {
          workspaceId: pinpointWorkspace.id
        }
      }
    });
    console.log(`Total stories in Pinpoint workspace: ${totalStories}`);
    console.log(`Stories assigned to Leonardo: ${leonardoStoriesCount}`);
    console.log('='.repeat(60));

  } catch (error) {
    console.error('❌ Error assigning stacks to Leonardo:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Run the assignment
assignStacksToLeonardo()
  .then(() => {
    console.log('\n✅ Assignment complete');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Assignment failed:', error);
    process.exit(1);
  });

