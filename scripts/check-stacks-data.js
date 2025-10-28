const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function checkStacksData() {
  try {
    console.log('🔍 Checking Stacks data...');
    
    // Check workspaces
    const workspaces = await prisma.workspaces.findMany({
      select: { id: true, name: true, slug: true }
    });
    console.log('📁 Workspaces:', workspaces);
    
    // Check StacksProject
    const projects = await prisma.stacksProject.findMany({
      include: {
        workspace: {
          select: { id: true, name: true, slug: true }
        }
      }
    });
    console.log('📋 StacksProjects:', projects);
    
    // Check StacksEpic
    const epics = await prisma.stacksEpic.findMany({
      include: {
        project: {
          select: { id: true, name: true }
        }
      }
    });
    console.log('🎯 StacksEpics:', epics);
    
    // Check StacksStory
    const stories = await prisma.stacksStory.findMany({
      include: {
        project: {
          select: { id: true, name: true }
        },
        epic: {
          select: { id: true, title: true }
        },
        assignee: {
          select: { id: true, firstName: true, lastName: true, email: true }
        }
      }
    });
    console.log('📝 StacksStories:', stories);
    
    // Check users
    const users = await prisma.users.findMany({
      select: { id: true, firstName: true, lastName: true, email: true }
    });
    console.log('👥 Users:', users);
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkStacksData();
