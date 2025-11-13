#!/usr/bin/env node

/**
 * Cleanup Domain Mismatches in Buyer Groups
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
 * 
 * Target: TOP workspace (01K75ZD7DWHG1XF16HAF2YVKCK)
 */

require('dotenv').config();
const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const path = require('path');

const prisma = new PrismaClient();

const TOP_WORKSPACE_ID = '01K75ZD7DWHG1XF16HAF2YVKCK';

async function cleanupDomainMismatches(options = {}) {
  const { dryRun = true, workspaceId = TOP_WORKSPACE_ID } = options;
  
  console.log('\n' + '='.repeat(70));
  console.log('🔧 Cleanup Domain Mismatches in Buyer Groups');
  console.log('='.repeat(70));
  console.log(`Workspace: ${workspaceId}`);
  console.log(`Mode: ${dryRun ? 'DRY RUN (no changes)' : 'LIVE (will make changes)'}\n`);

  try {
    // Get all companies with buyer groups in the workspace
    const companies = await prisma.companies.findMany({
      where: {
        workspaceId,
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

      console.log(`\n🔍 Checking: ${company.name} (${companyDomain})`);
      console.log(`   Buyer group members: ${company.people.length}`);

      for (const person of company.people) {
        totalChecked++;
        const email = person.email || person.workEmail;
        
        if (!email || !email.includes('@')) {
          console.log(`   ⚠️  ${person.fullName || person.firstName} - no email to validate`);
          continue;
        }

        const emailDomain = email.split('@')[1].toLowerCase();
        
        // Check if email domain matches company domain
        if (!domainsMatchStrict(emailDomain, companyDomain)) {
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
          
          console.log(`   ❌ MISMATCH: ${fix.personName}`);
          console.log(`      Email: ${email} (domain: ${emailDomain})`);
          console.log(`      Expected: ${companyDomain}`);
          console.log(`      Role: ${person.buyerGroupRole || 'N/A'}`);
          
          // Check CoreSignal data for actual company
          if (person.coresignalData) {
            const coresignalData = person.coresignalData;
            const experience = coresignalData.experience || [];
            const currentExp = experience.find(e => e.active_experience === 1) || experience[0];
            
            if (currentExp) {
              console.log(`      Actual company (CoreSignal): ${currentExp.company_name || 'N/A'}`);
              console.log(`      Actual website (CoreSignal): ${currentExp.company_website || 'N/A'}`);
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
                buyerGroupRole: null
              }
            });
            console.log(`      ✅ Removed from buyer group`);
          } else {
            console.log(`      🔍 Would remove from buyer group (dry run)`);
          }
        } else {
          console.log(`   ✅ ${person.fullName || person.firstName} - domain matches`);
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
        companyFixes.forEach(fix => {
          console.log(`    - ${fix.personName} (${fix.emailDomain} != ${fix.companyDomain})`);
        });
      }
    } else {
      console.log(`\n✅ No domain mismatches found!`);
    }

    // Save detailed report
    const timestamp = Date.now();
    const logsDir = path.join(__dirname, '../../../logs');
    
    // Ensure logs directory exists
    if (!fs.existsSync(logsDir)) {
      fs.mkdirSync(logsDir, { recursive: true });
    }
    
    const reportPath = path.join(logsDir, `buyer-group-domain-cleanup-${dryRun ? 'dry-run' : 'applied'}-${timestamp}.json`);
    fs.writeFileSync(reportPath, JSON.stringify({
      timestamp: new Date().toISOString(),
      workspaceId,
      dryRun,
      totalChecked,
      totalMismatches,
      fixes
    }, null, 2));
    console.log(`\n📄 Detailed report saved to: ${reportPath}\n`);

    if (dryRun && totalMismatches > 0) {
      console.log('💡 To apply these fixes, run with: node scripts/_future_now/find-buyer-group/cleanup-domain-mismatches.js --apply\n');
    } else if (!dryRun && totalMismatches > 0) {
      console.log('✅ Cleanup complete! All domain mismatches have been fixed.\n');
    }

    return {
      totalChecked,
      totalMismatches,
      fixes
    };

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
 * Strict domain matching for email validation
 * Ensures exact root domain match (including TLD)
 * @param {string} emailDomain - Email domain (e.g., 'underline.cz')
 * @param {string} companyDomain - Company domain (e.g., 'underline.com')
 * @returns {boolean} True if domains match exactly
 */
function domainsMatchStrict(emailDomain, companyDomain) {
  if (!emailDomain || !companyDomain) return false;
  
  const parts1 = emailDomain.split('.');
  const parts2 = companyDomain.split('.');
  
  // Need at least 2 parts for a valid domain (name.tld)
  if (parts1.length < 2 || parts2.length < 2) return false;
  
  // Get root domain (last 2 parts: domain.tld)
  const root1 = parts1.slice(-2).join('.');
  const root2 = parts2.slice(-2).join('.');
  
  // Must match exactly (including TLD)
  // This ensures underline.com !== underline.cz
  // But allows mail.underline.com === underline.com
  return root1 === root2;
}

// Run the cleanup
if (require.main === module) {
  const args = process.argv.slice(2);
  const dryRun = !args.includes('--apply');
  const workspaceArg = args.find(arg => arg.startsWith('--workspace='));
  const workspaceId = workspaceArg ? workspaceArg.split('=')[1] : TOP_WORKSPACE_ID;
  
  cleanupDomainMismatches({ dryRun, workspaceId }).catch(console.error);
}

module.exports = { cleanupDomainMismatches };

