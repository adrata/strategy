/**
 * Test Script: Intelligence Summary Technology/SaaS Fix
 * 
 * This script tests the fixes for incorrect Technology/SaaS classifications
 * and identifies companies that need intelligence regeneration.
 */

import { prisma } from '../src/lib/prisma';
import * as fs from 'fs';
import * as path from 'path';

interface TestResult {
  companyId: string;
  companyName: string;
  currentIndustry: string | null;
  currentTargetIndustry: string | null;
  inferredTargetIndustry: string | null;
  hasCachedStrategy: boolean;
  strategySummaryPreview: string | null;
  needsRegeneration: boolean;
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
  
  // Only match standalone "technology" or "tech" if clearly the industry
  if ((industryLower === 'technology' || industryLower === 'tech') && 
      !industryLower.includes('energy') && 
      !industryLower.includes('power') &&
      !industryLower.includes('utility')) {
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

// Check if strategy summary incorrectly mentions Technology/SaaS
function hasIncorrectTechSaaSClassification(strategySummary: string | null): boolean {
  if (!strategySummary) return false;
  
  const summaryLower = strategySummary.toLowerCase();
  
  // Check for Technology/SaaS mentions that might be incorrect
  const techSaaSPhrases = [
    'technology/saas company',
    'tech/saas company',
    'technology company',
    'saas company',
    'tech company'
  ];
  
  return techSaaSPhrases.some(phrase => summaryLower.includes(phrase));
}

// Check if company should be classified as utilities/energy
function shouldBeUtilitiesEnergy(company: any): boolean {
  const industry = company.industry || '';
  const sector = company.sector || '';
  const name = company.name || '';
  
  const industryLower = industry.toLowerCase();
  const sectorLower = sector.toLowerCase();
  const nameLower = name.toLowerCase();
  
  const utilitiesKeywords = ['utility', 'energy', 'power', 'electric', 'utilities', 'electrical', 'gas', 'water', 'steam'];
  
  return utilitiesKeywords.some(keyword => 
    industryLower.includes(keyword) || 
    sectorLower.includes(keyword) || 
    nameLower.includes(keyword)
  );
}

async function testIntelligenceSummaryFixes() {
  console.log('🧪 Testing Intelligence Summary Technology/SaaS Fixes\n');
  console.log('=' .repeat(80));
  
  try {
    // Get all companies with cached strategy data
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
      },
      take: 1000 // Limit for testing
    });
    
    console.log(`\n📊 Found ${companies.length} companies with cached strategy data\n`);
    
    const testResults: TestResult[] = [];
    let incorrectClassifications = 0;
    let utilitiesCompanies = 0;
    let needsRegeneration = 0;
    
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
      const strategySummary = strategyData.strategySummary || null;
      
      // Check if this is a utilities/energy company
      const isUtilitiesEnergy = shouldBeUtilitiesEnergy(company);
      if (isUtilitiesEnergy) {
        utilitiesCompanies++;
      }
      
      // Check for issues
      let needsRegen = false;
      let issue = '';
      
      // Issue 1: Utilities/Energy company classified as Technology/SaaS
      if (isUtilitiesEnergy && currentTargetIndustry === 'Technology/SaaS') {
        needsRegen = true;
        issue = 'Utilities/Energy company incorrectly classified as Technology/SaaS';
        incorrectClassifications++;
      }
      
      // Issue 2: Strategy summary mentions Technology/SaaS but company isn't tech
      if (hasIncorrectTechSaaSClassification(strategySummary) && !isUtilitiesEnergy) {
        // Check if company industry actually suggests tech
        const companyIndustryLower = (company.industry || '').toLowerCase();
        const isActuallyTech = companyIndustryLower.includes('software') || 
                              companyIndustryLower.includes('saas') ||
                              companyIndustryLower.includes('it services') ||
                              companyIndustryLower.includes('information technology');
        
        if (!isActuallyTech) {
          needsRegen = true;
          issue = 'Strategy summary incorrectly mentions Technology/SaaS';
          incorrectClassifications++;
        }
      }
      
      // Issue 3: Target industry doesn't match inferred industry
      if (inferredTargetIndustry !== 'Unknown' && 
          currentTargetIndustry !== inferredTargetIndustry &&
          currentTargetIndustry === 'Technology/SaaS') {
        needsRegen = true;
        issue = `Target industry mismatch: has "${currentTargetIndustry}" but should be "${inferredTargetIndustry}"`;
        incorrectClassifications++;
      }
      
      if (needsRegen) {
        needsRegeneration++;
      }
      
      testResults.push({
        companyId: company.id,
        companyName: company.name,
        currentIndustry: company.industry,
        currentTargetIndustry,
        inferredTargetIndustry,
        hasCachedStrategy: !!strategyData,
        strategySummaryPreview: strategySummary ? strategySummary.substring(0, 100) + '...' : null,
        needsRegeneration: needsRegen,
        issue
      });
    }
    
    // Print summary
    console.log('\n📈 Test Results Summary:');
    console.log('=' .repeat(80));
    console.log(`Total companies tested: ${companies.length}`);
    console.log(`Utilities/Energy companies found: ${utilitiesCompanies}`);
    console.log(`Companies with incorrect classifications: ${incorrectClassifications}`);
    console.log(`Companies needing regeneration: ${needsRegeneration}`);
    
    // Print detailed results for companies with issues
    if (testResults.filter(r => r.needsRegeneration).length > 0) {
      console.log('\n\n⚠️  Companies with Issues:');
      console.log('=' .repeat(80));
      
      const companiesWithIssues = testResults.filter(r => r.needsRegeneration);
      companiesWithIssues.forEach((result, index) => {
        console.log(`\n${index + 1}. ${result.companyName} (ID: ${result.companyId})`);
        console.log(`   Issue: ${result.issue}`);
        console.log(`   Current Industry: ${result.currentIndustry || 'Not set'}`);
        console.log(`   Current Target Industry: ${result.currentTargetIndustry || 'Not set'}`);
        console.log(`   Inferred Target Industry: ${result.inferredTargetIndustry || 'Unknown'}`);
        if (result.strategySummaryPreview) {
          console.log(`   Strategy Summary Preview: ${result.strategySummaryPreview}`);
        }
      });
    }
    
    // Test specific company: Minnesota Power
    console.log('\n\n🎯 Testing Specific Company: Minnesota Power');
    console.log('=' .repeat(80));
    
    const minnesotaPower = companies.find(c => 
      c.name.toLowerCase().includes('minnesota') && 
      c.name.toLowerCase().includes('power')
    );
    
    if (minnesotaPower) {
      const mpCustomFields = minnesotaPower.customFields as any;
      const mpStrategy = mpCustomFields?.strategyData;
      
      console.log(`\nFound: ${minnesotaPower.name}`);
      console.log(`Industry: ${minnesotaPower.industry || 'Not set'}`);
      console.log(`Sector: ${minnesotaPower.sector || 'Not set'}`);
      
      const mpInferred = mpCustomFields?.targetIndustry || 
        (minnesotaPower.industry ? inferIndustryCategory(minnesotaPower.industry) : null) ||
        (minnesotaPower.sector ? inferIndustryCategory(minnesotaPower.sector) : null) ||
        (minnesotaPower.name ? inferIndustryFromName(minnesotaPower.name) : null) ||
        'Unknown';
      
      console.log(`Inferred Target Industry: ${mpInferred}`);
      
      if (mpStrategy) {
        console.log(`Current Target Industry: ${mpStrategy.targetIndustry || mpStrategy.targetIndustryCategory || 'Not set'}`);
        console.log(`Strategy Summary (first 200 chars): ${mpStrategy.strategySummary?.substring(0, 200) || 'Not available'}`);
        
        const hasIssue = mpStrategy.targetIndustry === 'Technology/SaaS' || 
                        hasIncorrectTechSaaSClassification(mpStrategy.strategySummary);
        
        if (hasIssue) {
          console.log(`\n❌ ISSUE DETECTED: Minnesota Power has incorrect classification`);
          console.log(`   Recommendation: Force regenerate intelligence for this company`);
        } else {
          console.log(`\n✅ No issues detected for Minnesota Power`);
        }
      } else {
        console.log(`\nℹ️  No cached strategy data found`);
      }
    } else {
      console.log(`\n⚠️  Minnesota Power not found in test dataset`);
    }
    
    // Generate report file
    const report = {
      testDate: new Date().toISOString(),
      summary: {
        totalCompaniesTested: companies.length,
        utilitiesEnergyCompanies: utilitiesCompanies,
        incorrectClassifications,
        needsRegeneration
      },
      companiesWithIssues: testResults.filter(r => r.needsRegeneration).map(r => ({
        companyId: r.companyId,
        companyName: r.companyName,
        issue: r.issue,
        currentIndustry: r.currentIndustry,
        currentTargetIndustry: r.currentTargetIndustry,
        inferredTargetIndustry: r.inferredTargetIndustry
      }))
    };
    
    const reportPath = path.join(process.cwd(), 'logs', `intelligence-fix-test-report-${Date.now()}.json`);
    
    // Ensure logs directory exists
    const logsDir = path.join(process.cwd(), 'logs');
    if (!fs.existsSync(logsDir)) {
      fs.mkdirSync(logsDir, { recursive: true });
    }
    
    fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
    
    console.log(`\n\n📄 Detailed report saved to: ${reportPath}`);
    
    // Provide next steps
    if (needsRegeneration > 0) {
      console.log('\n\n📋 Next Steps:');
      console.log('=' .repeat(80));
      console.log(`\n${needsRegeneration} companies need intelligence regeneration.`);
      console.log('\nTo fix these companies, you can:');
      console.log('1. Use the UI: Navigate to each company and click "Regenerate Intelligence"');
      console.log('2. Use the API: POST to /api/v1/strategy/company/[id] with { "forceRegenerate": true }');
      console.log('3. Run a batch script: Create a script to regenerate all affected companies');
      console.log('\nThe fixes will ensure companies are correctly classified based on their actual industry.');
    } else {
      console.log('\n\n✅ All companies have correct classifications!');
      console.log('No regeneration needed.');
    }
    
    console.log('\n✅ Test completed!\n');
    
    // Return results for programmatic use
    return {
      success: true,
      summary: report.summary,
      companiesWithIssues: report.companiesWithIssues,
      reportPath
    };
    
  } catch (error) {
    console.error('\n❌ Error running test:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Run the test
if (require.main === module) {
  testIntelligenceSummaryFixes()
    .then((result) => {
      console.log('\n✅ Test script completed successfully');
      process.exit(0);
    })
    .catch((error) => {
      console.error('\n❌ Test script failed:', error);
      process.exit(1);
    });
}

export { testIntelligenceSummaryFixes };

