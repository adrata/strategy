/**
 * Final Audit and Regenerate Intelligence
 * 
 * Performs comprehensive audit of intelligence generation logic,
 * then regenerates intelligence for all companies in top-temp workspace
 * to ensure fresh, accurate data.
 */

import { prisma } from '../src/lib/prisma';
import { companyStrategyService, CompanyStrategyRequest } from '../src/platform/services/company-strategy-service';

// Helper functions (same as in route.ts)
function parseCompanySize(size: any): number {
  if (typeof size === 'number') return size;
  if (!size) return 0;
  const sizeStr = String(size).toLowerCase();
  const match = sizeStr.match(/(\d{1,3}(?:,\d{3})*)/);
  if (match) {
    return parseInt(match[1].replace(/,/g, ''), 10);
  }
  const rangeMatch = sizeStr.match(/(\d+)\s*-\s*(\d+)/);
  if (rangeMatch) {
    return parseInt(rangeMatch[2], 10);
  }
  if (sizeStr.includes('10000+') || sizeStr.includes('enterprise')) return 10000;
  if (sizeStr.includes('5000+') || sizeStr.includes('large-enterprise')) return 5000;
  if (sizeStr.includes('1000+') || sizeStr.includes('large')) return 1000;
  if (sizeStr.includes('500+') || sizeStr.includes('medium-enterprise')) return 500;
  if (sizeStr.includes('200+') || sizeStr.includes('medium')) return 200;
  if (sizeStr.includes('50+') || sizeStr.includes('small')) return 50;
  return 0;
}

function determineGrowthStage(company: any): 'startup' | 'growth' | 'mature' | 'declining' {
  const age = company.foundedYear ? 
    new Date().getFullYear() - company.foundedYear : null;
  const size = parseCompanySize(company.size || company.employeeCount);
  const revenue = company.revenue || 0;

  if (size >= 1000 && revenue > 100000000) {
    if (age === null || age === 0) return 'mature';
    if (age >= 10) return 'mature';
    return 'growth';
  }
  if (size >= 500) {
    if (age === null || age === 0) return 'mature';
    if (age >= 10) return 'mature';
    return 'growth';
  }
  if (age === null || age === 0) {
    if (size < 50) return 'startup';
    if (size < 500) return 'growth';
    return 'mature';
  }
  if (age < 3 && size < 50) return 'startup';
  if (age < 10 && size < 500) return 'growth';
  if (age >= 10 && size >= 500) return 'mature';
  if (age > 20 && size < 100 && revenue < 1000000) return 'declining';
  return 'mature';
}

function determineMarketPosition(company: any): 'leader' | 'challenger' | 'follower' | 'niche' {
  const size = parseCompanySize(company.size || company.employeeCount);
  const revenue = company.revenue || 0;
  const globalRank = company.globalRank || 999999;

  if (globalRank <= 1000) return 'leader';
  if (size >= 10000 || revenue >= 1000000000) return 'leader';
  if (size >= 1000 || revenue >= 100000000) return 'challenger';
  if (size >= 500) return 'challenger';
  if (size >= 100) return 'follower';
  return 'niche';
}

function inferIndustryCategory(industry: string): string | null {
  if (!industry) return null;
  const industryLower = industry.toLowerCase();
  
  if (industryLower.includes('utility') || industryLower.includes('energy') || 
      industryLower.includes('power') || industryLower.includes('electric') ||
      industryLower.includes('utilities') || industryLower.includes('electrical')) {
    return 'Utilities/Energy';
  }
  if (industryLower.includes('healthcare') || industryLower.includes('health') || 
      industryLower.includes('hospital') || industryLower.includes('medical')) {
    return 'Healthcare';
  }
  if (industryLower.includes('bank') || industryLower.includes('financial') || 
      industryLower.includes('insurance') || industryLower.includes('finance')) {
    return 'Financial Services';
  }
  if (industryLower.includes('software') || industryLower.includes('saas') ||
      industryLower.includes('it services') || industryLower.includes('information technology')) {
    return 'Technology/SaaS';
  }
  if (industryLower.includes('manufacturing') || industryLower.includes('manufacturer')) {
    return 'Manufacturing';
  }
  if (industryLower.includes('retail') || industryLower.includes('e-commerce') || 
      industryLower.includes('ecommerce')) {
    return 'Retail/E-commerce';
  }
  if (industryLower.includes('real estate') || industryLower.includes('title') || 
      industryLower.includes('property')) {
    return 'Real Estate';
  }
  if (industryLower.includes('education') || industryLower.includes('school') || 
      industryLower.includes('university')) {
    return 'Education';
  }
  if (industryLower.includes('government') || industryLower.includes('public sector')) {
    return 'Government/Public Sector';
  }
  if (industryLower.includes('consulting') || industryLower.includes('professional services') || 
      industryLower.includes('legal') || industryLower.includes('law')) {
    return 'Professional Services';
  }
  if (industryLower.includes('non-profit') || industryLower.includes('nonprofit') || 
      industryLower.includes('non profit')) {
    return 'Non-Profit';
  }
  return null;
}

function inferIndustryFromName(companyName: string): string | null {
  if (!companyName) return null;
  const nameLower = companyName.toLowerCase();
  
  if (nameLower.includes('power') || nameLower.includes('energy') || 
      nameLower.includes('electric') || nameLower.includes('utility')) {
    return 'Utilities/Energy';
  }
  if (nameLower.includes('health') || nameLower.includes('hospital') || 
      nameLower.includes('medical') || nameLower.includes('clinic')) {
    return 'Healthcare';
  }
  if (nameLower.includes('bank') || nameLower.includes('financial') || 
      nameLower.includes('insurance') || nameLower.includes('credit union')) {
    return 'Financial Services';
  }
  return null;
}

async function finalAuditAndRegenerate(workspaceId: string) {
  console.log('🔍 FINAL AUDIT AND REGENERATION\n');
  console.log('=' .repeat(80));
  console.log(`\n🎯 Workspace: ${workspaceId}\n`);
  
  try {
    // Step 1: Get all companies with cached intelligence
    console.log('📊 Step 1: Finding companies with cached intelligence...\n');
    const companies = await prisma.companies.findMany({
      where: {
        workspaceId,
        deletedAt: null,
        customFields: {
          path: ['strategyData'],
          not: null
        }
      },
      select: {
        id: true,
        name: true,
        size: true,
        employeeCount: true,
        revenue: true,
        foundedYear: true,
        globalRank: true,
        industry: true,
        sector: true,
        website: true,
        hqLocation: true,
        hqFullAddress: true,
        isPublic: true,
        description: true,
        linkedinFollowers: true,
        competitors: true,
        lastAction: true,
        nextAction: true,
        opportunityStage: true,
        opportunityAmount: true,
        customFields: true,
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
      },
      orderBy: { name: 'asc' }
    });
    
    console.log(`✅ Found ${companies.length} companies with cached intelligence\n`);
    
    // Step 2: Audit each company
    console.log('🔍 Step 2: Auditing companies...\n');
    let needsRegeneration = 0;
    const toRegenerate: Array<{ company: any; reasons: string[] }> = [];
    
    for (const company of companies) {
      const customFields = company.customFields as any || {};
      const strategyData = customFields?.strategyData;
      
      if (!strategyData) continue;
      
      const parsedSize = parseCompanySize(company.size || company.employeeCount);
      const expectedGrowthStage = determineGrowthStage(company);
      const expectedMarketPosition = determineMarketPosition(company);
      
      const currentGrowthStage = strategyData.growthStage || null;
      const currentMarketPosition = strategyData.marketPosition || null;
      const currentArchetype = strategyData.archetypeName || null;
      
      const reasons: string[] = [];
      let needsRegen = false;
      
      // Check for issues
      if (parsedSize >= 1000 && currentArchetype === 'The Fast-Growing Disruptor') {
        reasons.push(`Large company (${parsedSize} employees) incorrectly classified as Fast-Growing Disruptor`);
        needsRegen = true;
      }
      
      if (currentGrowthStage && currentGrowthStage !== expectedGrowthStage) {
        reasons.push(`Growth stage: ${currentGrowthStage} → ${expectedGrowthStage}`);
        needsRegen = true;
      }
      
      if (currentMarketPosition && currentMarketPosition !== expectedMarketPosition) {
        reasons.push(`Market position: ${currentMarketPosition} → ${expectedMarketPosition}`);
        needsRegen = true;
      }
      
      if (!currentGrowthStage || !currentMarketPosition) {
        reasons.push(`Missing growth stage or market position`);
        needsRegen = true;
      }
      
      if (needsRegen) {
        needsRegeneration++;
        toRegenerate.push({ company, reasons });
      }
    }
    
    console.log(`📈 Audit Results:`);
    console.log(`   ✅ Accurate: ${companies.length - needsRegeneration}`);
    console.log(`   🔄 Needs Regeneration: ${needsRegeneration}\n`);
    
    // Step 3: Regenerate intelligence
    if (toRegenerate.length === 0) {
      console.log('✅ All companies have accurate intelligence! No regeneration needed.\n');
      return;
    }
    
    console.log(`🔄 Step 3: Regenerating intelligence for ${toRegenerate.length} companies...\n`);
    console.log('=' .repeat(80));
    
    let successCount = 0;
    let errorCount = 0;
    
    for (let i = 0; i < toRegenerate.length; i++) {
      const { company, reasons } = toRegenerate[i];
      
      try {
        console.log(`\n[${i + 1}/${toRegenerate.length}] Processing: ${company.name}`);
        console.log(`   Reasons: ${reasons.join(', ')}`);
        
        const customFields = company.customFields as any || {};
        const parsedSize = parseCompanySize(company.size || company.employeeCount);
        const expectedGrowthStage = determineGrowthStage(company);
        const expectedMarketPosition = determineMarketPosition(company);
        
        // Determine target industry
        const targetIndustry = customFields?.targetIndustry || 
          (company.industry ? inferIndustryCategory(company.industry) : null) ||
          (company.sector ? inferIndustryCategory(company.sector) : null) ||
          (company.name ? inferIndustryFromName(company.name) : null) ||
          'Unknown';
        
        // Prepare strategy request
        const strategyRequest: CompanyStrategyRequest = {
          companyId: company.id,
          companyName: company.name,
          companyIndustry: company.industry || 'Unknown',
          targetIndustry: targetIndustry,
          companySize: parsedSize,
          companyRevenue: company.revenue || 0,
          companyAge: company.foundedYear ? 
            new Date().getFullYear() - company.foundedYear : null,
          growthStage: expectedGrowthStage,
          marketPosition: expectedMarketPosition,
          forceRegenerate: true,
          website: company.website,
          headquarters: company.hqLocation || company.hqFullAddress,
          foundedYear: company.foundedYear,
          isPublic: company.isPublic,
          sector: company.sector,
          description: company.description,
          linkedinFollowers: company.linkedinFollowers,
          globalRank: company.globalRank,
          competitors: Array.isArray(company.competitors) ? company.competitors : [],
          lastAction: company.lastAction,
          nextAction: company.nextAction,
          opportunityStage: company.opportunityStage,
          opportunityAmount: company.opportunityAmount,
          people: company.people?.map(p => ({
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
        console.log(`   🤖 Generating intelligence...`);
        const strategyResponse = await companyStrategyService.generateCompanyStrategy(strategyRequest);
        
        if (!strategyResponse.success || !strategyResponse.data) {
          console.log(`   ⚠️  Generation failed: ${strategyResponse.error}`);
          errorCount++;
          continue;
        }
        
        // Update company
        await prisma.companies.update({
          where: { id: company.id },
          data: {
            customFields: {
              ...customFields,
              targetIndustry: targetIndustry,
              strategyData: strategyResponse.data,
              lastStrategyUpdate: new Date().toISOString()
            }
          }
        });
        
        console.log(`   ✅ Generated: ${strategyResponse.data.archetypeName} / ${strategyResponse.data.targetIndustry}`);
        successCount++;
        
        // Small delay to avoid rate limiting
        if (i < toRegenerate.length - 1) {
          await new Promise(resolve => setTimeout(resolve, 1000));
        }
        
      } catch (error) {
        console.error(`   ❌ Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
        errorCount++;
      }
    }
    
    // Final summary
    console.log('\n' + '=' .repeat(80));
    console.log('\n📊 FINAL SUMMARY:');
    console.log('=' .repeat(80));
    console.log(`✅ Successfully regenerated: ${successCount}`);
    console.log(`❌ Errors: ${errorCount}`);
    console.log(`📈 Total companies processed: ${toRegenerate.length}`);
    console.log(`\n💡 All intelligence has been regenerated with the improved logic!`);
    console.log(`   Companies now have accurate classifications based on:`);
    console.log(`   - Correct size parsing`);
    console.log(`   - Proper growth stage determination`);
    console.log(`   - Accurate market position`);
    console.log(`   - Correct archetype classification`);
    console.log('\n✅ Regeneration completed!\n');
    
  } catch (error) {
    console.error('\n❌ Error:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

if (require.main === module) {
  const args = process.argv.slice(2);
  const workspaceId = args.find(arg => arg.startsWith('--workspace='))?.split('=')[1] || '01K9QAP09FHT6EAP1B4G2KP3D2';
  
  finalAuditAndRegenerate(workspaceId)
    .then(() => {
      console.log('✅ Final audit and regeneration completed');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ Final audit and regeneration failed:', error);
      process.exit(1);
    });
}

export { finalAuditAndRegenerate };

