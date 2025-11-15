#!/usr/bin/env node

/**
 * 📊 COMPREHENSIVE AUDIT: ALL TOP ENGINEERING PLUS PEOPLE
 * 
 * Audits data completeness for ALL people in TOP Engineering Plus workspace.
 * Shows breakdown by:
 * - Buyer group people vs non-buyer group people
 * - Data completeness levels
 * - What data is stored where
 */

require('dotenv').config();
const { PrismaClient } = require('@prisma/client');

class AuditAllTopPeople {
  constructor() {
    this.prisma = new PrismaClient();
    this.workspaceId = '01K75ZD7DWHG1XF16HAF2YVKCK'; // TOP Engineering Plus workspace
    this.stats = {
      total: 0,
      buyerGroup: {
        total: 0,
        withCoresignal: 0,
        withEnriched: 0,
        withAi: 0
      },
      nonBuyerGroup: {
        total: 0,
        withCoresignal: 0,
        withEnriched: 0,
        withAi: 0
      },
      fields: {
        // Basic Info
        firstName: 0,
        lastName: 0,
        fullName: 0,
        // Contact Info
        email: 0,
        workEmail: 0,
        personalEmail: 0,
        phone: 0,
        mobilePhone: 0,
        workPhone: 0,
        linkedinUrl: 0,
        // Professional Info
        jobTitle: 0,
        title: 0,
        department: 0,
        // Buyer Group Info
        buyerGroupRole: 0,
        isBuyerGroupMember: 0,
        influenceScore: 0,
        authorityLevel: 0,
        // CoreSignal Data
        coresignalData: 0,
        coreSignalId: 0,
        // Enriched Data
        enrichedData: 0,
        aiIntelligence: 0,
        // Custom Fields
        customFields: 0,
        customFieldsCoresignal: 0
      },
      dataQuality: {
        excellent: 0, // Has email, LinkedIn, title, CoreSignal data
        good: 0,      // Has email OR LinkedIn, title, some CoreSignal data
        fair: 0,      // Has basic info but missing CoreSignal
        poor: 0       // Missing critical fields
      },
      enrichmentStatus: {
        buyerGroupEnriched: 0,      // Enriched via buyer group pipeline
        coresignalEnriched: 0,      // Has CoreSignal data
        needsEnrichment: 0,         // Missing CoreSignal, has email/LinkedIn
        noEnrichmentPossible: 0     // Missing email and LinkedIn
      }
    };
  }

  async audit() {
    try {
      console.log('📊 COMPREHENSIVE AUDIT: ALL TOP ENGINEERING PLUS PEOPLE');
      console.log('==========================================================');
      console.log(`📊 Workspace ID: ${this.workspaceId}`);
      console.log('');

      // Get all people
      const allPeople = await this.getAllPeople();

      console.log(`📋 Found ${allPeople.length} total people in workspace`);
      console.log('');

      if (allPeople.length === 0) {
        console.log('⚠️  No people found');
        return;
      }

      // Audit each person
      for (const person of allPeople) {
        this.auditPerson(person);
      }

      // Generate comprehensive report
      this.generateReport();

    } catch (error) {
      console.error('❌ ERROR:', error.message);
      throw error;
    } finally {
      await this.prisma.$disconnect();
    }
  }

  /**
   * Get all people in workspace
   */
  async getAllPeople() {
    return await this.prisma.people.findMany({
      where: {
        workspaceId: this.workspaceId,
        deletedAt: null
      },
      include: {
        company: {
          select: {
            id: true,
            name: true
          }
        }
      },
      orderBy: {
        fullName: 'asc'
      }
    });
  }

  /**
   * Audit a single person's data
   */
  auditPerson(person) {
    this.stats.total++;

    const isBuyerGroup = !!(person.buyerGroupRole || person.isBuyerGroupMember);
    
    if (isBuyerGroup) {
      this.stats.buyerGroup.total++;
    } else {
      this.stats.nonBuyerGroup.total++;
    }

    // Basic Info
    if (person.firstName) this.stats.fields.firstName++;
    if (person.lastName) this.stats.fields.lastName++;
    if (person.fullName) this.stats.fields.fullName++;

    // Contact Info
    if (person.email) this.stats.fields.email++;
    if (person.workEmail) this.stats.fields.workEmail++;
    if (person.personalEmail) this.stats.fields.personalEmail++;
    if (person.phone) this.stats.fields.phone++;
    if (person.mobilePhone) this.stats.fields.mobilePhone++;
    if (person.workPhone) this.stats.fields.workPhone++;
    if (person.linkedinUrl) this.stats.fields.linkedinUrl++;

    // Professional Info
    if (person.jobTitle) this.stats.fields.jobTitle++;
    if (person.title) this.stats.fields.title++;
    if (person.department) this.stats.fields.department++;

    // Buyer Group Info
    if (person.buyerGroupRole) this.stats.fields.buyerGroupRole++;
    if (person.isBuyerGroupMember) this.stats.fields.isBuyerGroupMember++;
    if (person.influenceScore !== null && person.influenceScore !== undefined) {
      this.stats.fields.influenceScore++;
    }
    if (person.authorityLevel) this.stats.fields.authorityLevel++;

    // CoreSignal Data
    if (person.coreSignalId) this.stats.fields.coreSignalId++;
    let hasCoresignalData = false;
    if (person.coresignalData) {
      const coresignalData = typeof person.coresignalData === 'object' 
        ? person.coresignalData 
        : JSON.parse(person.coresignalData || '{}');
      
      if (coresignalData && Object.keys(coresignalData).length > 0) {
        hasCoresignalData = true;
        this.stats.fields.coresignalData++;
        if (isBuyerGroup) {
          this.stats.buyerGroup.withCoresignal++;
        } else {
          this.stats.nonBuyerGroup.withCoresignal++;
        }
      }
    }

    // Enriched Data
    let hasEnrichedData = false;
    if (person.enrichedData) {
      const enrichedData = typeof person.enrichedData === 'object'
        ? person.enrichedData
        : JSON.parse(person.enrichedData || '{}');
      
      if (enrichedData && Object.keys(enrichedData).length > 0) {
        hasEnrichedData = true;
        this.stats.fields.enrichedData++;
        if (isBuyerGroup) {
          this.stats.buyerGroup.withEnriched++;
        } else {
          this.stats.nonBuyerGroup.withEnriched++;
        }
      }
    }

    // AI Intelligence
    let hasAiIntelligence = false;
    if (person.aiIntelligence) {
      const aiIntelligence = typeof person.aiIntelligence === 'object'
        ? person.aiIntelligence
        : JSON.parse(person.aiIntelligence || '{}');
      
      if (aiIntelligence && Object.keys(aiIntelligence).length > 0) {
        hasAiIntelligence = true;
        this.stats.fields.aiIntelligence++;
        if (isBuyerGroup) {
          this.stats.buyerGroup.withAi++;
        } else {
          this.stats.nonBuyerGroup.withAi++;
        }
      }
    }

    // Custom Fields
    if (person.customFields) {
      const customFields = typeof person.customFields === 'object'
        ? person.customFields
        : JSON.parse(person.customFields || '{}');
      
      if (customFields && Object.keys(customFields).length > 0) {
        this.stats.fields.customFields++;
        
        if (customFields.coresignal) {
          this.stats.fields.customFieldsCoresignal++;
        }
      }
    }

    // Data Quality Assessment
    this.assessDataQuality(person);

    // Enrichment Status
    this.assessEnrichmentStatus(person, isBuyerGroup, hasCoresignalData);
  }

  /**
   * Assess data quality for a person
   */
  assessDataQuality(person) {
    const hasEmail = !!(person.email || person.workEmail || person.personalEmail);
    const hasLinkedIn = !!person.linkedinUrl;
    const hasTitle = !!(person.jobTitle || person.title);
    const hasCoresignalData = person.coresignalData && 
      typeof person.coresignalData === 'object' &&
      Object.keys(person.coresignalData).length > 0;

    // Excellent: Has email, LinkedIn, title, and CoreSignal data
    if (hasEmail && hasLinkedIn && hasTitle && hasCoresignalData) {
      this.stats.dataQuality.excellent++;
      return;
    }

    // Good: Has email OR LinkedIn, title, and some CoreSignal/enriched data
    if ((hasEmail || hasLinkedIn) && hasTitle && hasCoresignalData) {
      this.stats.dataQuality.good++;
      return;
    }

    // Fair: Has basic info but missing CoreSignal
    if (hasEmail || hasLinkedIn || hasTitle) {
      this.stats.dataQuality.fair++;
      return;
    }

    // Poor: Missing critical fields
    this.stats.dataQuality.poor++;
  }

  /**
   * Assess enrichment status
   */
  assessEnrichmentStatus(person, isBuyerGroup, hasCoresignalData) {
    const hasEmail = !!(person.email || person.workEmail || person.personalEmail);
    const hasLinkedIn = !!person.linkedinUrl;

    if (isBuyerGroup) {
      this.stats.enrichmentStatus.buyerGroupEnriched++;
    }

    if (hasCoresignalData) {
      this.stats.enrichmentStatus.coresignalEnriched++;
    }

    if (!hasCoresignalData && (hasEmail || hasLinkedIn)) {
      this.stats.enrichmentStatus.needsEnrichment++;
    }

    if (!hasCoresignalData && !hasEmail && !hasLinkedIn) {
      this.stats.enrichmentStatus.noEnrichmentPossible++;
    }
  }

  /**
   * Generate comprehensive report
   */
  generateReport() {
    console.log('📊 COMPREHENSIVE DATA AUDIT REPORT');
    console.log('===================================');
    console.log(`Total People: ${this.stats.total}`);
    console.log('');

    // Breakdown by buyer group status
    console.log('👥 BREAKDOWN BY BUYER GROUP STATUS:');
    console.log(`   Buyer Group People: ${this.stats.buyerGroup.total} (${this.percentage(this.stats.buyerGroup.total)}%)`);
    console.log(`      With CoreSignal: ${this.stats.buyerGroup.withCoresignal} (${this.percentageOf(this.stats.buyerGroup.withCoresignal, this.stats.buyerGroup.total)}%)`);
    console.log(`      With Enriched Data: ${this.stats.buyerGroup.withEnriched} (${this.percentageOf(this.stats.buyerGroup.withEnriched, this.stats.buyerGroup.total)}%)`);
    console.log(`      With AI Intelligence: ${this.stats.buyerGroup.withAi} (${this.percentageOf(this.stats.buyerGroup.withAi, this.stats.buyerGroup.total)}%)`);
    console.log(`   Non-Buyer Group People: ${this.stats.nonBuyerGroup.total} (${this.percentage(this.stats.nonBuyerGroup.total)}%)`);
    console.log(`      With CoreSignal: ${this.stats.nonBuyerGroup.withCoresignal} (${this.percentageOf(this.stats.nonBuyerGroup.withCoresignal, this.stats.nonBuyerGroup.total)}%)`);
    console.log(`      With Enriched Data: ${this.stats.nonBuyerGroup.withEnriched} (${this.percentageOf(this.stats.nonBuyerGroup.withEnriched, this.stats.nonBuyerGroup.total)}%)`);
    console.log(`      With AI Intelligence: ${this.stats.nonBuyerGroup.withAi} (${this.percentageOf(this.stats.nonBuyerGroup.withAi, this.stats.nonBuyerGroup.total)}%)`);
    console.log('');

    // Basic Info
    console.log('👤 BASIC INFORMATION:');
    console.log(`   First Name: ${this.stats.fields.firstName} (${this.percentage(this.stats.fields.firstName)}%)`);
    console.log(`   Last Name: ${this.stats.fields.lastName} (${this.percentage(this.stats.fields.lastName)}%)`);
    console.log(`   Full Name: ${this.stats.fields.fullName} (${this.percentage(this.stats.fields.fullName)}%)`);
    console.log('');

    // Contact Info
    console.log('📧 CONTACT INFORMATION:');
    console.log(`   Email: ${this.stats.fields.email} (${this.percentage(this.stats.fields.email)}%)`);
    console.log(`   Work Email: ${this.stats.fields.workEmail} (${this.percentage(this.stats.fields.workEmail)}%)`);
    console.log(`   Personal Email: ${this.stats.fields.personalEmail} (${this.percentage(this.stats.fields.personalEmail)}%)`);
    console.log(`   Phone: ${this.stats.fields.phone} (${this.percentage(this.stats.fields.phone)}%)`);
    console.log(`   Mobile Phone: ${this.stats.fields.mobilePhone} (${this.percentage(this.stats.fields.mobilePhone)}%)`);
    console.log(`   Work Phone: ${this.stats.fields.workPhone} (${this.percentage(this.stats.fields.workPhone)}%)`);
    console.log(`   LinkedIn URL: ${this.stats.fields.linkedinUrl} (${this.percentage(this.stats.fields.linkedinUrl)}%)`);
    console.log('');

    // Professional Info
    console.log('💼 PROFESSIONAL INFORMATION:');
    console.log(`   Job Title: ${this.stats.fields.jobTitle} (${this.percentage(this.stats.fields.jobTitle)}%)`);
    console.log(`   Title: ${this.stats.fields.title} (${this.percentage(this.stats.fields.title)}%)`);
    console.log(`   Department: ${this.stats.fields.department} (${this.percentage(this.stats.fields.department)}%)`);
    console.log('');

    // Buyer Group Info
    console.log('🎯 BUYER GROUP INFORMATION:');
    console.log(`   Buyer Group Role: ${this.stats.fields.buyerGroupRole} (${this.percentage(this.stats.fields.buyerGroupRole)}%)`);
    console.log(`   Is Buyer Group Member: ${this.stats.fields.isBuyerGroupMember} (${this.percentage(this.stats.fields.isBuyerGroupMember)}%)`);
    console.log(`   Influence Score: ${this.stats.fields.influenceScore} (${this.percentage(this.stats.fields.influenceScore)}%)`);
    console.log(`   Authority Level: ${this.stats.fields.authorityLevel} (${this.percentage(this.stats.fields.authorityLevel)}%)`);
    console.log('');

    // CoreSignal Data
    console.log('🔍 CORESIGNAL DATA:');
    console.log(`   CoreSignal ID: ${this.stats.fields.coreSignalId} (${this.percentage(this.stats.fields.coreSignalId)}%)`);
    console.log(`   CoreSignal Data (JSON): ${this.stats.fields.coresignalData} (${this.percentage(this.stats.fields.coresignalData)}%)`);
    console.log(`   Custom Fields CoreSignal: ${this.stats.fields.customFieldsCoresignal} (${this.percentage(this.stats.fields.customFieldsCoresignal)}%)`);
    console.log('');

    // Enriched Data
    console.log('✨ ENRICHED DATA:');
    console.log(`   Enriched Data (JSON): ${this.stats.fields.enrichedData} (${this.percentage(this.stats.fields.enrichedData)}%)`);
    console.log(`   AI Intelligence (JSON): ${this.stats.fields.aiIntelligence} (${this.percentage(this.stats.fields.aiIntelligence)}%)`);
    console.log(`   Custom Fields: ${this.stats.fields.customFields} (${this.percentage(this.stats.fields.customFields)}%)`);
    console.log('');

    // Data Quality Summary
    console.log('📈 DATA QUALITY SUMMARY:');
    console.log(`   Excellent: ${this.stats.dataQuality.excellent} (${this.percentage(this.stats.dataQuality.excellent)}%)`);
    console.log(`   Good: ${this.stats.dataQuality.good} (${this.percentage(this.stats.dataQuality.good)}%)`);
    console.log(`   Fair: ${this.stats.dataQuality.fair} (${this.percentage(this.stats.dataQuality.fair)}%)`);
    console.log(`   Poor: ${this.stats.dataQuality.poor} (${this.percentage(this.stats.dataQuality.poor)}%)`);
    console.log('');

    // Enrichment Status
    console.log('🔧 ENRICHMENT STATUS:');
    console.log(`   Buyer Group Enriched: ${this.stats.enrichmentStatus.buyerGroupEnriched} (${this.percentage(this.stats.enrichmentStatus.buyerGroupEnriched)}%)`);
    console.log(`   CoreSignal Enriched: ${this.stats.enrichmentStatus.coresignalEnriched} (${this.percentage(this.stats.enrichmentStatus.coresignalEnriched)}%)`);
    console.log(`   Needs Enrichment: ${this.stats.enrichmentStatus.needsEnrichment} (${this.percentage(this.stats.enrichmentStatus.needsEnrichment)}%)`);
    console.log(`   No Enrichment Possible: ${this.stats.enrichmentStatus.noEnrichmentPossible} (${this.percentage(this.stats.enrichmentStatus.noEnrichmentPossible)}%)`);
    console.log('');

    // Recommendations
    this.generateRecommendations();
  }

  /**
   * Generate recommendations based on audit
   */
  generateRecommendations() {
    console.log('💡 RECOMMENDATIONS:');
    console.log('===================');

    const total = this.stats.total;
    const missingEmail = total - this.stats.fields.email - this.stats.fields.workEmail;
    const missingLinkedIn = total - this.stats.fields.linkedinUrl;
    const missingCoresignal = total - this.stats.fields.coresignalData;
    const missingTitle = total - this.stats.fields.jobTitle - this.stats.fields.title;
    const needsEnrichment = this.stats.enrichmentStatus.needsEnrichment;

    if (missingEmail > 0) {
      console.log(`⚠️  ${missingEmail} people missing email addresses`);
      console.log(`   → Consider enriching with CoreSignal email search`);
    }

    if (missingLinkedIn > 0) {
      console.log(`⚠️  ${missingLinkedIn} people missing LinkedIn URLs`);
      console.log(`   → Consider enriching with CoreSignal LinkedIn search`);
    }

    if (missingCoresignal > 0) {
      console.log(`⚠️  ${missingCoresignal} people missing CoreSignal data`);
      console.log(`   → These people need CoreSignal enrichment via search + collect`);
    }

    if (missingTitle > 0) {
      console.log(`⚠️  ${missingTitle} people missing job titles`);
      console.log(`   → Consider enriching with CoreSignal title data`);
    }

    if (needsEnrichment > 0) {
      console.log(`\n🎯 PRIORITY: ${needsEnrichment} people need CoreSignal enrichment`);
      console.log(`   → These people have email or LinkedIn but no CoreSignal data`);
      console.log(`   → Run: node scripts/enrich-top-original-people-coresignal.js`);
    }

    if (this.stats.dataQuality.poor > 0) {
      console.log(`⚠️  ${this.stats.dataQuality.poor} people have poor data quality`);
      console.log(`   → These people need comprehensive enrichment`);
    }

    // Check buyer group vs non-buyer group enrichment
    const buyerGroupEnrichmentRate = this.stats.buyerGroup.total > 0 
      ? (this.stats.buyerGroup.withCoresignal / this.stats.buyerGroup.total * 100).toFixed(1)
      : 0;
    const nonBuyerGroupEnrichmentRate = this.stats.nonBuyerGroup.total > 0
      ? (this.stats.nonBuyerGroup.withCoresignal / this.stats.nonBuyerGroup.total * 100).toFixed(1)
      : 0;

    console.log(`\n📊 ENRICHMENT COMPARISON:`);
    console.log(`   Buyer Group People: ${buyerGroupEnrichmentRate}% have CoreSignal data`);
    console.log(`   Non-Buyer Group People: ${nonBuyerGroupEnrichmentRate}% have CoreSignal data`);

    console.log('');
  }

  /**
   * Calculate percentage
   */
  percentage(count) {
    if (this.stats.total === 0) return 0;
    return Math.round((count / this.stats.total) * 100);
  }

  /**
   * Calculate percentage of subset
   */
  percentageOf(count, total) {
    if (total === 0) return 0;
    return Math.round((count / total) * 100);
  }
}

// Run the audit
async function main() {
  const auditor = new AuditAllTopPeople();
  await auditor.audit();
}

if (require.main === module) {
  main().catch(console.error);
}

module.exports = AuditAllTopPeople;

