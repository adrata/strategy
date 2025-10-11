const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

class BuyerGroupAuditor {
  constructor() {
    this.results = {
      totalCompanies: 0,
      companiesWithBuyerGroups: 0,
      companiesWithoutBuyerGroups: 0,
      totalPeople: 0,
      peopleInBuyerGroups: 0,
      peopleOutOfBuyerGroups: 0,
      issues: [],
      recommendations: []
    };
  }

  async auditAllCompanies() {
    console.log('🔍 COMPREHENSIVE BUYER GROUP AUDIT');
    console.log('==================================');
    console.log('Auditing all companies to ensure correct buyer group generation');
    console.log('');

    try {
      // Get TOP Engineering Plus workspace
      const workspace = await prisma.workspaces.findFirst({
        where: { name: 'TOP Engineering Plus' }
      });

      if (!workspace) {
        throw new Error('TOP Engineering Plus workspace not found');
      }

      console.log(`✅ Found workspace: ${workspace.name} (ID: ${workspace.id})`);
      console.log('');

      // Get all companies with CoreSignal IDs
      const companies = await prisma.companies.findMany({
        where: {
          workspaceId: workspace.id,
          deletedAt: null,
          customFields: {
            path: ['coresignalData', 'id'],
            not: null
          }
        },
        select: {
          id: true,
          name: true,
          customFields: true
        },
        orderBy: { name: 'asc' }
      });

      this.results.totalCompanies = companies.length;
      console.log(`📊 AUDITING ${companies.length} COMPANIES`);
      console.log('='.repeat(50));

      // Audit each company
      for (let i = 0; i < companies.length; i++) {
        const company = companies[i];
        await this.auditCompany(company, i + 1, companies.length);
      }

      // Generate comprehensive report
      await this.generateAuditReport();

    } catch (error) {
      console.error('❌ Audit failed:', error.message);
    } finally {
      await prisma.$disconnect();
    }
  }

  async auditCompany(company, index, total) {
    console.log(`\n🏢 AUDITING COMPANY ${index}/${total}: ${company.name}`);
    console.log('─'.repeat(60));

    try {
      const coresignalData = company.customFields?.coresignalData;
      const companySize = coresignalData?.employees_count || 'Unknown';
      
      console.log(`   CoreSignal ID: ${coresignalData?.id}`);
      console.log(`   Company Size: ${companySize} employees`);
      console.log(`   Industry: ${coresignalData?.industry || 'Unknown'}`);

      // Check if company has buyer group
      const buyerGroup = await prisma.buyer_groups.findFirst({
        where: {
          companyId: company.id,
          workspaceId: company.workspaceId
        },
        select: {
          id: true,
          name: true,
          createdAt: true,
          customFields: true
        }
      });

      if (buyerGroup) {
        console.log(`   ✅ Has buyer group: ${buyerGroup.name}`);
        console.log(`   Created: ${buyerGroup.createdAt.toISOString().split('T')[0]}`);
        
        if (buyerGroup.customFields) {
          const roleDistribution = buyerGroup.customFields.roleDistribution;
          const totalPeople = Object.values(roleDistribution).reduce((sum, count) => sum + count, 0);
          console.log(`   Total People in Buyer Group: ${totalPeople}`);
          console.log(`   Role Distribution:`, roleDistribution);
        }

        this.results.companiesWithBuyerGroups++;
      } else {
        console.log(`   ❌ No buyer group found`);
        this.results.companiesWithoutBuyerGroups++;
        this.results.issues.push({
          company: company.name,
          issue: 'No buyer group found',
          severity: 'High',
          recommendation: 'Run buyer group discovery for this company'
        });
      }

      // Check people data
      const allPeople = await prisma.people.findMany({
        where: {
          companyId: company.id,
          workspaceId: company.workspaceId,
          deletedAt: null
        },
        select: {
          id: true,
          fullName: true,
          buyerGroupRole: true,
          customFields: true,
          createdAt: true,
          lastEnriched: true
        }
      });

      this.results.totalPeople += allPeople.length;

      // Count people in/out of buyer group
      const peopleInBuyerGroup = allPeople.filter(person => {
        const customFields = person.customFields;
        const hasInStatus = customFields?.buyerGroupStatus === 'in';
        const isFromTodayEnrichment = person.createdAt.toISOString().split('T')[0] === '2025-09-30' && person.buyerGroupRole;
        return hasInStatus || isFromTodayEnrichment;
      });

      const peopleOutOfBuyerGroup = allPeople.filter(person => {
        const customFields = person.customFields;
        return customFields?.buyerGroupStatus === 'out';
      });

      this.results.peopleInBuyerGroups += peopleInBuyerGroup.length;
      this.results.peopleOutOfBuyerGroups += peopleOutOfBuyerGroup.length;

      console.log(`   👥 Total People: ${allPeople.length}`);
      console.log(`   ✅ In Buyer Group: ${peopleInBuyerGroup.length}`);
      console.log(`   ❌ Out of Buyer Group: ${peopleOutOfBuyerGroup.length}`);

      // Analyze potential issues
      await this.analyzeCompanyIssues(company, buyerGroup, allPeople, peopleInBuyerGroup, companySize);

    } catch (error) {
      console.log(`   ❌ Error auditing company: ${error.message}`);
      this.results.issues.push({
        company: company.name,
        issue: `Audit error: ${error.message}`,
        severity: 'Medium',
        recommendation: 'Manual review required'
      });
    }
  }

  async analyzeCompanyIssues(company, buyerGroup, allPeople, peopleInBuyerGroup, companySize) {
    const issues = [];

    // Issue 1: Company size vs buyer group size mismatch
    if (buyerGroup && buyerGroup.customFields) {
      const roleDistribution = buyerGroup.customFields.roleDistribution;
      const totalPeople = Object.values(roleDistribution).reduce((sum, count) => sum + count, 0);
      
      if (companySize > 1000 && totalPeople < 5) {
        issues.push({
          type: 'Size Mismatch',
          description: `Large company (${companySize} employees) but small buyer group (${totalPeople} people)`,
          severity: 'High'
        });
      } else if (companySize < 100 && totalPeople > 20) {
        issues.push({
          type: 'Size Mismatch',
          description: `Small company (${companySize} employees) but large buyer group (${totalPeople} people)`,
          severity: 'Medium'
        });
      }
    }

    // Issue 2: No decision makers
    if (buyerGroup && buyerGroup.customFields) {
      const roleDistribution = buyerGroup.customFields.roleDistribution;
      if (roleDistribution.decisionMakers === 0) {
        issues.push({
          type: 'Missing Decision Makers',
          description: 'Buyer group has no decision makers',
          severity: 'High'
        });
      }
    }

    // Issue 3: All people marked as 'out' of buyer group
    if (allPeople.length > 0 && peopleInBuyerGroup.length === 0) {
      issues.push({
        type: 'No People in Buyer Group',
        description: `All ${allPeople.length} people marked as 'out' of buyer group`,
        severity: 'High'
      });
    }

    // Issue 4: Suspicious company size (1 employee for major companies)
    if (companySize === 1 && (company.name.includes('Power') || company.name.includes('Electric') || company.name.includes('Utility'))) {
      issues.push({
        type: 'Suspicious Company Size',
        description: `Major utility company showing only 1 employee - likely wrong CoreSignal match`,
        severity: 'High'
      });
    }

    // Issue 5: Too many people for company size
    if (allPeople.length > companySize * 2) {
      issues.push({
        type: 'Too Many People',
        description: `${allPeople.length} people for ${companySize} employee company`,
        severity: 'Medium'
      });
    }

    // Log issues
    if (issues.length > 0) {
      console.log(`   ⚠️ ISSUES FOUND:`);
      issues.forEach(issue => {
        console.log(`      ${issue.severity}: ${issue.type} - ${issue.description}`);
        this.results.issues.push({
          company: company.name,
          issue: `${issue.type}: ${issue.description}`,
          severity: issue.severity,
          recommendation: this.getRecommendation(issue.type)
        });
      });
    } else {
      console.log(`   ✅ No issues detected`);
    }
  }

  getRecommendation(issueType) {
    const recommendations = {
      'Size Mismatch': 'Review CoreSignal company matching and re-run buyer group discovery',
      'Missing Decision Makers': 'Re-run buyer group discovery with decision maker focus',
      'No People in Buyer Group': 'Check if company was processed correctly in buyer group discovery',
      'Suspicious Company Size': 'Find correct CoreSignal company ID and update company record',
      'Too Many People': 'Review data quality and company assignments'
    };
    return recommendations[issueType] || 'Manual review required';
  }

  async generateAuditReport() {
    console.log('\n📊 COMPREHENSIVE AUDIT REPORT');
    console.log('=============================');
    console.log('');

    // Summary statistics
    console.log('📈 SUMMARY STATISTICS:');
    console.log(`   Total Companies: ${this.results.totalCompanies}`);
    console.log(`   Companies with Buyer Groups: ${this.results.companiesWithBuyerGroups}`);
    console.log(`   Companies without Buyer Groups: ${this.results.companiesWithoutBuyerGroups}`);
    console.log(`   Total People: ${this.results.totalPeople}`);
    console.log(`   People in Buyer Groups: ${this.results.peopleInBuyerGroups}`);
    console.log(`   People out of Buyer Groups: ${this.results.peopleOutOfBuyerGroups}`);
    console.log('');

    // Success rate
    const buyerGroupSuccessRate = (this.results.companiesWithBuyerGroups / this.results.totalCompanies) * 100;
    console.log(`🎯 BUYER GROUP SUCCESS RATE: ${buyerGroupSuccessRate.toFixed(1)}%`);
    
    if (buyerGroupSuccessRate >= 95) {
      console.log('✅ Excellent buyer group coverage!');
    } else if (buyerGroupSuccessRate >= 90) {
      console.log('✅ Good buyer group coverage');
    } else if (buyerGroupSuccessRate >= 80) {
      console.log('⚠️ Moderate buyer group coverage - some companies missing');
    } else {
      console.log('❌ Low buyer group coverage - many companies missing');
    }
    console.log('');

    // Issues analysis
    console.log('🚨 ISSUES FOUND:');
    const issuesBySeverity = {
      High: this.results.issues.filter(i => i.severity === 'High'),
      Medium: this.results.issues.filter(i => i.severity === 'Medium'),
      Low: this.results.issues.filter(i => i.severity === 'Low')
    };

    Object.entries(issuesBySeverity).forEach(([severity, issues]) => {
      if (issues.length > 0) {
        console.log(`   ${severity} Severity: ${issues.length} issues`);
        issues.slice(0, 5).forEach(issue => {
          console.log(`      - ${issue.company}: ${issue.issue}`);
        });
        if (issues.length > 5) {
          console.log(`      ... and ${issues.length - 5} more`);
        }
      }
    });
    console.log('');

    // Top problematic companies
    const companyIssues = {};
    this.results.issues.forEach(issue => {
      if (!companyIssues[issue.company]) {
        companyIssues[issue.company] = 0;
      }
      companyIssues[issue.company]++;
    });

    const topProblematicCompanies = Object.entries(companyIssues)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10);

    if (topProblematicCompanies.length > 0) {
      console.log('🔍 TOP PROBLEMATIC COMPANIES:');
      topProblematicCompanies.forEach(([company, issueCount]) => {
        console.log(`   ${company}: ${issueCount} issues`);
      });
      console.log('');
    }

    // Recommendations
    console.log('💡 RECOMMENDATIONS:');
    console.log('1. Fix companies with suspicious company sizes (likely wrong CoreSignal matches)');
    console.log('2. Re-run buyer group discovery for companies with no buyer groups');
    console.log('3. Review companies with size mismatches');
    console.log('4. Update script to better handle large companies');
    console.log('5. Add validation for decision maker requirements');
    console.log('');

    // Script improvement recommendations
    console.log('🔧 SCRIPT IMPROVEMENT RECOMMENDATIONS:');
    console.log('1. Add company size validation before buyer group discovery');
    console.log('2. Implement better CoreSignal company matching');
    console.log('3. Add decision maker requirement validation');
    console.log('4. Improve role distribution for different company sizes');
    console.log('5. Add post-discovery validation checks');
    console.log('');

    return this.results;
  }
}

async function main() {
  const auditor = new BuyerGroupAuditor();
  await auditor.auditAllCompanies();
}

if (require.main === module) {
  main().catch(console.error);
}

module.exports = BuyerGroupAuditor;
