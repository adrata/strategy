#!/usr/bin/env node

/**
 * Comprehensive Cleanup: Dan's Adrata Workspace
 * 
 * This script removes non-sales roles from buyer groups:
 * - Product (PM, PO, Product Designer, etc.)
 * - Engineering (Software Engineer, Architect, etc.)
 * - Customer Success / Account Management
 * - Design / UX
 * - Implementation / Professional Services
 * 
 * EXCEPTION: Sales Engineers, Solutions Engineers, Pre-Sales are KEPT
 * EXCEPTION: Founders/Co-Founders are borderline - reviewed case by case
 */

require('dotenv').config();
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// BAD departments for sales intelligence software
const BAD_DEPARTMENTS = [
  'product',
  'product management',
  'engineering',
  'engineering and technical',
  'customer success',
  'customer service',
  'support',
  'design',
  'ux',
  'research',
  'r&d',
  'research & development',
  'implementation',
  'professional services',
  'onboarding'
];

// BAD title patterns
const BAD_TITLES = [
  'product manager',
  'product owner',
  'product lead',
  'product director',
  'product designer',
  'product engineer',      // This is engineering, not sales
  'product development',
  'vp product',
  'vice president product',
  'head of product',
  'chief product',
  'engineer',              // Catches all engineer types
  'developer',
  'software',
  'architect',             // Technical architect
  'customer success',
  'csm',
  'account manager',       // Farming role, not hunting
  'solutions engineer',    // Pre-sales, not hunters
  'designer',
  'ux ',
  'researcher',
  'implementation',
  'onboarding',
  'support'
];

// GOOD patterns that override bad (HUNTER sales roles we want to KEEP)
// NOTE: Solutions Engineers removed - they are pre-sales, not hunters
const SALES_OVERRIDE_PATTERNS = [
  'account executive',     // AE is hunting, NOT account manager
  'ae ',
  'sales engineer',        // Sales Engineers in Sales dept are OK
  'pre-sales',
  'sales',                 // Generic sales roles
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
  'gtm',
  'commercial'
];

function isBadRole(title, department) {
  const titleLower = (title || '').toLowerCase();
  const deptLower = (department || '').toLowerCase();
  
  // Remove "Salesforce" from title to avoid false positives
  // "Head of Salesforce Engineering" is Engineering, not Sales
  const titleClean = titleLower.replace(/salesforce/g, '');
  
  // Check if explicitly a SALES role (these are GOOD, override bad)
  const isSalesRole = SALES_OVERRIDE_PATTERNS.some(pattern => titleClean.includes(pattern));
  if (isSalesRole) {
    return { isBad: false, reason: null };
  }
  
  // Check for BAD departments
  const badDept = BAD_DEPARTMENTS.find(bad => deptLower.includes(bad));
  if (badDept) {
    return { isBad: true, reason: `Department: ${badDept}` };
  }
  
  // Check for BAD titles
  const badTitle = BAD_TITLES.find(bad => titleLower.includes(bad));
  if (badTitle) {
    return { isBad: true, reason: `Title contains: ${badTitle}` };
  }
  
  return { isBad: false, reason: null };
}

async function main() {
  const args = process.argv.slice(2);
  const dryRun = args.includes('--dry-run');
  
  console.log('═'.repeat(70));
  console.log('🧹 COMPREHENSIVE CLEANUP: DAN\'S ADRATA WORKSPACE');
  console.log('═'.repeat(70));
  console.log(`Mode: ${dryRun ? '🔍 DRY RUN (no changes)' : '⚡ LIVE (will make changes)'}`);
  console.log('');
  
  try {
    // Find Adrata workspace
    const workspace = await prisma.workspaces.findFirst({
      where: { name: { contains: 'adrata', mode: 'insensitive' } }
    });
    
    if (!workspace) {
      console.log('❌ Adrata workspace not found');
      return;
    }
    console.log(`✅ Found workspace: ${workspace.name} (${workspace.id})\n`);
    
    // Get all people in buyer groups
    const buyerGroupPeople = await prisma.people.findMany({
      where: {
        workspaceId: workspace.id,
        deletedAt: null,
        isBuyerGroupMember: true
      },
      include: {
        company: { select: { name: true } }
      }
    });
    
    console.log(`📊 Total people in buyer groups: ${buyerGroupPeople.length}\n`);
    
    // Find bad people
    const badPeople = [];
    const goodPeople = [];
    
    for (const person of buyerGroupPeople) {
      const check = isBadRole(person.title, person.department);
      if (check.isBad) {
        badPeople.push({
          ...person,
          badReason: check.reason
        });
      } else {
        goodPeople.push(person);
      }
    }
    
    console.log(`✅ Good roles (keeping): ${goodPeople.length}`);
    console.log(`❌ Bad roles (removing): ${badPeople.length}\n`);
    
    if (badPeople.length === 0) {
      console.log('🎉 No bad roles found! Workspace is clean.');
      return;
    }
    
    // Display bad people grouped by company
    console.log('═'.repeat(70));
    console.log('❌ PEOPLE TO REMOVE FROM BUYER GROUPS:');
    console.log('═'.repeat(70));
    
    const byCompany = {};
    for (const p of badPeople) {
      const companyName = p.company?.name || 'Unknown';
      if (!byCompany[companyName]) byCompany[companyName] = [];
      byCompany[companyName].push(p);
    }
    
    for (const [company, people] of Object.entries(byCompany).sort()) {
      console.log(`\n📦 ${company}:`);
      for (const p of people) {
        console.log(`   ❌ ${p.name || 'Unknown'}`);
        console.log(`      Title: ${p.title || 'N/A'}`);
        console.log(`      Department: ${p.department || 'N/A'}`);
        console.log(`      Role: ${p.buyerGroupRole || 'N/A'}`);
        console.log(`      Reason: ${p.badReason}`);
      }
    }
    
    // Remove bad people from buyer groups
    console.log('\n' + '═'.repeat(70));
    console.log(dryRun ? '🔍 DRY RUN - Would remove:' : '🗑️  REMOVING FROM BUYER GROUPS:');
    console.log('═'.repeat(70));
    
    let removed = 0;
    let failed = 0;
    
    for (const person of badPeople) {
      if (dryRun) {
        console.log(`   Would remove: ${person.name} (${person.title})`);
        removed++;
      } else {
        try {
          await prisma.people.update({
            where: { id: person.id },
            data: {
              isBuyerGroupMember: false,
              buyerGroupRole: null,
              // Add a tag to track this was removed by cleanup
              tags: [...(person.tags || []), 'removed_bad_role_cleanup']
            }
          });
          console.log(`   ✅ Removed: ${person.name} (${person.title})`);
          removed++;
        } catch (error) {
          console.log(`   ❌ Failed: ${person.name} - ${error.message}`);
          failed++;
        }
      }
    }
    
    // Also remove from BuyerGroupMembers table if they exist there
    console.log('\n' + '═'.repeat(70));
    console.log(dryRun ? '🔍 Checking BuyerGroupMembers table...' : '🗑️  Cleaning BuyerGroupMembers table...');
    console.log('═'.repeat(70));
    
    // Get buyer groups for this workspace first
    const workspaceBuyerGroups = await prisma.buyerGroups.findMany({
      where: { workspaceId: workspace.id },
      select: { id: true, companyName: true }
    });
    const bgIds = workspaceBuyerGroups.map(bg => bg.id);
    const bgIdToName = Object.fromEntries(workspaceBuyerGroups.map(bg => [bg.id, bg.companyName]));
    
    // Get all buyer group members for this workspace
    const allBgMembers = await prisma.buyerGroupMembers.findMany({
      where: { buyerGroupId: { in: bgIds } }
    });
    
    const badBgMembers = allBgMembers.filter(m => {
      const check = isBadRole(m.title, m.department);
      return check.isBad;
    });
    
    console.log(`   Found ${badBgMembers.length} bad members in BuyerGroupMembers table`);
    
    let bgRemoved = 0;
    for (const member of badBgMembers) {
      const companyName = bgIdToName[member.buyerGroupId] || 'Unknown';
      if (dryRun) {
        console.log(`   Would remove: ${member.name} from ${companyName}`);
        bgRemoved++;
      } else {
        try {
          await prisma.buyerGroupMembers.delete({
            where: { id: member.id }
          });
          console.log(`   ✅ Removed: ${member.name} from ${companyName}`);
          bgRemoved++;
        } catch (error) {
          console.log(`   ❌ Failed: ${member.name} - ${error.message}`);
        }
      }
    }
    
    // Summary
    console.log('\n' + '═'.repeat(70));
    console.log('📊 SUMMARY');
    console.log('═'.repeat(70));
    console.log(`   People table: ${dryRun ? 'Would remove' : 'Removed'} ${removed} bad members`);
    console.log(`   BuyerGroupMembers table: ${dryRun ? 'Would remove' : 'Removed'} ${bgRemoved} bad members`);
    if (failed > 0) console.log(`   Failed: ${failed}`);
    
    if (dryRun) {
      console.log('\n⚠️  This was a DRY RUN. No changes were made.');
      console.log('   Run without --dry-run to apply changes.');
    } else {
      console.log('\n✅ Cleanup complete!');
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error(error.stack);
  } finally {
    await prisma.$disconnect();
  }
}

main();
