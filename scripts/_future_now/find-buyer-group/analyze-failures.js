#!/usr/bin/env node

/**
 * Analyze Buyer Group Discovery Failures
 * 
 * This script:
 * 1. Identifies companies without buyer groups
 * 2. Tests buyer group discovery on them
 * 3. Documents the failure reasons
 * 4. Provides recommendations for improvements
 */

require('dotenv').config();
const { PrismaClient } = require('@prisma/client');
const { SmartBuyerGroupPipeline } = require('./index');

const TOP_WORKSPACE_ID = '01K75ZD7DWHG1XF16HAF2YVKCK';
const ADRATA_WORKSPACE_ID = '01K7464TNANHQXPCZT1FYX205V';

class FailureAnalyzer {
  constructor(workspaceId, workspaceName) {
    this.prisma = new PrismaClient();
    this.workspaceId = workspaceId;
    this.workspaceName = workspaceName;
    this.results = [];
  }

  async analyze() {
    console.log(`\n${'='.repeat(70)}`);
    console.log(`🔍 Analyzing Buyer Group Failures - ${this.workspaceName}`);
    console.log('='.repeat(70));

    // Get failed companies
    const failedCompanies = await this.getFailedCompanies();
    console.log(`\n📊 Found ${failedCompanies.length} companies without buyer groups`);

    // Analyze first 5 companies in detail
    const companiesToAnalyze = failedCompanies.slice(0, 5);
    console.log(`\n🔬 Analyzing first ${companiesToAnalyze.length} companies in detail...\n`);

    for (const company of companiesToAnalyze) {
      console.log(`\n${'-'.repeat(70)}`);
      console.log(`\n📋 Company: ${company.name}`);
      console.log(`   Website: ${company.website || 'N/A'}`);
      console.log(`   LinkedIn: ${company.linkedinUrl || 'N/A'}`);
      console.log(`   Industry: ${company.industry || 'N/A'}`);
      console.log(`   Employees: ${company.employeeCount || 'N/A'}`);

      const analysis = await this.analyzeCompany(company);
      this.results.push({
        company: company.name,
        ...analysis
      });

      // Wait between companies to avoid rate limiting
      await new Promise(resolve => setTimeout(resolve, 2000));
    }

    // Print summary
    this.printSummary();

    await this.prisma.$disconnect();
  }

  async getFailedCompanies() {
    return await this.prisma.companies.findMany({
      where: {
        workspaceId: this.workspaceId,
        deletedAt: null,
        OR: [
          { website: { not: null } },
          { linkedinUrl: { not: null } }
        ],
        people: {
          none: {
            deletedAt: null,
            isBuyerGroupMember: true
          }
        }
      },
      select: {
        id: true,
        name: true,
        website: true,
        linkedinUrl: true,
        industry: true,
        employeeCount: true,
        revenue: true
      },
      orderBy: { name: 'asc' }
    });
  }

  async analyzeCompany(company) {
    const analysis = {
      hasWebsite: !!company.website,
      hasLinkedIn: !!company.linkedinUrl,
      employeesFound: 0,
      buyerGroupSize: 0,
      failureReason: null,
      issues: [],
      recommendations: []
    };

    try {
      // Create pipeline
      const pipeline = new SmartBuyerGroupPipeline({
        workspaceId: this.workspaceId,
        dealSize: this.workspaceId === TOP_WORKSPACE_ID ? 300000 : 50000,
        productCategory: 'sales',
        prisma: this.prisma,
        skipDatabase: true, // Don't save, just analyze
        usaOnly: this.workspaceId === TOP_WORKSPACE_ID
      });

      // Run discovery
      const result = await pipeline.run(company);

      analysis.employeesFound = result.intelligence?.totalEmployeesFound || 0;
      analysis.buyerGroupSize = result.buyerGroup?.length || 0;

      // Analyze failure
      if (analysis.buyerGroupSize === 0) {
        if (analysis.employeesFound === 0) {
          analysis.failureReason = 'NO_EMPLOYEES_FOUND';
          analysis.issues.push('No employees found in Coresignal database');
          
          // Check if company identifiers are valid
          if (!company.website && !company.linkedinUrl) {
            analysis.issues.push('Missing both website and LinkedIn URL');
            analysis.recommendations.push('Add company website or LinkedIn URL');
          } else if (company.website && !company.linkedinUrl) {
            analysis.issues.push('Has website but no LinkedIn URL - may need to search by name');
            analysis.recommendations.push('Try searching for company on LinkedIn and add LinkedIn URL');
          }
          
          // Check company size
          if (company.employeeCount && company.employeeCount < 5) {
            analysis.issues.push(`Very small company (${company.employeeCount} employees) - may not be in Coresignal`);
            analysis.recommendations.push('Small companies may need manual research');
          }
        } else {
          analysis.failureReason = 'EMPLOYEES_FOUND_BUT_NO_BUYER_GROUP';
          analysis.issues.push(`Found ${analysis.employeesFound} employees but couldn't form buyer group`);
          analysis.recommendations.push('Review filtering criteria - may be too strict');
          analysis.recommendations.push('Check if employees match product category requirements');
        }
      } else {
        analysis.failureReason = 'SUCCESS';
        console.log(`   ✅ Successfully found buyer group with ${analysis.buyerGroupSize} members`);
      }

      // Check for common issues
      if (company.linkedinUrl && company.linkedinUrl.includes('-com')) {
        analysis.issues.push('LinkedIn URL may have incorrect format (contains "-com")');
        analysis.recommendations.push('Verify LinkedIn URL format - should be /company/name not /company/name-com');
      }

      if (company.website && company.website.includes('booksy.com')) {
        analysis.issues.push('Website is a third-party booking platform, not company website');
        analysis.recommendations.push('Find actual company website');
      }

      // Check for domain/name mismatches
      if (company.website && company.name) {
        const domain = company.website.replace(/^https?:\/\//, '').split('/')[0];
        const domainName = domain.split('.')[0];
        const companyNameWords = company.name.toLowerCase().split(/\s+/);
        
        if (!companyNameWords.some(word => domainName.includes(word) || word.includes(domainName))) {
          analysis.issues.push('Website domain does not match company name');
          analysis.recommendations.push('Verify website is correct for this company');
        }
      }

    } catch (error) {
      analysis.failureReason = 'ERROR';
      analysis.issues.push(`Error during discovery: ${error.message}`);
      analysis.recommendations.push('Check error logs for details');
    }

    // Print analysis
    console.log(`\n   📊 Analysis:`);
    console.log(`      Employees found: ${analysis.employeesFound}`);
    console.log(`      Buyer group size: ${analysis.buyerGroupSize}`);
    console.log(`      Failure reason: ${analysis.failureReason}`);
    
    if (analysis.issues.length > 0) {
      console.log(`\n   ⚠️  Issues:`);
      analysis.issues.forEach(issue => console.log(`      - ${issue}`));
    }
    
    if (analysis.recommendations.length > 0) {
      console.log(`\n   💡 Recommendations:`);
      analysis.recommendations.forEach(rec => console.log(`      - ${rec}`));
    }

    return analysis;
  }

  printSummary() {
    console.log(`\n${'='.repeat(70)}`);
    console.log(`📊 FAILURE ANALYSIS SUMMARY`);
    console.log('='.repeat(70));

    const byReason = {};
    this.results.forEach(r => {
      const reason = r.failureReason || 'UNKNOWN';
      byReason[reason] = (byReason[reason] || 0) + 1;
    });

    console.log(`\n📈 Failure Reasons:`);
    Object.entries(byReason).forEach(([reason, count]) => {
      console.log(`   ${reason}: ${count}`);
    });

    const noEmployees = this.results.filter(r => r.failureReason === 'NO_EMPLOYEES_FOUND').length;
    const employeesButNoGroup = this.results.filter(r => r.failureReason === 'EMPLOYEES_FOUND_BUT_NO_BUYER_GROUP').length;

    console.log(`\n💡 Key Insights:`);
    if (noEmployees > 0) {
      console.log(`   - ${noEmployees} companies have no employees in Coresignal`);
      console.log(`     → May need: Better company matching, manual research, or alternative data sources`);
    }
    if (employeesButNoGroup > 0) {
      console.log(`   - ${employeesButNoGroup} companies have employees but couldn't form buyer group`);
      console.log(`     → May need: Relaxed filtering, better scoring, or different product category`);
    }

    // Common issues
    const allIssues = this.results.flatMap(r => r.issues);
    const issueCounts = {};
    allIssues.forEach(issue => {
      issueCounts[issue] = (issueCounts[issue] || 0) + 1;
    });

    if (Object.keys(issueCounts).length > 0) {
      console.log(`\n🔍 Common Issues:`);
      Object.entries(issueCounts)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5)
        .forEach(([issue, count]) => {
          console.log(`   - ${issue} (${count} occurrences)`);
        });
    }

    console.log(`\n✅ Analysis complete!\n`);
  }
}

// Run analysis
if (require.main === module) {
  const workspaceId = process.argv[2] || ADRATA_WORKSPACE_ID;
  const workspaceName = process.argv[3] || 'Adrata';
  
  const analyzer = new FailureAnalyzer(workspaceId, workspaceName);
  analyzer.analyze().catch(console.error);
}

module.exports = { FailureAnalyzer };

