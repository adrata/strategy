const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

(async () => {
  try {
    console.log('🔧 Assigning Ross Sylvester to all Adrata workspace stacks...');
    console.log('');

    // Find Adrata workspace
    const adrataWorkspace = await prisma.workspaces.findFirst({
      where: {
        OR: [
          { name: 'Adrata' },
          { slug: 'adrata' },
          { id: '01K7464TNANHQXPCZT1FYX205V' }
        ]
      }
    });

    if (!adrataWorkspace) {
      console.log('❌ Adrata workspace not found');
      process.exit(1);
    }

    console.log('✅ Found workspace:', adrataWorkspace.name);
    console.log('   ID:', adrataWorkspace.id);
    console.log('   Slug:', adrataWorkspace.slug);
    console.log('');

    // Find Ross Sylvester
    const rossUser = await prisma.users.findFirst({
      where: { email: 'ross@adrata.com' }
    });

    if (!rossUser) {
      console.log('❌ Ross Sylvester user not found');
      process.exit(1);
    }

    console.log('✅ Found user:');
    console.log('   Name:', rossUser.name);
    console.log('   Email:', rossUser.email);
    console.log('   User ID:', rossUser.id);
    console.log('');

    // Find all projects in Adrata workspace
    const projects = await prisma.stacksProject.findMany({
      where: { workspaceId: adrataWorkspace.id },
      select: { id: true, name: true }
    });

    console.log(`📋 Found ${projects.length} project(s) in Adrata workspace`);
    const projectIds = projects.map(p => p.id);

    if (projectIds.length === 0) {
      console.log('⚠️  No projects found, no stacks to update');
      process.exit(0);
    }

    // Find all stacks in these projects
    const allStacks = await prisma.stacksStory.findMany({
      where: { projectId: { in: projectIds } },
      select: { id: true, title: true, assigneeId: true }
    });

    console.log(`📊 Found ${allStacks.length} stack(s) in Adrata workspace`);
    console.log('');

    // Update all stacks to assign Ross
    const updateResult = await prisma.stacksStory.updateMany({
      where: { projectId: { in: projectIds } },
      data: { assigneeId: rossUser.id }
    });

    console.log(`✅ Successfully assigned Ross to ${updateResult.count} stack(s)`);
    console.log('');

    // Verify
    const updatedStacks = await prisma.stacksStory.findMany({
      where: { 
        projectId: { in: projectIds },
        assigneeId: rossUser.id
      }
    });

    console.log(`✅ Verification: ${updatedStacks.length} stack(s) now assigned to Ross Sylvester`);

  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
})();

