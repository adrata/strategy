#!/usr/bin/env node

/**
 * 🔍 CHECK ALL DOMAIN MISMATCHES IN BUYER GROUPS
 * 
 * Finds all people in buyer groups where their email domain
 * doesn't match their company's domain
 */

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

/**
 * Extract domain from email or URL
 */
function extractDomain(input) {
  if (!input) return null;
  const url = input.replace(/^https?:\/\//, '').replace(/^www\./, '').split('/')[0];
  return url.toLowerCase();
}

/**
 * Strict domain matching - TLD must match exactly
 */
function domainsMatchStrict(emailDomain, companyDomain) {
  if (!emailDomain || !companyDomain) return false;
  
  // Extract root domains (handle subdomains)
  const emailRoot = emailDomain.split('.').slice(-2).join('.');
  const companyRoot = companyDomain.split('.').slice(-2).join('.');
  
  return emailRoot === companyRoot;
}

async function checkAllMismatches() {
  try {
    console.log('🔍 CHECKING ALL BUYER GROUP DOMAIN MISMATCHES');
    console.log('='.repeat(60));
    console.log('');

    // Get all people in buyer groups with their companies
    const buyerGroupMembers = await prisma.people.findMany({
      where: {
        isBuyerGroupMember: true,
        deletedAt: null,
        companyId: { not: null }
      },
      include: {
        company: {
          select: {
            id: true,
            name: true,
            website: true,
            domain: true
          }
        },
        workspace: {
          select: {
            id: true,
            name: true,
            slug: true
          }
        }
      }
    });

    console.log(`📊 Found ${buyerGroupMembers.length} buyer group members to check\n`);

    const mismatches = [];
    const noEmail = [];
    const noCompanyDomain = [];

    for (const person of buyerGroupMembers) {
      const personEmail = person.email || person.workEmail;
      const emailDomain = personEmail ? extractDomain(personEmail.split('@')[1]) : null;
      const companyDomain = extractDomain(person.company?.website || person.company?.domain);

      if (!personEmail) {
        noEmail.push({
          person,
          reason: 'No email found'
        });
        continue;
      }

      if (!companyDomain) {
        noCompanyDomain.push({
          person,
          reason: 'No company domain found'
        });
        continue;
      }

      if (!domainsMatchStrict(emailDomain, companyDomain)) {
        mismatches.push({
          person,
          emailDomain,
          companyDomain,
          companyName: person.company?.name
        });
      }
    }

    console.log('📊 RESULTS:');
    console.log(`   ✅ Valid: ${buyerGroupMembers.length - mismatches.length - noEmail.length - noCompanyDomain.length}`);
    console.log(`   ❌ Domain Mismatches: ${mismatches.length}`);
    console.log(`   ⚠️  No Email: ${noEmail.length}`);
    console.log(`   ⚠️  No Company Domain: ${noCompanyDomain.length}`);
    console.log('');

    if (mismatches.length > 0) {
      console.log('❌ DOMAIN MISMATCHES FOUND:');
      console.log('');
      
      // Group by workspace
      const byWorkspace = {};
      mismatches.forEach(m => {
        const wsName = m.person.workspace.name;
        if (!byWorkspace[wsName]) {
          byWorkspace[wsName] = [];
        }
        byWorkspace[wsName].push(m);
      });

      for (const [workspaceName, wsMismatches] of Object.entries(byWorkspace)) {
        console.log(`📍 ${workspaceName}: ${wsMismatches.length} mismatches`);
        
        wsMismatches.forEach(m => {
          console.log(`   ❌ ${m.person.fullName}`);
          console.log(`      Email: ${m.person.email || m.person.workEmail}`);
          console.log(`      Email Domain: ${m.emailDomain}`);
          console.log(`      Company: ${m.companyName}`);
          console.log(`      Company Domain: ${m.companyDomain}`);
          console.log(`      Role: ${m.person.buyerGroupRole || 'N/A'}`);
          console.log(`      Person ID: ${m.person.id}`);
          console.log('');
        });
      }

      console.log('💡 To fix all mismatches, run:');
      console.log('   node scripts/fix-all-domain-mismatches.js --fix');
    } else {
      console.log('✅ No domain mismatches found!');
    }

    if (noEmail.length > 0) {
      console.log('');
      console.log('⚠️  PEOPLE WITHOUT EMAIL:');
      noEmail.slice(0, 10).forEach(m => {
        console.log(`   - ${m.person.fullName} (${m.person.workspace.name})`);
      });
      if (noEmail.length > 10) {
        console.log(`   ... and ${noEmail.length - 10} more`);
      }
    }

    if (noCompanyDomain.length > 0) {
      console.log('');
      console.log('⚠️  COMPANIES WITHOUT DOMAIN:');
      noCompanyDomain.slice(0, 10).forEach(m => {
        console.log(`   - ${m.person.company?.name || 'Unknown'} (${m.person.workspace.name})`);
      });
      if (noCompanyDomain.length > 10) {
        console.log(`   ... and ${noCompanyDomain.length - 10} more`);
      }
    }

    console.log('');
    console.log('='.repeat(60));
    console.log('✅ CHECK COMPLETE');

  } catch (error) {
    console.error('❌ Error:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

checkAllMismatches().catch(console.error);

