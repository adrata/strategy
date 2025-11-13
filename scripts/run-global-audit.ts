/**
 * Run company-people linking audit across ALL workspaces
 */

import { PrismaClient } from '@prisma/client';
import { auditCompanyPeopleLinking } from './fix-company-people-linking';

const prisma = new PrismaClient();

async function runGlobalAudit() {
  console.log('🌍 Running global company-people linking audit across all workspaces...\n');
  
  try {
    // Get all active workspaces
    const workspaces = await prisma.workspaces.findMany({
      where: {
        deletedAt: null
      },
      select: {
        id: true,
        name: true,
        _count: {
          select: {
            people: true,
            companies: true
          }
        }
      }
    });
    
    console.log(`📊 Found ${workspaces.length} active workspaces\n`);
    
    let totalIssues = 0;
    let workspacesWithIssues = 0;
    
    for (const workspace of workspaces) {
      console.log(`\n${'='.repeat(80)}`);
      console.log(`🔍 Workspace: ${workspace.name} (${workspace.id})`);
      console.log(`   People: ${workspace._count.people} | Companies: ${workspace._count.companies}`);
      console.log('='.repeat(80));
      
      if (workspace._count.people === 0 || workspace._count.companies === 0) {
        console.log('⏭️  Skipping (no people or companies)\n');
        continue;
      }
      
      try {
        const report = await auditCompanyPeopleLinking(workspace.id);
        
        const issueCount = report.successfulMatches.length + report.domainMismatches.length;
        
        if (issueCount > 0) {
          workspacesWithIssues++;
          totalIssues += issueCount;
          
          console.log(`\n⚠️  Found ${issueCount} linking issues:`);
          console.log(`   - Successful matches: ${report.successfulMatches.length}`);
          console.log(`   - Domain mismatches: ${report.domainMismatches.length}`);
          
          if (report.domainMismatches.length > 0) {
            console.log(`\n   🚨 Domain Mismatches:`);
            report.domainMismatches.forEach((m, idx) => {
              console.log(`      ${idx + 1}. ${m.personName} (${m.personEmail})`);
              console.log(`         ${m.reason}`);
            });
          }
        } else {
          console.log('✅ No issues found');
        }
      } catch (error) {
        console.error(`❌ Error auditing workspace ${workspace.name}:`, error);
      }
    }
    
    console.log(`\n\n${'='.repeat(80)}`);
    console.log('📊 GLOBAL AUDIT SUMMARY');
    console.log('='.repeat(80));
    console.log(`Total workspaces scanned: ${workspaces.length}`);
    console.log(`Workspaces with issues: ${workspacesWithIssues}`);
    console.log(`Total linking issues found: ${totalIssues}`);
    console.log('='.repeat(80));
    
    if (totalIssues > 0) {
      console.log('\n💡 To fix issues in a specific workspace, run:');
      console.log('   npx tsx scripts/fix-company-people-linking.ts <workspaceId> --apply');
    } else {
      console.log('\n✅ All workspaces have proper company-people linking!');
    }
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

runGlobalAudit();

