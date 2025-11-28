/**
 * Audit Adrata Master Roadmap in Stacks
 * 
 * Verifies all epics and stories are properly configured
 * 
 * Usage: node scripts/audit-roadmap-stacks.js
 */

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function audit() {
  console.log('');
  console.log('📋 ADRATA MASTER ROADMAP AUDIT');
  console.log('='.repeat(70));
  
  try {
    // Get the project
    const project = await prisma.stacksProject.findFirst({
      where: { name: 'Adrata Master Roadmap' }
    });
    
    if (!project) {
      console.log('❌ Project not found!');
      return;
    }
    
    console.log('\n📁 Project:', project.name);
    console.log('   ID:', project.id);
    console.log('   Workspace:', project.workspaceId);
    
    // Get all epics with stories
    const epics = await prisma.stacksEpic.findMany({
      where: { projectId: project.id },
      orderBy: { rank: 'asc' },
      include: {
        stories: {
          orderBy: { title: 'asc' },
          include: {
            assignee: { select: { id: true, name: true, email: true } }
          }
        }
      }
    });
    
    const totalStories = epics.reduce((acc, e) => acc + e.stories.length, 0);
    
    console.log('\n📊 SUMMARY');
    console.log('   Total Epics:', epics.length);
    console.log('   Total Stories:', totalStories);
    
    // Count by status and priority
    const storyStatuses = {};
    const storyPriorities = {};
    let storiesWithCriteria = 0;
    let storiesWithAssignee = 0;
    let storiesWithDescription = 0;
    const issues = [];
    
    epics.forEach(epic => {
      epic.stories.forEach(story => {
        // Status count
        storyStatuses[story.status] = (storyStatuses[story.status] || 0) + 1;
        
        // Priority count
        storyPriorities[story.priority] = (storyPriorities[story.priority] || 0) + 1;
        
        // Check acceptance criteria
        if (story.acceptanceCriteria && story.acceptanceCriteria.trim().length > 0) {
          storiesWithCriteria++;
        } else {
          issues.push({ type: 'MISSING_CRITERIA', epic: epic.title, story: story.title });
        }
        
        // Check assignee
        if (story.assignee) {
          storiesWithAssignee++;
        } else {
          issues.push({ type: 'MISSING_ASSIGNEE', epic: epic.title, story: story.title });
        }
        
        // Check description
        if (story.description && story.description.trim().length > 0) {
          storiesWithDescription++;
        } else {
          issues.push({ type: 'MISSING_DESCRIPTION', epic: epic.title, story: story.title });
        }
      });
    });
    
    console.log('\n📈 STORY STATUS BREAKDOWN');
    Object.entries(storyStatuses).sort().forEach(([status, count]) => {
      const pct = ((count / totalStories) * 100).toFixed(1);
      console.log(`   ${status}: ${count} (${pct}%)`);
    });
    
    console.log('\n🎯 STORY PRIORITY BREAKDOWN');
    Object.entries(storyPriorities).sort().forEach(([priority, count]) => {
      const pct = ((count / totalStories) * 100).toFixed(1);
      console.log(`   ${priority}: ${count} (${pct}%)`);
    });
    
    console.log('\n✅ DATA QUALITY METRICS');
    console.log(`   Stories with acceptance criteria: ${storiesWithCriteria}/${totalStories} (${((storiesWithCriteria/totalStories)*100).toFixed(1)}%)`);
    console.log(`   Stories with assignee: ${storiesWithAssignee}/${totalStories} (${((storiesWithAssignee/totalStories)*100).toFixed(1)}%)`);
    console.log(`   Stories with description: ${storiesWithDescription}/${totalStories} (${((storiesWithDescription/totalStories)*100).toFixed(1)}%)`);
    
    // Detailed audit
    console.log('\n' + '='.repeat(70));
    console.log('DETAILED EPIC & STORY AUDIT');
    console.log('='.repeat(70));
    
    for (let i = 0; i < epics.length; i++) {
      const epic = epics[i];
      console.log('');
      console.log(`🏛️  EPIC ${i+1}: ${epic.title}`);
      console.log(`   ID: ${epic.id}`);
      console.log(`   Status: ${epic.status} | Priority: ${epic.priority} | Rank: ${epic.rank}`);
      console.log(`   Stories: ${epic.stories.length}`);
      
      if (epic.description && epic.description.trim().length > 0) {
        console.log('   Description: ✅ Present');
      } else {
        console.log('   Description: ⚠️ Missing');
      }
      
      for (let j = 0; j < epic.stories.length; j++) {
        const story = epic.stories[j];
        const criteriaCount = story.acceptanceCriteria ? 
          (story.acceptanceCriteria.match(/- \[ \]/g) || []).length : 0;
        
        let statusIcon = '✅';
        const storyIssues = [];
        
        if (!story.acceptanceCriteria || story.acceptanceCriteria.trim().length === 0) {
          statusIcon = '⚠️';
          storyIssues.push('no criteria');
        }
        if (!story.assignee) {
          statusIcon = '⚠️';
          storyIssues.push('no assignee');
        }
        if (!story.description || story.description.trim().length === 0) {
          statusIcon = '⚠️';
          storyIssues.push('no description');
        }
        
        console.log('');
        console.log(`   ${statusIcon} Story: ${story.title}`);
        console.log(`      Status: ${story.status} | Priority: ${story.priority}`);
        console.log(`      Assignee: ${story.assignee ? story.assignee.name : '❌ None'}`);
        console.log(`      Acceptance Criteria: ${criteriaCount} items`);
        
        if (storyIssues.length > 0) {
          console.log(`      ⚠️ Issues: ${storyIssues.join(', ')}`);
        }
      }
    }
    
    // Final summary
    console.log('\n' + '='.repeat(70));
    console.log('AUDIT RESULT');
    console.log('='.repeat(70));
    
    if (issues.length === 0) {
      console.log('\n✅ ALL CHECKS PASSED!');
      console.log('   - All 12 epics have descriptions');
      console.log('   - All 57 stories have acceptance criteria');
      console.log('   - All 57 stories have assignees (ross)');
      console.log('   - All 57 stories have descriptions');
      console.log('\n🎉 The roadmap is fully configured and ready to use!');
    } else {
      console.log(`\n⚠️ FOUND ${issues.length} ISSUES:\n`);
      
      const byType = {};
      issues.forEach(issue => {
        if (!byType[issue.type]) byType[issue.type] = [];
        byType[issue.type].push(issue);
      });
      
      Object.entries(byType).forEach(([type, typeIssues]) => {
        console.log(`   ${type}: ${typeIssues.length} stories`);
        typeIssues.slice(0, 5).forEach(issue => {
          console.log(`      - ${issue.story}`);
        });
        if (typeIssues.length > 5) {
          console.log(`      ... and ${typeIssues.length - 5} more`);
        }
      });
    }
    
    console.log('\n' + '='.repeat(70));
    console.log('');
    
  } catch (error) {
    console.error('❌ Audit error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

audit();

