const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function diagnoseStacksSchema() {
  try {
    console.log('🔍 Diagnosing Stacks Schema and Tables...\n');

    // Check if stacks tables exist
    const tablesToCheck = [
      'StacksProject',
      'StacksEpic', 
      'StacksStory',
      'StacksTask'
    ];

    console.log('📋 Checking if stacks tables exist in database...\n');

    for (const tableName of tablesToCheck) {
      try {
        // Try to query the table
        const result = await prisma.$queryRawUnsafe(`
          SELECT COUNT(*) as count 
          FROM "${tableName}"
        `);
        const count = Number(result[0]?.count || 0);
        console.log(`✅ ${tableName} table exists - ${count} records`);
      } catch (error) {
        if (error.code === '42P01' || error.message?.includes('does not exist')) {
          console.log(`❌ ${tableName} table DOES NOT EXIST in database`);
        } else {
          console.log(`⚠️  ${tableName} table check failed: ${error.message}`);
        }
      }
    }

    console.log('\n📊 Checking existing stacks data...\n');

    // Check projects
    try {
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
      console.log(`📋 Stacks Projects: ${projects.length}`);
      projects.forEach(p => {
        console.log(`  - ${p.name} (${p.id})`);
        console.log(`    Workspace: ${p.workspace.name} (${p.workspace.slug})`);
        console.log(`    Counts: ${p._count.stories} stories, ${p._count.epics} epics, ${p._count.tasks} tasks`);
      });
    } catch (error) {
      console.log(`❌ Error checking projects: ${error.message}`);
      if (error.code === '42P01' || error.code === 'P2021') {
        console.log('   → Table does not exist - migration needed');
      }
    }

    // Check stories
    try {
      const stories = await prisma.stacksStory.findMany({
        select: {
          id: true,
          title: true,
          status: true,
          projectId: true,
          project: {
            select: { id: true, name: true, workspaceId: true }
          }
        },
        take: 10
      });
      console.log(`\n📝 Stacks Stories: ${stories.length} total (showing first 10)`);
      stories.forEach(s => {
        console.log(`  - ${s.title} (${s.id})`);
        console.log(`    Project: ${s.project?.name || 'N/A'}, Status: ${s.status}`);
      });
    } catch (error) {
      console.log(`❌ Error checking stories: ${error.message}`);
      if (error.code === '42P01' || error.code === 'P2021') {
        console.log('   → Table does not exist - migration needed');
      }
    }

    // Check tasks
    try {
      const tasks = await prisma.stacksTask.findMany({
        select: {
          id: true,
          title: true,
          type: true,
          status: true,
          projectId: true,
          project: {
            select: { id: true, name: true }
          }
        },
        take: 10
      });
      console.log(`\n🐛 Stacks Tasks/Bugs: ${tasks.length} total (showing first 10)`);
      tasks.forEach(t => {
        console.log(`  - ${t.title} (${t.id}) - Type: ${t.type}, Status: ${t.status}`);
        console.log(`    Project: ${t.project?.name || 'N/A'}`);
      });
    } catch (error) {
      console.log(`❌ Error checking tasks: ${error.message}`);
      if (error.code === '42P01' || error.code === 'P2021') {
        console.log('   → Table does not exist - migration needed');
      }
    }

    // Check epics
    try {
      const epics = await prisma.stacksEpic.findMany({
        select: {
          id: true,
          title: true,
          status: true,
          projectId: true,
          project: {
            select: { id: true, name: true }
          }
        },
        take: 10
      });
      console.log(`\n🎯 Stacks Epics: ${epics.length} total (showing first 10)`);
      epics.forEach(e => {
        console.log(`  - ${e.title} (${e.id}) - Status: ${e.status}`);
        console.log(`    Project: ${e.project?.name || 'N/A'}`);
      });
    } catch (error) {
      console.log(`❌ Error checking epics: ${error.message}`);
      if (error.code === '42P01' || error.code === 'P2021') {
        console.log('   → Table does not exist - migration needed');
      }
    }

    console.log('\n✅ Diagnosis complete!\n');

  } catch (error) {
    console.error('❌ Diagnosis error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

diagnoseStacksSchema();

