/**
 * Generate strategy data for Southern Company
 */

import { PrismaClient } from '@prisma/client';
import { companyStrategyService, CompanyStrategyRequest } from '../src/platform/services/company-strategy-service';

const prisma = new PrismaClient();

async function generateSouthernCompanyStrategy() {
  const companyId = '01K9QD2ST0C0TTG34EMRD3M69H';
  const companyName = 'Southern Company';

  try {
    console.log(`🚀 Generating strategy for ${companyName} (${companyId})...\n`);

    // Get company data
    const company = await prisma.companies.findUnique({
      where: { id: companyId },
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
          take: 20 // Limit to first 20 people
        }
      }
    });

    if (!company) {
      console.log('❌ Company not found');
      return;
    }

    console.log('✅ Company found:', {
      name: company.name,
      industry: company.industry,
      size: company.size,
      employeeCount: company.employeeCount,
      revenue: company.revenue,
      peopleCount: company.people.length
    });

    // Helper functions (simplified versions from the route)
    function parseCompanySize(size: any): number {
      if (typeof size === 'number') return size;
      if (!size) return 0;
      const sizeStr = String(size).toLowerCase();
      const match = sizeStr.match(/(\d{1,3}(?:,\d{3})*)/);
      if (match) return parseInt(match[1].replace(/,/g, ''), 10);
      const rangeMatch = sizeStr.match(/(\d+)\s*-\s*(\d+)/);
      if (rangeMatch) return parseInt(rangeMatch[2], 10);
      if (sizeStr.includes('10000+') || sizeStr.includes('enterprise')) return 10000;
      if (sizeStr.includes('5000+')) return 5000;
      if (sizeStr.includes('1000+')) return 1000;
      if (sizeStr.includes('500+')) return 500;
      if (sizeStr.includes('200+')) return 200;
      if (sizeStr.includes('50+')) return 50;
      return 0;
    }

    function determineGrowthStage(company: any): 'startup' | 'growth' | 'mature' | 'declining' {
      const age = company.foundedYear ? new Date().getFullYear() - company.foundedYear : null;
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
      // ... other categories
      return null;
    }

    // Prepare strategy request
    const inferredTargetIndustry = company.customFields?.targetIndustry || 
      (company.industry ? inferIndustryCategory(company.industry) : null) ||
      'Unknown';

    const strategyRequest: CompanyStrategyRequest = {
      companyId,
      companyName: company.name,
      companyIndustry: company.industry || 'Unknown',
      targetIndustry: inferredTargetIndustry,
      companySize: parseCompanySize(company.size || company.employeeCount),
      companyRevenue: company.revenue || 0,
      companyAge: company.foundedYear ? new Date().getFullYear() - company.foundedYear : null,
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
      people: company.people || []
    };

    console.log('\n📋 Strategy Request:', {
      companyName: strategyRequest.companyName,
      companyIndustry: strategyRequest.companyIndustry,
      targetIndustry: strategyRequest.targetIndustry,
      companySize: strategyRequest.companySize,
      growthStage: strategyRequest.growthStage,
      marketPosition: strategyRequest.marketPosition
    });

    console.log('\n🤖 Generating strategy (this may take 30-60 seconds)...');
    const startTime = Date.now();
    
    const strategyResponse = await companyStrategyService.generateCompanyStrategy(strategyRequest);
    
    const duration = Date.now() - startTime;
    console.log(`\n⏱️ Generation took ${duration}ms`);

    if (!strategyResponse.success || !strategyResponse.data) {
      console.error('❌ Strategy generation failed:', strategyResponse.error);
      return;
    }

    console.log('\n✅ Strategy generated successfully!');
    console.log('📊 Strategy Summary:', strategyResponse.data.strategySummary?.substring(0, 200) + '...');
    console.log('🏢 Archetype:', strategyResponse.data.archetypeName);
    console.log('🎯 Target Industry:', strategyResponse.data.targetIndustry);

    // Save to database
    console.log('\n💾 Saving to database...');
    await prisma.companies.update({
      where: { id: companyId },
      data: {
        customFields: {
          ...company.customFields,
          strategyData: strategyResponse.data,
          lastStrategyUpdate: new Date().toISOString()
        }
      }
    });

    console.log('✅ Strategy saved to database!');
    console.log('\n🎉 Complete! The intelligence tab should now load instantly.');

  } catch (error) {
    console.error('❌ Error generating strategy:', error);
    if (error instanceof Error) {
      console.error('Error message:', error.message);
      console.error('Error stack:', error.stack);
    }
  } finally {
    await prisma.$disconnect();
  }
}

generateSouthernCompanyStrategy();

