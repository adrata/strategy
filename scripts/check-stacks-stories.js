const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function checkStacksStories() {
  try {
    console.log('🔍 Checking Stacks stories in database...\n');

    // Check workspaces
    const workspaces = await prisma.workspaces.findMany({
      select: {
        id: true,
        name: true,
        slug: true
      }
    });
    
    console.log('📋 Workspaces:');
    workspaces.forEach(ws => {
      console.log(`  - ${ws.name} (${ws.slug}): ${ws.id}`);
    });
    console.log('');

    // Check Stacks projects
    const projects = await prisma.stacksProject.findMany({
      include: {
        workspace: {
          select: {
            id: true,
            name: true,
            slug: true
          }
        }
      }
    });
    
    console.log('📋 Stacks Projects:');
    projects.forEach(project => {
      console.log(`  - ${project.name} (${project.category})`);
      console.log(`    Workspace: ${project.workspace.name} (${project.workspace.slug})`);
      console.log(`    ID: ${project.id}`);
      console.log('');
    });

    // Check Stacks epics
    const epics = await prisma.stacksEpic.findMany({
      include: {
        project: {
          include: {
            workspace: {
              select: {
                id: true,
                name: true,
                slug: true
              }
            }
          }
        }
      }
    });
    
    console.log('📋 Stacks Epics:');
    epics.forEach(epic => {
      console.log(`  - ${epic.title}`);
      console.log(`    Project: ${epic.project.name}`);
      console.log(`    Workspace: ${epic.project.workspace.name} (${epic.project.workspace.slug})`);
      console.log(`    ID: ${epic.id}`);
      console.log('');
    });

    // Check Stacks stories
    const stories = await prisma.stacksStory.findMany({
      include: {
        epic: {
          select: {
            id: true,
            title: true
          }
        },
        assignee: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true
          }
        },
        project: {
          include: {
            workspace: {
              select: {
                id: true,
                name: true,
                slug: true
              }
            }
          }
        }
      }
    });
    
    console.log('📋 Stacks Stories:');
    console.log(`Total stories: ${stories.length}\n`);
    
    stories.forEach((story, index) => {
      console.log(`${index + 1}. ${story.title}`);
      console.log(`   Status: ${story.status}`);
      console.log(`   Priority: ${story.priority}`);
      console.log(`   Assignee: ${story.assignee ? `${story.assignee.firstName} ${story.assignee.lastName} (${story.assignee.email})` : 'None'}`);
      console.log(`   Epic: ${story.epic ? story.epic.title : 'None'}`);
      console.log(`   Project: ${story.project.name}`);
      console.log(`   Workspace: ${story.project.workspace.name} (${story.project.workspace.slug})`);
      console.log(`   Created: ${story.createdAt}`);
      console.log(`   Updated: ${story.updatedAt}`);
      console.log('');
    });

    // Check specifically for Notary Everyday stories
    const neWorkspace = workspaces.find(ws => ws.slug === 'ne' || ws.name === 'Notary Everyday');
    if (neWorkspace) {
      console.log(`🎯 Notary Everyday workspace found: ${neWorkspace.name} (${neWorkspace.id})`);
      
      const neStories = stories.filter(story => story.project.workspace.id === neWorkspace.id);
      console.log(`📊 Stories in Notary Everyday workspace: ${neStories.length}`);
      
      if (neStories.length > 0) {
        console.log('\n📋 Notary Everyday Stories:');
        neStories.forEach((story, index) => {
          console.log(`${index + 1}. ${story.title} (${story.status})`);
        });
      }
    } else {
      console.log('❌ Notary Everyday workspace not found');
    }

  } catch (error) {
    console.error('❌ Error checking stories:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkStacksStories();
