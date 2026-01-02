const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function generateReport() {
  const workspaceId = '01K7DNYR5VZ7JY36KGKKN76XZ1';
  
  const noel = await prisma.users.findFirst({
    where: { email: { contains: 'noel', mode: 'insensitive' } }
  });

  console.log('\n');
  console.log('╔═══════════════════════════════════════════════════════════════════════════════╗');
  console.log('║                    CLIENT-READY BUYER GROUP REPORT                          ║');
  console.log('║                         Noel Serrato - Adrata                               ║');
  console.log('╚═══════════════════════════════════════════════════════════════════════════════╝');
  console.log('');

  // Get all buyer groups
  const buyerGroups = await prisma.buyerGroups.findMany({
    where: { workspaceId },
    orderBy: { createdAt: 'desc' }
  });

  // Get all buyer group members
  const allMembers = await prisma.buyerGroupMembers.findMany({
    where: {
      buyerGroupId: { in: buyerGroups.map(bg => bg.id) }
    }
  });

  // Get all people in buyer groups
  const peopleInBGs = await prisma.people.findMany({
    where: {
      workspaceId,
      mainSellerId: noel.id,
      deletedAt: null,
      buyerGroupRole: { not: null }
    },
    include: {
      company: {
        select: {
          id: true,
          name: true,
          website: true,
          industry: true
        }
      }
    }
  });

  // Calculate stats
  const withEmail = peopleInBGs.filter(p => p.email || p.workEmail).length;
  const withPhone = peopleInBGs.filter(p => p.phone || p.workPhone || p.mobilePhone).length;
  const withLinkedIn = peopleInBGs.filter(p => p.linkedinUrl).length;
  const withJobTitle = peopleInBGs.filter(p => p.jobTitle).length;
  const withCompany = peopleInBGs.filter(p => p.companyId).length;

  // Role distribution
  const roleStats = await prisma.people.groupBy({
    by: ['buyerGroupRole'],
    where: {
      workspaceId,
      mainSellerId: noel.id,
      deletedAt: null,
      buyerGroupRole: { not: null }
    },
    _count: true
  });

  // Companies by vertical
  const companies = await prisma.companies.findMany({
    where: {
      workspaceId,
      mainSellerId: noel.id,
      deletedAt: null
    },
    select: {
      customFields: true,
      industry: true
    }
  });

  const verticalCounts = {};
  companies.forEach(c => {
    const vertical = c.customFields?.vertical || c.industry || 'Other';
    verticalCounts[vertical] = (verticalCounts[vertical] || 0) + 1;
  });

  console.log('📊 EXECUTIVE SUMMARY');
  console.log('─────────────────────────────────────────────────────────────────────────────');
  console.log('');
  console.log(`   ✅ ${buyerGroups.length} Buyer Groups Identified`);
  console.log(`   ✅ ${peopleInBGs.length} Key Decision Makers & Influencers`);
  console.log(`   ✅ ${allMembers.length} Total Buyer Group Members`);
  console.log(`   ✅ ${companies.length} Target Companies`);
  console.log('');

  console.log('🎯 BUYER GROUP COMPOSITION');
  console.log('─────────────────────────────────────────────────────────────────────────────');
  console.log('');
  roleStats.sort((a, b) => {
    const priorityA = { decision: 1, champion: 2, stakeholder: 3, blocker: 4, introducer: 5 }[a.buyerGroupRole] || 999;
    const priorityB = { decision: 1, champion: 2, stakeholder: 3, blocker: 4, introducer: 5 }[b.buyerGroupRole] || 999;
    return priorityA - priorityB;
  }).forEach(r => {
    const roleName = r.buyerGroupRole === 'decision' ? 'Decision Makers' :
                     r.buyerGroupRole === 'champion' ? 'Champions' :
                     r.buyerGroupRole.charAt(0).toUpperCase() + r.buyerGroupRole.slice(1) + 's';
    console.log(`   • ${roleName}: ${r._count}`);
  });
  console.log('');

  console.log('📧 CONTACT DATA COVERAGE');
  console.log('─────────────────────────────────────────────────────────────────────────────');
  console.log('');
  console.log(`   • Email Coverage: ${withEmail}/${peopleInBGs.length} (${((withEmail / peopleInBGs.length) * 100).toFixed(1)}%)`);
  console.log(`   • Phone Coverage: ${withPhone}/${peopleInBGs.length} (${((withPhone / peopleInBGs.length) * 100).toFixed(1)}%)`);
  console.log(`   • LinkedIn Coverage: ${withLinkedIn}/${peopleInBGs.length} (${((withLinkedIn / peopleInBGs.length) * 100).toFixed(1)}%)`);
  console.log(`   • Job Title Coverage: ${withJobTitle}/${peopleInBGs.length} (${((withJobTitle / peopleInBGs.length) * 100).toFixed(1)}%)`);
  console.log(`   • Company Association: ${withCompany}/${peopleInBGs.length} (${((withCompany / peopleInBGs.length) * 100).toFixed(1)}%)`);
  console.log('');

  // Calculate overall completeness
  const avgCompleteness = (
    (withEmail / peopleInBGs.length) * 0.3 +
    (withPhone / peopleInBGs.length) * 0.3 +
    (withLinkedIn / peopleInBGs.length) * 0.2 +
    (withJobTitle / peopleInBGs.length) * 0.1 +
    (withCompany / peopleInBGs.length) * 0.1
  ) * 100;

  console.log(`   📊 Overall Data Completeness: ${avgCompleteness.toFixed(1)}%`);
  console.log('');

  console.log('🏢 TARGET COMPANIES BY VERTICAL');
  console.log('─────────────────────────────────────────────────────────────────────────────');
  console.log('');
  Object.entries(verticalCounts)
    .sort((a, b) => b[1] - a[1])
    .forEach(([v, c]) => {
      const displayName = v.replace('_smb', '').replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
      console.log(`   • ${displayName}: ${c} companies`);
    });
  console.log('');

  // Top buyer groups by member count
  const bgWithMemberCounts = buyerGroups.map(bg => ({
    ...bg,
    memberCount: allMembers.filter(m => m.buyerGroupId === bg.id).length
  })).sort((a, b) => b.memberCount - a.memberCount);

  console.log('⭐ TOP 10 BUYER GROUPS (by member count)');
  console.log('─────────────────────────────────────────────────────────────────────────────');
  console.log('');
  bgWithMemberCounts.slice(0, 10).forEach((bg, idx) => {
    const members = allMembers.filter(m => m.buyerGroupId === bg.id);
    const decisionMakers = members.filter(m => m.role === 'decision').length;
    const champions = members.filter(m => m.role === 'champion').length;
    console.log(`   ${idx + 1}. ${bg.companyName}`);
    console.log(`      ${members.length} members (${decisionMakers} decision makers, ${champions} champions)`);
  });
  console.log('');

  // Quality assessment
  console.log('✅ QUALITY ASSESSMENT');
  console.log('─────────────────────────────────────────────────────────────────────────────');
  console.log('');
  
  if (avgCompleteness >= 80) {
    console.log('   ✅ EXCELLENT - Data quality is client-ready!');
  } else if (avgCompleteness >= 60) {
    console.log('   ⚠️  GOOD - Data quality is acceptable but could be improved');
  } else {
    console.log('   ⚠️  NEEDS IMPROVEMENT - Consider running enrichment');
  }
  
  console.log('');
  console.log('   Key Strengths:');
  console.log(`   • ${withLinkedIn} people have LinkedIn profiles (${((withLinkedIn / peopleInBGs.length) * 100).toFixed(0)}%)`);
  console.log(`   • ${withJobTitle} people have job titles (${((withJobTitle / peopleInBGs.length) * 100).toFixed(0)}%)`);
  console.log(`   • ${withCompany} people are linked to companies (${((withCompany / peopleInBGs.length) * 100).toFixed(0)}%)`);
  console.log('');
  
  if (withEmail < peopleInBGs.length * 0.8) {
    console.log(`   ⚠️  Opportunity: ${peopleInBGs.length - withEmail} people missing email addresses`);
  }
  if (withPhone < peopleInBGs.length * 0.5) {
    console.log(`   ⚠️  Opportunity: ${peopleInBGs.length - withPhone} people missing phone numbers`);
  }
  console.log('');

  console.log('╔═══════════════════════════════════════════════════════════════════════════════╗');
  console.log('║                         END OF REPORT                                         ║');
  console.log('╚═══════════════════════════════════════════════════════════════════════════════╝');
  console.log('');

  await prisma.$disconnect();
}

generateReport().catch(console.error);
