#!/usr/bin/env node

/**
 * Career Risk Analysis Script
 * 
 * This script analyzes career history to determine the risk level of people
 * leaving their current job based on their historical tenure patterns.
 * 
 * Risk Factors:
 * - Average tenure per role vs current role duration
 * - Career velocity (frequent job changes = higher risk)
 * - Industry and role level patterns
 * - Recent career changes or promotions
 */

require('dotenv').config();
const { PrismaClient } = require('@prisma/client');

class CareerRiskAnalyzer {
  constructor() {
    this.prisma = new PrismaClient();
    this.workspaceId = '01K7DNYR5VZ7JY36KGKKN76XZ1'; // Notary Everyday workspace
    
    this.results = {
      peopleProcessed: 0,
      riskAnalysisGenerated: 0,
      highRiskPeople: 0,
      mediumRiskPeople: 0,
      lowRiskPeople: 0,
      errors: 0
    };

    // Industry-specific tenure benchmarks (in years)
    this.industryBenchmarks = {
      'Technology': { avg: 2.1, highRisk: 1.5, lowRisk: 3.0 },
      'Software': { avg: 2.3, highRisk: 1.7, lowRisk: 3.2 },
      'Financial Services': { avg: 3.2, highRisk: 2.4, lowRisk: 4.5 },
      'Healthcare': { avg: 4.1, highRisk: 3.0, lowRisk: 5.5 },
      'Real Estate': { avg: 3.8, highRisk: 2.8, lowRisk: 5.0 },
      'Legal': { avg: 4.5, highRisk: 3.2, lowRisk: 6.0 },
      'Manufacturing': { avg: 5.2, highRisk: 3.8, lowRisk: 7.0 },
      'Education': { avg: 6.1, highRisk: 4.5, lowRisk: 8.0 },
      'Government': { avg: 7.2, highRisk: 5.0, lowRisk: 10.0 },
      'default': { avg: 3.5, highRisk: 2.5, lowRisk: 4.8 }
    };

    // Role level risk multipliers
    this.roleRiskMultipliers = {
      'C-Level': 1.3, // C-level executives change jobs more frequently
      'VP': 1.2,
      'Director': 1.1,
      'Manager': 1.0,
      'Senior': 0.9,
      'Lead': 0.9,
      'default': 1.0
    };
  }

  async run() {
    try {
      console.log('🎯 Starting Career Risk Analysis for Notary Everyday workspace...\n');
      
      const people = await this.getPeopleWithCareerData();
      console.log(`   📊 Found ${people.length} people with career data to analyze`);

      if (people.length === 0) {
        console.log('   ❌ No people with career data found');
        return;
      }

      const batchSize = 50;
      for (let i = 0; i < people.length; i += batchSize) {
        const batch = people.slice(i, i + batchSize);
        console.log(`\n📦 Processing batch ${Math.floor(i / batchSize) + 1}/${Math.ceil(people.length / batchSize)} (${batch.length} people)`);

        await Promise.all(batch.map(async (person) => {
          try {
            console.log(`   🔍 Analyzing: ${person.fullName}`);
            const riskAnalysis = this.analyzeCareerRisk(person);
            await this.updatePersonWithRiskAnalysis(person.id, riskAnalysis);
            
            // Track risk distribution
            if (riskAnalysis.riskLevel === 'HIGH') this.results.highRiskPeople++;
            else if (riskAnalysis.riskLevel === 'MEDIUM') this.results.mediumRiskPeople++;
            else this.results.lowRiskPeople++;
            
            this.results.riskAnalysisGenerated++;
            console.log(`   ✅ Analyzed: ${person.fullName} (Risk: ${riskAnalysis.riskLevel})`);
          } catch (error) {
            console.error(`   ❌ Error analyzing ${person.fullName}:`, error.message);
            this.results.errors++;
          } finally {
            this.results.peopleProcessed++;
          }
        }));

        // Small delay between batches
        if (i + batchSize < people.length) {
          await this.delay(1000);
        }
      }
      
      this.printResults();
      
    } catch (error) {
      console.error('❌ Error in career risk analysis:', error);
    } finally {
      await this.prisma.$disconnect();
    }
  }

  async getPeopleWithCareerData() {
    return await this.prisma.people.findMany({
      where: {
        workspaceId: this.workspaceId,
        deletedAt: null,
        OR: [
          { roleHistory: { not: null } },
          { customFields: { path: ['coresignalData', 'experience'], not: null } },
          { yearsAtCompany: { not: null } },
          { yearsInRole: { not: null } }
        ]
      },
      select: {
        id: true,
        fullName: true,
        jobTitle: true,
        yearsAtCompany: true,
        yearsInRole: true,
        roleHistory: true,
        customFields: true,
        company: {
          select: {
            name: true,
            industry: true,
            size: true,
            employeeCount: true
          }
        }
      }
    });
  }

  analyzeCareerRisk(person) {
    const careerData = this.extractCareerData(person);
    const riskFactors = this.calculateRiskFactors(careerData, person);
    const riskScore = this.calculateRiskScore(riskFactors);
    const riskLevel = this.determineRiskLevel(riskScore);
    
    return {
      riskLevel,
      riskScore,
      riskFactors,
      careerData,
      recommendations: this.generateRecommendations(riskLevel, riskFactors, person),
      lastAnalyzed: new Date().toISOString()
    };
  }

  extractCareerData(person) {
    let roleHistory = person.roleHistory || [];
    let coresignalExperience = [];

    // Extract from Coresignal data if available
    if (person.customFields?.coresignalData?.experience) {
      coresignalExperience = person.customFields.coresignalData.experience;
    }

    // Combine and normalize career data
    const allRoles = [...roleHistory, ...coresignalExperience.map(exp => ({
      title: exp.title || exp.job_title,
      company: exp.company || exp.company_name,
      startDate: exp.start_date || exp.startDate,
      endDate: exp.end_date || exp.endDate,
      isCurrent: exp.is_current || exp.isCurrent || false
    }))];

    // Calculate tenure for each role
    const rolesWithTenure = allRoles.map(role => {
      const startDate = role.startDate ? new Date(role.startDate) : null;
      const endDate = role.endDate ? new Date(role.endDate) : (role.isCurrent ? new Date() : null);
      
      let tenure = 0;
      if (startDate) {
        const end = endDate || new Date();
        tenure = (end.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24 * 365.25); // Years
      }

      return {
        ...role,
        tenure: Math.max(0, tenure),
        isCurrent: role.isCurrent || false
      };
    }).filter(role => role.tenure > 0); // Only include roles with valid tenure

    // Sort by start date (most recent first)
    rolesWithTenure.sort((a, b) => {
      const dateA = a.startDate ? new Date(a.startDate) : new Date(0);
      const dateB = b.startDate ? new Date(b.startDate) : new Date(0);
      return dateB.getTime() - dateA.getTime();
    });

    const currentRole = rolesWithTenure.find(role => role.isCurrent) || rolesWithTenure[0];
    const historicalRoles = rolesWithTenure.filter(role => !role.isCurrent);

    return {
      allRoles: rolesWithTenure,
      currentRole,
      historicalRoles,
      totalRoles: rolesWithTenure.length,
      averageTenure: historicalRoles.length > 0 ? 
        historicalRoles.reduce((sum, role) => sum + role.tenure, 0) / historicalRoles.length : 0,
      currentTenure: currentRole ? currentRole.tenure : 0,
      careerLength: rolesWithTenure.length > 0 ? 
        Math.max(...rolesWithTenure.map(role => role.tenure)) : 0
    };
  }

  calculateRiskFactors(careerData, person) {
    const factors = {
      tenureRisk: 0,
      velocityRisk: 0,
      industryRisk: 0,
      roleRisk: 0,
      companySizeRisk: 0,
      recentChangeRisk: 0
    };

    // 1. Tenure Risk (40% weight) - Most important factor
    if (careerData.averageTenure > 0 && careerData.currentTenure > 0) {
      const tenureRatio = careerData.currentTenure / careerData.averageTenure;
      if (tenureRatio >= 1.2) factors.tenureRisk = 90; // 20% over average
      else if (tenureRatio >= 1.0) factors.tenureRisk = 70; // At or above average
      else if (tenureRatio >= 0.8) factors.tenureRisk = 40; // 20% below average
      else factors.tenureRisk = 20; // Well below average
    } else {
      factors.tenureRisk = 50; // Unknown - moderate risk
    }

    // 2. Career Velocity Risk (25% weight)
    if (careerData.totalRoles > 0) {
      const avgTenureAll = careerData.allRoles.reduce((sum, role) => sum + role.tenure, 0) / careerData.totalRoles;
      if (avgTenureAll < 1.0) factors.velocityRisk = 80; // Very frequent job changes
      else if (avgTenureAll < 2.0) factors.velocityRisk = 60; // Frequent changes
      else if (avgTenureAll < 3.0) factors.velocityRisk = 40; // Moderate changes
      else factors.velocityRisk = 20; // Stable career
    } else {
      factors.velocityRisk = 30; // Unknown - low risk
    }

    // 3. Industry Risk (15% weight)
    const industry = person.company?.industry || 'default';
    const benchmark = this.industryBenchmarks[industry] || this.industryBenchmarks.default;
    
    if (careerData.currentTenure > 0) {
      if (careerData.currentTenure >= benchmark.highRisk) factors.industryRisk = 70;
      else if (careerData.currentTenure >= benchmark.avg) factors.industryRisk = 50;
      else factors.industryRisk = 30;
    } else {
      factors.industryRisk = 40;
    }

    // 4. Role Level Risk (10% weight)
    const jobTitle = (person.jobTitle || '').toLowerCase();
    let roleMultiplier = 1.0;
    
    if (jobTitle.includes('ceo') || jobTitle.includes('cfo') || jobTitle.includes('cto')) {
      roleMultiplier = this.roleRiskMultipliers['C-Level'];
    } else if (jobTitle.includes('vp') || jobTitle.includes('vice president')) {
      roleMultiplier = this.roleRiskMultipliers['VP'];
    } else if (jobTitle.includes('director')) {
      roleMultiplier = this.roleRiskMultipliers['Director'];
    } else if (jobTitle.includes('manager')) {
      roleMultiplier = this.roleRiskMultipliers['Manager'];
    } else if (jobTitle.includes('senior')) {
      roleMultiplier = this.roleRiskMultipliers['Senior'];
    } else if (jobTitle.includes('lead')) {
      roleMultiplier = this.roleRiskMultipliers['Lead'];
    }

    factors.roleRisk = Math.min(100, 50 * roleMultiplier);

    // 5. Company Size Risk (5% weight)
    const companySize = person.company?.employeeCount || 0;
    if (companySize > 1000) factors.companySizeRisk = 30; // Large companies - more stable
    else if (companySize > 100) factors.companySizeRisk = 50; // Medium companies
    else factors.companySizeRisk = 60; // Small companies - more volatile

    // 6. Recent Change Risk (5% weight)
    // Check if they've been promoted or changed roles recently
    const recentRoles = careerData.historicalRoles.filter(role => {
      const endDate = role.endDate ? new Date(role.endDate) : new Date();
      const monthsAgo = (new Date().getTime() - endDate.getTime()) / (1000 * 60 * 60 * 24 * 30);
      return monthsAgo <= 12; // Within last year
    });

    if (recentRoles.length > 1) factors.recentChangeRisk = 70; // Multiple recent changes
    else if (recentRoles.length === 1) factors.recentChangeRisk = 50; // One recent change
    else factors.recentChangeRisk = 30; // No recent changes

    return factors;
  }

  calculateRiskScore(factors) {
    const weights = {
      tenureRisk: 0.40,
      velocityRisk: 0.25,
      industryRisk: 0.15,
      roleRisk: 0.10,
      companySizeRisk: 0.05,
      recentChangeRisk: 0.05
    };

    let weightedScore = 0;
    for (const [factor, weight] of Object.entries(weights)) {
      weightedScore += factors[factor] * weight;
    }

    return Math.round(weightedScore);
  }

  determineRiskLevel(riskScore) {
    if (riskScore >= 75) return 'HIGH';
    if (riskScore >= 50) return 'MEDIUM';
    return 'LOW';
  }

  generateRecommendations(riskLevel, factors, person) {
    const recommendations = [];

    if (riskLevel === 'HIGH') {
      recommendations.push('URGENT: High risk of leaving - prioritize immediate outreach');
      recommendations.push('Focus on quick wins and immediate value proposition');
      recommendations.push('Consider offering competitive alternatives');
    } else if (riskLevel === 'MEDIUM') {
      recommendations.push('MODERATE: Monitor closely - good time for relationship building');
      recommendations.push('Build trust and demonstrate long-term value');
      recommendations.push('Regular check-ins to maintain engagement');
    } else {
      recommendations.push('LOW: Stable position - focus on long-term relationship');
      recommendations.push('Build strategic partnership over time');
      recommendations.push('Regular touchpoints to stay top-of-mind');
    }

    // Specific recommendations based on risk factors
    if (factors.tenureRisk >= 70) {
      recommendations.push('⚠️ Tenure risk: They may be looking for new opportunities');
    }
    if (factors.velocityRisk >= 60) {
      recommendations.push('⚡ Velocity risk: Frequent job changes - they may be open to opportunities');
    }
    if (factors.roleRisk >= 60) {
      recommendations.push('🎯 Role risk: Senior position - decision maker but may have options');
    }

    return recommendations;
  }

  async updatePersonWithRiskAnalysis(personId, riskAnalysis) {
    await this.prisma.people.update({
      where: { id: personId },
      data: {
        customFields: {
          ...(await this.getPersonCustomFields(personId)),
          careerRiskAnalysis: riskAnalysis
        },
        updatedAt: new Date()
      }
    });
  }

  async getPersonCustomFields(personId) {
    const person = await this.prisma.people.findUnique({
      where: { id: personId },
      select: { customFields: true }
    });
    return person?.customFields || {};
  }

  delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  printResults() {
    console.log('\n🎯 Career Risk Analysis Results:');
    console.log('==================================');
    console.log(`Total People Processed: ${this.results.peopleProcessed}`);
    console.log(`Risk Analysis Generated: ${this.results.riskAnalysisGenerated}`);
    console.log(`Errors: ${this.results.errors}\n`);

    console.log('📊 Risk Distribution:');
    console.log(`   HIGH Risk: ${this.results.highRiskPeople} (${this.results.peopleProcessed > 0 ? Math.round((this.results.highRiskPeople / this.results.peopleProcessed) * 100) : 0}%)`);
    console.log(`   MEDIUM Risk: ${this.results.mediumRiskPeople} (${this.results.peopleProcessed > 0 ? Math.round((this.results.mediumRiskPeople / this.results.peopleProcessed) * 100) : 0}%)`);
    console.log(`   LOW Risk: ${this.results.lowRiskPeople} (${this.results.peopleProcessed > 0 ? Math.round((this.results.lowRiskPeople / this.results.peopleProcessed) * 100) : 0}%)\n`);

    console.log('💡 Sales Strategy Recommendations:');
    console.log('   • HIGH Risk: Immediate outreach, quick wins, competitive offers');
    console.log('   • MEDIUM Risk: Relationship building, regular check-ins');
    console.log('   • LOW Risk: Long-term partnership, strategic value');
  }
}

// Run the analyzer
const analyzer = new CareerRiskAnalyzer();
analyzer.run().catch(console.error);
