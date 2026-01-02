#!/usr/bin/env node
/**
 * Regenerate Buyer Groups with USA-Only Filter
 * 
 * This script regenerates buyer groups for companies that had
 * international members removed, ensuring only USA-based contacts.
 */

require('dotenv').config();
const { PrismaClient } = require('@prisma/client');
const { SmartBuyerGroupPipeline } = require('./index.js');

const prisma = new PrismaClient();

// Companies that need regeneration after international cleanup
const COMPANIES_TO_REGENERATE = [
  {
    name: "Aspen Systems Corp",
    linkedinUrl: "https://www.linkedin.com/company/aspen-systems-corp"
  },
  {
    name: "Tonic.ai",
    linkedinUrl: "https://www.linkedin.com/company/tonicai"
  },
  {
    name: "BlueOptima",
    linkedinUrl: "https://www.linkedin.com/company/blueoptima"
  },
  {
    name: "ClicData",
    linkedinUrl: "https://www.linkedin.com/company/clicdata"
  },
  {
    name: "CXT Software",
    linkedinUrl: "https://www.linkedin.com/company/cxt-software"
  },
  {
    name: "Legix",
    linkedinUrl: "https://www.linkedin.com/company/legix-ai"
  },
  {
    name: "June.so",
    linkedinUrl: "https://www.linkedin.com/company/juneso"
  },
  {
    name: "Memora Health",
    linkedinUrl: "https://www.linkedin.com/company/memora-health"
  },
  {
    name: "PostHog",
    linkedinUrl: "https://www.linkedin.com/company/posthog"
  },
  {
    name: "M-Files Sverige",
    linkedinUrl: "https://www.linkedin.com/company/m-files-sverige"
  }
];

// Sales-focused buyer profile for Dan with USA-only
const SALES_BUYER_PROFILE = {
  primary: ['cro', 'chief revenue', 'vp sales', 'head of sales', 'sales operations', 'revenue operations'],
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
    'designer',
    'marketing',
    'hr',
    'recruiting',
    'legal',
    'finance',
    'accounting'
  ]
};

async function regenerateBuyerGroup(company, workspaceId, sellerId) {
  const { name: companyName, linkedinUrl } = company;
  
  console.log(`\n${'─'.repeat(60)}`);
  console.log(`🔄 Regenerating: ${companyName}`);
  console.log(`${'─'.repeat(60)}`);

  try {
    // Delete existing buyer group(s) for this company
    const deleted = await prisma.buyerGroups.deleteMany({
      where: {
        workspaceId: workspaceId,
        companyName: { contains: companyName, mode: 'insensitive' }
      }
    });
    console.log(`🗑️  Deleted ${deleted.count} existing buyer group(s)`);
    console.log(`🔗 LinkedIn: ${linkedinUrl}`);
    console.log(`🇺🇸 USA-only filter: ENABLED`);
    
    // Create pipeline options with USA-only filter
    const pipelineOptions = {
      linkedinUrl: linkedinUrl || companyName,
      dealSize: 75000,
      maxPages: 3,
      productCategory: 'sales',
      customFiltering: SALES_BUYER_PROFILE,
      workspaceId: workspaceId,
      sellerId: sellerId,
      usaOnly: true,  // 🇺🇸 KEY: USA-only filter enabled
      skipDatabase: false,
      prisma: prisma
    };

    // Run the pipeline
    const pipeline = new SmartBuyerGroupPipeline(pipelineOptions);
    
    const companyObj = {
      name: companyName,
      linkedinUrl: linkedinUrl?.includes('linkedin.com') ? linkedinUrl : null,
      website: linkedinUrl && !linkedinUrl.includes('linkedin.com') ? linkedinUrl : null
    };

    const result = await pipeline.run(companyObj);

    if (result && result.buyerGroup && result.buyerGroup.length > 0) {
      console.log(`✅ Generated ${result.buyerGroup.length} buyer group members (USA-only)`);
      
      // Verify no international phones in the generated data
      const membersWithPhones = result.buyerGroup.filter(m => m.phone);
      const internationalPhones = membersWithPhones.filter(m => {
        const cleaned = (m.phone || '').replace(/[\s\-\(\)\.]/g, '');
        return cleaned.startsWith('+') && !cleaned.startsWith('+1');
      });
      
      if (internationalPhones.length > 0) {
        console.log(`⚠️  Found ${internationalPhones.length} international phones in results - these should have been filtered`);
      }
      
      return { 
        company: companyName, 
        status: 'success', 
        count: result.buyerGroup.length 
      };
    } else {
      console.log(`⚠️  Pipeline returned no results`);
      return { company: companyName, status: 'no_results' };
    }
  } catch (error) {
    console.error(`❌ Error regenerating ${companyName}:`, error.message);
    return { company: companyName, status: 'error', error: error.message };
  }
}

async function main() {
  console.log('═'.repeat(70));
  console.log('🇺🇸 USA-ONLY BUYER GROUP REGENERATION');
  console.log('═'.repeat(70));
  console.log('');

  // Find Adrata workspace first
  const workspace = await prisma.workspaces.findFirst({
    where: { name: { contains: 'adrata', mode: 'insensitive' } }
  });

  if (!workspace) {
    console.error('❌ Could not find Adrata workspace');
    await prisma.$disconnect();
    return;
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
    console.error('❌ Could not find Dan user');
    await prisma.$disconnect();
    return;
  }

  const workspaceId = workspace.id;
  const sellerId = dan.id;

  console.log(`👤 Seller: ${dan.name || dan.firstName || 'Dan'}`);
  console.log(`🏢 Workspace: ${workspace.name}`);
  console.log(`📋 Companies to regenerate: ${COMPANIES_TO_REGENERATE.length}`);
  console.log('');

  const results = [];

  for (const company of COMPANIES_TO_REGENERATE) {
    const result = await regenerateBuyerGroup(company, workspaceId, sellerId);
    results.push(result);
    
    // Small delay between companies
    await new Promise(r => setTimeout(r, 2000));
  }

  console.log('\n');
  console.log('═'.repeat(70));
  console.log('📊 REGENERATION SUMMARY');
  console.log('═'.repeat(70));
  console.log('');

  const successful = results.filter(r => r.status === 'success');
  const failed = results.filter(r => r.status === 'error');
  const noResults = results.filter(r => r.status === 'no_results');

  console.log(`✅ Successful: ${successful.length}`);
  console.log(`❌ Failed: ${failed.length}`);
  console.log(`📭 No results: ${noResults.length}`);
  console.log('');

  if (successful.length > 0) {
    console.log('Successful regenerations:');
    for (const r of successful) {
      console.log(`  ✅ ${r.company}: ${r.count} members`);
    }
  }

  if (failed.length > 0) {
    console.log('\nFailed regenerations:');
    for (const r of failed) {
      console.log(`  ❌ ${r.company}: ${r.error}`);
    }
  }

  console.log('');
  console.log('═'.repeat(70));

  await prisma.$disconnect();
}

main().catch(console.error);
