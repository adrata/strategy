const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function diagnoseStacksWorkspace() {
  try {
    console.log('🔍 Diagnosing Stacks Workspace Issues...\n');

    // Get all workspaces
    const workspaces = await prisma.workspaces.findMany({
      select: { id: true, name: true, slug: true }
    });
    console.log('📁 Workspaces:');
    workspaces.forEach(ws => {
      console.log(`  - ${ws.name} (${ws.slug}): ${ws.id}`);
    });
    console.log('');

    // Get all projects with their workspace
    const projects = await prisma.stacksProject.findMany({
      include: {
        workspace: {
          select: { id: true, name: true, slug: true }
        },
        _count: {
          select: {
            stories: true,
            epics: true,
            tasks: true
          }
        }
      }
    });
    console.log('📋 Stacks Projects:');
    projects.forEach(project => {
      console.log(`  - ${project.name} (ID: ${project.id})`);
      console.log(`    Workspace: ${project.workspace.name} (${project.workspace.slug}) - ${project.workspace.id}`);
      console.log(`    Stories: ${project._count.stories}, Epics: ${project._count.epics}, Tasks: ${project._count.tasks}`);
    });
    console.log('');

    // Get all stories with their project and workspace info
    const stories = await prisma.stacksStory.findMany({
      include: {
        project: {
          include: {
            workspace: {
              select: { id: true, name: true, slug: true }
            }
          }
        },
        epic: {
          select: { id: true, title: true }
        },
        assignee: {
          select: { id: true, firstName: true, lastName: true, email: true }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    console.log('📝 Stacks Stories (Total:', stories.length, '):');
    if (stories.length === 0) {
      console.log('  ⚠️  No stories found in database');
    } else {
      stories.forEach((story, index) => {
        console.log(`\n  ${index + 1}. ${story.title}`);
        console.log(`     ID: ${story.id}`);
        console.log(`     Status: ${story.status}`);
        console.log(`     Priority: ${story.priority}`);
        console.log(`     Project: ${story.project.name} (${story.project.id})`);
        console.log(`     Workspace: ${story.project.workspace.name} (${story.project.workspace.slug}) - ${story.project.workspace.id}`);
        console.log(`     Epic: ${story.epic ? story.epic.title : 'None'}`);
        console.log(`     Assignee: ${story.assignee ? `${story.assignee.firstName} ${story.assignee.lastName}` : 'None'}`);
        console.log(`     Created: ${story.createdAt}`);
        console.log(`     Updated: ${story.updatedAt}`);
      });
    }
    console.log('');

    // Group stories by workspace
    const storiesByWorkspace = {};
    stories.forEach(story => {
      const workspaceId = story.project.workspace.id;
      if (!storiesByWorkspace[workspaceId]) {
        storiesByWorkspace[workspaceId] = {
          workspace: story.project.workspace,
          stories: []
        };
      }
      storiesByWorkspace[workspaceId].stories.push(story);
    });

    console.log('📊 Stories by Workspace:');
    Object.values(storiesByWorkspace).forEach(({ workspace, stories }) => {
      console.log(`  ${workspace.name} (${workspace.slug}): ${stories.length} stories`);
    });
    console.log('');

    // Check for potential issues
    console.log('🔍 Checking for Issues:');
    
    // Check for orphaned stories (stories without valid project)
    const orphanedStories = stories.filter(s => !s.project);
    if (orphanedStories.length > 0) {
      console.log(`  ⚠️  Found ${orphanedStories.length} orphaned stories (no project)`);
    }

    // Check for stories with mismatched workspace-project relationships
    const mismatchedStories = stories.filter(s => {
      if (!s.project) return false;
      // This should not happen due to foreign key constraints, but check anyway
      return s.project.workspaceId !== s.project.workspace.id;
    });
    if (mismatchedStories.length > 0) {
      console.log(`  ⚠️  Found ${mismatchedStories.length} stories with workspace-project mismatch`);
    }

    // Check for projects without workspace
    const orphanedProjects = projects.filter(p => !p.workspace);
    if (orphanedProjects.length > 0) {
      console.log(`  ⚠️  Found ${orphanedProjects.length} orphaned projects (no workspace)`);
    }

    if (orphanedStories.length === 0 && mismatchedStories.length === 0 && orphanedProjects.length === 0) {
      console.log('  ✅ No data integrity issues found');
    }

    console.log('');

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

diagnoseStacksWorkspace();

