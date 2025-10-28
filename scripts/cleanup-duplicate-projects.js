const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function cleanupDuplicateProjects() {
  try {
    console.log('🧹 Cleaning up duplicate projects...');
    
    // Find all projects for Notary Everyday workspace
    const projects = await prisma.stacksProject.findMany({
      where: {
        workspaceId: '01K7DNYR5VZ7JY36KGKKN76XZ1'
      },
      include: {
        stories: true,
        epics: true
      }
    });
    
    console.log(`📋 Found ${projects.length} projects`);
    
    if (projects.length > 1) {
      // Keep the first project (oldest) and delete the rest
      const [keepProject, ...duplicateProjects] = projects.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
      
      console.log(`✅ Keeping project: ${keepProject.id} (${keepProject.name})`);
      
      for (const duplicate of duplicateProjects) {
        console.log(`🗑️ Deleting duplicate project: ${duplicate.id} (${duplicate.name})`);
        
        // Delete all stories for this project
        await prisma.stacksStory.deleteMany({
          where: { projectId: duplicate.id }
        });
        
        // Delete all epics for this project
        await prisma.stacksEpic.deleteMany({
          where: { projectId: duplicate.id }
        });
        
        // Delete the project
        await prisma.stacksProject.delete({
          where: { id: duplicate.id }
        });
      }
    }
    
    // Verify cleanup
    const remainingProjects = await prisma.stacksProject.findMany({
      where: {
        workspaceId: '01K7DNYR5VZ7JY36KGKKN76XZ1'
      },
      include: {
        stories: true,
        epics: true
      }
    });
    
    console.log(`✅ Cleanup complete. ${remainingProjects.length} projects remaining`);
    console.log(`📝 Total stories: ${remainingProjects[0]?.stories.length || 0}`);
    console.log(`🎯 Total epics: ${remainingProjects[0]?.epics.length || 0}`);
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

cleanupDuplicateProjects();
