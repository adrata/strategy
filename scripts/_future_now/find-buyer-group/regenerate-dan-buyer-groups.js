#!/usr/bin/env node

/**
 * Regenerate Buyer Groups for Dan's Companies
 * 
 * This script regenerates buyer groups for companies that had
 * too few good members after the cleanup.
 */

require('dotenv').config();
const { PrismaClient } = require('@prisma/client');
const { SmartBuyerGroupPipeline } = require('./index');

const prisma = new PrismaClient();

// Companies that need regeneration (from the audit)
const COMPANIES_TO_REGENERATE = [
  'ITC Systems',        // Added - had duplicates and missing data
  'Lili',
  'Convex',
  'Clerk.com',
  'CXT Software',
  'Aduvo',
  'equipifi',
  'Coursedog',
  'Precisely',
  'GitLab',
  'Revalize',
  'RentalResult',
  'CrowdStrike',
  'Concord Technologies'
];

// Dan's sales buyer profile (updated with exclusions)
const SALES_BUYER_PROFILE = {
  departments: {
    primary: ['sales', 'revenue operations', 'business development', 'commercial'],
    secondary: ['marketing', 'strategy', 'growth'],
    exclude: [
      'account management',
      'customer success', 
      'customer service',
      'product',
      'product management',
      'engineering',
      'research & development',
      'support',
      'implementation',
      'onboarding',
      'design'
    ]
  },
  titles: {
    primary: ['cro', 'chief revenue', 'vp sales', 'vp of sales', 'head of sales', 'director of sales'],
    secondary: ['sales manager', 'sales director', 'business development', 'revenue'],
    exclude: [
      'account manager',
      'customer success',
      'csm',
      'product manager',
      'product owner',
      'engineer',
      'developer',
      'implementation',
      'support',
      'designer'
    ]
  }
};

async function getCompanyLinkedIn(companyName, workspaceId) {
  // Try to find the company in the database to get LinkedIn URL
  const company = await prisma.companies.findFirst({
    where: {
      workspaceId: workspaceId,
      OR: [
        { name: { contains: companyName, mode: 'insensitive' } }
      ]
    },
    select: {
      id: true,
      name: true,
      domain: true,
      linkedinUrl: true
    }
  });

  if (company?.linkedinUrl) {
    return company.linkedinUrl;
  }

  // Try to find existing buyer group with LinkedIn URL
  const buyerGroup = await prisma.buyerGroups.findFirst({
    where: {
      workspaceId: workspaceId,
      companyName: { contains: companyName, mode: 'insensitive' }
    },
    select: {
      linkedinUrl: true,
      website: true
    }
  });

  return buyerGroup?.linkedinUrl || buyerGroup?.website || null;
}

async function regenerateBuyerGroup(companyName, workspaceId, sellerId) {
  console.log(`\n🔄 Regenerating buyer group for: ${companyName}`);
  
  try {
    // Get LinkedIn URL or identifier
    const linkedinUrl = await getCompanyLinkedIn(companyName, workspaceId);
    
    if (!linkedinUrl) {
      console.log(`   ⚠️  No LinkedIn URL found for ${companyName}, using company name search`);
    }

    // Delete existing buyer group(s) for this company
    const deleted = await prisma.buyerGroups.deleteMany({
      where: {
        workspaceId: workspaceId,
        companyName: { contains: companyName, mode: 'insensitive' }
      }
    });
    console.log(`   🗑️  Deleted ${deleted.count} existing buyer group(s)`);

    // Create pipeline options
    const pipelineOptions = {
      linkedinUrl: linkedinUrl || companyName,
      dealSize: 75000,
      maxPages: 3,
      productCategory: 'sales',
      customFiltering: SALES_BUYER_PROFILE,
      workspaceId: workspaceId,
      sellerId: sellerId,
      usaOnly: false,
      skipDatabase: false,
      prisma: prisma
    };

    // Run the pipeline
    const pipeline = new SmartBuyerGroupPipeline(pipelineOptions);
    
    const company = {
      name: companyName,
      linkedinUrl: linkedinUrl?.includes('linkedin.com') ? linkedinUrl : null,
      website: linkedinUrl && !linkedinUrl.includes('linkedin.com') ? linkedinUrl : null
    };

    const result = await pipeline.run(company);

    if (result && result.buyerGroup && result.buyerGroup.length > 0) {
      console.log(`   ✅ Generated ${result.buyerGroup.length} buyer group members`);
      
      // Show the new members
      for (const member of result.buyerGroup.slice(0, 5)) {
        console.log(`      • ${member.name} - ${member.title} (${member.role})`);
      }
      if (result.buyerGroup.length > 5) {
        console.log(`      ... and ${result.buyerGroup.length - 5} more`);
      }
      
      return { success: true, members: result.buyerGroup.length };
    } else {
      console.log(`   ⚠️  No buyer group members generated`);
      return { success: false, error: 'No members generated' };
    }
  } catch (error) {
    console.log(`   ❌ Error: ${error.message}`);
    return { success: false, error: error.message };
  }
}

async function main() {
  const args = process.argv.slice(2);
  const specificCompany = args.find(a => !a.startsWith('--'));
  const dryRun = args.includes('--dry-run');
  const limit = args.find(a => a.startsWith('--limit='))?.split('=')[1];

  console.log('═'.repeat(70));
  console.log('🔄 REGENERATE DAN\'S BUYER GROUPS');
  console.log('═'.repeat(70));
  console.log(`Mode: ${dryRun ? 'DRY RUN' : 'LIVE'}`);
  console.log('');

  try {
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
      process.exit(1);
    }

    // Find Dan
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
      process.exit(1);
    }

    console.log(`✅ Found workspace: ${workspace.name}`);
    console.log(`✅ Found seller: ${dan.name}`);

    // Determine which companies to process
    let companies = specificCompany 
      ? [specificCompany] 
      : [...new Set(COMPANIES_TO_REGENERATE)]; // Dedupe

    if (limit) {
      companies = companies.slice(0, parseInt(limit));
    }

    console.log(`\n📋 Companies to regenerate: ${companies.length}`);
    for (const c of companies) {
      console.log(`   • ${c}`);
    }

    if (dryRun) {
      console.log('\n⚠️  DRY RUN - No changes will be made');
      await prisma.$disconnect();
      return;
    }

    // Regenerate each company
    const results = {
      success: [],
      failed: []
    };

    for (const companyName of companies) {
      const result = await regenerateBuyerGroup(companyName, workspace.id, dan.id);
      if (result.success) {
        results.success.push({ name: companyName, members: result.members });
      } else {
        results.failed.push({ name: companyName, error: result.error });
      }
      
      // Small delay between API calls
      await new Promise(r => setTimeout(r, 1000));
    }

    // Summary
    console.log('\n' + '═'.repeat(70));
    console.log('📊 REGENERATION SUMMARY');
    console.log('═'.repeat(70));
    console.log(`\n✅ Successful: ${results.success.length}`);
    for (const s of results.success) {
      console.log(`   • ${s.name}: ${s.members} members`);
    }
    
    if (results.failed.length > 0) {
      console.log(`\n❌ Failed: ${results.failed.length}`);
      for (const f of results.failed) {
        console.log(`   • ${f.name}: ${f.error}`);
      }
    }

    console.log('\n✅ Regeneration complete!');

  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error(error.stack);
  } finally {
    await prisma.$disconnect();
  }
}

main();
