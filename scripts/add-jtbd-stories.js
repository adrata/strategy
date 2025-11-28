/**
 * Add JTBD-Based Stories to Stacks
 * 
 * Adds the 12 missing stories identified through Jobs-to-be-Done analysis
 * 
 * Usage: node scripts/add-jtbd-stories.js
 */

const { PrismaClient } = require('@prisma/client');
const fs = require('fs');

const prisma = new PrismaClient();

async function addStories() {
  console.log('\n🚀 Adding JTBD-based stories to Stacks...\n');
  
  try {
    // Load the stories
    const stories = JSON.parse(fs.readFileSync('scripts/jtbd-missing-stories.json', 'utf-8'));
    
    // Get the project
    const project = await prisma.stacksProject.findFirst({
      where: { name: 'Adrata Master Roadmap' }
    });
    
    if (!project) {
      console.log('❌ Project not found!');
      return;
    }
    
    // Get Ross user
    const user = await prisma.users.findFirst({
      where: {
        OR: [
          { name: { contains: 'ross', mode: 'insensitive' } },
          { email: { contains: 'ross', mode: 'insensitive' } }
        ]
      }
    });
    
    if (!user) {
      console.log('❌ User "ross" not found!');
      return;
    }
    
    // Get all epics
    const epics = await prisma.stacksEpic.findMany({
      where: { projectId: project.id }
    });
    
    // Map epic names to IDs
    const epicMap = {};
    epics.forEach(epic => {
      epicMap[epic.title] = epic.id;
    });
    
    // Check for existing stories
    const existingStories = await prisma.stacksStory.findMany({
      where: { projectId: project.id },
      select: { title: true }
    });
    const existingTitles = new Set(existingStories.map(s => s.title.toLowerCase().trim()));
    
    // Get max rank
    const maxRankStory = await prisma.stacksStory.findFirst({
      where: { projectId: project.id },
      orderBy: { rank: 'desc' },
      select: { rank: true }
    });
    let nextRank = (maxRankStory?.rank || 57) + 1;
    
    const priorityMap = { 'P0': 'high', 'P1': 'high', 'P2': 'medium', 'P3': 'low' };
    
    let created = 0;
    let skipped = 0;
    
    for (const story of stories) {
      const storyTitle = `${story.number}: ${story.title}`;
      
      // Check if already exists
      if (existingTitles.has(storyTitle.toLowerCase().trim())) {
        console.log(`⏭️  Skipping (exists): ${storyTitle}`);
        skipped++;
        continue;
      }
      
      // Find epic
      const epicId = epicMap[story.epic];
      if (!epicId) {
        console.log(`⚠️  Epic not found for: ${storyTitle}, creating without epic`);
      }
      
      // Build acceptance criteria
      const acceptanceCriteria = story.acceptanceCriteria
        .map(ac => `- [ ] ${ac}`)
        .join('\n');
      
      // Add JTBD to description
      const fullDescription = `${story.description}

**Jobs-to-be-Done:**
- Functional: ${story.jtbd.functional}
- Identity: ${story.jtbd.identity}
- Emotional: ${story.jtbd.emotional}`;
      
      // Create story
      await prisma.stacksStory.create({
        data: {
          projectId: project.id,
          epicId: epicId || null,
          title: storyTitle,
          description: fullDescription,
          acceptanceCriteria: acceptanceCriteria,
          status: 'todo',
          priority: priorityMap[story.priority] || 'high',
          assigneeId: user.id,
          rank: nextRank,
          statusChangedAt: new Date()
        }
      });
      
      console.log(`✅ Created: ${storyTitle} [${story.priority}]`);
      created++;
      nextRank++;
    }
    
    console.log(`
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📊 IMPORT COMPLETE
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

   Stories created: ${created}
   Stories skipped: ${skipped}
   
   Total stories in roadmap: ${existingStories.length + created}

✅ JTBD stories added successfully!
`);
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

addStories();

