#!/usr/bin/env node

/**
 * Comprehensive Coresignal Data Coverage Analysis
 * 
 * This script analyzes all people in the database to determine:
 * 1. How many people have Coresignal data
 * 2. What type of Coresignal data they have
 * 3. Which people are missing Coresignal data
 * 4. Quality of existing Coresignal data
 * 5. Recommendations for enrichment
 */

const { PrismaClient } = require('@prisma/client');

class CoresignalCoverageAnalyzer {
  constructor() {
    this.prisma = new PrismaClient();
    this.results = {
      totalPeople: 0,
      withCoresignalData: 0,
      withFullCoresignalData: 0,
      withPartialCoresignalData: 0,
      withoutCoresignalData: 0,
      enrichmentSources: {},
      dataQuality: {},
      missingData: [],
      recommendations: []
    };
  }

  async analyzeCoresignalCoverage() {
    console.log('🔍 Starting comprehensive Coresignal data coverage analysis...\n');

    try {
      // Get total people count
      this.results.totalPeople = await this.prisma.people.count();
      console.log(`📊 Total people in database: ${this.results.totalPeople}`);

      // Get all people with their enrichment data
      const people = await this.prisma.people.findMany({
        select: {
          id: true,
          fullName: true,
          workEmail: true,
          companyId: true,
          enrichmentSources: true,
          customFields: true,
          lastEnriched: true,
          company: {
            select: {
              name: true,
              workspaceId: true
            }
          }
        }
      });

      console.log(`📋 Analyzing ${people.length} people records...\n`);

      // Analyze each person
      for (const person of people) {
        await this.analyzePerson(person);
      }

      // Generate comprehensive report
      await this.generateReport();

    } catch (error) {
      console.error('❌ Error during analysis:', error);
      throw error;
    } finally {
      await this.prisma.$disconnect();
    }
  }

  async analyzePerson(person) {
    const hasCoresignalData = this.hasCoresignalData(person);
    const coresignalDataQuality = this.assessCoresignalDataQuality(person);
    
    if (hasCoresignalData) {
      this.results.withCoresignalData++;
      
      if (coresignalDataQuality.isFull) {
        this.results.withFullCoresignalData++;
      } else {
        this.results.withPartialCoresignalData++;
      }
    } else {
      this.results.withoutCoresignalData++;
      this.results.missingData.push({
        id: person.id,
        fullName: person.fullName,
        workEmail: person.workEmail,
        companyName: person.company?.name || 'Unknown',
        workspaceId: person.company?.workspaceId || 'Unknown',
        lastEnriched: person.lastEnriched,
        enrichmentSources: person.enrichmentSources || []
      });
    }

    // Track enrichment sources
    if (person.enrichmentSources && person.enrichmentSources.length > 0) {
      person.enrichmentSources.forEach(source => {
        this.results.enrichmentSources[source] = (this.results.enrichmentSources[source] || 0) + 1;
      });
    }

    // Track data quality
    const qualityKey = coresignalDataQuality.level;
    this.results.dataQuality[qualityKey] = (this.results.dataQuality[qualityKey] || 0) + 1;
  }

  hasCoresignalData(person) {
    // Check if person has Coresignal data in customFields
    if (person.customFields && typeof person.customFields === 'object') {
      const customFields = person.customFields;
      
      // Check for various Coresignal data patterns
      if (customFields.coresignalData || 
          customFields.coresignal || 
          customFields.coreSignalData ||
          customFields.CoreSignalData) {
        return true;
      }
    }

    // Check enrichment sources
    if (person.enrichmentSources && person.enrichmentSources.length > 0) {
      const coresignalSources = person.enrichmentSources.filter(source => 
        source.toLowerCase().includes('coresignal') || 
        source.toLowerCase().includes('core-signal') ||
        source.toLowerCase().includes('coresignal-full')
      );
      return coresignalSources.length > 0;
    }

    return false;
  }

  assessCoresignalDataQuality(person) {
    if (!this.hasCoresignalData(person)) {
      return { level: 'none', isFull: false, score: 0 };
    }

    let score = 0;
    let hasBasicInfo = false;
    let hasAdvancedInfo = false;
    let hasSocialInfo = false;

    // Check customFields for Coresignal data
    if (person.customFields && typeof person.customFields === 'object') {
      const customFields = person.customFields;
      const coresignalData = customFields.coresignalData || 
                            customFields.coresignal || 
                            customFields.coreSignalData ||
                            customFields.CoreSignalData;

      if (coresignalData) {
        // Basic info (email, phone, title, location)
        if (coresignalData.primary_professional_email || coresignalData.email) score += 20;
        if (coresignalData.phone) score += 15;
        if (coresignalData.active_experience_title || coresignalData.job_title) score += 20;
        if (coresignalData.location || coresignalData.location_full) score += 15;
        if (score >= 50) hasBasicInfo = true;

        // Advanced info (experience, education, skills)
        if (coresignalData.experience && Array.isArray(coresignalData.experience) && coresignalData.experience.length > 0) {
          score += 15;
          hasAdvancedInfo = true;
        }
        if (coresignalData.education && Array.isArray(coresignalData.education) && coresignalData.education.length > 0) {
          score += 10;
          hasAdvancedInfo = true;
        }
        if (coresignalData.skills && Array.isArray(coresignalData.skills) && coresignalData.skills.length > 0) {
          score += 10;
          hasAdvancedInfo = true;
        }

        // Social info (LinkedIn, followers, connections)
        if (coresignalData.linkedin_url) score += 10;
        if (coresignalData.followers_count || coresignalData.connections_count) {
          score += 10;
          hasSocialInfo = true;
        }
        if (coresignalData.picture_url) score += 5;
      }
    }

    // Determine quality level
    let level = 'none';
    if (score >= 80) level = 'excellent';
    else if (score >= 60) level = 'good';
    else if (score >= 40) level = 'fair';
    else if (score >= 20) level = 'poor';
    else level = 'minimal';

    return {
      level,
      isFull: hasBasicInfo && hasAdvancedInfo && hasSocialInfo,
      score,
      hasBasicInfo,
      hasAdvancedInfo,
      hasSocialInfo
    };
  }

  async generateReport() {
    console.log('\n' + '='.repeat(80));
    console.log('📊 CORESIGNAL DATA COVERAGE ANALYSIS REPORT');
    console.log('='.repeat(80));

    // Overall statistics
    console.log('\n📈 OVERALL STATISTICS:');
    console.log(`   Total People: ${this.results.totalPeople}`);
    console.log(`   With Coresignal Data: ${this.results.withCoresignalData} (${((this.results.withCoresignalData / this.results.totalPeople) * 100).toFixed(1)}%)`);
    console.log(`   Without Coresignal Data: ${this.results.withoutCoresignalData} (${((this.results.withoutCoresignalData / this.results.totalPeople) * 100).toFixed(1)}%)`);
    console.log(`   Full Coresignal Data: ${this.results.withFullCoresignalData} (${((this.results.withFullCoresignalData / this.results.totalPeople) * 100).toFixed(1)}%)`);
    console.log(`   Partial Coresignal Data: ${this.results.withPartialCoresignalData} (${((this.results.withPartialCoresignalData / this.results.totalPeople) * 100).toFixed(1)}%)`);

    // Enrichment sources breakdown
    console.log('\n🔧 ENRICHMENT SOURCES:');
    Object.entries(this.results.enrichmentSources).forEach(([source, count]) => {
      console.log(`   ${source}: ${count} people`);
    });

    // Data quality breakdown
    console.log('\n📊 DATA QUALITY BREAKDOWN:');
    Object.entries(this.results.dataQuality).forEach(([quality, count]) => {
      console.log(`   ${quality}: ${count} people`);
    });

    // Missing data analysis
    if (this.results.missingData.length > 0) {
      console.log('\n❌ PEOPLE MISSING CORESIGNAL DATA:');
      console.log(`   Total missing: ${this.results.missingData.length}`);
      
      // Group by workspace
      const missingByWorkspace = {};
      this.results.missingData.forEach(person => {
        const workspace = person.workspaceId;
        if (!missingByWorkspace[workspace]) {
          missingByWorkspace[workspace] = [];
        }
        missingByWorkspace[workspace].push(person);
      });

      Object.entries(missingByWorkspace).forEach(([workspace, people]) => {
        console.log(`\n   Workspace ${workspace}: ${people.length} people missing Coresignal data`);
        
        // Show first 10 people missing data
        people.slice(0, 10).forEach(person => {
          console.log(`     - ${person.fullName} (${person.workEmail || 'No email'}) - ${person.companyName}`);
        });
        
        if (people.length > 10) {
          console.log(`     ... and ${people.length - 10} more`);
        }
      });
    }

    // Recommendations
    console.log('\n💡 RECOMMENDATIONS:');
    
    if (this.results.withoutCoresignalData > 0) {
      console.log(`   1. Enrich ${this.results.withoutCoresignalData} people missing Coresignal data`);
      console.log(`   2. Focus on people with email addresses for better matching`);
      console.log(`   3. Prioritize people from TOP companies first`);
    }
    
    if (this.results.withPartialCoresignalData > 0) {
      console.log(`   4. Re-enrich ${this.results.withPartialCoresignalData} people with partial data`);
      console.log(`   5. Use full Coresignal enrichment for better data quality`);
    }

    // Generate CSV for missing data
    await this.generateMissingDataCSV();

    console.log('\n✅ Analysis complete!');
  }

  async generateMissingDataCSV() {
    if (this.results.missingData.length === 0) {
      console.log('\n📄 No missing data CSV generated (all people have Coresignal data)');
      return;
    }

    const csvContent = [
      'ID,Full Name,Work Email,Company Name,Workspace ID,Last Enriched,Enrichment Sources',
      ...this.results.missingData.map(person => 
        `"${person.id}","${person.fullName}","${person.workEmail || ''}","${person.companyName}","${person.workspaceId}","${person.lastEnriched || ''}","${(person.enrichmentSources || []).join('; ')}"`
      )
    ].join('\n');

    const fs = require('fs');
    const path = require('path');
    const filename = `missing-coresignal-data-${new Date().toISOString().split('T')[0]}.csv`;
    const filepath = path.join(process.cwd(), 'scripts', filename);
    
    fs.writeFileSync(filepath, csvContent);
    console.log(`\n📄 Missing data exported to: ${filename}`);
  }
}

// Run the analysis
async function main() {
  const analyzer = new CoresignalCoverageAnalyzer();
  await analyzer.analyzeCoresignalCoverage();
}

if (require.main === module) {
  main().catch(console.error);
}

module.exports = CoresignalCoverageAnalyzer;
