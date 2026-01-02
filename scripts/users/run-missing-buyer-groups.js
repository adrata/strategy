#!/usr/bin/env node

/**
 * Run Buyer Group Discovery for Noel's Companies WITHOUT Buyer Group Members
 * 
 * Matches configuration from run-notary-everyday-buyer-group.cjs
 * Only processes companies that don't have any people with buyerGroupRole set.
 * 
 * Usage: 
 *   node scripts/users/run-missing-buyer-groups.js
 *   node scripts/users/run-missing-buyer-groups.js --limit 10
 *   node scripts/users/run-missing-buyer-groups.js --company "Clearcover"
 */

const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../../.env.local') });
require('dotenv').config({ path: path.join(__dirname, '../../.env') });

const { PrismaClient } = require('@prisma/client');
const { SmartBuyerGroupPipeline } = require('../_future_now/find-buyer-group/index');

const prisma = new PrismaClient();

// Notary Everyday Configuration - matching run-notary-everyday-buyer-group.cjs
const NOTARY_EVERYDAY_CONFIG = {
  dealSize: 35000,
  dealSizeRange: { min: 15000, max: 50000 },
  productCategory: 'notary-automation',
  productName: 'Notary Quality & Automation Platform',
  productDescription: 'Comprehensive notary automation platform featuring Remote Online Notarization (RON), document workflow automation, compliance management, digital signature processing, mobile notary coordination, and audit trail management. Reduces closing time by 60%, eliminates compliance risks, and cuts notary costs by 40%.',
  pricing: {
    startingPrice: 299,
    pricingModel: 'Subscription-based with per-transaction fees',
    averageDealSize: 25000,
    maxDealSize: 150000,
    typicalSalesCycle: 45
  },
  valuePropositions: [
    'Reduce closing time by 60%',
    'Eliminate compliance risks',
    'Cut notary costs by 40%',
    'Streamline document workflow',
    'RON capability built-in',
    'Real-time audit trails',
    'Mobile-first design'
  ],
  primaryUseCases: [
    'Remote Online Notarization (RON)',
    'Document workflow automation',
    'Compliance management',
    'Digital signature processing',
    'Mobile notary coordination',
    'Audit trail management'
  ],
  buyerGroupSizing: {
    min: 4,
    max: 8,
    ideal: 6
  },
  rolePriorities: {
    decision: 10,
    champion: 9,
    stakeholder: 7,
    blocker: 5,
    introducer: 4
  },
  usaOnly: true
};

async function getCompaniesNeedingBuyerGroups() {
  // Find Noel using exact email (matching notary-everyday script)
  const noel = await prisma.users.findFirst({
    where: { email: 'noel@notaryeveryday.com' }
  });

  if (!noel) {
    throw new Error('Noel (noel@notaryeveryday.com) not found');
  }

  console.log(`✅ Found Noel: ${noel.name} (${noel.id})`);

  // Find workspace
  const workspace = await prisma.workspaces.findFirst({
    where: {
      OR: [
        { name: { contains: 'Notary Everyday', mode: 'insensitive' } },
        { slug: { contains: 'notary-everyday', mode: 'insensitive' } }
      ]
    }
  });

  if (!workspace) {
    throw new Error('Notary Everyday workspace not found');
  }

  console.log(`✅ Found Workspace: ${workspace.name} (${workspace.id})`);

  // Get all companies assigned to Noel
  const allCompanies = await prisma.companies.findMany({
    where: {
      workspaceId: workspace.id,
      mainSellerId: noel.id,
      deletedAt: null
    },
    select: {
      id: true,
      name: true,
      website: true,
      linkedinUrl: true,
      industry: true,
      city: true,
      state: true,
      employeeCount: true,
      revenue: true,
      notes: true
    },
    orderBy: { industry: 'asc' }
  });

  console.log(`📊 Total companies for Noel: ${allCompanies.length}`);

  // Get people with buyer group roles, grouped by company
  const peopleWithBGRoles = await prisma.people.findMany({
    where: {
      workspaceId: workspace.id,
      mainSellerId: noel.id,
      deletedAt: null,
      buyerGroupRole: { not: null }
    },
    select: {
      companyId: true
    }
  });

  const companiesWithPeople = new Set(peopleWithBGRoles.map(p => p.companyId).filter(Boolean));
  
  const companiesNeedingDiscovery = allCompanies.filter(c => !companiesWithPeople.has(c.id));

  console.log(`📊 Companies with buyer groups: ${companiesWithPeople.size}`);
  console.log(`📊 Companies needing discovery: ${companiesNeedingDiscovery.length}`);

  return { 
    companies: companiesNeedingDiscovery, 
    mainSellerId: noel.id,
    workspaceId: workspace.id 
  };
}

/**
 * Adjust configuration based on company industry
 * (Copied from run-notary-everyday-buyer-group.cjs)
 */
function adjustConfigForIndustry(industry) {
  const config = JSON.parse(JSON.stringify(NOTARY_EVERYDAY_CONFIG));
  const industryLower = (industry || '').toLowerCase();
  
  if (industryLower.includes('healthcare') || industryLower.includes('hospice')) {
    config.dealSize = 40000;
    config.productDescription = 'HIPAA-compliant notary automation platform for healthcare organizations. Streamlines patient consent forms, medical power of attorney, advance directives, and other critical healthcare document notarization. Ensures compliance with healthcare regulations while reducing administrative burden.';
    config.valuePropositions = [
      'HIPAA-compliant document notarization',
      'Reduce patient consent processing time by 50%',
      'Eliminate compliance risks with audit trails',
      'Mobile notary for patient bedside services',
      'Secure document storage and retrieval',
      'Integration with EMR systems'
    ];
  }
  
  if (industryLower.includes('estate planning') || industryLower.includes('trust')) {
    config.dealSize = 25000;
    config.productDescription = 'Specialized notary automation platform for estate planning law firms. Streamlines will execution, trust document notarization, power of attorney processing, and probate document management. Reduces client wait times and ensures compliance with state-specific notary requirements.';
    config.valuePropositions = [
      'Reduce will execution time by 60%',
      'Remote notarization for elderly clients',
      'State-specific compliance automation',
      'Secure document storage for estate documents',
      'Client portal for document access',
      'Reduce paralegal notarization workload by 50%'
    ];
  }
  
  if (industryLower.includes('legal') && !industryLower.includes('estate')) {
    config.dealSize = 35000;
    config.productDescription = 'Notary automation platform for legal firms handling mass tort and injury cases. Streamlines settlement document notarization, client intake forms, case management documents, and court filing requirements. Reduces administrative overhead and ensures timely document processing.';
    config.valuePropositions = [
      'Accelerate settlement document processing by 50%',
      'Mobile notary for client home visits',
      'Reduce case management administrative time',
      'Compliance with court filing requirements',
      'Secure client document management',
      'Integration with case management systems'
    ];
  }
  
  if (industryLower.includes('mortgage') || industryLower.includes('lending') || industryLower.includes('title')) {
    config.dealSize = 50000;
    config.productDescription = 'Complete notary automation platform for mortgage and lending operations. Enables hybrid closings, remote online notarization, document tracking, and compliance automation. Integrates with LOS and title production systems.';
    config.valuePropositions = [
      'Reduce loan closing time by 70%',
      'Enable hybrid and fully remote closings',
      'Compliance with TRID and state regulations',
      'Integration with LOS systems',
      'Real-time document tracking',
      'Mobile notary scheduling and dispatch'
    ];
  }
  
  return config;
}

async function runBuyerGroupDiscovery(company, mainSellerId, workspaceId, options = {}) {
  console.log('\n' + '='.repeat(70));
  console.log(`🏢 ${company.name}`);
  console.log(`   📍 ${company.city || 'N/A'}, ${company.state || 'N/A'}`);
  console.log(`   🏷️  ${company.industry || 'Unknown Industry'}`);
  console.log(`   🌐 ${company.website || 'No website'}`);
  console.log('='.repeat(70));

  try {
    // Get industry-specific configuration
    const config = adjustConfigForIndustry(company.industry);

    const pipeline = new SmartBuyerGroupPipeline({
      workspaceId: workspaceId,
      mainSellerId: mainSellerId,
      dealSize: config.dealSize,
      productCategory: config.productCategory,
      productName: config.productName,
      productDescription: config.productDescription,
      pricing: config.pricing,
      valuePropositions: config.valuePropositions,
      primaryUseCases: config.primaryUseCases,
      buyerGroupSize: config.buyerGroupSizing,
      rolePriorities: config.rolePriorities,
      usaOnly: config.usaOnly,
      prisma: prisma,
      skipDatabase: options.skipDatabase || false
    });

    const result = await pipeline.run(company);

    if (result && result.buyerGroup && result.buyerGroup.length > 0) {
      console.log(`\n✅ Found ${result.buyerGroup.length} buyer group members:`);
      
      result.buyerGroup.forEach((member, i) => {
        const role = member.buyerGroupRole || 'stakeholder';
        const roleEmoji = {
          decision: '👔',
          champion: '⭐',
          stakeholder: '👤',
          blocker: '🚧',
          introducer: '🤝'
        }[role] || '👤';
        
        console.log(`   ${i + 1}. ${roleEmoji} ${member.name} - ${member.title}`);
        if (member.email) console.log(`      📧 ${member.email}`);
        if (member.linkedinUrl) console.log(`      🔗 ${member.linkedinUrl}`);
      });

      return { success: true, membersFound: result.buyerGroup.length };
    } else {
      console.log(`\n⚠️ No buyer group members found`);
      return { success: false, membersFound: 0 };
    }
  } catch (error) {
    console.error(`\n❌ Error: ${error.message}`);
    return { success: false, error: error.message };
  }
}

async function main() {
  console.log('\n' + '═'.repeat(70));
  console.log('   NOTARY EVERYDAY - BUYER GROUP DISCOVERY');
  console.log('   For Companies Without Buyer Group Members');
  console.log('═'.repeat(70) + '\n');

  // Parse command line arguments
  const args = process.argv.slice(2);
  const options = {
    limit: null,
    company: null,
    skipDatabase: false
  };

  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--limit' && args[i + 1]) {
      options.limit = parseInt(args[i + 1]);
      i++;
    } else if (args[i] === '--company' && args[i + 1]) {
      options.company = args[i + 1];
      i++;
    } else if (args[i] === '--skip-db') {
      options.skipDatabase = true;
    }
  }

  try {
    const { companies, mainSellerId, workspaceId } = await getCompaniesNeedingBuyerGroups();

    let targetCompanies = companies;

    // Filter to specific company if requested
    if (options.company) {
      targetCompanies = companies.filter(c => 
        c.name.toLowerCase().includes(options.company.toLowerCase())
      );
      if (targetCompanies.length === 0) {
        console.error(`\n❌ Company not found: ${options.company}`);
        console.log('\nCompanies needing discovery:');
        companies.slice(0, 15).forEach(c => console.log(`  - ${c.name} (${c.industry || 'Unknown'})`));
        process.exit(1);
      }
      console.log(`\n🎯 Running for specific company: ${targetCompanies[0].name}`);
    }

    // Apply limit if specified
    if (options.limit) {
      targetCompanies = targetCompanies.slice(0, options.limit);
      console.log(`📋 Limited to first ${options.limit} companies`);
    }

    console.log(`\n📊 Will process ${targetCompanies.length} companies\n`);

    const stats = {
      total: targetCompanies.length,
      success: 0,
      failed: 0,
      totalMembers: 0
    };

    for (let i = 0; i < targetCompanies.length; i++) {
      const company = targetCompanies[i];
      console.log(`\n[${i + 1}/${targetCompanies.length}] Processing ${company.name}...`);

      const result = await runBuyerGroupDiscovery(company, mainSellerId, workspaceId, options);

      if (result.success) {
        stats.success++;
        stats.totalMembers += result.membersFound;
      } else {
        stats.failed++;
      }

      // Rate limiting between companies
      if (i < targetCompanies.length - 1) {
        console.log('\n⏳ Waiting 2 seconds before next company...');
        await new Promise(r => setTimeout(r, 2000));
      }
    }

    console.log('\n' + '═'.repeat(70));
    console.log('   BUYER GROUP DISCOVERY COMPLETE');
    console.log('═'.repeat(70));
    console.log(`\n📊 RESULTS:`);
    console.log(`   Companies processed: ${stats.total}`);
    console.log(`   Successful: ${stats.success}`);
    console.log(`   Failed: ${stats.failed}`);
    console.log(`   Total members found: ${stats.totalMembers}`);
    console.log('');

  } catch (error) {
    console.error('\n❌ Fatal error:', error.message);
    console.error(error.stack);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main().catch(console.error);
