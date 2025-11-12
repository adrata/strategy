/**
 * ✅ VERIFY ADRATA BUGS COMPLETENESS
 * 
 * Verifies that all bugs have all required fields for proper display and functionality
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const ADRATA_WORKSPACE_ID = '01K7464TNANHQXPCZT1FYX205V';

interface BugCompletenessCheck {
  bugId: string;
  title: string;
  hasTitle: boolean;
  hasProject: boolean;
  hasStatus: boolean;
  hasPriority: boolean;
  hasType: boolean;
  hasCreatedAt: boolean;
  hasUpdatedAt: boolean;
  missingFields: string[];
  isComplete: boolean;
}

async function verifyBugsCompleteness() {
  console.log('\n✅ Verifying bugs completeness in Adrata workspace...\n');

  try {
    // Get all projects for adrata workspace
    const adrataProjects = await prisma.stacksProject.findMany({
      where: { workspaceId: ADRATA_WORKSPACE_ID },
      select: { id: true }
    });

    const projectIds = adrataProjects.map(p => p.id);

    if (projectIds.length === 0) {
      console.log('⚠️  No projects found in Adrata workspace');
      return;
    }

    // Get all bugs in adrata workspace
    const bugs = await prisma.stacksTask.findMany({
      where: {
        type: 'bug',
        projectId: { in: projectIds }
      },
      select: {
        id: true,
        title: true,
        description: true,
        status: true,
        priority: true,
        type: true,
        projectId: true,
        assigneeId: true,
        product: true,
        section: true,
        createdAt: true,
        updatedAt: true,
        project: {
          select: {
            id: true,
            name: true,
            workspaceId: true
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    console.log(`📊 Found ${bugs.length} bug(s) in Adrata workspace\n`);

    const checks: BugCompletenessCheck[] = [];
    const incompleteBugs: BugCompletenessCheck[] = [];

    for (const bug of bugs) {
      const missingFields: string[] = [];
      
      if (!bug.title || bug.title.trim() === '') {
        missingFields.push('title');
      }
      if (!bug.projectId) {
        missingFields.push('projectId');
      }
      if (!bug.status) {
        missingFields.push('status');
      }
      if (!bug.priority) {
        missingFields.push('priority');
      }
      if (!bug.type || bug.type !== 'bug') {
        missingFields.push('type');
      }
      if (!bug.createdAt) {
        missingFields.push('createdAt');
      }
      if (!bug.updatedAt) {
        missingFields.push('updatedAt');
      }

      const check: BugCompletenessCheck = {
        bugId: bug.id,
        title: bug.title || 'Untitled',
        hasTitle: !!bug.title && bug.title.trim() !== '',
        hasProject: !!bug.projectId,
        hasStatus: !!bug.status,
        hasPriority: !!bug.priority,
        hasType: bug.type === 'bug',
        hasCreatedAt: !!bug.createdAt,
        hasUpdatedAt: !!bug.updatedAt,
        missingFields,
        isComplete: missingFields.length === 0
      };

      checks.push(check);

      if (!check.isComplete) {
        incompleteBugs.push(check);
      }
    }

    // Display results
    console.log('📋 COMPLETENESS CHECK RESULTS:');
    console.log('='.repeat(80));
    console.log(`✅ Complete bugs: ${checks.filter(c => c.isComplete).length}`);
    console.log(`⚠️  Incomplete bugs: ${incompleteBugs.length}\n`);

    if (incompleteBugs.length > 0) {
      console.log('⚠️  INCOMPLETE BUGS:');
      incompleteBugs.forEach(bug => {
        console.log(`\n  Bug ID: ${bug.bugId}`);
        console.log(`  Title: "${bug.title}"`);
        console.log(`  Missing fields: ${bug.missingFields.join(', ')}`);
      });
    } else {
      console.log('✅ All bugs have all required fields!');
    }

    // Display detailed info for each bug
    console.log('\n📅 DETAILED BUG INFORMATION:');
    console.log('='.repeat(80));
    
    bugs.forEach((bug, index) => {
      console.log(`\n${index + 1}. ${bug.id}: "${bug.title}"`);
      console.log(`   Status: ${bug.status || 'MISSING'}`);
      console.log(`   Priority: ${bug.priority || 'MISSING'}`);
      console.log(`   Type: ${bug.type || 'MISSING'}`);
      console.log(`   Project: ${bug.project?.name || 'MISSING'} (${bug.project?.id || 'N/A'})`);
      console.log(`   Assignee: ${bug.assigneeId || 'None'}`);
      console.log(`   Product: ${bug.product || 'None'}`);
      console.log(`   Section: ${bug.section || 'None'}`);
      console.log(`   Created: ${bug.createdAt?.toISOString() || 'MISSING'}`);
      console.log(`   Updated: ${bug.updatedAt?.toISOString() || 'MISSING'}`);
      console.log(`   Description: ${bug.description ? `${bug.description.substring(0, 50)}...` : 'None'}`);
    });

    // Check for any bugs that might need default values
    const bugsNeedingDefaults = bugs.filter(bug => {
      return !bug.status || !bug.priority || !bug.type;
    });

    if (bugsNeedingDefaults.length > 0) {
      console.log(`\n🔧 Found ${bugsNeedingDefaults.length} bug(s) that might need default values`);
      console.log('   (These bugs might have been created before defaults were set)');
    }

  } catch (error) {
    console.error('❌ Error verifying bugs:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Run the verification
verifyBugsCompleteness()
  .then(() => {
    console.log('\n✅ Verification complete!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Verification failed:', error);
    process.exit(1);
  });

