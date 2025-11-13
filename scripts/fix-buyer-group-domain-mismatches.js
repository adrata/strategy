#!/usr/bin/env node

/**
 * Fix Buyer Group Domain Mismatches
 * 
 * This script identifies and fixes cases where people from different companies
 * (based on email domains) are incorrectly grouped in buyer groups.
 * 
 * Root Cause:
 * - CoreSignal searches by company name return ALL companies with that name
 * - Example: "Underline" returns underline.com, underline.cz, letsunderline.com.br
 * - Email domain validation was not strict enough during buyer group creation
 * 
 * Fix Strategy:
 * 1. Find all buyer group members with email domains that don't match company website
 * 2. Remove buyer group status from mismatched people
 * 3. Log all changes for review
 */

require('dotenv').config();
const { PrismaClient } = require('@prisma/client');
const fs = require('fs');

const prisma = new PrismaClient();

async function fixBuyerGroupDomainMismatches(options = {}) {
  const { dryRun = true } = options;
  
  console.log('\n' + '='.repeat(70));
  console.log('🔧 Fix Buyer Group Domain Mismatches');
  console.log('='.repeat(70));
  console.log(`Mode: ${dryRun ? 'DRY RUN (no changes)' : 'LIVE (will make changes)'}\n`);

  try {
    // Get all companies with buyer groups
    const companies = await prisma.companies.findMany({
      where: {
        deletedAt: null,
        people: {
          some: {
            deletedAt: null,
            isBuyerGroupMember: true
          }
        }
      },
      include: {
        people: {
          where: {
            deletedAt: null,
            isBuyerGroupMember: true
          }
        }
      }
    });

    console.log(`📊 Checking ${companies.length} companies with buyer groups\n`);

    const fixes = [];
    let totalChecked = 0;
    let totalMismatches = 0;

    for (const company of companies) {
      const companyDomain = extractDomain(company.website);
      
      if (!companyDomain) {
        console.log(`⚠️  Skipping ${company.name} - no website/domain`);
        continue;
      }

      for (const person of company.people) {
        totalChecked++;
        const email = person.email || person.workEmail;
        
        if (!email || !email.includes('@')) {
          continue;
        }

        const emailDomain = email.split('@')[1].toLowerCase();
        
        // Check if email domain matches company domain
        if (!domainsMatch(emailDomain, companyDomain)) {
          totalMismatches++;
          
          const fix = {
            personId: person.id,
            personName: person.fullName || `${person.firstName} ${person.lastName}`,
            email,
            emailDomain,
            companyId: company.id,
            companyName: company.name,
            companyWebsite: company.website,
            companyDomain,
            buyerGroupRole: person.buyerGroupRole,
            action: 'remove_from_buyer_group'
          };
          
          fixes.push(fix);
          
          console.log(`\n❌ MISMATCH FOUND:`);
          console.log(`   Person: ${fix.personName}`);
          console.log(`   Email: ${email} (domain: ${emailDomain})`);
          console.log(`   Assigned to: ${company.name} (domain: ${companyDomain})`);
          console.log(`   Role: ${person.buyerGroupRole || 'N/A'}`);
          
          // Check CoreSignal data for actual company
          if (person.coresignalData) {
            const coresignalData = person.coresignalData;
            const experience = coresignalData.experience || [];
            const currentExp = experience.find(e => e.active_experience === 1) || experience[0];
            
            if (currentExp) {
              console.log(`   CoreSignal Company: ${currentExp.company_name || 'N/A'}`);
              console.log(`   CoreSignal Website: ${currentExp.company_website || 'N/A'}`);
              fix.actualCompanyName = currentExp.company_name;
              fix.actualCompanyWebsite = currentExp.company_website;
            }
          }
          
          if (!dryRun) {
            // Remove from buyer group
            await prisma.people.update({
              where: { id: person.id },
              data: {
                isBuyerGroupMember: false,
                buyerGroupRole: null,
                buyerGroupInfluenceLevel: null,
                buyerGroupDecisionPower: null,
                buyerGroupEngagementLevel: null
              }
            });
            console.log(`   ✅ Removed from buyer group`);
          } else {
            console.log(`   🔍 Would remove from buyer group (dry run)`);
          }
        }
      }
    }

    // Print summary
    console.log('\n' + '='.repeat(70));
    console.log('📊 SUMMARY');
    console.log('='.repeat(70));
    console.log(`\nTotal buyer group members checked: ${totalChecked}`);
    console.log(`Mismatches found: ${totalMismatches}`);
    
    if (totalMismatches > 0) {
      console.log(`\n${dryRun ? '🔍' : '✅'} ${dryRun ? 'Would fix' : 'Fixed'} ${totalMismatches} mismatches\n`);
      
      // Group by company
      const byCompany = {};
      for (const fix of fixes) {
        if (!byCompany[fix.companyName]) {
          byCompany[fix.companyName] = [];
        }
        byCompany[fix.companyName].push(fix);
      }
      
      console.log('Affected companies:');
      for (const [companyName, companyFixes] of Object.entries(byCompany)) {
        console.log(`  - ${companyName}: ${companyFixes.length} people removed`);
      }
    } else {
      console.log(`\n✅ No domain mismatches found!`);
    }

    // Save detailed report
    const timestamp = Date.now();
    const reportPath = `./logs/buyer-group-domain-fix-${dryRun ? 'dry-run' : 'applied'}-${timestamp}.json`;
    fs.writeFileSync(reportPath, JSON.stringify({
      timestamp: new Date().toISOString(),
      dryRun,
      totalChecked,
      totalMismatches,
      fixes
    }, null, 2));
    console.log(`\n📄 Detailed report saved to: ${reportPath}\n`);

    if (dryRun) {
      console.log('💡 To apply these fixes, run with: node scripts/fix-buyer-group-domain-mismatches.js --apply\n');
    }

  } finally {
    await prisma.$disconnect();
  }
}

/**
 * Extract domain from URL
 */
function extractDomain(url) {
  if (!url) return null;
  const cleaned = url
    .replace(/^https?:\/\//, '')
    .replace(/^www\./, '')
    .split('/')[0]
    .toLowerCase();
  return cleaned;
}

/**
 * Check if two domains match
 * Accounts for:
 * - Exact matches (underline.com === underline.com)
 * - Subdomain matches (mail.underline.com matches underline.com)
 * Does NOT match:
 * - Different TLDs (underline.com !== underline.cz)
 * - Different base domains (underline.com !== letsunderline.com.br)
 */
function domainsMatch(domain1, domain2) {
  if (!domain1 || !domain2) return false;
  
  domain1 = domain1.toLowerCase();
  domain2 = domain2.toLowerCase();
  
  // Exact match
  if (domain1 === domain2) return true;
  
  // Check if one is a subdomain of the other
  // e.g., mail.underline.com should match underline.com
  // but underline.cz should NOT match underline.com
  const parts1 = domain1.split('.');
  const parts2 = domain2.split('.');
  
  // Need at least 2 parts for a valid domain (name.tld)
  if (parts1.length < 2 || parts2.length < 2) return false;
  
  // Get root domain (last 2 parts: domain.tld)
  const root1 = parts1.slice(-2).join('.');
  const root2 = parts2.slice(-2).join('.');
  
  // Root domains must match exactly (including TLD)
  // This ensures underline.com !== underline.cz
  return root1 === root2;
}

// Run the fix
if (require.main === module) {
  const args = process.argv.slice(2);
  const dryRun = !args.includes('--apply');
  
  fixBuyerGroupDomainMismatches({ dryRun }).catch(console.error);
}

module.exports = { fixBuyerGroupDomainMismatches };

