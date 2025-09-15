#!/usr/bin/env node

/**
 * 🔍 NOTARY EVERYDAY PROSPECTS AUDIT
 * 
 * Audits the prospects in the Notary Everyday workspace to verify
 * the expected count of 394 prospects and identify any discrepancies.
 */

const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

// Notary Everyday workspace ID (from the search results)
const NOTARY_WORKSPACE_ID = '01K1VBYmf75hgmvmz06psnc9ug';

async function auditNotaryProspects() {
  try {
    console.log('🔍 AUDITING NOTARY EVERYDAY PROSPECTS\n');
    console.log(`Workspace ID: ${NOTARY_WORKSPACE_ID}`);
    console.log('Expected count: 394 prospects\n');

    // Get workspace info
    const workspace = await prisma.workspace.findUnique({
      where: { id: NOTARY_WORKSPACE_ID },
      select: {
        id: true,
        name: true,
        slug: true,
        createdAt: true
      }
    });

    if (!workspace) {
      console.log('❌ Notary Everyday workspace not found!');
      return;
    }

    console.log(`📋 Workspace: ${workspace.name} (${workspace.slug})`);
    console.log(`📅 Created: ${workspace.createdAt}\n`);

    // Get all prospects in the workspace
    const prospects = await prisma.prospect.findMany({
      where: {
        workspaceId: NOTARY_WORKSPACE_ID,
        deletedAt: null
      },
      select: {
        id: true,
        fullName: true,
        company: true,
        email: true,
        workEmail: true,
        personalEmail: true,
        phone: true,
        jobTitle: true,
        state: true,
        city: true,
        createdAt: true,
        updatedAt: true,
        personId: true,
        leadId: true
      },
      orderBy: { createdAt: 'desc' }
    });

    const actualCount = prospects.length;
    const expectedCount = 394;
    const difference = actualCount - expectedCount;

    console.log('📊 PROSPECT COUNT ANALYSIS:');
    console.log(`  Expected: ${expectedCount}`);
    console.log(`  Actual:   ${actualCount}`);
    console.log(`  Difference: ${difference > 0 ? '+' : ''}${difference}`);

    if (difference === 0) {
      console.log('✅ Count matches expected!');
    } else if (difference > 0) {
      console.log(`⚠️  Found ${difference} MORE prospects than expected`);
    } else {
      console.log(`⚠️  Found ${Math.abs(difference)} FEWER prospects than expected`);
    }

    // Analyze prospect data quality
    console.log('\n🔍 DATA QUALITY ANALYSIS:');

    const prospectsWithoutPerson = prospects.filter(p => !p.personId);
    const prospectsWithoutLead = prospects.filter(p => !p.leadId);
    const prospectsWithoutEmail = prospects.filter(p => !p.email && !p.workEmail && !p.personalEmail);
    const prospectsWithoutCompany = prospects.filter(p => !p.company);

    console.log(`  Prospects without personId: ${prospectsWithoutPerson.length}`);
    console.log(`  Prospects without leadId: ${prospectsWithoutLead.length}`);
    console.log(`  Prospects without email: ${prospectsWithoutEmail.length}`);
    console.log(`  Prospects without company: ${prospectsWithoutCompany.length}`);

    // Check for duplicates by email
    const emailMap = new Map();
    const duplicateEmails = [];

    prospects.forEach(prospect => {
      const emails = [prospect.email, prospect.workEmail, prospect.personalEmail].filter(Boolean);
      emails.forEach(email => {
        if (emailMap.has(email)) {
          duplicateEmails.push({ email, prospect1: emailMap.get(email), prospect2: prospect });
        } else {
          emailMap.set(email, prospect);
        }
      });
    });

    console.log(`  Duplicate emails found: ${duplicateEmails.length}`);

    // Show sample prospects
    console.log('\n📋 SAMPLE PROSPECTS (First 10):');
    prospects.slice(0, 10).forEach((prospect, index) => {
      console.log(`${index + 1}. ${prospect.fullName || 'No name'}`);
      console.log(`   Company: ${prospect.company || 'No company'}`);
      console.log(`   Email: ${prospect.email || prospect.workEmail || prospect.personalEmail || 'No email'}`);
      console.log(`   Title: ${prospect.jobTitle || 'No title'}`);
      console.log(`   Location: ${prospect.city || 'No city'}, ${prospect.state || 'No state'}`);
      console.log(`   PersonId: ${prospect.personId || 'None'}`);
      console.log(`   LeadId: ${prospect.leadId || 'None'}`);
      console.log(`   Created: ${prospect.createdAt}`);
      console.log('');
    });

    // Show recent prospects if count is higher than expected
    if (difference > 0) {
      console.log('📅 RECENT PROSPECTS (Last 10):');
      prospects.slice(-10).forEach((prospect, index) => {
        console.log(`${index + 1}. ${prospect.fullName || 'No name'} - ${prospect.createdAt}`);
      });
    }

    // Check for prospects that might be misclassified
    console.log('\n🔍 CLASSIFICATION ANALYSIS:');
    
    // Check if any prospects have company names that look like departments
    const departmentLikeCompanies = prospects.filter(p => 
      p.company && (
        p.company.toLowerCase().includes('department') ||
        p.company.toLowerCase().includes('division') ||
        p.company.toLowerCase().includes('team') ||
        p.company.toLowerCase().includes('group')
      )
    );

    console.log(`  Prospects with department-like company names: ${departmentLikeCompanies.length}`);
    if (departmentLikeCompanies.length > 0) {
      console.log('  Sample department-like companies:');
      departmentLikeCompanies.slice(0, 5).forEach(p => {
        console.log(`    - ${p.company} (${p.fullName})`);
      });
    }

    // Check for prospects with very generic company names
    const genericCompanies = prospects.filter(p => 
      p.company && (
        p.company.toLowerCase().includes('company') ||
        p.company.toLowerCase().includes('corp') ||
        p.company.toLowerCase().includes('inc') ||
        p.company.toLowerCase().includes('llc')
      )
    );

    console.log(`  Prospects with generic company names: ${genericCompanies.length}`);

    // Summary
    console.log('\n📊 AUDIT SUMMARY:');
    console.log(`  Total prospects: ${actualCount}`);
    console.log(`  Expected: ${expectedCount}`);
    console.log(`  Status: ${difference === 0 ? '✅ MATCH' : difference > 0 ? '⚠️  OVER' : '⚠️  UNDER'}`);
    
    if (difference !== 0) {
      console.log(`  Recommendation: ${difference > 0 ? 'Investigate extra prospects' : 'Check for missing prospects'}`);
    }

    return {
      workspace,
      expectedCount,
      actualCount,
      difference,
      prospects,
      dataQuality: {
        withoutPerson: prospectsWithoutPerson.length,
        withoutLead: prospectsWithoutLead.length,
        withoutEmail: prospectsWithoutEmail.length,
        withoutCompany: prospectsWithoutCompany.length,
        duplicateEmails: duplicateEmails.length
      }
    };

  } catch (error) {
    console.error('❌ Error auditing Notary Everyday prospects:', error);
    return null;
  } finally {
    await prisma.$disconnect();
  }
}

// Run the audit
if (require.main === module) {
  auditNotaryProspects()
    .then(result => {
      if (result) {
        console.log('\n🎯 Audit completed successfully!');
        process.exit(0);
      } else {
        console.log('\n❌ Audit failed!');
        process.exit(1);
      }
    })
    .catch(error => {
      console.error('❌ Fatal error:', error);
      process.exit(1);
    });
}

module.exports = { auditNotaryProspects };
