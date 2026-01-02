/**
 * Audit and Clean Buyer Group Data
 * 
 * This script:
 * 1. Audits all buyer groups for data quality issues
 * 2. Identifies wrong company matches
 * 3. Removes invalid buyer groups and members
 * 4. Reports what needs to be re-run when credits are available
 */

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// Workspace ID for Noel
const WORKSPACE_ID = '01K7DNYR5VZ7JY36KGKKN76XZ1';

/**
 * Normalize company name for comparison
 */
function normalizeCompanyName(name) {
  if (!name) return '';
  return name
    .toLowerCase()
    .replace(/\b(inc|llc|ltd|corp|corporation|company|co|group|holdings)\b/g, '')
    .replace(/[^a-z0-9]/g, '')
    .trim();
}

/**
 * Calculate similarity between two company names
 */
function calculateSimilarity(str1, str2) {
  const s1 = normalizeCompanyName(str1);
  const s2 = normalizeCompanyName(str2);
  
  if (s1 === s2) return 1.0;
  if (s1.includes(s2) || s2.includes(s1)) return 0.9;
  
  // Simple Levenshtein-like similarity
  const longer = s1.length > s2.length ? s1 : s2;
  const shorter = s1.length > s2.length ? s2 : s1;
  const editDistance = levenshteinDistance(s1, s2);
  return 1 - (editDistance / longer.length);
}

function levenshteinDistance(str1, str2) {
  const matrix = [];
  for (let i = 0; i <= str2.length; i++) {
    matrix[i] = [i];
  }
  for (let j = 0; j <= str1.length; j++) {
    matrix[0][j] = j;
  }
  for (let i = 1; i <= str2.length; i++) {
    for (let j = 1; j <= str1.length; j++) {
      if (str2.charAt(i - 1) === str1.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1,
          matrix[i][j - 1] + 1,
          matrix[i - 1][j] + 1
        );
      }
    }
  }
  return matrix[str2.length][str1.length];
}

/**
 * Validate if buyer group company matches the actual company
 */
async function validateBuyerGroup(buyerGroup) {
  const issues = [];
  const warnings = [];
  
  // Get the company record
  let company = null;
  if (buyerGroup.companyId) {
    company = await prisma.companies.findUnique({
      where: { id: buyerGroup.companyId }
    });
  }
  
  // If no companyId, try to find by name
  if (!company && buyerGroup.companyName) {
    company = await prisma.companies.findFirst({
      where: {
        workspaceId: WORKSPACE_ID,
        name: { contains: buyerGroup.companyName, mode: 'insensitive' }
      }
    });
  }
  
  // Check 1: Company name mismatch
  if (company && buyerGroup.companyName) {
    const similarity = calculateSimilarity(company.name, buyerGroup.companyName);
    if (similarity < 0.7) {
      issues.push({
        type: 'COMPANY_NAME_MISMATCH',
        severity: 'HIGH',
        message: `Buyer group company name "${buyerGroup.companyName}" doesn't match company "${company.name}" (similarity: ${(similarity * 100).toFixed(1)}%)`,
        buyerGroupName: buyerGroup.companyName,
        actualCompanyName: company.name,
        similarity
      });
    } else if (similarity < 0.9) {
      warnings.push({
        type: 'COMPANY_NAME_WARNING',
        message: `Buyer group company name "${buyerGroup.companyName}" has low similarity with company "${company.name}" (${(similarity * 100).toFixed(1)}%)`
      });
    }
  }
  
  // Check 2: Website mismatch
  if (company && buyerGroup.website && company.website) {
    const normalizeDomain = (url) => {
      if (!url) return '';
      return url.replace(/^https?:\/\//, '').replace(/^www\./, '').split('/')[0].toLowerCase();
    };
    
    const bgDomain = normalizeDomain(buyerGroup.website);
    const compDomain = normalizeDomain(company.website);
    
    if (bgDomain !== compDomain) {
      issues.push({
        type: 'WEBSITE_MISMATCH',
        severity: 'HIGH',
        message: `Buyer group website "${buyerGroup.website}" doesn't match company website "${company.website}"`,
        buyerGroupWebsite: buyerGroup.website,
        actualCompanyWebsite: company.website
      });
    }
  }
  
  // Check 3: Get members and validate their company association
  const members = await prisma.buyerGroupMembers.findMany({
    where: { buyerGroupId: buyerGroup.id },
    include: {
      // Note: BuyerGroupMembers doesn't have direct relation to People, need to check via coresignalId or name
    }
  });
  
  // Check 4: Metadata validation - look for wrong LinkedIn URLs
  if (buyerGroup.metadata) {
    const metadata = buyerGroup.metadata;
    if (metadata.linkedinUrl && company) {
      // Check if LinkedIn URL makes sense
      const linkedinSlug = metadata.linkedinUrl.match(/linkedin\.com\/company\/([^\/\?]+)/)?.[1];
      if (linkedinSlug) {
        const companyNameSlug = normalizeCompanyName(company.name);
        const linkedinNormalized = linkedinSlug.toLowerCase().replace(/-(com|inc|llc|ltd|corp)$/i, '');
        
        // Calculate similarity between LinkedIn slug and company name
        const similarity = calculateSimilarity(companyNameSlug, linkedinNormalized);
        
        // Known bad matches
        const knownBadMatches = [
          { pattern: 'little-romania', description: 'Little Romania Ltd' },
          { pattern: 'romania', description: 'Romania-related company' }
        ];
        
        for (const badMatch of knownBadMatches) {
          if (linkedinSlug.includes(badMatch.pattern) && !company.name.toLowerCase().includes(badMatch.pattern)) {
            issues.push({
              type: 'WRONG_LINKEDIN_MATCH',
              severity: 'CRITICAL',
              message: `Buyer group has wrong LinkedIn URL: "${metadata.linkedinUrl}" (${badMatch.description}) for company "${company.name}"`,
              wrongLinkedInUrl: metadata.linkedinUrl,
              companyName: company.name,
              similarity
            });
            break;
          }
        }
        
        // Check similarity - if LinkedIn slug doesn't match company name, it's suspicious
        if (similarity < 0.5 && !issues.some(i => i.type === 'WRONG_LINKEDIN_MATCH')) {
          issues.push({
            type: 'LINKEDIN_URL_MISMATCH',
            severity: 'HIGH',
            message: `LinkedIn URL slug "${linkedinSlug}" has low similarity (${(similarity * 100).toFixed(1)}%) with company name "${company.name}"`,
            linkedinSlug,
            companyName: company.name,
            similarity
          });
        }
      }
    }
    
    // Check intelligence.linkedinUrl as well
    if (metadata.intelligence && metadata.intelligence.linkedinUrl && company) {
      const linkedinSlug = metadata.intelligence.linkedinUrl.match(/linkedin\.com\/company\/([^\/\?]+)/)?.[1];
      if (linkedinSlug) {
        const companyNameSlug = normalizeCompanyName(company.name);
        const linkedinNormalized = linkedinSlug.toLowerCase().replace(/-(com|inc|llc|ltd|corp)$/i, '');
        const similarity = calculateSimilarity(companyNameSlug, linkedinNormalized);
        
        // Known bad matches
        if (linkedinSlug.includes('little-romania') && !company.name.toLowerCase().includes('romania')) {
          issues.push({
            type: 'WRONG_LINKEDIN_MATCH',
            severity: 'CRITICAL',
            message: `Intelligence has wrong LinkedIn URL: "${metadata.intelligence.linkedinUrl}" (Little Romania) for company "${company.name}"`,
            wrongLinkedInUrl: metadata.intelligence.linkedinUrl,
            companyName: company.name,
            similarity
          });
        } else if (similarity < 0.5) {
          issues.push({
            type: 'LINKEDIN_URL_MISMATCH',
            severity: 'HIGH',
            message: `Intelligence LinkedIn URL slug "${linkedinSlug}" has low similarity (${(similarity * 100).toFixed(1)}%) with company name "${company.name}"`,
            linkedinSlug,
            companyName: company.name,
            similarity
          });
        }
      }
    }
  }
  
  // Check 5: Zero members (likely API credit issue)
  if (buyerGroup.totalMembers === 0) {
    warnings.push({
      type: 'ZERO_MEMBERS',
      message: `Buyer group has 0 members - likely due to API credit exhaustion`
    });
  }
  
  return {
    buyerGroup,
    company,
    members,
    issues,
    warnings,
    isValid: issues.filter(i => i.severity === 'CRITICAL' || i.severity === 'HIGH').length === 0
  };
}

/**
 * Main audit function
 */
async function auditBuyerGroups() {
  console.log('🔍 Starting Buyer Group Audit...\n');
  
  // Get all buyer groups for this workspace (or recent ones)
  const buyerGroups = await prisma.buyerGroups.findMany({
    where: {
      workspaceId: WORKSPACE_ID
    },
    orderBy: {
      createdAt: 'desc'
    },
    take: 100 // Audit last 100 buyer groups
  });
  
  console.log(`📊 Found ${buyerGroups.length} buyer groups to audit\n`);
  
  const auditResults = [];
  let totalIssues = 0;
  let totalWarnings = 0;
  let criticalIssues = 0;
  
  for (const bg of buyerGroups) {
    const result = await validateBuyerGroup(bg);
    auditResults.push(result);
    
    totalIssues += result.issues.length;
    totalWarnings += result.warnings.length;
    criticalIssues += result.issues.filter(i => i.severity === 'CRITICAL').length;
  }
  
  // Generate report
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('📊 BUYER GROUP AUDIT REPORT');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
  
  console.log(`Total Buyer Groups Audited: ${buyerGroups.length}`);
  console.log(`✅ Valid: ${auditResults.filter(r => r.isValid).length}`);
  console.log(`❌ Invalid: ${auditResults.filter(r => !r.isValid).length}`);
  console.log(`⚠️  Warnings: ${totalWarnings}`);
  console.log(`🚨 Critical Issues: ${criticalIssues}`);
  console.log(`📋 Total Issues: ${totalIssues}\n`);
  
  // List critical issues
  const critical = auditResults.filter(r => r.issues.some(i => i.severity === 'CRITICAL'));
  if (critical.length > 0) {
    console.log('🚨 CRITICAL ISSUES (Wrong Company Matches):');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
    
    for (const result of critical) {
      const criticalIssues = result.issues.filter(i => i.severity === 'CRITICAL');
      for (const issue of criticalIssues) {
        console.log(`❌ ${result.buyerGroup.companyName || result.buyerGroup.id}`);
        console.log(`   Issue: ${issue.message}`);
        console.log(`   Buyer Group ID: ${result.buyerGroup.id}`);
        if (result.company) {
          console.log(`   Company ID: ${result.company.id}`);
        }
        console.log('');
      }
    }
  }
  
  // List high severity issues
  const highSeverity = auditResults.filter(r => r.issues.some(i => i.severity === 'HIGH'));
  if (highSeverity.length > 0) {
    console.log('⚠️  HIGH SEVERITY ISSUES:');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
    
    for (const result of highSeverity) {
      const highIssues = result.issues.filter(i => i.severity === 'HIGH');
      for (const issue of highIssues) {
        console.log(`⚠️  ${result.buyerGroup.companyName || result.buyerGroup.id}`);
        console.log(`   Issue: ${issue.message}`);
        console.log(`   Buyer Group ID: ${result.buyerGroup.id}\n`);
      }
    }
  }
  
  // List zero-member buyer groups (likely API credit issues)
  const zeroMembers = auditResults.filter(r => r.warnings.some(w => w.type === 'ZERO_MEMBERS'));
  if (zeroMembers.length > 0) {
    console.log('📭 ZERO-MEMBER BUYER GROUPS (Need Re-run):');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
    
    for (const result of zeroMembers) {
      console.log(`   • ${result.buyerGroup.companyName || result.buyerGroup.id} (ID: ${result.buyerGroup.id})`);
      if (result.company) {
        console.log(`     Company: ${result.company.name} (${result.company.website || 'no website'})`);
      }
    }
    console.log(`\n   Total: ${zeroMembers.length} buyer groups need re-run when credits are available\n`);
  }
  
  return {
    auditResults,
    critical,
    highSeverity,
    zeroMembers,
    stats: {
      total: buyerGroups.length,
      valid: auditResults.filter(r => r.isValid).length,
      invalid: auditResults.filter(r => !r.isValid).length,
      criticalIssues,
      totalIssues,
      totalWarnings
    }
  };
}

/**
 * Clean invalid buyer groups
 */
async function cleanInvalidBuyerGroups(dryRun = true) {
  console.log('\n🧹 Starting Cleanup...\n');
  
  if (dryRun) {
    console.log('⚠️  DRY RUN MODE - No data will be deleted\n');
  }
  
  const audit = await auditBuyerGroups();
  
  // Find buyer groups to delete
  const toDelete = audit.auditResults.filter(r => {
    // Delete if critical issues or high severity issues
    return r.issues.some(i => i.severity === 'CRITICAL' || i.severity === 'HIGH');
  });
  
  console.log(`\n🗑️  Buyer Groups to Delete: ${toDelete.length}\n`);
  
  if (toDelete.length === 0) {
    console.log('✅ No invalid buyer groups found to clean\n');
    return;
  }
  
  for (const result of toDelete) {
    const bg = result.buyerGroup;
    const issues = result.issues;
    
    console.log(`\n🗑️  Deleting: ${bg.companyName || bg.id}`);
    console.log(`   ID: ${bg.id}`);
    console.log(`   Members: ${bg.totalMembers}`);
    console.log(`   Issues:`);
    for (const issue of issues) {
      console.log(`     - ${issue.type}: ${issue.message}`);
    }
    
    if (!dryRun) {
      // Delete buyer group (members will cascade delete)
      await prisma.buyerGroups.delete({
        where: { id: bg.id }
      });
      console.log(`   ✅ Deleted`);
    } else {
      console.log(`   ⚠️  Would delete (dry run)`);
    }
  }
  
  if (dryRun) {
    console.log('\n⚠️  This was a DRY RUN. Run with --execute to actually delete.');
  } else {
    console.log('\n✅ Cleanup complete!');
  }
  
  return {
    deleted: dryRun ? 0 : toDelete.length,
    wouldDelete: toDelete.length
  };
}

/**
 * Main execution
 */
async function main() {
  const args = process.argv.slice(2);
  const execute = args.includes('--execute');
  const clean = args.includes('--clean');
  
  try {
    if (clean) {
      await cleanInvalidBuyerGroups(!execute);
    } else {
      await auditBuyerGroups();
      console.log('\n💡 Tip: Run with --clean to remove invalid buyer groups');
      console.log('   Use --clean --execute to actually delete (default is dry-run)');
    }
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

if (require.main === module) {
  main();
}

module.exports = { auditBuyerGroups, cleanInvalidBuyerGroups };
