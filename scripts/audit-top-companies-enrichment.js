#!/usr/bin/env node

/**
 * 🔍 AUDIT TOP WORKSPACE COMPANY ENRICHMENT DATA
 * 
 * Comprehensive analysis of company records in TOP Engineering Plus workspace
 * to verify enrichment data quality and migration completeness.
 */

const { PrismaClient } = require('@prisma/client');

// Database connections - OLD DATABASE (TOP workspace data)
const OLD_DATABASE_URL = 'postgresql://neondb_owner:npg_hsBrlzEb2G8Y@ep-patient-mountain-adnc9mz6-pooler.c-2.us-east-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require';

const oldPrisma = new PrismaClient({
  datasources: {
    db: {
      url: OLD_DATABASE_URL
    }
  }
});

const newPrisma = new PrismaClient();

class TopCompanyEnrichmentAudit {
  constructor() {
    this.oldPrisma = oldPrisma;
    this.newPrisma = newPrisma;
    this.auditResults = {
      summary: {},
      fieldAnalysis: {},
      companyDetails: [],
      migrationGaps: [],
      recommendations: [],
      oldVsNewComparison: {}
    };
  }

  async runAudit() {
    try {
      console.log('🔍 TOP WORKSPACE COMPANY ENRICHMENT AUDIT');
      console.log('==========================================\n');

      // Connect to both databases
      await this.oldPrisma.$connect();
      await this.newPrisma.$connect();
      console.log('✅ Connected to both databases\n');

      // Find TOP workspace in both databases
      const topWorkspace = await this.findTopWorkspace();
      if (!topWorkspace) {
        throw new Error('TOP Engineering Plus workspace not found!');
      }

      console.log(`📊 Found TOP workspace: ${topWorkspace.new.name} (${topWorkspace.new.id})\n`);

      // Fetch company records from both databases
      const companies = await this.fetchCompanyRecords(topWorkspace);
      
    // Analyze enrichment data
    await this.analyzeEnrichmentData(companies);
    
    // Compare old vs new database data
    await this.compareOldVsNewData(companies);
    
    // Generate comprehensive report
    this.generateReport();
      
      console.log('✅ Audit completed successfully!');
      
    } catch (error) {
      console.error('❌ Audit failed:', error);
      throw error;
    } finally {
      await this.oldPrisma.$disconnect();
      await this.newPrisma.$disconnect();
    }
  }

  async findTopWorkspace() {
    console.log('🔍 Finding TOP Engineering Plus workspace...');
    
    // Find in new database
    const newWorkspace = await this.newPrisma.workspaces.findFirst({
      where: {
        OR: [
          { name: { contains: 'TOP Engineering Plus', mode: 'insensitive' } },
          { name: { contains: 'TOP', mode: 'insensitive' } }
        ]
      }
    });

    if (!newWorkspace) {
      console.log('❌ TOP workspace not found in new database');
      return null;
    }

    // Find in old database - look for TOP workspace
    const oldWorkspace = await this.oldPrisma.$queryRaw`
      SELECT id, name, slug, "createdAt", "updatedAt"
      FROM workspaces 
      WHERE name ILIKE '%top engineering plus%' OR name ILIKE '%top%'
      ORDER BY "createdAt" DESC
      LIMIT 1;
    `;

    return {
      new: newWorkspace,
      old: oldWorkspace[0] || null
    };
  }

  async fetchCompanyRecords(workspace) {
    console.log('📋 Fetching company records...');
    
    // Fetch from new database
    const newCompanies = await this.newPrisma.companies.findMany({
      where: {
        workspaceId: workspace.new.id,
        deletedAt: null
      },
      orderBy: { createdAt: 'desc' }
    });

    // Fetch from old database - TOP workspace companies
    const oldCompanies = workspace.old ? await this.oldPrisma.$queryRaw`
      SELECT * FROM companies 
      WHERE "workspaceId" = ${workspace.old.id}
      AND "deletedAt" IS NULL
      ORDER BY "createdAt" DESC;
    ` : [];

    console.log(`   New DB: ${newCompanies.length} companies`);
    console.log(`   Old DB: ${oldCompanies.length} companies\n`);

    return {
      new: newCompanies,
      old: oldCompanies,
      workspace: workspace
    };
  }

  async analyzeEnrichmentData(companies) {
    console.log('🔍 Analyzing enrichment data...\n');

    // Define enrichment fields to analyze
    const enrichmentFields = {
      // Core Intelligence Fields
      coreIntelligence: [
        'companyIntelligence',
        'businessChallenges',
        'businessPriorities', 
        'competitiveAdvantages',
        'growthOpportunities',
        'strategicInitiatives',
        'successMetrics',
        'marketThreats',
        'keyInfluencers',
        'decisionTimeline',
        'marketPosition',
        'digitalMaturity',
        'techStack',
        'competitors'
      ],
      
      // Financial & Business Data
      financial: [
        'lastFundingAmount',
        'lastFundingDate',
        'stockSymbol',
        'isPublic',
        'naicsCodes',
        'sicCodes'
      ],
      
      // Social Media & Online Presence
      socialMedia: [
        'linkedinUrl',
        'linkedinFollowers',
        'twitterUrl',
        'twitterFollowers',
        'facebookUrl',
        'instagramUrl',
        'youtubeUrl',
        'githubUrl'
      ],
      
      // Location & Address Data
      location: [
        'hqLocation',
        'hqFullAddress',
        'hqCity',
        'hqState',
        'hqStreet',
        'hqZipcode',
        'hqRegion',
        'hqCountryIso2',
        'hqCountryIso3'
      ],
      
      // Company Updates & Activity
      activity: [
        'companyUpdates',
        'activeJobPostings',
        'numTechnologiesUsed',
        'technologiesUsed'
      ],
      
      // SBI Specific Fields
      sbi: [
        'confidence',
        'sources',
        'acquisitionDate',
        'lastVerified',
        'parentCompanyName',
        'parentCompanyDomain'
      ]
    };

    // Analyze each company
    for (const company of companies.new) {
      const companyAnalysis = this.analyzeCompany(company, enrichmentFields);
      this.auditResults.companyDetails.push(companyAnalysis);
    }

    // Calculate field-level statistics
    this.calculateFieldStatistics(enrichmentFields);
    
    // Calculate summary statistics
    this.calculateSummaryStatistics(companies);
  }

  analyzeCompany(company, enrichmentFields) {
    const analysis = {
      id: company.id,
      name: company.name,
      domain: company.domain,
      enrichmentScore: 0,
      fieldCoverage: {},
      missingFields: [],
      populatedFields: []
    };

    let totalFields = 0;
    let populatedFields = 0;

    // Analyze each field category
    Object.entries(enrichmentFields).forEach(([category, fields]) => {
      analysis.fieldCoverage[category] = {
        total: fields.length,
        populated: 0,
        percentage: 0,
        fields: {}
      };

      fields.forEach(field => {
        totalFields++;
        const value = company[field];
        const isPopulated = this.isFieldPopulated(value);
        
        analysis.fieldCoverage[category].fields[field] = {
          populated: isPopulated,
          value: this.sanitizeValue(value)
        };

        if (isPopulated) {
          populatedFields++;
          analysis.fieldCoverage[category].populated++;
          analysis.populatedFields.push(field);
        } else {
          analysis.missingFields.push(field);
        }
      });

      // Calculate category percentage
      analysis.fieldCoverage[category].percentage = 
        (analysis.fieldCoverage[category].populated / analysis.fieldCoverage[category].total) * 100;
    });

    // Calculate overall enrichment score
    analysis.enrichmentScore = totalFields > 0 ? (populatedFields / totalFields) * 100 : 0;

    return analysis;
  }

  isFieldPopulated(value) {
    if (value === null || value === undefined) return false;
    if (typeof value === 'string') return value.trim().length > 0;
    if (typeof value === 'number') return value > 0;
    if (Array.isArray(value)) return value.length > 0;
    if (typeof value === 'object') return Object.keys(value).length > 0;
    if (typeof value === 'boolean') return true;
    return false;
  }

  sanitizeValue(value) {
    if (value === null || value === undefined) return null;
    if (typeof value === 'string' && value.length > 100) {
      return value.substring(0, 100) + '...';
    }
    if (Array.isArray(value) && value.length > 5) {
      return value.slice(0, 5).concat([`... and ${value.length - 5} more`]);
    }
    return value;
  }

  calculateFieldStatistics(enrichmentFields) {
    console.log('📊 Calculating field-level statistics...');
    
    const fieldStats = {};
    const totalCompanies = this.auditResults.companyDetails.length;

    // Initialize field statistics
    Object.values(enrichmentFields).flat().forEach(field => {
      fieldStats[field] = {
        totalCompanies,
        populatedCount: 0,
        percentage: 0,
        category: this.getFieldCategory(field, enrichmentFields)
      };
    });

    // Count populated fields across all companies
    this.auditResults.companyDetails.forEach(company => {
      company.populatedFields.forEach(field => {
        if (fieldStats[field]) {
          fieldStats[field].populatedCount++;
        }
      });
    });

    // Calculate percentages
    Object.keys(fieldStats).forEach(field => {
      fieldStats[field].percentage = 
        (fieldStats[field].populatedCount / fieldStats[field].totalCompanies) * 100;
    });

    this.auditResults.fieldAnalysis = fieldStats;
  }

  getFieldCategory(field, enrichmentFields) {
    for (const [category, fields] of Object.entries(enrichmentFields)) {
      if (fields.includes(field)) {
        return category;
      }
    }
    return 'other';
  }

  calculateSummaryStatistics(companies) {
    console.log('📈 Calculating summary statistics...');
    
    const companyDetails = this.auditResults.companyDetails;
    const enrichmentScores = companyDetails.map(c => c.enrichmentScore);
    
    this.auditResults.summary = {
      totalCompanies: companyDetails.length,
      averageEnrichmentScore: enrichmentScores.reduce((a, b) => a + b, 0) / companyDetails.length,
      minEnrichmentScore: Math.min(...enrichmentScores),
      maxEnrichmentScore: Math.max(...enrichmentScores),
      companiesWithHighEnrichment: companyDetails.filter(c => c.enrichmentScore >= 70).length,
      companiesWithMediumEnrichment: companyDetails.filter(c => c.enrichmentScore >= 40 && c.enrichmentScore < 70).length,
      companiesWithLowEnrichment: companyDetails.filter(c => c.enrichmentScore < 40).length,
      topEnrichedCompanies: companyDetails
        .sort((a, b) => b.enrichmentScore - a.enrichmentScore)
        .slice(0, 10)
        .map(c => ({ name: c.name, score: c.enrichmentScore }))
    };

    // Identify migration gaps
    this.identifyMigrationGaps();
    
    // Generate recommendations
    this.generateRecommendations();
  }

  identifyMigrationGaps() {
    console.log('🔍 Identifying migration gaps...');
    
    const gaps = [];
    const fieldAnalysis = this.auditResults.fieldAnalysis;
    
    // Find fields with low population rates
    Object.entries(fieldAnalysis).forEach(([field, stats]) => {
      if (stats.percentage < 30) {
        gaps.push({
          field,
          category: stats.category,
          populationRate: stats.percentage,
          populatedCount: stats.populatedCount,
          totalCount: stats.totalCompanies,
          severity: stats.percentage < 10 ? 'critical' : stats.percentage < 20 ? 'high' : 'medium'
        });
      }
    });

    this.auditResults.migrationGaps = gaps.sort((a, b) => a.populationRate - b.populationRate);
  }

  generateRecommendations() {
    console.log('💡 Generating recommendations...');
    
    const recommendations = [];
    const gaps = this.auditResults.migrationGaps;
    
    // Critical gaps
    const criticalGaps = gaps.filter(g => g.severity === 'critical');
    if (criticalGaps.length > 0) {
      recommendations.push({
        priority: 'critical',
        category: 'data_migration',
        title: 'Critical Data Migration Gaps',
        description: `${criticalGaps.length} fields have less than 10% population rate`,
        fields: criticalGaps.map(g => g.field),
        action: 'Immediate data enrichment required for these fields'
      });
    }

    // High priority gaps
    const highGaps = gaps.filter(g => g.severity === 'high');
    if (highGaps.length > 0) {
      recommendations.push({
        priority: 'high',
        category: 'data_quality',
        title: 'High Priority Data Quality Issues',
        description: `${highGaps.length} fields have 10-20% population rate`,
        fields: highGaps.map(g => g.field),
        action: 'Schedule data enrichment for these fields'
      });
    }

    // Category-specific recommendations
    const categoryStats = this.getCategoryStatistics();
    Object.entries(categoryStats).forEach(([category, stats]) => {
      if (stats.averagePercentage < 50) {
        recommendations.push({
          priority: 'medium',
          category: 'enrichment',
          title: `Improve ${category} Data Quality`,
          description: `${category} fields average ${stats.averagePercentage.toFixed(1)}% population`,
          action: `Focus enrichment efforts on ${category} category fields`
        });
      }
    });

    this.auditResults.recommendations = recommendations;
  }

  getCategoryStatistics() {
    const categories = {};
    const fieldAnalysis = this.auditResults.fieldAnalysis;
    
    Object.values(fieldAnalysis).forEach(field => {
      if (!categories[field.category]) {
        categories[field.category] = { total: 0, populated: 0, fields: [] };
      }
      categories[field.category].total += field.totalCompanies;
      categories[field.category].populated += field.populatedCount;
      categories[field.category].fields.push(field);
    });

    Object.keys(categories).forEach(category => {
      categories[category].averagePercentage = 
        (categories[category].populated / categories[category].total) * 100;
    });

    return categories;
  }

  async compareOldVsNewData(companies) {
    console.log('🔄 Comparing old vs new database data...\n');
    
    if (companies.old.length === 0) {
      console.log('⚠️ No old database data found for comparison');
      this.auditResults.oldVsNewComparison = {
        hasOldData: false,
        message: 'No old database data available for comparison'
      };
      return;
    }

    // Sample a few companies for detailed comparison
    const sampleSize = Math.min(5, companies.new.length);
    const sampleCompanies = companies.new.slice(0, sampleSize);
    
    const comparison = {
      hasOldData: true,
      totalOldCompanies: companies.old.length,
      totalNewCompanies: companies.new.length,
      sampleComparison: [],
      fieldComparison: {}
    };

    // Compare sample companies
    for (const newCompany of sampleCompanies) {
      const oldCompany = companies.old.find(old => 
        old.name === newCompany.name || 
        old.domain === newCompany.domain ||
        old.website === newCompany.website
      );

      if (oldCompany) {
        const companyComparison = this.compareCompanyData(oldCompany, newCompany);
        comparison.sampleComparison.push({
          name: newCompany.name,
          domain: newCompany.domain,
          comparison: companyComparison
        });
      }
    }

    // Compare field population rates between old and new
    const enrichmentFields = [
      'companyIntelligence', 'businessChallenges', 'businessPriorities',
      'competitiveAdvantages', 'growthOpportunities', 'strategicInitiatives',
      'successMetrics', 'marketThreats', 'keyInfluencers', 'decisionTimeline',
      'marketPosition', 'digitalMaturity', 'techStack', 'competitors',
      'lastFundingAmount', 'lastFundingDate', 'stockSymbol', 'isPublic',
      'naicsCodes', 'sicCodes', 'linkedinUrl', 'linkedinFollowers',
      'twitterUrl', 'twitterFollowers', 'facebookUrl', 'instagramUrl',
      'youtubeUrl', 'githubUrl', 'hqLocation', 'hqFullAddress',
      'hqCity', 'hqState', 'hqStreet', 'hqZipcode', 'hqRegion',
      'hqCountryIso2', 'hqCountryIso3', 'companyUpdates',
      'activeJobPostings', 'numTechnologiesUsed', 'technologiesUsed',
      'confidence', 'sources', 'acquisitionDate', 'lastVerified',
      'parentCompanyName', 'parentCompanyDomain'
    ];

    for (const field of enrichmentFields) {
      const oldPopulated = companies.old.filter(company => 
        this.isFieldPopulated(company[field])
      ).length;
      
      const newPopulated = companies.new.filter(company => 
        this.isFieldPopulated(company[field])
      ).length;

      comparison.fieldComparison[field] = {
        oldPopulated,
        newPopulated,
        oldPercentage: (oldPopulated / companies.old.length) * 100,
        newPercentage: (newPopulated / companies.new.length) * 100,
        dataLoss: oldPopulated - newPopulated,
        dataLossPercentage: oldPopulated > 0 ? 
          ((oldPopulated - newPopulated) / oldPopulated) * 100 : 0
      };
    }

    this.auditResults.oldVsNewComparison = comparison;
  }

  compareCompanyData(oldCompany, newCompany) {
    const comparison = {
      fieldsCompared: 0,
      fieldsMatch: 0,
      fieldsMissing: 0,
      fieldsChanged: 0,
      details: {}
    };

    const fieldsToCompare = [
      'name', 'domain', 'website', 'industry', 'size', 'employeeCount',
      'linkedinUrl', 'linkedinFollowers', 'twitterUrl', 'facebookUrl',
      'hqLocation', 'hqCity', 'hqState', 'hqCountryIso2',
      'naicsCodes', 'sicCodes', 'technologiesUsed'
    ];

    for (const field of fieldsToCompare) {
      comparison.fieldsCompared++;
      const oldValue = oldCompany[field];
      const newValue = newCompany[field];

      if (this.isFieldPopulated(oldValue) && this.isFieldPopulated(newValue)) {
        if (JSON.stringify(oldValue) === JSON.stringify(newValue)) {
          comparison.fieldsMatch++;
          comparison.details[field] = 'match';
        } else {
          comparison.fieldsChanged++;
          comparison.details[field] = 'changed';
        }
      } else if (this.isFieldPopulated(oldValue) && !this.isFieldPopulated(newValue)) {
        comparison.fieldsMissing++;
        comparison.details[field] = 'missing_in_new';
      } else if (!this.isFieldPopulated(oldValue) && this.isFieldPopulated(newValue)) {
        comparison.fieldsChanged++;
        comparison.details[field] = 'added_in_new';
      } else {
        comparison.details[field] = 'empty_both';
      }
    }

    return comparison;
  }

  generateReport() {
    console.log('\n📊 ENRICHMENT AUDIT REPORT');
    console.log('==========================\n');

    // Summary
    console.log('📈 SUMMARY STATISTICS:');
    console.log(`   Total Companies: ${this.auditResults.summary.totalCompanies}`);
    console.log(`   Average Enrichment Score: ${this.auditResults.summary.averageEnrichmentScore.toFixed(1)}%`);
    console.log(`   High Enrichment (≥70%): ${this.auditResults.summary.companiesWithHighEnrichment}`);
    console.log(`   Medium Enrichment (40-69%): ${this.auditResults.summary.companiesWithMediumEnrichment}`);
    console.log(`   Low Enrichment (<40%): ${this.auditResults.summary.companiesWithLowEnrichment}\n`);

    // Top enriched companies
    console.log('🏆 TOP 10 ENRICHED COMPANIES:');
    this.auditResults.summary.topEnrichedCompanies.forEach((company, index) => {
      console.log(`   ${index + 1}. ${company.name}: ${company.score.toFixed(1)}%`);
    });
    console.log('');

    // Field analysis
    console.log('📋 FIELD-LEVEL ANALYSIS:');
    const fieldStats = this.auditResults.fieldAnalysis;
    const sortedFields = Object.entries(fieldStats)
      .sort(([,a], [,b]) => b.percentage - a.percentage);
    
    sortedFields.forEach(([field, stats]) => {
      const status = stats.percentage >= 70 ? '✅' : stats.percentage >= 40 ? '⚠️' : '❌';
      console.log(`   ${status} ${field}: ${stats.percentage.toFixed(1)}% (${stats.populatedCount}/${stats.totalCompanies})`);
    });
    console.log('');

    // Migration gaps
    if (this.auditResults.migrationGaps.length > 0) {
      console.log('🚨 MIGRATION GAPS:');
      this.auditResults.migrationGaps.slice(0, 10).forEach(gap => {
        const severity = gap.severity === 'critical' ? '🔴' : gap.severity === 'high' ? '🟡' : '🟠';
        console.log(`   ${severity} ${gap.field}: ${gap.populationRate.toFixed(1)}% (${gap.category})`);
      });
      console.log('');
    }

    // Old vs New Database Comparison
    if (this.auditResults.oldVsNewComparison.hasOldData) {
      console.log('🔄 OLD vs NEW DATABASE COMPARISON:');
      const comparison = this.auditResults.oldVsNewComparison;
      console.log(`   Old DB Companies: ${comparison.totalOldCompanies}`);
      console.log(`   New DB Companies: ${comparison.totalNewCompanies}`);
      
      // Show fields with significant data loss
      const significantLosses = Object.entries(comparison.fieldComparison)
        .filter(([field, data]) => data.dataLossPercentage > 20)
        .sort(([,a], [,b]) => b.dataLossPercentage - a.dataLossPercentage)
        .slice(0, 10);
      
      if (significantLosses.length > 0) {
        console.log('\n   🚨 FIELDS WITH SIGNIFICANT DATA LOSS (>20%):');
        significantLosses.forEach(([field, data]) => {
          console.log(`   ❌ ${field}: ${data.oldPercentage.toFixed(1)}% → ${data.newPercentage.toFixed(1)}% (${data.dataLossPercentage.toFixed(1)}% loss)`);
        });
      }
      
      // Show sample company comparison
      if (comparison.sampleComparison.length > 0) {
        console.log('\n   📋 SAMPLE COMPANY COMPARISON:');
        comparison.sampleComparison.forEach(company => {
          const comp = company.comparison;
          console.log(`   ${company.name}: ${comp.fieldsMatch}/${comp.fieldsCompared} fields match, ${comp.fieldsMissing} missing`);
        });
      }
      console.log('');
    } else {
      console.log('⚠️ OLD DATABASE COMPARISON: No old database data found for comparison\n');
    }

    // Recommendations
    if (this.auditResults.recommendations.length > 0) {
      console.log('💡 RECOMMENDATIONS:');
      this.auditResults.recommendations.forEach((rec, index) => {
        const priority = rec.priority === 'critical' ? '🔴' : rec.priority === 'high' ? '🟡' : '🟠';
        console.log(`   ${index + 1}. ${priority} ${rec.title}`);
        console.log(`      ${rec.description}`);
        console.log(`      Action: ${rec.action}\n`);
      });
    }

    // Save detailed report to file
    const fs = require('fs');
    const reportPath = 'audit-top-companies-report.json';
    fs.writeFileSync(reportPath, JSON.stringify(this.auditResults, null, 2));
    console.log(`📄 Detailed report saved to: ${reportPath}`);
  }
}

// Run the audit
async function main() {
  const audit = new TopCompanyEnrichmentAudit();
  await audit.runAudit();
}

if (require.main === module) {
  main().catch(console.error);
}

module.exports = TopCompanyEnrichmentAudit;
