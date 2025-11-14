/**
 * Pre-generate Intelligence Summaries for Fixed Companies
 * 
 * This script generates intelligence summaries for companies that were fixed
 * but don't have cached intelligence data yet.
 */

import { prisma } from '../src/lib/prisma';
import { companyStrategyService, CompanyStrategyRequest } from '../src/platform/services/company-strategy-service';

// List of company IDs that were fixed (from the previous fix run)
const FIXED_COMPANY_IDS = [
  '01K9QD37WW20C0PBD7P7XJC197', // National Grid USA
  '01K9QD382T5FKBSF0AS72RAFAT', // Minnesota Power
  '01K7DW2M599GF480RN7FRNDRMQ', // Avista Corp. Credit Union
  '01K46CH4KQCP1PD7P988FK0R3F', // 1st Nationwide Mortgage & Real Estate
  '01K9QD3892FZMJPV2JWTKMAF7D', // CenterPoint Energy
  '01K9QD38P55446MCN0SATBXDNY', // Bartlett Electric Cooperative
  '01K9QD3M334P4HVW8FPNNAGJ72', // Alpine Power Systems
  '01K7DW4W2T9ZND034KQZ4JTXMS', // Centerpoint Energy
  '01K7DW309MST3JSG6AK1AM3X17'  // Eversource Energy
];

async function preGenerateIntelligence() {
  console.log('🤖 Pre-generating Intelligence Summaries for Fixed Companies\n');
  console.log('=' .repeat(80));
  
  try {
    const companies = await prisma.companies.findMany({
      where: {
        id: { in: FIXED_COMPANY_IDS },
        deletedAt: null
      },
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
    
    console.log(`\n📊 Found ${companies.length} companies to generate intelligence for\n`);
    
    if (companies.length === 0) {
      console.log('⚠️  No companies found. They may have already been generated or don\'t exist.');
      return;
    }
    
    // Helper functions
    function determineGrowthStage(company: any): 'startup' | 'growth' | 'mature' | 'declining' {
      const age = company.foundedAt ? 
        Math.floor((Date.now() - new Date(company.foundedAt).getTime()) / (365.25 * 24 * 60 * 60 * 1000)) : 0;
      const size = company.size || 0;
      
      if (age < 3 && size < 50) return 'startup';
      if (age < 10 && size < 500) return 'growth';
      if (age >= 10 && size >= 500) return 'mature';
      return 'declining';
    }
    
    function determineMarketPosition(company: any): 'leader' | 'challenger' | 'follower' | 'niche' {
      const size = company.size || 0;
      const revenue = company.revenue || 0;
      const globalRank = company.globalRank || 999999;
      
      if (globalRank <= 1000) return 'leader';
      if (size > 1000 || revenue > 100000000) return 'challenger';
      if (size > 100) return 'follower';
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
      if (industryLower.includes('bank') || industryLower.includes('financial') || 
          industryLower.includes('insurance') || industryLower.includes('finance')) {
        return 'Financial Services';
      }
      if (industryLower.includes('real estate') || industryLower.includes('title') || 
          industryLower.includes('property')) {
        return 'Real Estate';
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
      if (nameLower.includes('bank') || nameLower.includes('financial') || 
          nameLower.includes('credit union')) {
        return 'Financial Services';
      }
      return null;
    }
    
    let successCount = 0;
    let errorCount = 0;
    
    for (const company of companies) {
      try {
        console.log(`\nProcessing: ${company.name}...`);
        
        const customFields = company.customFields as any || {};
        
        // Determine correct target industry
        const targetIndustry = customFields.targetIndustry || 
          (company.industry ? inferIndustryCategory(company.industry) : null) ||
          (company.sector ? inferIndustryCategory(company.sector) : null) ||
          (company.name ? inferIndustryFromName(company.name) : null) ||
          'Unknown';
        
        console.log(`  Target Industry: ${targetIndustry}`);
        
        // Check if already has strategy data
        if (customFields.strategyData) {
          console.log(`  ℹ️  Already has cached intelligence, skipping...`);
          continue;
        }
        
        // Prepare strategy request
        const strategyRequest: CompanyStrategyRequest = {
          companyId: company.id,
          companyName: company.name,
          companyIndustry: company.industry || 'Unknown',
          targetIndustry: targetIndustry,
          companySize: company.size || 0,
          companyRevenue: company.revenue || 0,
          companyAge: company.foundedAt ? 
            Math.floor((Date.now() - new Date(company.foundedAt).getTime()) / (365.25 * 24 * 60 * 60 * 1000)) : 0,
          growthStage: determineGrowthStage(company),
          marketPosition: determineMarketPosition(company),
          forceRegenerate: true,
          website: company.website,
          headquarters: company.headquarters,
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
        console.log(`  🤖 Generating intelligence...`);
        const strategyResponse = await companyStrategyService.generateCompanyStrategy(strategyRequest);
        
        if (!strategyResponse.success || !strategyResponse.data) {
          console.log(`  ❌ Generation failed: ${strategyResponse.error}`);
          errorCount++;
          continue;
        }
        
        // Update company with new strategy data
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
        
        console.log(`  ✅ Generated and saved intelligence`);
        console.log(`  📝 Summary preview: ${strategyResponse.data.strategySummary?.substring(0, 100)}...`);
        successCount++;
        
      } catch (error) {
        console.error(`  ❌ Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
        errorCount++;
      }
    }
    
    console.log('\n' + '=' .repeat(80));
    console.log('\n📊 Summary:');
    console.log(`✅ Successfully generated: ${successCount}`);
    console.log(`❌ Errors: ${errorCount}`);
    console.log(`\n💡 Intelligence summaries are now ready for viewing!\n`);
    
  } catch (error) {
    console.error('\n❌ Error:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

if (require.main === module) {
  preGenerateIntelligence()
    .then(() => {
      console.log('✅ Pre-generation completed');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ Pre-generation failed:', error);
      process.exit(1);
    });
}

export { preGenerateIntelligence };

