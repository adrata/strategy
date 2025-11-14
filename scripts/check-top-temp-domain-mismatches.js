#!/usr/bin/env node

/**
 * 🔍 CHECK DOMAIN MISMATCHES IN TOP TEMP WORKSPACE
 * 
 * Finds all people in buyer groups where their email domain
 * doesn't match their company's domain in the Top Temp workspace
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

async function checkTopTempMismatches() {
  try {
    console.log('🔍 CHECKING DOMAIN MISMATCHES IN TOP TEMP WORKSPACE');
    console.log('='.repeat(60));
    console.log('');

    // Find Top Temp workspace
    const workspace = await prisma.workspaces.findFirst({
      where: {
        OR: [
          { slug: 'top-temp' },
          { name: { contains: 'Top Temp', mode: 'insensitive' } }
        ]
      }
    });

    if (!workspace) {
      console.log('❌ Top Temp workspace not found');
      return;
    }

    console.log(`📍 Workspace: ${workspace.name} (${workspace.slug})`);
    console.log(`   ID: ${workspace.id}`);
    console.log('');

    // Get all people in buyer groups with their companies
    const buyerGroupMembers = await prisma.people.findMany({
      where: {
        workspaceId: workspace.id,
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
        }
      },
      orderBy: {
        fullName: 'asc'
      }
    });

    console.log(`📊 Found ${buyerGroupMembers.length} buyer group members to check\n`);

    const mismatches = [];
    const noEmail = [];
    const noCompanyDomain = [];
    const valid = [];

    for (const person of buyerGroupMembers) {
      const personEmail = person.email || person.workEmail;
      const emailDomain = personEmail ? extractDomain(personEmail.split('@')[1]) : null;
      const companyDomain = extractDomain(person.company?.website || person.company?.domain);

      if (!personEmail) {
        noEmail.push(person);
        continue;
      }

      if (!companyDomain) {
        noCompanyDomain.push(person);
        continue;
      }

      if (!domainsMatchStrict(emailDomain, companyDomain)) {
        mismatches.push({
          person,
          emailDomain,
          companyDomain,
          companyName: person.company?.name
        });
      } else {
        valid.push(person);
      }
    }

    console.log('📊 RESULTS:');
    console.log(`   ✅ Valid: ${valid.length}`);
    console.log(`   ❌ Domain Mismatches: ${mismatches.length}`);
    console.log(`   ⚠️  No Email: ${noEmail.length}`);
    console.log(`   ⚠️  No Company Domain: ${noCompanyDomain.length}`);
    console.log('');

    if (mismatches.length > 0) {
      console.log('❌ DOMAIN MISMATCHES FOUND:');
      console.log('');
      
      // Group by company
      const byCompany = {};
      mismatches.forEach(m => {
        const companyName = m.companyName || 'Unknown';
        if (!byCompany[companyName]) {
          byCompany[companyName] = [];
        }
        byCompany[companyName].push(m);
      });

      for (const [companyName, companyMismatches] of Object.entries(byCompany)) {
        console.log(`📍 ${companyName}: ${companyMismatches.length} mismatch(es)`);
        
        companyMismatches.forEach(m => {
          console.log(`   ❌ ${m.person.fullName}`);
          console.log(`      Email: ${m.person.email || m.person.workEmail}`);
          console.log(`      Email Domain: ${m.emailDomain}`);
          console.log(`      Company Domain: ${m.companyDomain}`);
          console.log(`      Role: ${m.person.buyerGroupRole || 'N/A'}`);
          console.log(`      Person ID: ${m.person.id}`);
          console.log('');
        });
      }

      console.log('💡 To fix all mismatches in Top Temp, run:');
      console.log('   node scripts/fix-top-temp-domain-mismatches.js --fix');
    } else {
      console.log('✅ No domain mismatches found in Top Temp workspace!');
    }

    if (noEmail.length > 0) {
      console.log('');
      console.log('⚠️  PEOPLE WITHOUT EMAIL:');
      noEmail.forEach(m => {
        console.log(`   - ${m.fullName} (Company: ${m.company?.name || 'Unknown'})`);
      });
    }

    if (noCompanyDomain.length > 0) {
      console.log('');
      console.log('⚠️  COMPANIES WITHOUT DOMAIN:');
      const uniqueCompanies = new Set();
      noCompanyDomain.forEach(m => {
        const companyName = m.company?.name || 'Unknown';
        if (!uniqueCompanies.has(companyName)) {
          uniqueCompanies.add(companyName);
          console.log(`   - ${companyName}`);
        }
      });
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

checkTopTempMismatches().catch(console.error);

