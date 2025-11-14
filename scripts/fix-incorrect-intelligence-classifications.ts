/**
 * Fix Incorrect Intelligence Classifications
 * 
 * This script regenerates intelligence summaries for companies that were
 * incorrectly classified as Technology/SaaS when they should be in other industries.
 * 
 * Usage:
 *   npm run fix:intelligence-classifications
 *   npm run fix:intelligence-classifications -- --dry-run  (preview only)
 */

import { prisma } from '../src/lib/prisma';
import { companyStrategyService, CompanyStrategyRequest } from '../src/platform/services/company-strategy-service';

interface CompanyToFix {
  companyId: string;
  companyName: string;
  currentTargetIndustry: string;
  correctTargetIndustry: string;
  issue: string;
}

// Helper function to infer industry category (same logic as route.ts)
function inferIndustryCategory(industry: string): string | null {
  if (!industry) return null;
  
  const industryLower = industry.toLowerCase();
  
  // Utility/Energy sector - check FIRST before technology
  if (industryLower.includes('utility') || 
      industryLower.includes('energy') || 
      industryLower.includes('power') || 
      industryLower.includes('electric') ||
      industryLower.includes('utilities') ||
      industryLower.includes('electrical')) {
    return 'Utilities/Energy';
  }
  
  // Healthcare
  if (industryLower.includes('healthcare') || 
      industryLower.includes('health') || 
      industryLower.includes('hospital') || 
      industryLower.includes('medical')) {
    return 'Healthcare';
  }
  
  // Financial Services
  if (industryLower.includes('bank') || 
      industryLower.includes('financial') || 
      industryLower.includes('insurance') || 
      industryLower.includes('finance')) {
    return 'Financial Services';
  }
  
  // Technology/SaaS - only explicit technology terms
  if (industryLower.includes('software') || 
      industryLower.includes('saas') ||
      industryLower.includes('it services') ||
      industryLower.includes('information technology')) {
    return 'Technology/SaaS';
  }
  
  // Manufacturing
  if (industryLower.includes('manufacturing') || 
      industryLower.includes('manufacturer')) {
    return 'Manufacturing';
  }
  
  // Retail
  if (industryLower.includes('retail') || 
      industryLower.includes('e-commerce') || 
      industryLower.includes('ecommerce')) {
    return 'Retail/E-commerce';
  }
  
  // Real Estate
  if (industryLower.includes('real estate') || 
      industryLower.includes('title') || 
      industryLower.includes('property')) {
    return 'Real Estate';
  }
  
  // Education
  if (industryLower.includes('education') || 
      industryLower.includes('school') || 
      industryLower.includes('university')) {
    return 'Education';
  }
  
  // Government
  if (industryLower.includes('government') || 
      industryLower.includes('public sector')) {
    return 'Government/Public Sector';
  }
  
  // Professional Services
  if (industryLower.includes('consulting') || 
      industryLower.includes('professional services') || 
      industryLower.includes('legal') ||
      industryLower.includes('law')) {
    return 'Professional Services';
  }
  
  // Non-Profit
  if (industryLower.includes('non-profit') || 
      industryLower.includes('nonprofit') || 
      industryLower.includes('non profit')) {
    return 'Non-Profit';
  }
  
  return null;
}

// Helper function to infer industry from company name
function inferIndustryFromName(companyName: string): string | null {
  if (!companyName) return null;
  
  const nameLower = companyName.toLowerCase();
  
  // Utility/Energy keywords in company name
  if (nameLower.includes('power') || 
      nameLower.includes('energy') || 
      nameLower.includes('electric') ||
      nameLower.includes('utility') ||
      nameLower.includes('utilities') ||
      nameLower.includes('gas') ||
      nameLower.includes('water') ||
      nameLower.includes('steam')) {
    return 'Utilities/Energy';
  }
  
  // Healthcare keywords
  if (nameLower.includes('health') || 
      nameLower.includes('hospital') || 
      nameLower.includes('medical') ||
      nameLower.includes('clinic')) {
    return 'Healthcare';
  }
  
  // Financial keywords
  if (nameLower.includes('bank') || 
      nameLower.includes('financial') || 
      nameLower.includes('insurance') ||
      nameLower.includes('credit union')) {
    return 'Financial Services';
  }
  
  return null;
}

async function findCompaniesToFix(): Promise<CompanyToFix[]> {
  const companies = await prisma.companies.findMany({
    where: {
      deletedAt: null,
      customFields: {
        path: ['strategyData'],
        not: null
      }
    },
    select: {
      id: true,
      name: true,
      industry: true,
      sector: true,
      customFields: true
    }
  });
  
  const companiesToFix: CompanyToFix[] = [];
  
  for (const company of companies) {
    const customFields = company.customFields as any;
    const strategyData = customFields?.strategyData;
    
    if (!strategyData) continue;
    
    // Infer what the target industry should be
    const inferredTargetIndustry = customFields?.targetIndustry || 
      (company.industry ? inferIndustryCategory(company.industry) : null) ||
      (company.sector ? inferIndustryCategory(company.sector) : null) ||
      (company.name ? inferIndustryFromName(company.name) : null) ||
      'Unknown';
    
    const currentTargetIndustry = strategyData.targetIndustry || strategyData.targetIndustryCategory || null;
    
    // Check if this company needs fixing
    if (currentTargetIndustry === 'Technology/SaaS' && 
        inferredTargetIndustry !== 'Technology/SaaS' && 
        inferredTargetIndustry !== 'Unknown') {
      companiesToFix.push({
        companyId: company.id,
        companyName: company.name,
        currentTargetIndustry,
        correctTargetIndustry: inferredTargetIndustry,
        issue: `Incorrectly classified as Technology/SaaS, should be ${inferredTargetIndustry}`
      });
    }
  }
  
  return companiesToFix;
}


async function fixIntelligenceClassifications(dryRun: boolean = false) {
  console.log('🔧 Fixing Incorrect Intelligence Classifications\n');
  console.log('=' .repeat(80));
  
  if (dryRun) {
    console.log('🔍 DRY RUN MODE - No changes will be made\n');
  }
  
  try {
    const companiesToFix = await findCompaniesToFix();
    
    console.log(`\n📊 Found ${companiesToFix.length} companies that need fixing:\n`);
    
    if (companiesToFix.length === 0) {
      console.log('✅ No companies need fixing!');
      return;
    }
    
    // Display companies to fix
    companiesToFix.forEach((company, index) => {
      console.log(`${index + 1}. ${company.companyName}`);
      console.log(`   Current: ${company.currentTargetIndustry}`);
      console.log(`   Should be: ${company.correctTargetIndustry}`);
      console.log(`   Issue: ${company.issue}\n`);
    });
    
    if (dryRun) {
      console.log('\n🔍 DRY RUN: Would fix the above companies');
      console.log('Run without --dry-run to apply fixes');
      return;
    }
    
    console.log(`\n🔄 Regenerating intelligence for ${companiesToFix.length} companies...\n`);
    
    let successCount = 0;
    let errorCount = 0;
    
    // Helper function to determine growth stage
    function determineGrowthStage(company: any): 'startup' | 'growth' | 'mature' | 'declining' {
      const age = company.foundedAt ? 
        Math.floor((Date.now() - new Date(company.foundedAt).getTime()) / (365.25 * 24 * 60 * 60 * 1000)) : 0;
      const size = company.size || 0;
      
      if (age < 3 && size < 50) return 'startup';
      if (age < 10 && size < 500) return 'growth';
      if (age >= 10 && size >= 500) return 'mature';
      return 'declining';
    }
    
    // Helper function to determine market position
    function determineMarketPosition(company: any): 'leader' | 'challenger' | 'follower' | 'niche' {
      const size = company.size || 0;
      const revenue = company.revenue || 0;
      const globalRank = company.globalRank || 999999;
      
      if (globalRank <= 1000) return 'leader';
      if (size > 1000 || revenue > 100000000) return 'challenger';
      if (size > 100) return 'follower';
      return 'niche';
    }
    
    for (const company of companiesToFix) {
      try {
        console.log(`Processing: ${company.companyName}...`);
        
        // Get full company data
        const companyRecord = await prisma.companies.findFirst({
          where: { id: company.companyId, deletedAt: null },
          include: {
            people: {
              where: { deletedAt: null },
              select: {
                id: true,
                firstName: true,
                lastName: true,
                jobTitle: true,
                email: true,
                phone: true,
                linkedinUrl: true,
                lastAction: true,
                nextAction: true
              },
              take: 10
            }
          }
        });
        
        if (!companyRecord) {
          console.log(`  ⚠️  Company not found, skipping`);
          errorCount++;
          continue;
        }
        
        // Prepare strategy request
        const strategyRequest: CompanyStrategyRequest = {
          companyId: company.companyId,
          companyName: companyRecord.name,
          companyIndustry: companyRecord.industry || 'Unknown',
          targetIndustry: company.correctTargetIndustry,
          companySize: companyRecord.size || 0,
          companyRevenue: companyRecord.revenue || 0,
          companyAge: companyRecord.foundedAt ? 
            Math.floor((Date.now() - new Date(companyRecord.foundedAt).getTime()) / (365.25 * 24 * 60 * 60 * 1000)) : 0,
          growthStage: determineGrowthStage(companyRecord),
          marketPosition: determineMarketPosition(companyRecord),
          forceRegenerate: true,
          website: companyRecord.website,
          headquarters: companyRecord.headquarters,
          foundedYear: companyRecord.foundedYear,
          isPublic: companyRecord.isPublic,
          sector: companyRecord.sector,
          description: companyRecord.description,
          linkedinFollowers: companyRecord.linkedinFollowers,
          globalRank: companyRecord.globalRank,
          competitors: Array.isArray(companyRecord.competitors) ? companyRecord.competitors : [],
          lastAction: companyRecord.lastAction,
          nextAction: companyRecord.nextAction,
          opportunityStage: companyRecord.opportunityStage,
          opportunityAmount: companyRecord.opportunityAmount,
          people: companyRecord.people?.map(p => ({
            id: p.id,
            firstName: p.firstName || '',
            lastName: p.lastName || '',
            title: p.jobTitle || '',
            email: p.email,
            phone: p.phone,
            linkedinUrl: p.linkedinUrl,
            lastAction: p.lastAction,
            nextAction: p.nextAction
          })) || []
        };
        
        // Generate strategy
        console.log(`  🤖 Generating intelligence with correct industry classification...`);
        const strategyResponse = await companyStrategyService.generateCompanyStrategy(strategyRequest);
        
        if (!strategyResponse.success || !strategyResponse.data) {
          console.log(`  ⚠️  Strategy generation failed: ${strategyResponse.error}`);
          console.log(`  ℹ️  Will regenerate on next view`);
          errorCount++;
          continue;
        }
        
        // Update company with new strategy data and correct targetIndustry
        await prisma.companies.update({
          where: { id: company.companyId },
          data: {
            customFields: {
              ...(companyRecord.customFields as any || {}),
              targetIndustry: company.correctTargetIndustry,
              strategyData: strategyResponse.data,
              lastStrategyUpdate: new Date().toISOString()
            }
          }
        });
        
        console.log(`  ✅ Generated and saved intelligence with correct classification: ${company.correctTargetIndustry}`);
        successCount++;
        
      } catch (error) {
        console.error(`  ❌ Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
        if (error instanceof Error && error.stack) {
          console.error(`  Stack: ${error.stack}`);
        }
        errorCount++;
      }
    }
    
    console.log('\n' + '=' .repeat(80));
    console.log('\n📊 Summary:');
    console.log(`✅ Successfully processed: ${successCount}`);
    console.log(`❌ Errors: ${errorCount}`);
    console.log(`\n💡 Intelligence summaries have been pre-generated with correct classifications.`);
    console.log(`   Users will see the updated summaries immediately when viewing these companies.\n`);
    
  } catch (error) {
    console.error('\n❌ Error running fix script:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Parse command line arguments
const args = process.argv.slice(2);
const dryRun = args.includes('--dry-run') || args.includes('-d');

// Run the fix
if (require.main === module) {
  fixIntelligenceClassifications(dryRun)
    .then(() => {
      console.log('✅ Fix script completed successfully');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ Fix script failed:', error);
      process.exit(1);
    });
}

export { fixIntelligenceClassifications };

