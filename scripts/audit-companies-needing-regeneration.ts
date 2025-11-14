/**
 * Audit Companies Needing Intelligence Regeneration
 * 
 * Identifies companies that would have different classifications
 * with the improved logic (size parsing, growth stage, archetype fixes)
 */

import { prisma } from '../src/lib/prisma';

interface CompanyAudit {
  companyId: string;
  companyName: string;
  currentSize: any;
  parsedSize: number;
  currentAge: number | null;
  currentGrowthStage: string | null;
  expectedGrowthStage: string;
  currentMarketPosition: string | null;
  expectedMarketPosition: string;
  currentArchetype: string | null;
  needsRegeneration: boolean;
  reasons: string[];
}

// Helper function to parse company size
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
  const age = company.foundedAt ? 
    Math.floor((Date.now() - new Date(company.foundedAt).getTime()) / (365.25 * 24 * 60 * 60 * 1000)) : null;
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

async function auditCompanies(workspaceId?: string) {
  console.log('🔍 Auditing Companies for Intelligence Regeneration\n');
  console.log('=' .repeat(80));
  
  if (workspaceId) {
    console.log(`\n🎯 Filtering for workspace: ${workspaceId}\n`);
  }
  
  try {
    // Get all companies with cached strategy data
    const companies = await prisma.companies.findMany({
      where: {
        deletedAt: null,
        ...(workspaceId ? { workspaceId } : {}),
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
        customFields: true
      },
      take: 1000
    });
    
    console.log(`\n📊 Found ${companies.length} companies with cached intelligence\n`);
    
    const audits: CompanyAudit[] = [];
    let needsRegeneration = 0;
    
    for (const company of companies) {
      const customFields = company.customFields as any;
      const strategyData = customFields?.strategyData;
      
      if (!strategyData) continue;
      
      const parsedSize = parseCompanySize(company.size || company.employeeCount);
      const age = company.foundedYear ? 
        new Date().getFullYear() - company.foundedYear : null;
      
      const expectedGrowthStage = determineGrowthStage(company);
      const expectedMarketPosition = determineMarketPosition(company);
      
      const currentGrowthStage = strategyData.growthStage || null;
      const currentMarketPosition = strategyData.marketPosition || null;
      const currentArchetype = strategyData.archetypeName || null;
      
      const reasons: string[] = [];
      let needsRegen = false;
      
      // Check if size parsing would change things
      if (typeof company.size === 'string' && company.size.includes('+')) {
        const oldSize = typeof company.size === 'string' ? 0 : (company.size || 0);
        if (parsedSize !== oldSize && parsedSize > 0) {
          reasons.push(`Size parsing: "${company.size}" → ${parsedSize} employees`);
          needsRegen = true;
        }
      }
      
      // Check if growth stage would be different
      if (currentGrowthStage && currentGrowthStage !== expectedGrowthStage) {
        reasons.push(`Growth stage: ${currentGrowthStage} → ${expectedGrowthStage}`);
        needsRegen = true;
      }
      
      // Check if market position would be different
      if (currentMarketPosition && currentMarketPosition !== expectedMarketPosition) {
        reasons.push(`Market position: ${currentMarketPosition} → ${expectedMarketPosition}`);
        needsRegen = true;
      }
      
      // Check for companies with "declining" that should be "mature"
      if (currentGrowthStage === 'declining' && expectedGrowthStage === 'mature') {
        reasons.push(`Incorrectly classified as declining (should be mature)`);
        needsRegen = true;
      }
      
      // Check for large companies with "Fast-Growing Disruptor" archetype
      if (parsedSize >= 1000 && currentArchetype === 'The Fast-Growing Disruptor') {
        reasons.push(`Large company incorrectly classified as Fast-Growing Disruptor`);
        needsRegen = true;
      }
      
      if (needsRegen) {
        needsRegeneration++;
      }
      
      audits.push({
        companyId: company.id,
        companyName: company.name,
        currentSize: company.size,
        parsedSize,
        currentAge: age,
        currentGrowthStage,
        expectedGrowthStage,
        currentMarketPosition,
        expectedMarketPosition,
        currentArchetype,
        needsRegeneration: needsRegen,
        reasons
      });
    }
    
    // Summary
    console.log('\n📈 Audit Results:');
    console.log('=' .repeat(80));
    console.log(`Total companies audited: ${companies.length}`);
    console.log(`Companies needing regeneration: ${needsRegeneration}`);
    console.log(`Companies with correct classifications: ${companies.length - needsRegeneration}`);
    
    // Show companies that need regeneration
    const companiesNeedingRegen = audits.filter(a => a.needsRegeneration);
    
    if (companiesNeedingRegen.length > 0) {
      console.log('\n\n⚠️  Companies Needing Regeneration:');
      console.log('=' .repeat(80));
      
      companiesNeedingRegen.slice(0, 20).forEach((audit, index) => {
        console.log(`\n${index + 1}. ${audit.companyName}`);
        console.log(`   Size: ${audit.currentSize} → ${audit.parsedSize} employees`);
        console.log(`   Growth Stage: ${audit.currentGrowthStage || 'N/A'} → ${audit.expectedGrowthStage}`);
        console.log(`   Market Position: ${audit.currentMarketPosition || 'N/A'} → ${audit.expectedMarketPosition}`);
        console.log(`   Reasons: ${audit.reasons.join(', ')}`);
      });
      
      if (companiesNeedingRegen.length > 20) {
        console.log(`\n... and ${companiesNeedingRegen.length - 20} more companies`);
      }
    }
    
    // Generate report
    const fs = require('fs');
    const path = require('path');
    const reportPath = path.join(process.cwd(), 'logs', `intelligence-regeneration-audit-${Date.now()}.json`);
    
    const logsDir = path.join(process.cwd(), 'logs');
    if (!fs.existsSync(logsDir)) {
      fs.mkdirSync(logsDir, { recursive: true });
    }
    
    const report = {
      auditDate: new Date().toISOString(),
      summary: {
        totalCompanies: companies.length,
        needsRegeneration,
        correctClassifications: companies.length - needsRegeneration
      },
      companiesNeedingRegeneration: companiesNeedingRegen.map(a => ({
        companyId: a.companyId,
        companyName: a.companyName,
        reasons: a.reasons,
        currentGrowthStage: a.currentGrowthStage,
        expectedGrowthStage: a.expectedGrowthStage,
        currentMarketPosition: a.currentMarketPosition,
        expectedMarketPosition: a.expectedMarketPosition
      }))
    };
    
    fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
    
    console.log(`\n\n📄 Detailed report saved to: ${reportPath}`);
    console.log('\n💡 Recommendation:');
    if (needsRegeneration > 0) {
      console.log(`   ${needsRegeneration} companies would benefit from regeneration with the improved logic.`);
      console.log(`   Consider regenerating intelligence for these companies to get accurate classifications.`);
    } else {
      console.log(`   All companies have correct classifications! No regeneration needed.`);
    }
    console.log('\n✅ Audit completed!\n');
    
  } catch (error) {
    console.error('\n❌ Error:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

if (require.main === module) {
  const args = process.argv.slice(2);
  const workspaceId = args.find(arg => arg.startsWith('--workspace='))?.split('=')[1];
  
  auditCompanies(workspaceId)
    .then(() => process.exit(0))
    .catch((error) => {
      console.error('❌ Audit failed:', error);
      process.exit(1);
    });
}

export { auditCompanies };

