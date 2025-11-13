/**
 * Fix Company-People Linking Data Integrity Issue
 * 
 * This script finds people with currentCompany string values but missing companyId foreign keys,
 * intelligently matches them to existing companies, and fixes the relationships.
 * 
 * It prevents cross-company pollution by validating email domains and company names.
 * 
 * Usage:
 *   npm run tsx scripts/fix-company-people-linking.ts [workspaceId] [--dry-run] [--apply]
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

interface MatchResult {
  personId: string;
  personName: string;
  personEmail: string | null;
  currentCompany: string | null;
  matchedCompanyId: string | null;
  matchedCompanyName: string | null;
  matchedCompanyWebsite: string | null;
  matchType: 'email_domain' | 'fuzzy_name' | 'linkedin' | 'no_match' | 'domain_mismatch';
  confidence: number;
  reason: string;
}

interface AuditReport {
  totalPeopleWithoutCompanyId: number;
  totalPeopleWithCurrentCompany: number;
  matches: {
    emailDomain: number;
    fuzzyName: number;
    linkedin: number;
    noMatch: number;
    domainMismatch: number;
  };
  successfulMatches: MatchResult[];
  domainMismatches: MatchResult[];
  noMatches: MatchResult[];
  highConfidenceMatches: MatchResult[];
  mediumConfidenceMatches: MatchResult[];
  lowConfidenceMatches: MatchResult[];
}

/**
 * Extract domain from email address
 */
function extractEmailDomain(email: string | null): string | null {
  if (!email || !email.includes('@')) return null;
  return email.split('@')[1].toLowerCase().trim();
}

/**
 * Extract base domain from website URL
 */
function extractWebsiteDomain(website: string | null): string | null {
  if (!website) return null;
  
  try {
    // Remove protocol
    let domain = website.toLowerCase().trim();
    domain = domain.replace(/^https?:\/\//, '');
    domain = domain.replace(/^www\./, '');
    // Remove path and query params
    domain = domain.split('/')[0];
    domain = domain.split('?')[0];
    
    return domain;
  } catch (e) {
    return null;
  }
}

/**
 * Calculate fuzzy match score between two strings
 */
function fuzzyMatchScore(str1: string, str2: string): number {
  const s1 = str1.toLowerCase().trim();
  const s2 = str2.toLowerCase().trim();
  
  // Exact match
  if (s1 === s2) return 100;
  
  // One contains the other
  if (s1.includes(s2) || s2.includes(s1)) return 80;
  
  // Remove common suffixes and compare
  const cleanStr = (s: string) => s
    .replace(/\s+(inc|llc|ltd|corp|corporation|company|co|limited)\.?$/i, '')
    .trim();
  
  const clean1 = cleanStr(s1);
  const clean2 = cleanStr(s2);
  
  if (clean1 === clean2) return 90;
  if (clean1.includes(clean2) || clean2.includes(clean1)) return 70;
  
  // Word overlap
  const words1 = clean1.split(/\s+/).filter(w => w.length > 2);
  const words2 = clean2.split(/\s+/).filter(w => w.length > 2);
  
  if (words1.length === 0 || words2.length === 0) return 0;
  
  const commonWords = words1.filter(w => words2.includes(w));
  const overlapRatio = (commonWords.length * 2) / (words1.length + words2.length);
  
  return Math.round(overlapRatio * 60);
}

/**
 * Find best matching company for a person
 */
async function findBestCompanyMatch(
  person: {
    id: string;
    fullName: string;
    email: string | null;
    workEmail: string | null;
    personalEmail: string | null;
    currentCompany: string | null;
    linkedinUrl: string | null;
  },
  companies: Array<{
    id: string;
    name: string;
    website: string | null;
    domain: string | null;
    linkedinUrl: string | null;
  }>
): Promise<MatchResult> {
  const personEmail = person.email || person.workEmail || person.personalEmail;
  const personDomain = extractEmailDomain(personEmail);
  
  let bestMatch: typeof companies[0] | null = null;
  let bestScore = 0;
  let matchType: MatchResult['matchType'] = 'no_match';
  let reason = '';
  
  // Try email domain matching first (most reliable)
  if (personDomain) {
    for (const company of companies) {
      const companyDomain = extractWebsiteDomain(company.website || company.domain);
      
      if (companyDomain && personDomain === companyDomain) {
        bestMatch = company;
        bestScore = 95;
        matchType = 'email_domain';
        reason = `Email domain ${personDomain} matches company website ${companyDomain}`;
        break;
      }
    }
  }
  
  // If no email domain match, try fuzzy name matching
  if (!bestMatch && person.currentCompany) {
    for (const company of companies) {
      const nameScore = fuzzyMatchScore(person.currentCompany, company.name);
      
      if (nameScore > bestScore && nameScore >= 70) {
        // Check for domain mismatch to prevent cross-company pollution
        if (personDomain) {
          const companyDomain = extractWebsiteDomain(company.website || company.domain);
          
          if (companyDomain && personDomain !== companyDomain) {
            // Domain mismatch detected - flag it
            const tld1 = personDomain.split('.').pop();
            const tld2 = companyDomain.split('.').pop();
            const baseDomain1 = personDomain.replace(/\.[^.]+$/, '');
            const baseDomain2 = companyDomain.replace(/\.[^.]+$/, '');
            
            // If base domains match but TLDs differ (e.g., underline.cz vs underline.com)
            if (baseDomain1 === baseDomain2 && tld1 !== tld2) {
              matchType = 'domain_mismatch';
              reason = `Company name matches but email domain ${personDomain} doesn't match company domain ${companyDomain} (possible different country/entity)`;
              bestScore = nameScore;
              bestMatch = company;
              break;
            }
          }
        }
        
        bestMatch = company;
        bestScore = nameScore;
        matchType = 'fuzzy_name';
        reason = `Company name fuzzy match with ${nameScore}% confidence`;
      }
    }
  }
  
  // Try LinkedIn URL matching (if available)
  if (!bestMatch && person.linkedinUrl) {
    for (const company of companies) {
      if (company.linkedinUrl && person.linkedinUrl.toLowerCase().includes(company.linkedinUrl.toLowerCase())) {
        bestMatch = company;
        bestScore = 85;
        matchType = 'linkedin';
        reason = `LinkedIn URL match`;
        break;
      }
    }
  }
  
  return {
    personId: person.id,
    personName: person.fullName,
    personEmail: personEmail,
    currentCompany: person.currentCompany,
    matchedCompanyId: bestMatch?.id || null,
    matchedCompanyName: bestMatch?.name || null,
    matchedCompanyWebsite: bestMatch?.website || null,
    matchType,
    confidence: bestScore,
    reason: reason || 'No suitable match found'
  };
}

/**
 * Run audit to find and match people without companyId
 */
async function auditCompanyPeopleLinking(workspaceId: string): Promise<AuditReport> {
  console.log(`🔍 [AUDIT] Starting audit for workspace: ${workspaceId}`);
  
  // Step 1: Find all people without companyId
  const peopleWithoutCompanyId = await prisma.people.findMany({
    where: {
      workspaceId,
      deletedAt: null,
      companyId: null
    },
    select: {
      id: true,
      fullName: true,
      email: true,
      workEmail: true,
      personalEmail: true,
      currentCompany: true,
      linkedinUrl: true
    }
  });
  
  console.log(`📊 [AUDIT] Found ${peopleWithoutCompanyId.length} people without companyId`);
  
  // Filter to only those with currentCompany set
  const peopleWithCurrentCompany = peopleWithoutCompanyId.filter(p => p.currentCompany);
  
  console.log(`📊 [AUDIT] ${peopleWithCurrentCompany.length} have currentCompany set`);
  
  if (peopleWithCurrentCompany.length === 0) {
    console.log(`✅ [AUDIT] No people found with currentCompany but missing companyId`);
    return {
      totalPeopleWithoutCompanyId: peopleWithoutCompanyId.length,
      totalPeopleWithCurrentCompany: 0,
      matches: {
        emailDomain: 0,
        fuzzyName: 0,
        linkedin: 0,
        noMatch: 0,
        domainMismatch: 0
      },
      successfulMatches: [],
      domainMismatches: [],
      noMatches: [],
      highConfidenceMatches: [],
      mediumConfidenceMatches: [],
      lowConfidenceMatches: []
    };
  }
  
  // Step 2: Get all companies in the workspace
  const companies = await prisma.companies.findMany({
    where: {
      workspaceId,
      deletedAt: null
    },
    select: {
      id: true,
      name: true,
      website: true,
      domain: true,
      linkedinUrl: true
    }
  });
  
  console.log(`📊 [AUDIT] Found ${companies.length} companies`);
  
  // Step 3: Match each person to a company
  console.log(`🔍 [AUDIT] Matching people to companies...`);
  const matchResults: MatchResult[] = [];
  
  for (let i = 0; i < peopleWithCurrentCompany.length; i++) {
    const person = peopleWithCurrentCompany[i];
    const match = await findBestCompanyMatch(person, companies);
    matchResults.push(match);
    
    if ((i + 1) % 50 === 0) {
      console.log(`   Processed ${i + 1}/${peopleWithCurrentCompany.length} people...`);
    }
  }
  
  // Step 4: Categorize matches
  const successfulMatches = matchResults.filter(
    m => m.matchType !== 'no_match' && m.matchType !== 'domain_mismatch' && m.confidence >= 70
  );
  
  const domainMismatches = matchResults.filter(m => m.matchType === 'domain_mismatch');
  const noMatches = matchResults.filter(m => m.matchType === 'no_match' || m.confidence < 70);
  
  const highConfidenceMatches = successfulMatches.filter(m => m.confidence >= 90);
  const mediumConfidenceMatches = successfulMatches.filter(m => m.confidence >= 75 && m.confidence < 90);
  const lowConfidenceMatches = successfulMatches.filter(m => m.confidence >= 70 && m.confidence < 75);
  
  const report: AuditReport = {
    totalPeopleWithoutCompanyId: peopleWithoutCompanyId.length,
    totalPeopleWithCurrentCompany: peopleWithCurrentCompany.length,
    matches: {
      emailDomain: matchResults.filter(m => m.matchType === 'email_domain').length,
      fuzzyName: matchResults.filter(m => m.matchType === 'fuzzy_name').length,
      linkedin: matchResults.filter(m => m.matchType === 'linkedin').length,
      noMatch: noMatches.length,
      domainMismatch: domainMismatches.length
    },
    successfulMatches,
    domainMismatches,
    noMatches,
    highConfidenceMatches,
    mediumConfidenceMatches,
    lowConfidenceMatches
  };
  
  return report;
}

/**
 * Apply fixes to link people to companies
 */
async function applyFixes(matches: MatchResult[], dryRun: boolean = true): Promise<number> {
  if (dryRun) {
    console.log(`🔍 [DRY RUN] Would update ${matches.length} people with companyId`);
    return 0;
  }
  
  console.log(`✍️ [APPLY] Updating ${matches.length} people with companyId...`);
  
  let updatedCount = 0;
  
  for (const match of matches) {
    if (!match.matchedCompanyId) continue;
    
    try {
      await prisma.people.update({
        where: { id: match.personId },
        data: { companyId: match.matchedCompanyId }
      });
      
      updatedCount++;
      
      if (updatedCount % 50 === 0) {
        console.log(`   Updated ${updatedCount}/${matches.length} people...`);
      }
    } catch (error) {
      console.error(`❌ [ERROR] Failed to update person ${match.personId}:`, error);
    }
  }
  
  console.log(`✅ [APPLY] Successfully updated ${updatedCount} people`);
  return updatedCount;
}

/**
 * Print detailed audit report
 */
function printReport(report: AuditReport) {
  console.log('\n' + '='.repeat(80));
  console.log('📊 COMPANY-PEOPLE LINKING AUDIT REPORT');
  console.log('='.repeat(80) + '\n');
  
  console.log('📈 SUMMARY:');
  console.log(`   Total people without companyId: ${report.totalPeopleWithoutCompanyId}`);
  console.log(`   People with currentCompany set: ${report.totalPeopleWithCurrentCompany}`);
  console.log(`   Successful matches: ${report.successfulMatches.length}`);
  console.log(`   Domain mismatches: ${report.domainMismatches.length}`);
  console.log(`   No matches found: ${report.noMatches.length}`);
  
  console.log('\n📊 MATCH BREAKDOWN:');
  console.log(`   Email domain matches: ${report.matches.emailDomain}`);
  console.log(`   Fuzzy name matches: ${report.matches.fuzzyName}`);
  console.log(`   LinkedIn matches: ${report.matches.linkedin}`);
  console.log(`   No matches: ${report.matches.noMatch}`);
  console.log(`   Domain mismatches: ${report.matches.domainMismatch}`);
  
  console.log('\n🎯 CONFIDENCE DISTRIBUTION:');
  console.log(`   High confidence (90%+): ${report.highConfidenceMatches.length}`);
  console.log(`   Medium confidence (75-89%): ${report.mediumConfidenceMatches.length}`);
  console.log(`   Low confidence (70-74%): ${report.lowConfidenceMatches.length}`);
  
  if (report.highConfidenceMatches.length > 0) {
    console.log('\n✅ HIGH CONFIDENCE MATCHES (sample, first 10):');
    report.highConfidenceMatches.slice(0, 10).forEach((match, idx) => {
      console.log(`   ${idx + 1}. ${match.personName} (${match.personEmail || 'no email'})`);
      console.log(`      currentCompany: "${match.currentCompany}"`);
      console.log(`      → Match: ${match.matchedCompanyName} (${match.matchedCompanyWebsite})`);
      console.log(`      Confidence: ${match.confidence}% | Type: ${match.matchType}`);
      console.log(`      Reason: ${match.reason}\n`);
    });
  }
  
  if (report.domainMismatches.length > 0) {
    console.log('\n⚠️  DOMAIN MISMATCHES (require manual review):');
    report.domainMismatches.forEach((match, idx) => {
      console.log(`   ${idx + 1}. ${match.personName} (${match.personEmail || 'no email'})`);
      console.log(`      currentCompany: "${match.currentCompany}"`);
      console.log(`      → Potential match: ${match.matchedCompanyName} (${match.matchedCompanyWebsite})`);
      console.log(`      ⚠️  ${match.reason}\n`);
    });
  }
  
  if (report.noMatches.length > 0 && report.noMatches.length <= 20) {
    console.log('\n❌ NO MATCHES FOUND:');
    report.noMatches.forEach((match, idx) => {
      console.log(`   ${idx + 1}. ${match.personName} (${match.personEmail || 'no email'})`);
      console.log(`      currentCompany: "${match.currentCompany}"`);
      console.log(`      Reason: ${match.reason}\n`);
    });
  } else if (report.noMatches.length > 20) {
    console.log(`\n❌ NO MATCHES FOUND: ${report.noMatches.length} people (too many to display)`);
  }
  
  console.log('\n' + '='.repeat(80) + '\n');
}

/**
 * Main execution
 */
async function main() {
  const args = process.argv.slice(2);
  const workspaceId = args.find(arg => !arg.startsWith('--')) || '01K1VBYV8ETM2RCQA4GNN9EG72';
  const dryRun = !args.includes('--apply');
  
  console.log(`🚀 [MAIN] Starting Company-People Linking Fix`);
  console.log(`📋 [CONFIG] Workspace ID: ${workspaceId}`);
  console.log(`📋 [CONFIG] Mode: ${dryRun ? 'DRY RUN (use --apply to make changes)' : 'APPLY CHANGES'}`);
  console.log('');
  
  try {
    // Run audit
    const report = await auditCompanyPeopleLinking(workspaceId);
    
    // Print report
    printReport(report);
    
    if (report.successfulMatches.length === 0) {
      console.log('✅ [MAIN] No fixes needed. All people are properly linked!');
      return;
    }
    
    // Apply fixes
    if (dryRun) {
      console.log('💡 [MAIN] This was a DRY RUN. No changes were made.');
      console.log('💡 [MAIN] To apply these changes, run: npm run tsx scripts/fix-company-people-linking.ts --apply');
    } else {
      console.log('✍️ [MAIN] Applying fixes...');
      const updatedCount = await applyFixes(report.successfulMatches, false);
      console.log(`✅ [MAIN] Successfully updated ${updatedCount} people with proper companyId links`);
    }
    
    console.log('\n🎉 [MAIN] Completed successfully!');
  } catch (error) {
    console.error('❌ [MAIN] Error:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Run if called directly
if (require.main === module) {
  main().catch((error) => {
    console.error('💥 [FATAL] Error:', error);
    process.exit(1);
  });
}

export { auditCompanyPeopleLinking, applyFixes, findBestCompanyMatch };

