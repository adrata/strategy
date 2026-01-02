#!/usr/bin/env node

/**
 * Audit and Fix Dan's Buyer Groups
 * 
 * This script:
 * 1. Finds Dan in the Adrata workspace
 * 2. Identifies all companies with buyer groups
 * 3. Removes people with "bad" roles (Account Managers, Product, Engineering, etc.)
 * 4. Tracks which companies need regeneration
 * 5. Optionally regenerates buyer groups for affected companies
 */

require('dotenv').config();
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

// Bad roles that should NOT be in a sales acquisition buyer group
const BAD_DEPARTMENTS = [
  'account management',
  'customer success',
  'customer service',
  'product',
  'product management',
  'engineering',
  'research & development',
  'r&d',
  'design',
  'ux',
  'support',
  'implementation',
  'onboarding',
  'professional services'
];

const BAD_TITLES = [
  'account manager',
  'customer success',
  'csm',
  'product manager',
  'product owner',
  'product lead',
  'engineer',
  'developer',
  'software engineer',
  'solutions engineer',  // This is borderline but often post-sale
  'implementation',
  'onboarding',
  'support',
  'designer',
  'ux designer',
  'research'
];

// Good roles to keep
const GOOD_TITLE_PATTERNS = [
  'account executive',  // NOT account manager
  'ae ',
  'sales',
  'revenue',
  'business development',
  'bdr',
  'sdr',
  'cro',
  'chief revenue',
  'vp sales',
  'vp of sales',
  'head of sales',
  'director of sales',
  'sales manager',
  'sales director',
  'go-to-market',
  'gtm'
];

async function findDan() {
  console.log('🔍 Finding Dan in Adrata workspace...\n');
  
  // Find Adrata workspace
  const workspace = await prisma.workspaces.findFirst({
    where: {
      OR: [
        { name: { contains: 'adrata', mode: 'insensitive' } },
        { name: { contains: 'Adrata', mode: 'insensitive' } }
      ]
    }
  });

  if (!workspace) {
    console.log('❌ Adrata workspace not found');
    return null;
  }
  console.log(`✅ Found workspace: ${workspace.name} (${workspace.id})`);

  // Find Dan (the seller)
  const dan = await prisma.users.findFirst({
    where: {
      OR: [
        { name: { contains: 'dan', mode: 'insensitive' } },
        { email: { contains: 'dan', mode: 'insensitive' } }
      ]
    }
  });

  if (!dan) {
    console.log('❌ Dan not found');
    return null;
  }
  console.log(`✅ Found Dan: ${dan.name} (${dan.id})`);

  return { workspace, dan };
}

function isBadRole(title, department) {
  const titleLower = (title || '').toLowerCase();
  const deptLower = (department || '').toLowerCase();

  // CRITICAL FIX: Check department FIRST - Engineering/Product are ALWAYS bad
  // regardless of what the title says (e.g., "Head of Salesforce Engineering" is BAD)
  const isBadDept = BAD_DEPARTMENTS.some(bad => deptLower.includes(bad));
  if (isBadDept) {
    // Department is clearly bad - only override if title is EXPLICITLY sales leadership
    const isExplicitSalesLeadership = [
      'chief revenue', 'cro', 'vp sales', 'vp of sales', 'head of sales',
      'director of sales', 'sales director', 'sales manager'
    ].some(pattern => titleLower.includes(pattern));
    
    if (!isExplicitSalesLeadership) {
      return true; // Bad department, not explicit sales leadership = BAD
    }
  }

  // Check if it's explicitly a GOOD role (to avoid false positives)
  // But exclude "salesforce" which is a product name, not a sales role
  const titleWithoutSalesforce = titleLower.replace(/salesforce/g, '');
  const isGoodTitle = GOOD_TITLE_PATTERNS.some(pattern => titleWithoutSalesforce.includes(pattern));
  if (isGoodTitle) {
    return false;
  }
  
  // Check for bad titles
  const isBadTitle = BAD_TITLES.some(bad => titleLower.includes(bad));

  return isBadTitle;
}

function getBadReason(title, department) {
  const titleLower = (title || '').toLowerCase();
  const deptLower = (department || '').toLowerCase();

  for (const bad of BAD_DEPARTMENTS) {
    if (deptLower.includes(bad)) {
      return `Department: ${bad}`;
    }
  }

  for (const bad of BAD_TITLES) {
    if (titleLower.includes(bad)) {
      return `Title: ${bad}`;
    }
  }

  return 'Unknown';
}

async function auditBuyerGroups(workspaceId, sellerId) {
  console.log('\n📊 Auditing buyer groups...\n');

  // Get all buyer groups for this workspace
  const buyerGroups = await prisma.buyerGroups.findMany({
    where: {
      workspaceId: workspaceId
    },
    include: {
      BuyerGroupMembers: true
    },
    orderBy: {
      createdAt: 'desc'
    }
  });

  console.log(`Found ${buyerGroups.length} buyer groups in workspace\n`);

  const audit = {
    total: buyerGroups.length,
    totalMembers: 0,
    badMembers: [],
    companiesNeedingRegeneration: [],
    companiesOK: [],
    membersByCompany: {}
  };

  for (const bg of buyerGroups) {
    const companyInfo = {
      id: bg.id,
      name: bg.companyName,
      totalMembers: bg.BuyerGroupMembers.length,
      badMembers: [],
      goodMembers: []
    };

    audit.totalMembers += bg.BuyerGroupMembers.length;

    for (const member of bg.BuyerGroupMembers) {
      if (isBadRole(member.title, member.department)) {
        const badMember = {
          buyerGroupId: bg.id,
          memberId: member.id,
          name: member.name,
          title: member.title,
          department: member.department,
          role: member.role,
          reason: getBadReason(member.title, member.department)
        };
        audit.badMembers.push(badMember);
        companyInfo.badMembers.push(badMember);
      } else {
        companyInfo.goodMembers.push({
          name: member.name,
          title: member.title,
          role: member.role
        });
      }
    }

    audit.membersByCompany[bg.companyName] = companyInfo;

    // Determine if company needs regeneration
    const goodMemberCount = companyInfo.goodMembers.length;
    const badMemberCount = companyInfo.badMembers.length;

    if (badMemberCount > 0) {
      // Needs attention if:
      // 1. Has any bad members, OR
      // 2. Would have fewer than 3 good members after cleanup
      const needsRegen = goodMemberCount < 3;
      
      if (needsRegen) {
        audit.companiesNeedingRegeneration.push({
          name: bg.companyName,
          id: bg.id,
          goodMembers: goodMemberCount,
          badMembers: badMemberCount,
          reason: goodMemberCount < 3 ? 'Too few good members after cleanup' : 'Has bad members'
        });
      } else {
        // Just remove bad members, no regen needed
        audit.companiesOK.push({
          name: bg.companyName,
          id: bg.id,
          goodMembers: goodMemberCount,
          badMembersToRemove: badMemberCount
        });
      }
    }
  }

  return audit;
}

async function displayAuditResults(audit) {
  console.log('═'.repeat(70));
  console.log('📋 AUDIT RESULTS');
  console.log('═'.repeat(70));
  
  console.log(`\n📊 Summary:`);
  console.log(`   Total buyer groups: ${audit.total}`);
  console.log(`   Total members: ${audit.totalMembers}`);
  console.log(`   Bad members found: ${audit.badMembers.length}`);
  console.log(`   Companies needing regeneration: ${audit.companiesNeedingRegeneration.length}`);
  console.log(`   Companies OK (just remove bad): ${audit.companiesOK.length}`);

  if (audit.badMembers.length > 0) {
    console.log('\n🚫 BAD MEMBERS TO REMOVE:');
    console.log('─'.repeat(70));
    
    // Group by company
    const byCompany = {};
    for (const bad of audit.badMembers) {
      const companyName = Object.keys(audit.membersByCompany).find(
        name => audit.membersByCompany[name].id === bad.buyerGroupId
      );
      if (!byCompany[companyName]) {
        byCompany[companyName] = [];
      }
      byCompany[companyName].push(bad);
    }

    for (const [company, members] of Object.entries(byCompany)) {
      console.log(`\n📦 ${company}:`);
      for (const member of members) {
        console.log(`   ❌ ${member.name}`);
        console.log(`      Title: ${member.title || 'N/A'}`);
        console.log(`      Department: ${member.department || 'N/A'}`);
        console.log(`      Role: ${member.role}`);
        console.log(`      Reason: ${member.reason}`);
      }
    }
  }

  if (audit.companiesNeedingRegeneration.length > 0) {
    console.log('\n\n🔄 COMPANIES NEEDING REGENERATION:');
    console.log('─'.repeat(70));
    for (const company of audit.companiesNeedingRegeneration) {
      console.log(`   • ${company.name}`);
      console.log(`     Good members: ${company.goodMembers}, Bad: ${company.badMembers}`);
      console.log(`     Reason: ${company.reason}`);
    }
  }

  console.log('\n');
}

async function removeBadMembers(audit, dryRun = false) {
  console.log('═'.repeat(70));
  console.log(dryRun ? '🔍 DRY RUN - Simulating removal...' : '🗑️  REMOVING BAD MEMBERS...');
  console.log('═'.repeat(70));

  let removed = 0;
  
  for (const badMember of audit.badMembers) {
    if (dryRun) {
      console.log(`   Would remove: ${badMember.name} (${badMember.title})`);
    } else {
      try {
        await prisma.buyerGroupMembers.delete({
          where: { id: badMember.memberId }
        });
        console.log(`   ✅ Removed: ${badMember.name} (${badMember.title})`);
        removed++;
      } catch (error) {
        console.log(`   ❌ Failed to remove ${badMember.name}: ${error.message}`);
      }
    }
  }

  console.log(`\n${dryRun ? 'Would remove' : 'Removed'} ${removed} bad members`);
  return removed;
}

async function updatePeopleRecords(audit, workspaceId, dryRun = false) {
  console.log('\n═'.repeat(70));
  console.log(dryRun ? '🔍 DRY RUN - Simulating people updates...' : '📝 UPDATING PEOPLE RECORDS...');
  console.log('═'.repeat(70));

  // Find people records that match bad members and update their buyer group status
  let updated = 0;

  for (const badMember of audit.badMembers) {
    // Skip if no email to match on
    if (!badMember.email) {
      continue;
    }
    
    // Try to find matching person by email
    const person = await prisma.people.findFirst({
      where: {
        workspaceId: workspaceId,
        email: { equals: badMember.email, mode: 'insensitive' }
      }
    });

    if (person && person.isBuyerGroupMember) {
      if (dryRun) {
        console.log(`   Would update: ${badMember.name} - set isBuyerGroupMember=false`);
      } else {
        try {
          await prisma.people.update({
            where: { id: person.id },
            data: {
              isBuyerGroupMember: false,
              buyerGroupRole: null,
              buyerGroupStatus: 'removed_bad_fit'
            }
          });
          console.log(`   ✅ Updated: ${badMember.name}`);
          updated++;
        } catch (error) {
          console.log(`   ❌ Failed to update ${badMember.name}: ${error.message}`);
        }
      }
    }
  }

  console.log(`\n${dryRun ? 'Would update' : 'Updated'} ${updated} people records`);
  return updated;
}

async function main() {
  const args = process.argv.slice(2);
  const dryRun = args.includes('--dry-run');
  const regenerate = args.includes('--regenerate');
  
  console.log('═'.repeat(70));
  console.log('🔧 DAN BUYER GROUP AUDIT & FIX');
  console.log('═'.repeat(70));
  console.log(`Mode: ${dryRun ? 'DRY RUN (no changes)' : 'LIVE (will make changes)'}`);
  console.log(`Regenerate: ${regenerate ? 'YES' : 'NO'}`);
  console.log('');

  try {
    // Step 1: Find Dan and workspace
    const result = await findDan();
    if (!result) {
      process.exit(1);
    }
    const { workspace, dan } = result;

    // Step 2: Audit buyer groups
    const audit = await auditBuyerGroups(workspace.id, dan.id);

    // Step 3: Display results
    await displayAuditResults(audit);

    if (audit.badMembers.length === 0) {
      console.log('✅ No bad members found! All buyer groups are clean.');
      await prisma.$disconnect();
      return;
    }

    // Step 4: Remove bad members
    await removeBadMembers(audit, dryRun);

    // Step 5: Update people records
    await updatePeopleRecords(audit, workspace.id, dryRun);

    // Step 6: List companies needing regeneration
    if (audit.companiesNeedingRegeneration.length > 0) {
      console.log('\n═'.repeat(70));
      console.log('🔄 COMPANIES THAT NEED BUYER GROUP REGENERATION:');
      console.log('═'.repeat(70));
      
      for (const company of audit.companiesNeedingRegeneration) {
        console.log(`   • ${company.name}`);
      }

      if (regenerate && !dryRun) {
        console.log('\n🚀 Starting regeneration...');
        console.log('   (This would run the buyer group pipeline for each company)');
        // TODO: Integrate with the SmartBuyerGroupPipeline
        console.log('\n⚠️  Regeneration not yet implemented in this script.');
        console.log('   Run manually with:');
        for (const company of audit.companiesNeedingRegeneration) {
          console.log(`   node run-dan-small-medium-companies.js "${company.name}"`);
        }
      } else if (!dryRun) {
        console.log('\n💡 To regenerate these buyer groups, run with --regenerate flag');
      }
    }

    console.log('\n✅ Audit complete!');

    if (dryRun) {
      console.log('\n⚠️  This was a DRY RUN. No changes were made.');
      console.log('   Run without --dry-run to apply changes.');
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error(error.stack);
  } finally {
    await prisma.$disconnect();
  }
}

main();
