/**
 * Check Leonardo's stacks
 * Diagnoses why stacks might be missing for Leonardo
 */

const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: process.env.DATABASE_URL
    }
  }
});

async function checkLeonardoStacks() {
  try {
    console.log('🔍 Checking Leonardo\'s stacks...\n');

    // Step 1: Find Leonardo user
    console.log('👤 Step 1: Finding Leonardo user...');
    const leonardo = await prisma.users.findUnique({
      where: { email: 'leonardo@pinpoint-adrata.com' },
      include: {
        workspace_users: {
          include: {
            workspace: true
          }
        }
      }
    });

    if (!leonardo) {
      console.log('❌ Leonardo user not found!');
      return;
    }

    console.log(`✅ Found Leonardo:`);
    console.log(`   ID: ${leonardo.id}`);
    console.log(`   Name: ${leonardo.name}`);
    console.log(`   Email: ${leonardo.email}`);
    console.log(`   Active Workspace ID: ${leonardo.activeWorkspaceId}\n`);

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
    console.log(`   Name: ${pinpointWorkspace.name}`);
    console.log(`   Slug: ${pinpointWorkspace.slug}\n`);

    // Step 3: Check if Leonardo has workspace membership
    console.log('🔗 Step 3: Checking workspace membership...');
    const membership = await prisma.workspace_users.findFirst({
      where: {
        userId: leonardo.id,
        workspaceId: pinpointWorkspace.id
      }
    });

    if (!membership) {
      console.log('⚠️  Leonardo is NOT a member of Pinpoint workspace!');
    } else {
      console.log(`✅ Leonardo is a member of Pinpoint workspace (role: ${membership.role})\n`);
    }

    // Step 4: Find all projects in Pinpoint workspace
    console.log('📦 Step 4: Finding projects in Pinpoint workspace...');
    const projects = await prisma.stacksProject.findMany({
      where: { workspaceId: pinpointWorkspace.id }
    });

    console.log(`✅ Found ${projects.length} project(s) in Pinpoint workspace:`);
    projects.forEach(project => {
      console.log(`   - ${project.name} (ID: ${project.id})`);
    });
    console.log('');

    // Step 5: Find all stories in Pinpoint workspace
    console.log('📚 Step 5: Finding ALL stories in Pinpoint workspace...');
    const allStories = await prisma.stacksStory.findMany({
      where: {
        project: {
          workspaceId: pinpointWorkspace.id
        }
      },
      select: {
        id: true,
        title: true,
        description: true,
        status: true,
        priority: true,
        createdAt: true,
        updatedAt: true,
        assigneeId: true,
        projectId: true,
        epicId: true,
        project: {
          select: { id: true, name: true }
        },
        assignee: {
          select: { id: true, name: true, email: true }
        },
        epic: {
          select: { id: true, title: true }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    console.log(`✅ Found ${allStories.length} total story/stacks in Pinpoint workspace:`);
    if (allStories.length > 0) {
      allStories.forEach((story, index) => {
        console.log(`\n   Story ${index + 1}:`);
        console.log(`     ID: ${story.id}`);
        console.log(`     Title: ${story.title}`);
        console.log(`     Status: ${story.status}`);
        console.log(`     Priority: ${story.priority}`);
        console.log(`     Project: ${story.project?.name || 'N/A'}`);
        console.log(`     Assignee: ${story.assignee ? `${story.assignee.name} (${story.assignee.email})` : 'Unassigned'}`);
        console.log(`     Epic: ${story.epic?.title || 'No epic'}`);
        console.log(`     Created: ${story.createdAt}`);
        console.log(`     Updated: ${story.updatedAt}`);
      });
    } else {
      console.log('   ⚠️  No stories found in workspace!');
    }
    console.log('');

    // Step 6: Find stories assigned to Leonardo
    console.log('👤 Step 6: Finding stories assigned to Leonardo...');
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
        description: true,
        status: true,
        priority: true,
        createdAt: true,
        updatedAt: true,
        assigneeId: true,
        projectId: true,
        epicId: true,
        project: {
          select: { id: true, name: true }
        },
        epic: {
          select: { id: true, title: true }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    console.log(`✅ Found ${leonardoStories.length} story/stacks assigned to Leonardo:`);
    if (leonardoStories.length > 0) {
      leonardoStories.forEach((story, index) => {
        console.log(`\n   Story ${index + 1}:`);
        console.log(`     ID: ${story.id}`);
        console.log(`     Title: ${story.title}`);
        console.log(`     Status: ${story.status}`);
        console.log(`     Priority: ${story.priority}`);
        console.log(`     Project: ${story.project?.name || 'N/A'}`);
        console.log(`     Epic: ${story.epic?.title || 'No epic'}`);
        console.log(`     Created: ${story.createdAt}`);
        console.log(`     Updated: ${story.updatedAt}`);
      });
    } else {
      console.log('   ⚠️  No stories assigned to Leonardo in Pinpoint workspace!');
    }
    console.log('');

    // Step 7: Check what workspace ID the frontend is using
    console.log('🔍 Step 7: Checking workspace context...');
    console.log(`   Leonardo's activeWorkspaceId: ${leonardo.activeWorkspaceId}`);
    console.log(`   Pinpoint workspace ID: ${pinpointWorkspace.id}`);
    if (leonardo.activeWorkspaceId !== pinpointWorkspace.id) {
      console.log(`   ⚠️  MISMATCH! Leonardo's active workspace doesn't match Pinpoint workspace!`);
    } else {
      console.log(`   ✅ Leonardo's active workspace matches Pinpoint workspace`);
    }
    console.log('');

    // Summary
    console.log('='.repeat(60));
    console.log('📊 SUMMARY');
    console.log('='.repeat(60));
    console.log(`Total stories in Pinpoint workspace: ${allStories.length}`);
    console.log(`Stories assigned to Leonardo: ${leonardoStories.length}`);
    console.log(`Workspace ID mismatch: ${leonardo.activeWorkspaceId !== pinpointWorkspace.id ? 'YES ⚠️' : 'NO ✅'}`);
    console.log('='.repeat(60));

  } catch (error) {
    console.error('❌ Error checking Leonardo\'s stacks:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Run the check
checkLeonardoStacks()
  .then(() => {
    console.log('\n✅ Diagnostic complete');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Diagnostic failed:', error);
    process.exit(1);
  });

