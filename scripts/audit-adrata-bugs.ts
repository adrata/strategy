/**
 * 🔍 AUDIT ADRATA BUGS SCRIPT
 * 
 * Audits and fixes bugs in the adrata workspace:
 * - Checks for bugs with missing or incorrect project associations
 * - Verifies workspace IDs match
 * - Fixes any issues found
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Adrata workspace ID
const ADRATA_WORKSPACE_ID = '01K7464TNANHQXPCZT1FYX205V';

interface BugAuditResult {
  bugId: string;
  title: string;
  projectId: string | null;
  projectWorkspaceId: string | null;
  expectedWorkspaceId: string;
  hasValidProject: boolean;
  needsFix: boolean;
  fixAction?: string;
}

async function auditAdrataBugs() {
  console.log('\n🔍 Auditing bugs in Adrata workspace...');
  console.log(`Workspace ID: ${ADRATA_WORKSPACE_ID}\n`);

  try {
    // First, get all projects for the adrata workspace
    const adrataProjects = await prisma.stacksProject.findMany({
      where: { workspaceId: ADRATA_WORKSPACE_ID },
      select: { id: true, name: true, workspaceId: true }
    });

    console.log(`✅ Found ${adrataProjects.length} project(s) in Adrata workspace`);
    if (adrataProjects.length > 0) {
      console.log('Projects:', adrataProjects.map(p => ({ id: p.id, name: p.name })));
    }

    // Get or create default project if none exists
    let defaultProject = adrataProjects.find(p => p.name === 'Default Project') || adrataProjects[0];
    
    if (!defaultProject) {
      console.log('⚠️  No projects found, creating default project...');
      defaultProject = await prisma.stacksProject.create({
        data: {
          workspaceId: ADRATA_WORKSPACE_ID,
          name: 'Default Project',
          description: 'Default project for stacks'
        },
        select: { id: true, name: true, workspaceId: true }
      });
      console.log(`✅ Created default project: ${defaultProject.id}`);
    }

    // Get all bugs (tasks with type='bug')
    // First, get all bugs without workspace filter to see what we have
    const allBugs = await prisma.stacksTask.findMany({
      where: { type: 'bug' },
      select: {
        id: true,
        title: true,
        projectId: true,
        createdAt: true,
        project: {
          select: {
            id: true,
            name: true,
            workspaceId: true
          }
        }
      },
      orderBy: { createdAt: 'desc' },
      take: 100 // Get last 100 bugs
    });

    console.log(`\n📊 Found ${allBugs.length} total bugs in database\n`);

    // Audit each bug
    const auditResults: BugAuditResult[] = [];
    const bugsToFix: BugAuditResult[] = [];

    for (const bug of allBugs) {
      const projectWorkspaceId = bug.project?.workspaceId || null;
      const hasValidProject = projectWorkspaceId === ADRATA_WORKSPACE_ID;
      const needsFix = !bug.projectId || !hasValidProject;

      const result: BugAuditResult = {
        bugId: bug.id,
        title: bug.title || 'Untitled',
        projectId: bug.projectId,
        projectWorkspaceId: projectWorkspaceId,
        expectedWorkspaceId: ADRATA_WORKSPACE_ID,
        hasValidProject,
        needsFix
      };

      if (needsFix) {
        if (!bug.projectId) {
          result.fixAction = 'Assign to default project';
        } else if (!hasValidProject) {
          result.fixAction = 'Reassign to correct workspace project';
        }
        bugsToFix.push(result);
      }

      auditResults.push(result);
    }

    // Display audit results
    console.log('📋 AUDIT RESULTS:');
    console.log('='.repeat(80));
    
    const adrataBugs = auditResults.filter(r => r.hasValidProject);
    const orphanedBugs = auditResults.filter(r => !r.hasValidProject && r.projectId);
    const bugsWithoutProject = auditResults.filter(r => !r.projectId);

    console.log(`✅ Valid bugs (correct workspace): ${adrataBugs.length}`);
    console.log(`⚠️  Bugs with wrong workspace: ${orphanedBugs.length}`);
    console.log(`❌ Bugs without project: ${bugsWithoutProject.length}`);
    console.log(`🔧 Total bugs needing fix: ${bugsToFix.length}\n`);

    if (orphanedBugs.length > 0) {
      console.log('\n⚠️  BUGS WITH WRONG WORKSPACE:');
      orphanedBugs.forEach(bug => {
        console.log(`  - ${bug.bugId}: "${bug.title}"`);
        console.log(`    Current project workspace: ${bug.projectWorkspaceId || 'N/A'}`);
        console.log(`    Expected workspace: ${bug.expectedWorkspaceId}`);
      });
    }

    if (bugsWithoutProject.length > 0) {
      console.log('\n❌ BUGS WITHOUT PROJECT:');
      bugsWithoutProject.forEach(bug => {
        console.log(`  - ${bug.bugId}: "${bug.title}"`);
      });
    }

    // Fix bugs if needed
    if (bugsToFix.length > 0) {
      console.log(`\n🔧 Fixing ${bugsToFix.length} bug(s)...\n`);

      for (const bug of bugsToFix) {
        try {
          await prisma.stacksTask.update({
            where: { id: bug.bugId },
            data: { projectId: defaultProject.id }
          });
          console.log(`✅ Fixed bug ${bug.bugId}: "${bug.title}"`);
          console.log(`   Assigned to project: ${defaultProject.id} (${defaultProject.name})`);
        } catch (error) {
          console.error(`❌ Failed to fix bug ${bug.bugId}:`, error);
        }
      }

      console.log(`\n✅ Fixed ${bugsToFix.length} bug(s) successfully!`);
    } else {
      console.log('\n✅ All bugs are properly configured!');
    }

    // Summary of recent bugs (last 10)
    const recentBugs = allBugs.slice(0, 10);
    console.log('\n📅 RECENT BUGS (last 10):');
    console.log('='.repeat(80));
    recentBugs.forEach((bug, index) => {
      const status = bug.project?.workspaceId === ADRATA_WORKSPACE_ID ? '✅' : '⚠️';
      console.log(`${index + 1}. ${status} ${bug.id}: "${bug.title}"`);
      console.log(`   Project: ${bug.project?.name || 'NONE'} (${bug.project?.workspaceId || 'N/A'})`);
      console.log(`   Created: ${bug.createdAt.toISOString()}`);
    });

  } catch (error) {
    console.error('❌ Error auditing bugs:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Run the audit
auditAdrataBugs()
  .then(() => {
    console.log('\n✅ Audit complete!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Audit failed:', error);
    process.exit(1);
  });

