#!/usr/bin/env node

/**
 * 📊 AUDIT BUYER GROUP PEOPLE DATA
 * 
 * Audits data completeness for people enriched via buyer group pipeline
 * in TOP Engineering Plus workspace.
 * 
 * Checks:
 * - Standard database fields (name, email, phone, title, etc.)
 * - CoreSignal data (coresignalData JSON field)
 * - Enriched data (enrichedData JSON field)
 * - Custom fields (customFields JSON field)
 * - AI intelligence (aiIntelligence JSON field)
 * - Contact information completeness
 * - Professional data completeness
 */

require('dotenv').config();
const { PrismaClient } = require('@prisma/client');

class AuditBuyerGroupPeopleData {
  constructor() {
    this.prisma = new PrismaClient();
    this.workspaceId = '01K75ZD7DWHG1XF16HAF2YVKCK'; // TOP Engineering Plus workspace
    this.stats = {
      total: 0,
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
      }
    };
  }

  async audit() {
    try {
      console.log('📊 AUDITING BUYER GROUP PEOPLE DATA');
      console.log('===================================');
      console.log(`📊 Workspace ID: ${this.workspaceId}`);
      console.log('');

      // Find all people enriched via buyer group pipeline
      const buyerGroupPeople = await this.findBuyerGroupPeople();

      console.log(`📋 Found ${buyerGroupPeople.length} people enriched via buyer group pipeline`);
      console.log('');

      if (buyerGroupPeople.length === 0) {
        console.log('⚠️  No buyer group people found');
        return;
      }

      // Audit each person
      for (const person of buyerGroupPeople) {
        this.auditPerson(person);
      }

      // Generate report
      this.generateReport();

    } catch (error) {
      console.error('❌ ERROR:', error.message);
      throw error;
    } finally {
      await this.prisma.$disconnect();
    }
  }

  /**
   * Find people enriched via buyer group pipeline
   */
  async findBuyerGroupPeople() {
    return await this.prisma.people.findMany({
      where: {
        workspaceId: this.workspaceId,
        deletedAt: null,
        OR: [
          { buyerGroupRole: { not: null } },
          { isBuyerGroupMember: true }
        ]
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
    if (person.coresignalData) {
      const coresignalData = typeof person.coresignalData === 'object' 
        ? person.coresignalData 
        : JSON.parse(person.coresignalData || '{}');
      
      if (coresignalData && Object.keys(coresignalData).length > 0) {
        this.stats.fields.coresignalData++;
      }
    }

    // Enriched Data
    if (person.enrichedData) {
      const enrichedData = typeof person.enrichedData === 'object'
        ? person.enrichedData
        : JSON.parse(person.enrichedData || '{}');
      
      if (enrichedData && Object.keys(enrichedData).length > 0) {
        this.stats.fields.enrichedData++;
      }
    }

    // AI Intelligence
    if (person.aiIntelligence) {
      const aiIntelligence = typeof person.aiIntelligence === 'object'
        ? person.aiIntelligence
        : JSON.parse(person.aiIntelligence || '{}');
      
      if (aiIntelligence && Object.keys(aiIntelligence).length > 0) {
        this.stats.fields.aiIntelligence++;
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
    const hasEnrichedData = person.enrichedData &&
      typeof person.enrichedData === 'object' &&
      Object.keys(person.enrichedData).length > 0;

    // Excellent: Has email, LinkedIn, title, and CoreSignal data
    if (hasEmail && hasLinkedIn && hasTitle && hasCoresignalData) {
      this.stats.dataQuality.excellent++;
      return;
    }

    // Good: Has email OR LinkedIn, title, and some CoreSignal/enriched data
    if ((hasEmail || hasLinkedIn) && hasTitle && (hasCoresignalData || hasEnrichedData)) {
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
   * Generate comprehensive report
   */
  generateReport() {
    console.log('📊 DATA COMPLETENESS REPORT');
    console.log('===========================');
    console.log(`Total People: ${this.stats.total}`);
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

    if (this.stats.dataQuality.poor > 0) {
      console.log(`⚠️  ${this.stats.dataQuality.poor} people have poor data quality`);
      console.log(`   → These people need comprehensive enrichment`);
    }

    // Check if CoreSignal data is in customFields vs coresignalData
    const coresignalInCustomFields = this.stats.fields.customFieldsCoresignal;
    const coresignalInMainField = this.stats.fields.coresignalData;
    
    if (coresignalInCustomFields > coresignalInMainField) {
      console.log(`ℹ️  CoreSignal data is primarily in customFields (${coresignalInCustomFields}) vs coresignalData field (${coresignalInMainField})`);
      console.log(`   → Consider standardizing data storage location`);
    }

    console.log('');
  }

  /**
   * Calculate percentage
   */
  percentage(count) {
    if (this.stats.total === 0) return 0;
    return Math.round((count / this.stats.total) * 100);
  }
}

// Run the audit
async function main() {
  const auditor = new AuditBuyerGroupPeopleData();
  await auditor.audit();
}

if (require.main === module) {
  main().catch(console.error);
}

module.exports = AuditBuyerGroupPeopleData;

