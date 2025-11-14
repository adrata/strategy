/**
 * Verify Intelligence Accuracy for Top-Temp Companies
 * 
 * This script verifies that all companies with cached intelligence
 * have accurate classifications based on the improved logic.
 */

import { prisma } from '../src/lib/prisma';

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

async function verifyIntelligenceAccuracy(workspaceId: string) {
  console.log('🔍 Verifying Intelligence Accuracy for Top-Temp\n');
  console.log('=' .repeat(80));
  
  try {
    // Get all companies with cached strategy data
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
        customFields: true
      },
      orderBy: { name: 'asc' }
    });
    
    console.log(`\n📊 Found ${companies.length} companies with cached intelligence\n`);
    
    let accurateCount = 0;
    let inaccurateCount = 0;
    const inaccurate: Array<{
      name: string;
      id: string;
      issues: string[];
      current: any;
      expected: any;
    }> = [];
    
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
      
      const issues: string[] = [];
      
      // Check growth stage
      if (currentGrowthStage && currentGrowthStage !== expectedGrowthStage) {
        issues.push(`Growth stage: ${currentGrowthStage} (expected: ${expectedGrowthStage})`);
      }
      
      // Check market position
      if (currentMarketPosition && currentMarketPosition !== expectedMarketPosition) {
        issues.push(`Market position: ${currentMarketPosition} (expected: ${expectedMarketPosition})`);
      }
      
      // Check archetype for large companies
      if (parsedSize >= 1000 && currentArchetype === 'The Fast-Growing Disruptor') {
        issues.push(`Large company (${parsedSize} employees) incorrectly classified as Fast-Growing Disruptor`);
      }
      
      // Check for declining classification on large companies
      if (parsedSize >= 1000 && currentGrowthStage === 'declining') {
        issues.push(`Large company (${parsedSize} employees) incorrectly classified as declining`);
      }
      
      if (issues.length > 0) {
        inaccurateCount++;
        inaccurate.push({
          name: company.name,
          id: company.id,
          issues,
          current: {
            growthStage: currentGrowthStage,
            marketPosition: currentMarketPosition,
            archetype: currentArchetype,
            size: company.size,
            parsedSize
          },
          expected: {
            growthStage: expectedGrowthStage,
            marketPosition: expectedMarketPosition
          }
        });
      } else {
        accurateCount++;
      }
    }
    
    // Summary
    console.log('\n📈 Verification Results:');
    console.log('=' .repeat(80));
    console.log(`✅ Accurate classifications: ${accurateCount} (${Math.round(accurateCount / companies.length * 100)}%)`);
    console.log(`❌ Inaccurate classifications: ${inaccurateCount} (${Math.round(inaccurateCount / companies.length * 100)}%)`);
    
    if (inaccurate.length > 0) {
      console.log('\n\n⚠️  Companies with Inaccurate Classifications:');
      console.log('=' .repeat(80));
      
      inaccurate.slice(0, 30).forEach((item, index) => {
        console.log(`\n${index + 1}. ${item.name}`);
        console.log(`   Size: ${item.current.size || 'N/A'} → ${item.current.parsedSize} employees`);
        console.log(`   Current: ${item.current.growthStage || 'N/A'} / ${item.current.marketPosition || 'N/A'} / ${item.current.archetype || 'N/A'}`);
        console.log(`   Expected: ${item.expected.growthStage} / ${item.expected.marketPosition}`);
        console.log(`   Issues: ${item.issues.join(', ')}`);
      });
      
      if (inaccurate.length > 30) {
        console.log(`\n... and ${inaccurate.length - 30} more companies with issues`);
      }
      
      console.log('\n\n💡 Recommendation:');
      console.log(`   Run: npm run regenerate:intelligence -- --workspace=${workspaceId}`);
      console.log(`   This will regenerate intelligence for ${inaccurateCount} companies with improved logic.\n`);
    } else {
      console.log('\n\n✅ All companies have accurate classifications!');
      console.log('   No regeneration needed.\n');
    }
    
    // Generate report
    const fs = require('fs');
    const path = require('path');
    const reportPath = path.join(process.cwd(), 'logs', `intelligence-verification-${Date.now()}.json`);
    
    const logsDir = path.join(process.cwd(), 'logs');
    if (!fs.existsSync(logsDir)) {
      fs.mkdirSync(logsDir, { recursive: true });
    }
    
    const report = {
      verificationDate: new Date().toISOString(),
      workspaceId,
      summary: {
        totalCompanies: companies.length,
        accurate: accurateCount,
        inaccurate: inaccurateCount,
        accuracyPercentage: Math.round(accurateCount / companies.length * 100)
      },
      inaccurateCompanies: inaccurate
    };
    
    fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
    console.log(`📄 Detailed report saved to: ${reportPath}\n`);
    
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
  
  verifyIntelligenceAccuracy(workspaceId)
    .then(() => process.exit(0))
    .catch((error) => {
      console.error('❌ Verification failed:', error);
      process.exit(1);
    });
}

export { verifyIntelligenceAccuracy };

