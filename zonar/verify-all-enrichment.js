#!/usr/bin/env node

/**
 * Comprehensive Enrichment Verification Script
 * 
 * This script verifies that all people and companies in the Notary Everyday
 * workspace have been properly enriched with high-quality data and intelligence.
 */

require('dotenv').config();
const { PrismaClient } = require('@prisma/client');

class EnrichmentVerifier {
  constructor() {
    this.prisma = new PrismaClient();
    this.workspaceId = '01K7DNYR5VZ7JY36KGKKN76XZ1'; // Notary Everyday workspace
    
    this.results = {
      people: {
        total: 0,
        enriched: 0,
        aiIntelligence: 0,
        highQuality: 0,
        highConfidence: 0,
        needsAttention: []
      },
      companies: {
        total: 0,
        enriched: 0,
        highQuality: 0,
        needsAttention: []
      },
      overall: {
        enrichmentRate: 0,
        aiIntelligenceRate: 0,
        averageDataQuality: 0,
        averageMatchConfidence: 0,
        averageAIConfidence: 0
      }
    };
  }

  async run() {
    try {
      console.log('🔍 Starting Comprehensive Enrichment Verification...\n');
      
      // Verify people enrichment
      await this.verifyPeopleEnrichment();
      
      console.log('\n' + '='.repeat(50) + '\n');
      
      // Verify companies enrichment
      await this.verifyCompaniesEnrichment();
      
      // Calculate overall metrics
      this.calculateOverallMetrics();
      
      // Print comprehensive report
      this.printComprehensiveReport();
      
    } catch (error) {
      console.error('❌ Error in enrichment verification:', error);
    } finally {
      await this.prisma.$disconnect();
    }
  }

  async verifyPeopleEnrichment() {
    console.log('👤 Verifying People Enrichment...');
    
    const people = await this.prisma.people.findMany({
      where: {
        workspaceId: this.workspaceId,
        deletedAt: null
      },
      select: {
        id: true,
        fullName: true,
        dataQualityScore: true,
        aiIntelligence: true,
        aiConfidence: true,
        customFields: true,
        enrichmentSources: true,
        lastEnriched: true,
        dataLastVerified: true
      }
    });

    this.results.people.total = people.length;
    console.log(`   📊 Found ${people.length} people to verify`);

    let totalDataQuality = 0;
    let totalMatchConfidence = 0;
    let totalAIConfidence = 0;
    let qualityCount = 0;
    let confidenceCount = 0;
    let aiConfidenceCount = 0;

    for (const person of people) {
      // Check enrichment status
      const isEnriched = this.isPersonEnriched(person);
      if (isEnriched) {
        this.results.people.enriched++;
      }

      // Check AI intelligence
      const hasAI = this.hasAIIntelligence(person);
      if (hasAI) {
        this.results.people.aiIntelligence++;
      }

      // Check data quality
      if (person.dataQualityScore && person.dataQualityScore > 0) {
        totalDataQuality += person.dataQualityScore;
        qualityCount++;
        
        if (person.dataQualityScore >= 75) {
          this.results.people.highQuality++;
        }
      }

      // Check match confidence
      const matchConfidence = person.customFields?.matchConfidence;
      if (matchConfidence && matchConfidence > 0) {
        totalMatchConfidence += matchConfidence;
        confidenceCount++;
        
        if (matchConfidence >= 80) {
          this.results.people.highConfidence++;
        }
      }

      // Check AI confidence
      if (person.aiConfidence && person.aiConfidence > 0) {
        totalAIConfidence += person.aiConfidence;
        aiConfidenceCount++;
      }

      // Identify records needing attention
      if (this.needsAttention(person)) {
        this.results.people.needsAttention.push({
          id: person.id,
          name: person.fullName,
          issues: this.getAttentionIssues(person)
        });
      }
    }

    // Calculate averages
    this.results.people.averageDataQuality = qualityCount > 0 ? 
      Math.round(totalDataQuality / qualityCount) : 0;
    this.results.people.averageMatchConfidence = confidenceCount > 0 ? 
      Math.round(totalMatchConfidence / confidenceCount) : 0;
    this.results.people.averageAIConfidence = aiConfidenceCount > 0 ? 
      Math.round(totalAIConfidence / aiConfidenceCount) : 0;

    console.log(`   ✅ Enrichment verification complete`);
  }

  async verifyCompaniesEnrichment() {
    console.log('🏢 Verifying Companies Enrichment...');
    
    const companies = await this.prisma.companies.findMany({
      where: {
        workspaceId: this.workspaceId,
        deletedAt: null
      },
      select: {
        id: true,
        name: true,
        customFields: true
      }
    });

    this.results.companies.total = companies.length;
    console.log(`   📊 Found ${companies.length} companies to verify`);

    let totalDataQuality = 0;
    let qualityCount = 0;

    for (const company of companies) {
      // Check enrichment status
      const isEnriched = this.isCompanyEnriched(company);
      if (isEnriched) {
        this.results.companies.enriched++;
      }

      // Check data quality
      const dataQuality = company.customFields?.dataQualityScore || company.dataQualityScore;
      if (dataQuality && dataQuality > 0) {
        totalDataQuality += dataQuality;
        qualityCount++;
        
        if (dataQuality >= 75) {
          this.results.companies.highQuality++;
        }
      }

      // Identify records needing attention
      if (this.companyNeedsAttention(company)) {
        this.results.companies.needsAttention.push({
          id: company.id,
          name: company.name,
          issues: this.getCompanyAttentionIssues(company)
        });
      }
    }

    // Calculate average
    this.results.companies.averageDataQuality = qualityCount > 0 ? 
      Math.round(totalDataQuality / qualityCount) : 0;

    console.log(`   ✅ Enrichment verification complete`);
  }

  isPersonEnriched(person) {
    return !!(
      person.customFields?.coresignalId ||
      person.customFields?.coresignalData ||
      person.enrichmentSources?.length > 0
    );
  }

  hasAIIntelligence(person) {
    return !!(
      person.aiIntelligence &&
      person.aiConfidence &&
      person.aiConfidence > 0
    );
  }

  isCompanyEnriched(company) {
    return !!(
      company.customFields?.coresignalId ||
      company.customFields?.coresignalData ||
      company.enrichmentSources?.length > 0
    );
  }

  needsAttention(person) {
    const issues = [];
    
    // No enrichment
    if (!this.isPersonEnriched(person)) {
      issues.push('No enrichment data');
    }
    
    // Low data quality
    if (!person.dataQualityScore || person.dataQualityScore < 60) {
      issues.push('Low data quality');
    }
    
    // Low match confidence
    const matchConfidence = person.customFields?.matchConfidence;
    if (matchConfidence && matchConfidence < 80) {
      issues.push('Low match confidence');
    }
    
    // No AI intelligence
    if (!this.hasAIIntelligence(person)) {
      issues.push('No AI intelligence');
    }
    
    // Low AI confidence
    if (person.aiConfidence && person.aiConfidence < 60) {
      issues.push('Low AI confidence');
    }
    
    // Stale data
    if (person.lastEnriched) {
      const daysSinceEnrichment = (new Date() - new Date(person.lastEnriched)) / (1000 * 60 * 60 * 24);
      if (daysSinceEnrichment > 90) {
        issues.push('Stale enrichment data');
      }
    }
    
    return issues.length > 0;
  }

  companyNeedsAttention(company) {
    const issues = [];
    
    // No enrichment
    if (!this.isCompanyEnriched(company)) {
      issues.push('No enrichment data');
    }
    
    // Low data quality
    const dataQuality = company.customFields?.dataQualityScore || company.dataQualityScore;
    if (!dataQuality || dataQuality < 60) {
      issues.push('Low data quality');
    }
    
    // Stale data
    if (company.lastEnriched) {
      const daysSinceEnrichment = (new Date() - new Date(company.lastEnriched)) / (1000 * 60 * 60 * 24);
      if (daysSinceEnrichment > 90) {
        issues.push('Stale enrichment data');
      }
    }
    
    return issues.length > 0;
  }

  getAttentionIssues(person) {
    const issues = [];
    
    if (!this.isPersonEnriched(person)) issues.push('No enrichment data');
    if (!person.dataQualityScore || person.dataQualityScore < 60) issues.push('Low data quality');
    if (person.customFields?.matchConfidence && person.customFields.matchConfidence < 80) issues.push('Low match confidence');
    if (!this.hasAIIntelligence(person)) issues.push('No AI intelligence');
    if (person.aiConfidence && person.aiConfidence < 60) issues.push('Low AI confidence');
    
    if (person.lastEnriched) {
      const daysSinceEnrichment = (new Date() - new Date(person.lastEnrichment)) / (1000 * 60 * 60 * 24);
      if (daysSinceEnrichment > 90) issues.push('Stale enrichment data');
    }
    
    return issues;
  }

  getCompanyAttentionIssues(company) {
    const issues = [];
    
    if (!this.isCompanyEnriched(company)) issues.push('No enrichment data');
    
    const dataQuality = company.customFields?.dataQualityScore || company.dataQualityScore;
    if (!dataQuality || dataQuality < 60) issues.push('Low data quality');
    
    if (company.lastEnriched) {
      const daysSinceEnrichment = (new Date() - new Date(company.lastEnriched)) / (1000 * 60 * 60 * 24);
      if (daysSinceEnrichment > 90) issues.push('Stale enrichment data');
    }
    
    return issues;
  }

  calculateOverallMetrics() {
    // Enrichment rates
    this.results.overall.enrichmentRate = this.results.people.total > 0 ? 
      Math.round((this.results.people.enriched / this.results.people.total) * 100) : 0;
    
    this.results.overall.aiIntelligenceRate = this.results.people.total > 0 ? 
      Math.round((this.results.people.aiIntelligence / this.results.people.total) * 100) : 0;
    
    // Average data quality
    this.results.overall.averageDataQuality = this.results.people.averageDataQuality;
    
    // Average match confidence
    this.results.overall.averageMatchConfidence = this.results.people.averageMatchConfidence;
    
    // Average AI confidence
    this.results.overall.averageAIConfidence = this.results.people.averageAIConfidence;
  }

  printComprehensiveReport() {
    console.log('\n📊 COMPREHENSIVE ENRICHMENT VERIFICATION REPORT');
    console.log('================================================');
    
    // People Summary
    console.log('\n👤 PEOPLE ENRICHMENT SUMMARY:');
    console.log(`   Total People: ${this.results.people.total}`);
    console.log(`   Enriched: ${this.results.people.enriched} (${this.results.overall.enrichmentRate}%)`);
    console.log(`   AI Intelligence: ${this.results.people.aiIntelligence} (${this.results.overall.aiIntelligenceRate}%)`);
    console.log(`   High Quality (75%+): ${this.results.people.highQuality}`);
    console.log(`   High Match Confidence (80%+): ${this.results.people.highConfidence}`);
    console.log(`   Average Data Quality: ${this.results.people.averageDataQuality}%`);
    console.log(`   Average Match Confidence: ${this.results.people.averageMatchConfidence}%`);
    console.log(`   Average AI Confidence: ${this.results.people.averageAIConfidence}%`);
    
    // Companies Summary
    console.log('\n🏢 COMPANIES ENRICHMENT SUMMARY:');
    console.log(`   Total Companies: ${this.results.companies.total}`);
    console.log(`   Enriched: ${this.results.companies.enriched} (${Math.round((this.results.companies.enriched / this.results.companies.total) * 100)}%)`);
    console.log(`   High Quality (75%+): ${this.results.companies.highQuality}`);
    console.log(`   Average Data Quality: ${this.results.companies.averageDataQuality}%`);
    
    // Records Needing Attention
    console.log('\n⚠️ RECORDS NEEDING ATTENTION:');
    console.log(`   People: ${this.results.people.needsAttention.length}`);
    console.log(`   Companies: ${this.results.companies.needsAttention.length}`);
    
    if (this.results.people.needsAttention.length > 0) {
      console.log('\n   People Issues:');
      this.results.people.needsAttention.slice(0, 10).forEach(person => {
        console.log(`     - ${person.name}: ${person.issues.join(', ')}`);
      });
      if (this.results.people.needsAttention.length > 10) {
        console.log(`     ... and ${this.results.people.needsAttention.length - 10} more`);
      }
    }
    
    if (this.results.companies.needsAttention.length > 0) {
      console.log('\n   Company Issues:');
      this.results.companies.needsAttention.slice(0, 10).forEach(company => {
        console.log(`     - ${company.name}: ${company.issues.join(', ')}`);
      });
      if (this.results.companies.needsAttention.length > 10) {
        console.log(`     ... and ${this.results.companies.needsAttention.length - 10} more`);
      }
    }
    
    // Quality Assessment
    console.log('\n🎯 QUALITY ASSESSMENT:');
    const peopleQualityRate = this.results.people.total > 0 ? 
      Math.round((this.results.people.highQuality / this.results.people.total) * 100) : 0;
    const companiesQualityRate = this.results.companies.total > 0 ? 
      Math.round((this.results.companies.highQuality / this.results.companies.total) * 100) : 0;
    
    console.log(`   People High Quality Rate: ${peopleQualityRate}%`);
    console.log(`   Companies High Quality Rate: ${companiesQualityRate}%`);
    
    // Overall Grade
    const overallGrade = this.calculateOverallGrade();
    console.log(`\n🏆 OVERALL ENRICHMENT GRADE: ${overallGrade.grade} (${overallGrade.score}/100)`);
    console.log(`   ${overallGrade.description}`);
    
    // Recommendations
    console.log('\n💡 RECOMMENDATIONS:');
    this.printRecommendations();
  }

  calculateOverallGrade() {
    let score = 0;
    let maxScore = 100;
    
    // Enrichment coverage (30 points)
    const enrichmentScore = (this.results.overall.enrichmentRate / 100) * 30;
    score += enrichmentScore;
    
    // AI intelligence coverage (25 points)
    const aiScore = (this.results.overall.aiIntelligenceRate / 100) * 25;
    score += aiScore;
    
    // Data quality (25 points)
    const qualityScore = (this.results.overall.averageDataQuality / 100) * 25;
    score += qualityScore;
    
    // Match confidence (20 points)
    const confidenceScore = (this.results.overall.averageMatchConfidence / 100) * 20;
    score += confidenceScore;
    
    const finalScore = Math.round(score);
    
    if (finalScore >= 90) return { grade: 'A+', score: finalScore, description: 'Excellent enrichment coverage and quality' };
    if (finalScore >= 80) return { grade: 'A', score: finalScore, description: 'Very good enrichment with minor gaps' };
    if (finalScore >= 70) return { grade: 'B', score: finalScore, description: 'Good enrichment with some areas for improvement' };
    if (finalScore >= 60) return { grade: 'C', score: finalScore, description: 'Adequate enrichment but needs significant improvement' };
    if (finalScore >= 50) return { grade: 'D', score: finalScore, description: 'Poor enrichment quality, major improvements needed' };
    return { grade: 'F', score: finalScore, description: 'Critical enrichment issues, immediate action required' };
  }

  printRecommendations() {
    const recommendations = [];
    
    if (this.results.overall.enrichmentRate < 80) {
      recommendations.push('Run enrichment scripts to improve coverage');
    }
    
    if (this.results.overall.aiIntelligenceRate < 70) {
      recommendations.push('Generate AI intelligence for more people');
    }
    
    if (this.results.overall.averageDataQuality < 70) {
      recommendations.push('Improve data quality through better enrichment sources');
    }
    
    if (this.results.overall.averageMatchConfidence < 80) {
      recommendations.push('Review and improve identity matching algorithms');
    }
    
    if (this.results.people.needsAttention.length > 0) {
      recommendations.push(`Address ${this.results.people.needsAttention.length} people records needing attention`);
    }
    
    if (this.results.companies.needsAttention.length > 0) {
      recommendations.push(`Address ${this.results.companies.needsAttention.length} company records needing attention`);
    }
    
    if (recommendations.length === 0) {
      recommendations.push('Enrichment is in excellent condition!');
    }
    
    recommendations.forEach((rec, index) => {
      console.log(`   ${index + 1}. ${rec}`);
    });
  }
}

// Run the verifier
const verifier = new EnrichmentVerifier();
verifier.run().catch(console.error);
