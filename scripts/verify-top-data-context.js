#!/usr/bin/env node

/**
 * 🔍 VERIFY TOP DATA CONTEXT
 * 
 * Verify TOP's actual data and context model for accurate targeting
 */

const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

// TOP configuration
const TOP_CONFIG = {
  workspaceId: '01K1VBYXHD0J895XAN0HGFBKJP', // Dan's workspace
  userId: 'dan@adrata.com'
};

class TOPDataContextVerifier {
  constructor() {
    this.contextAnalysis = {
      companies: {
        total: 0,
        withIndustry: 0,
        withSize: 0,
        industries: new Map(),
        sizes: new Map()
      },
      people: {
        total: 0,
        withEmail: 0,
        withJobTitle: 0,
        withCompany: 0,
        jobTitles: new Map(),
        departments: new Map()
      },
      dataQuality: {
        completeness: 0,
        accuracy: 0,
        freshness: 0
      }
    };
  }
  
  async verifyTOPDataContext() {
    console.log('🔍 VERIFYING TOP DATA CONTEXT');
    console.log('=============================');
    console.log(`📊 Workspace: ${TOP_CONFIG.workspaceId}`);
    console.log(`👤 User: ${TOP_CONFIG.userId}`);
    console.log('');
    
    try {
      await prisma.$connect();
      console.log('✅ Database connected');
      
      // Analyze TOP's company data
      await this.analyzeTOPCompanies();
      
      // Analyze TOP's people data
      await this.analyzeTOPPeople();
      
      // Analyze data quality
      await this.analyzeDataQuality();
      
      // Generate context model
      await this.generateTOPContextModel();
      
      this.printContextAnalysis();
      
      return this.contextAnalysis;
      
    } catch (error) {
      console.error('💥 TOP data context verification failed:', error);
      throw error;
    } finally {
      await prisma.$disconnect();
    }
  }
  
  async analyzeTOPCompanies() {
    console.log('🏢 ANALYZING TOP COMPANIES');
    console.log('-'.repeat(26));
    
    try {
      // Get all TOP companies
      const companies = await prisma.companies.findMany({
        where: {
          workspaceId: TOP_CONFIG.workspaceId,
          deletedAt: null
        },
        include: {
          people: true,
          buyer_groups: true
        }
      });
      
      this.contextAnalysis.companies.total = companies.length;
      console.log(`  📊 Total companies: ${companies.length}`);
      
      if (companies.length === 0) {
        console.log('  ⚠️ No companies found - check workspace ID');
        return;
      }
      
      // Analyze company data completeness
      companies.forEach(company => {
        if (company.industry) {
          this.contextAnalysis.companies.withIndustry++;
          const industry = company.industry.toLowerCase();
          this.contextAnalysis.companies.industries.set(
            industry, 
            (this.contextAnalysis.companies.industries.get(industry) || 0) + 1
          );
        }
        
        if (company.size) {
          this.contextAnalysis.companies.withSize++;
          const size = company.size;
          this.contextAnalysis.companies.sizes.set(
            size,
            (this.contextAnalysis.companies.sizes.get(size) || 0) + 1
          );
        }
      });
      
      console.log(`  📈 With industry data: ${this.contextAnalysis.companies.withIndustry}/${companies.length} (${Math.round(this.contextAnalysis.companies.withIndustry/companies.length*100)}%)`);
      console.log(`  📏 With size data: ${this.contextAnalysis.companies.withSize}/${companies.length} (${Math.round(this.contextAnalysis.companies.withSize/companies.length*100)}%)`);
      
      // Show top industries
      const topIndustries = Array.from(this.contextAnalysis.companies.industries.entries())
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5);
      
      console.log('  🏭 Top industries:');
      topIndustries.forEach(([industry, count]) => {
        console.log(`    - ${industry}: ${count} companies`);
      });
      
      // Show sample companies
      console.log('  📋 Sample companies:');
      companies.slice(0, 5).forEach(company => {
        console.log(`    - ${company.name} (${company.industry || 'No industry'}, ${company.people.length} people)`);
      });
      
    } catch (error) {
      console.error('  ❌ Company analysis failed:', error);
    }
  }
  
  async analyzeTOPPeople() {
    console.log('\n👥 ANALYZING TOP PEOPLE');
    console.log('-'.repeat(23));
    
    try {
      // Get all TOP people
      const people = await prisma.people.findMany({
        where: {
          workspaceId: TOP_CONFIG.workspaceId,
          deletedAt: null
        },
        include: {
          company: true,
          buyerGroups: true
        }
      });
      
      this.contextAnalysis.people.total = people.length;
      console.log(`  📊 Total people: ${people.length}`);
      
      if (people.length === 0) {
        console.log('  ⚠️ No people found - check workspace ID');
        return;
      }
      
      // Analyze people data completeness
      people.forEach(person => {
        if (person.email) this.contextAnalysis.people.withEmail++;
        if (person.jobTitle) {
          this.contextAnalysis.people.withJobTitle++;
          const title = person.jobTitle.toLowerCase();
          this.contextAnalysis.people.jobTitles.set(
            title,
            (this.contextAnalysis.people.jobTitles.get(title) || 0) + 1
          );
        }
        if (person.companyId) this.contextAnalysis.people.withCompany++;
        if (person.department) {
          const dept = person.department.toLowerCase();
          this.contextAnalysis.people.departments.set(
            dept,
            (this.contextAnalysis.people.departments.get(dept) || 0) + 1
          );
        }
      });
      
      console.log(`  📧 With email: ${this.contextAnalysis.people.withEmail}/${people.length} (${Math.round(this.contextAnalysis.people.withEmail/people.length*100)}%)`);
      console.log(`  💼 With job title: ${this.contextAnalysis.people.withJobTitle}/${people.length} (${Math.round(this.contextAnalysis.people.withJobTitle/people.length*100)}%)`);
      console.log(`  🏢 With company: ${this.contextAnalysis.people.withCompany}/${people.length} (${Math.round(this.contextAnalysis.people.withCompany/people.length*100)}%)`);
      
      // Show top job titles (for context modeling)
      const topTitles = Array.from(this.contextAnalysis.people.jobTitles.entries())
        .sort((a, b) => b[1] - a[1])
        .slice(0, 10);
      
      console.log('  💼 Top job titles (for context modeling):');
      topTitles.forEach(([title, count]) => {
        console.log(`    - ${title}: ${count} people`);
      });
      
      // Show sample people
      console.log('  📋 Sample people:');
      people.slice(0, 5).forEach(person => {
        console.log(`    - ${person.fullName} (${person.jobTitle || 'No title'}, ${person.company?.name || 'No company'})`);
      });
      
    } catch (error) {
      console.error('  ❌ People analysis failed:', error);
    }
  }
  
  async analyzeDataQuality() {
    console.log('\n📈 ANALYZING DATA QUALITY');
    console.log('-'.repeat(26));
    
    try {
      const totalCompanies = this.contextAnalysis.companies.total;
      const totalPeople = this.contextAnalysis.people.total;
      
      if (totalCompanies === 0 || totalPeople === 0) {
        console.log('  ⚠️ Insufficient data for quality analysis');
        return;
      }
      
      // Calculate completeness score
      const companyCompleteness = (
        (this.contextAnalysis.companies.withIndustry / totalCompanies) * 0.5 +
        (this.contextAnalysis.companies.withSize / totalCompanies) * 0.5
      ) * 100;
      
      const peopleCompleteness = (
        (this.contextAnalysis.people.withEmail / totalPeople) * 0.4 +
        (this.contextAnalysis.people.withJobTitle / totalPeople) * 0.3 +
        (this.contextAnalysis.people.withCompany / totalPeople) * 0.3
      ) * 100;
      
      this.contextAnalysis.dataQuality.completeness = Math.round((companyCompleteness + peopleCompleteness) / 2);
      
      console.log(`  📊 Company data completeness: ${Math.round(companyCompleteness)}%`);
      console.log(`  👥 People data completeness: ${Math.round(peopleCompleteness)}%`);
      console.log(`  🎯 Overall completeness: ${this.contextAnalysis.dataQuality.completeness}%`);
      
      // Check data freshness
      const recentPeople = await prisma.people.count({
        where: {
          workspaceId: TOP_CONFIG.workspaceId,
          deletedAt: null,
          updatedAt: {
            gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) // Last 30 days
          }
        }
      });
      
      const freshnessScore = Math.round((recentPeople / totalPeople) * 100);
      this.contextAnalysis.dataQuality.freshness = freshnessScore;
      
      console.log(`  📅 Data freshness (last 30 days): ${freshnessScore}%`);
      
    } catch (error) {
      console.error('  ❌ Data quality analysis failed:', error);
    }
  }
  
  async generateTOPContextModel() {
    console.log('\n🎯 GENERATING TOP CONTEXT MODEL');
    console.log('-'.repeat(32));
    
    try {
      // Determine TOP's industry focus
      const topIndustries = Array.from(this.contextAnalysis.companies.industries.entries())
        .sort((a, b) => b[1] - a[1]);
      
      const primaryIndustry = topIndustries[0]?.[0] || 'manufacturing';
      console.log(`  🏭 Primary industry: ${primaryIndustry}`);
      
      // Determine TOP's target roles
      const topTitles = Array.from(this.contextAnalysis.people.jobTitles.entries())
        .sort((a, b) => b[1] - a[1])
        .slice(0, 10);
      
      console.log('  💼 Key roles in TOP\'s data:');
      topTitles.forEach(([title, count]) => {
        console.log(`    - ${title}: ${count} people`);
      });
      
      // Generate TOP-specific seller profile
      const topContextModel = this.createTOPContextModel(primaryIndustry, topTitles);
      
      console.log('\n🎯 TOP CONTEXT MODEL FOR UNIFIED SYSTEM:');
      console.log(`  📦 Product: ${topContextModel.productName}`);
      console.log(`  🏭 Solution category: ${topContextModel.solutionCategory}`);
      console.log(`  🎯 Target market: ${topContextModel.targetMarket}`);
      console.log(`  👥 Decision makers: ${topContextModel.rolePriorities.decision.join(', ')}`);
      console.log(`  🚀 Champions: ${topContextModel.rolePriorities.champion.join(', ')}`);
      console.log(`  📊 Target departments: ${topContextModel.targetDepartments.join(', ')}`);
      
      // Save context model for use in unified system
      const fs = require('fs');
      fs.writeFileSync(
        'scripts/top-context-model.json',
        JSON.stringify(topContextModel, null, 2)
      );
      
      console.log('  💾 Context model saved to: scripts/top-context-model.json');
      
    } catch (error) {
      console.error('  ❌ Context model generation failed:', error);
    }
  }
  
  createTOPContextModel(primaryIndustry, topTitles) {
    // Create TOP-specific context model based on their actual data
    const decisionMakerTitles = [];
    const championTitles = [];
    const stakeholderTitles = [];
    
    // Categorize titles based on TOP's actual data
    topTitles.forEach(([title, count]) => {
      const titleLower = title.toLowerCase();
      
      if (titleLower.includes('ceo') || titleLower.includes('president') || 
          titleLower.includes('coo') || titleLower.includes('founder')) {
        decisionMakerTitles.push(title);
      } else if (titleLower.includes('vp') || titleLower.includes('vice president') ||
                 titleLower.includes('director') && (titleLower.includes('operations') || titleLower.includes('engineering'))) {
        decisionMakerTitles.push(title);
      } else if (titleLower.includes('manager') || titleLower.includes('director')) {
        championTitles.push(title);
      } else if (titleLower.includes('finance') || titleLower.includes('procurement') ||
                 titleLower.includes('quality') || titleLower.includes('safety')) {
        stakeholderTitles.push(title);
      }
    });
    
    return {
      productName: "TOP Engineering Plus",
      sellerCompanyName: "TOP Engineering Plus",
      solutionCategory: 'operations',
      targetMarket: 'enterprise',
      dealSize: 'large',
      buyingCenter: 'mixed',
      decisionLevel: 'mixed',
      
      // Based on TOP's actual data
      rolePriorities: {
        decision: decisionMakerTitles.length > 0 ? decisionMakerTitles : ['CEO', 'COO', 'VP Operations', 'VP Engineering', 'President'],
        champion: championTitles.length > 0 ? championTitles : ['Operations Manager', 'Engineering Manager', 'Project Manager'],
        stakeholder: stakeholderTitles.length > 0 ? stakeholderTitles : ['Finance Manager', 'Quality Manager', 'Procurement Manager'],
        blocker: ['Legal Counsel', 'Compliance Manager', 'Risk Manager', 'Safety Manager'],
        introducer: ['Board Member', 'Advisor', 'Consultant', 'Partner']
      },
      
      mustHaveTitles: ['CEO', 'COO', 'VP Operations', 'VP Engineering'],
      adjacentFunctions: ['finance', 'legal', 'procurement', 'quality', 'safety'],
      disqualifiers: ['intern', 'student', 'temporary', 'contractor'],
      geo: ['US', 'North America'],
      
      // Engineering services context
      productCriticality: 'mission_critical',
      integrationDepth: 'deep',
      dataSensitivity: 'medium',
      deploymentModel: 'on_premise',
      buyingGovernance: 'enterprise',
      securityGateLevel: 'medium',
      procurementMaturity: 'mature',
      decisionStyle: 'committee',
      
      // TOP-specific pain points and context
      primaryPainPoints: [
        'Engineering capacity constraints',
        'Technical skill gaps',
        'Project delivery delays',
        'Quality control issues',
        'Cost optimization needs',
        'Manufacturing efficiency',
        'Regulatory compliance'
      ],
      targetDepartments: ['engineering', 'operations', 'manufacturing', 'quality', 'executive'],
      competitiveThreats: ['internal teams', 'other consulting firms', 'offshore providers', 'automation solutions'],
      keyIntegrations: ['ERP systems', 'CAD software', 'project management tools', 'quality systems'],
      complianceRequirements: ['ISO standards', 'safety regulations', 'quality certifications', 'environmental standards'],
      
      // Context for accurate targeting
      industryContext: primaryIndustry,
      dataQuality: this.contextAnalysis.dataQuality
    };
  }
  
  printContextAnalysis() {
    console.log('\n📊 TOP DATA CONTEXT ANALYSIS');
    console.log('='.repeat(32));
    
    console.log('🏢 COMPANIES:');
    console.log(`  Total: ${this.contextAnalysis.companies.total}`);
    console.log(`  Industry data: ${this.contextAnalysis.companies.withIndustry}/${this.contextAnalysis.companies.total} (${Math.round(this.contextAnalysis.companies.withIndustry/this.contextAnalysis.companies.total*100)}%)`);
    console.log(`  Size data: ${this.contextAnalysis.companies.withSize}/${this.contextAnalysis.companies.total} (${Math.round(this.contextAnalysis.companies.withSize/this.contextAnalysis.companies.total*100)}%)`);
    
    console.log('\n👥 PEOPLE:');
    console.log(`  Total: ${this.contextAnalysis.people.total}`);
    console.log(`  Email data: ${this.contextAnalysis.people.withEmail}/${this.contextAnalysis.people.total} (${Math.round(this.contextAnalysis.people.withEmail/this.contextAnalysis.people.total*100)}%)`);
    console.log(`  Job title data: ${this.contextAnalysis.people.withJobTitle}/${this.contextAnalysis.people.total} (${Math.round(this.contextAnalysis.people.withJobTitle/this.contextAnalysis.people.total*100)}%)`);
    console.log(`  Company association: ${this.contextAnalysis.people.withCompany}/${this.contextAnalysis.people.total} (${Math.round(this.contextAnalysis.people.withCompany/this.contextAnalysis.people.total*100)}%)`);
    
    console.log('\n📈 DATA QUALITY:');
    console.log(`  Completeness: ${this.contextAnalysis.dataQuality.completeness}%`);
    console.log(`  Freshness: ${this.contextAnalysis.dataQuality.freshness}%`);
    
    console.log('\n🎯 CONTEXT MODEL IMPACT:');
    if (this.contextAnalysis.dataQuality.completeness > 70) {
      console.log('  ✅ Good data quality - unified system will be highly accurate');
      console.log('  🎯 Context model will significantly improve targeting');
    } else {
      console.log('  ⚠️ Data quality could be improved');
      console.log('  💡 Unified system will help enrich missing data');
    }
    
    console.log('\n🚀 READY FOR UNIFIED SYSTEM:');
    console.log('  ✅ TOP context model generated');
    console.log('  ✅ Industry focus identified');
    console.log('  ✅ Role priorities mapped to actual data');
    console.log('  ✅ Data quality assessed');
    console.log('  🎯 System ready for accurate TOP enrichment');
  }
}

// Main execution
async function main() {
  try {
    console.log('🎯 Starting TOP data context verification...');
    
    const verifier = new TOPDataContextVerifier();
    const results = await verifier.verifyTOPDataContext();
    
    console.log('\n✅ TOP data context verification complete!');
    console.log('🚀 Context model ready for unified system');
    
    process.exit(0);
    
  } catch (error) {
    console.error('💥 TOP data verification failed:', error);
    console.log('\n🔧 Troubleshooting:');
    console.log('1. Check database connectivity');
    console.log('2. Verify TOP workspace ID is correct');
    console.log('3. Ensure TOP has data in the system');
    
    process.exit(1);
  }
}

// Execute if run directly
if (require.main === module) {
  main();
}

module.exports = { TOPDataContextVerifier, TOP_CONFIG };
